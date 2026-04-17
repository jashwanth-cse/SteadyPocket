import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { TYPOGRAPHY, COLORS, COMPONENTS } from '../../app/theme';
import { Stack } from '../../src/components/layout/Stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../services/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { getUserDocIdByAuthUid } from '../../services/authService';

interface UserProfile {
  emp_name?: string;
  phone?: string;
  partner_id?: string;
  platform?: string;
  work_location?: string;
  weekly_salary?: number;
  risk_score?: number;
  status?: string;
  profile_pic_url?: string;
  user_id?: string;
  verification_status?: string;
  created_at?: any;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDocId, setUserDocId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/phone-auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteData = () => {
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      if (userDocId) {
        await updateDoc(doc(db, 'users', userDocId), { 
          verification_status: 'pending',
          consent_given: false 
        });
      }
      await auth.signOut();
      setShowDeleteModal(false);
      router.replace('/phone-auth');
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setLoading(false);
          return;
        }

        // Get the actual user document ID
        const fetchedUserDocId = await getUserDocIdByAuthUid(uid);
        if (!fetchedUserDocId) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }
        setUserDocId(fetchedUserDocId);

        const userRef = doc(db, 'users', fetchedUserDocId);
        unsubscribe = onSnapshot(
          userRef,
          (userSnap) => {
            if (userSnap.exists()) {
              setUserData(userSnap.data() as UserProfile);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to profile:', error);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up profile listener:', err);
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  const getRiskColor = (score?: number) => {
    if (!score) return COLORS.textSubtle;
    if (score <= 0.3) return COLORS.success;
    if (score <= 0.6) return COLORS.secondary;
    return COLORS.error;
  };

  const getRiskLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score <= 0.3) return 'Low Risk';
    if (score <= 0.6) return 'Medium Risk';
    return 'High Risk';
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return COLORS.success;
      case 'suspended':
        return COLORS.error;
      case 'under_review':
        return COLORS.secondary;
      default:
        return COLORS.textSubtle;
    }
  };

  const ProfileDetailRow = ({ icon, label, value, color = COLORS.primary }: { icon: any, label: string, value: string | undefined, color?: string }) => (
    <View style={styles.detailRow}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.detailContent}>
        <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle }]}>{label}</Text>
        <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, marginTop: 4 }]}>
          {value || 'N/A'}
        </Text>
      </View>
    </View>
  );

  return (
    <AppScreen title="Profile" showBack>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <SurfaceCard>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, marginTop: 12 }]}>
                Loading profile...
              </Text>
            </View>
          </SurfaceCard>
        ) : userData ? (
          <Stack gap={16}>
            {/* Profile Header Card */}
            <SurfaceCard style={styles.headerCard}>
              <View style={styles.headerContent}>
                {/* Profile Picture */}
                <View style={styles.profilePicContainer}>
                  {userData?.profile_pic_url ? (
                    <Image
                      source={{ uri: userData.profile_pic_url }}
                      style={styles.profilePic}
                    />
                  ) : (
                    <View style={[styles.profilePic, { backgroundColor: `${COLORS.primary}20` }]}>
                      <Ionicons name="person" size={40} color={COLORS.primary} />
                    </View>
                  )}
                </View>

                {/* Name and Status */}
                <View style={styles.headerText}>
                  <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.primaryText }]}>
                    {userData?.emp_name || 'Delivery Partner'}
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(userData?.status)}15` },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(userData?.status) },
                        ]}
                      />
                      <Text
                        style={[
                          TYPOGRAPHY.label,
                          { color: getStatusColor(userData?.status), marginLeft: 4 },
                        ]}
                      >
                        {(userData?.status || 'active').charAt(0).toUpperCase() +
                          (userData?.status || 'active').slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </SurfaceCard>

            {/* Basic Information */}
            <SurfaceCard style={styles.card}>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
                Basic Information
              </Text>
              <Stack gap={12}>
                <ProfileDetailRow
                  icon="phone"
                  label="Phone Number"
                  value={userData?.phone || 'N/A'}
                  color={COLORS.primary}
                />
                <ProfileDetailRow
                  icon="person-outline"
                  label="User ID"
                  value={userData?.user_id || 'N/A'}
                  color={COLORS.secondary}
                />
                <ProfileDetailRow
                  icon="local-shipping"
                  label="Partner ID"
                  value={userData?.partner_id || 'N/A'}
                  color={COLORS.secondary}
                />
              </Stack>
            </SurfaceCard>

            {/* Work Information */}
            <SurfaceCard style={styles.card}>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
                Work Information
              </Text>
              <Stack gap={12}>
                <ProfileDetailRow
                  icon="domain"
                  label="Platform"
                  value={userData?.platform || 'N/A'}
                  color={COLORS.primary}
                />
                <ProfileDetailRow
                  icon="location-on"
                  label="Work Location"
                  value={userData?.work_location || 'N/A'}
                  color={COLORS.primary}
                />
                <ProfileDetailRow
                  icon="trending-up"
                  label="Weekly Salary"
                  value={`₹${userData?.weekly_salary?.toLocaleString('en-IN') || '0'}`}
                  color={COLORS.success}
                />
              </Stack>
            </SurfaceCard>

            {/* Security & Verification */}
            <SurfaceCard style={styles.card}>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
                Security & Verification
              </Text>
              <Stack gap={12}>
                <ProfileDetailRow
                  icon="verified-user"
                  label="Risk Score"
                  value={`${getRiskLabel(userData?.risk_score)} (${(userData?.risk_score || 0).toFixed(2)})`}
                  color={getRiskColor(userData?.risk_score)}
                />
                <ProfileDetailRow
                  icon="check-circle"
                  label="Verification Status"
                  value={
                    userData?.verification_status
                      ?.split('_')
                      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ') || 'Pending'
                  }
                  color={userData?.verification_status === 'kyc_complete' ? COLORS.success : COLORS.secondary}
                />
              </Stack>
            </SurfaceCard>

            {/* Account Details */}
            <SurfaceCard style={styles.card}>
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 16 }]}>
                Account Details
              </Text>
              <Stack gap={12}>
                <View style={styles.detailRow}>
                  <View style={[styles.iconBox, { backgroundColor: `${COLORS.textSubtle}15` }]}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.textSubtle} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[TYPOGRAPHY.label, { color: COLORS.textSubtle }]}>
                      Member Since
                    </Text>
                    <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.primaryText, marginTop: 4 }]}>
                      {formatDate(userData?.created_at)}
                    </Text>
                  </View>
                </View>
              </Stack>
            </SurfaceCard>

            {/* Logout and Delete Actions */}
            <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 32, gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogout}
                style={[
                  COMPONENTS.buttonPrimary,
                  {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: COLORS.textSubtle,
                    flexDirection: 'row',
                    gap: 8,
                  },
                ]}
              >
                <MaterialIcons name="logout" size={20} color={COLORS.textSubtle} />
                <Text style={[COMPONENTS.buttonPrimaryText, { color: COLORS.textSubtle }]}>
                  Logout Securely
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDeleteData}
                style={[
                  COMPONENTS.buttonPrimary,
                  {
                    backgroundColor: `${COLORS.error}10`,
                    borderWidth: 1.5,
                    borderColor: COLORS.error,
                    flexDirection: 'row',
                    gap: 8,
                  },
                ]}
              >
                <MaterialIcons name="delete-forever" size={20} color={COLORS.error} />
                <Text style={[COMPONENTS.buttonPrimaryText, { color: COLORS.error }]}>
                  Delete All My Data
                </Text>
              </TouchableOpacity>
            </View>
          </Stack>
        ) : (
          <SurfaceCard>
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
              <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginTop: 12 }]}>
                Profile Not Found
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, marginTop: 8 }]}>
                Unable to load your profile information.
              </Text>
            </View>
          </SurfaceCard>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <MaterialIcons name="delete-forever" size={32} color={COLORS.error} />
            </View>
            <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, textAlign: 'center', marginBottom: 8 }]}>
              Delete All Data
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, textAlign: 'center', marginBottom: 24 }]}>
              Are you sure you want to delete your data? This will reset your profile and log you out securely.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.textSubtle }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.error }]}
                onPress={executeDelete}
              >
                <Text style={[COMPONENTS.buttonPrimaryText, { color: '#FFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  headerCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  profilePicContainer: {
    marginRight: 8,
  },
  profilePic: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  statusRow: {
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
