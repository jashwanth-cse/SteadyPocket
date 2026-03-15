import React from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../templates/AppScreen';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { Stack } from '../components/layout/Stack';
import { Divider } from '../components/ui/Divider';

export const PaymentsScreen = ({ navigation }: any) => {
  return (
    <AppScreen title="Payments" showBack onBack={() => navigation.goBack()}>
      <Stack>
        <SurfaceCard>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Last Payment</Text>
          <Divider style={{ marginVertical: 8 }} />
          <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>$150.00</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Paid on Oct 12, 2023</Text>
        </SurfaceCard>
      </Stack>
    </AppScreen>
  );
};
