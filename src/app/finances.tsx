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

export default function FinancesScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';
  const borderColor = isDark ? '#27272A' : '#E4E4E7';

  const { products } = useInventory();
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  // Active States
  const [selectedChartStore, setSelectedChartStore] = useState('all'); // 'all' | 's1' | 's2' | 's3'
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
    return {
      ...cat,
      value,
      percentage,
    };
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

    return {
      ...store,
      storeValue,
      storeUnits,
      percentage,
      color: STORE_COLORS[store.id] || SemanticColors.primary,
    };
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
            {/* Page Header */}
            <View style={styles.header}>
              <ThemedText style={[styles.heading, { color: theme.text }]}>
                Financial Overview
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Analyze store-by-store sales trends, daily top sellers, and asset distributions
              </ThemedText>
            </View>

            {/* KPI Cards */}
            <View style={styles.list}>
              <View style={[styles.financeCard, { backgroundColor: cardBg, shadowColor }]}>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  TOTAL ASSET VALUE (RETAIL)
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.primary }]}>
                  ฿{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
                <ThemedText style={[styles.kpiDescription, { color: theme.textSecondary }]}>
                  Total selling value of all items currently in stock
                </ThemedText>
              </View>

              <View style={[styles.financeCard, { backgroundColor: cardBg, shadowColor }]}>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  ESTIMATED ACQUISITION COST
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.warning }]}>
                  ฿{estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
                <ThemedText style={[styles.kpiDescription, { color: theme.textSecondary }]}>
                  Calculated cost based on wholesale estimation
                </ThemedText>
              </View>

              <View style={[styles.financeCard, { backgroundColor: cardBg, shadowColor }]}>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  POTENTIAL GROSS PROFIT
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.success }]}>
                  ฿{potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
                <ThemedText style={[styles.kpiDescription, { color: theme.textSecondary }]}>
                  Revenue remaining after deducting estimated acquisition cost
                </ThemedText>
              </View>
            </View>

            {/* FEATURE 1: Interactive Monthly Line Chart with Store Separation */}
            <View style={[styles.chartCard, { backgroundColor: cardBg, shadowColor }]}>
              <View style={styles.chartHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                    Monthly Sales Trend (Separated by Store)
                  </ThemedText>
                  <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                    Select store or view all multi-store lines simultaneously
                  </ThemedText>
                </View>
              </View>

              {/* Store Tabs for Line Chart */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartStoreFilterRow}
              >
                <CategoryChip
                  label="All Stores (Multi-Line)"
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

              {/* Multi-Store Legend */}
              <View style={styles.multiLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: STORE_COLORS.s1 }]} />
                  <ThemedText style={[styles.legendText, { color: theme.text }]}>Bangkok Warehouse</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: STORE_COLORS.s2 }]} />
                  <ThemedText style={[styles.legendText, { color: theme.text }]}>Siam Paragon</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: STORE_COLORS.s3 }]} />
                  <ThemedText style={[styles.legendText, { color: theme.text }]}>Samut Prakan</ThemedText>
                </View>
              </View>

              {/* Active Month Store Breakdown Box */}
              <View style={[styles.monthBadgeCard, { backgroundColor: isDark ? '#1F2937' : '#EFF6FF' }]}>
                <View style={styles.monthBadgeHeader}>
                  <ThemedText style={[styles.monthBadgeTitle, { color: theme.text }]}>
                    {activeMonthData.month} 2026 Sales Breakdown
                  </ThemedText>
                  <ThemedText style={[styles.monthBadgeTotal, { color: SemanticColors.primary }]}>
                    Total: ฿{activeMonthData.total2026.toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.storeBreakdownGrid}>
                  <View style={styles.storeBreakdownItem}>
                    <ThemedText style={[styles.storeBreakdownLabel, { color: STORE_COLORS.s1 }]}>
                      Bangkok:
                    </ThemedText>
                    <ThemedText style={[styles.storeBreakdownVal, { color: theme.text }]}>
                      ฿{activeMonthData.s1.toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.storeBreakdownItem}>
                    <ThemedText style={[styles.storeBreakdownLabel, { color: STORE_COLORS.s2 }]}>
                      Siam Paragon:
                    </ThemedText>
                    <ThemedText style={[styles.storeBreakdownVal, { color: theme.text }]}>
                      ฿{activeMonthData.s2.toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.storeBreakdownItem}>
                    <ThemedText style={[styles.storeBreakdownLabel, { color: STORE_COLORS.s3 }]}>
                      Samut Prakan:
                    </ThemedText>
                    <ThemedText style={[styles.storeBreakdownVal, { color: theme.text }]}>
                      ฿{activeMonthData.s3.toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Line Chart Visual Graph */}
              <View style={styles.lineChartContainer}>
                {/* Horizontal Gridlines */}
                <View style={styles.gridLineContainer}>
                  {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                    <View key={ratio} style={styles.gridLineRow}>
                      <ThemedText style={[styles.yAxisText, { color: theme.textSecondary }]}>
                        ฿{Math.round((chartMaxVal * ratio) / 1000)}k
                      </ThemedText>
                      <View style={[styles.gridDashLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                    </View>
                  ))}
                </View>

                {/* Plot Area */}
                <View style={styles.plotArea}>
                  {MONTHLY_SALES_BY_STORE.map((d, idx) => {
                    const isSelected = selectedMonthIdx === idx;
                    const hS1 = (d.s1 / (chartMaxVal * 1.1)) * 100;
                    const hS2 = (d.s2 / (chartMaxVal * 1.1)) * 100;
                    const hS3 = (d.s3 / (chartMaxVal * 1.1)) * 100;
                    const hTotal = (d.total2026 / (chartMaxVal * 1.1)) * 100;

                    return (
                      <Pressable
                        key={d.month}
                        onPress={() => setSelectedMonthIdx(idx)}
                        style={styles.lineCol}
                      >
                        <View style={styles.trackArea}>
                          {/* Store 1 Line Node (Bangkok) */}
                          {(selectedChartStore === 'all' || selectedChartStore === 's1') && (
                            <View
                              style={[
                                styles.storeNode,
                                {
                                  bottom: `${hS1}%`,
                                  backgroundColor: STORE_COLORS.s1,
                                  borderColor: isSelected ? '#fff' : 'transparent',
                                  transform: [{ scale: isSelected ? 1.3 : 1 }],
                                },
                              ]}
                            />
                          )}

                          {/* Store 2 Line Node (Siam Paragon) */}
                          {(selectedChartStore === 'all' || selectedChartStore === 's2') && (
                            <View
                              style={[
                                styles.storeNode,
                                {
                                  bottom: `${hS2}%`,
                                  backgroundColor: STORE_COLORS.s2,
                                  borderColor: isSelected ? '#fff' : 'transparent',
                                  transform: [{ scale: isSelected ? 1.3 : 1 }],
                                },
                              ]}
                            />
                          )}

                          {/* Store 3 Line Node (Samut Prakan) */}
                          {(selectedChartStore === 'all' || selectedChartStore === 's3') && (
                            <View
                              style={[
                                styles.storeNode,
                                {
                                  bottom: `${hS3}%`,
                                  backgroundColor: STORE_COLORS.s3,
                                  borderColor: isSelected ? '#fff' : 'transparent',
                                  transform: [{ scale: isSelected ? 1.3 : 1 }],
                                },
                              ]}
                            />
                          )}

                          {/* Connecting Column Segment */}
                          <View
                            style={[
                              styles.lineSegment,
                              {
                                height: selectedChartStore === 'all' ? `${hTotal}%` : `${(getStoreVal(d, selectedChartStore) / (chartMaxVal * 1.1)) * 100}%`,
                                backgroundColor: isSelected
                                  ? SemanticColors.primary
                                  : isDark
                                  ? '#1E3A8A'
                                  : '#DBEAFE',
                              },
                            ]}
                          />
                        </View>
                        <ThemedText
                          style={[
                            styles.xAxisText,
                            {
                              color: isSelected ? SemanticColors.primary : theme.textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {d.month}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* SEPARATE STORE LINE CHARTS GRID (กราฟแยกรายสาขาแต่ละคลัง) */}
            <View style={[styles.distributionCard, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Separate Store Sales Graphs (กราฟแยกแต่ละ Store)
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Individual monthly line trajectory per store location
              </ThemedText>

              <View style={styles.miniChartGrid}>
                {STORES.map((store) => {
                  const sColor = STORE_COLORS[store.id] || SemanticColors.primary;
                  const storeMax = Math.max(...MONTHLY_SALES_BY_STORE.map((d) => getStoreVal(d, store.id)));
                  const latestVal = getStoreVal(MONTHLY_SALES_BY_STORE[MONTHLY_SALES_BY_STORE.length - 1], store.id);

                  return (
                    <View key={store.id} style={[styles.miniChartCard, { borderColor }]}>
                      <View style={styles.miniChartHeader}>
                        <View style={styles.storeTitleWrapper}>
                          <View style={[styles.storeColorDot, { backgroundColor: sColor }]} />
                          <ThemedText style={[styles.miniChartTitle, { color: theme.text }]} numberOfLines={1}>
                            {store.name.split(' - ')[0]}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.miniChartVal, { color: sColor }]}>
                          ฿{latestVal.toLocaleString()}
                        </ThemedText>
                      </View>

                      {/* Mini Line Chart */}
                      <View style={styles.miniLineCanvas}>
                        <View style={styles.miniPlotRow}>
                          {MONTHLY_SALES_BY_STORE.map((d) => {
                            const val = getStoreVal(d, store.id);
                            const hPct = (val / (storeMax * 1.15)) * 100;
                            return (
                              <View key={d.month} style={styles.miniCol}>
                                <View
                                  style={[
                                    styles.miniBarFill,
                                    {
                                      height: `${hPct}%`,
                                      backgroundColor: sColor,
                                    },
                                  ]}
                                />
                                <ThemedText style={[styles.miniMonthText, { color: theme.textSecondary }]}>
                                  {d.month.charAt(0)}
                                </ThemedText>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* FEATURE 2: Daily Top Selling Product per Store */}
            <View style={[styles.distributionCard, { backgroundColor: cardBg, shadowColor }]}>
              <View style={styles.headerWithFilter}>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                    Daily Top Selling Products
                  </ThemedText>
                  <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                    Best performing item each day by store
                  </ThemedText>
                </View>

                {/* Store Filter Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
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
              </View>

              {/* Daily Top Sellers List */}
              <View style={styles.topSellersList}>
                {DAILY_TOP_SELLERS.map((day) => {
                  const filteredItems = day.items.filter(
                    (item) => selectedDailyStoreFilter === 'all' || item.storeId === selectedDailyStoreFilter
                  );

                  if (filteredItems.length === 0) return null;

                  return (
                    <View key={day.date} style={[styles.dayCard, { borderColor }]}>
                      <View style={styles.dayHeader}>
                        <SymbolView
                          name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                          size={14}
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
                          <View key={i} style={styles.topSellerRow}>
                            <View style={styles.topSellerInfo}>
                              <View style={styles.productBadgeRow}>
                                <ThemedText style={[styles.topSellerName, { color: theme.text }]} numberOfLines={1}>
                                  {item.productName}
                                </ThemedText>
                                <View style={[styles.storePill, { backgroundColor: storeColor + '20' }]}>
                                  <ThemedText style={[styles.storePillText, { color: storeColor }]}>
                                    {storeName}
                                  </ThemedText>
                                </View>
                              </View>
                              <ThemedText style={[styles.topSellerMeta, { color: theme.textSecondary }]}>
                                {item.qtySold} units sold today
                              </ThemedText>
                            </View>
                            <View style={styles.topSellerRev}>
                              <ThemedText style={[styles.topSellerRevVal, { color: SemanticColors.success }]}>
                                ฿{item.revenue.toLocaleString()}
                              </ThemedText>
                              <ThemedText style={[styles.topSellerBadge, { color: SemanticColors.primary }]}>
                                #1 Top Seller
                              </ThemedText>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* FEATURE 3: Store Financial & Asset Comparison Chart */}
            <View style={[styles.distributionCard, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Store Financial & Asset Comparison
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Asset value and stock distribution across store locations
              </ThemedText>

              <View style={styles.storeCompList}>
                {storeComparison.map((st) => (
                  <View key={st.id} style={[styles.storeCompCard, { borderColor }]}>
                    <View style={styles.storeCompHeader}>
                      <View style={styles.storeTitleWrapper}>
                        <View style={[styles.storeColorDot, { backgroundColor: st.color }]} />
                        <View>
                          <ThemedText style={[styles.storeCompName, { color: theme.text }]}>
                            {st.name}
                          </ThemedText>
                          <ThemedText style={[styles.storeCompSub, { color: theme.textSecondary }]}>
                            {st.type} · {st.storeUnits.toLocaleString()} units
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.storeCompVal, { color: st.color }]}>
                        ฿{st.storeValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </ThemedText>
                    </View>

                    {/* Value Share Progress Bar */}
                    <View style={styles.barWrapper}>
                      <View style={[styles.barBg, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(2, st.percentage)}%`,
                              backgroundColor: st.color,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={[styles.percentageText, { color: theme.textSecondary }]}>
                        {st.percentage.toFixed(1)}% share
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Category Breakdown Card */}
            <View style={[styles.distributionCard, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Value Breakdown by Category
              </ThemedText>

              <View style={styles.breakdownWrapper}>
                {categoryFinances.map((cat) => (
                  <View key={cat.id} style={styles.breakdownRow}>
                    <View style={styles.categoryInfo}>
                      <ThemedText style={[styles.categoryName, { color: theme.text }]}>
                        {cat.name}
                      </ThemedText>
                      <ThemedText style={[styles.categoryValText, { color: theme.text }]}>
                        ฿{cat.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </ThemedText>
                    </View>
                    <View style={styles.barWrapper}>
                      <View style={[styles.barBg, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(2, cat.percentage)}%`,
                              backgroundColor: cat.color,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText style={[styles.percentageText, { color: theme.textSecondary }]}>
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
  list: {
    gap: Spacing.three,
  },
  financeCard: {
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  kpiDescription: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  distributionCard: {
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chartCard: {
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartStoreFilterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  multiLegendRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthBadgeCard: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  monthBadgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthBadgeTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthBadgeTotal: {
    fontSize: 15,
    fontWeight: '800',
  },
  storeBreakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  storeBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeBreakdownLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  storeBreakdownVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  lineChartContainer: {
    height: 180,
    marginTop: 8,
    position: 'relative',
    justifyContent: 'flex-end',
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
    gap: 8,
  },
  yAxisText: {
    fontSize: 10,
    fontWeight: '600',
    width: 32,
  },
  gridDashLine: {
    flex: 1,
    height: 1,
  },
  plotArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 40,
    height: 160,
    alignItems: 'flex-end',
  },
  lineCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    flex: 1,
  },
  trackArea: {
    height: 130,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  storeNode: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    zIndex: 3,
  },
  lineSegment: {
    width: 3,
    borderRadius: 2,
  },
  xAxisText: {
    fontSize: 11,
    marginTop: 8,
  },
  miniChartGrid: {
    gap: 12,
  },
  miniChartCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  miniChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniChartTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  miniChartVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  miniLineCanvas: {
    height: 60,
    justifyContent: 'flex-end',
  },
  miniPlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 50,
  },
  miniCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  miniBarFill: {
    width: 6,
    borderRadius: 3,
  },
  miniMonthText: {
    fontSize: 9,
    fontWeight: '600',
  },
  headerWithFilter: {
    gap: 10,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  topSellersList: {
    gap: 12,
  },
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  topSellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  topSellerInfo: {
    flex: 1,
    paddingRight: 8,
  },
  productBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  topSellerName: {
    fontSize: 14,
    fontWeight: '600',
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
  topSellerMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  topSellerRev: {
    alignItems: 'flex-end',
  },
  topSellerRevVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  topSellerBadge: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  storeCompList: {
    gap: 12,
  },
  storeCompCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  storeCompHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeCompName: {
    fontSize: 14,
    fontWeight: '700',
  },
  storeCompSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  storeCompVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  breakdownWrapper: {
    gap: 14,
  },
  breakdownRow: {
    gap: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryValText: {
    fontSize: 14,
    fontWeight: '700',
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
});
