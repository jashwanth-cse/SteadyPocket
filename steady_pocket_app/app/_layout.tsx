/**
 * Root Layout — SteadyPocket
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-grade app flow:
 *
 *  On every app launch:
 *  1. Show splash screen for 2.5 seconds (always)
 *  2. Check if first-time user (AsyncStorage flag)
 *     - First time → show app-tour, set flag
 *     - Not first time → skip to auth flow
 *  3. Wait for Firebase to restore auth state (onAuthStateChanged)
 *  4. No user  →  /phone-auth
 *  5. User exists, check Firestore verification_status:
 *     - null / not found   → /phone-auth
 *     - 'pending'          → /swiggy-id-upload
 *     - 'kyc_complete'     → /dashboard (with 24h session check)
 *     - 'selfie_complete'  → /govt-id-verification
 *     - 'fully_verified'   → /dashboard
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { getVerificationStatus, VerificationStatus, isSessionExpired } from '../services/authService';

// ── Route map by verification status ─────────────────────────────────────────
const STATUS_ROUTE: Record<VerificationStatus, string> = {
  pending:        '/swiggy-id-upload',
  kyc_complete:   '/dashboard',
  selfie_complete:'/govt-id-verification',
  fully_verified: '/dashboard',
};

type AppState = 'splash' | 'loading-first-time' | 'app-tour' | 'auth-check' | 'authenticated' | 'unauthenticated';

const FIRST_TIME_FLAG = 'STEADY_POCKET_FIRST_TIME';

export default function RootLayout() {
  const router  = useRouter();
  const segments = useSegments();
  const [appState, setAppState] = useState<AppState>('splash');

  // ──── PHASE 1: Check first time user & handle app flow ────────────────────
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if first time user
        const hasVisited = await AsyncStorage.getItem(FIRST_TIME_FLAG);

        if (hasVisited) {
          // Not first time → go directly to auth check
          setAppState('auth-check');
        } else {
          // First time → show app tour after splash
          // Set the flag so next launches skip the tour
          await AsyncStorage.setItem(FIRST_TIME_FLAG, 'true');
          setAppState('app-tour');
        }
      } catch (err) {
        console.error('[Layout] Error checking first-time flag:', err);
        // On error, skip to auth check
        setAppState('auth-check');
      }
    };

    // Start after splash screen timeout (2.5 seconds)
    const splashTimer = setTimeout(() => {
      initializeApp();
    }, 2500);

    return () => clearTimeout(splashTimer);
  }, []);

  // ──── PHASE 2: Check authentication state (only after tour/init) ──────────
  useEffect(() => {
    if (appState !== 'auth-check') {
      return; // Don't start auth check yet
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setAppState('unauthenticated');
        return;
      }

      try {
        const status = await getVerificationStatus(user.uid);

        if (!status) {
          // User exists in Firebase Auth but not in Firestore yet
          setAppState('unauthenticated');
          return;
        }

        // If user is kyc_complete (fully verified), check if session has expired
        if (status === 'kyc_complete') {
          const sessionExpired = await isSessionExpired(user.uid);
          if (sessionExpired) {
            // Session expired - require re-verification
            setAppState('unauthenticated');
            return;
          }
        }

        const targetRoute = STATUS_ROUTE[status] ?? '/swiggy-id-upload';
        setAppState('authenticated');

        // Only redirect if we're not already on the right screen
        const currentRoute = '/' + (segments.join('/') || '');
        if (currentRoute !== targetRoute) {
          router.replace(targetRoute as any);
        }
      } catch (err) {
        console.error('[Layout] Failed to check verification status:', err);
        setAppState('unauthenticated');
      }
    });

    return unsubscribe;
  }, [appState]);

  // ──── PHASE 3: Navigation effects ─────────────────────────────────────────
  useEffect(() => {
    if (appState === 'unauthenticated') {
      router.replace('/phone-auth');
    }
  }, [appState]);

  // ──── Render splash screen ────────────────────────────────────────────────
  if (appState === 'splash' || appState === 'loading-first-time') {
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
