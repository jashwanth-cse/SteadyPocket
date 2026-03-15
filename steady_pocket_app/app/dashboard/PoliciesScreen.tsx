import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { TYPOGRAPHY as typography } from '../../app/theme';
import { COLORS as colors } from '../../app/theme';
import { Stack } from '../../src/components/layout/Stack';

import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function PoliciesScreen() {
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchPolicies = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
           setLoading(false);
           return;
        }

        const q = query(
          collection(db, 'policies'),
          where('user_id', '==', uid)
        );
        
        unsubscribe = onSnapshot(q, (snap) => {
          const loadedPolicies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          // Sort in memory to avoid needing a Firestore composite index
          const sortedPolicies = loadedPolicies.sort((a, b) => {
            const timeA = a.coverage_start?.toMillis() || 0;
            const timeB = b.coverage_start?.toMillis() || 0;
            return timeB - timeA; // Descending
          });
          
          setPolicies(sortedPolicies);
          setLoading(false);
        }, (error) => {
          console.error("Error listening to policies:", error);
          setLoading(false);
        });

      } catch (err) {
        console.error('Error setting up policies listener:', err);
        setLoading(false);
      }
    };

    fetchPolicies();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <AppScreen title="My Policies" showBack onBack={() => router.back()}>
      <Stack>
        {loading ? (
          <SurfaceCard>
             <View style={{ padding: 24, alignItems: 'center' }}>
               <ActivityIndicator size="large" color={colors.primary} />
             </View>
          </SurfaceCard>
        ) : policies.length === 0 ? (
          <SurfaceCard>
            <Text style={[typography.body, { color: colors.textSubtle }]}>
              No active policies deployed yet.
            </Text>
          </SurfaceCard>
        ) : (
          policies.map(policy => {
            const isActive = policy.status === 'active';
            return (
              <SurfaceCard key={policy.id} style={{ padding: 0, overflow: 'hidden' }}>
                <View style={[styles.statusStrip, { backgroundColor: isActive ? colors.success : colors.textSubtle }]} />
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={[typography.titleLarge, { color: colors.primaryText }]}>
                      Weekly Parametric Cover
                    </Text>
                    <View style={[styles.badge, { backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)' }]}>
                      <Text style={[styles.badgeText, { color: isActive ? colors.success : colors.textSubtle }]}>
                        {policy.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.bodyHighlight, { color: colors.textSubtle, marginTop: 4, fontSize: 13 }]}>
                    ID: {policy.policy_id}
                  </Text>

                  <View style={styles.grid}>
                    <View style={styles.gridItem}>
                      <Text style={styles.label}>Coverage Limit</Text>
                      <Text style={styles.value}>₹{policy.coverage_limit?.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.label}>Weekly Premium</Text>
                      <Text style={styles.value}>₹{policy.premium}</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.label}>Start Date</Text>
                      <Text style={styles.value}>{formatDate(policy.coverage_start)}</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.label}>Expiration Date</Text>
                      <Text style={styles.value}>{formatDate(policy.coverage_end)}</Text>
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            );
          })
        )}
      </Stack>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  statusStrip: {
    height: 4,
    width: '100%',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
  },
  gridItem: {
    width: '45%',
  },
  label: {
    ...typography.label,
    color: colors.textSubtle,
    marginBottom: 4,
  },
  value: {
    ...typography.bodyHighlight,
    color: colors.primaryText,
  }
});
