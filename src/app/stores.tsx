import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';

const STORE_ICONS: Record<string, any> = {
  Warehouse: { ios: 'building.2', android: 'domain', web: 'domain' },
  Fulfillment: { ios: 'shippingbox', android: 'inventory', web: 'inventory' },
  default: { ios: 'storefront', android: 'storefront', web: 'storefront' },
};

export default function StoresScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const { products, stores } = useInventory();
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  const getProductCountForStore = (storeId: string) => {
    return products
      .filter((p) => p.storeIds && p.storeIds.includes(storeId))
      .reduce((sum, p) => {
        if (p.storeQuantities && p.storeQuantities[storeId] !== undefined) {
          return sum + p.storeQuantities[storeId];
        }
        return sum + p.quantity;
      }, 0);
  };

  const getItemCountForStore = (storeId: string) => {
    return products.filter((p) => p.storeIds && p.storeIds.includes(storeId)).length;
  };

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title="Stores" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>
            <View style={styles.header}>
              <ThemedText style={[styles.heading, { color: theme.text }]}>
                Store Locations
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Manage your physical warehouses and retail outlets
              </ThemedText>
            </View>

            {/* Store List */}
            <View style={styles.list}>
              {stores.map((store) => {
                const stockCount = getProductCountForStore(store.id);
                const itemCount = getItemCountForStore(store.id);
                return (
                  <Pressable
                    key={store.id}
                    onPress={() => router.push(`/store-detail?id=${store.id}` as any)}
                    style={({ pressed }) => [
                      styles.storeCard,
                      { backgroundColor: cardBg, shadowColor, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View style={styles.storeHeader}>
                      <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
                        <SymbolView
                          name={STORE_ICONS[store.type] || STORE_ICONS.default}
                          size={22}
                          tintColor={theme.text}
                        />
                      </View>
                      <View style={styles.storeTitleWrapper}>
                        <ThemedText style={[styles.storeName, { color: theme.text }]} numberOfLines={1}>
                          {store.name}
                        </ThemedText>
                        <ThemedText style={[styles.storeType, { color: theme.textSecondary }]}>
                          {store.type} · {itemCount} items
                        </ThemedText>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

                    <View style={styles.storeDetails}>
                      <View style={styles.detailRow}>
                        <SymbolView
                          name={{ ios: 'mappin.and.ellipse', android: 'place', web: 'place' }}
                          size={13}
                          tintColor={theme.textSecondary}
                        />
                        <ThemedText
                          style={[styles.detailText, { color: theme.textSecondary, flex: 1 }]}
                          numberOfLines={1}
                        >
                          {store.address}
                        </ThemedText>
                      </View>
                      <View style={styles.detailRow}>
                        <SymbolView
                          name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                          size={13}
                          tintColor={theme.textSecondary}
                        />
                        <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                          {store.manager}
                        </ThemedText>
                        <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>·</ThemedText>
                        <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                          {store.phone}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

                    <View style={styles.storeFooter}>
                      <ThemedText style={[styles.stockLabel, { color: theme.textSecondary }]}>
                        Total Stock Stored:
                      </ThemedText>
                      <View style={styles.footerRight}>
                        <ThemedText style={[styles.stockValue, { color: SemanticColors.primary }]}>
                          {stockCount.toLocaleString()} units
                        </ThemedText>
                        <SymbolView
                          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                          size={16}
                          tintColor={theme.textSecondary}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
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
  storeCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  storeTitleWrapper: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  storeDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
