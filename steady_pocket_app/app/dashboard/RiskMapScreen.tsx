import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { AppScreen } from '../../src/templates/AppScreen';
import { COLORS, TYPOGRAPHY } from '../../app/theme';
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getUserDocIdByAuthUid } from '../../services/authService';
import RiskMap from '../../components/RiskMap';

export default function RiskMapScreen() {
  const [location, setLocation] = useState<any>(null);
  const [workLocation, setWorkLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Attempt rapid fetch, fallback if it hangs
          const getLoc = async () => {
            let loc = await Location.getLastKnownPositionAsync();
            if (!loc) {
               loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            }
            return loc;
          };
          
          try {
            const loc = await Promise.race([
              getLoc(),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
            ]);
            if (loc) setLocation(loc.coords);
          } catch (e) {
            console.warn("Location fetch timeout, using default");
          }
        } else {
          Alert.alert('Permission Denied', 'Location access is required to view your live position.');
        }

        const uid = auth.currentUser?.uid;
        if (uid) {
          const userDocId = await getUserDocIdByAuthUid(uid);
          if (userDocId) {
            const userSnap = await getDoc(doc(db, 'users', userDocId));
            if (userSnap.exists()) {
              const data = userSnap.data();
              if (data.work_location) {
                setWorkLocation(data.work_location);
              }
              if (data.is_realtime !== undefined) {
                setIsRealtime(data.is_realtime);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Map data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initialRegion = {
    latitude: workLocation?.latitude || location?.latitude || 28.7041, // Default fallback
    longitude: workLocation?.longitude || location?.longitude || 77.1025,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const MOCK_ZONES = [
    {
      center: {
        latitude: initialRegion.latitude + 0.01,
        longitude: initialRegion.longitude + 0.01,
      },
      radius: 1000,
      fillColor: 'rgba(255, 0, 0, 0.2)',
      strokeColor: 'rgba(255, 0, 0, 0.5)',
      title: 'High Fraud Risk Area',
      type: 'high',
    },
    {
      center: {
        latitude: initialRegion.latitude - 0.015,
        longitude: initialRegion.longitude - 0.015,
      },
      radius: 1500,
      fillColor: 'rgba(0, 255, 0, 0.2)',
      strokeColor: 'rgba(0, 255, 0, 0.5)',
      title: 'Safe Zone',
      type: 'low',
    },
    {
      center: {
        latitude: initialRegion.latitude + 0.02,
        longitude: initialRegion.longitude - 0.01,
      },
      radius: 800,
      fillColor: 'rgba(255, 165, 0, 0.2)',
      strokeColor: 'rgba(255, 165, 0, 0.5)',
      title: 'Moderate Risk',
      type: 'medium',
    }
  ];

  return (
    <AppScreen title="Risk Map" showBack scrollable={false}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[TYPOGRAPHY.body, { marginTop: 12, color: COLORS.textSubtle }]}>
              Loading map data...
            </Text>
          </View>
        ) : (
          <>
            <RiskMap 
              location={location} 
              workLocation={workLocation} 
              initialRegion={initialRegion} 
              MOCK_ZONES={isRealtime ? [] : MOCK_ZONES} 
            />

            {!isRealtime && (
              <View style={styles.legendContainer}>
                <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 8 }]}>
                  Risk Zones Legend
                </Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 0, 0, 0.5)' }]} />
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.primaryText }]}>High Fraud Risk Area</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 165, 0, 0.5)' }]} />
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.primaryText }]}>Moderate Risk</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 255, 0, 0.5)' }]} />
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.primaryText }]}>Safe Zone</Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
});
