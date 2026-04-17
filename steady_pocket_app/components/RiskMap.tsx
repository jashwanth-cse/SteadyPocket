import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

interface RiskMapProps {
  location: any;
  workLocation: any;
  initialRegion: any;
  MOCK_ZONES: any[];
}

export default function RiskMap({ location, workLocation, initialRegion, MOCK_ZONES }: RiskMapProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.map}>
        <iframe 
          width="100%" 
          height="100%" 
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=${initialRegion.latitude},${initialRegion.longitude}&z=14&output=embed`} 
          allowFullScreen 
        />
        {/* Overlay Mock Zones roughly in center for Web presentation */}
        {MOCK_ZONES.map((zone, i) => {
           // Provide varied offsets to simulate spread of zones around map
           const offsets = [
              { top: '30%', left: '30%' },
              { top: '45%', left: '55%' },
              { top: '60%', left: '40%' }
           ];
           const offset = offsets[i % offsets.length];

           return (
             <View key={i} style={[{
                 position: 'absolute',
                 width: zone.radius > 1000 ? 120 : (zone.radius > 800 ? 90 : 70),
                 height: zone.radius > 1000 ? 120 : (zone.radius > 800 ? 90 : 70),
                 borderRadius: 100,
                 backgroundColor: zone.fillColor,
                 borderColor: zone.strokeColor,
                 borderWidth: 2,
             }, { top: offset.top as any, left: offset.left as any }]} />
           )
        })}
      </View>
    );
  }

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
