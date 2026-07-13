import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { PRODUCTS, getStockStatus } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TOTAL_PRODUCTS = PRODUCTS.length;
const IN_STOCK = PRODUCTS.filter((p) => getStockStatus(p) === 'in_stock').length;
const LOW_STOCK = PRODUCTS.filter((p) => getStockStatus(p) === 'low_stock').length;
const OUT_OF_STOCK = PRODUCTS.filter((p) => getStockStatus(p) === 'out_of_stock').length;
const TOTAL_VALUE = PRODUCTS.reduce((s, p) => s + p.price * p.quantity, 0);

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [darkModeForced, setDarkModeForced] = useState(false);

  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const paddingBottom = Platform.select({
    ios: BottomTabInset + Spacing.three,
    android: BottomTabInset + Spacing.three,
    web: Spacing.six,
    default: Spacing.three,
  });

  const paddingTop = Platform.select({
    web: Spacing.six,
    default: insets.top + Spacing.three,
  });

  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingTop, paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>

            {/* Header */}
            <ThemedText style={[styles.title, { color: theme.text }]}>Profile</ThemedText>

            {/* User Card */}
            <View style={[styles.userCard, { backgroundColor: SemanticColors.primary }]}>
              <View style={styles.avatarLarge}>
                <ThemedText style={styles.avatarLargeText}>A</ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>Admin User</ThemedText>
                <ThemedText style={styles.userEmail}>admin@inventory.app</ThemedText>
                <View style={styles.roleBadge}>
                  <ThemedText style={styles.roleText}>Administrator</ThemedText>
                </View>
              </View>
            </View>

            {/* Stats Overview */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                Inventory Overview
              </ThemedText>
              <View style={styles.statsGrid}>
                <StatItem label="Total Products" value={TOTAL_PRODUCTS.toString()} color={SemanticColors.primary} />
                <StatItem label="In Stock" value={IN_STOCK.toString()} color={SemanticColors.success} />
                <StatItem label="Low Stock" value={LOW_STOCK.toString()} color={SemanticColors.warning} />
                <StatItem label="Out of Stock" value={OUT_OF_STOCK.toString()} color={SemanticColors.danger} />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              <View style={styles.valueRow}>
                <ThemedText style={[styles.valueLabel, { color: theme.textSecondary }]}>
                  Total Inventory Value
                </ThemedText>
                <ThemedText style={[styles.valueAmount, { color: SemanticColors.primary }]}>
                  ${TOTAL_VALUE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
              </View>
            </View>

            {/* Notifications */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                Notifications
              </ThemedText>
              <ToggleRow
                label="Push Notifications"
                description="Receive app notifications"
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
                description="Alert when stock falls below minimum"
                value={lowStockAlerts}
                onValueChange={setLowStockAlerts}
                accentColor={SemanticColors.warning}
                textColor={theme.text}
                descColor={theme.textSecondary}
                dividerColor={theme.backgroundSelected}
              />
            </View>

            {/* Appearance */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
                Appearance
              </ThemedText>
              <ToggleRow
                label="Dark Mode"
                description="Toggle dark/light theme"
                value={darkModeForced}
                onValueChange={setDarkModeForced}
                accentColor={SemanticColors.primary}
                textColor={theme.text}
                descColor={theme.textSecondary}
                dividerColor={theme.backgroundSelected}
              />
            </View>

            {/* App Info */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>About</ThemedText>
              <InfoRow label="App Version" value="1.0.0" textColor={theme.text} descColor={theme.textSecondary} dividerColor={theme.backgroundSelected} showDivider />
              <InfoRow label="Platform" value={Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1)} textColor={theme.text} descColor={theme.textSecondary} dividerColor={theme.backgroundSelected} showDivider />
              <InfoRow label="Built with" value="Expo SDK 57" textColor={theme.text} descColor={theme.textSecondary} dividerColor={theme.backgroundSelected} />
            </View>

            {/* Sign Out */}
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                {
                  backgroundColor: SemanticColors.dangerLight,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.signOutText, { color: SemanticColors.danger }]}>
                Sign Out
              </ThemedText>
            </Pressable>

          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={statStyles.item}>
      <ThemedText style={[statStyles.value, { color }]}>{value}</ThemedText>
      <ThemedText style={statStyles.label}>{label}</ThemedText>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: '#888',
  },
});

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
        <ThemedText style={[rowStyles.value, { color: descColor }]}>{value}</ThemedText>
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
    paddingVertical: 4,
  },
  rowText: {
    flex: 1,
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
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  centered: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  userCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  divider: {
    height: 1,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  signOutButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
