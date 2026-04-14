/**
 * Auth Service — SteadyPocket
 *
 * Verification status flow:
 *   pending → kyc_complete → selfie_complete → fully_verified
 */

import {
  signInWithPhoneNumber,
  ApplicationVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { detectMockLocation } from '../utils/deviceSecurityCheck';
import { createFraudAlert, hasAlertBeenShownToday, markAlertShownToday } from './fraudService';
import { showWarning } from '../components/Toast';

export type VerificationStatus =
  | 'pending'
  | 'kyc_complete'
  | 'selfie_complete'
  | 'fully_verified';

// ─── Mock Verifier (for Firebase test phone numbers) ─────────────────────────
class MockRecaptchaVerifier implements ApplicationVerifier {
  readonly type = 'recaptcha';
  verify(): Promise<string>  { return Promise.resolve('mock-recaptcha-token'); }
  _reset(): void  {}
  clear(): void   {}
  render(): Promise<number> { return Promise.resolve(0); }
}
export const mockVerifier = new MockRecaptchaVerifier();

// ─── Check if phone exists in users collection ────────────────────────────────
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);
    console.log(`[Auth] Phone check for ${phone}: ${!snap.empty ? 'EXISTS' : 'NOT FOUND'}`);
    return !snap.empty;
  } catch (error) {
    console.error('Error checking phone existence:', error);
    // Fail open - allow OTP to proceed even if check fails
    // Better UX: let Firebase auth handle non-existent numbers
    return true;
  }
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export async function sendOTP(
  phoneNumber: string,
  verifier: ApplicationVerifier = mockVerifier
): Promise<ConfirmationResult> {
  console.log(`[Auth] Sending OTP to ${phoneNumber} using ${verifier === mockVerifier ? 'MOCK' : 'PROVIDED'} verifier`);
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyOTP(confirmation: ConfirmationResult, code: string) {
  return confirmation.confirm(code);
}

// ─── Save / init user in Firestore ───────────────────────────────────────────
// Only updates existing seeded user data with auth info (no new account creation)
export async function saveUserToFirestore(uid: string, phone: string): Promise<{docId: string}> {
  try {
    // Check if phone exists in users collection (from seeded data)
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Phone found in seeded data - update that document with auth info
      const docRef = snap.docs[0].ref;
      const docId = snap.docs[0].id;
      const seededData = snap.docs[0].data();

      await setDoc(
        docRef,
        {
          ...seededData,
          auth_uid:            uid,
          phone_verified:      true,
          // PRESERVE existing verification_status if present, only set to 'pending' for new users
          verification_status: seededData.verification_status || 'pending',
          // Keep created_at from seeded data if exists
          created_at:          seededData.created_at || serverTimestamp(),
        },
        { merge: true }
      );

      return { docId };
    } else {
      // Phone not found - throw error
      throw new Error('Phone number not found in registered users. Please contact support.');
    }
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
}

// ─── Get user document ID by auth UID ─────────────────────────────────────────
export async function getUserDocIdByAuthUid(authUid: string): Promise<string | null> {
  try {
    const q = query(collection(db, 'users'), where('auth_uid', '==', authUid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting user doc ID:', error);
    return null;
  }
}

// ─── Get verification status (corrected) ──────────────────────────────────────
export async function getVerificationStatus(
  uid: string
): Promise<VerificationStatus | null> {
  try {
    // uid here is Firebase Auth UID
    // First find the document ID by auth_uid
    const docId = await getUserDocIdByAuthUid(uid);
    if (!docId) return null;

    const snap = await getDoc(doc(db, 'users', docId));
    if (!snap.exists()) return null;
    return (snap.data()?.verification_status as VerificationStatus) ?? null;
  } catch (error) {
    console.error('Error getting verification status:', error);
    return null;
  }
}

// ─── Update verification status (corrected) ──────────────────────────────────
export async function updateVerificationStatus(
  uid: string,
  status: VerificationStatus
): Promise<void> {
  try {
    // uid here is Firebase Auth UID
    // Find the actual document ID by auth_uid
    const docId = await getUserDocIdByAuthUid(uid);
    if (!docId) {
      throw new Error('User document not found');
    }

    await setDoc(
      doc(db, 'users', docId),
      {
        verification_status: status,
        [`${status}_at`]: serverTimestamp(),
        // Also update auth_uid to ensure it's linked
        auth_uid: uid,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating verification status:', error);
    throw error;
  }
}

// ─── Session Management: Store login timestamp (corrected) ────────────────────
export async function storeLoginTimestamp(uid: string): Promise<void> {
  try {
    // uid here is Firebase Auth UID
    const docId = await getUserDocIdByAuthUid(uid);
    if (!docId) {
      console.warn('User document not found for storing login timestamp');
      return;
    }

    await updateDoc(doc(db, 'users', docId), {
      last_login: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error storing login timestamp:', error);
  }
}

// ─── Check if session has expired (> 1 day inactive) (corrected) ──────────────
export async function isSessionExpired(uid: string): Promise<boolean> {
  try {
    // uid here is Firebase Auth UID
    const docId = await getUserDocIdByAuthUid(uid);
    if (!docId) return true;

    const userDoc = await getDoc(doc(db, 'users', docId));
    if (!userDoc.exists()) return true;

    const lastLogin = userDoc.data()?.last_login;
    if (!lastLogin) return false; // No login timestamp means first login, not expired

    const lastLoginTime = lastLogin.toDate ? lastLogin.toDate().getTime() : lastLogin;
    const currentTime = new Date().getTime();
    const diffInHours = (currentTime - lastLoginTime) / (1000 * 60 * 60);

    // 24 hours = 1 day
    return diffInHours > 24;
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return false; // Default to NOT expired to not block users on network errors
  }
}

// ─── Post-Login Fraud Detection (async, non-blocking) ─────────────────────────
/**
 * Trigger device security check after successful login
 * This runs asynchronously and never interrupts the login flow
 *
 * Process:
 * 1. Debounce for 300ms to allow navigation UI to settle
 * 2. Check session: skip if already alerted today
 * 3. Detect mock location on device
 * 4. If found: create Firestore alert + show warning toast
 * 5. Gracefully handle all errors (never crash)
 *
 * @param uid Firebase Auth UID (available after OTP verification)
 */
export async function triggerPostLoginFraudCheck(uid: string): Promise<void> {
  // Defer execution to allow navigation UI to settle
  // This ensures fraud check doesn't block the OTP verification or router.replace()
  setTimeout(async () => {
    try {
      // Check if alert was already shown today (session deduplication)
      const hasShown = await hasAlertBeenShownToday(uid);
      if (hasShown) {
        console.log('[FraudCheck] Alert already shown today, skipping');
        return;
      }

      // Detect mock location on device
      const result = await detectMockLocation(uid);

      if (result.isMockLocation) {
        // Create fraud alert in Firestore (user-scoped collection)
        const { alertId } = await createFraudAlert(uid, {
          alert_type: 'gps_spoofing',
          risk_score: result.riskScore,
          status: 'action_required',
          detection_method: result.detectionMethod,
        });

        // Mark as shown today to prevent duplicate alerts
        await markAlertShownToday(uid);

        // Show non-blocking warning toast to user
        showWarning(
          '⚠️ We detected unusual location activity on your account. ' +
          'For security, please verify your location in settings.',
          5000
        );

        console.log('[FraudCheck] Mock location detected, alert created:', {
          alertId,
          uid,
          riskScore: result.riskScore,
        });
      }
    } catch (err) {
      // Silent failure - never interrupt login flow
      console.error('[FraudCheck] Post-login detection failed:', err);
      // App continues normally even if fraud check fails
    }
  }, 300); // 300ms debounce ensures navigation completes first
}

