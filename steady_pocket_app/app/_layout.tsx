/**
 * Root Layout — SteadyPocket
 * -------------------------------------------------------------
 * Launch Flow
 *
 * 1. Always show Splash screen (3s)
 * 2. Check first-time user
 *    - first time → /app-tour
 *    - otherwise → auth check
 * 3. Firebase restores auth
 * 4. No user → /phone-auth
 * 5. User exists → check verification status
 */

import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged, User } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../services/firebase";
import {
  getVerificationStatus,
  VerificationStatus,
  isSessionExpired,
} from "../services/authService";
import { ToastProvider } from "../components/Toast";
import { ModalProvider } from "../components/ModalProvider";
import SplashScreen from "./screens/SplashScreen";

/* -------------------------------------------------------------------------- */
/* Route map */
/* -------------------------------------------------------------------------- */

const STATUS_ROUTE: Record<VerificationStatus, string> = {
  pending: "/swiggy-id-upload",
  kyc_complete: "/dashboard",
  selfie_complete: "/govt-id-verification",
  fully_verified: "/dashboard",
};

type AppState =
  | "splash"
  | "app-tour"
  | "auth-check"
  | "authenticated"
  | "unauthenticated";

const FIRST_TIME_FLAG = "STEADY_POCKET_FIRST_TIME";

/* -------------------------------------------------------------------------- */
/* Root Layout */
/* -------------------------------------------------------------------------- */

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const [appState, setAppState] = useState<AppState>("splash");
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* PHASE 1 — Authentication & Initialization */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      try {
        const hasVisited = await AsyncStorage.getItem(FIRST_TIME_FLAG);

        if (!hasVisited) {
          await AsyncStorage.setItem(FIRST_TIME_FLAG, "true");
          setAppState("app-tour");
          return;
        }

        if (!user) {
          setAppState("unauthenticated");
          return;
        }

        // User is logged in, check verification status
        const status = await getVerificationStatus(user.uid);

        if (!status) {
          // Authenticated but Firestore doc not linked yet (e.g. Firestore write still in-flight
          // right after OTP verification). Route to onboarding start as a safe default rather
          // than kicking an authenticated user back to /phone-auth.
          setTargetRoute("/swiggy-id-upload");
          setAppState("authenticated");
        } else {
          if (status === "kyc_complete") {
            const expired = await isSessionExpired(user.uid);
            if (expired) {
              setAppState("unauthenticated");
              return;
            }
          }

          setTargetRoute(STATUS_ROUTE[status] || "/swiggy-id-upload");
          setAppState("authenticated");
        }
      } catch (err) {
        console.error("[Layout] Init failed:", err);
        setAppState("unauthenticated");
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* PHASE 2 — Fallback Navigation (Unauthenticated/Tour) */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isReady || !rootNavigationState?.key) return;

    const currentRoute = "/" + segments.join("/");

    if (appState === "app-tour") {
      // Only redirect to the tour when still on a pre-tour route.
      // If the user already completed the tour and navigated away (e.g. to /phone-auth),
      // a segments change must NOT bounce them back.
      if (currentRoute === "/" || currentRoute === "/splash" || currentRoute === "/app-tour") {
        router.replace("/app-tour");
      }
    } else if (appState === "unauthenticated") {
      router.replace("/phone-auth");
    } else if (appState === "authenticated" && targetRoute) {
      if (currentRoute === "/" || currentRoute === "/splash" || currentRoute === "/phone-auth") {
        router.replace(targetRoute as any);
      }
    }
  }, [appState, isReady, targetRoute, segments, rootNavigationState?.key]);

  /* ---------------------------------------------------------------------- */
  /* Router Layout with Splash Overlay */
  /* ---------------------------------------------------------------------- */

  /* ---------------------------------------------------------------------- */
  /* Router Layout with Splash Overlay */
  /* ---------------------------------------------------------------------- */

  if (!isReady) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <SplashScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ToastProvider>
          <ModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#FFFFFF" },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="app-tour" />
              <Stack.Screen name="phone-auth" />
              <Stack.Screen name="swiggy-id-upload" />
              <Stack.Screen name="selfie-verification" />
              <Stack.Screen name="govt-id-verification" />
              <Stack.Screen name="premium-payment" />
              <Stack.Screen name="dashboard" />
            </Stack>
          </ModalProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});