/**
 * Network Status Hook
 * Detects online/offline status and connection speed
 */

import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isWifi: boolean;
  isMobile: boolean;
  isSlowConnection: boolean;
}

/**
 * Hook to detect network status and connection quality
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    type: 'unknown',
    isWifi: false,
    isMobile: false,
    isSlowConnection: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? true;
      const type = state.type || 'unknown';
      const isWifi = type === 'wifi';
      const isMobile = type === 'cellular';

      // Consider 2G connections as slow
      const isSlowConnection = !!(
        state.type === 'cellular' && 
        state.details && 
        'cellularGeneration' in state.details &&
        state.details.cellularGeneration === '2g'
      );

      setNetworkStatus({
        isConnected,
        type,
        isWifi,
        isMobile,
        isSlowConnection,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};

/**
 * Check if device is currently online
 */
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    return true; // Assume connected on error
  }
};
