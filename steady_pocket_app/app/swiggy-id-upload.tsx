import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { db, auth } from '../services/firebase';
import { updateVerificationStatus } from '../services/authService';

import { COLORS, TYPOGRAPHY, COMPONENTS } from './theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

type Stage = 'permission' | 'camera' | 'preview' | 'loading' | 'verified' | 'not_found' | 'error';

interface PartnerData {
  emp_name: string;
  partner_id: string;
  platform: string;
  work_location: string;
  weekly_salary: number;
  profile_pic_url: string;
  phone: string;
}

export default function SwiggyIDUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerData | null>(null);

  // Loading pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (stage !== 'loading') return;

    // Pulse the shield icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    // Cycle dots 0→1→2→3
    Animated.loop(
      Animated.timing(dotAnim, { toValue: 3, duration: 1200, useNativeDriver: false })
    ).start();
  }, [stage]);

  // ── STAGE: Permission ───────────────────────────────────────────────────────
  if (!permission) {
    return <View style={COMPONENTS.screen} />;
  }
  if (!permission.granted) {
    return (
      <View style={s.centreContainer}>
        <Text style={TYPOGRAPHY.titleMedium}>Camera Permission Required</Text>
        <Text style={[TYPOGRAPHY.body, { textAlign: 'center', marginBottom: 32 }]}>
          We need access to your camera to scan your ID.
        </Text>
        <TouchableOpacity style={COMPONENTS.buttonPrimary} onPress={requestPermission}>
          <Text style={COMPONENTS.buttonPrimaryText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Capture photo ───────────────────────────────────────────────────────────
  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) { setPhotoUri(photo.uri); setStage('preview'); }
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // ── Submit & verify ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setStage('loading');

    try {
      const phone = auth.currentUser?.phoneNumber;
      if (!phone) throw new Error('Not authenticated');

      // Query Firestore partners collection by phone number
      const q = query(collection(db, 'partners'), where('phone', '==', phone));
      const snap = await getDocs(q);

      if (snap.empty) {
        setStage('not_found');
        return;
      }

      const data = snap.docs[0].data() as PartnerData;
      setPartner(data);

      // Record progress — so the router resumes here on next launch
      if (auth.currentUser) {
        await updateVerificationStatus(auth.currentUser.uid, 'kyc_complete');
      }

      setStage('verified');
    } catch (err: any) {
      console.error('Verification error:', err);
      setStage('not_found');
    }
  };



  // ── STAGE: Camera ───────────────────────────────────────────────────────────
  if (stage === 'camera') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleLarge}>Partner ID Verification</Text>
          <Text style={TYPOGRAPHY.bodyHighlight}>Position your Swiggy/Zomato partner ID card within the frame.</Text>
        </View>

        <View style={s.cameraWrap}>
          <CameraView ref={cameraRef} style={s.camera} facing="back" />
          {/* ID card guide overlay */}
          <View style={s.guideOverlay}>
            <View style={s.guideCornerTL} /><View style={s.guideCornerTR} />
            <View style={s.guideCornerBL} /><View style={s.guideCornerBR} />
          </View>
          <View style={s.guideHint}>
             <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>Align ID card within the corners</Text>
          </View>
        </View>

        <View style={s.shutterRow}>
          <TouchableOpacity style={s.shutterBtn} onPress={handleCapture} activeOpacity={0.8}>
            <View style={s.shutterInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── STAGE: Preview ──────────────────────────────────────────────────────────
  if (stage === 'preview' && photoUri) {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleLarge}>Review Your Photo</Text>
          <Text style={TYPOGRAPHY.bodyHighlight}>Make sure the ID card text is clearly visible.</Text>
        </View>

        <View style={s.previewWrap}>
          <Image source={{ uri: photoUri }} style={s.previewImg} resizeMode="contain" />
        </View>

        <View style={s.previewActions}>
          <TouchableOpacity style={s.outlineBtn} onPress={() => setStage('camera')}>
            <Text style={s.outlineBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.pill} onPress={handleSubmit}>
            <Text style={s.pillText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── STAGE: Loading (KYC) ────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <View style={s.centreContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={s.shieldIcon}>🛡️</Text>
        </Animated.View>
        <Text style={TYPOGRAPHY.titleMedium}>Verifying ID</Text>
        <Text style={TYPOGRAPHY.bodyHighlight}>Secure TartanHQ Check</Text>
        <Text style={TYPOGRAPHY.body}>This usually takes 5-10 seconds.</Text>
        <ActivityIndicator color={COLORS.secondary} size="large" style={{ marginTop: 32 }} />
      </View>
    );
  }

  // ── STAGE: Not found ────────────────────────────────────────────────────────
  if (stage === 'not_found' || stage === 'error') {
    return (
      <View style={s.centreContainer}>
        <Text style={s.errorIcon}>⚠️</Text>
        <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.error }]}>Verification Failed</Text>
        <Text style={[TYPOGRAPHY.body, { textAlign: 'center', marginHorizontal: 32, marginBottom: 32 }]}>
          We couldn't verify this ID. Make sure it's a valid, clear Swiggy ID card and try again.
        </Text>
        <View style={COMPONENTS.bottomCornerAction}>
          <TouchableOpacity style={COMPONENTS.buttonPrimary} onPress={() => setStage('camera')}>
            <Text style={COMPONENTS.buttonPrimaryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── STAGE: Verified ─────────────────────────────────────────────────────────
  if (stage === 'verified') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={COMPONENTS.contentPad}>
          <Text style={TYPOGRAPHY.titleLarge}>Partner verified</Text>
          <Text style={TYPOGRAPHY.body}>
            We successfully matched your ID to a registered {partner?.platform} account.
          </Text>

          {/* Minimalist Profile Card */}
          <View style={s.profileCard}>
            <View style={s.profileHeader}>
              <Image
                source={{ uri: partner?.profile_pic_url || 'https://ui-avatars.com/api/?name=' + partner?.emp_name }}
                style={s.profileAvatar}
              />
              <View style={s.profileInfo}>
                <Text style={TYPOGRAPHY.titleMedium}>{partner?.emp_name}</Text>
                <Text style={TYPOGRAPHY.bodyHighlight}>ID: {partner?.partner_id}</Text>
              </View>
              <View style={s.successBadge}>
                <Text style={s.successBadgeText}>✓</Text>
              </View>
            </View>

            <View style={s.profileDetailsGrid}>
              <InfoRow label="Location" value={partner?.work_location ?? ''} />
              <InfoRow label="Salary"   value={`₹${partner?.weekly_salary?.toLocaleString('en-IN')}`} />
              <InfoRow label="Platform" value={partner?.platform ?? ''} />
            </View>
          </View>
        </View>

        {/* Action Buttons (Google Style Bottom Right) */}
        <View style={[COMPONENTS.bottomCornerAction, { paddingHorizontal: 24 }]}>
          <TouchableOpacity
            style={COMPONENTS.buttonPrimary}
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: '/selfie-verification',
              params: { profile_pic_url: partner?.profile_pic_url ?? '' },
            })}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

