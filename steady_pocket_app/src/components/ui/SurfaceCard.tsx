import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  level?: 1 | 2 | 3;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({ 
  children, 
  style,
  level = 1 
}) => {
  const getBackgroundColor = () => {
    switch (level) {
      case 2: return colors.surface2;
      case 3: return colors.surface3;
      default: return colors.surface1;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getBackgroundColor() }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.md,
    overflow: 'hidden',
  },
});
