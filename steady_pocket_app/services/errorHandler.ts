/**
 * Error Handler Service
 * Converts Firebase and network errors to user-friendly messages
 */

export interface AppError {
  message: string;
  code?: string;
  severity: 'info' | 'warning' | 'error';
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Parse Firebase and network errors into user-friendly messages
 */
export const handleError = (error: any): AppError => {
  console.error('[ErrorHandler]', error);

  // Network/Connection Errors
  if (!error) {
    return {
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
    };
  }

  // Check for network connectivity errors
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  // Network unreachable / No internet
  if (
    errorCode.includes('network') ||
    errorMsg.includes('network') ||
    errorMsg.includes('offline') ||
    errorCode === 'enetreset' ||
    errorCode === 'enotfound'
  ) {
    return {
      message: '📡 No internet connection. Please check your network and try again.',
      code: 'NETWORK_ERROR',
      severity: 'error',
    };
  }

  // Timeout errors
  if (
    errorCode.includes('timeout') ||
    errorMsg.includes('timeout') ||
    errorCode === 'etimedout'
  ) {
    return {
      message: '⏱️ Connection timed out. Your network might be slow. Please try again.',
      code: 'TIMEOUT_ERROR',
      severity: 'warning',
    };
  }

  // Slow network detection (Firebase specific)
  if (
    errorMsg.includes('timed out') ||
    errorMsg.includes('deadline exceeded') ||
    errorCode === 'deadline_exceeded'
  ) {
    return {
      message: '🐢 Network is very slow. Please check your connection and try again.',
      code: 'SLOW_NETWORK',
      severity: 'warning',
    };
  }

  // Firebase specific errors
  if (errorCode.includes('firestore')) {
    if (
      errorMsg.includes('failed to get document') ||
      errorMsg.includes('could not reach cloud firestore')
    ) {
      return {
        message:
          "🔌 Can't connect to server. Please check your internet and try again.",
        code: 'FIRESTORE_CONNECTION_ERROR',
        severity: 'error',
      };
    }

    if (errorMsg.includes('permission denied')) {
      return {
        message: '🔒 You do not have permission to access this resource.',
        code: 'PERMISSION_DENIED',
        severity: 'error',
      };
    }

    if (errorMsg.includes('not found')) {
      return {
        message: '🔍 The requested resource was not found.',
        code: 'NOT_FOUND',
        severity: 'warning',
      };
    }
  }

  // Firebase Auth errors
  if (errorCode.includes('auth')) {
    if (errorCode.includes('invalid-phone-number')) {
      return {
        message: '📱 Please enter a valid phone number.',
        code: 'INVALID_PHONE',
        severity: 'warning',
      };
    }

    if (errorCode.includes('too-many-requests')) {
      return {
        message: '⏸️ Too many attempts. Please try again later.',
        code: 'TOO_MANY_REQUESTS',
        severity: 'warning',
      };
    }

    if (errorCode.includes('user-disabled')) {
      return {
        message: '🚫 This account has been disabled.',
        code: 'USER_DISABLED',
        severity: 'error',
      };
    }

    if (errorCode.includes('invalid-verification-code')) {
      return {
        message: '❌ Invalid OTP code. Please check and try again.',
        code: 'INVALID_OTP',
        severity: 'warning',
      };
    }

    if (errorCode.includes('code-expired')) {
      return {
        message: '⏰ OTP code has expired. Please request a new one.',
        code: 'CODE_EXPIRED',
        severity: 'warning',
      };
    }

    if (errorCode.includes('session-expired')) {
      return {
        message: '🔐 Your session has expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
        severity: 'warning',
      };
    }
  }

  // Generic Firebase errors
  if (
    errorMsg.includes('internal') ||
    errorMsg.includes('unknown error') ||
    errorCode === 'internal'
  ) {
    return {
      message:
        '⚙️ Server error. Please try again in a few moments.',
      code: 'INTERNAL_ERROR',
      severity: 'error',
    };
  }

  // Specific Firebase error messages
  if (errorMsg.includes('phone number')) {
    return {
      message: '📱 Phone number verification failed. Please try again.',
      code: 'PHONE_VERIFICATION_ERROR',
      severity: 'warning',
    };
  }

  if (errorMsg.includes('user not found')) {
    return {
      message:
        '👤 User not found. Please check your credentials and try again.',
      code: 'USER_NOT_FOUND',
      severity: 'warning',
    };
  }

  if (errorMsg.includes('not registered')) {
    return {
      message:
        "⚠️ This phone number is not registered. Please verify with your app account.",
      code: 'USER_NOT_REGISTERED',
      severity: 'warning',
    };
  }

  // Default error message
  return {
    message:
      '❌ Something went wrong. Please try again or contact support if the problem persists.',
    code: 'UNKNOWN_ERROR',
    severity: 'error',
  };
};

/**
 * Handle Firebase real-time listener errors (for onSnapshot, etc.)
 */
export const handleFirestoreListenerError = (error: any): AppError => {
  console.error('[FirestoreListenerError]', error);

  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  // Network errors while listening
  if (errorMsg.includes('network') || errorMsg.includes('offline')) {
    return {
      message:
        '📡 Lost connection. Trying to reconnect... Your data may be loading soon.',
      code: 'LISTENER_NETWORK_ERROR',
      severity: 'info',
    };
  }

  if (
    errorMsg.includes('permission denied') ||
    errorCode.includes('permission')
  ) {
    return {
      message:
        '🔒 You do not have permission to view this data.',
      code: 'LISTENER_PERMISSION_ERROR',
      severity: 'error',
    };
  }

  // For listeners, we often want to not show errors as they auto-retry
  // But we return a message in case the caller wants to show it
  return {
    message:
      '⚠️ Unable to load data. Please check your connection.',
    code: 'LISTENER_ERROR',
    severity: 'warning',
  };
};
