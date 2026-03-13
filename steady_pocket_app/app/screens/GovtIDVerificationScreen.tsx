import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GovtIDVerificationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Govt. ID Verification</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#90CAF9',
  },
});
