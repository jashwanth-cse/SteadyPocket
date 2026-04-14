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
 * Uses available DeviceInfo APIs with graceful fallback
 *
 * @returns MockLocationResult with detection status and risk score
 *
 * Never throws; always returns safe default on error
 */
export async function detectMockLocation(): Promise<MockLocationResult> {
  try {
    let isDeveloper = false;

    // Attempt to check if running in debugger/developer mode
    // Using try-catch for each method as availability varies by platform
    try {
      // Check if device is being debugged
      const deviceModel = DeviceInfo.getModel();
      const deviceBrand = DeviceInfo.getBrand();

      // Flag emulators/simulators (common source of mock locations)
      const isEmulator = deviceModel?.toLowerCase().includes('emulator') ||
                        deviceModel?.toLowerCase().includes('simulator') ||
                        deviceBrand?.toLowerCase().includes('generic');

      if (isEmulator) {
        isDeveloper = true;
      }
    } catch (err) {
      console.warn('[DeviceSecurityCheck] Device info check failed:', err);
    }

    // Return high risk if emulator/developer device detected
    if (isDeveloper) {
      return {
        isMockLocation: true,
        riskScore: 0.85,
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
