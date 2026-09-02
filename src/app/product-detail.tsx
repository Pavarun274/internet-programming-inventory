import { useLocalSearchParams, router } from 'expo-router';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { StockBadge } from '@/components/stock-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES, DEFAULT_MIN_QUANTITY, getStockStatus } from '@/constants/inventory-data';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_ICONS: Record<string, any> = {
  electronics: { ios: 'laptopcomputer', android: 'laptop', web: 'laptop' },
  clothing: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  food: { ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' },
  tools: { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' },
  default: { ios: 'shippingbox', android: 'inventory', web: 'inventory' },
};

export default function ProductDetailScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProductById, stores } = useInventory();
  const { user, hasFinancialAccess } = useAuth();
  const canManageProducts = user?.role !== 'user';

  const product = id ? getProductById(id) : undefined;
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const borderColor = isDark ? '#27272A' : '#E4E4E7';
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  if (!product) {
    return (
      <ThemedView style={styles.flex}>
        <AppHeader title="Product" onBackPress={() => router.navigate('/explore')} />
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            Product not found
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const status = getStockStatus(product);
  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.name ?? product.category;
  const threshold = product.minQuantity > 0 ? product.minQuantity : DEFAULT_MIN_QUANTITY;
  const storeBreakdown = stores.filter((s) => product.storeIds && product.storeIds.includes(s.id)).map(
    (s) => ({
      store: s,
      quantity: product.storeQuantities?.[s.id] ?? product.quantity,
    })
  );

  return (
    <ThemedView style={styles.flex}>
      <AppHeader
        title="Product Details"
        onBackPress={() => router.navigate('/explore')}
        rightAction={
          canManageProducts ? (
            <Pressable
              onPress={() => router.push(`/add?id=${product.id}` as any)}
              style={({ pressed }) => [
                styles.editBtn,
                { backgroundColor: SemanticColors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={16} tintColor="#fff" />
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>
            {/* Header Card */}
            <View style={[styles.headerCard, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight, overflow: 'hidden' }]}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <SymbolView
                    name={CATEGORY_ICONS[product.category] ?? CATEGORY_ICONS.default}
                    size={32}
                    tintColor={SemanticColors.primary}
                  />
                )}
              </View>
              <ThemedText style={[styles.name, { color: theme.text }]}>{product.name}</ThemedText>
              <ThemedText style={[styles.sku, { color: theme.textSecondary }]}>{product.sku}</ThemedText>
              <View style={styles.badgeRow}>
                <View style={[styles.categoryChip, { backgroundColor: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight }]}>
                  <ThemedText style={[styles.categoryChipText, { color: SemanticColors.primary }]}>
                    {categoryLabel}
                  </ThemedText>
                </View>
                <StockBadge status={status} />
              </View>
              {hasFinancialAccess && product.price != null && (
                <ThemedText style={[styles.price, { color: SemanticColors.primary }]}>
                  ฿{product.price.toFixed(2)}
                </ThemedText>
              )}
            </View>

            {/* Stock Overview */}
            <View style={[styles.section, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Stock Overview</ThemedText>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.text }]}>{product.quantity}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Units</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.text }]}>{threshold}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Low Stock At</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.text }]}>{storeBreakdown.length}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Stores</ThemedText>
                </View>
              </View>
            </View>

            {/* Per-Store Stock */}
            <View style={[styles.section, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Stock by Store</ThemedText>
              {storeBreakdown.length === 0 ? (
                <ThemedText style={[styles.emptyStoreText, { color: theme.textSecondary }]}>
                  Not assigned to any store
                </ThemedText>
              ) : (
                storeBreakdown.map(({ store, quantity }, index) => (
                  <View
                    key={store.id}
                    style={[
                      styles.storeRow,
                      index < storeBreakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                    ]}
                  >
                    <View style={styles.storeInfo}>
                      <ThemedText style={[styles.storeName, { color: theme.text }]}>{store.name}</ThemedText>
                      <ThemedText style={[styles.storeAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                        {store.address}
                      </ThemedText>
                    </View>
                    <View style={[styles.storeQtyPill, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText style={[styles.storeQtyText, { color: theme.text }]}>{quantity}</ThemedText>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Details */}
            <View style={[styles.section, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Details</ThemedText>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Supplier</ThemedText>
                <ThemedText style={[styles.detailValue, { color: theme.text }]}>
                  {product.supplier || '—'}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>Last Updated</ThemedText>
                <ThemedText style={[styles.detailValue, { color: theme.text }]}>
                  {product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : '—'}
                </ThemedText>
              </View>
              {product.description ? (
                <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
                  {product.description}
                </ThemedText>
              ) : null}
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
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    zIndex: 10,
  },
  headerCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  sku: {
    fontSize: 13,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  section: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
  },
  storeInfo: {
    flex: 1,
    gap: 2,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  storeAddress: {
    fontSize: 12,
    fontWeight: '500',
  },
  storeQtyPill: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center',
  },
  storeQtyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyStoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
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
