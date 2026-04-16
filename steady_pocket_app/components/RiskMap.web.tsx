import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../app/theme';

export default function RiskMap({ location, workLocation, initialRegion, MOCK_ZONES }: any) {
  return (
    <View style={styles.card}>
      <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.primaryText, marginBottom: 12 }]}>
        Map Unavailable
      </Text>
      <Text style={[TYPOGRAPHY.body, { color: COLORS.textSubtle }]}>
        The Risk Map feature relies on native device APIs and is currently only supported on our mobile applications (iOS and Android).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    margin: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
});
