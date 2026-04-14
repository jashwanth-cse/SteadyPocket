import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { Stack } from '../../src/components/layout/Stack';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../../app/theme';
import { auth, db } from '../../services/firebase';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  limit,
  getDocs,
  updateDoc,
  increment,
} from 'firebase/firestore';
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

  // Add Money modal state
  const [addMoneyVisible, setAddMoneyVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [addingMoney, setAddingMoney] = useState(false);

  // Withdraw modal state
  const [withdrawVisible, setWithdrawVisible] = useState(false);

  // Cached wallet doc ref for updates
  const [walletDocId, setWalletDocId] = useState<string | null>(null);
  const [userDocId, setUserDocId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeWallet: (() => void) | null = null;
    let unsubscribePayouts: (() => void) | null = null;

    const loadWalletData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }

        const resolvedDocId = await getUserDocIdByAuthUid(uid);
        if (!resolvedDocId) { setLoading(false); return; }
        setUserDocId(resolvedDocId);

        const userRef = doc(db, 'users', resolvedDocId);
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setWeeklySalary(docSnap.data().weekly_salary || 0);
          }
        });

        const walletQ = query(
          collection(db, 'wallets'),
          where('user_id', '==', resolvedDocId),
          limit(1)
        );
        unsubscribeWallet = onSnapshot(walletQ, (snapshot) => {
          if (!snapshot.empty) {
            setWalletDocId(snapshot.docs[0].id);
            setBalance(snapshot.docs[0].data().balance || 0);
          }
        });

        const payoutsQ = query(
          collection(db, 'payouts'),
          where('user_id', '==', resolvedDocId)
        );
        unsubscribePayouts = onSnapshot(payoutsQ, (snapshot) => {
          const list = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
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

  // ─── Add Money ────────────────────────────────────────────────────────────────
  const handleAddMoney = async () => {
    const amount = parseFloat(amountInput);
    if (!amountInput || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    setAddingMoney(true);
    try {
      if (walletDocId) {
        await updateDoc(doc(db, 'wallets', walletDocId), {
          balance: increment(amount),
        });
      } else if (userDocId) {
        // Wallet doc not yet created — find via query then update
        const walletQ = query(
          collection(db, 'wallets'),
          where('user_id', '==', userDocId),
          limit(1)
        );
        const snap = await getDocs(walletQ);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, { balance: increment(amount) });
          setWalletDocId(snap.docs[0].id);
        }
      }

      setAddMoneyVisible(false);
      setAmountInput('');
    } catch (error) {
      console.error('Error adding money:', error);
      Alert.alert('Error', 'Failed to add money. Please try again.');
    } finally {
      setAddingMoney(false);
    }
  };

  const openAddMoney = () => {
    setAmountInput('');
    setAddMoneyVisible(true);
  };

  // ─── Withdraw ─────────────────────────────────────────────────────────────────
  const handleWithdraw = () => {
    setWithdrawVisible(true);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
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
              <TouchableOpacity style={styles.actionBtn} onPress={handleWithdraw}>
                <View style={styles.actionIcon}>
                  <MaterialIcons name="arrow-upward" size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={openAddMoney}>
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

      {/* ── Withdraw Modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={withdrawVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.withdrawIconWrap}>
              <MaterialIcons name="support-agent" size={32} color={COLORS.secondary} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 8 }]}>Withdraw Funds</Text>
            <Text style={styles.withdrawMsg}>
              Contact the admin for transferring your funds to your bank account.
            </Text>
            <TouchableOpacity
              style={styles.withdrawBtnOk}
              onPress={() => setWithdrawVisible(false)}
            >
              <Text style={styles.modalBtnOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Add Money Modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={addMoneyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMoneyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Money</Text>
            <Text style={styles.modalSubtitle}>Enter amount to credit</Text>

            <View style={styles.inputRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={COLORS.textSubtle}
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
                autoFocus
              />
            </View>

            <View style={styles.premiumNote}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.textSubtle} style={{ marginTop: 1 }} />
              <Text style={styles.premiumNoteText}>
                A small portion of this amount will be used for your weekly premium.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setAddMoneyVisible(false)}
                disabled={addingMoney}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnOk, (!amountInput || addingMoney) && styles.modalBtnDisabled]}
                onPress={handleAddMoney}
                disabled={!amountInput || addingMoney}
              >
                {addingMoney
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.modalBtnOkText}>OK</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  rupeeSymbol: {
    fontSize: 22,
    color: COLORS.textDark,
    marginRight: 8,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  premiumNote: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  premiumNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSubtle,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border ?? '#333',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
  modalBtnOk: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  modalBtnOkText: {
    ...TYPOGRAPHY.label,
    color: '#FFF',
    fontWeight: '700',
  },
  modalBtnDisabled: {
    opacity: 0.45,
  },
  withdrawIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  withdrawBtnOk: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  withdrawMsg: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
