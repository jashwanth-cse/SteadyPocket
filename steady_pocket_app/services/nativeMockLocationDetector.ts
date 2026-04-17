/**
 * Native Module for Android Mock Location Detection
 *
 * This module provides native access to Android's location mock detection capabilities.
 * It checks:
 * 1. LocationManager.isFromMockProvider() - checks if location comes from mock provider
 * 2. Settings.Secure.ALLOW_MOCK_LOCATION - checks if mock location is enabled in Dev Options
 * 3. Location provider analysis - detects spoof patterns
 */

import { Platform } from 'react-native';
import { NativeModules } from 'react-native';

/**
 * Native module for Android-specific mock location detection
 * Must be linked in android/app/src/main/java/
 */
const { MockLocationDetector } = NativeModules;

export interface LocationMockAnalysis {
  isFromMockProvider: boolean;     // LocationManager level check
  allowMockLocationEnabled: boolean; // Settings.Secure check
  isMocked: boolean;               // Combined analysis
  confidence: number;              // 0.0 - 1.0 confidence score
  details: {
    provider?: string;
    accuracy?: number;
    timestamp: number;
    method: string[];              // Methods used for detection
  };
}

/**
 * Check if device has mock location enabled through Developer Options
 * Uses native Android APIs:
 * - LocationManager.isFromMockProvider()
 * - Settings.Secure.ALLOW_MOCK_LOCATION
 *
 * @returns LocationMockAnalysis with detailed detection results
 */
export async function checkMockLocationNative(): Promise<LocationMockAnalysis> {
  // Only available on Android
  if (Platform.OS !== 'android') {
    return {
      isFromMockProvider: false,
      allowMockLocationEnabled: false,
      isMocked: false,
      confidence: 0,
      details: {
        timestamp: Date.now(),
        method: [],
      },
    };
  }

  try {
    if (!MockLocationDetector) {
      console.warn('[MockLocationDetector] Native module not available');
      return {
        isFromMockProvider: false,
        allowMockLocationEnabled: false,
        isMocked: false,
        confidence: 0,
        details: {
          timestamp: Date.now(),
          method: ['fallback-no-native-module'],
        },
      };
    }

    // Call native module
    const result = await MockLocationDetector.checkMockLocation();

    return {
      isFromMockProvider: result.isFromMockProvider || false,
      allowMockLocationEnabled: result.allowMockLocation || false,
      isMocked: (result.isFromMockProvider || result.allowMockLocation) || false,
      confidence: result.confidence || (result.isFromMockProvider ? 0.95 : 0),
      details: {
        provider: result.provider,
        accuracy: result.accuracy,
        timestamp: result.timestamp || Date.now(),
        method: result.methods || [],
      },
    };
  } catch (error) {
    console.error('[MockLocationDetector] Native check failed:', error);
    // Fallback on error
    return {
      isFromMockProvider: false,
      allowMockLocationEnabled: false,
      isMocked: false,
      confidence: 0,
      details: {
        timestamp: Date.now(),
        method: ['error-fallback'],
      },
    };
  }
}
