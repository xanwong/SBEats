/**
 * Custom hook for detecting the current color scheme (light/dark) on native platforms.
 */
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' | null {
  const colorScheme = useRNColorScheme();
  return colorScheme === 'unspecified' ? null : colorScheme;
}
