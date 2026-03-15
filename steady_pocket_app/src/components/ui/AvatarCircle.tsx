import React from 'react';
import { View, StyleSheet, Image, ViewStyle, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface AvatarCircleProps {
  size?: number;
  uri?: string;
  fallbackText?: string;
  style?: ViewStyle;
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({ 
  size = 48, 
  uri, 
  fallbackText,
  style 
}) => {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {uri ? (
        <Image source={{ uri }} style={containerStyle} />
      ) : (
        <Text style={styles.fallbackText}>
          {fallbackText?.substring(0, 2).toUpperCase() || 'U'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackText: {
    ...typography.title,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
