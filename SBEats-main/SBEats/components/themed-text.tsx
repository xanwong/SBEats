/**
 * Text component that adapts its styling based on the current theme (light/dark mode).
 */
import { StyleSheet, Text, type TextProps } from 'react-native';

import { Typography } from '@/constants/design';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tint = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'link' ? { color: tint } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Typography.family,
    fontSize: Typography.size.md,
    lineHeight: Typography.lineHeight.md,
    fontWeight: Typography.weight.regular,
  },
  defaultSemiBold: {
    fontFamily: Typography.family,
    fontSize: Typography.size.md,
    lineHeight: Typography.lineHeight.md,
    fontWeight: Typography.weight.semibold,
  },
  title: {
    fontFamily: Typography.family,
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.heavy,
    lineHeight: Typography.lineHeight.display,
  },
  subtitle: {
    fontFamily: Typography.family,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    lineHeight: Typography.lineHeight.xl,
  },
  link: {
    fontFamily: Typography.family,
    lineHeight: Typography.lineHeight.md,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
