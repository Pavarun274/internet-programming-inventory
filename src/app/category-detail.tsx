import { useLocalSearchParams, router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard } from '@/components/product-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/constants/inventory-data';
import { getCategoryStyles } from '@/constants/category-meta';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';

export default function CategoryDetailScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { products } = useInventory();

  const category = CATEGORIES.find((c) => c.id === id);
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  if (!category) {
    return (
      <ThemedView style={styles.flex}>
        <AppHeader title="Category" onBackPress={() => router.navigate('/categories')} />
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            Category not found
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const meta = getCategoryStyles(category.id, isDark);
  const items = products.filter((p) => p.category === category.id);

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title={category.name} onBackPress={() => router.navigate('/categories')} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>
            <View style={styles.sectionHeader}>
              <SymbolView name={meta.icon} size={20} tintColor={meta.color} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                {category.name}
              </ThemedText>
              <ThemedText
                style={[
                  styles.sectionCount,
                  { color: meta.color, backgroundColor: meta.bg },
                ]}
              >
                {items.length}
              </ThemedText>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  No products in this category
                </ThemedText>
              </View>
            ) : (
              items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onPress={() => router.push(`/product-detail?id=${p.id}` as any)}
                />
              ))
            )}
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
  content: { flex: 1, gap: Spacing.two, paddingTop: Spacing.three },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
