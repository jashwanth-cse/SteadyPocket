/**
 * Root Layout — SteadyPocket
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-grade auth routing:
 *
 *  On every app launch / page refresh:
 *  1. Wait for Firebase to restore auth state (onAuthStateChanged fires once)
 *  2. No user  →  /phone-auth
 *  3. User exists, check Firestore verification_status:
 *     - null / not found   → /phone-auth   (fresh install, DB not set up yet)
 *     - 'pending'          → /swiggy-id-upload
 *     - 'kyc_complete'     → /selfie-verification
 *     - 'selfie_complete'  → /govt-id-verification
 *     - 'fully_verified'   → /dashboard  (or index for now)
 *
 *  Phone auth is only shown again if:
 *   - Firebase session expires (token rotation)
 *   - User clears browser localStorage (web) or app data (native)
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getVerificationStatus, VerificationStatus } from '../services/authService';

// ── Route map by verification status ─────────────────────────────────────────
const STATUS_ROUTE: Record<VerificationStatus, string> = {
  pending:        '/swiggy-id-upload',
  kyc_complete:   '/selfie-verification',
  selfie_complete:'/govt-id-verification',
  fully_verified: '/dashboard',
};

type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

export default function RootLayout() {
  const router  = useRouter();
  const segments = useSegments();
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    // onAuthStateChanged fires once on mount with the restored user (from localStorage)
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setAuthState('unauthenticated');
        return;
      }

      try {
        const status = await getVerificationStatus(user.uid);

        if (!status) {
          // User exists in Firebase Auth but not in Firestore yet
          // (edge case: old account before Firestore was set up)
          setAuthState('unauthenticated');
          return;
        }

        const targetRoute = STATUS_ROUTE[status] ?? '/swiggy-id-upload';
        setAuthState('authenticated');

        // Only redirect if we're not already on the right screen
        const currentRoute = '/' + (segments.join('/') || '');
        if (currentRoute !== targetRoute) {
          router.replace(targetRoute as any);
        }
      } catch (err) {
        console.error('[Layout] Failed to check verification status:', err);
        // On network error, still allow the user through — don't lock them out
        setAuthState('unauthenticated');
      }
    });

    return unsubscribe;
  }, []);

// Routing effect: when authState changes to unauthenticated → send to phone-auth
  useEffect(() => {
    if (authState === 'unauthenticated') {
      router.replace('/phone-auth');
    }
  }, [authState]);

  if (authState === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#0B57D0" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
          <Stack.Screen name="index"                />
          <Stack.Screen name="splash"               />
          <Stack.Screen name="app-tour"             />
          <Stack.Screen name="phone-auth"           />
          <Stack.Screen name="swiggy-id-upload"     />
          <Stack.Screen name="selfie-verification"  />
          <Stack.Screen name="govt-id-verification" />
          <Stack.Screen name="dashboard"            />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  splash:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
});
