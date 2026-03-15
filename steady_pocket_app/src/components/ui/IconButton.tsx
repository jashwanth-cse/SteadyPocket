import React from 'react';
import { StyleSheet, Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps extends PressableProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color?: string;
  style?: ViewStyle;
  disabled?: boolean;
  surfaceLevel?: 1 | 2 | 3 | 'transparent';
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  size = 24,
  color = colors.textPrimary,
  style, 
  disabled,
  surfaceLevel = 2,
  onPress,
  ...props 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBackgroundColor = () => {
    switch (surfaceLevel) {
      case 1: return colors.surface1;
      case 2: return colors.surface2;
      case 3: return colors.surface3;
      case 'transparent': return 'transparent';
      default: return colors.surface2;
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.button, 
        { backgroundColor: getBackgroundColor() },
        disabled && styles.disabled,
        style, 
        animatedStyle
      ]}
      onPressIn={() => {
        scale.value = withSpring(0.9, { stiffness: 400, damping: 25 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400, damping: 25 });
      }}
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true, radius: 24 }}
      {...props}
    >
      <MaterialIcons 
        name={icon} 
        size={size} 
        color={disabled ? colors.textSecondary : color} 
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
