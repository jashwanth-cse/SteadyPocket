/**
 * Firebase Configuration — SteadyPocket
 * ⚠️  All secrets come from .env (EXPO_PUBLIC_ prefix required by Expo).
 *     Copy .env.example → .env and fill in real values before running.
 */

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// If the env vars are missing (e.g., Metro not restarted after creating .env),
// fail loudly rather than sending undefined credentials to Firebase and getting INVALID_APP_CREDENTIAL.
if (!firebaseConfig.apiKey) {
  console.error(
    "🔥 FIREBASE CONFIG ERROR: EXPO_PUBLIC_FIREBASE_API_KEY is undefined!\\n" +
    "Restart your Metro bundler with 'npm start -- --clear' so it can read the new .env file."
  );
}

// Prevent duplicate initialization across hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// initializeAuth with try/catch — getAuth() is the safe fallback on re-init
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, { persistence: inMemoryPersistence });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;


