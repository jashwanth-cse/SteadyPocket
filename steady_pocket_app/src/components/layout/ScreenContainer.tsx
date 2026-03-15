import React from 'react';
import { StyleSheet, ViewStyle, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  withSafeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  style, 
  contentContainerStyle,
  scrollable = false,
  withSafeArea = true
}) => {
  const insets = useSafeAreaInsets();

  const Container = withSafeArea ? SafeAreaView : View;
  
  const content = scrollable ? (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[
        styles.content, 
        !withSafeArea && { paddingTop: insets.top, paddingBottom: insets.bottom },
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[
      styles.container, 
      styles.content, 
      !withSafeArea && { paddingTop: insets.top, paddingBottom: insets.bottom },
      contentContainerStyle
    ]}>
      {children}
    </View>
  );

  if (withSafeArea) {
    return (
      <Container style={[styles.container, style]} edges={['top', 'left', 'right']}>
        {content}
      </Container>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
});
