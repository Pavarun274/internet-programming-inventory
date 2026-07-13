import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PRODUCTS, RECENT_ACTIVITY } from '@/constants/inventory-data';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [showStatusIndicator, setShowStatusIndicator] = useState(true);

  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const paddingBottom = Platform.select({
    ios: BottomTabInset + Spacing.three,
    android: BottomTabInset + Spacing.three,
    web: Spacing.six,
    default: Spacing.three,
  });

  const handleResetData = async () => {
    try {
      await AsyncStorage.setItem('inventory_products', JSON.stringify(PRODUCTS));
      await AsyncStorage.setItem('inventory_activities', JSON.stringify(RECENT_ACTIVITY));
      alert('Inventory reset to initial demo state!');
      // Force reload page to apply
      if (Platform.OS === 'web') {
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to reset storage:', e);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Settings" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>
            <View style={styles.header}>
              <ThemedText style={[styles.heading, { color: theme.text }]}>
                Application Settings
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Configure notifications, display properties, and system database
              </ThemedText>
            </View>

            {/* Notifications */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                Alerts & Notifications
              </ThemedText>
              <ToggleRow
                label="Push Notifications"
                description="Receive system updates and alert logs"
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                accentColor={SemanticColors.primary}
                textColor={theme.text}
                descColor={theme.textSecondary}
                dividerColor={theme.backgroundSelected}
                showDivider
              />
              <ToggleRow
                label="Low Stock Alerts"
                description="Warn when quantity falls below min. value"
                value={lowStockAlerts}
                onValueChange={setLowStockAlerts}
                accentColor={SemanticColors.warning}
                textColor={theme.text}
                descColor={theme.textSecondary}
                dividerColor={theme.backgroundSelected}
              />
            </View>

            {/* Display & Layout */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                Preferences
              </ThemedText>
              <ToggleRow
                label="Status Badges"
                description="Display green/yellow/red inventory badges"
                value={showStatusIndicator}
                onValueChange={setShowStatusIndicator}
                accentColor={SemanticColors.success}
                textColor={theme.text}
                descColor={theme.textSecondary}
                dividerColor={theme.backgroundSelected}
              />
            </View>

            {/* Storage reset */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                System Controls
              </ThemedText>
              <View style={styles.actionBlock}>
                <ThemedText style={[styles.actionTitle, { color: theme.text }]}>
                  Reset Database
                </ThemedText>
                <ThemedText style={[styles.actionDesc, { color: theme.textSecondary }]}>
                  Wipe all custom modifications and restore original demo items
                </ThemedText>
                <Pressable
                  onPress={handleResetData}
                  style={({ pressed }) => [
                    styles.resetBtn,
                    { backgroundColor: SemanticColors.dangerLight },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <ThemedText style={[styles.resetText, { color: SemanticColors.danger }]}>
                    Reset All Data
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* About */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>About</ThemedText>
              <InfoRow label="App Version" value="1.0.0" textColor={theme.text} descColor={theme.textSecondary} dividerColor={theme.backgroundSelected} showDivider />
              <InfoRow label="Environment" value={Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1)} textColor={theme.text} descColor={theme.textSecondary} dividerColor={theme.backgroundSelected} showDivider />
              <InfoRow label="Framework" value="Expo SDK 57" textColor={theme.text} descColor={theme.textSecondary} dividerColor={theme.backgroundSelected} />
            </View>

          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accentColor: string;
  textColor: string;
  descColor: string;
  dividerColor: string;
  showDivider?: boolean;
};

function ToggleRow({ label, description, value, onValueChange, accentColor, textColor, descColor, dividerColor, showDivider }: ToggleRowProps) {
  return (
    <>
      <View style={rowStyles.row}>
        <View style={rowStyles.rowText}>
          <ThemedText style={[rowStyles.label, { color: textColor }]}>{label}</ThemedText>
          <ThemedText style={[rowStyles.desc, { color: descColor }]}>{description}</ThemedText>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D5DB', true: accentColor + '80' }}
          thumbColor={value ? accentColor : '#9CA3AF'}
          ios_backgroundColor="#D1D5DB"
        />
      </View>
      {showDivider && <View style={[rowStyles.divider, { backgroundColor: dividerColor }]} />}
    </>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  textColor: string;
  descColor: string;
  dividerColor: string;
  showDivider?: boolean;
};

function InfoRow({ label, value, textColor, descColor, dividerColor, showDivider }: InfoRowProps) {
  return (
    <>
      <View style={rowStyles.row}>
        <ThemedText style={[rowStyles.label, { color: textColor }]}>{label}</ThemedText>
        <ThemedText style={[rowStyles.infoVal, { color: descColor }]}>{value}</ThemedText>
      </View>
      {showDivider && <View style={[rowStyles.divider, { backgroundColor: dividerColor }]} />}
    </>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    paddingRight: 16,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    padding: Spacing.three,
  },
  centered: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    gap: Spacing.three,
  },
  header: {
    gap: 4,
    marginBottom: Spacing.one,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionBlock: {
    paddingVertical: 12,
    gap: 6,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 10,
  },
  resetBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
