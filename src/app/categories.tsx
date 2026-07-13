import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard } from '@/components/product-card';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { router } from 'expo-router';

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '💻',
  clothing: '👕',
  food: '☕',
  tools: '🔧',
};

export default function CategoriesScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const { products } = useInventory();

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  const getCategoryStyles = (id: string) => {
    switch (id) {
      case 'electronics':
        return {
          icon: CATEGORY_ICONS[id] || '📦',
          color: SemanticColors.primary,
          bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
        };
      case 'clothing':
        return {
          icon: CATEGORY_ICONS[id] || '📦',
          color: '#EC4899', // pink-500
          bg: isDark ? '#831843' : '#FCE7F3', // pink-900 / pink-100
        };
      case 'food':
        return {
          icon: CATEGORY_ICONS[id] || '📦',
          color: SemanticColors.warning,
          bg: isDark ? SemanticColors.warningDark : SemanticColors.warningLight,
        };
      case 'tools':
        return {
          icon: CATEGORY_ICONS[id] || '📦',
          color: SemanticColors.success,
          bg: isDark ? SemanticColors.successDark : SemanticColors.successLight,
        };
      default:
        return {
          icon: '📦',
          color: SemanticColors.primary,
          bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
        };
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Categories" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>

            <ThemedText style={[styles.heading, { color: theme.text }]}>
              All Categories
            </ThemedText>

            {/* Category Grid */}
            <View style={styles.grid}>
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                const meta = getCategoryStyles(cat.id);
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <View
                    key={cat.id}
                    style={[
                      styles.catCard,
                      { backgroundColor: cardBg, shadowColor },
                    ]}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                      <ThemedText style={styles.catIcon}>{meta.icon}</ThemedText>
                    </View>
                    <ThemedText style={[styles.catName, { color: theme.text }]}>
                      {cat.name}
                    </ThemedText>
                    <ThemedText style={[styles.catCount, { color: meta.color }]}>
                      {count} items
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            {/* Products by Category */}
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const meta = getCategoryStyles(cat.id);
              const items = products.filter((p) => p.category === cat.id);
              return (
                <View key={cat.id} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: meta.color }]} />
                    <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                      {meta.icon} {cat.name}
                    </ThemedText>
                    <ThemedText style={[styles.sectionCount, { color: meta.color }]}>
                      {items.length}
                    </ThemedText>
                  </View>
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onPress={() => router.push(`/add?id=${p.id}` as any)}
                    />
                  ))}
                </View>
              );
            })}


          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.three },
  centered: { flexDirection: 'row', justifyContent: 'center' },
  content: { flex: 1, gap: Spacing.three, paddingTop: Spacing.three },
  heading: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  catIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: { fontSize: 26 },
  catName: { fontSize: 15, fontWeight: '700' },
  catCount: { fontSize: 13, fontWeight: '600' },
  section: { gap: Spacing.two },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
});
