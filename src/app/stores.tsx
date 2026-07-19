import { Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { STORES } from '@/constants/inventory-data';

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

  const { products } = useInventory();
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  // Calculate actual stock distribution by storeId
  const getProductCountForStore = (storeId: string) => {
    return products
      .filter((p) => p.storeIds && p.storeIds.includes(storeId))
      .reduce((sum, p) => sum + p.quantity, 0);
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

            {/* Store Grid */}
            <View style={styles.list}>
              {STORES.map((store) => {
                const stockCount = getProductCountForStore(store.id);
                return (
                  <View
                    key={store.id}
                    style={[
                      styles.storeCard,
                      { backgroundColor: cardBg, shadowColor },
                    ]}
                  >
                    <View style={styles.storeHeader}>
                      <View style={styles.storeTitleWrapper}>
                        <SymbolView
                          name={STORE_ICONS[store.type] || STORE_ICONS.default}
                          size={24}
                          tintColor={theme.text}
                        />
                        <View>
                          <ThemedText style={[styles.storeName, { color: theme.text }]}>
                            {store.name}
                          </ThemedText>
                          <ThemedText style={[styles.storeType, { color: theme.textSecondary }]}>
                            {store.type} · {store.status}
                          </ThemedText>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              store.status === 'Operational'
                                ? SemanticColors.successLight
                                : SemanticColors.warningLight,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusText,
                            {
                              color:
                                store.status === 'Operational'
                                  ? SemanticColors.success
                                  : SemanticColors.warning,
                            },
                          ]}
                        >
                          {store.status}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

                    <View style={styles.storeDetails}>
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

                    <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

                    <View style={styles.storeFooter}>
                      <ThemedText style={[styles.stockLabel, { color: theme.textSecondary }]}>
                        Total Stock Stored:
                      </ThemedText>
                      <ThemedText style={[styles.stockValue, { color: SemanticColors.primary }]}>
                        {stockCount.toLocaleString()} units
                      </ThemedText>
                    </View>
                  </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeIcon: {
    fontSize: 24,
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
    gap: 8,
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
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
