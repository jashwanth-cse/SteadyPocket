/**
 * Auth Service — SteadyPocket
 */

import {
  signInWithPhoneNumber,
  ApplicationVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// ─── Mock ApplicationVerifier (for Firebase test phone numbers) ────────────────
// Must implement Firebase's internal methods (_reset, clear, render) in addition
// to the public ApplicationVerifier interface, or you get "_reset is not a function"
class MockRecaptchaVerifier implements ApplicationVerifier {
  readonly type = 'recaptcha';

  // Public interface
  verify(): Promise<string> {
    return Promise.resolve('mock-recaptcha-token');
  }

  // Internal Firebase methods called during phone auth flow
  _reset(): void {
    // no-op — called by Firebase after sending SMS
  }

  clear(): void {
    // no-op — called by Firebase to destroy the widget
  }

  render(): Promise<number> {
    // no-op — called by Firebase to mount the widget; returns widget ID
    return Promise.resolve(0);
  }
}

export const mockVerifier = new MockRecaptchaVerifier();

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export async function sendOTP(
  phoneNumber: string,
  verifier: ApplicationVerifier = mockVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyOTP(confirmation: ConfirmationResult, code: string) {
  return confirmation.confirm(code);
}

// ─── Save User to Firestore ───────────────────────────────────────────────────
export async function saveUserToFirestore(uid: string, phone: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    {
      user_id: uid,
      phone,
      phone_verified: true,
      verification_status: 'pending',
      created_at: serverTimestamp(),
    },
    { merge: true }
  );
}
