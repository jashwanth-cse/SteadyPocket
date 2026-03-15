import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  withSequence,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
  visible: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  visible,
  overlay = true 
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1 // Infinite iterations
      );
    } else {
      rotation.value = 0;
    }
  }, [visible, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  if (!visible) return null;

  const SpinnerContent = (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(300)}
      style={[styles.spinnerContainer, overlay && styles.overlay]}
    >
      <View style={styles.spinnerBackground}>
        <Animated.View style={[styles.spinner, animatedStyle]}>
          <View style={styles.spinnerArc} />
        </Animated.View>
      </View>
    </Animated.View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {SpinnerContent}
      </Modal>
    );
  }

  return SpinnerContent;
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerBackground: {
    backgroundColor: colors.surface2,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: colors.surface3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerArc: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
  },
});
