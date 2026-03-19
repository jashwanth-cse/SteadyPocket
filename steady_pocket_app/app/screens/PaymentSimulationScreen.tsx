import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';

import { auth, db } from '../../services/firebase';
import { updateVerificationStatus, getUserDocIdByAuthUid } from '../../services/authService';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../theme';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { Stack } from '../../src/components/layout/Stack';

export default function PaymentSimulationScreen() {
  const router = useRouter();
  const { premium, policyId, coverageLimit } = useLocalSearchParams();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Auto-success timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isProcessing && !success) {
        console.log('[Payment] Auto-triggering success for demo...');
        handlePaymentSuccess();
      }
    }, 15000); // 15 seconds auto-fallback
    
    return () => clearTimeout(timer);
  }, [isProcessing, success]);

  // Generate UPI URL
  
  // upi://pay?pa=26jashwanth@oksbi&pn=Jashwanth%20J&am=${premium}&cu=INR&aid=uGICAgKCs8fDBRg
  const uid = auth.currentUser?.uid || 'GUEST';
  const timestamp = Date.now();
  const upiUrl = `upi://pay?pa=26jashwanth@oksbi&pn=Jashwanth%20J&am=${premium}&cu=INR&aid=uGICAgKCs8fDBRg`;

  const handleOpenUPI = async () => {
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        setError('Unable to open UPI app. Please scan the QR code instead.');
      }
    } catch (err) {
      console.error('Error opening UPI:', err);
      setError('An error occurred. Please use the QR code.');
    }
  };

  const handlePaymentSuccess = async () => {
    if (isProcessing || success) return;
    
    setIsProcessing(true);
    setError('');

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDocId = await getUserDocIdByAuthUid(uid);
      if (!userDocId) {
        throw new Error('User document not found');
      }

      // 1. Update Policy
      const policyIdStr = Array.isArray(policyId) ? policyId[0] : policyId;
      const policyRef = doc(db, 'policies', policyIdStr);
      await updateDoc(policyRef, {
        status: 'active',
        premium_paid: true,
        premium_paid_at: serverTimestamp(),
        payment_method: 'upi_simulated',
        payment_id: `SIM_${Date.now()}`
      });

      // 2. Update user verification status
      await updateVerificationStatus(uid, 'fully_verified');

      // 3. Get Wallet ID
      const userRef = doc(db, 'users', userDocId);
      const userSnap = await getDoc(userRef);
      const walletId = userSnap.exists() ? userSnap.data().wallet_id : '';

      // 4. Record Transaction
      await addDoc(collection(db, 'wallet_transactions'), {
        transaction_id: `TXN_${Date.now()}`,
        user_id: userDocId,
        wallet_id: walletId,
        type: 'premium_payment',
        amount: Number(premium),
        source: 'upi_simulated',
        timestamp: serverTimestamp(),
      });

      // Trigger success UI
      setSuccess(true);
      triggerSuccessAnimation();
      
      // Navigate after delay
      setTimeout(() => {
        router.replace('/dashboard/HomeScreen');
      }, 3000);
      
    } catch (err) {
      console.error('Payment Success Handler Error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerSuccessAnimation = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (success) {
    return (
      <View style={s.successOverlay}>
        <Animated.View style={[s.successContent, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={s.tickCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <Text style={s.successTitle}>Protection Activated!</Text>
          <Text style={s.successSub}>Your policy is now active. 🛡️</Text>
          <ActivityIndicator color={COLORS.success} size="small" style={{ marginTop: 32 }} />
        </Animated.View>
      </View>
    );
  }

  return (
    <AppScreen title="Payment Page" showBack={!isProcessing} onBack={() => router.back()}>
      <Stack gap={24} style={COMPONENTS.contentPad}>
        
        <View style={s.header}>
          <Text style={TYPOGRAPHY.titleMedium}>Complete Your Payment</Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle }]}>
            Scan the QR or use your UPI app
          </Text>
        </View>

        <SurfaceCard style={s.qrCard}>
          <View style={s.qrWrapper}>
            <QRCode
              value={upiUrl}
              size={220}
              color={COLORS.primaryText}
              backgroundColor={COLORS.surface}
            />
          </View>
          <Text style={s.scanText}>Scan QR using any UPI app</Text>
          
          <View style={s.amountRow}>
            <Text style={TYPOGRAPHY.label}>Amount to pay</Text>
            <Text style={s.amountValue}>₹{premium}</Text>
          </View>
        </SurfaceCard>

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="warning-outline" size={20} color={COLORS.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={s.footer}>
          <TouchableOpacity 
            style={COMPONENTS.buttonPrimary} 
            onPress={handleOpenUPI}
            disabled={isProcessing}
          >
            <View style={s.btnRow}>
              <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primaryText} />
              <Text style={[COMPONENTS.buttonPrimaryText, { marginLeft: 10 }]}>Pay via UPI App</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.doneBtn, isProcessing && s.doneBtnDisabled]} 
            onPress={handlePaymentSuccess}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={s.doneBtnText}>I have completed payment</Text>
            )}
          </TouchableOpacity>
          
          <Text style={s.demoNote}>
            Note: This is a demo. Clicking above will simulate a successful payment.
          </Text>
        </View>

      </Stack>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  header: { alignItems: 'center', marginTop: 10 },
  qrCard: { padding: 32, alignItems: 'center' },
  qrWrapper: { 
    padding: 16, 
    backgroundColor: '#fff', 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scanText: { 
    ...TYPOGRAPHY.bodyHighlight, 
    color: COLORS.textSubtle, 
    marginTop: 24,
    fontSize: 14 
  },
  amountRow: {
    marginTop: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    width: '100%',
  },
  amountValue: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  footer: { marginTop: 'auto', gap: 12, paddingBottom: 20 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnDisabled: {
    opacity: 0.5,
  },
  doneBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: { color: COLORS.error, fontSize: 13, flex: 1 },
  demoNote: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  },
  // Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
  },
  tickCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  successTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.primaryText,
    fontSize: 28,
  },
  successSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
    marginTop: 12,
  },
});
