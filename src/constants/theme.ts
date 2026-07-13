/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#09090B',           // zinc-950
    background: '#FAFAFA',     // zinc-50
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F4F4F5', // zinc-100
    textSecondary: '#71717A',  // zinc-500
  },
  dark: {
    text: '#FAFAFA',           // zinc-50
    background: '#09090B',     // zinc-950
    backgroundElement: '#18181B', // zinc-900
    backgroundSelected: '#27272A', // zinc-800
    textSecondary: '#A1A1AA',  // zinc-400
  },
} as const;

/** Semantic / accent colors */
export const SemanticColors = {
  primary: '#6366F1',          // indigo-500
  primaryLight: '#EEF2FF',     // indigo-50 (light mode)
  primaryDark: '#3730A3',      // indigo-800 (dark mode tint)
  success: '#22C55E',          // green-500
  successLight: '#F0FDF4',
  successDark: '#14532D',
  warning: '#F59E0B',          // amber-500
  warningLight: '#FFFBEB',
  warningDark: '#451A03',
  danger: '#EF4444',           // red-500
  dangerLight: '#FEF2F2',
  dangerDark: '#450A0A',
  card: '#FFFFFF',
  cardDark: '#18181B',
} as const;


export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
