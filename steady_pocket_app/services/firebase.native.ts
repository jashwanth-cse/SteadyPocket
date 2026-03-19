/**
 * firebase.native.ts — NATIVE version (iOS + Android)
 * Metro picks this file instead of firebase.ts on native builds.
 * Uses persistent auth with AsyncStorage on React Native.
 */
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
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

let auth: any;
try {
  // Custom persistence implementation for React Native
  const persistenceImp: any = {
    type: 'SESSION',
    getItem: async (key: string) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (e) {
        // Fail silently
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        // Fail silently
      }
    },
  };

  auth = initializeAuth(app, {
    persistence: [persistenceImp],
  });
} catch (error) {
  // Already initialized or error during initialization
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;


