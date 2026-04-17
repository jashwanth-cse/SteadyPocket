import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDoc, doc, getDocs, query, orderBy, limit, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fraud alert document schema
 */
export interface FraudAlert {
  alert_id: string; // UUID or timestamp-based ID
  alert_type: 'gps_spoofing'; // Extensible for future alert types
  risk_score: number; // 0.0 - 1.0
  status: 'action_required' | 'reviewed' | 'dismissed' | 'resolved';
  timestamp: Timestamp; // Firebase serverTimestamp
  user_id: string; // Denormalized for queries
  detection_method?: 'location_spoofing' | 'developer_mode' | 'clean';
  device_info?: {
    model?: string;
    os_version?: string;
    build_fingerprint?: string;
  };
  reviewed_at?: Timestamp;
  reviewed_by?: string;
  notes?: string;
}

/**
 * Session deduplication key pattern
 * Format: fraud_alert_{uid}_{YYYY-MM-DD}
 */
const SESSION_ALERT_KEY = (uid: string, date: string): string =>
  `fraud_alert_${uid}_${date}`;

/**
 * Create a fraud alert in the user-scoped Firestore collection
 * Path: fraud_alerts/{user_id}/alerts/{auto-generated-doc}
 *
 * @param userId User ID who owns the alert
 * @param alert Alert data (without alert_id, timestamp, user_id - auto-generated)
 * @returns { alertId: string } - The created document ID
 */
export async function createFraudAlert(
  userId: string,
  alert: Omit<FraudAlert, 'alert_id' | 'timestamp' | 'user_id'>
): Promise<{ alertId: string }> {
  try {
    const alertData = {
      alert_id: `FRA${Date.now()}`,
      alert_type: alert.alert_type,
      risk_score: alert.risk_score,
      status: alert.status,
      detection_method: alert.detection_method,
      device_info: alert.device_info,
      timestamp: serverTimestamp(),
      user_id: userId,
    };

    // Create in user-scoped subcollection: fraud_alerts/{userId}/alerts/{docId}
    const alertsRef = collection(db, 'fraud_alerts', userId, 'alerts');
    const docRef = await addDoc(alertsRef, alertData);

    console.log('[FraudService] Fraud alert created:', {
      alertId: docRef.id,
      userId,
      alertType: alert.alert_type,
    });

    return { alertId: docRef.id };
  } catch (error) {
    console.error('[FraudService] Failed to create fraud alert:', error);
    throw error;
  }
}

/**
 * Get a specific fraud alert by ID
 *
 * @param userId User ID who owns the alert
 * @param alertId Alert document ID
 * @returns FraudAlert | null if not found
 */
export async function getFraudAlert(
  userId: string,
  alertId: string
): Promise<FraudAlert | null> {
  try {
    const alertRef = doc(db, 'fraud_alerts', userId, 'alerts', alertId);
    const docSnap = await getDoc(alertRef);

    if (docSnap.exists()) {
      return docSnap.data() as FraudAlert;
    }
    return null;
  } catch (error) {
    console.error('[FraudService] Failed to fetch fraud alert:', error);
    return null;
  }
}

/**
 * List recent fraud alerts for a user
 *
 * @param userId User ID who owns the alerts
 * @param limitCount Number of alerts to return (default 10)
 * @returns Array of FraudAlert documents, newest first
 */
export async function listUserFraudAlerts(
  userId: string,
  limitCount: number = 10
): Promise<FraudAlert[]> {
  try {
    const alertsRef = collection(db, 'fraud_alerts', userId, 'alerts');
    const q = query(
      alertsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as FraudAlert);
  } catch (error) {
    console.error('[FraudService] Failed to list fraud alerts:', error);
    return [];
  }
}

/**
 * Update fraud alert status (e.g., mark as reviewed or dismissed)
 *
 * @param userId User ID who owns the alert
 * @param alertId Alert document ID
 * @param status New status
 */
export async function updateAlertStatus(
  userId: string,
  alertId: string,
  status: FraudAlert['status']
): Promise<void> {
  try {
    const alertRef = doc(db, 'fraud_alerts', userId, 'alerts', alertId);
    const updateData: any = {
      status,
      reviewed_at: serverTimestamp(),
    };

    await updateDoc(alertRef, updateData);

    console.log('[FraudService] Alert status updated:', {
      alertId,
      status,
    });
  } catch (error) {
    console.error('[FraudService] Failed to update alert status:', error);
    throw error;
  }
}

/**
 * Session-based deduplication: Check if alert was already shown today
 * Uses AsyncStorage with key pattern: fraud_alert_{uid}_{YYYY-MM-DD}
 *
 * @param uid User ID (Firebase Auth UID)
 * @returns true if alert already shown today, false otherwise
 */
export async function hasAlertBeenShownToday(uid: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = SESSION_ALERT_KEY(uid, today);
    const value = await AsyncStorage.getItem(key);

    const hasShown = value === 'true';

    if (hasShown) {
      console.log('[FraudService] Alert already shown today');
    }

    return hasShown;
  } catch (err) {
    console.error('[FraudService] Session check failed:', err);
    // Default: show alert on error (safe default)
    return false;
  }
}

/**
 * Mark alert as shown today in AsyncStorage
 * Used for session-based deduplication
 *
 * @param uid User ID (Firebase Auth UID)
 */
export async function markAlertShownToday(uid: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = SESSION_ALERT_KEY(uid, today);
    await AsyncStorage.setItem(key, 'true');

    console.log('[FraudService] Marked alert shown for today');
  } catch (err) {
    console.error('[FraudService] Session mark failed:', err);
    // Gracefully continue - user might see duplicate alerts, but won't crash
  }
}
