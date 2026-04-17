import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../../app/theme';

interface ConsentModalProps {
  visible: boolean;
  onAllow: () => void;
  onDecline: () => void;
}

export function ConsentModal({ visible, onAllow, onDecline }: ConsentModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="security" size={28} color={COLORS.primary} />
            </View>
            <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.primaryText }]}>
              Data Sharing Consent
            </Text>
          </View>

          {/* Content Body */}
          <View style={styles.contentSection}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>👉</Text>
              <Text style={[TYPOGRAPHY.body, styles.bulletText]}>
                To provide earnings protection, SteadyPocket securely accesses your delivery activity 
                (such as active days and work location) from your platform (Swiggy/Zomato).
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>👉</Text>
              <View style={styles.bulletText}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.primaryText }]}>
                  This data is used only to:
                </Text>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle, marginTop: 4, marginLeft: 8 }]}>
                  • Verify your work activity{'\n'}
                  • Detect disruptions like rain{'\n'}
                  • Trigger eligible payouts
                </Text>
              </View>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>👉</Text>
              <Text style={[TYPOGRAPHY.body, styles.bulletText]}>
                Your data is handled securely and never shared without your permission.
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          {/* Footer Highlights */}
          <View style={styles.footerHighlight}>
            <MaterialIcons name="gps-fixed" size={20} color={COLORS.secondary} />
            <Text style={[TYPOGRAPHY.label, { color: COLORS.primaryText, marginLeft: 8, flex: 1 }]}>
              We use your GPS to verify payout eligibility
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
            >
              <Text style={[TYPOGRAPHY.bodyHighlight, { color: COLORS.textSubtle }]}>
                ❌ Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.button, styles.allowButton]}
              onPress={onAllow}
            >
              <Text style={[COMPONENTS.buttonPrimaryText, { color: '#FFF' }]}>
                ✅ Allow & Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentSection: {
    gap: 16,
    marginBottom: 20,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletEmoji: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: COLORS.primaryText,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  footerHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.secondary}10`,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}20`,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allowButton: {
    backgroundColor: COLORS.primary,
  },
});
