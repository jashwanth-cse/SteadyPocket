/**
 * Toast Component - Display error, warning, and info messages
 * Used by the error handler to show user-friendly messages
 */

import React, { useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type ToastSeverity = 'info' | 'warning' | 'error' | 'success';

export interface ToastMessage {
  id: string;
  message: string;
  severity: ToastSeverity;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const [animation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Slide in animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      handleDismiss();
    }, message.duration || 4000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      onDismiss(message.id);
    });
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  // Color scheme based on severity
  const severityConfig = {
    info: {
      bg: '#E0F2FE',
      border: '#0EA5E9',
      text: '#075985',
      icon: 'information-circle',
    },
    success: {
      bg: '#DCFCE7',
      border: '#22C55E',
      text: '#166534',
      icon: 'checkmark-circle',
    },
    warning: {
      bg: '#FEF3C7',
      border: '#FBBF24',
      text: '#92400E',
      icon: 'alert-circle',
    },
    error: {
      bg: '#FEE2E2',
      border: '#EF4444',
      text: '#7F1D1D',
      icon: 'alert-circle',
    },
  };

  const config = severityConfig[message.severity];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          top: insets.top + 12,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.bg,
            borderLeftColor: config.border,
          },
        ]}
      >
        <View style={styles.content}>
          <Ionicons
            name={config.icon as any}
            size={20}
            color={config.border}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text
              style={[styles.message, { color: config.text }]}
              numberOfLines={2}
            >
              {message.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={config.text} />
          </TouchableOpacity>
        </View>

        {message.action && (
          <TouchableOpacity
            onPress={() => {
              message.action?.handler();
              handleDismiss();
            }}
            style={[styles.actionButton, { borderTopColor: config.border }]}
          >
            <Text style={[styles.actionText, { color: config.border }]}>
              {message.action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Toast Provider component - Mount once in your root layout
 * Manages all toast messages in the app
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    message: string,
    severity: ToastSeverity = 'info',
    duration?: number,
    action?: ToastMessage['action']
  ) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      id,
      message,
      severity,
      duration,
      action,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Store in a global ref for easy access
  (global as any).toastManager = {
    addToast,
    removeToast,
    showError: (msg: string, duration?: number, action?: ToastMessage['action']) =>
      addToast(msg, 'error', duration, action),
    showWarning: (msg: string, duration?: number, action?: ToastMessage['action']) =>
      addToast(msg, 'warning', duration, action),
    showSuccess: (msg: string, duration?: number) =>
      addToast(msg, 'success', duration),
    showInfo: (msg: string, duration?: number) =>
      addToast(msg, 'info', duration),
  };

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast}
          onDismiss={removeToast}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  toast: {
    borderLeftWidth: 4,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

/**
 * Helper to show toast from anywhere in the app
 */
export const showToast = (
  message: string,
  severity: ToastSeverity = 'info',
  duration?: number,
  action?: ToastMessage['action']
) => {
  try {
    const manager = (global as any).toastManager;
    if (manager) {
      return manager.addToast(message, severity, duration, action);
    }
  } catch (e) {
    console.warn('[Toast] Could not show toast:', e);
  }
};

export const showError = (message: string, duration?: number, action?: ToastMessage['action']) =>
  showToast(message, 'error', duration, action);

export const showWarning = (message: string, duration?: number, action?: ToastMessage['action']) =>
  showToast(message, 'warning', duration, action);

export const showSuccess = (message: string, duration?: number) =>
  showToast(message, 'success', duration);

export const showInfo = (message: string, duration?: number) =>
  showToast(message, 'info', duration);
