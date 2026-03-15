import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme/spacing';

interface RowProps {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
  alignItems?: ViewStyle['alignItems'];
  justifyContent?: ViewStyle['justifyContent'];
}

export const Row: React.FC<RowProps> = ({ 
  children, 
  gap = spacing.md, 
  style,
  alignItems = 'center',
  justifyContent = 'flex-start'
}) => {
  return (
    <View style={[
      styles.row, 
      { gap, alignItems, justifyContent }, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
