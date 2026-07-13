import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, SemanticColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: isDark ? '#27272A' : '#E4E4E7',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: isDark ? '#000' : '#888',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: SemanticColors.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <ThemedText style={{ fontSize: 22, color, opacity: focused ? 1 : 0.5 }}>🏠</ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.addCircle}>
              <ThemedText style={styles.addIcon}>➕</ThemedText>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Product',
          tabBarIcon: ({ color, focused }) => (
            <ThemedText style={{ fontSize: 22, color, opacity: focused ? 1 : 0.5 }}>📦</ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <ThemedText style={{ fontSize: 22, color, opacity: focused ? 1 : 0.5 }}>🗂️</ThemedText>
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SemanticColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 4 : 14,
    shadowColor: SemanticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  addIcon: {
    fontSize: 16,
    color: '#fff',
  },
});
