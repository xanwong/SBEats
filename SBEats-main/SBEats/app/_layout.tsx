/**
 * Root layout component setting up the main navigation wrapper and global providers.
 */
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{ presentation: 'modal', title: 'User Profile' }}
        />
        <Stack.Screen
          name="restaurant/[id]"
          options={{ presentation: 'modal', title: 'Restaurant' }}
        />
        <Stack.Screen
          name="friend-requests"
          options={{ presentation: 'modal', title: 'Friend Requests' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
