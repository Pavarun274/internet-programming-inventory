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

const STORE_ICONS: Record<string, any> = {
  Warehouse: { ios: 'building.2', android: 'domain', web: 'domain' },
  Fulfillment: { ios: 'shippingbox', android: 'inventory', web: 'inventory' },
  default: { ios: 'storefront', android: 'storefront', web: 'storefront' },
};

const STORES_DATA = [
  {
    id: 's1',
    name: 'Main Warehouse - Bangkok',
    address: '123 Sukhumvit Rd, Khlong Toei, Bangkok 10110',
    manager: 'Sarah Wilson',
    phone: '+66 2 123 4567',
    type: 'Warehouse',
    status: 'Operational',
  },
  {
    id: 's2',
    name: 'Retail Outlet - Siam Paragon',
    address: '991 Rama I Rd, Pathum Wan, Bangkok 10330',
    manager: 'John Davis',
    phone: '+66 2 987 6543',
    type: 'Retail Store',
    status: 'Operational',
  },
  {
    id: 's3',
    name: 'Fulfillment Center - Samut Prakan',
    address: '456 Bangna-Trad Rd, Bang Phli, Samut Prakan 10540',
    manager: 'Michael Chen',
    phone: '+66 2 444 8888',
    type: 'Fulfillment',
    status: 'Restocking',
  },
];

export default function StoresScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const { products } = useInventory();
  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  // Calculate mock stock distribution: main takes 60%, retail 25%, fulfillment 15%
  const getProductCountForStore = (storeId: string) => {
    const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
    if (storeId === 's1') return Math.round(totalQty * 0.6);
    if (storeId === 's2') return Math.round(totalQty * 0.25);
    return Math.round(totalQty * 0.15);
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
              {STORES_DATA.map((store) => {
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
                      <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                        📍 <ThemedText style={{ color: theme.text }}>{store.address}</ThemedText>
                      </ThemedText>
                      <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                        👤 Manager: <ThemedText style={{ color: theme.text }}>{store.manager}</ThemedText>
                      </ThemedText>
                      <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                        📞 Phone: <ThemedText style={{ color: theme.text }}>{store.phone}</ThemedText>
                      </ThemedText>
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
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
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
