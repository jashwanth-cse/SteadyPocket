/**
 * useErrorHandler Hook
 * Combines error handling, network detection, and toast notifications
 */

import { useCallback, useEffect, useState } from 'react';
import { handleError, handleFirestoreListenerError, AppError } from '../services/errorHandler';
import { useNetworkStatus } from './useNetworkStatus';

interface ToastHandlers {
  showError: (msg: string, duration?: number) => void;
  showWarning: (msg: string, duration?: number) => void;
  showInfo: (msg: string, duration?: number) => void;
}

export const useErrorHandler = () => {
  const networkStatus = useNetworkStatus();
  const [toastHandlers, setToastHandlers] = useState<ToastHandlers | null>(null);

  // Get toast handlers from global manager when component mounts
  useEffect(() => {
    const manager = (global as any).toastManager;
    if (manager) {
      setToastHandlers({
        showError: manager.showError,
        showWarning: manager.showWarning,
        showInfo: manager.showInfo,
      });
    }
  }, []);

  /**
   * Handle and display an error
   */
  const handleAndShowError = useCallback(
    (error: any, context?: string): AppError => {
      // Check network first
      if (!networkStatus.isConnected) {
        toastHandlers?.showError('📡 No internet connection. Please check your network.');
        return {
          message: 'No internet connection',
          code: 'NO_INTERNET',
          severity: 'error',
        };
      }

      if (networkStatus.isSlowConnection) {
        toastHandlers?.showWarning(
          '🐢 Your network is slow. Operations may take longer to complete.'
        );
      }

      // Parse the error
      const appError = handleError(error);

      // Log context if provided
      if (context) {
        console.error(`[${context}]`, appError);
      }

      // Show toast notification
      if (toastHandlers) {
        if (appError.severity === 'error') {
          toastHandlers.showError(appError.message);
        } else if (appError.severity === 'warning') {
          toastHandlers.showWarning(appError.message);
        } else {
          toastHandlers.showInfo(appError.message);
        }
      }

      return appError;
    },
    [networkStatus, toastHandlers]
  );

  /**
   * Handle Firestore listener errors (usually silent, but can be shown if needed)
   */
  const handleFirestoreError = useCallback(
    (error: any, shouldShow: boolean = false) => {
      const appError = handleFirestoreListenerError(error);

      if (shouldShow && toastHandlers) {
        if (appError.severity === 'error') {
          toastHandlers.showError(appError.message);
        } else if (appError.severity === 'warning') {
          toastHandlers.showWarning(appError.message);
        }
      }

      return appError;
    },
    [toastHandlers]
  );

  /**
   * Show a custom error message
   */
  const showCustomError = useCallback(
    (message: string, duration?: number) => {
      toastHandlers?.showError(message, duration);
    },
    [toastHandlers]
  );

  /**
   * Show a warning message
   */
  const showCustomWarning = useCallback(
    (message: string, duration?: number) => {
      toastHandlers?.showWarning(message, duration);
    },
    [toastHandlers]
  );

  /**
   * Show a success message
   */
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      toastHandlers?.showInfo(message, duration);
    },
    [toastHandlers]
  );

  return {
    networkStatus,
    handleAndShowError,
    handleFirestoreError,
    showCustomError,
    showCustomWarning,
    showSuccess,
  };
};
