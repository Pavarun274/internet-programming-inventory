import { StyleSheet, View } from 'react-native';
import { StockStatus } from '@/constants/inventory-data';
import { SemanticColors } from '@/constants/theme';
import { ThemedText } from './themed-text';

type StockBadgeProps = {
  status: StockStatus;
  quantity?: number;
  showQuantity?: boolean;
};

const STATUS_CONFIG: Record<StockStatus, { label: string; color: string; bg: string; dot: string }> = {
  in_stock: {
    label: 'In Stock',
    color: SemanticColors.success,
    bg: SemanticColors.successLight,
    dot: SemanticColors.success,
  },
  low_stock: {
    label: 'Low Stock',
    color: SemanticColors.warning,
    bg: SemanticColors.warningLight,
    dot: SemanticColors.warning,
  },
  out_of_stock: {
    label: 'Out of Stock',
    color: SemanticColors.danger,
    bg: SemanticColors.dangerLight,
    dot: SemanticColors.danger,
  },
};

export function StockBadge({ status, quantity, showQuantity = false }: StockBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <ThemedText style={[styles.label, { color: config.color }]}>
        {showQuantity && quantity !== undefined ? `${quantity} left` : config.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
