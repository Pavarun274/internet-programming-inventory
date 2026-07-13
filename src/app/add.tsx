import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryChip } from '@/components/category-chip';
import { useInventory } from '@/hooks/use-inventory';

type FormField = {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  minQuantity: string;
  price: string;
  supplier: string;
  description: string;
  image: string;
};

const INITIAL_FORM: FormField = {
  name: '',
  sku: '',
  category: 'electronics',
  quantity: '',
  minQuantity: '',
  price: '',
  supplier: '',
  description: '',
  image: '',
};

export default function AddProductScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { addProduct, updateProduct, deleteProduct, getProductById } = useInventory();

  const isDark = scheme === 'dark';
  const [form, setForm] = useState<FormField>(INITIAL_FORM);
  const [saved, setSaved] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  const inputBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const borderColor = isDark ? '#27272A' : '#E4E4E7';

  // Load product if editing
  useEffect(() => {
    if (isEditMode && id) {
      const product = getProductById(id);
      if (product) {
        setForm({
          name: product.name,
          sku: product.sku,
          category: product.category,
          quantity: product.quantity.toString(),
          minQuantity: product.minQuantity.toString(),
          price: product.price.toString(),
          supplier: product.supplier || '',
          description: product.description || '',
          image: product.image || '',
        });
      }
    } else {
      setForm(INITIAL_FORM);
    }
  }, [isEditMode, id, getProductById]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required to add product images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  }

  function removeImage() {
    setForm((prev) => ({ ...prev, image: '' }));
  }

  function handleSave() {
    const parsedProduct = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      quantity: parseInt(form.quantity, 10) || 0,
      minQuantity: parseInt(form.minQuantity, 10) || 0,
      price: parseFloat(form.price) || 0,
      supplier: form.supplier.trim(),
      description: form.description.trim(),
      image: form.image || undefined,
    };

    if (isEditMode && id) {
      updateProduct(id, parsedProduct);
    } else {
      addProduct(parsedProduct);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.back();
    }, 1500);
  }

  function handleDelete() {
    if (isEditMode && id) {
      deleteProduct(id);
      setDeleted(true);
      setTimeout(() => {
        setDeleted(false);
        router.back();
      }, 1500);
    }
  }

  const isFormValid = form.name.trim() && form.sku.trim() && form.quantity && form.price;

  return (
    <ThemedView style={styles.flex}>
      <AppHeader title={isEditMode ? 'Edit Product' : 'Add Product'} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centered}>
          <View style={[styles.content, { maxWidth: MaxContentWidth }]}>

            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={[styles.title, { color: theme.text }]}>
                {isEditMode ? 'Edit Product' : 'Add Product'}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {isEditMode ? 'Modify product parameters or delete it' : 'Fill in the details below'}
              </ThemedText>
            </View>

            {/* Success Banner */}
            {saved && (
              <View style={[styles.successBanner, { backgroundColor: SemanticColors.successLight }]}>
                <ThemedText style={[styles.successText, { color: SemanticColors.success }]}>
                  {isEditMode ? '✅ Product updated successfully!' : '✅ Product added successfully!'}
                </ThemedText>
              </View>
            )}

            {/* Deleted Banner */}
            {deleted && (
              <View style={[styles.successBanner, { backgroundColor: SemanticColors.dangerLight }]}>
                <ThemedText style={[styles.successText, { color: SemanticColors.danger }]}>
                  🗑️ Product deleted successfully!
                </ThemedText>
              </View>
            )}

            {/* Image Selector Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: inputBg,
                  shadowColor: isDark ? '#000' : '#E4E4E7',
                },
              ]}
            >
              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                PRODUCT IMAGE
              </ThemedText>

              {form.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: form.image }} style={styles.imagePreview} />
                  <Pressable
                    onPress={removeImage}
                    style={({ pressed }) => [
                      styles.removeImageBtn,
                      { backgroundColor: SemanticColors.danger },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <ThemedText style={styles.removeImageTxt}>✕ Clear Image</ThemedText>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.imageSelectionWrapper}>
                <Pressable
                  onPress={pickImage}
                  style={({ pressed }) => [
                    styles.uploadBox,
                    {
                      borderColor: isDark ? '#3F3F46' : '#D4D4D8',
                      backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <ThemedText style={styles.uploadIcon}>📷</ThemedText>
                  <ThemedText style={[styles.uploadTxt, { color: theme.textSecondary }]}>
                    Choose from Gallery
                  </ThemedText>
                </Pressable>

                <View style={{ marginTop: 12, width: '100%' }}>
                  <LabeledInput
                    label="Or Enter Image URL"
                    value={form.image}
                    onChangeText={(v) => setForm({ ...form, image: v })}
                    placeholder="https://images.unsplash.com/photo-..."
                    bg={isDark ? '#252831' : '#F8F9FB'}
                    borderColor={borderColor}
                    textColor={theme.text}
                    placeholderColor={theme.textSecondary}
                  />
                </View>
              </View>
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: inputBg,
                  shadowColor: isDark ? '#000' : '#E4E4E7',
                },
              ]}
            >
              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                BASIC INFO
              </ThemedText>

              <LabeledInput
                label="Product Name *"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. MacBook Pro 14&quot;"
                bg={isDark ? '#252831' : '#F8F9FB'}
                borderColor={borderColor}
                textColor={theme.text}
                placeholderColor={theme.textSecondary}
              />

              <LabeledInput
                label="SKU *"
                value={form.sku}
                onChangeText={(v) => setForm({ ...form, sku: v })}
                placeholder="e.g. MBP-14-M3"
                bg={isDark ? '#252831' : '#F8F9FB'}
                borderColor={borderColor}
                textColor={theme.text}
                placeholderColor={theme.textSecondary}
              />

              <LabeledInput
                label="Supplier"
                value={form.supplier}
                onChangeText={(v) => setForm({ ...form, supplier: v })}
                placeholder="e.g. Apple Inc."
                bg={isDark ? '#252831' : '#F8F9FB'}
                borderColor={borderColor}
                textColor={theme.text}
                placeholderColor={theme.textSecondary}
              />

              <LabeledInput
                label="Description"
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                placeholder="Brief product description..."
                bg={isDark ? '#252831' : '#F8F9FB'}
                borderColor={borderColor}
                textColor={theme.text}
                placeholderColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Category */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: inputBg,
                  shadowColor: isDark ? '#000' : '#E4E4E7',
                },
              ]}
            >
              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                CATEGORY
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.name}
                    isSelected={form.category === cat.id}
                    color={cat.color}
                    onPress={() => setForm({ ...form, category: cat.id })}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Stock & Price */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: inputBg,
                  shadowColor: isDark ? '#000' : '#E4E4E7',
                },
              ]}
            >
              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                STOCK & PRICE
              </ThemedText>

              <View style={styles.row}>
                <View style={styles.half}>
                  <LabeledInput
                    label="Quantity *"
                    value={form.quantity}
                    onChangeText={(v) => setForm({ ...form, quantity: v })}
                    placeholder="0"
                    bg={isDark ? '#252831' : '#F8F9FB'}
                    borderColor={borderColor}
                    textColor={theme.text}
                    placeholderColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.half}>
                  <LabeledInput
                    label="Min. Quantity"
                    value={form.minQuantity}
                    onChangeText={(v) => setForm({ ...form, minQuantity: v })}
                    placeholder="0"
                    bg={isDark ? '#252831' : '#F8F9FB'}
                    borderColor={borderColor}
                    textColor={theme.text}
                    placeholderColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <LabeledInput
                label="Price (USD) *"
                value={form.price}
                onChangeText={(v) => setForm({ ...form, price: v })}
                placeholder="0.00"
                bg={isDark ? '#252831' : '#F8F9FB'}
                borderColor={borderColor}
                textColor={theme.text}
                placeholderColor={theme.textSecondary}
                keyboardType="decimal-pad"
                prefix="$"
              />
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={!isFormValid}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: isFormValid ? SemanticColors.primary : theme.backgroundSelected,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.saveButtonText,
                  { color: isFormValid ? '#fff' : theme.textSecondary },
                ]}
              >
                {isEditMode ? 'Save Changes' : 'Add Product'}
              </ThemedText>
            </Pressable>

            {/* Delete Button */}
            {isEditMode && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    backgroundColor: SemanticColors.dangerLight,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText style={[styles.deleteButtonText, { color: SemanticColors.danger }]}>
                  Delete Product
                </ThemedText>
              </Pressable>
            )}

          </View>
        </View>
      </ScrollView>
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
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  prefix?: string;
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
  multiline,
  numberOfLines,
  keyboardType = 'default',
  prefix,
}: LabeledInputProps) {
  return (
    <View style={inputStyles.container}>
      <ThemedText style={[inputStyles.label, { color: textColor }]}>{label}</ThemedText>
      <View style={[inputStyles.inputRow, { backgroundColor: bg, borderColor }]}>
        {prefix && (
          <ThemedText style={[inputStyles.prefix, { color: placeholderColor }]}>{prefix}</ThemedText>
        )}
        <TextInput
          style={[
            inputStyles.input,
            { color: textColor },
            multiline && inputStyles.multiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
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
    gap: 6,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  multiline: {
    height: 72,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
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
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  successBanner: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  half: {
    flex: 1,
  },
  categoryRow: {
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  saveButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  uploadBox: {
    width: '100%',
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadTxt: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  removeImageTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  imageSelectionWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
});
