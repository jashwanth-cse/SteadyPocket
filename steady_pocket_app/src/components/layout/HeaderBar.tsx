import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { IconButton } from '../ui/IconButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useNavigation } from '@react-navigation/native';

interface HeaderBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ 
  title, 
  showBack = false, 
  onBack,
  rightAction 
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <IconButton 
            icon="arrow-back" 
            size={24} 
            surfaceLevel="transparent" 
            onPress={handleBack} 
            style={styles.backButton}
          />
        )}
      </View>
      
      <View style={styles.center}>
        {title && (
          <Text style={styles.title}>
            {title}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  backButton: {
    marginLeft: 0,
  },
  title: {
    ...typography.headingMedium,
    fontSize: 20, // Override for header
    color: colors.textPrimary,
  },
});
