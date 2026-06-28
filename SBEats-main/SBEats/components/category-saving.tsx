/**
 * Component handling the saving of restaurants into specific user categories.
 */
import React from 'react';

import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type RestaurantCategory = 
  | 'sit-down'
  | 'coffee-matcha'
  | 'dessert'
  | 'fast-food'
  | 'bars-drinks';

interface CategoryOption {
  id: RestaurantCategory;
  label: string;
  icon: string;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'sit-down',
    label: 'Sit-Down',
    icon: 'restaurant',
    color: '#ffd7d7',
  },
  {
    id: 'coffee-matcha',
    label: 'Coffee & Matcha',
    icon: 'cafe',
    color: '#bbffb4',
  },
  {
    id: 'dessert',
    label: 'Dessert',
    icon: 'ice-cream',
    color: '#fbe0ff',
  },
  {
    id: 'fast-food',
    label: 'Fast Food',
    icon: 'fast-food',
    color: '#ffdab7',
  },
  {
    id: 'bars-drinks',
    label: 'Bars & Drinks',
    icon: 'wine',
    color: '#e0d5ff',
  },
];

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: RestaurantCategory) => void;
  restaurantName: string;
}

export default function CategoryModal({
  visible,
  onClose,
  onSelectCategory,
  restaurantName,
}: CategoryModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = AppColor[colorScheme];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <ThemedView style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={styles.title}>Save to Category</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.mutedText} />
              </TouchableOpacity>
            </View>

            {/* Restaurant Name */}
            <ThemedText style={styles.restaurantName} numberOfLines={1}>
              {restaurantName}
            </ThemedText>

            {/* Category Options */}
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { borderColor: category.color }
                  ]}
                  onPress={() => {
                    onSelectCategory(category.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: category.color }
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={28}
                      color={theme.text}
                    />
                  </View>
                  <ThemedText style={styles.categoryLabel}>
                    {category.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { CATEGORIES };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  restaurantName: {
    fontSize: Typography.size.md,
    color: '#666',
    marginBottom: Spacing.xxl,
    fontWeight: Typography.weight.medium,
  },
  categoriesContainer: {
    gap: Spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  categoryLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: '#000',
  },
});
