import React from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../templates/AppScreen';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { Stack } from '../components/layout/Stack';

export const ClaimsScreen = ({ navigation }: any) => {
  return (
    <AppScreen title="My Claims" showBack onBack={() => navigation.goBack()} fabIcon="add">
      <Stack>
        <SurfaceCard>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Claim #12345</Text>
          <Text style={[typography.body, { color: colors.warning }]}>Status: Processing</Text>
        </SurfaceCard>
      </Stack>
    </AppScreen>
  );
};
