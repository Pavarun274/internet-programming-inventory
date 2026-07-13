import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { router } from 'expo-router';

import { useMenu } from '@/contexts/menu-context';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SemanticColors } from '@/constants/theme';

type AppHeaderProps = {
  title?: string;
  style?: ViewStyle;
};

export function AppHeader({ title = 'Inventory', style }: AppHeaderProps) {
  const { openMenu } = useMenu();
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const paddingTop = Platform.select({
    web: 16,
    default: insets.top + 8,
  });

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.backgroundElement,
          paddingTop,
          borderBottomColor: isDark ? '#27272A' : '#E4E4E7',
          shadowColor: isDark ? '#000' : '#E4E4E7',
        },
        style,
      ]}
    >
      {/* Hamburger Button */}
      <Pressable
        onPress={openMenu}
        style={({ pressed }) => [
          styles.hamburgerBtn,
          { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={[styles.hLine, { backgroundColor: SemanticColors.primary }]} />
        <View style={[styles.hLine, { backgroundColor: SemanticColors.primary, width: 14 }]} />
        <View style={[styles.hLine, { backgroundColor: SemanticColors.primary }]} />
      </Pressable>

      {/* Title */}
      <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>

      {/* Avatar */}
      <Pressable
        onPress={() => router.push('/profile' as any)}
        style={({ pressed }) => [
          styles.avatarCircle,
          { backgroundColor: SemanticColors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <ThemedText style={styles.avatarText}>A</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  hamburgerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginRight: 'auto',
    zIndex: 10,
  },
  hLine: {
    height: 2.5,
    width: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    zIndex: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
