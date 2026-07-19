import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { SymbolView } from 'expo-symbols';
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
  const [isSearching, setIsSearching] = useState(false);

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

            {/* Search / Action Row */}
            {isSearching ? (
              <View style={styles.searchRowActive}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search products..."
                  style={styles.searchBarActive}
                />
                <Pressable
                  onPress={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  style={styles.closeSearchBtn}
                >
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={18}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>
              </View>
            ) : (
              <View style={styles.searchRow}>
                {/* Search Toggle Button */}
                <Pressable
                  onPress={() => setIsSearching(true)}
                  style={({ pressed }) => [
                    styles.searchIconButton,
                    { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <SymbolView
                    name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                    size={18}
                    tintColor={SemanticColors.primary}
                  />
                </Pressable>

                {/* Add Product Button */}
                <Pressable
                  onPress={() => router.push('/add' as any)}
                  style={({ pressed }) => [
                    styles.addProductBtnRow,
                    { backgroundColor: SemanticColors.primary, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={14}
                    tintColor="#fff"
                    weight="bold"
                  />
                  <ThemedText style={styles.addProductBtnText}>Add Product</ThemedText>
                </Pressable>

                {/* Filter Button */}
                <Pressable
                  onPress={() => setShowSortDropdown(!showSortDropdown)}
                  style={({ pressed }) => [
                    styles.filterBtnRow,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: isDark ? '#27272A' : '#E4E4E7',
                      opacity: pressed ? 0.8 : 1,
                    }
                  ]}
                >
                  <ThemedText style={[styles.filterBtnText, { color: theme.textSecondary }]}>Filter</ThemedText>
                  <SymbolView
                    name={{ ios: 'line.3.horizontal.decrease.circle', android: 'filter_list', web: 'filter_list' }}
                    size={14}
                    tintColor={SemanticColors.primary}
                  />
                </Pressable>
              </View>
            )}

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
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  searchRowActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  searchBarActive: {
    flex: 1,
  },
  closeSearchBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProductBtnRow: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  addProductBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBtnRow: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    zIndex: 10,
  },
});
