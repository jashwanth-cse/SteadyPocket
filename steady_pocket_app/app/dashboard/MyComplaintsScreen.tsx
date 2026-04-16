import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getUserDocIdByAuthUid } from '../../services/authService';

interface Complaint {
  id: string;
  complaint_type: string;
  message: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: any;
  ai_decision?: string;
  confidence?: number;
}

const STATUS_CONFIG = {
  pending: {
    color: '#F59E0B',
    icon: 'schedule',
    label: 'Pending',
  },
  resolved: {
    color: '#22C55E',
    icon: 'check-circle',
    label: 'Resolved',
  },
  rejected: {
    color: '#EF4444',
    icon: 'cancel',
    label: 'Rejected',
  },
};

const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  payout_not_received: 'Payout Not Received',
  incorrect_payout: 'Incorrect Payout',
  technical_issue: 'Technical Issue',
  other: 'Other',
};

export default function MyComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      let unsubscribe: (() => void) | null = null;

      const loadComplaints = async () => {
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

          // Query complaints for this user
          const complaintsQ = query(
            collection(db, 'complaints'),
            where('user_id', '==', userDocId)
          );

          unsubscribe = onSnapshot(
            complaintsQ,
            (querySnapshot) => {
              const complaintsData: Complaint[] = [];
              querySnapshot.forEach((doc) => {
                complaintsData.push({
                  id: doc.id,
                  ...doc.data(),
                } as Complaint);
              });

              // Sort by created_at descending (newest first)
              complaintsData.sort((a, b) => {
                const timeA = a.created_at?.toDate?.() || new Date(a.created_at);
                const timeB = b.created_at?.toDate?.() || new Date(b.created_at);
                return timeB.getTime() - timeA.getTime();
              });

              setComplaints(complaintsData);
              setLoading(false);
              setHasError(false);
            },
            (error) => {
              console.error('Error loading complaints:', error);
              setLoading(false);
              setHasError(true);
            }
          );
        } catch (error) {
          console.error('Error setting up complaints listener:', error);
          setLoading(false);
          setHasError(true);
        }
      };

      loadComplaints();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, [])
  );

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const renderComplaintCard = (complaint: Complaint) => {
    const statusConfig = STATUS_CONFIG[complaint.status];
    const typeLabel = COMPLAINT_TYPE_LABELS[complaint.complaint_type] || complaint.complaint_type;

    return (
      <SurfaceCard key={complaint.id} style={styles.complaintCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.complaintType}>{typeLabel}</Text>
            <Text style={styles.createdDate}>{formatDate(complaint.created_at)}</Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusConfig.color}20`, borderColor: statusConfig.color },
            ]}
          >
            <MaterialIcons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Message Preview */}
        <Text style={styles.messagePreview} numberOfLines={3}>
          {complaint.message}
        </Text>

        {/* AI Decision (if available) */}
        {complaint.ai_decision && (
          <View
            style={[
              styles.aiDecisionBox,
              {
                backgroundColor: `${colors.primary}10`,
                borderColor: colors.primary,
              },
            ]}
          >
            <MaterialIcons name="auto-awesome" size={14} color={colors.primary} />
            <Text style={[styles.aiDecisionText, { color: colors.textPrimary }]}>
              {complaint.ai_decision}
            </Text>
            {complaint.confidence !== undefined && (
              <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                {Math.round(complaint.confidence * 100)}% confidence
              </Text>
            )}
          </View>
        )}

        {/* View Details Link */}
        <TouchableOpacity
          style={styles.viewDetailsLink}
          onPress={() => {
            // Could navigate to a detail screen here
            console.log('View complaint details:', complaint.id);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </SurfaceCard>
    );
  };

  return (
    <AppScreen
      title="My Complaints"
      showBack
      onBack={() => router.back()}
    >
      <View style={styles.container}>
        {loading ? (
          <SurfaceCard style={styles.loadingCard}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading your complaints...
              </Text>
            </View>
          </SurfaceCard>
        ) : hasError ? (
          <SurfaceCard style={styles.errorCard}>
            <View style={styles.errorContent}>
              <MaterialIcons name="error-outline" size={40} color={colors.error} />
              <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
                Failed to load complaints
              </Text>
              <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
                Please check your connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  setHasError(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SurfaceCard>
        ) : complaints.length === 0 ? (
          <SurfaceCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <MaterialIcons name="inbox" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No complaints yet
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                You haven't submitted any complaints. If you encounter any issues, please submit a complaint.
              </Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => router.push('/dashboard/SupportComplaintsScreen')}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={20} color={colors.textPrimary} />
                <Text style={styles.submitButtonText}>Submit Complaint</Text>
              </TouchableOpacity>
            </View>
          </SurfaceCard>
        ) : (
          <>
            {/* Stats Card */}
            <SurfaceCard style={styles.statsCard}>
              <View style={styles.statsContent}>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{complaints.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statCount, { color: colors.warning }]}>
                    {complaints.filter((c) => c.status === 'pending').length}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statCount, { color: colors.success }]}>
                    {complaints.filter((c) => c.status === 'resolved').length}
                  </Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </View>
              </View>
            </SurfaceCard>

            {/* Complaints List */}
            <View style={styles.listContainer}>
              <ScrollView scrollEnabled={false}>
                {complaints.map((complaint) => renderComplaintCard(complaint))}
              </ScrollView>
            </View>

            {/* Submit New Complaint Button */}
            <TouchableOpacity
              style={styles.newComplaintButton}
              onPress={() => router.push('/dashboard/SupportComplaintsScreen')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.newComplaintButtonText}>Submit New Complaint</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCard: {
    marginTop: spacing.lg,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  errorCard: {
    marginTop: spacing.lg,
    backgroundColor: `${colors.error}05`,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  errorTitle: {
    ...typography.bodyHighlight,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  retryButtonText: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    ...typography.bodyHighlight,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  submitButtonText: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    ...typography.titleLarge,
    color: colors.primary,
    fontSize: 24,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  listContainer: {
    marginBottom: spacing.lg,
  },
  complaintCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  complaintType: {
    ...typography.bodyHighlight,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  createdDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    ...typography.caption,
  },
  messagePreview: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  aiDecisionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  aiDecisionText: {
    ...typography.caption,
    flex: 1,
  },
  confidenceText: {
    ...typography.caption,
    fontSize: 10,
  },
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    ...typography.body,
    color: colors.primary,
  },
  newComplaintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  newComplaintButtonText: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
});
