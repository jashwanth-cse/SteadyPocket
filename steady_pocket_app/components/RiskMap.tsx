import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

interface RiskMapProps {
  location: any;
  workLocation: any;
  initialRegion: any;
  MOCK_ZONES: any[];
}

export default function RiskMap({ location, workLocation, initialRegion, MOCK_ZONES }: RiskMapProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {workLocation && (
        <Marker
          coordinate={{
            latitude: workLocation.latitude,
            longitude: workLocation.longitude,
          }}
          title="Registered Work Location"
          pinColor="blue"
        />
      )}

      {MOCK_ZONES.map((zone, i) => (
        <Circle
          key={i}
          center={zone.center}
          radius={zone.radius}
          fillColor={zone.fillColor}
          strokeColor={zone.strokeColor}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
