import React from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../templates/AppScreen';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { Stack } from '../components/layout/Stack';
import { PrimaryButton } from '../components/ui/PrimaryButton';

export const HomeScreen = ({ navigation }: any) => {
  return (
    <AppScreen 
      title="Home" 
      fabIcon="add"
      onFabPress={() => console.log('FAB pressed')}
    >
      <Stack>
        <SurfaceCard>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Welcome to SteadyPocket</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>Your insurance policies and claims in one place.</Text>
        </SurfaceCard>
        
        <PrimaryButton 
          title="View Policies" 
          onPress={() => navigation.navigate('Policies')} 
        />
        
        <PrimaryButton 
          title="My Profile" 
          onPress={() => navigation.navigate('Profile')} 
        />
      </Stack>
    </AppScreen>
  );
};
