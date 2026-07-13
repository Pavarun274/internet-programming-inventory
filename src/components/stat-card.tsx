import { StyleSheet, View, ViewStyle } from 'react-native';
import { SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  accentBg?: string;
  icon: string;
  style?: ViewStyle;
};

export function StatCard({
  title,
  value,
  subtitle,
  accentColor = SemanticColors.primary,
  accentBg = SemanticColors.primaryLight,
  icon,
  style,
}: StatCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? SemanticColors.cardDark : SemanticColors.card;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#E4E4E7' }, style]}>
      <View style={[styles.iconContainer, { backgroundColor: accentBg }]}>
        <ThemedText style={[styles.icon, { color: accentColor }]}>{icon}</ThemedText>
      </View>
      <ThemedText style={[styles.value, { color: theme.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.title, { color: theme.textSecondary }]}>{title}</ThemedText>
      {subtitle && (
        <ThemedText style={[styles.subtitle, { color: accentColor }]}>{subtitle}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: 140,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
