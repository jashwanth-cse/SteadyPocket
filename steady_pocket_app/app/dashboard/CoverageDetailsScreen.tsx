import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { Stack } from '../../src/components/layout/Stack';
import { COLORS, TYPOGRAPHY } from '../../app/theme';
import { auth, db } from '../../services/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getUserDocIdByAuthUid } from '../../services/authService';

interface PolicyData {
  policy_id: string;
  user_id: string;
  status: 'active' | 'expired';
  coverage_limit: number;
  protected_weekly_income?: number;
  weekly_premium?: number;
  premium?: number;
  coverage_start: Timestamp;
  coverage_end: Timestamp;
}

interface ProtectionTrigger {
  icon: string;
  label: string;
}

const protectionTriggers: ProtectionTrigger[] = [
  { icon: 'beach-access', label: 'Rain disruption' },
  { icon: 'block', label: 'Strike or protest' },
  { icon: 'wb-sunny', label: 'Heatwave' },
  { icon: 'wifi-off', label: 'Internet shutdown' },
];

export default function CoverageDetailsScreen() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [weeklyIncome, setWeeklyIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribePolicy: (() => void) | null = null;
    let unsubscribePayouts: (() => void) | null = null;

    const loadPolicyAndIncome = async () => {
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

        const q = query(
          collection(db, 'policies'),
          where('user_id', '==', userDocId),
          where('status', '==', 'active')
        );

        unsubscribePolicy = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            setPolicy(snapshot.docs[0].data() as PolicyData);
          } else {
            setPolicy(null);
          }
        });

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

      } catch (error) {
        console.error('Error loading policy and income:', error);
        setLoading(false);
      }
    };

    loadPolicyAndIncome();

    return () => {
      if (unsubscribePolicy) unsubscribePolicy();
      if (unsubscribePayouts) unsubscribePayouts();
    };
  }, []);

  if (loading) {
    return (
      <AppScreen title="Coverage Details" showBack>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      </AppScreen>
    );
  }

  if (!policy) {
    return (
      <AppScreen title="Coverage Details" showBack>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="security" size={56} color={COLORS.textSubtle} />
          <Text style={[TYPOGRAPHY.titleMedium, { marginTop: 16 }]}>
            No active coverage found
          </Text>
          <Text style={[TYPOGRAPHY.body, { marginTop: 8, textAlign: 'center' }]}>
            You don't have an active protection plan yet. Visit the Policies section to get started.
          </Text>
        </View>
      </AppScreen>
    );
  }

  const coverageStartDate = policy.coverage_start?.toDate() || new Date();
  const coverageEndDate = policy.coverage_end?.toDate() || new Date();
  const today = new Date();
  const totalDays = Math.floor(
    (coverageEndDate.getTime() - coverageStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysUsed = Math.floor(
    (today.getTime() - coverageStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, totalDays - daysUsed);
  const progressPercentage = totalDays > 0 ? (daysUsed / totalDays) * 100 : 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <AppScreen title="Coverage Details" showBack>
      <Stack gap={16}>
        {/* Policy Summary Card */}
        <SurfaceCard>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={TYPOGRAPHY.label}>Coverage Limit</Text>
              <Text style={[TYPOGRAPHY.titleLarge, { marginTop: 4 }]}>
                {formatCurrency(policy.coverage_limit)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: policy.status === 'active' ? '#22C55E15' : '#F5943015' },
              ]}>
              <MaterialIcons
                name={policy.status === 'active' ? 'check-circle' : 'info'}
                size={16}
                color={policy.status === 'active' ? COLORS.secondary : '#F59E0B'}
              />
              <Text
                style={[
                  TYPOGRAPHY.label,
                  {
                    color: policy.status === 'active' ? COLORS.secondary : '#F59E0B',
                    marginLeft: 6,
                  },
                ]}>
                {policy.status === 'active' ? 'ACTIVE' : 'EXPIRED'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={TYPOGRAPHY.label}>Policy ID</Text>
              <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 4 }]}>
                {policy.policy_id}
              </Text>
            </View>
          </View>
        </SurfaceCard>

        {/* Income & Premium Card */}
        <SurfaceCard>
          <Text style={TYPOGRAPHY.titleMedium}>Income & Premium</Text>

          <View style={[styles.detailRow, { marginTop: 16, gap: 12 }]}>
            <View style={styles.detailItem}>
              <View style={styles.iconLabel}>
                <MaterialIcons name="trending-up" size={18} color={COLORS.secondary} />
                <Text style={[TYPOGRAPHY.label, { marginLeft: 6, flexShrink: 1 }]} numberOfLines={2}>Weekly Income</Text>
              </View>
              <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 8 }]}>
                {formatCurrency(weeklyIncome)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconLabel}>
                <MaterialIcons name="payments" size={18} color={COLORS.primary} />
                <Text style={[TYPOGRAPHY.label, { marginLeft: 6, flexShrink: 1 }]} numberOfLines={2}>Weekly Premium</Text>
              </View>
              <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 8 }]}>
                {formatCurrency((policy as any).weekly_premium || (policy as any).premium)}
              </Text>
            </View>
          </View>
        </SurfaceCard>

        {/* Coverage Period Card */}
        <SurfaceCard>
          <Text style={TYPOGRAPHY.titleMedium}>Coverage Period</Text>

          <View style={[styles.detailRow, { marginTop: 16 }]}>
            <View style={styles.dateItem}>
              <Text style={TYPOGRAPHY.label}>Start Date</Text>
              <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 4 }]}>
                {formatDate(coverageStartDate)}
              </Text>
            </View>

            <MaterialIcons name="arrow-forward" size={24} color={COLORS.textSubtle} />

            <View style={styles.dateItem}>
              <Text style={TYPOGRAPHY.label}>End Date</Text>
              <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 4 }]}>
                {formatDate(coverageEndDate)}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(progressPercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={[TYPOGRAPHY.label, { marginTop: 8, textAlign: 'center' }]}>
              {daysRemaining} days remaining
            </Text>
          </View>
        </SurfaceCard>

        {/* Protection Triggers Card */}
        <SurfaceCard>
          <Text style={TYPOGRAPHY.titleMedium}>Protection Triggers</Text>
          <Text style={[TYPOGRAPHY.body, { marginTop: 8, marginBottom: 16 }]}>
            You're covered when these events happen in your work location.
          </Text>

          <View style={styles.triggersGrid}>
            {protectionTriggers.map((trigger, index) => (
              <View key={index} style={styles.triggerItem}>
                <View style={styles.triggerIconContainer}>
                  <MaterialIcons name={trigger.icon as any} size={28} color={COLORS.primary} />
                </View>
                <Text style={[TYPOGRAPHY.label, { marginTop: 12, textAlign: 'center' }]}>
                  {trigger.label}
                </Text>
              </View>
            ))}
          </View>
        </SurfaceCard>

        {/* Coverage Explanation Card */}
        <SurfaceCard>
          <View style={styles.explanationHeader}>
            <MaterialIcons name="info" size={24} color={COLORS.primary} />
            <Text style={[TYPOGRAPHY.titleMedium, { marginLeft: 12, flex: 1 }]}>
              How Coverage Works
            </Text>
          </View>

          <Text style={[TYPOGRAPHY.body, { marginTop: 12 }]}>
            If a disruption occurs in your work location, Steady Pocket automatically calculates
            your payout based on your protected weekly income. The payout is credited to your
            account within 24 hours of the disruption event.
          </Text>

          <Text style={[TYPOGRAPHY.body, { marginTop: 16 }]}>
            Your coverage is active during your defined coverage period and automatically renews
            based on your policy terms. Keep your contact information updated to receive timely
            disruption notifications.
          </Text>
        </SurfaceCard>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailItem: {
    flex: 1,
  },
  dateItem: {
    flex: 1,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressSection: {
    marginTop: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  triggersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  triggerItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  triggerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
