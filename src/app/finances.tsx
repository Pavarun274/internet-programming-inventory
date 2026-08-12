import { Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useState } from 'react';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { CATEGORIES, STORES } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { CategoryChip } from '@/components/category-chip';

// Monthly Sales Data per Store
type MonthlyStorePoint = {
  month: string;
  s1: number;
  s2: number;
  s3: number;
  total2026: number;
  total2025: number;
};

const MONTHLY_SALES_BY_STORE: MonthlyStorePoint[] = [
  { month: 'Jan', s1: 65000, s2: 50000, s3: 30000, total2026: 145000, total2025: 120000 },
  { month: 'Feb', s1: 82000, s2: 65000, s3: 35000, total2026: 182000, total2025: 135000 },
  { month: 'Mar', s1: 75000, s2: 58000, s3: 32000, total2026: 165000, total2025: 150000 },
  { month: 'Apr', s1: 95000, s2: 72000, s3: 43000, total2026: 210000, total2025: 175000 },
  { month: 'May', s1: 110000, s2: 85000, s3: 50000, total2026: 245000, total2025: 190000 },
  { month: 'Jun', s1: 105000, s2: 80000, s3: 45000, total2026: 230000, total2025: 205000 },
  { month: 'Jul', s1: 130000, s2: 98000, s3: 57000, total2026: 285000, total2025: 220000 },
];

// Daily Top Selling Products per Store
const DAILY_TOP_SELLERS = [
  {
    date: 'Today (Jul 26)',
    items: [
      { storeId: 's1', productName: 'MacBook Pro 14"', category: 'electronics', qtySold: 8, revenue: 559997 },
      { storeId: 's2', productName: 'Running Shoes Nike', category: 'clothing', qtySold: 15, revenue: 67495 },
      { storeId: 's3', productName: 'Protein Bar Box', category: 'food', qtySold: 24, revenue: 33591 },
    ],
  },
  {
    date: 'Yesterday (Jul 25)',
    items: [
      { storeId: 's1', productName: 'Power Drill Set', category: 'tools', qtySold: 5, revenue: 33248 },
      { storeId: 's2', productName: 'iPhone 16 Pro', category: 'electronics', qtySold: 4, revenue: 153998 },
      { storeId: 's3', productName: 'Organic Coffee Beans', category: 'food', qtySold: 18, revenue: 15743 },
    ],
  },
  {
    date: 'Jul 24, 2026',
    items: [
      { storeId: 's1', productName: 'Winter Jacket', category: 'clothing', qtySold: 6, revenue: 41997 },
      { storeId: 's2', productName: 'iPad Air 11"', category: 'electronics', qtySold: 5, revenue: 122498 },
      { storeId: 's3', productName: 'Green Tea Matcha', category: 'food', qtySold: 16, revenue: 11194 },
    ],
  },
  {
    date: 'Jul 23, 2026',
    items: [
      { storeId: 's1', productName: 'Wrench Set 14pc', category: 'tools', qtySold: 7, revenue: 15922 },
      { storeId: 's2', productName: 'Wireless Mouse', category: 'electronics', qtySold: 12, revenue: 25195 },
      { storeId: 's3', productName: 'Tape Measure 25ft', category: 'tools', qtySold: 10, revenue: 8746 },
    ],
  },
];

const STORE_COLORS: Record<string, string> = {
  s1: '#208AEF',
  s2: '#5E6CF6',
  s3: '#F97316',
};

