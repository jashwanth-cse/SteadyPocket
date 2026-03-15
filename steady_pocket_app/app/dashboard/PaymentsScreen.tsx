import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { Stack } from '../../src/components/layout/Stack';
import { COLORS, TYPOGRAPHY } from '../../app/theme';
import { auth, db } from '../../services/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

interface EventData {
  event_id: string;
  event_type: 'rain' | 'strike' | 'heatwave' | 'internet_shutdown' | 'road_closure';
  location: string;
  severity: string;
  status: string;
  start_time?: Timestamp;
  end_time?: Timestamp;
}

interface PayoutData {
  id: string;
  payout_id: string;
  user_id: string;
  event_id: string;
  amount: number;
  status: 'completed' | 'failed' | 'pending';
  timestamp: Timestamp;
  eventData?: EventData;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsMap, setEventsMap] = useState<Map<string, EventData>>(new Map());

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadPayoutHistory = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }

        // Fetch all events once and create a map for quick lookup
        const eventsQ = collection(db, 'events');
        const eventsSnap = await getDocs(eventsQ);
        const newEventsMap = new Map<string, EventData>();
        eventsSnap.docs.forEach((doc) => {
          const data = doc.data();
          newEventsMap.set(data.event_id, data as EventData);
        });
        setEventsMap(newEventsMap);

        // Set up real-time listener for payouts with user_id filter
        const payoutsQ = query(
          collection(db, 'payouts'),
          where('user_id', '==', uid)
        );

        unsubscribe = onSnapshot(payoutsQ, (snapshot) => {
          const payoutsList = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              eventData: newEventsMap.get(data.event_id),
            } as PayoutData;
          });

          // Sort by timestamp descending (most recent first)
          payoutsList.sort((a, b) => {
            const timeA = a.timestamp?.toMillis?.() || 0;
            const timeB = b.timestamp?.toMillis?.() || 0;
            return timeB - timeA;
          });

          setPayouts(payoutsList);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading payout history:', error);
        setLoading(false);
      }
    };

    loadPayoutHistory();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const getIconForEventType = (eventType?: string): string => {
    switch (eventType?.toLowerCase()) {
      case 'rain':
        return 'cloud-rain';
      case 'strike':
        return 'block';
      case 'heatwave':
        return 'wb-sunny';
      case 'internet_shutdown':
        return 'wifi-off';
      case 'road_closure':
        return 'block-helper';
      default:
        return 'info';
    }
  };

  const getEventTypeLabel = (eventType?: string): string => {
    if (!eventType) return 'Unknown';
    return eventType
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return COLORS.secondary;
      case 'failed':
        return COLORS.error;
      case 'pending':
        return '#F59E0B';
      default:
        return COLORS.textSubtle;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <AppScreen title="Payout History" showBack>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      </AppScreen>
    );
  }

  if (payouts.length === 0) {
    return (
      <AppScreen title="Payout History" showBack>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="payment" size={56} color={COLORS.textSubtle} />
          <Text style={[TYPOGRAPHY.titleMedium, { marginTop: 16 }]}>No payouts received yet</Text>
          <Text style={[TYPOGRAPHY.body, { marginTop: 8, textAlign: 'center' }]}>
            When a disruption occurs in your work location, payouts will appear here automatically.
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Payout History" showBack>
      <Stack gap={12}>
        {payouts.map((payout) => (
          <SurfaceCard key={payout.id}>
            {/* Header: Event Type with Icon and Status Badge */}
            <View style={styles.payoutHeader}>
              <View style={styles.eventTypeSection}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: `${COLORS.primary}15`,
                    },
                  ]}>
                  <MaterialIcons
                    name={getIconForEventType(payout.eventData?.event_type) as any}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={TYPOGRAPHY.label}>Event Type</Text>
                  <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 4 }]}>
                    {getEventTypeLabel(payout.eventData?.event_type)} Disruption
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${getStatusColor(payout.status)}15`,
                  },
                ]}>
                <MaterialIcons
                  name={payout.status === 'completed' ? 'check-circle' : 'error'}
                  size={16}
                  color={getStatusColor(payout.status)}
                />
                <Text
                  style={[
                    TYPOGRAPHY.label,
                    {
                      color: getStatusColor(payout.status),
                      marginLeft: 6,
                    },
                  ]}>
                  {payout.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Amount Section */}
            <View style={styles.amountSection}>
              <Text style={TYPOGRAPHY.label}>Amount Credited</Text>
              <Text
                style={[
                  TYPOGRAPHY.titleLarge,
                  {
                    color: COLORS.secondary,
                    marginTop: 4,
                    fontSize: 32,
                  },
                ]}>
                {formatCurrency(payout.amount)}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Location & Date Section */}
            <View style={styles.detailsSection}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={TYPOGRAPHY.label}>Location</Text>
                  <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 4 }]}>
                    {payout.eventData?.location || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="calendar-today" size={18} color={COLORS.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={TYPOGRAPHY.label}>Date</Text>
                  <Text style={[TYPOGRAPHY.bodyHighlight, { marginTop: 4 }]}>
                    {formatDate(payout.timestamp)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payout ID */}
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle }]}>
              Payout ID: {payout.payout_id}
            </Text>
          </SurfaceCard>
        ))}
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
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTypeSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  amountSection: {
    paddingVertical: 8,
  },
  detailsSection: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
