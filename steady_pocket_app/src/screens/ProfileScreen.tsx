import React from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../templates/AppScreen';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { Stack } from '../components/layout/Stack';
import { AvatarCircle } from '../components/ui/AvatarCircle';
import { Row } from '../components/layout/Row';

export const ProfileScreen = ({ navigation }: any) => {
  return (
    <AppScreen title="Profile" showBack onBack={() => navigation.goBack()}>
      <Stack>
        <SurfaceCard>
          <Row>
            <AvatarCircle fallbackText="JD" size={64} />
            <Stack gap={4} style={{ flex: 1 }}>
              <Text style={[typography.title, { color: colors.textPrimary }]}>John Doe</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Premium Member</Text>
            </Stack>
          </Row>
        </SurfaceCard>
      </Stack>
    </AppScreen>
  );
};
