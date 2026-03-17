import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  getDocs,
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


export default function PremiumPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        router.replace('/phone-auth');
        return;
      }

      const userDocId = await getUserDocIdByAuthUid(uid);
      if (!userDocId) {
        console.warn('User document not found');
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'policies'),
        where('user_id', '==', userDocId),
        where('status', '==', 'pending')
      );
      
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Find the one that's not paid yet or just take the latest
        const policyDoc = snap.docs[0];
        setPolicy({ id: policyDoc.id, ...policyDoc.data() });
      } else {
        console.warn('No active policy found for payment');
      }
    } catch (err) {
      console.error('Error fetching policy for payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = () => {
    setIsInitiating(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsInitiating(false);
      router.push({
        pathname: '/payment-simulation',
        params: { 
          premium: policy.premium,
          policyId: policy.id,
          coverageLimit: policy.coverage_limit
        }
      });
    }, 2000);
  };

  if (loading) {
    return (
      <View style={COMPONENTS.screen}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!policy) {
    return (
      <AppScreen title="Payment" showBack onBack={() => router.back()}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={[TYPOGRAPHY.body, { marginTop: 16, textAlign: 'center' }]}>
            No active policy found needing payment.
          </Text>
          <TouchableOpacity 
            style={[COMPONENTS.buttonPrimary, { marginTop: 24 }]} 
            onPress={() => router.replace('/dashboard/HomeScreen')}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Activate Protection" showBack={false}>
      <Stack gap={24} style={COMPONENTS.contentPad}>
        
        <View style={s.header}>
            <View style={s.iconBg}>
                <MaterialIcons name="security" size={40} color={COLORS.primary} />
            </View>
            <Text style={[TYPOGRAPHY.titleMedium, { textAlign: 'center', marginTop: 16 }]}>
                Activate Weekly Cover
            </Text>
            <Text style={[TYPOGRAPHY.body, { textAlign: 'center' }]}>
                Complete payment to enable parametric protection for the week.
            </Text>
        </View>

        <SurfaceCard style={s.detailCard}>
            <View style={s.row}>
                <Text style={TYPOGRAPHY.label}>Coverage Limit</Text>
                <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText }]}>
                    ₹{policy.coverage_limit?.toLocaleString('en-IN')}
                </Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
                <Text style={TYPOGRAPHY.label}>Valid Until</Text>
                <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText }]}>
                    {policy.coverage_end?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
                <Text style={[TYPOGRAPHY.bodyHighlight, { fontSize: 18, color: COLORS.primaryText }]}>Weekly Premium</Text>
                <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primary, marginBottom: 0 }]}>
                    ₹{policy.premium}
                </Text>
            </View>
        </SurfaceCard>

        <View style={s.notice}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.textSubtle} />
            <Text style={[TYPOGRAPHY.label, { marginLeft: 8, textTransform: 'none', flex: 1 }]}>
                This premium covers you against climate disruptions and city strikes.
            </Text>
        </View>

        <View style={s.footer}>
            <TouchableOpacity 
                style={[COMPONENTS.buttonPrimary, { width: '100%' }]} 
                onPress={handleInitiatePayment}
            >
                <Text style={COMPONENTS.buttonPrimaryText}>Pay & Activate</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={s.payLaterLink} 
                onPress={() => router.replace('/dashboard/HomeScreen')}
            >
                <Text style={s.payLaterLinkText}>Pay Later</Text>
            </TouchableOpacity>
        </View>

      </Stack>

      <Modal
        visible={isInitiating}
        transparent={true}
        animationType="fade"
      >
        <View style={s.overlay}>
            <View style={s.loaderCard}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[TYPOGRAPHY.titleMedium, { marginTop: 24, color: COLORS.primaryText }]}>Initiating Payment...</Text>
                <Text style={[TYPOGRAPHY.body, { marginTop: 8, color: COLORS.textSubtle, textAlign: 'center' }]}>Connecting to Razorpay Secure Gateway</Text>
            </View>
        </View>
      </Modal>

    </AppScreen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { alignItems: 'center', marginTop: 10 },
  iconBg: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  detailCard: { padding: 24, paddingVertical: 12 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12 
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  notice: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    padding: 12, 
    borderRadius: 12 
  },
  loaderCard: {
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    width: '100%',
    paddingTop: 24,
    paddingBottom: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  payLaterLink: {
    marginTop: 16,
    padding: 8,
  },
  payLaterLinkText: {
    color: COLORS.textSubtle,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
