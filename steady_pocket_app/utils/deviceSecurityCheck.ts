import DeviceInfo from 'react-native-device-info';

/**
 * Result of device security check
 */
export interface MockLocationResult {
  isMockLocation: boolean;
  riskScore: number; // 0.0 - 1.0
  detectionMethod: 'location_spoofing' | 'developer_mode' | 'clean';
  detectedAt: Date;
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    buildFingerprint?: string;
  };
}

/**
 * Check if device is using mock location (GPS spoofing)
 * Includes optional developer mode detection
 *
 * @param uid User ID for logging context
 * @returns MockLocationResult with detection status and risk score
 *
 * Never throws; always returns safe default on error
 */
export async function detectMockLocation(uid: string): Promise<MockLocationResult> {
  try {
    let isMocked = false;
    let isDeveloper = false;

    // Check for mock location
    try {
      isMocked = await DeviceInfo.isLocationMocked();
    } catch (err) {
      console.warn('[DeviceSecurityCheck] isLocationMocked check failed:', err);
      isMocked = false;
    }

    // Check for developer mode
    try {
      isDeveloper = await DeviceInfo.isDeveloperModeEnabled();
    } catch (err) {
      console.warn('[DeviceSecurityCheck] isDeveloperModeEnabled check failed:', err);
      isDeveloper = false;
    }

    // Return high risk if mock location detected
    if (isMocked) {
      return {
        isMockLocation: true,
        riskScore: 0.95,
        detectionMethod: 'location_spoofing',
        detectedAt: new Date(),
      };
    }

    // Medium risk if developer mode enabled (optional check)
    if (isDeveloper) {
      return {
        isMockLocation: false,
        riskScore: 0.3,
        detectionMethod: 'developer_mode',
        detectedAt: new Date(),
      };
    }

    // Clean device
    return {
      isMockLocation: false,
      riskScore: 0.0,
      detectionMethod: 'clean',
      detectedAt: new Date(),
    };
  } catch (error) {
    console.error('[DeviceSecurityCheck] Mock location check failed:', error);
    // Safe default: assume device is clean on error
    return {
      isMockLocation: false,
      riskScore: 0.0,
      detectionMethod: 'clean',
      detectedAt: new Date(),
    };
  }
}
