/**
 * firebase.native.ts — NATIVE version (iOS + Android)
 * Metro picks this file instead of firebase.ts on native builds.
 * Uses getReactNativePersistence(AsyncStorage) so auth survives app restarts.
 */
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('🔥 Firebase config missing — run: npm start -- --clear');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: ReturnType<typeof getAuth>;
try {
  // getReactNativePersistence → stored in AsyncStorage → survives app restarts
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app); // already initialized (hot reload)
}

export { auth };
export const db = getFirestore(app);
export default app;
