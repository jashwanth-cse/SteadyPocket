import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { InputField } from '../../src/components/ui/InputField';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getUserDocIdByAuthUid } from '../../services/authService';

type ComplaintType = 'payout_not_received' | 'incorrect_payout' | 'technical_issue' | 'other';

const COMPLAINT_TYPES: { label: string; value: ComplaintType }[] = [
  { label: 'Payout not received', value: 'payout_not_received' },
  { label: 'Incorrect payout', value: 'incorrect_payout' },
  { label: 'Technical issue', value: 'technical_issue' },
  { label: 'Other', value: 'other' },
];

export default function SupportComplaintsScreen() {
  const router = useRouter();
  const [complaintType, setComplaintType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ complaintType?: string; description?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!complaintType) {
      newErrors.complaintType = 'Please select a complaint type';
    }

    if (!description.trim()) {
      newErrors.description = 'Please enter a description';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      // Get the actual user document ID
      const userDocId = await getUserDocIdByAuthUid(uid);
      if (!userDocId) {
        Alert.alert('Error', 'Could not find user information');
        setLoading(false);
        return;
      }

      // Add complaint to Firestore
      await addDoc(collection(db, 'complaints'), {
        user_id: userDocId,
        complaint_type: complaintType,
        message: description.trim(),
        status: 'pending',
        ai_decision: null,
        confidence: null,
        created_at: serverTimestamp(),
      });

      Alert.alert(
        'Success',
        'Your complaint has been submitted. We will review it shortly.',
        [
          {
            text: 'View My Complaints',
            onPress: () => router.replace('/dashboard/MyComplaintsScreen'),
          },
          {
            text: 'Go Home',
            onPress: () => router.replace('/dashboard/HomeScreen'),
          },
        ]
      );

      // Clear form
      setComplaintType(null);
      setDescription('');
      setErrors({});
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeLabel = COMPLAINT_TYPES.find((t) => t.value === complaintType)?.label;

  return (
    <AppScreen
      title="Support & Complaints"
      showBack
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/dashboard/HomeScreen');
        }
      }}
    >
      <View style={styles.container}>
        {/* Instructions Card */}
        <SurfaceCard style={styles.instructionsCard}>
          <View style={styles.instructionsContent}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={[styles.instructionsText, { color: colors.textPrimary }]}>
              Describe your issue in detail. Our support team will review and respond to your complaint shortly.
            </Text>
          </View>
        </SurfaceCard>

        {/* Complaint Type Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Complaint Type *</Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              errors.complaintType && styles.dropdownError,
              isDropdownOpen && styles.dropdownFocused,
            ]}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropdownText,
                !complaintType && { color: colors.textSecondary },
              ]}
            >
              {selectedTypeLabel || 'Select complaint type'}
            </Text>
            <MaterialIcons
              name={isDropdownOpen ? 'expand-less' : 'expand-more'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {COMPLAINT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.dropdownOption,
                    complaintType === type.value && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setComplaintType(type.value);
                    setIsDropdownOpen(false);
                    setErrors({ ...errors, complaintType: undefined });
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      complaintType === type.value && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {complaintType === type.value && (
                    <MaterialIcons name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {errors.complaintType && (
            <Text style={styles.errorText}>{errors.complaintType}</Text>
          )}
        </View>

        {/* Description Input */}
        <InputField
          label="Description *"
          placeholder="Tell us what happened in detail..."
          multiline
          numberOfLines={6}
          maxLength={500}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setErrors({ ...errors, description: undefined });
          }}
          containerStyle={styles.descriptionField}
          style={styles.descriptionInput}
        />

        {/* Character count */}
        <Text style={styles.charCount}>
          {description.length}/500
        </Text>

        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color={colors.textPrimary} />
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            </>
          )}
        </TouchableOpacity>

        {/* View My Complaints Link */}
        <TouchableOpacity
          style={styles.viewComplaintsLink}
          onPress={() => router.replace('/dashboard/MyComplaintsScreen')}
          activeOpacity={0.7}
        >
          <Text style={styles.viewComplaintsText}>View My Complaints</Text>
          <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  instructionsCard: {
    marginBottom: spacing.lg,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  instructionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  instructionsText: {
    flex: 1,
    ...typography.body,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: 56,
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  dropdownFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface1,
  },
  dropdownError: {
    borderColor: colors.error,
  },
  dropdownText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  dropdownMenu: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surface3,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface3,
  },
  dropdownOptionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  dropdownOptionText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
  },
  descriptionField: {
    marginBottom: spacing.sm,
  },
  descriptionInput: {
    textAlignVertical: 'top',
    minHeight: 120,
    paddingVertical: spacing.md,
  },
  charCount: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.md,
    marginRight: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    marginBottom: spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginVertical: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
  },
  viewComplaintsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  viewComplaintsText: {
    ...typography.body,
    color: colors.primary,
  },
});
