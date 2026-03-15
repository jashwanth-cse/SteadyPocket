import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme/spacing';

interface StackProps {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}

export const Stack: React.FC<StackProps> = ({ 
  children, 
  gap = spacing.md, 
  style 
}) => {
  return (
    <View style={[{ gap }, style]}>
      {children}
    </View>
  );
};
