import { SemanticColors } from './theme';

export const CATEGORY_ICONS: Record<string, any> = {
  all: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  electronics: { ios: 'laptopcomputer', android: 'laptop', web: 'laptop' },
  clothing: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  food: { ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' },
  tools: { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' },
  default: { ios: 'shippingbox', android: 'inventory', web: 'inventory' },
};

export function getCategoryStyles(id: string, isDark: boolean) {
  const icon = CATEGORY_ICONS[id] || CATEGORY_ICONS.default;
  switch (id) {
    case 'all':
      return {
        icon,
        color: SemanticColors.primary,
        bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
      };
    case 'electronics':
      return {
        icon,
        color: SemanticColors.primary,
        bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
      };
    case 'clothing':
      return {
        icon,
        color: '#EC4899', // pink-500
        bg: isDark ? '#831843' : '#FCE7F3', // pink-900 / pink-100
      };
    case 'food':
      return {
        icon,
        color: SemanticColors.warning,
        bg: isDark ? SemanticColors.warningDark : SemanticColors.warningLight,
      };
    case 'tools':
      return {
        icon,
        color: SemanticColors.success,
        bg: isDark ? SemanticColors.successDark : SemanticColors.successLight,
      };
    default:
      return {
        icon,
        color: SemanticColors.primary,
        bg: isDark ? SemanticColors.primaryDark : SemanticColors.primaryLight,
      };
  }
}
