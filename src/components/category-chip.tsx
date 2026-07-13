import { Pressable, StyleSheet } from 'react-native';
import { SemanticColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';

type CategoryChipProps = {
  label: string;
  isSelected: boolean;
  color?: string;
  onPress: () => void;
};

export function CategoryChip({ label, isSelected, color = SemanticColors.primary, onPress }: CategoryChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? color : theme.backgroundElement,
          borderColor: isSelected ? color : 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.label,
          { color: isSelected ? '#fff' : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
