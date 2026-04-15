import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../app/theme';

interface MockLocationWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const MockLocationWarningModal: React.FC<MockLocationWarningModalProps> = ({
  visible,
  onDismiss,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.centerContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modal}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <MaterialIcons
                name="location-off"
                size={48}
                color={COLORS.error}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Mock Location Detected</Text>

            {/* Description */}
            <Text style={styles.description}>
              We detected that mock location is enabled on your device.
            </Text>

            {/* Warning Details */}
            <View style={styles.detailsBox}>
              <MaterialIcons
                name="info"
                size={18}
                color={COLORS.warning}
                style={styles.detailsIcon}
              />
              <Text style={styles.detailsText}>
                Developer Settings → Remove all mock location apps
              </Text>
            </View>

            {/* Reason */}
            <View style={styles.reasonBox}>
              <Ionicons
                name="lock-closed"
                size={16}
                color={COLORS.success}
                style={styles.reasonIcon}
              />
              <Text style={styles.reasonText}>
                Turn off mock location to receive instant payouts
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Dismiss
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.titleLarge,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsIcon: {
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  detailsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  reasonIcon: {
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  reasonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: COLORS.primaryText,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
});

export default MockLocationWarningModal;