// ── Minimal Info Row for the Profile Card ──
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={TYPOGRAPHY.label}>{label}</Text>
      <Text style={TYPOGRAPHY.bodyHighlight}>{value}</Text>
    </View>
  );
}

// ── Theme & Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      COMPONENTS.screen,
  centreContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  centre:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  // Header / Overrides for stages that aren't using COMPONENTS.contentPad
  header:     { padding: 24, paddingTop: 40 },

  // Camera
  cameraWrap: { flex: 1, marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera:     { flex: 1 },
  guideOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  guideCornerTL:{ position: 'absolute', top: 32,    left: 32,  width: 32, height: 32, borderTopWidth: 4,    borderLeftWidth: 4,   borderColor: COLORS.primaryText, borderRadius: 8 },
  guideCornerTR:{ position: 'absolute', top: 32,    right: 32, width: 32, height: 32, borderTopWidth: 4,    borderRightWidth: 4,  borderColor: COLORS.primaryText, borderRadius: 8 },
  guideCornerBL:{ position: 'absolute', bottom: 32, left: 32,  width: 32, height: 32, borderBottomWidth: 4, borderLeftWidth: 4,   borderColor: COLORS.primaryText, borderRadius: 8 },
  guideCornerBR:{ position: 'absolute', bottom: 32, right: 32, width: 32, height: 32, borderBottomWidth: 4, borderRightWidth: 4,  borderColor: COLORS.primaryText, borderRadius: 8 },
  guideHint:  { position: 'absolute', bottom: 16, alignSelf: 'center', color: COLORS.primaryText, fontSize: 13, fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },

  shutterRow:  { paddingVertical: 32, alignItems: 'center' },
  // Simple circular minimal shutter
  shutterBtn:  { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  shutterInner:{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary },

  // Preview
  previewWrap:   { flex: 1, marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  previewImg:    { flex: 1 },
  previewActions:{ flexDirection: 'row', padding: 24, gap: 16, justifyContent: 'center' },

  // Simple loading / icon feedback
  shieldIcon: { fontSize: 64, marginBottom: 24 },
  errorIcon:  { fontSize: 64, marginBottom: 24 },

  // Profile Card (Minimal List Item Style)
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
    marginBottom: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileInfo: {
    flex: 1,
  },
  successBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileDetailsGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },

  // Buttons for secondary views
  outlineBtn:  { borderWidth: 0, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, flex: 1, alignItems: 'center', backgroundColor: COLORS.surface },
  outlineBtnText:{ color: COLORS.textDark, fontSize: 15, fontWeight: '500' },
  pill: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, flex: 1, alignItems: 'center' },
  pillText: { color: COLORS.primaryText, fontSize: 15, fontWeight: '500' },
});
