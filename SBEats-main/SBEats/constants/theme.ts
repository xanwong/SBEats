/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6a1b9a';
const tintColorDark = '#be92ff';

export const Colors = {
  light: {
    text: '#181022',
    background: '#f8f7fb',
    tint: tintColorLight,
    icon: '#7d748a',
    tabIconDefault: '#9d94aa',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',
    surfaceMuted: '#f3eef8',
    border: '#e7deef',
    inputBackground: '#f2edf7',
    mutedText: '#6f637f',
    danger: '#b3261e',
    success: '#1f7a4d',
    calendarSelectedDateBg: '#d9bcff',
    calendarSelectedDateText: '#2d1c45',
    leaderboardCardBackground: '#f8f5ff',
    leaderboardCardBorder: '#e8e4f3',
    leaderboardCardBadge: '#6704ad',
    leaderboardCardTitle: '#2c1e44',
    leaderboardCardSubtitle: '#6d5a90',
    leaderboardCardChevron: '#555',
  },
  dark: {
    text: '#f0f2f5',
    background: '#13131a',
    tint: tintColorDark,
    icon: '#aeb6c1',
    tabIconDefault: '#9790a8',
    tabIconSelected: tintColorDark,
    surface: '#1c1b24',
    surfaceMuted: '#262433',
    border: '#3a3650',
    inputBackground: '#2b2838',
    mutedText: '#b1abc2',
    danger: '#ff8f8f',
    success: '#61d19a',
    calendarSelectedDateBg: '#d9bcff',
    calendarSelectedDateText: '#2d1c45',
    leaderboardCardBackground: '#262433',
    leaderboardCardBorder: '#3a3650',
    leaderboardCardBadge: '#be92ff',
    leaderboardCardTitle: '#f0f2f5',
    leaderboardCardSubtitle: '#b1abc2',
    leaderboardCardChevron: '#b1abc2',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
