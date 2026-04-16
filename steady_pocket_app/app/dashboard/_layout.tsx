import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { colors } from '../../src/theme/colors';

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface1,
    text: colors.textPrimary,
    border: colors.divider,
    notification: colors.primary,
  },
};

export default function DashboardLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="HomeScreen" options={{ title: 'Home' }} />
        <Stack.Screen name="PoliciesScreen" options={{ title: 'Policies' }} />
        <Stack.Screen name="ClaimsScreen" options={{ title: 'Claims' }} />
        <Stack.Screen name="PaymentsScreen" options={{ title: 'Payments' }} />
        <Stack.Screen name="ProfileScreen" options={{ title: 'Profile' }} />
        <Stack.Screen name="CoverageDetailsScreen" options={{ title: 'Coverage Details' }} />
        <Stack.Screen name="SupportComplaintsScreen" options={{ title: 'Support' }} />
        <Stack.Screen name="MyComplaintsScreen" options={{ title: 'My Complaints' }} />
        <Stack.Screen name="RiskMapScreen" options={{ title: 'Risk Map' }} />
      </Stack>
    </ThemeProvider>
  );
}
