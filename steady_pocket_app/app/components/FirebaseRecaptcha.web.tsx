/**
 * FirebaseRecaptcha.web.tsx — Invisible reCAPTCHA for web
 *
 * APPROACH: Invisible reCAPTCHA v2 (size: 'invisible')
 * - No visible checkbox widget shown to the user
 * - Verification is triggered programmatically by the Send OTP button
 * - Firebase auto-verifies in background for trusted browsers
 * - Challenge popup shown ONLY if risk score is too low (rare)
 *
 * IMPORTANT: Requires localhost/127.0.0.1 to be in Firebase Console
 * → Authentication → Settings → Authorized domains
 */
import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../services/firebase';

export interface FirebaseRecaptchaRef {
  applicationVerifier: RecaptchaVerifier | null;
  verify: () => Promise<string>;
  reset: () => void;
}

interface Props {
  baseUrl?: string;
}

const FirebaseRecaptcha = forwardRef<FirebaseRecaptchaRef, Props>((_, ref) => {
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const initVerifier = () => {
    if (verifierRef.current) return;
    try {
      verifierRef.current = new RecaptchaVerifier(auth, 'firebase-recaptcha-anchor', {
        // 'invisible' = no widget shown — verification happens silently in background
        // Challenge popup appears automatically only if Google's risk engine requires it
        size: 'invisible',
        callback: () => {
          // Token ready — signInWithPhoneNumber will pick it up automatically
        },
        'expired-callback': () => {
          // Token expired — reset so it re-fires on next attempt
          verifierRef.current?.clear();
          verifierRef.current = null;
          initVerifier();
        },
      });
    } catch (e) {
      console.error('[FirebaseRecaptcha] init error:', e);
    }
  };

  useEffect(() => {
    initVerifier();
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    get applicationVerifier() {
      return verifierRef.current;
    },
    verify: async () => {
      if (!verifierRef.current) throw new Error('reCAPTCHA not initialized');
      return verifierRef.current.verify();
    },
    reset: () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
      initVerifier();
    },
  }));

  // Hidden anchor point — invisible reCAPTCHA only needs a DOM node to attach to
  // nativeID maps to id="firebase-recaptcha-anchor" in the web DOM
  return <View nativeID="firebase-recaptcha-anchor" style={{ width: 0, height: 0 }} />;
});

export default FirebaseRecaptcha;
