import DeviceInfo from 'react-native-device-info';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { checkMockLocationNative } from '../services/nativeMockLocationDetector';

/**
 * Result of device security check
 */
export interface MockLocationResult {
  isMockLocation: boolean;
  riskScore: number; // 0.0 - 1.0
  detectionMethod: 'location_spoofing' | 'developer_mode' | 'clean' | 'accuracy_analysis' | 'native_check';
  detectedAt: Date;
  confidence: number;
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    buildFingerprint?: string;
  };
  details?: {
    provider?: string;
    accuracy?: number;
    nativeCheckResult?: any;
    methods?: string[];
  };
}

/**
 * Check if device is using mock location (GPS spoofing)
 *
 * Multiple detection methods:
 * 1. Native Android API (LocationManager.isFromMockProvider) - Most accurate
 * 2. Settings.Secure.ALLOW_MOCK_LOCATION - Checks Dev Options
 * 3. Location accuracy analysis - Detects spoofing patterns
 * 4. Emulator detection - Checks device model/brand
 *
 * @returns MockLocationResult with detection status and risk score
 *
 * Never throws; always returns safe default on error
 */
export async function detectMockLocation(): Promise<MockLocationResult> {
  try {
    // Step 1: Try native Android detection (most accurate)
    if (Platform.OS === 'android') {
      try {
        const nativeResult = await checkMockLocationNative();
        if (nativeResult.isMocked) {
          return {
            isMockLocation: true,
            riskScore: 0.95,
            detectionMethod: 'native_check',
            detectedAt: new Date(),
            confidence: nativeResult.confidence || 0.95,
            details: {
              provider: nativeResult.details?.provider,
              accuracy: nativeResult.details?.accuracy,
              nativeCheckResult: nativeResult,
              methods: nativeResult.details?.method,
            },
          };
        }
      } catch (err) {
        console.warn('[DeviceSecurityCheck] Native check failed, falling back to JS methods:', err);
        // Continue with JS-based detection
      }
    }

    // Step 2: Emulator/Simulator detection
    const isEmulatorResult = await checkEmulator();
    if (isEmulatorResult.isEmulator) {
      return {
        isMockLocation: true,
        riskScore: 0.85,
        detectionMethod: 'developer_mode',
        detectedAt: new Date(),
        confidence: 0.85,
        details: {
          methods: ['emulator-detection'],
        },
      };
    }

    // Step 3: Location accuracy analysis (heuristic-based)
    const accuracyResult = await checkLocationAccuracyPattern();
    if (accuracyResult.isSuspicious) {
      return {
        isMockLocation: true,
        riskScore: accuracyResult.riskScore,
        detectionMethod: 'accuracy_analysis',
        detectedAt: new Date(),
        confidence: accuracyResult.confidence,
        details: {
          accuracy: accuracyResult.accuracy,
          provider: accuracyResult.provider,
          methods: accuracyResult.methods,
        },
      };
    }

    // Step 4: All checks passed - device is clean
    return {
      isMockLocation: false,
      riskScore: 0.0,
      detectionMethod: 'clean',
      detectedAt: new Date(),
      confidence: 0.95,
      details: {
        methods: ['all-checks-passed'],
      },
    };
  } catch (error) {
    console.error('[DeviceSecurityCheck] Mock location check failed:', error);
    // Safe default: assume device is clean on error
    return {
      isMockLocation: false,
      riskScore: 0.0,
      detectionMethod: 'clean',
      detectedAt: new Date(),
      confidence: 0.0,
    };
  }
}

/**
 * Check if device is emulator/simulator (common mock location source)
 */
async function checkEmulator(): Promise<{ isEmulator: boolean }> {
  try {
    const model = DeviceInfo.getModel();
    const brand = DeviceInfo.getBrand();

    const isEmulator =
      (model && (model.toLowerCase().includes('emulator') || model.toLowerCase().includes('simulator'))) ||
      (brand && brand.toLowerCase().includes('generic'));

    if (isEmulator) {
      console.log('[DeviceSecurityCheck] Emulator detected:', { model, brand });
      return { isEmulator: true };
    }

    return { isEmulator: false };
  } catch (err) {
    console.warn('[DeviceSecurityCheck] Emulator check failed:', err);
    return { isEmulator: false };
  }
}

