import React from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../../src/templates/AppScreen';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { TYPOGRAPHY, COLORS } from '../../app/theme';
import { Stack } from '../../src/components/layout/Stack';
import { useRouter } from 'expo-router';

export default function ClaimsScreen() {
  const router = useRouter();
  
  return (
    <AppScreen title="My Claims" showBack onBack={() => router.back()} fabIcon="add">
      <Stack>
        <SurfaceCard>
          <Text style={[TYPOGRAPHY.titleLarge, { color: COLORS.primaryText }]}>Claim #12345</Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.error }]}>Status: Processing</Text>
        </SurfaceCard>
      </Stack>
    </AppScreen>
  );
}
