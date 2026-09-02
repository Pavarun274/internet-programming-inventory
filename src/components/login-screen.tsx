import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export function LoginScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const borderColor = isDark ? '#27272A' : '#E4E4E7';

  const isFormValid = username.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!isFormValid || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centered}>
            <View style={[styles.content, { maxWidth: MaxContentWidth }]}>

              <View style={styles.header}>
                <View style={[styles.logoBox, { backgroundColor: SemanticColors.primary }]}>
                  <SymbolView
                    name={{ ios: 'shippingbox.fill', android: 'inventory', web: 'inventory' }}
                    size={30}
                    tintColor="#fff"
                  />
                </View>
                <ThemedText style={[styles.title, { color: theme.text }]}>Inventory</ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Sign in to continue
                </ThemedText>
              </View>

              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: SemanticColors.dangerLight }]}>
                  <ThemedText style={[styles.errorText, { color: SemanticColors.danger }]}>
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              <View
                style={[
                  styles.card,
                  { backgroundColor: inputBg, shadowColor: isDark ? '#000' : '#E4E4E7' },
                ]}
              >
                <LabeledInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. jdoe"
                  bg={isDark ? '#252831' : '#F8F9FB'}
                  borderColor={borderColor}
                  textColor={theme.text}
                  placeholderColor={theme.textSecondary}
                  autoCapitalize="none"
                />

                <LabeledInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  bg={isDark ? '#252831' : '#F8F9FB'}
                  borderColor={borderColor}
                  textColor={theme.text}
                  placeholderColor={theme.textSecondary}
                  secureTextEntry
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!isFormValid || submitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    backgroundColor: isFormValid ? SemanticColors.primary : theme.backgroundSelected,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={isFormValid ? '#fff' : theme.textSecondary} />
                ) : (
                  <ThemedText
                    style={[
                      styles.submitButtonText,
                      { color: isFormValid ? '#fff' : theme.textSecondary },
                    ]}
                  >
                    Sign In
                  </ThemedText>
                )}
              </Pressable>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

type LabeledInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  bg: string;
  borderColor: string;
  textColor: string;
  placeholderColor: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
};

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  bg,
  borderColor,
  textColor,
  placeholderColor,
  secureTextEntry,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: LabeledInputProps) {
  return (
    <View style={inputStyles.container}>
      <ThemedText style={[inputStyles.label, { color: textColor }]}>{label}</ThemedText>
      <View style={[inputStyles.inputRow, { backgroundColor: bg, borderColor }]}>
        <TextInput
          style={[inputStyles.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.five,
  },
  centered: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  submitButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
