import React from 'react';
import { StyleSheet, Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingActionButtonProps extends PressableProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  icon, 
  onPress, 
  style,
  ...props 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.fab, style, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.9, { stiffness: 400, damping: 25 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400, damping: 25 });
      }}
      onPress={onPress}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
      {...props}
    >
      <MaterialIcons name={icon} size={24} color={colors.textPrimary} />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
