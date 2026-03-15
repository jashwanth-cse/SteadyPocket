import React from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../templates/AppScreen';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { Stack } from '../components/layout/Stack';

export const PoliciesScreen = ({ navigation }: any) => {
  return (
    <AppScreen title="My Policies" showBack onBack={() => navigation.goBack()}>
      <Stack>
        <SurfaceCard>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Health Insurance</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Active • Expires in 3 months</Text>
        </SurfaceCard>
      </Stack>
    </AppScreen>
  );
};
