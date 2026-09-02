import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { SymbolView } from 'expo-symbols';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/inventory-data';
import { getCategoryStyles } from '@/constants/category-meta';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { SortOption } from '@/contexts/inventory-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

const ALL_SORT_OPTIONS: { id: SortOption; label: string; icon: any; isFinancial?: boolean }[] = [
  { id: 'default', label: 'Default', icon: { ios: 'line.3.horizontal.decrease', android: 'sort', web: 'sort' } },
  { id: 'price-asc', label: 'Price: Low to High', icon: { ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }, isFinancial: true },
  { id: 'price-desc', label: 'Price: High to Low', icon: { ios: 'arrow.down', android: 'arrow_downward', web: 'arrow_downward' }, isFinancial: true },
  { id: 'name-asc', label: 'Name: A-Z', icon: { ios: 'textformat', android: 'sort_by_alpha', web: 'sort_by_alpha' } },
  { id: 'name-desc', label: 'Name: Z-A', icon: { ios: 'textformat', android: 'sort_by_alpha', web: 'sort_by_alpha' } },
  { id: 'qty-asc', label: 'Low Stock First', icon: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' } },
];

export default function ProductsScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    sortOption,
    setSortOption,
  } = useInventory();
  const { user, hasFinancialAccess } = useAuth();
  const canManageProducts = user?.role !== 'user';
  const sortOptions = ALL_SORT_OPTIONS.filter((opt) => !opt.isFinancial || hasFinancialAccess);

  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const isAllCategories = selectedCategories.includes('all');
  const categoryTriggerLabel = isAllCategories
    ? 'All'
    : selectedCategories.length === 1
    ? CATEGORIES.find((c) => c.id === selectedCategories[0])?.name ?? 'All'
    : `${selectedCategories.length} Categories`;
  const categoryTriggerIconStyle = getCategoryStyles(
    isAllCategories || selectedCategories.length !== 1 ? 'all' : selectedCategories[0],
    isDark
  );

  const toggleCategory = (id: string) => {
    if (id === 'all') {
      setSelectedCategories(['all']);
      return;
    }
    const withoutAll = selectedCategories.filter((c) => c !== 'all');
    const next = withoutAll.includes(id)
      ? withoutAll.filter((c) => c !== id)
      : [...withoutAll, id];
    setSelectedCategories(next.length === 0 ? ['all'] : next);
  };

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  // Scrolls away with the product list (via ListHeaderComponent below)
  // instead of staying pinned, so it doesn't eat into the space available
  // for viewing products.
  const filterHeader = (
    <View
      style={[
        styles.headerSection,
        { borderBottomColor: isDark ? '#27272A' : '#E4E4E7' },
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
                !canManageProducts && styles.searchIconButtonExpanded,
                { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={18}
                tintColor={SemanticColors.primary}
              />
              {!canManageProducts && (
                <ThemedText style={[styles.searchIconButtonText, { color: theme.textSecondary }]}>
                  Search products
                </ThemedText>
              )}
            </Pressable>

            {/* Add Product Button */}
            {canManageProducts && (
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
            )}
          </View>
        )}

        {/* Category Dropdown + Filter, side by side */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => {
              setShowCategoryDropdown(!showCategoryDropdown);
              setShowSortDropdown(false);
            }}
            style={({ pressed }) => [
              styles.categoryDropdownTrigger,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: isDark ? '#27272A' : '#E4E4E7',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.dropdownItemIconWrap, { backgroundColor: categoryTriggerIconStyle.bg }]}>
              <SymbolView name={categoryTriggerIconStyle.icon} size={14} tintColor={categoryTriggerIconStyle.color} />
            </View>
            <ThemedText style={[styles.categoryDropdownText, { color: theme.text }]} numberOfLines={1}>
              {categoryTriggerLabel}
            </ThemedText>
            <SymbolView
              name={{
                ios: showCategoryDropdown ? 'chevron.up' : 'chevron.down',
                android: showCategoryDropdown ? 'expand_less' : 'expand_more',
                web: showCategoryDropdown ? 'expand_less' : 'expand_more',
              }}
              size={14}
              tintColor={theme.textSecondary}
            />
          </Pressable>

          {/* Filter Button */}
          <Pressable
            onPress={() => {
              setShowSortDropdown(!showSortDropdown);
              setShowCategoryDropdown(false);
            }}
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

        {/* Category Dropdown Panel — multi-select, stays open until "Done" or "All" */}
        {showCategoryDropdown && (
          <View
            style={[
              styles.dropdownPanel,
              {
                backgroundColor: isDark ? SemanticColors.cardDark : SemanticColors.card,
                borderColor: isDark ? '#27272A' : '#E4E4E7',
              },
            ]}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const meta = getCategoryStyles(cat.id, isDark);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    isSelected && { backgroundColor: isDark ? '#27272A' : '#F4F4F5' },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.dropdownItemIconWrap, { backgroundColor: meta.bg }]}>
                    <SymbolView name={meta.icon} size={14} tintColor={meta.color} />
                  </View>
                  <ThemedText
                    style={[
                      styles.dropdownItemText,
                      { color: theme.text },
                      isSelected && { color: SemanticColors.primary, fontWeight: '700' },
                    ]}
                  >
                    {cat.name}
                  </ThemedText>
                  {isSelected && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={16}
                      tintColor={SemanticColors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setShowCategoryDropdown(false)}
              style={({ pressed }) => [styles.dropdownDoneBtn, pressed && { opacity: 0.7 }]}
            >
              <ThemedText style={[styles.dropdownDoneText, { color: SemanticColors.primary }]}>
                Done
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Sort Dropdown Selector */}
        {showSortDropdown && (
          <View
            style={[
              styles.dropdownPanel,
              {
                backgroundColor: isDark ? SemanticColors.cardDark : SemanticColors.card,
                borderColor: isDark ? '#27272A' : '#E4E4E7',
              },
            ]}
          >
            <ThemedText style={[styles.dropdownHeader, { color: theme.textSecondary }]}>
              SORT BY
            </ThemedText>
            {sortOptions.map((opt) => {
              const isSelected = sortOption === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    setSortOption(opt.id);
                    setShowSortDropdown(false);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    isSelected && { backgroundColor: isDark ? '#27272A' : '#F4F4F5' },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      styles.dropdownItemIconWrap,
                      { backgroundColor: isSelected ? SemanticColors.primary + '20' : theme.backgroundSelected },
                    ]}
                  >
                    <SymbolView
                      name={opt.icon}
                      size={14}
                      tintColor={isSelected ? SemanticColors.primary : theme.textSecondary}
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.dropdownItemText,
                      { color: theme.text },
                      isSelected && { color: SemanticColors.primary, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                  {isSelected && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={16}
                      tintColor={SemanticColors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Products" />
      <View style={styles.flex}>
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={filterHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product-detail?id=${item.id}` as any)}
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
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
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
  // Fills the space the (hidden) Add Product button would have taken, for
  // roles that can't manage products — otherwise the row leaves an empty gap.
  searchIconButtonExpanded: {
    flex: 1,
    width: undefined,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchIconButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 8,
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
  dropdownPanel: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    gap: 2,
    marginTop: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 20,
  },
  dropdownHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  dropdownItemIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryDropdownTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  categoryDropdownText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownDoneBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  dropdownDoneText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
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
