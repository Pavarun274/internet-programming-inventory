import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { getStockStatus } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';

const CHART_DATA = [
  { label: 'Confirmed', value: 0.72, color: '#6366F1' }, // Indigo-500
  { label: 'Pending', value: 0.45, color: '#818CF8' },    // Indigo-400
  { label: 'Refunded', value: 0.2, color: '#A5B4FC' },   // Indigo-300
  { label: 'Shipped', value: 0.58, color: '#C7D2FE' },    // Indigo-200
];

const ACTIVITY_ICONS: Record<string, string> = {
  added: '➕', removed: '➖', updated: '✏️', restocked: '🔄',
};
const ACTIVITY_COLORS: Record<string, string> = {
  added: SemanticColors.success,
  removed: SemanticColors.danger,
  updated: SemanticColors.primary,
  restocked: SemanticColors.warning,
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const { products, recentActivities } = useInventory();
  const TOTAL_PRODUCTS = products.length;
  const NEW_ORDERS = 123;
  const REFUNDS = 12;
  const MESSAGES = 1;
  const GROUPS = 4;
  const NEW_ITEMS = products.filter((p) => getStockStatus(p) === 'in_stock').length;

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Inventory" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>

            {/* ─── Recent Activity ─── */}
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Recent activity
            </ThemedText>

            <View style={[styles.gridContainer]}>
              {/* Row 1 */}
              <View style={[styles.gridRow, { shadowColor }]}>
                <ActivityCard
                  value={NEW_ITEMS} label="NEW ITEMS"
                  cardBg={cardBg} shadowColor={shadowColor}
                />
                <ActivityCard
                  value={NEW_ORDERS} label="NEW ORDERS"
                  cardBg={cardBg} shadowColor={shadowColor}
                />
                <ActivityCard
                  value={REFUNDS} label="REFUNDS"
                  cardBg={cardBg} shadowColor={shadowColor}
                />
              </View>
              {/* Row 2 */}
              <View style={[styles.gridRow, { shadowColor }]}>
                <ActivityCard
                  value={MESSAGES} label="MESSAGE"
                  cardBg={cardBg} shadowColor={shadowColor}
                />
                <ActivityCard
                  value={GROUPS} label="GROUPS"
                  cardBg={cardBg} shadowColor={shadowColor}
                />
                <View
                  style={[
                    styles.viewMoreCard,
                    {
                      backgroundColor: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
                      shadowColor: isDark ? '#000' : '#E4E4E7',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.viewMoreArrow,
                      { color: isDark ? SemanticColors.primaryLight : SemanticColors.primary },
                    ]}
                  >
                    ›
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.viewMoreTxt,
                      { color: isDark ? SemanticColors.primaryLight : SemanticColors.primary },
                    ]}
                  >
                    View more
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* ─── Sales Chart ─── */}
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Sales
            </ThemedText>

            <View
              style={[
                styles.chartCard,
                { backgroundColor: cardBg, shadowColor },
              ]}
            >
              {/* Bars */}
              <View style={styles.barsWrapper}>
                {CHART_DATA.map((item) => (
                  <View key={item.label} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${item.value * 100}%` as any,
                            backgroundColor: item.color,
                            opacity: item.value >= 0.7 ? 1 : 0.6,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]}>
                      {item.label}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Y-axis hint lines */}
              <View style={styles.gridLines} pointerEvents="none">
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[styles.gridLine, { borderColor: isDark ? '#27272A' : '#E4E4E7' }]}
                  />
                ))}
              </View>
            </View>

            {/* ─── Recent Transactions ─── */}
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </ThemedText>
            <View style={[styles.txCard, { backgroundColor: cardBg, shadowColor }]}>
              {recentActivities.length === 0 ? (
                <View style={{ padding: Spacing.three, alignItems: 'center' }}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>
                    No transactions recorded yet.
                  </ThemedText>
                </View>
              ) : (
                recentActivities.slice(0, 5).map((act, idx) => (
                  <View key={act.id}>
                    <View style={styles.txRow}>
                      <View
                        style={[
                          styles.txIcon,
                          { backgroundColor: (ACTIVITY_COLORS[act.type] || SemanticColors.primary) + '20' },
                        ]}
                      >
                        <ThemedText style={styles.txEmoji}>
                          {ACTIVITY_ICONS[act.type] || '📝'}
                        </ThemedText>
                      </View>
                      <View style={styles.txInfo}>
                        <ThemedText style={[styles.txProduct, { color: theme.text }]}>
                          {act.productName}
                        </ThemedText>
                        <ThemedText style={[styles.txMeta, { color: theme.textSecondary }]}>
                          {(act.type || 'updated').charAt(0).toUpperCase() + (act.type || 'updated').slice(1)} · {act.user}
                        </ThemedText>
                      </View>
                      <View style={styles.txRight}>
                        <ThemedText
                          style={[
                            styles.txQty,
                            { color: act.type === 'removed' ? SemanticColors.danger : SemanticColors.primary },
                          ]}
                        >
                          {act.type === 'removed' ? '-' : '+'}{act.quantity}
                        </ThemedText>
                        <ThemedText style={[styles.txTime, { color: theme.textSecondary }]}>
                          {formatTime(act.timestamp)}
                        </ThemedText>
                      </View>
                    </View>
                    {idx < Math.min(recentActivities.length, 5) - 1 && (
                      <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
                    )}
                  </View>
                ))
              )}
            </View>

          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type ActivityCardProps = {
  value: number;
  label: string;
  cardBg: string;
  shadowColor: string;
};

function ActivityCard({ value, label, cardBg, shadowColor }: ActivityCardProps) {
  return (
    <View style={[styles.actCard, { backgroundColor: cardBg, shadowColor }]}>
      <ThemedText style={[styles.actValue, { color: SemanticColors.primary }]}>
        {value}
      </ThemedText>
      <ThemedText style={styles.actQty}>Qty</ThemedText>
      <ThemedText style={styles.actLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.three },
  centered: { flexDirection: 'row', justifyContent: 'center' },
  content: { flex: 1, gap: Spacing.three, paddingTop: Spacing.three },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },

  // Activity Grid
  gridContainer: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  actValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  actQty: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
  actLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#BBB',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 2,
  },
  viewMoreCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  viewMoreArrow: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  viewMoreTxt: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Chart
  chartCard: {
    borderRadius: 16,
    padding: 16,
    height: 200,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  barsWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingBottom: 28,
    zIndex: 1,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
  },
  gridLines: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 44,
    justifyContent: 'space-between',
  },
  gridLine: {
    borderTopWidth: 1,
    width: '100%',
  },

  // Transactions
  txCard: {
    borderRadius: 16,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txEmoji: { fontSize: 18 },
  txInfo: { flex: 1, gap: 2 },
  txProduct: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  txMeta: { fontSize: 12, fontWeight: '500' },
  txRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  txQty: { fontSize: 14, fontWeight: '700' },
  txTime: { fontSize: 11, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 12 },
});