/** Format currency short (e.g. 1,234,567 → ฿1.23M or 285,000 → ฿285K) */
function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value.toLocaleString()}`;
}

export default function FinancesScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';
  const borderColor = isDark ? '#27272A' : '#E4E4E7';
  const dividerColor = isDark ? '#27272A' : '#F4F4F5';

  const { products } = useInventory();
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  // Active States
  const [selectedChartStore, setSelectedChartStore] = useState('all');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(MONTHLY_SALES_BY_STORE.length - 1);
  const [selectedDailyStoreFilter, setSelectedDailyStoreFilter] = useState('all');

  // Total Calculations
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const estimatedCost = totalValue * 0.65;
  const potentialProfit = totalValue - estimatedCost;

  // Category breakdown
  const categoryFinances = CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
    const catProducts = products.filter((p) => p.category === cat.id);
    const value = catProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    return { ...cat, value, percentage };
  });

  // Store comparison calculations based on real product storeQuantities
  const storeComparison = STORES.map((store) => {
    let storeValue = 0;
    let storeUnits = 0;
    products.forEach((p) => {
      const q = p.storeQuantities?.[store.id] ?? (p.storeIds?.includes(store.id) ? p.quantity : 0);
      storeUnits += q;
      storeValue += q * p.price;
    });
    const percentage = totalValue > 0 ? (storeValue / totalValue) * 100 : 0;
    return { ...store, storeValue, storeUnits, percentage, color: STORE_COLORS[store.id] || SemanticColors.primary };
  });

  // Active Month Data & Dynamic Max calculation
  const activeMonthData = MONTHLY_SALES_BY_STORE[selectedMonthIdx];

  const getStoreVal = (item: MonthlyStorePoint, storeKey: string) => {
    if (storeKey === 's1') return item.s1;
    if (storeKey === 's2') return item.s2;
    if (storeKey === 's3') return item.s3;
    return item.total2026;
  };

  const chartMaxVal = selectedChartStore === 'all'
    ? Math.max(...MONTHLY_SALES_BY_STORE.map((d) => d.total2026))
    : Math.max(...MONTHLY_SALES_BY_STORE.map((d) => getStoreVal(d, selectedChartStore)));

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Finances" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>

            {/* ──── COMPACT KPI SUMMARY CARD ──── */}
            <View style={[styles.kpiCard, { backgroundColor: cardBg, shadowColor }]}>
              {/* Asset Value */}
              <View style={styles.kpiCol}>
                <View style={[styles.kpiIconCircle, { backgroundColor: SemanticColors.primaryLight }]}>
                  <SymbolView
                    name={{ ios: 'banknote', android: 'account_balance_wallet', web: 'account_balance_wallet' }}
                    size={16}
                    tintColor={SemanticColors.primary}
                  />
                </View>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  Asset Value
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.primary }]} numberOfLines={1}>
                  {formatCurrencyShort(totalValue)}
                </ThemedText>
              </View>

              <View style={[styles.kpiDivider, { backgroundColor: dividerColor }]} />

              {/* Est. Cost */}
              <View style={styles.kpiCol}>
                <View style={[styles.kpiIconCircle, { backgroundColor: SemanticColors.warningLight }]}>
                  <SymbolView
                    name={{ ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' }}
                    size={16}
                    tintColor={SemanticColors.warning}
                  />
                </View>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  Est. Cost
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.warning }]} numberOfLines={1}>
                  {formatCurrencyShort(estimatedCost)}
                </ThemedText>
              </View>

              <View style={[styles.kpiDivider, { backgroundColor: dividerColor }]} />

              {/* Profit */}
              <View style={styles.kpiCol}>
                <View style={[styles.kpiIconCircle, { backgroundColor: SemanticColors.successLight }]}>
                  <SymbolView
                    name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
                    size={16}
                    tintColor={SemanticColors.success}
                  />
                </View>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  Profit
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.success }]} numberOfLines={1}>
                  {formatCurrencyShort(potentialProfit)}
                </ThemedText>
              </View>
            </View>

            {/* ──── MONTHLY SALES CHART ──── */}
            <View style={[styles.chartCard, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Monthly Sales
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Revenue trend by store · Jan – Jul 2026
              </ThemedText>

              {/* Store Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <CategoryChip
                  label="All Stores"
                  isSelected={selectedChartStore === 'all'}
                  color={SemanticColors.primary}
                  onPress={() => setSelectedChartStore('all')}
                />
                {STORES.map((s) => (
                  <CategoryChip
                    key={s.id}
                    label={s.name.split(' - ')[0]}
                    isSelected={selectedChartStore === s.id}
                    color={STORE_COLORS[s.id] || SemanticColors.primary}
                    onPress={() => setSelectedChartStore(s.id)}
                  />
                ))}
              </ScrollView>

              {/* Bar Chart */}
              <View style={styles.chartContainer}>
                {/* Y-axis gridlines */}
                <View style={styles.gridLineContainer}>
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                    <View key={ratio} style={styles.gridLineRow}>
                      <ThemedText style={[styles.yAxisText, { color: theme.textSecondary }]} numberOfLines={1}>
                        ฿{Math.round((chartMaxVal * ratio) / 1000)}k
                      </ThemedText>
                      <View style={[styles.gridLine, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]} />
                    </View>
                  ))}
                </View>

                {/* Plot area */}
                <View style={styles.plotArea}>
                  {MONTHLY_SALES_BY_STORE.map((d, idx) => {
                    const isSelected = selectedMonthIdx === idx;
                    const hS1 = (d.s1 / (chartMaxVal * 1.15)) * 100;
                    const hS2 = (d.s2 / (chartMaxVal * 1.15)) * 100;
                    const hS3 = (d.s3 / (chartMaxVal * 1.15)) * 100;

                    return (
                      <Pressable
                        key={d.month}
                        onPress={() => setSelectedMonthIdx(idx)}
                        style={styles.barCol}
                      >
                        <View style={styles.barTrack}>
                          {/* Stacked / individual bars */}
                          {(selectedChartStore === 'all' || selectedChartStore === 's1') && (
                            <View style={[styles.barSegment, {
                              height: `${hS1}%`,
                              backgroundColor: STORE_COLORS.s1,
                              opacity: isSelected ? 1 : 0.6,
                            }]} />
                          )}
                          {(selectedChartStore === 'all' || selectedChartStore === 's2') && (
                            <View style={[styles.barSegment, {
                              height: `${hS2}%`,
                              backgroundColor: STORE_COLORS.s2,
                              opacity: isSelected ? 1 : 0.6,
                            }]} />
                          )}
                          {(selectedChartStore === 'all' || selectedChartStore === 's3') && (
                            <View style={[styles.barSegment, {
                              height: `${hS3}%`,
                              backgroundColor: STORE_COLORS.s3,
                              opacity: isSelected ? 1 : 0.6,
                            }]} />
                          )}
                          {/* Dot indicator for selected month */}
                          {isSelected && (
                            <View style={[styles.barDot, {
                              backgroundColor: selectedChartStore === 'all'
                                ? SemanticColors.primary
                                : STORE_COLORS[selectedChartStore] || SemanticColors.primary,
                            }]} />
                          )}
                        </View>
                        <ThemedText style={[
                          styles.xAxisText,
                          {
                            color: isSelected ? SemanticColors.primary : theme.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                          {d.month}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Selected Month Breakdown */}
              <View style={[styles.breakdownBadge, { backgroundColor: isDark ? '#1F2937' : '#F0F4FF' }]}>
                <View style={styles.breakdownBadgeTop}>
                  <ThemedText style={[styles.breakdownBadgeMonth, { color: theme.text }]}>
                    {activeMonthData.month} 2026
                  </ThemedText>
                  <ThemedText style={[styles.breakdownBadgeTotal, { color: SemanticColors.primary }]}>
                    ฿{activeMonthData.total2026.toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.breakdownBadgeStores}>
                  {[
                    { key: 's1', label: 'Bangkok', val: activeMonthData.s1 },
                    { key: 's2', label: 'Siam Paragon', val: activeMonthData.s2 },
                    { key: 's3', label: 'Samut Prakan', val: activeMonthData.s3 },
                  ].map((s) => (
                    <View key={s.key} style={styles.breakdownStoreItem}>
                      <View style={[styles.breakdownDot, { backgroundColor: STORE_COLORS[s.key] }]} />
                      <ThemedText style={[styles.breakdownStoreLabel, { color: theme.textSecondary }]}>
                        {s.label}
                      </ThemedText>
                      <ThemedText style={[styles.breakdownStoreVal, { color: theme.text }]}>
                        ฿{s.val.toLocaleString()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ──── DAILY TOP SELLERS ──── */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Daily Top Sellers
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Best performing item each day
              </ThemedText>

              {/* Store Filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <CategoryChip
                  label="All Stores"
                  isSelected={selectedDailyStoreFilter === 'all'}
                  color={SemanticColors.primary}
                  onPress={() => setSelectedDailyStoreFilter('all')}
                />
                {STORES.map((s) => (
                  <CategoryChip
                    key={s.id}
                    label={s.name.split(' - ')[0]}
                    isSelected={selectedDailyStoreFilter === s.id}
                    color={STORE_COLORS[s.id] || SemanticColors.primary}
                    onPress={() => setSelectedDailyStoreFilter(s.id)}
                  />
                ))}
              </ScrollView>

              {/* Seller List */}
              <View style={styles.sellerList}>
                {DAILY_TOP_SELLERS.map((day) => {
                  const filteredItems = day.items.filter(
                    (item) => selectedDailyStoreFilter === 'all' || item.storeId === selectedDailyStoreFilter
                  );
                  if (filteredItems.length === 0) return null;

                  return (
                    <View key={day.date} style={[styles.dayGroup, { borderColor }]}>
                      <View style={styles.dayHeader}>
                        <SymbolView
                          name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                          size={13}
                          tintColor={theme.textSecondary}
                        />
                        <ThemedText style={[styles.dayDate, { color: theme.text }]}>
                          {day.date}
                        </ThemedText>
                      </View>

                      {filteredItems.map((item, i) => {
                        const storeObj = STORES.find((s) => s.id === item.storeId);
                        const storeName = storeObj ? storeObj.name.split(' - ')[0] : item.storeId;
                        const storeColor = STORE_COLORS[item.storeId] || SemanticColors.primary;

                        return (
                          <View key={i} style={[styles.sellerRow, i > 0 && { borderTopWidth: 1, borderTopColor: dividerColor }]}>
                            <View style={styles.sellerLeft}>
                              <View style={styles.sellerNameRow}>
                                <ThemedText style={[styles.sellerName, { color: theme.text }]} numberOfLines={1}>
                                  {item.productName}
                                </ThemedText>
                                <View style={[styles.storePill, { backgroundColor: storeColor + '18' }]}>
                                  <ThemedText style={[styles.storePillText, { color: storeColor }]}>
                                    {storeName}
                                  </ThemedText>
                                </View>
                              </View>
                              <ThemedText style={[styles.sellerMeta, { color: theme.textSecondary }]}>
                                {item.qtySold} units sold
                              </ThemedText>
                            </View>
                            <ThemedText style={[styles.sellerRevenue, { color: SemanticColors.success }]}>
                              ฿{item.revenue.toLocaleString()}
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ──── STORE COMPARISON ──── */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Store Comparison
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Asset value by location
              </ThemedText>

              <View style={styles.compList}>
                {storeComparison.map((st) => (
                  <View key={st.id} style={[styles.compRow, { borderColor }]}>
                    <View style={styles.compHeader}>
                      <View style={styles.compLeft}>
                        <View style={[styles.compDot, { backgroundColor: st.color }]} />
                        <View style={styles.compInfo}>
                          <ThemedText style={[styles.compName, { color: theme.text }]} numberOfLines={1}>
                            {st.name}
                          </ThemedText>
                          <ThemedText style={[styles.compMeta, { color: theme.textSecondary }]}>
                            {st.type} · {st.storeUnits.toLocaleString()} units
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.compValue, { color: st.color }]} numberOfLines={1}>
                        ฿{st.storeValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </ThemedText>
                    </View>
                    {/* Progress bar */}
                    <View style={styles.progressRow}>
                      <View style={[styles.progressBg, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
                        <View style={[styles.progressFill, { width: `${Math.max(3, st.percentage)}%`, backgroundColor: st.color }]} />
                      </View>
                      <ThemedText style={[styles.progressPct, { color: theme.textSecondary }]}>
                        {st.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ──── CATEGORY BREAKDOWN ──── */}
            <View style={[styles.card, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Value by Category
              </ThemedText>

              <View style={styles.catList}>
                {categoryFinances.map((cat) => (
                  <View key={cat.id} style={styles.catRow}>
                    <View style={styles.catInfo}>
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <ThemedText style={[styles.catName, { color: theme.text }]}>
                        {cat.name}
                      </ThemedText>
                      <ThemedText style={[styles.catVal, { color: theme.text }]}>
                        ฿{cat.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </ThemedText>
                    </View>
                    <View style={styles.progressRow}>
                      <View style={[styles.progressBg, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
                        <View style={[styles.progressFill, { width: `${Math.max(3, cat.percentage)}%`, backgroundColor: cat.color }]} />
                      </View>
                      <ThemedText style={[styles.progressPct, { color: theme.textSecondary }]}>
                        {cat.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: Spacing.three,
  },
  centered: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    gap: 16,
  },

  /* ── KPI Summary Card ── */
  kpiCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  kpiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiDivider: {
    width: 1,
    height: 48,
    marginHorizontal: 4,
  },

  /* ── Shared Card ── */
  card: {
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },

  /* ── Section Typography ── */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: -4,
  },

  /* ── Chip Row ── */
  chipRow: {
    gap: 8,
    paddingVertical: 4,
  },

  /* ── Monthly Chart ── */
  chartCard: {
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  chartContainer: {
    height: 200,
    position: 'relative',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  gridLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yAxisText: {
    fontSize: 10,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  gridLine: {
    flex: 1,
    height: 1,
  },
  plotArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 48,
    height: 180,
    alignItems: 'flex-end',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
    gap: 2,
  },
  barSegment: {
    width: 10,
    borderRadius: 5,
    minHeight: 4,
  },
  barDot: {
    position: 'absolute',
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  xAxisText: {
    fontSize: 12,
    marginTop: 6,
  },

  /* ── Month Breakdown Badge ── */
  breakdownBadge: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  breakdownBadgeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownBadgeMonth: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownBadgeTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  breakdownBadgeStores: {
    gap: 6,
  },
  breakdownStoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownStoreLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  breakdownStoreVal: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* ── Daily Top Sellers ── */
  sellerList: {
    gap: 10,
  },
  dayGroup: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sellerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  storePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sellerMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  sellerRevenue: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },

  /* ── Store Comparison ── */
  compList: {
    gap: 10,
  },
  compRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  compDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compInfo: {
    flex: 1,
  },
  compName: {
    fontSize: 14,
    fontWeight: '700',
  },
  compMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  compValue: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
  },

  /* ── Shared Progress Bar ── */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },

  /* ── Category Breakdown ── */
  catList: {
    gap: 14,
  },
  catRow: {
    gap: 6,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  catVal: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
});
