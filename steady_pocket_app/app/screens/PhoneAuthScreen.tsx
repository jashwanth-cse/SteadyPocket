import React, { useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ConfirmationResult, ApplicationVerifier } from 'firebase/auth';

import FirebaseRecaptcha, { FirebaseRecaptchaRef } from '../components/FirebaseRecaptcha';
import app from '../../services/firebase';

import { sendOTP, verifyOTP, saveUserToFirestore } from '../../services/authService';
import { APP_NAME } from '../../services/constants';

// ─── Country codes (expandable) ───────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
];

export default function PhoneAuthScreen() {
  const router = useRouter();
  const recaptchaRef = useRef<FirebaseRecaptchaRef>(null);

  // ── Step state
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // ── Phone step
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');

  // ── OTP step
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // ── Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const fullPhone = `${selectedCountry.code}${digits}`;
      
      // Always use the FirebaseRecaptcha verifier
      let verifier: any = undefined;
      
      const refAny = recaptchaRef.current as any;
      if (refAny?.applicationVerifier) {
        // Web platform: use Firebase's native RecaptchaVerifier directly
        verifier = refAny.applicationVerifier;
      } else {
        // Native platform (iOS/Android): construct adapter connecting to WebView
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
      setError(e?.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      const credential = await verifyOTP(confirmationResult!, code);
      const uid = credential.user.uid;
      const fullPhone = `${selectedCountry.code}${phone}`;
      await saveUserToFirestore(uid, fullPhone);
      router.replace('/swiggy-id-upload');
    } catch (e: any) {
      setError('Invalid OTP. Please check and try again.');
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
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />


      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>💰 {APP_NAME}</Text>
            </View>
            <Text style={styles.title}>
              {step === 'phone' ? 'Verify Your\nPhone Number' : 'Enter OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? "We'll send a one-time code to confirm your number"
                : `A 6-digit code was sent to ${selectedCountry.code} ${phone}`}
            </Text>
          </View>

          {/* ── STEP 1: Phone Entry ── */}
          {step === 'phone' && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Phone Number</Text>

              <View style={styles.phoneRow}>
                {/* Country Code Picker */}
                <TouchableOpacity
                  style={styles.countryButton}
                  onPress={() => setShowCountryPicker((v) => !v)}
                  activeOpacity={0.8}>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                  <Text style={styles.chevron}>▾</Text>
                </TouchableOpacity>

                {/* Phone input */}
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setError(''); }}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                />
              </View>

              {/* Country Picker Dropdown */}
              {showCountryPicker && (
                <View style={styles.dropdown}>
                  {COUNTRY_CODES.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedCountry(c);
                        setShowCountryPicker(false);
                      }}>
                      <Text style={styles.dropdownFlag}>{c.flag}</Text>
                      <Text style={styles.dropdownLabel}>{c.label}</Text>
                      <Text style={styles.dropdownCode}>{c.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Error */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* reCAPTCHA v2 widget — verified before sending OTP (web only) */}
              <FirebaseRecaptcha
                ref={recaptchaRef}
                baseUrl={`https://${app.options.authDomain}`}
              />

              {/* CTA */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryButtonText}>Send OTP →</Text>}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          )}

          {/* ── STEP 2: OTP Entry ── */}
          {step === 'otp' && (
            <View style={styles.card}>
              {/* 6-box OTP input */}
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
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

              {/* Verify CTA */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryButtonText}>Verify OTP ✓</Text>}
              </TouchableOpacity>

              {/* Resend */}
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendTimer > 0}
                style={styles.resendRow}>
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                  {resendTimer > 0
                    ? `Resend OTP in ${resendTimer}s`
                    : 'Resend OTP'}
                </Text>
              </TouchableOpacity>

              {/* Back */}
              <TouchableOpacity onPress={() => { setStep('phone'); setError(''); }} style={styles.backRow}>
                <Text style={styles.backText}>← Change Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },

  // Header
  header: { marginBottom: 28 },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  brandBadgeText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10, letterSpacing: 0.3 },

  // Phone row
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 10,
  },
  countryFlag: { fontSize: 20, marginRight: 4 },
  countryCode: { fontSize: 15, fontWeight: '600', color: '#111827', marginRight: 4 },
  chevron: { fontSize: 11, color: '#6B7280' },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '500',
    color: '#111827',
    letterSpacing: 1,
  },

  // Dropdown
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownFlag: { fontSize: 22, marginRight: 10 },
  dropdownLabel: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
  dropdownCode: { fontSize: 14, color: '#6B7280' },

  // Error
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '500',
  },

  // Primary button
  primaryButton: {
    backgroundColor: '#1A56DB',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#1A56DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  // Terms
  termsText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  termsLink: { color: '#1A56DB', fontWeight: '600' },

  // OTP boxes
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#111827',
  },
  otpBoxFilled: {
    borderColor: '#1A56DB',
    backgroundColor: '#EFF6FF',
  },

  // Resend & Back
  resendRow: { marginTop: 18, alignItems: 'center' },
  resendText: { fontSize: 14, fontWeight: '600', color: '#1A56DB' },
  resendDisabled: { color: '#9CA3AF' },
  backRow: { marginTop: 12, alignItems: 'center' },
  backText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
});
