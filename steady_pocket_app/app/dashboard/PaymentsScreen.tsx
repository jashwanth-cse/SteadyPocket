import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { Stack } from '../../src/components/layout/Stack';
import { COLORS, TYPOGRAPHY } from '../../app/theme';
import { auth, db } from '../../services/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { getUserDocIdByAuthUid } from '../../services/authService';

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
  location?: string;
  status: 'completed' | 'failed' | 'pending';
  timestamp: Timestamp;
  eventData?: EventData;
}

const PayoutItem = ({ payout, eventData, isExpanded, onToggle }: { 
  payout: PayoutData; 
  eventData?: EventData; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) => {
  const getIconForEventType = (eventType?: string): string => {
    switch (eventType?.toLowerCase()) {
      case 'rain':
        return 'beach-access';
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
    if (!eventType) return 'Payout';
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
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SurfaceCard style={styles.payoutCard}>
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle} style={styles.payoutMainRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${COLORS.secondary}10` }]}>
          <MaterialIcons
            name={getIconForEventType(eventData?.event_type) as any}
            size={24}
            color={COLORS.secondary}
          />
        </View>
        
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={TYPOGRAPHY.bodyHighlight}>{getEventTypeLabel(eventData?.event_type)}</Text>
          <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle, marginTop: 2 }]}>
            {formatDate(payout.timestamp)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText }]}>
            +{formatCurrency(payout.amount)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={[styles.miniDot, { backgroundColor: getStatusColor(payout.status) }]} />
            <Text style={[TYPOGRAPHY.label, { color: getStatusColor(payout.status), marginLeft: 4, fontSize: 10 }]}>
              {payout.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <MaterialIcons 
          name={isExpanded ? "expand-less" : "expand-more"} 
          size={20} 
          color={COLORS.textSubtle} 
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <View style={styles.detailGrid}>
            <View style={styles.detailCol}>
              <Text style={TYPOGRAPHY.label}>Location</Text>
              <Text style={[TYPOGRAPHY.body, { marginTop: 4 }]}>
                {eventData?.location || payout.location || 'Unknown'}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={TYPOGRAPHY.label}>Payout ID</Text>
              <Text style={[TYPOGRAPHY.body, { marginTop: 4, fontSize: 12 }]}>
                {payout.payout_id || payout.id}
              </Text>
            </View>
          </View>
          {eventData?.severity && (
            <View style={{ marginTop: 12 }}>
              <Text style={TYPOGRAPHY.label}>Severity</Text>
              <Text style={[TYPOGRAPHY.body, { marginTop: 4, textTransform: 'capitalize' }]}>
                {eventData.severity} Disruption
              </Text>
            </View>
          )}
        </View>
      )}
    </SurfaceCard>
  );
};

export default function PaymentsScreen() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsMap, setEventsMap] = useState<Map<string, EventData>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribePayouts: (() => void) | null = null;
    let unsubscribeEvents: (() => void) | null = null;

    const loadPayoutHistory = async () => {
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

        const eventsQ = collection(db, 'events');
        unsubscribeEvents = onSnapshot(eventsQ, (eventsSnap) => {
          const newEventsMap = new Map<string, EventData>();
          eventsSnap.docs.forEach((doc) => {
            newEventsMap.set(doc.id, { event_id: doc.id, ...doc.data() } as EventData);
          });
          setEventsMap(newEventsMap);
        });

        const payoutsQ = query(
          collection(db, 'payouts'),
          where('user_id', '==', userDocId)
        );

        unsubscribePayouts = onSnapshot(payoutsQ, (snapshot) => {
          const payoutsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PayoutData[];

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
      if (unsubscribePayouts) unsubscribePayouts();
      if (unsubscribeEvents) unsubscribeEvents();
    };
  }, []);

  const mergedPayouts = payouts.map(p => ({
    ...p,
    eventData: eventsMap.get(p.event_id)
  }));

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
            When a disruption occurs, payouts will appear here automatically.
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Payout History" showBack>
      <Stack gap={12}>
        {mergedPayouts.map((payout) => (
          <PayoutItem 
            key={payout.id} 
            payout={payout} 
            eventData={payout.eventData}
            isExpanded={expandedId === payout.id}
            onToggle={() => setExpandedId(expandedId === payout.id ? null : payout.id)}
          />
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
    marginTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 100,
  },
  payoutCard: {
    padding: 0,
    overflow: 'hidden',
  },
  payoutMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
});
