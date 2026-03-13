/**
 * FirebaseRecaptcha.web.tsx
 *
 * Mirrors EXACTLY the working test-recaptcha.html approach:
 *   1. RecaptchaVerifier with size: 'normal' (visible v2 checkbox — NOT invisible/Enterprise)
 *   2. render() called immediately on mount to show the widget
 *   3. verifier stored in ref and passed directly to signInWithPhoneNumber
 *
 * DO NOT change size to 'invisible' — that triggers reCAPTCHA Enterprise
 * which sends captchaResponse: "NO_RECAPTCHA" → INVALID_APP_CREDENTIAL.
 */
import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
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

  useEffect(() => {
    // Initialize and render exactly like test-recaptcha.html
    if (verifierRef.current) return;
    try {
      verifierRef.current = new RecaptchaVerifier(auth, 'firebase-recaptcha-widget', {
        // 'normal' = visible v2 checkbox widget — the ONLY mode that doesn't trigger Enterprise
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved — Firebase will use this token when signInWithPhoneNumber is called
        },
        'expired-callback': () => {
          verifierRef.current?.render();
        },
      });

      // Render the widget immediately, exactly like test-recaptcha.html
      verifierRef.current.render().catch((e) => {
        console.error('[FirebaseRecaptcha] render error:', e);
      });
    } catch (e) {
      console.error('[FirebaseRecaptcha] init error:', e);
    }

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
    },
  }));

  // Render a visible container — RecaptchaVerifier mounts the Google widget inside this div
  return (
    <View style={styles.container}>
      <View nativeID="firebase-recaptcha-widget" style={styles.widget} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  widget: {
    // Let the Google reCAPTCHA iframe define its own size
    width: 304,
    height: 78,
  },
});

export default FirebaseRecaptcha;
