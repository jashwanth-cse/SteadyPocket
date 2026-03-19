import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { APP_NAME, APP_TAGLINE } from '../../services/constants';
import { COLORS, TYPOGRAPHY, COMPONENTS } from '../theme';

// A colorful custom spinner made of Animated Views to match the Google style
const GoogleSpinner = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[s.spinnerContainer, { transform: [{ rotate: spin }] }]}>
      <View style={[s.arc, s.arcBlue, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[s.arc, s.arcRed, { transform: [{ rotate: '90deg' }] }]} />
      <View style={[s.arc, s.arcYellow, { transform: [{ rotate: '180deg' }] }]} />
      <View style={[s.arc, s.arcGreen, { transform: [{ rotate: '270deg' }] }]} />
    </Animated.View>
  );
};

export default function SplashScreen() {
  // Note: Navigation is handled by the root layout (_layout.tsx)
  // This component just displays the splash UI

  return (
    <View style={COMPONENTS.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Logo Area */}
      <View style={s.logoContainer}>
        <View style={s.logoCircle}>
          <Text style={s.logoIcon}>💰</Text>
        </View>
        <Text style={TYPOGRAPHY.titleLarge}>{APP_NAME}</Text>
        <Text style={TYPOGRAPHY.bodyHighlight}>{APP_TAGLINE}</Text>
      </View>

      {/* Loading Indicator */}
      <View style={s.loadingContainer}>
        <GoogleSpinner />
      </View>

      {/* Footer */}
      <Text style={s.footer}>Secured & Protected</Text>
    </View>
  );
}

const s = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 100, // Push slightly below center
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  spinnerContainer: {
    width: 48,
    height: 48,
  },
  // We simulate arc segments with borders
  arc: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  arcBlue: { borderTopColor: '#4285F4' },   // Google Blue
  arcRed: { borderRightColor: '#EA4335' },  // Google Red
  arcYellow: { borderBottomColor: '#FBBC05' },// Google Yellow
  arcGreen: { borderLeftColor: '#34A853' }, // Google Green

  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    fontSize: 12,
    color: COLORS.textSubtle,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
