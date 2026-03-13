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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

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

// ─── Save / init user in Firestore ───────────────────────────────────────────
// Uses merge:true so it never overwrites existing verification progress
export async function saveUserToFirestore(uid: string, phone: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    {
      user_id:   uid,
      phone,
      phone_verified:      true,
      verification_status: 'pending',
      created_at:          serverTimestamp(),
    },
    { merge: true }          // ← preserves existing verification_status
  );
}

// ─── Get verification status ──────────────────────────────────────────────────
export async function getVerificationStatus(
  uid: string
): Promise<VerificationStatus | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return (snap.data()?.verification_status as VerificationStatus) ?? null;
}

// ─── Update verification status ───────────────────────────────────────────────
export async function updateVerificationStatus(
  uid: string,
  status: VerificationStatus
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { verification_status: status, [`${status}_at`]: serverTimestamp() },
    { merge: true }
  );
}
