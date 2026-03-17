import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { Stack } from '../../src/components/layout/Stack';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../../app/theme';
import { auth, db } from '../../services/firebase';
import { doc, collection, query, where, onSnapshot, Timestamp, limit, orderBy } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { getUserDocIdByAuthUid } from '../../services/authService';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'payout';
  amount: number;
  timestamp: Timestamp;
  description: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [weeklySalary, setWeeklySalary] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeWallet: (() => void) | null = null;
    let unsubscribePayouts: (() => void) | null = null;

    const loadWalletData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }

        const userDocId = await getUserDocIdByAuthUid(uid);
        if (!userDocId) {
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', userDocId);
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setWeeklySalary(docSnap.data().weekly_salary || 0);
          }
        });

        const walletQ = query(
          collection(db, 'wallets'),
          where('user_id', '==', userDocId),
          limit(1)
        );
        unsubscribeWallet = onSnapshot(walletQ, (snapshot) => {
          if (!snapshot.empty) {
            setBalance(snapshot.docs[0].data().balance || 0);
          }
        });

        const payoutsQ = query(
          collection(db, 'payouts'),
          where('user_id', '==', userDocId)
        );

        unsubscribePayouts = onSnapshot(payoutsQ, (snapshot) => {
          const list = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: 'payout',
              amount: data.amount,
              timestamp: data.timestamp,
              description: data.reason || 'Rain Disruption Payout',
            } as Transaction;
          });

          list.sort((a, b) => {
            const tA = a.timestamp?.toMillis?.() || 0;
            const tB = b.timestamp?.toMillis?.() || 0;
            return tB - tA;
          });

          setTransactions(list.slice(0, 10));
          setLoading(false);
        });

      } catch (error) {
        console.error('Error loading wallet:', error);
        setLoading(false);
      }
    };

    loadWalletData();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeWallet) unsubscribeWallet();
      if (unsubscribePayouts) unsubscribePayouts();
    };
  }, []);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <AppScreen title="My Pocket" showBack>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="My Pocket" showBack>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap={24}>
          {/* Balance Card */}
          <SurfaceCard style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={[TYPOGRAPHY.label, { color: 'rgba(255,255,255,0.7)' }]}>Total Balance</Text>
              <MaterialIcons name="account-balance-wallet" size={24} color="#FFF" />
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="arrow-upward" size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="add" size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.actionText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </SurfaceCard>

          {/* Quick Info */}
          <View style={styles.infoGrid}>
            <SurfaceCard style={styles.infoItem}>
              <Text style={TYPOGRAPHY.label}>Weekly Salary</Text>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.success, marginTop: 4 }]}>
                {formatCurrency(weeklySalary)}
              </Text>
            </SurfaceCard>
            <SurfaceCard style={styles.infoItem}>
              <Text style={TYPOGRAPHY.label}>Active Policy</Text>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primary, marginTop: 4 }]}>
                Standard Cover
              </Text>
            </SurfaceCard>
          </View>

          {/* Recent Activity */}
          <View>
            <Text style={[TYPOGRAPHY.titleMedium, { marginBottom: 16 }]}>Recent Activity</Text>
            {transactions.length === 0 ? (
              <SurfaceCard style={styles.emptyActivity}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle }]}>No recent activity</Text>
              </SurfaceCard>
            ) : (
              <Stack gap={12}>
                {transactions.map((tx) => (
                  <SurfaceCard key={tx.id} style={styles.txItem}>
                    <View style={[styles.txIcon, { backgroundColor: `${COLORS.success}15` }]}>
                      <MaterialIcons name="call-received" size={20} color={COLORS.success} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={TYPOGRAPHY.bodyHighlight}>{tx.description}</Text>
                      <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle }]}>{formatDate(tx.timestamp)}</Text>
                    </View>
                    <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.success }]}>
                      +{formatCurrency(tx.amount)}
                    </Text>
                  </SurfaceCard>
                ))}
              </Stack>
            )}
          </View>
        </Stack>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  balanceCard: {
    backgroundColor: COLORS.secondary,
    padding: 24,
    borderRadius: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    ...TYPOGRAPHY.titleLarge,
    fontSize: 42,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...TYPOGRAPHY.label,
    color: '#FFF',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    padding: 16,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivity: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
