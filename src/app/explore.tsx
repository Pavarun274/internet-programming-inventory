import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { CategoryChip } from '@/components/category-chip';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/inventory-data';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { SortOption } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name: A-Z' },
  { id: 'qty-asc', label: 'Low Stock First' },
];

export default function ProductsScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
  } = useInventory();

  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Products" />
      <View style={[styles.flex]}>
        {/* Filter Header */}
        <View
          style={[
            styles.headerSection,
            {
              backgroundColor: theme.background,
              borderBottomColor: isDark ? '#27272A' : '#E4E4E7',
            },
          ]}
        >
          <View style={[styles.centeredRow, { maxWidth: MaxContentWidth }]}>
            <View style={styles.titleRow}>
              <View>
                <ThemedText style={[styles.title, { color: theme.text }]}>Products</ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {filteredProducts.length} items
                </ThemedText>
              </View>
            </View>

            {/* Search Row */}
            <View style={styles.searchRow}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search products, SKU..."
                style={styles.searchBar}
              />
              <Pressable
                onPress={() => setShowSortDropdown(!showSortDropdown)}
                style={({ pressed }) => [
                  styles.sortButton,
                  {
                    backgroundColor: theme.backgroundSelected,
                    borderColor: isDark ? '#27272A' : '#E4E4E7',
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <ThemedText style={styles.sortButtonText}>⇅</ThemedText>
              </Pressable>
            </View>

            {/* Sort Dropdown Selector */}
            {showSortDropdown && (
              <View
                style={[
                  styles.sortDropdown,
                  {
                    backgroundColor: isDark ? SemanticColors.cardDark : SemanticColors.card,
                    borderColor: isDark ? '#27272A' : '#E4E4E7',
                  },
                ]}
              >
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setSortOption(opt.id);
                      setShowSortDropdown(false);
                    }}
                    style={({ pressed }) => [
                      styles.sortOptionItem,
                      sortOption === opt.id && { backgroundColor: isDark ? '#27272A' : '#F4F4F5' },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.sortOptionText,
                        { color: theme.text },
                        sortOption === opt.id && { color: SemanticColors.primary, fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  isSelected={selectedCategory === cat.id}
                  color={cat.color}
                  onPress={() => setSelectedCategory(cat.id)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Product List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/add?id=${item.id}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No products found
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try adjusting your search or filters
              </ThemedText>
            </View>
          }
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerSection: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  centeredRow: {
    width: '100%',
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchBar: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonText: {
    fontSize: 20,
  },
  sortDropdown: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 20,
  },
  sortOptionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesScroll: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  listContent: {
    padding: Spacing.three,
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
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
