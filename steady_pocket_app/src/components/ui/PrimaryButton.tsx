import React from 'react';
import { StyleSheet, Pressable, PressableProps, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps extends PressableProps {
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  title, 
  style, 
  textStyle, 
  disabled,
  onPress,
  ...props 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.button, 
        disabled && styles.disabled,
        style, 
        animatedStyle
      ]}
      onPressIn={() => {
        scale.value = withSpring(0.96, { stiffness: 400, damping: 25 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400, damping: 25 });
      }}
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
      {...props}
    >
      <Text style={[styles.text, textStyle, disabled && styles.textDisabled]}>
        {title}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: colors.surface2,
  },
  text: {
    ...typography.title,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.textSecondary,
  },
});
