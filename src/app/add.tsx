import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, Image, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, SemanticColors, Spacing } from '@/constants/theme';
import { CATEGORIES, STORES } from '@/constants/inventory-data';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CategoryChip } from '@/components/category-chip';
import { useInventory } from '@/hooks/use-inventory';
import { useAuth } from '@/hooks/use-auth';

type FormField = {
  name: string;
  sku: string;
  category: string;
  storeIds: string[];
  storeQuantities: Record<string, string>;
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
  storeIds: ['s1'],
  storeQuantities: { s1: '0' },
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
  const { user } = useAuth();
  const canManage = user?.role !== 'user';

  const isDark = scheme === 'dark';
  const [form, setForm] = useState<FormField>(INITIAL_FORM);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedStoreNames = STORES.filter((s) => form.storeIds && form.storeIds.includes(s.id))
    .map((s) => s.name.split(' - ')[0])
    .join(', ');

  const totalCalculatedQuantity = (form.storeIds || []).reduce((sum, sId) => {
    const val = parseInt(form.storeQuantities?.[sId] || '0', 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const paddingBottom = Platform.select({ ios: 90, android: 100, web: 24, default: 24 });

  const inputBg = isDark ? SemanticColors.cardDark : SemanticColors.card;
  const borderColor = isDark ? '#27272A' : '#E4E4E7';

  // Load product data when editing, reset when adding new
  useEffect(() => {
    let isMounted = true;
    if (isEditMode && id) {
      const product = getProductById(id);
      if (product) {
        const storeQtys: Record<string, string> = {};
        if (product.storeQuantities) {
          Object.entries(product.storeQuantities).forEach(([sId, q]) => {
            storeQtys[sId] = q.toString();
          });
        } else {
          (product.storeIds || ['s1']).forEach((sId, idx) => {
            storeQtys[sId] = idx === 0 ? product.quantity.toString() : '0';
          });
        }

        setTimeout(() => {
          if (isMounted) {
            setForm({
              name: product.name,
              sku: product.sku,
              category: product.category,
              storeIds: product.storeIds || ['s1'],
              storeQuantities: storeQtys,
              minQuantity: product.minQuantity.toString(),
              price: product.price.toString(),
              supplier: product.supplier || '',
              description: product.description || '',
              image: product.image || '',
            });
            setLastUpdated(product.lastUpdated || null);
          }
        }, 0);
      }
    } else {
      setTimeout(() => {
        if (isMounted) {
          setForm(INITIAL_FORM);
          setLastUpdated(null);
        }
      }, 0);
    }
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  function formatLastUpdated(value: string) {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function executeSave() {
    if (!canManage) return;
    const parsedStoreQuantities: Record<string, number> = {};
    form.storeIds.forEach((sId) => {
      const qtyNum = parseInt(form.storeQuantities[sId] || '0', 10);
      parsedStoreQuantities[sId] = isNaN(qtyNum) ? 0 : Math.max(0, qtyNum);
    });

    const calculatedTotal = Object.values(parsedStoreQuantities).reduce((a, b) => a + b, 0);

    const parsedProduct = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category,
      storeIds: form.storeIds,
      storeQuantities: parsedStoreQuantities,
      quantity: calculatedTotal,
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

    setLastUpdated(new Date().toISOString().split('T')[0]);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.navigate('/explore');
    }, 1500);
  }

  function handleSave() {
    if (!canManage) return;
    setShowConfirmModal(true);
  }

  function handleDelete() {
    if (!canManage) return;
    if (isEditMode && id) {
      deleteProduct(id);
      setDeleted(true);
      setTimeout(() => {
        setDeleted(false);
        router.navigate('/explore');
      }, 1500);
    }
  }

  const isFormValid =
    form.name.trim() &&
    form.sku.trim() &&
    form.price &&
    form.storeIds &&
    form.storeIds.length > 0;

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
              <View style={styles.headerTitleRow}>
                <ThemedText style={[styles.title, { color: theme.text }]}>
                  {isEditMode ? 'Edit Product' : 'Add Product'}
                </ThemedText>
                {isEditMode && lastUpdated ? (
                  <View style={[styles.lastUpdatedPill, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText style={[styles.lastUpdatedText, { color: theme.textSecondary }]}>
                      Last updated: {formatLastUpdated(lastUpdated)}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {isEditMode ? 'Modify product parameters or delete it' : 'Fill in the details below'}
              </ThemedText>
            </View>

            {/* View-only Notice */}
            {!canManage && (
              <View style={[styles.successBanner, { backgroundColor: SemanticColors.warningLight }]}>
                <ThemedText style={[styles.successText, { color: SemanticColors.warning }]}>
                  Your account has view-only access. Contact an admin to add, edit, or delete products.
                </ThemedText>
              </View>
            )}

            {/* Success Banner */}
            {saved && (
              <View style={[styles.successBanner, { backgroundColor: SemanticColors.successLight }]}>
                <ThemedText style={[styles.successText, { color: SemanticColors.success }]}>
                  {isEditMode ? 'Product updated successfully!' : 'Product added successfully!'}
                </ThemedText>
              </View>
            )}

            {/* Deleted Banner */}
            {deleted && (
              <View style={[styles.successBanner, { backgroundColor: SemanticColors.dangerLight }]}>
                <ThemedText style={[styles.successText, { color: SemanticColors.danger }]}>
                  Product deleted.
                </ThemedText>
              </View>
            )}

            <View pointerEvents={canManage ? 'auto' : 'none'} style={[styles.formSections, !canManage && styles.formSectionsDisabled]}>

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

            {/* Store & Stock Per Store */}
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
                STORE & STOCK ALLOCATION
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {STORES.map((store) => {
                  const isSelected = form.storeIds && form.storeIds.includes(store.id);
                  return (
                    <CategoryChip
                      key={store.id}
                      label={store.name}
                      isSelected={isSelected}
                      color={SemanticColors.primary}
                      onPress={() => {
                        setForm((prev) => {
                          const isAlreadySelected = prev.storeIds.includes(store.id);
                          const storeIds = isAlreadySelected
                            ? prev.storeIds.filter((id) => id !== store.id)
                            : [...prev.storeIds, store.id];
                          const storeQuantities = { ...prev.storeQuantities };
                          if (!isAlreadySelected && storeQuantities[store.id] === undefined) {
                            storeQuantities[store.id] = '0';
                          }
                          return { ...prev, storeIds, storeQuantities };
                        });
                      }}
                    />
                  );
                })}
              </ScrollView>

              {/* Per-store quantity controls */}
              <View style={styles.storeQuantitiesContainer}>
                {STORES.filter((store) => form.storeIds.includes(store.id)).map((store) => {
                  const qtyVal = form.storeQuantities[store.id] ?? '0';
                  return (
                    <View key={store.id} style={[styles.storeQtyRow, { borderColor }]}>
                      <View style={styles.storeQtyInfo}>
                        <ThemedText style={[styles.storeQtyName, { color: theme.text }]} numberOfLines={1}>
                          {store.name}
                        </ThemedText>
                        <ThemedText style={[styles.storeQtyType, { color: theme.textSecondary }]}>
                          {store.type}
                        </ThemedText>
                      </View>
                      <View style={styles.qtyCounterWrapper}>
                        <Pressable
                          style={[styles.qtyBtn, { backgroundColor: isDark ? '#27272A' : '#E4E4E7' }]}
                          onPress={() => {
                            const current = parseInt(form.storeQuantities[store.id] || '0', 10);
                            const next = Math.max(0, current - 1);
                            setForm((prev) => ({
                              ...prev,
                              storeQuantities: {
                                ...prev.storeQuantities,
                                [store.id]: next.toString(),
                              },
                            }));
                          }}
                        >
                          <ThemedText style={[styles.qtyBtnText, { color: theme.text }]}>-</ThemedText>
                        </Pressable>

                        <TextInput
                          style={[
                            styles.storeQtyInput,
                            {
                              backgroundColor: isDark ? '#252831' : '#F8F9FB',
                              color: theme.text,
                              borderColor,
                            },
                          ]}
                          value={qtyVal}
                          onChangeText={(v) => {
                            const cleaned = v.replace(/[^0-9]/g, '');
                            setForm((prev) => ({
                              ...prev,
                              storeQuantities: {
                                ...prev.storeQuantities,
                                [store.id]: cleaned,
                              },
                            }));
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />

                        <Pressable
                          style={[styles.qtyBtn, { backgroundColor: SemanticColors.primary }]}
                          onPress={() => {
                            const current = parseInt(form.storeQuantities[store.id] || '0', 10);
                            const next = current + 1;
                            setForm((prev) => ({
                              ...prev,
                              storeQuantities: {
                                ...prev.storeQuantities,
                                [store.id]: next.toString(),
                              },
                            }));
                          }}
                        >
                          <ThemedText style={[styles.qtyBtnText, { color: '#fff' }]}>+</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.totalStockBanner, { backgroundColor: isDark ? '#1F2937' : '#EFF6FF' }]}>
                <ThemedText style={[styles.totalStockLabel, { color: theme.textSecondary }]}>
                  Total Allocated Stock:
                </ThemedText>
                <ThemedText style={[styles.totalStockValue, { color: SemanticColors.primary }]}>
                  {totalCalculatedQuantity} units
                </ThemedText>
              </View>
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
                PRICE & INVENTORY RULES
              </ThemedText>

              <View style={styles.row}>
                <View style={styles.half}>
                  <LabeledInput
                    label="Total Quantity (Auto)"
                    value={totalCalculatedQuantity.toString()}
                    onChangeText={() => {}}
                    editable={false}
                    placeholder="0"
                    bg={isDark ? '#1F242D' : '#F1F5F9'}
                    borderColor={borderColor}
                    textColor={theme.text}
                    placeholderColor={theme.textSecondary}
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
                label="Price (THB) *"
                value={form.price}
                onChangeText={(v) => setForm({ ...form, price: v })}
                placeholder="0.00"
                bg={isDark ? '#252831' : '#F8F9FB'}
                borderColor={borderColor}
                textColor={theme.text}
                placeholderColor={theme.textSecondary}
                keyboardType="decimal-pad"
                prefix="฿"
              />
            </View>

            </View>

            {/* Save Button */}
            {canManage && (
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
            )}

            {/* Delete Button */}
            {canManage && isEditMode && (
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

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: inputBg, borderColor }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              Confirm Product Details
            </ThemedText>

            {form.image ? (
              <Image source={{ uri: form.image }} style={styles.modalImage} />
            ) : (
              <View style={[styles.modalImagePlaceholder, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={{ ios: 'photo', android: 'image', web: 'image' }}
                  size={36}
                  tintColor={theme.textSecondary}
                />
              </View>
            )}

            <View style={styles.modalInfoList}>
              <ModalInfoRow label="Name" value={form.name.trim()} text={theme.text} labelColor={theme.textSecondary} />
              <ModalInfoRow label="SKU" value={form.sku.trim()} text={theme.text} labelColor={theme.textSecondary} />
              <ModalInfoRow label="Category" value={form.category.toUpperCase()} text={theme.text} labelColor={theme.textSecondary} />
              <ModalInfoRow label="Stores" value={selectedStoreNames} text={theme.text} labelColor={theme.textSecondary} />
              <ModalInfoRow label="Quantity" value={`${totalCalculatedQuantity} units`} text={theme.text} labelColor={theme.textSecondary} />
              <ModalInfoRow label="Price" value={`฿${(parseFloat(form.price) || 0).toFixed(2)}`} text={theme.text} labelColor={theme.textSecondary} />
              <ModalInfoRow label="Supplier" value={form.supplier.trim() || 'N/A'} text={theme.text} labelColor={theme.textSecondary} />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                style={({ pressed }) => [
                  styles.modalBtnCancel,
                  { borderColor: isDark ? '#3F3F46' : '#D4D4D8' },
                  pressed && { opacity: 0.7 }
                ]}
              >
                <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowConfirmModal(false);
                  executeSave();
                }}
                style={({ pressed }) => [
                  styles.modalBtnConfirm,
                  { backgroundColor: SemanticColors.primary },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Confirm & Save</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function ModalInfoRow({ label, value, text, labelColor }: { label: string; value: string; text: string; labelColor: string }) {
  return (
    <View style={styles.modalInfoRow}>
      <ThemedText style={[styles.modalInfoLabel, { color: labelColor }]}>{label}</ThemedText>
      <ThemedText style={[styles.modalInfoValue, { color: text }]} numberOfLines={2}>{value}</ThemedText>
    </View>
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
  editable?: boolean;
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
  editable = true,
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
          editable={editable}
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  lastUpdatedPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formSections: {
    gap: Spacing.three,
  },
  formSectionsDisabled: {
    opacity: 0.5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  modalImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfoList: {
    width: '100%',
    gap: 8,
    marginVertical: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  modalInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirm: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeQuantitiesContainer: {
    marginTop: 12,
    gap: 10,
  },
  storeQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  storeQtyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  storeQtyName: {
    fontSize: 14,
    fontWeight: '600',
  },
  storeQtyType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  qtyCounterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  storeQtyInput: {
    width: 54,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  totalStockBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  totalStockLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalStockValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
