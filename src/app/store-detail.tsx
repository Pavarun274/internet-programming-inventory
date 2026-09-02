import { useLocalSearchParams, router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';

const STORE_ICONS: Record<string, any> = {
  Warehouse: { ios: 'building.2', android: 'domain', web: 'domain' },
  Fulfillment: { ios: 'shippingbox', android: 'inventory', web: 'inventory' },
  default: { ios: 'storefront', android: 'storefront', web: 'storefront' },
};

export default function StoreDetailScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { products, stores } = useInventory();

  const store = stores.find((s) => s.id === id);
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const borderColor = isDark ? '#27272A' : '#E4E4E7';
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  if (!store) {
    return (
      <ThemedView style={styles.flex}>
        <AppHeader title="Store" onBackPress={() => router.navigate('/stores')} />
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            Store not found
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const storeProducts = products.filter((p) => p.storeIds && p.storeIds.includes(store.id));
  const totalStock = storeProducts.reduce((sum, p) => {
    const qty = p.storeQuantities?.[store.id] ?? p.quantity;
    return sum + qty;
  }, 0);

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Store Details" onBackPress={() => router.navigate('/stores')} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>
            {/* Header Card */}
            <View style={[styles.headerCard, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={STORE_ICONS[store.type] || STORE_ICONS.default}
                  size={32}
                  tintColor={theme.text}
                />
              </View>
              <ThemedText style={[styles.name, { color: theme.text }]}>{store.name}</ThemedText>
            </View>

            {/* Contact Info */}
            <View style={[styles.section, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Contact Info</ThemedText>
              <View style={styles.detailRow}>
                <SymbolView
                  name={{ ios: 'mappin.and.ellipse', android: 'place', web: 'place' }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <ThemedText style={[styles.detailText, { color: theme.text, flex: 1 }]}>
                  {store.address}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <SymbolView
                  name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                  Manager: <ThemedText style={{ color: theme.text }}>{store.manager}</ThemedText>
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <SymbolView
                  name={{ ios: 'phone.fill', android: 'phone', web: 'phone' }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
                <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                  Phone: <ThemedText style={{ color: theme.text }}>{store.phone}</ThemedText>
                </ThemedText>
              </View>
            </View>

            {/* Stock Overview */}
            <View style={[styles.section, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Stock Overview</ThemedText>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.text }]}>{storeProducts.length}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Items</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.text }]}>
                    {totalStock.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Units</ThemedText>
                </View>
              </View>
            </View>

            {/* Inventory Breakdown */}
            <View style={[styles.section, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }]}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Inventory Breakdown ({storeProducts.length} items)
              </ThemedText>
              {storeProducts.length === 0 ? (
                <ThemedText style={[styles.emptyStoreText, { color: theme.textSecondary }]}>
                  No products stored here
                </ThemedText>
              ) : (
                storeProducts.map((p, index) => {
                  const qty = p.storeQuantities?.[store.id] ?? p.quantity;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push(`/product-detail?id=${p.id}` as any)}
                      style={({ pressed }) => [
                        styles.productRow,
                        index < storeProducts.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <ThemedText style={[styles.productName, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                        {p.name}
                      </ThemedText>
                      <ThemedText style={[styles.productQty, { color: SemanticColors.primary }]}>
                        {qty} units
                      </ThemedText>
                    </Pressable>
                  );
                })
              )}
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
  headerCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: 8,
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
  name: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    flexShrink: 1,
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
  },
  productQty: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStoreText: {
    fontSize: 13,
    fontWeight: '500',
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
