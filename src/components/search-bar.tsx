import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { SemanticColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from './themed-text';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...', style }: SearchBarProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? SemanticColors.cardDark : SemanticColors.card,
          borderColor: isDark ? '#27272A' : '#E4E4E7',
          shadowColor: isDark ? '#000' : '#E4E4E7',
        },
        style,
      ]}
    >
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={16}
        tintColor={theme.textSecondary}
      />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
});
