import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContainer } from '../components/ui/AppContainer';
import { HeaderBar } from '../components/layout/HeaderBar';
import { FloatingActionButton } from '../components/ui/FloatingActionButton';
import { typography } from '../theme/typography';

interface AppScreenProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  fabIcon?: keyof typeof MaterialIcons.glyphMap;
  onFabPress?: () => void;
  scrollable?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  title,
  showBack,
  onBack,
  rightAction,
  fabIcon,
  onFabPress,
  scrollable = true,
}) => {
  return (
    <AppContainer noPadding>
      <HeaderBar 
        title={title} 
        showBack={showBack} 
        onBack={onBack} 
        rightAction={rightAction} 
      />
      
      {scrollable ? (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.scrollContent]}>
          {children}
        </View>
      )}

      {fabIcon && onFabPress && (
        <FloatingActionButton 
          icon={fabIcon} 
          onPress={onFabPress} 
        />
      )}
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100, // Extra space for FAB
  },
});
