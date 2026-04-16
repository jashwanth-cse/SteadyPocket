import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { TYPOGRAPHY, COLORS, COMPONENTS } from '../../app/theme';
import { Stack } from '../../src/components/layout/Stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';

import { auth, db } from '../../services/firebase';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { getUserDocIdByAuthUid } from '../../services/authService';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface PolicyData {
  policy_id?: string;
  user_id?: string;
  status?: string;
  coverage_limit?: number;
  protected_weekly_income?: number;
  premium?: number;
  weekly_premium?: number;
  coverage_start?: any;
  coverage_end?: any;
  created_at?: any;
}

interface UserData {
  emp_name?: string;
  phone_number?: string;
  risk_score?: number;
  wallet_balance?: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { handleFirestoreError } = useErrorHandler();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyData | null>(null);
  const [weeklyIncome, setWeeklyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribePolicy: (() => void) | null = null;
    let unsubscribePayouts: (() => void) | null = null;

    const loadDashboardData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }

        // Get the actual user document ID
        const userDocId = await getUserDocIdByAuthUid(uid);
        if (!userDocId) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', userDocId);
        unsubscribeUser = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserData);
            }
          },
          handleFirestoreError
        );

        const policyQ = query(
          collection(db, 'policies'),
          where('user_id', '==', userDocId),
          where('status', 'in', ['active', 'pending'])
        );

        unsubscribePolicy = onSnapshot(
          policyQ,
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              setActivePolicy(querySnapshot.docs[0].data() as PolicyData);
            } else {
              setActivePolicy(null);
            }
          },
          handleFirestoreError
        );

        const payoutsQ = query(
          collection(db, 'payouts'),
          where('user_id', '==', userDocId)
        );

        unsubscribePayouts = onSnapshot(payoutsQ, (snapshot) => {
          const now = new Date();
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          startOfWeek.setHours(0, 0, 0, 0);

          const total = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
            if (timestamp >= startOfWeek) {
              return acc + (data.amount || 0);
            }
            return acc;
          }, 0);

          setWeeklyIncome(total);
          setLoading(false);
        });

      } catch (err) {
        console.error('Error setting up dashboard listeners:', err);
        setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePolicy) unsubscribePolicy();
      if (unsubscribePayouts) unsubscribePayouts();
    };
  }, []);

  const calculateProgress = (start: any, end: any) => {
    if (!start || !end) return 0;
    const now = new Date().getTime();
    const startTime = start.toDate ? start.toDate().getTime() : start;
    const endTime = end.toDate ? end.toDate().getTime() : end;

    if (now > endTime) return 1;
    if (now < startTime) return 0;

    return (now - startTime) / (endTime - startTime);
  };

  const calculateDaysLeft = (end: any) => {
    if (!end) return 0;
    const now = new Date().getTime();
    const endTime = end.toDate ? end.toDate().getTime() : end;
    const diffTime = endTime - now;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const renderPendingActivationCard = () => {
    if (!activePolicy || activePolicy.status !== 'pending') return null;

    return (
      <SurfaceCard style={{ ...styles.protectionCard, borderColor: COLORS.secondary, borderWidth: 1.5 }}>
        <View style={[styles.cardHeader, { backgroundColor: `${COLORS.secondary}08` }]}>
          <View style={[styles.statusBadge, { backgroundColor: `${COLORS.secondary}15`, borderColor: `${COLORS.secondary}30` }]}>
            <View style={[styles.activeDot, { backgroundColor: COLORS.secondary }]} />
            <Text style={[TYPOGRAPHY.label, { color: COLORS.secondary, marginLeft: 6 }]}>
              PENDING ACTIVATION
            </Text>
          </View>
        </View>

        <View style={styles.coverageAmountSection}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, marginBottom: 8 }]}>
            Coverage Limit
          </Text>
          <Text style={[TYPOGRAPHY.titleLarge, { fontSize: 36, color: COLORS.primaryText, fontWeight: '700' }]}>
            {formatCurrency(activePolicy.coverage_limit)}
          </Text>
        </View>

        <View style={{ padding: 24, paddingTop: 0 }}>
          <View style={styles.alertNotice}>
            <Ionicons name="information-circle" size={20} color={COLORS.secondary} />
            <Text style={[TYPOGRAPHY.body, { color: COLORS.primaryText, flex: 1, marginLeft: 10 }]}>
              Pay the weekly premium to activate your protection and start coverage.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/premium-payment')}
            style={[COMPONENTS.buttonPrimary, { backgroundColor: COLORS.secondary, marginTop: 16 }]}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>Pay Premium & Activate</Text>
          </TouchableOpacity>
        </View>
      </SurfaceCard>
    );
  };

  const renderProtectionStatusCard = () => {
    if (!activePolicy) return null;

    return (
      <SurfaceCard style={styles.protectionCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={styles.activeDot} />
            <Text style={[TYPOGRAPHY.label, { color: COLORS.success, marginLeft: 6 }]}>
              ACTIVE
            </Text>
          </View>
          <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle }]}>
            ID: {activePolicy.policy_id?.substring(0, 12) || 'N/A'}
          </Text>
        </View>

        {/* Main Coverage Amount */}
        <View style={styles.coverageAmountSection}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, marginBottom: 8 }]}>
            Coverage Limit
          </Text>
          <Text
            style={[
              TYPOGRAPHY.titleLarge,
              {
                fontSize: 40,
                color: COLORS.primary,
                marginBottom: 16,
                fontWeight: '700',
              },
            ]}
          >
            {formatCurrency(activePolicy.coverage_limit)}
          </Text>
        </View>

        {/* Protection Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Protected Weekly Income */}
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="trending-up" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginBottom: 4 }]}>
                Protected Weekly Income
              </Text>
              <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, fontSize: 16 }]}>
                {formatCurrency(weeklyIncome)}
              </Text>
            </View>
          </View>

          {/* Weekly Premium */}
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="payments" size={20} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginBottom: 4 }]}>
                Weekly Premium
              </Text>
              <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, fontSize: 16 }]}>
                {formatCurrency(activePolicy.weekly_premium || activePolicy.premium)}
              </Text>
            </View>
          </View>

          {/* Policy Status */}
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="verified-user" size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginBottom: 4 }]}>
                Policy Status
              </Text>
              <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.success, fontSize: 16 }]}>
                {activePolicy?.status ? (activePolicy.status.charAt(0).toUpperCase() + activePolicy.status.slice(1)) : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* Coverage Period Section */}
        <View style={styles.divider} />

        <View style={styles.coveragePeriodSection}>
          <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
            Coverage Period
          </Text>

          <View style={styles.periodDatesRow}>
            <View style={styles.periodDateItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginBottom: 4 }]}>
                  Coverage Start
                </Text>
                <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText }]}>
                  {formatDate(activePolicy.coverage_start)}
                </Text>
              </View>
            </View>

            <View style={styles.periodDateItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginBottom: 4 }]}>
                  Coverage End
                </Text>
                <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText }]}>
                  {formatDate(activePolicy.coverage_end)}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle }]}>
                Protection Progress
              </Text>
              <Text style={[TYPOGRAPHY.label, { color: COLORS.primary }]}>
                {calculateDaysLeft(activePolicy.coverage_end)} Days Left
              </Text>
            </View>
            <ProgressBar
              progress={calculateProgress(activePolicy.coverage_start, activePolicy.coverage_end)}
              color={COLORS.primary}
              style={styles.progressBar}
            />
          </View>
        </View>
      </SurfaceCard>
    );
  };

  const renderQuickActionButton = (
    icon: string,
    label: string,
    onPress: () => void,
    color: string = COLORS.primary
  ) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.quickActionButton, { borderColor: color }]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, marginTop: 8 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderNoPolicyCard = () => (
    <SurfaceCard style={styles.noPolicyCard}>
      <View style={styles.noPolicyContent}>
        <View style={styles.noPolicyIcon}>
          <Ionicons name="shield-outline" size={48} color={COLORS.error} />
        </View>
        <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginTop: 16 }]}>
          No active protection plan found.
        </Text>
        <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, textAlign: 'center', marginTop: 8 }]}>
          Get covered against weather and city disruptions. Start your protection today.
        </Text>
      </View>
    </SurfaceCard>
  );

  return (
    <AppScreen
      title="Dashboard"
      fabIcon="help"
      onFabPress={() => router.push('/dashboard/SupportComplaintsScreen')}
    >
      <Stack>
        {loading ? (
          <SurfaceCard>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, marginTop: 12 }]}>
                Loading your protection status...
              </Text>
            </View>
          </SurfaceCard>
        ) : (
          <View>
            {/* Header Greeting */}
            <View style={styles.header}>
              <View>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle }]}>Welcome back,</Text>
                <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.primaryText, marginBottom: 0 }]}>
                  {userData?.emp_name?.split(' ')[0] || 'User'}
                </Text>
              </View>
              {userData?.wallet_balance !== undefined && (
                <View style={[styles.riskBadge, { borderColor: COLORS.secondary, backgroundColor: `${COLORS.secondary}10` }]}>
                  <MaterialIcons name="account-balance-wallet" size={14} color={COLORS.secondary} />
                  <Text style={[TYPOGRAPHY.label, { color: COLORS.secondary, marginLeft: 4 }]}>
                    My Pocket: {formatCurrency(userData.wallet_balance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Main Protection Status Card */}
            {activePolicy ? (
              activePolicy.status === 'active' ? renderProtectionStatusCard() : renderPendingActivationCard()
            ) : renderNoPolicyCard()}

            {/* Quick Actions Section */}
            {activePolicy && (
              <View style={styles.quickActionsSection}>
                <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
                  Quick Actions
                </Text>
                <View style={styles.quickActionsGrid}>
                  {renderQuickActionButton(
                    'visibility',
                    'View Coverage',
                    () => router.push('/dashboard/CoverageDetailsScreen'),
                    COLORS.primary
                  )}
                  {renderQuickActionButton(
                    'account-balance-wallet',
                    'My Pocket',
                    () => router.push('/dashboard/WalletScreen'),
                    COLORS.secondary
                  )}
                  {renderQuickActionButton(
                    'history',
                    'Payout History',
                    () => router.push('/dashboard/PaymentsScreen'),
                    COLORS.secondary
                  )}
                </View>
              </View>
            )}

            {/* Additional Actions */}
            <View style={styles.additionalActionsSection}>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
                More
              </Text>
              <View style={styles.additionalActionsGrid}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/dashboard/ProfileScreen')}
                  style={styles.actionTile}
                >
                  <Ionicons name="person-outline" size={24} color={COLORS.primary} />
                  <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, marginTop: 8 }]}>
                    Profile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.actionTile}
                  onPress={() => router.push('/dashboard/SupportComplaintsScreen')}
                >
                  <Ionicons name="help-circle-outline" size={24} color={COLORS.secondary} />
                  <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, marginTop: 8, textAlign: 'center' }]}>
                    Support &{'\n'}Complaints
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7} style={styles.actionTile}>
                  <Ionicons name="document-text-outline" size={24} color={COLORS.textSubtle} />
                  <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, marginTop: 8 }]}>
                    Docs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: `${COLORS.success}10`,
  },
  protectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  coverageAmountSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  detailsGrid: {
    paddingHorizontal: 24,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
    marginVertical: 20,
  },
  coveragePeriodSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  periodDatesRow: {
    gap: 16,
    marginBottom: 24,
  },
  periodDateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressSection: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  noPolicyCard: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  noPolicyContent: {
    alignItems: 'center',
  },
  noPolicyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsSection: {
    marginTop: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  additionalActionsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  additionalActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.secondary}10`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}20`,
  },
});
