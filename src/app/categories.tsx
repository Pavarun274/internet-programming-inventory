import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/constants/inventory-data';
import { getCategoryStyles } from '@/constants/category-meta';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInventory } from '@/hooks/use-inventory';
import { router } from 'expo-router';

export default function CategoriesScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const shadowColor = isDark ? '#000' : '#E4E4E7';

  const { products } = useInventory();

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

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
                const meta = getCategoryStyles(cat.id, isDark);
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push(`/category-detail?id=${cat.id}` as any)}
                    style={({ pressed }) => [
                      styles.catCard,
                      { backgroundColor: cardBg, shadowColor, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: meta.bg }]}>
                      <SymbolView
                        name={meta.icon}
                        size={24}
                        tintColor={meta.color}
                      />
                    </View>
                    <ThemedText style={[styles.catName, { color: theme.text }]}>
                      {cat.name}
                    </ThemedText>
                    <ThemedText style={[styles.catCount, { color: meta.color }]}>
                      {count} items
                    </ThemedText>
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
});
