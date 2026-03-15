import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ConfirmationResult } from 'firebase/auth';

import FirebaseRecaptcha, { FirebaseRecaptchaRef } from '../components/FirebaseRecaptcha';
import app from '../../services/firebase';

import { sendOTP, verifyOTP, saveUserToFirestore, checkPhoneExists, storeLoginTimestamp, isSessionExpired, getVerificationStatus, type VerificationStatus } from '../../services/authService';
import { APP_NAME } from '../../services/constants';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../theme';

const INDIA_PREFIX = '+91';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const recaptchaRef = useRef<FirebaseRecaptchaRef>(null);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Auto-focus OTP ────────────────────────────────────────────────────────
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ─── Auto-verify OTP ───────────────────────────────────────────────────────
  useEffect(() => {
    if (step === 'otp') {
      const code = otp.join('');
      if (code.length === 6 && !loading) {
        handleVerifyOTP(code);
      }
    }
  }, [otp]);

  // ─── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const fullPhone = `${INDIA_PREFIX}${digits}`;

      // Check if phone exists in registered users
      const phoneExists = await checkPhoneExists(fullPhone);
      if (!phoneExists) {
        setError('This number is not registered as a Swiggy/Zomato delivery partner. Please use the number you signed up with.');
        setLoading(false);
        return;
      }

      let verifier: any = undefined;
      const refAny = recaptchaRef.current as any;
      if (refAny?.applicationVerifier) {
        verifier = refAny.applicationVerifier;
      } else {
        verifier = {
          type: 'recaptcha',
          verify: () => recaptchaRef.current?.verify() || Promise.reject(new Error('Recaptcha not initialized')),
          _reset: () => recaptchaRef.current?.reset(),
          clear: () => recaptchaRef.current?.reset(),
          render: () => Promise.resolve(0),
        };
      }

      const result = await sendOTP(fullPhone, verifier);
      setConfirmationResult(result);
      setStep('otp');
      startResendTimer();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const credential = await verifyOTP(confirmationResult!, code);
      const uid = credential.user.uid;
      const fullPhone = `${INDIA_PREFIX}${phone}`;
      await saveUserToFirestore(uid, fullPhone);

      // Store login timestamp for session management
      await storeLoginTimestamp(uid);

      // Check verification status and redirect accordingly
      const status = await getVerificationStatus(uid);
      const STATUS_ROUTE: Record<VerificationStatus, string> = {
        pending:        '/swiggy-id-upload',
        kyc_complete:   '/dashboard',
        selfie_complete:'/govt-id-verification',
        fully_verified: '/dashboard',
      };
      const targetRoute = STATUS_ROUTE[status as VerificationStatus] ?? '/swiggy-id-upload';
      router.replace(targetRoute as any);
    } catch (e: any) {
      setError('Invalid code. Please check and try again.');
      setOtp(['', '', '', '', '', '']); // Clear on error
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend timer ──────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    await handleSendOTP();
  };

  // ─── OTP box input ─────────────────────────────────────────────────────────
  const handleOtpChange = (val: string, index: number) => {
    const updated = [...otp];
    updated[index] = val.slice(-1);
    setOtp(updated);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const updated = [...otp];
      updated[index - 1] = '';
      setOtp(updated);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={COMPONENTS.screen} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[COMPONENTS.contentPad, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>SteadyPocket</Text>
            </View>
            <Text style={TYPOGRAPHY.titleLarge}>
              {step === 'phone' ? 'Sign in' : 'Verify your identity'}
            </Text>
            <Text style={TYPOGRAPHY.body}>
              {step === 'phone'
                ? "Enter your mobile number you have used to signup to your Swiggy/Zomato delivery app."
                : `We've sent a 6-digit code to\n${INDIA_PREFIX} ${phone}`}
            </Text>
          </View>

          {/* ── STEP 1: Phone Entry ── */}
          {step === 'phone' && (
            <View style={styles.card}>
              <View style={styles.phoneRow}>
                {/* Static +91 badge */}
                <View style={styles.countryBadge}>
                  <Text style={styles.countryCode}>+91</Text>
                </View>

                {/* Phone input */}
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Mobile number from your delivery app"
                  placeholderTextColor={COLORS.textSubtle}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setError(''); }}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  autoFocus
                />
              </View>

              {/* Error */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Trust & Terms */}
              <Text style={styles.termsText}>
                Protected by reCAPTCHA and subject to the{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text> and{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>.
              </Text>

              {/* Action Buttons (Google Style Bottom Right) */}
              <View style={COMPONENTS.bottomCornerAction}>
                <TouchableOpacity
                  style={[COMPONENTS.buttonPrimary, (!phone || loading) && COMPONENTS.buttonPrimaryDisabled]}
                  onPress={handleSendOTP}
                  disabled={!phone || loading}
                  activeOpacity={0.85}>
                  {loading
                    ? <ActivityIndicator color={COLORS.primaryText} size="small" />
                    : <Text style={COMPONENTS.buttonPrimaryText}>Next</Text>}
                </TouchableOpacity>
              </View>

              {/* Invisible reCAPTCHA anchor - Only on phone screen */}
              <FirebaseRecaptcha
                ref={recaptchaRef}
                baseUrl={`https://${app.options.authDomain}`}
              />
            </View>
          )}

          {/* ── STEP 2: OTP Entry ── */}
          {step === 'otp' && (
            <View style={styles.card}>
              {/* Fix for user concern: removing excess top padding and strictly aligning OTP boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null
                    ]}
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val, index)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Error */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {loading && <ActivityIndicator color={COLORS.secondary} style={{ marginTop: 24, alignSelf: 'flex-start' }} />}

              {/* Action Buttons (Google Style Bottom Actions) */}
              <View style={COMPONENTS.bottomCornerAction}>
                <TouchableOpacity 
                  style={COMPONENTS.buttonText}
                  onPress={handleResend} 
                  disabled={resendTimer > 0}>
                  <Text style={[COMPONENTS.buttonTextLabel, resendTimer > 0 && { color: COLORS.textSubtle }]}>
                    {resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={COMPONENTS.buttonText}
                  onPress={() => { setStep('phone'); setError(''); }}>
                  <Text style={COMPONENTS.buttonTextLabel}>Edit number</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Theme & Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: { marginBottom: 32 },
  brandBadge: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  brandBadgeText: { fontSize: 16, fontWeight: '500', color: COLORS.textDark, letterSpacing: -0.5 },
  
  // Card & Shared
  card: { flex: 1, justifyContent: 'flex-start' }, // Changed from center to flex-start for cleaner minimal layout

  // Phone input (Google Account Style Outline)
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 },
  countryBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginRight: 12,
  },
  countryCode: { fontSize: 16, fontWeight: '400', color: COLORS.textDark },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 0,
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textDark,
  },

  // Error
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8,
    fontWeight: '500',
  },

  // Policies & Notes
  termsText: { 
    fontSize: 12, 
    color: COLORS.textSubtle, 
    marginTop: 24, 
    lineHeight: 18 
  },
  termsLink: { color: COLORS.secondary, fontWeight: '400' },

  // OTP Row
  otpRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8,
    marginTop: 8, // Strictly controlled top margin
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 0,
    backgroundColor: COLORS.surface,
    fontSize: 24,
    fontWeight: '400',
    color: COLORS.textDark,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#1E1E1E',
  },
  otpBoxError: {
    borderColor: COLORS.error,
    color: COLORS.error,
  },
});
