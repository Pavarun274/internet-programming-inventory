import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SemanticColors, Spacing } from '@/constants/theme';

const TABS = [
  { name: 'home', href: '/', icon: '🏠', label: 'Home' },
  { name: 'add', href: '/add', icon: '➕', label: 'Add', isAdd: true },
  { name: 'explore', href: '/explore', icon: '📦', label: 'Product' },
  { name: 'categories', href: '/categories', icon: '🗂️', label: 'Categories' },
];

const HIDDEN_TABS = [
  { name: 'stores', href: '/stores' },
  { name: 'finances', href: '/finances' },
  { name: 'settings', href: '/settings' },
  { name: 'profile', href: '/profile' },
];

export default function AppTabs() {
  return (
    <Tabs style={styles.flex}>
      <TabSlot style={styles.flex} />
      <TabList asChild>
        <BottomNavBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} asChild>
              <TabBtn icon={tab.icon} label={tab.label} isAdd={tab.isAdd} />
            </TabTrigger>
          ))}
          {/* Hidden triggers for drawer/profile routing */}
          <View style={{ display: 'none' }}>
            {HIDDEN_TABS.map((tab) => (
              <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} />
            ))}
          </View>
        </BottomNavBar>
      </TabList>
    </Tabs>
  );
}

function TabBtn({ children, isFocused, icon, label, isAdd, ...props }: TabTriggerSlotProps & { icon: string; label: string; isAdd?: boolean }) {
  const theme = useTheme();
  const active = SemanticColors.primary;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabBtn, pressed && { opacity: 0.65 }]}
    >
      {isAdd ? (
        <View style={styles.addCircle}>
          <ThemedText style={styles.addIcon}>{icon}</ThemedText>
        </View>
      ) : (
        <>
          <ThemedText style={[styles.tabIcon, { opacity: isFocused ? 1 : 0.45 }]}>
            {icon}
          </ThemedText>
          <ThemedText
            style={[
              styles.tabLabel,
              { color: isFocused ? active : theme.textSecondary, fontWeight: isFocused ? '700' : '500' },
            ]}
          >
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

function BottomNavBar(props: TabListProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View
      {...props}
      style={[
        styles.navBar,
        {
          backgroundColor: theme.backgroundElement,
          borderTopColor: isDark ? '#27272A' : '#E4E4E7',
          shadowColor: isDark ? '#000' : '#E4E4E7',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    outlineStyle: 'none',
  } as any,
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  addCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: SemanticColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SemanticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    outlineStyle: 'none',
  } as any,
  addIcon: {
    fontSize: 18,
    color: '#fff',
  },
});
