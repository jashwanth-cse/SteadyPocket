import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { AppScreen } from '../../src/templates/AppScreen';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../../app/theme';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getUserDocIdByAuthUid } from '../../services/authService';
import * as Location from 'expo-location';

export default function ConsentScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!agreed) return;
    setLoading(true);

    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userDocId = await getUserDocIdByAuthUid(uid);
        if (userDocId) {
          await updateDoc(doc(db, 'users', userDocId), { consent_given: true });
        }
      }

      // Prompt location organically
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is highly recommended to protect your earnings.');
      }

      router.replace('/premium-payment');
    } catch (err) {
      console.error('Error saving consent:', err);
      Alert.alert('Error', 'Could not save your preferences. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = () => {
    router.back();
  };

  return (
    <AppScreen title="Data Sharing Consent" showBack>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <SurfaceCard style={styles.card}>
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={40} color={COLORS.secondary} />
            </View>
          </View>

          <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.primaryText, textAlign: 'center', marginBottom: 16 }]}>
            Secure Data Access
          </Text>

          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, textAlign: 'center', marginBottom: 24, lineHeight: 24 }]}>
            To provide earnings protection, SteadyPocket securely accesses your delivery activity (such as active days and work location) from your platform (Swiggy/Zomato).
          </Text>

          <View style={styles.infoBox}>
            <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 12 }]}>
              This data is used only to:
            </Text>
            
            <View style={styles.listItem}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
              <Text style={styles.listText}>Verify your work activity</Text>
            </View>
            
            <View style={styles.listItem}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
              <Text style={styles.listText}>Detect disruptions like rain or roadblocks</Text>
            </View>
            
            <View style={styles.listItem}>
              <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
              <Text style={styles.listText}>Trigger eligible automatic payouts</Text>
            </View>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color={COLORS.success} />
            <Text style={[TYPOGRAPHY.label, { color: COLORS.success, marginLeft: 6 }]}>
              Your data is handled securely and never shared without permission.
            </Text>
          </View>

          {/* Agreement Checkbox */}
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setAgreed(!agreed)}
            style={styles.checkboxContainer}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={[TYPOGRAPHY.body, { flex: 1, color: COLORS.primaryText }]}>
              I have read and agree to share my platform data for policy verification.
            </Text>
          </TouchableOpacity>
        </SurfaceCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.denyButton]} 
            onPress={handleDeny}
            disabled={loading}
          >
            <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.textSubtle }]}>Decline & Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              COMPONENTS.buttonPrimary, 
              styles.allowButton, 
              !agreed && styles.buttonDisabled
            ]} 
            onPress={handleContinue}
            disabled={!agreed || loading}
          >
            <Text style={COMPONENTS.buttonPrimaryText}>Allow & Continue</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: `${COLORS.primary}08`,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primaryText,
    marginLeft: 12,
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.success}10`,
    padding: 12,
    borderRadius: 12,
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  actions: {
    gap: 16,
    marginBottom: 40,
  },
  allowButton: {
    backgroundColor: COLORS.secondary,
    width: '100%',
  },
  denyButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.7,
  }
});
