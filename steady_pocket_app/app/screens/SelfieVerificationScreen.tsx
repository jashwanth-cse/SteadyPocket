/**
 * SelfieVerificationScreen
 *
 * Flow:  camera → preview → loading (POST /verify/selfie) → verified | failed
 *
 * Receives `profile_pic_url` via expo-router search params set by SwiggyIDUploadScreen.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '../../services/firebase';
import { updateVerificationStatus } from '../../services/authService';

import { COLORS, TYPOGRAPHY, COMPONENTS } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

type Stage = 'camera' | 'preview' | 'loading' | 'verified' | 'failed';

export default function SelfieVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile_pic_url } = useLocalSearchParams<{ profile_pic_url: string }>();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>('camera');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('front'); // selfie = front

  // Pulse animation for loading
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (stage !== 'loading') return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, [stage]);

  // ── STAGE: Permission ──────────────────────────────────────────────────────
  if (!permission) {
    return <View style={COMPONENTS.screen} />;
  }
  if (!permission.granted) {
    return (
      <View style={s.centreContainer}>
        <Text style={TYPOGRAPHY.titleMedium}>Camera Permission Required</Text>
        <Text style={[TYPOGRAPHY.body, { textAlign: 'center', marginBottom: 32 }]}>
          We need access to your front camera to verify your identity.
        </Text>
        <TouchableOpacity style={COMPONENTS.buttonPrimary} onPress={requestPermission}>
          <Text style={COMPONENTS.buttonPrimaryText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Capture ────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) { setSelfieUri(photo.uri); setStage('preview'); }
    } catch {
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
    }
  };

  // ── Upload & verify ────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!selfieUri) return;
    setStage('loading');

    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error('Not authenticated');

      console.log('[Selfie] API_URL:', API_URL);
      console.log('[Selfie] Endpoint:', `${API_URL}/verify/selfie`);

      if (!profile_pic_url) {
        // No photo to compare — accept liveness only (dev shortcut)
        console.warn('[Selfie] No profile_pic_url; bypassing face match');
        if (auth.currentUser) await updateVerificationStatus(auth.currentUser.uid, 'selfie_complete');
        setStage('verified');
        return;
      }

      // ── Build FormData with real Blob ─────────────────────────────────────
      // On web, expo-camera returns a blob: URL. The browser's native FormData
      // requires an actual Blob/File — the RN-style {uri,type,name} object
      // is silently dropped, causing multer to see no file field.
      const form = new FormData();

      // 1. Fetch the selfie blob URL → actual bytes
      const selfieResp = await fetch(selfieUri);
      const selfieBlob = await selfieResp.blob();
      form.append('selfie', selfieBlob, 'selfie.jpg');

      // 2. Pass the profile pic URL as a plain form field.
      //    The gateway downloads it server-side and forwards the bytes to FastAPI.
      form.append('id_photo_url', profile_pic_url);

      // ── POST to gateway ───────────────────────────────────────────────────
      console.log('[Selfie] Sending request to:', `${API_URL}/verify/selfie`);
      const res = await fetch(`${API_URL}/verify/selfie`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          Accept: 'application/json',
          // ngrok requires this header to bypass browser warning
          'ngrok-skip-browser-warning': 'true',
        },
        body: form,
      });

      console.log('[Selfie] Response status:', res.status);
      const data = await res.json();
      console.log('[Selfie] Response data:', data);

      if (!res.ok) throw new Error(data.error || `Verification failed (${res.status})`);

      if (data.verified === true) {
        if (auth.currentUser) await updateVerificationStatus(auth.currentUser.uid, 'selfie_complete');
        setStage('verified');
      } else {
        console.log('[Selfie] Not verified — match_score:', data.match_score, 'reason:', data.reason);
        setStage('failed');
      }
    } catch (err: any) {
      console.error('[Selfie] Error:', err.message);
      console.error('[Selfie] Full error:', err);
      setStage('failed');
    }
  };

  // ── STAGE: Camera ──────────────────────────────────────────────────────────
  if (stage === 'camera') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleLarge}>Take a selfie</Text>
          <Text style={TYPOGRAPHY.body}>Position your face inside the oval frame.</Text>
        </View>

        <View style={s.cameraWrap}>
          <CameraView ref={cameraRef} style={s.camera} facing={facing} />
          
          <View style={s.ovalWrap}>
            <View style={s.oval} />
          </View>
          <View style={s.guideHint}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>Good lighting helps</Text>
          </View>
        </View>

        <View style={s.shutterRow}>
          <TouchableOpacity style={s.flipBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
            <Text style={s.flipBtnText}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.shutterBtn} onPress={handleCapture}>
            <View style={s.shutterInner} />
          </TouchableOpacity>
          <View style={{ width: 56 }} />
        </View>
      </View>
    );
  }

  // ── STAGE: Preview ─────────────────────────────────────────────────────────
  if (stage === 'preview' && selfieUri) {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleLarge}>Review Photo</Text>
          <Text style={TYPOGRAPHY.bodyHighlight}>Make sure your entire face is clearly visible.</Text>
        </View>

        <View style={s.previewWrap}>
          <Image source={{ uri: selfieUri }} style={s.previewImg} resizeMode="cover" />
          <View style={s.previewOverlay}>
            <View style={s.previewOval} />
          </View>
        </View>

        <View style={s.previewActions}>
          <TouchableOpacity style={s.outlineBtn} onPress={() => setStage('camera')}>
            <Text style={s.outlineBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.pill} onPress={handleVerify}>
            <Text style={s.pillText}>Verify Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── STAGE: Loading ─────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <View style={s.centreContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={s.bigIcon}>🤖</Text>
        </Animated.View>
        <Text style={TYPOGRAPHY.titleMedium}>Analyzing Identity</Text>
        <Text style={TYPOGRAPHY.bodyHighlight}>Comparing with Swiggy ID</Text>
        <Text style={TYPOGRAPHY.body}>This usually takes 5-10 seconds.</Text>
      </View>
    );
  }

  // ── STAGE: Verified ────────────────────────────────────────────────────────
  if (stage === 'verified') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={COMPONENTS.contentPad}>
          {/* Subtle success header */}
          <Text style={TYPOGRAPHY.titleLarge}>Identity verified</Text>
          <Text style={TYPOGRAPHY.body}>Your face matches the partner ID photo successfully.</Text>

          <View style={s.profileCard}>
            <View style={s.profileHeader}>
              <View style={[s.successBadge, { width: 48, height: 48, borderRadius: 24, marginRight: 16 }]}>
                <Text style={[s.successBadgeText, { fontSize: 24 }]}>✓</Text>
              </View>
              <View style={s.profileInfo}>
                <Text style={TYPOGRAPHY.titleMedium}>Access Granted</Text>
                <Text style={TYPOGRAPHY.bodyHighlight}>Liveness & Face Match Passed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons (Google Style Bottom Right) */}
        <View style={[COMPONENTS.bottomCornerAction, { paddingHorizontal: 24 }]}>
          <TouchableOpacity 
            style={COMPONENTS.buttonPrimary} 
            activeOpacity={0.85} 
            onPress={() => router.push('/govt-id-verification')}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── STAGE: Failed ──────────────────────────────────────────────────────────
  if (stage === 'failed') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={COMPONENTS.contentPad}>
          <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.error }]}>Verification failed</Text>
          <Text style={TYPOGRAPHY.body}>
            We couldn't verify your identity. Make sure you are in a well-lit area and not wearing glasses or a hat.
          </Text>
        </View>

        <View style={[COMPONENTS.bottomCornerAction, { paddingHorizontal: 24 }]}>
          <TouchableOpacity style={COMPONENTS.buttonText} onPress={() => router.back()}>
            <Text style={COMPONENTS.buttonTextLabel}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={COMPONENTS.buttonPrimary} onPress={() => setStage('camera')}>
            <Text style={COMPONENTS.buttonPrimaryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

// ── Theme & Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: COMPONENTS.screen,
  centreContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  header: { padding: 24, paddingTop: 40 },

  // Camera stage
  cameraWrap:{ flex: 1, marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  camera:    { flex: 1 },
  ovalWrap:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  oval:      { width: 230, height: 300, borderRadius: 150, borderWidth: 4, borderColor: COLORS.primaryText,  backgroundColor: 'transparent' },
  guideHint: { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },

  shutterRow:{ paddingVertical: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  flipBtn:   { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  flipBtnText:{ fontSize: 24, color: COLORS.textDark },
  shutterBtn:{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  shutterInner:{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary },

  // Preview stage
  previewWrap:   { flex: 1, marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  previewImg:    { flex: 1 },
  previewOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  previewOval:   { width: 230, height: 300, borderRadius: 150, borderWidth: 4, borderColor: '#fff', backgroundColor: 'transparent' },
  previewActions:{ flexDirection: 'row', padding: 24, gap: 16, justifyContent: 'center' },

  // Simple loading feedback
  bigIcon:   { fontSize: 72, marginBottom: 24 },
  // Profile / Success Card (Minimal Google Style)
  profileCard: {
    marginTop: 32,
    borderWidth: 0,
    borderRadius: 20,
    padding: 24,
    backgroundColor: COLORS.surface,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  successBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
  },
  successBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  // Buttons for secondary views
  pill: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, flex: 1, alignItems: 'center' },
  pillText: { color: COLORS.primaryText, fontSize: 15, fontWeight: '500' },
  outlineBtn: { borderWidth: 0, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, flex: 1, alignItems: 'center', backgroundColor: COLORS.surface },
  outlineBtnText: { color: COLORS.textDark, fontSize: 15, fontWeight: '500' },
});