/**
 * Analyze location accuracy patterns to detect spoofing
 *
 * Heuristics:
 * - Perfect accuracy (0.0m) is suspicious
 * - Suspiciously perfect GPS accuracy (< 1m) is suspicious
 * - Multiple readings with identical accuracy suggests spoofing
 * - GPS accuracy variation pattern analysis
 *
 * @returns Analysis result with risk score
 */
async function checkLocationAccuracyPattern(): Promise<{
  isSuspicious: boolean;
  riskScore: number;
  confidence: number;
  accuracy?: number;
  provider?: string;
  methods: string[];
}> {
  const methods: string[] = [];

  try {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('[DeviceSecurityCheck] Location permission not granted');
      return {
        isSuspicious: false,
        riskScore: 0.0,
        confidence: 0.0,
        methods: ['permission-denied'],
      };
    }

    // Get multiple location readings to analyze patterns
    const readings: Location.LocationObject[] = [];

    for (let i = 0; i < 3; i++) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        readings.push(location);
        if (i < 2) {
          // Wait between readings
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) {
        console.warn('[DeviceSecurityCheck] Could not get location reading:', err);
      }
    }

    if (readings.length === 0) {
      return {
        isSuspicious: false,
        riskScore: 0.0,
        confidence: 0.0,
        methods: ['no-location-data'],
      };
    }

    const firstReading = readings[0];
    const accuracy = firstReading.coords.accuracy ?? 0;

    // Check 1: Perfect accuracy (0.0m)
    if (accuracy === 0.0) {
      console.log('[DeviceSecurityCheck] Perfect accuracy (0.0m) detected - suspicious');
      methods.push('perfect-accuracy');
      return {
        isSuspicious: true,
        riskScore: 0.9,
        confidence: 0.9,
        accuracy: accuracy || undefined,
        methods,
      };
    }

    // Check 2: Suspiciously perfect GPS accuracy (< 1m)
    if (accuracy < 1.0 && accuracy > 0) {
      console.log('[DeviceSecurityCheck] Suspiciously perfect accuracy:', accuracy);
      methods.push('perfect-gps-accuracy');
      return {
        isSuspicious: true,
        riskScore: 0.75,
        confidence: 0.75,
        accuracy: accuracy || undefined,
        methods,
      };
    }

    // Check 3: All readings have identical accuracy (spoofing signature)
    if (readings.length >= 2) {
      const allSame = readings.every(r => r.coords.accuracy === accuracy);
      if (allSame && accuracy !== null) {
        console.log('[DeviceSecurityCheck] Identical accuracy across readings - suspicious pattern');
        methods.push('identical-accuracy-pattern');
        return {
          isSuspicious: true,
          riskScore: 0.7,
          confidence: 0.7,
          accuracy: accuracy || undefined,
          methods,
        };
      }
    }

    // Check 4: Accuracy variation pattern (real GPS varies more)
    if (readings.length >= 3) {
      const accuracies = readings
        .map(r => r.coords.accuracy)
        .filter((a): a is number => a !== null && a > 0);

      if (accuracies.length >= 2) {
        const variance = calculateVariance(accuracies);
        // Real GPS has variance > 0.1, spoofed has variance near 0
        if (variance < 0.05 && accuracy > 0) {
          console.log('[DeviceSecurityCheck] Very low accuracy variance - suspicious', variance);
          methods.push('low-variance-pattern');
          return {
            isSuspicious: true,
            riskScore: 0.65,
            confidence: 0.65,
            accuracy: accuracy || undefined,
            methods,
          };
        }
      }
    }

    // All checks passed - location looks legitimate
    return {
      isSuspicious: false,
      riskScore: 0.0,
      confidence: 0.8,
      accuracy: accuracy || undefined,
      methods: ['all-accuracy-checks-passed'],
    };
  } catch (error) {
    console.error('[DeviceSecurityCheck] Accuracy analysis failed:', error);
    return {
      isSuspicious: false,
      riskScore: 0.0,
      confidence: 0.0,
      methods: ['error-in-analysis'],
    };
  }
}

/**
 * Calculate variance of accuracy readings
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

