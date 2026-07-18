import { Pressable, StyleSheet, View, Image } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';
import { StockBadge } from './stock-badge';
import { Product, getStockStatus, CATEGORIES } from '@/constants/inventory-data';

type ProductCardProps = {
  product: Product;
  onPress?: () => void;
};

const CATEGORY_ICONS: Record<string, any> = {
  electronics: { ios: 'laptopcomputer', android: 'laptop', web: 'laptop' },
  clothing: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  food: { ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' },
  tools: { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' },
  default: { ios: 'shippingbox', android: 'inventory', web: 'inventory' },
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const status = getStockStatus(product);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'electronics':
        return {
          color: SemanticColors.primary,
          bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
        };
      case 'clothing':
        return {
          color: '#EC4899',
          bg: isDark ? '#831843' : '#FCE7F3',
        };
      case 'food':
        return {
          color: SemanticColors.warning,
          bg: isDark ? SemanticColors.warningDark : SemanticColors.warningLight,
        };
      case 'tools':
        return {
          color: SemanticColors.success,
          bg: isDark ? SemanticColors.successDark : SemanticColors.successLight,
        };
      default:
        return {
          color: SemanticColors.primary,
          bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
        };
    }
  };

  const catStyle = getCategoryStyles(product.category);


  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBg,
          shadowColor: isDark ? '#000' : '#E4E4E7',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Icon/Avatar */}
      <View style={[styles.iconBox, { backgroundColor: catStyle.bg, overflow: 'hidden' }]}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.productImage} />
        ) : (
          <SymbolView
            name={CATEGORY_ICONS[product.category] ?? CATEGORY_ICONS.default}
            size={22}
            tintColor={catStyle.color}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <ThemedText style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText style={[styles.sku, { color: theme.textSecondary }]}>
          {product.sku}
        </ThemedText>
        <View style={styles.footer}>
          <ThemedText style={[styles.price, { color: SemanticColors.primary }]}>
            ${product.price.toFixed(2)}
          </ThemedText>
          <StockBadge status={status} quantity={product.quantity} />
        </View>
      </View>

      {/* Quantity pill */}
      <View style={[styles.qtyPill, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText style={[styles.qtyText, { color: theme.text }]}>
          {product.quantity}
        </ThemedText>
        <ThemedText style={[styles.qtyLabel, { color: theme.textSecondary }]}>
          units
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  sku: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
  },
  qtyPill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
    flexShrink: 0,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  qtyLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
