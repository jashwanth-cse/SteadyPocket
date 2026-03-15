import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { COLORS, TYPOGRAPHY, COMPONENTS } from '../theme';
import { collection, query, where, getDocs, setDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { updateVerificationStatus, getUserDocIdByAuthUid } from '../../services/authService';

type IDType = 'Driving License' | 'Voter ID' | null;
type Stage = 'selection' | 'camera' | 'verifying' | 'success';

export default function GovtIDVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [idType, setIdType] = useState<IDType>(null);
  const [stage, setStage] = useState<Stage>('selection');
  const [isGeneratingPolicy, setIsGeneratingPolicy] = useState(false);

  // Animation values for cybersecurity sequence
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [verificationText, setVerificationText] = useState('Scanning document...');

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    // Simulate capture, jump straight to verification sequence
    setStage('verifying');
    startVerificationSequence();
  };

  const startVerificationSequence = () => {
    // Pulse animation for the tech-ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();

    // Sequence texts
    setTimeout(() => setVerificationText('Validating identity...'), 1000);
    setTimeout(() => setVerificationText('Matching with partner database...'), 2000);
    setTimeout(() => setStage('success'), 3000);
  };

  const generatePolicy = async () => {
    try {
      if (!auth.currentUser) {
        router.replace('/');
        return;
      }
      setIsGeneratingPolicy(true);
      const uid = auth.currentUser.uid;

      // Get the correct user document ID
      const userDocId = await getUserDocIdByAuthUid(uid);
      if (!userDocId) {
        console.error('User document not found');
        router.replace('/');
        return;
      }

      // Check if an active policy already exists
      const policiesRef = collection(db, 'policies');
      const activePolicyQuery = query(
        policiesRef,
        where('user_id', '==', uid),
        where('status', '==', 'active')
      );
      const activePoliciesSnap = await getDocs(activePolicyQuery);

      if (!activePoliciesSnap.empty) {
        // Active policy exists, skip creation
        await updateVerificationStatus(uid, 'kyc_complete');
        router.replace('/dashboard');
        return;
      }

      // Fetch weekly salary from user profile using correct document ID
      const userRef = doc(db, 'users', userDocId);
      const userSnap = await getDoc(userRef);
      let weeklyIncome = 5000; // default fallback if data doesn't exist yet
      if (userSnap.exists() && userSnap.data().weekly_salary) {
        weeklyIncome = userSnap.data().weekly_salary;
      }

      // Calculate temporary logic
      const premium = Math.round(weeklyIncome * 0.016);
      const coverageLimit = Math.round(weeklyIncome * 0.75);
      const riskScore = Number((Math.random() * (0.7 - 0.2) + 0.2).toFixed(2));
      const policyId = `POL${Math.floor(Math.random() * 90000 + 10000)}`;

      // Calculate dates
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Save policy
      await setDoc(doc(db, 'policies', policyId), {
        policy_id: policyId,
        user_id: uid,
        weekly_income: weeklyIncome,
        premium: premium,
        coverage_limit: coverageLimit,
        risk_score: riskScore,
        coverage_start: Timestamp.fromDate(now),
        coverage_end: Timestamp.fromDate(nextWeek),
        status: 'active',
      });

      await updateVerificationStatus(uid, 'kyc_complete');
      router.replace('/dashboard');
    } catch (err) {
      console.error('Failed to generate policy:', err);
      // Still navigate so user isn't stuck
      router.replace('/dashboard');
    } finally {
      setIsGeneratingPolicy(false);
    }
  };

  // ─── STAGE: Selection ────────────────────────────────────────────────────────
  if (stage === 'selection') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleLarge}>Government ID</Text>
          <Text style={TYPOGRAPHY.bodyHighlight}>Select a document to securely verify your identity.</Text>
        </View>

        <View style={COMPONENTS.contentPad}>
          <TouchableOpacity
            style={[s.idOptionCard, idType === 'Driving License' && s.idOptionCardSelected]}
            onPress={() => setIdType('Driving License')}
            activeOpacity={0.7}
          >
            <Text style={s.idIcon}>🚗</Text>
            <View style={{ flex: 1 }}>
              <Text style={TYPOGRAPHY.titleMedium}>Driving License</Text>
              <Text style={TYPOGRAPHY.body}>Valid driving license issued by RTO</Text>
            </View>
            <View style={[s.radioCircle, idType === 'Driving License' && s.radioSelected]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.idOptionCard, idType === 'Voter ID' && s.idOptionCardSelected]}
            onPress={() => setIdType('Voter ID')}
            activeOpacity={0.7}
          >
            <Text style={s.idIcon}>🗳️</Text>
            <View style={{ flex: 1 }}>
              <Text style={TYPOGRAPHY.titleMedium}>Voter ID</Text>
              <Text style={TYPOGRAPHY.body}>EPIC card issued by Election Commission</Text>
            </View>
            <View style={[s.radioCircle, idType === 'Voter ID' && s.radioSelected]} />
          </TouchableOpacity>
        </View>

        <View style={[COMPONENTS.bottomCornerAction, { paddingHorizontal: 24 }]}>
          <TouchableOpacity
            style={[COMPONENTS.buttonPrimary, !idType && s.buttonDisabled]}
            disabled={!idType}
            onPress={() => setStage('camera')}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── STAGE: Camera ───────────────────────────────────────────────────────────
  if (stage === 'camera') {
    if (!permission?.granted) {
      return (
        <View style={s.centreContainer}>
          <Text style={TYPOGRAPHY.bodyHighlight}>Camera permission required.</Text>
        </View>
      );
    }
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleLarge}>Scan {idType}</Text>
          <Text style={TYPOGRAPHY.bodyHighlight}>Position the front of your document in the frame.</Text>
        </View>

        <View style={s.cameraWrap}>
          <CameraView ref={cameraRef} style={s.camera} facing="back" />
          <View style={s.guideOverlay}>
            <View style={s.guideCornerTL} /><View style={s.guideCornerTR} />
            <View style={s.guideCornerBL} /><View style={s.guideCornerBR} />
          </View>
          <View style={s.guideHint}>
             <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>Align ID within corners</Text>
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

  // ─── STAGE: Verifying (Cybersecurity Progress) ───────────────────────────────
  if (stage === 'verifying') {
    const widthInterpolation = progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={s.centreContainer}>
        {/* Animated Tech Ring */}
        <Animated.View style={[s.techRing, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.shieldIcon}>🔐</Text>
        </Animated.View>

        {/* Monospace Tech Output */}
        <View style={s.terminalBox}>
          <Text style={s.terminalText}>{'>'} {verificationText}</Text>
          <View style={s.progressBarTrack}>
            <Animated.View style={[s.progressBarFill, { width: widthInterpolation }]} />
          </View>
        </View>
      </View>
    );
  }

  // ─── STAGE: Success ──────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <View style={[COMPONENTS.screen, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        <View style={s.header}>
          <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.success, fontSize: 24, letterSpacing: 1 }]}>ACCESS GRANTED</Text>
          <Text style={TYPOGRAPHY.bodyHighlight}>Your identity has been securely verified.</Text>
        </View>

        <View style={COMPONENTS.contentPad}>
          <View style={s.successCard}>
            <SuccessRow text="Identity verified" />
            <SuccessRow text="Partner authentication successful" />
            <SuccessRow text="Secure onboarding completed" isLast />
          </View>
        </View>

        <View style={[COMPONENTS.bottomCornerAction, { paddingHorizontal: 24 }]}>
          <TouchableOpacity
            style={[COMPONENTS.buttonPrimary, { flex: 1, marginLeft: 0 }, isGeneratingPolicy && { opacity: 0.7 }]}
            onPress={generatePolicy}
            disabled={isGeneratingPolicy}
            activeOpacity={0.85}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>
              {isGeneratingPolicy ? 'Activating Policy...' : 'Enter Platform →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

// ─── Helper Components ────────────────────────────────────────────────────────
function SuccessRow({ text, isLast = false }: { text: string; isLast?: boolean }) {
  return (
    <View style={[s.successRow, !isLast && s.successRowBorder]}>
      <View style={s.successDot} />
      <Text style={TYPOGRAPHY.bodyHighlight}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { padding: 24, paddingTop: 64 },
  centreContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // ID Selection
  idOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 0,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  idOptionCardSelected: {
    backgroundColor: '#1E1E1E', // slightly elevated surface value
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  idIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  radioSelected: {
    borderColor: COLORS.secondary,
    borderWidth: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Camera Stage
  cameraWrap: { flex: 1, marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  guideOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  guideCornerTL: { position: 'absolute', top: 32, left: 32, width: 32, height: 32, borderTopWidth: 4, borderLeftWidth: 4, borderColor: COLORS.secondary, borderRadius: 8 },
  guideCornerTR: { position: 'absolute', top: 32, right: 32, width: 32, height: 32, borderTopWidth: 4, borderRightWidth: 4, borderColor: COLORS.secondary, borderRadius: 8 },
  guideCornerBL: { position: 'absolute', bottom: 32, left: 32, width: 32, height: 32, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: COLORS.secondary, borderRadius: 8 },
  guideCornerBR: { position: 'absolute', bottom: 32, right: 32, width: 32, height: 32, borderBottomWidth: 4, borderRightWidth: 4, borderColor: COLORS.secondary, borderRadius: 8 },
  guideHint: { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },

  shutterRow: { paddingVertical: 32, alignItems: 'center' },
  shutterBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.secondary },

  // Verifying (Cybersecurity Progress)
  techRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    marginBottom: 48,
  },
  shieldIcon: { fontSize: 60 },
  terminalBox: {
    width: '80%',
    backgroundColor: COLORS.surface,
    borderWidth: 0,
    borderRadius: 20,
    padding: 16,
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.primaryText,
    fontSize: 13,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
  },

  // Success Card
  successCard: {
    borderWidth: 0,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  successRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  successDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: 16,
  },
});
