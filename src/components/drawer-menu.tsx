import { Modal, Pressable, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMenu } from '@/contexts/menu-context';
import { ThemedText } from './themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SemanticColors } from '@/constants/theme';

const MENU_ITEMS = [
  { label: 'Home', route: '/' },
  { label: 'Products', route: '/explore' },
  { label: 'Categories', route: '/categories' },
  { label: 'Stores', route: '/stores' },
  { label: 'Finances', route: '/finances' },
  { label: 'Settings', route: '/settings' },
];

export function DrawerMenu() {
  const { isOpen, closeMenu } = useMenu();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  // Always dark bg for strong contrast — minimal & elegant in both modes
  const menuBg = isDark ? '#09090B' : '#18181B';
  const borderColor = isDark ? '#27272A' : '#27272A';

  function navigate(route: string) {
    closeMenu();
    setTimeout(() => router.push(route as any), 100);
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={closeMenu}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: menuBg,
            paddingTop: insets.top + (Platform.OS === 'web' ? 0 : 8),
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={closeMenu}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          >
            <ThemedText style={styles.closeTxt}>✕</ThemedText>
          </Pressable>
          <ThemedText style={styles.appName}>Inventory</ThemedText>
          <View style={styles.closeBtn} />
        </View>

        {/* Menu Items */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => navigate(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { opacity: 0.6 },
              ]}
            >
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Log Out */}
        <Pressable
          onPress={closeMenu}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.6 }]}
        >
          <ThemedText style={styles.logoutTxt}>Log out</ThemedText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  appName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  menuList: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  menuItem: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  menuLabel: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  logoutTxt: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
  },
});
