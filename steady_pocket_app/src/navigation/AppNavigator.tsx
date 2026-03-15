import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { PoliciesScreen } from '../screens/PoliciesScreen';
import { ClaimsScreen } from '../screens/ClaimsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface1,
    text: colors.textPrimary,
    border: colors.divider,
    primary: colors.primary,
  },
};

export const AppNavigator = () => {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Policies" component={PoliciesScreen} />
        <Stack.Screen name="Claims" component={ClaimsScreen} />
        <Stack.Screen name="Payments" component={PaymentsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
