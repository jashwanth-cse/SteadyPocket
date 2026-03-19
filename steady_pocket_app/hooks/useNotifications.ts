import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { getUserDocIdByAuthUid } from '../services/authService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToFirestore(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const saveTokenToFirestore = async (token: string) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDocId = await getUserDocIdByAuthUid(uid);
      if (!userDocId) return;

      const userRef = doc(db, 'users', userDocId);
      await updateDoc(userRef, {
        fcm_token: token,
        updated_at: new Date(),
      });
      console.log('Push token saved to Firestore:', token);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  return { expoPushToken, notification };
};

async function registerForPushNotificationsAsync() {
  // 1. Web is not supported for native push tokens
  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web.');
    return;
  }

  // 2. Detect Expo Go (storeClient) environment
  // Starting with SDK 53, Expo Go does not support remote push notifications.
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  if (isExpoGo) {
    console.warn('Push notifications (remote) are not supported in Expo Go on SDK 53+. Use a Development Build or Standalone APK for full push support.');
    return;
  }

  // 3. Detect Emulator/Simulated Environment
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications. Skipping registration on emulator.');
    return;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token: Permission not granted');
    return;
  }
  
  try {
      // Switch to getDevicePushTokenAsync for native FCM/APNS tokens
      // This is required for direct integration with firebase-admin on the backend
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
      console.log('Successfully retrieved native push token:', token);
  } catch (e) {
      console.error('Error getting native push token:', e);
  }

  return token;
}
