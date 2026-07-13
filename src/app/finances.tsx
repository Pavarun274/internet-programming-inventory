import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';

export default function FinancesScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const { products } = useInventory();
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  // Calculations
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const estimatedCost = totalValue * 0.65; // Mock: Cost is 65% of price
  const potentialProfit = totalValue - estimatedCost;

  // Values by category
  const getCategoryFinances = () => {
    return CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
      const catProducts = products.filter((p) => p.category === cat.id);
      const value = catProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return {
        ...cat,
        value,
        percentage,
      };
    });
  };

  const categoryFinances = getCategoryFinances();

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
            <View style={styles.header}>
              <ThemedText style={[styles.heading, { color: theme.text }]}>
                Financial Overview
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Analyze your inventory values, potential profits, and cost breakdown
              </ThemedText>
            </View>

            {/* KPI Cards */}
            <View style={styles.list}>
              <View style={[styles.financeCard, { backgroundColor: cardBg, shadowColor }]}>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  TOTAL ASSET VALUE (RETAIL)
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.primary }]}>
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
                <ThemedText style={[styles.kpiDescription, { color: theme.textSecondary }]}>
                  Total selling value of all items in stock
                </ThemedText>
              </View>

              <View style={[styles.financeCard, { backgroundColor: cardBg, shadowColor }]}>
                <ThemedText style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                  ESTIMATED ACQUISITION COST
                </ThemedText>
                <ThemedText style={[styles.kpiValue, { color: SemanticColors.warning }]}>
                  ${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  ${potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
                <ThemedText style={[styles.kpiDescription, { color: theme.textSecondary }]}>
                  Revenue remaining after deducting product costs
                </ThemedText>
              </View>
            </View>

            {/* Category Distribution */}
            <View style={[styles.distributionCard, { backgroundColor: cardBg, shadowColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Value Breakdown by Category
              </ThemedText>

              <View style={styles.breakdownWrapper}>
                {categoryFinances.map((cat) => (
                  <View key={cat.id} style={styles.breakdownRow}>
                    <View style={styles.categoryInfo}>
                      <ThemedText style={styles.categoryName}>
                        {cat.icon} {cat.name}
                      </ThemedText>
                      <ThemedText style={[styles.categoryValText, { color: theme.text }]}>
                        ${cat.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </ThemedText>
                    </View>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(2, cat.percentage)}%`,
                            backgroundColor: cat.color,
                          },
                        ]}
                      />
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
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
});
