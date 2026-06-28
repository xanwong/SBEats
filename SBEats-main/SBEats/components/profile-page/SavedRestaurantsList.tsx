/**
 * Component within the profile page dedicated to listing the user's saved restaurants.
 */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebaseconfig';
import { Restaurant } from '@/app/(tabs)/explore';
import { RestaurantCategory, CATEGORIES } from '@/components/category-saving';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SavedRestaurantsListProps {
  restaurantData: Restaurant[];
  userId?: string;
}

interface SavedRestaurantsData {
  [category: string]: Restaurant[];
}

function getContrastTextColor(backgroundHex: string): string {
  const hex = backgroundHex.replace("#", "");
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  if (normalized.length !== 6) return "#111";

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  // WCAG-inspired luminance approximation for quick chip contrast decisions.
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#111" : "#fff";
}

export default function SavedRestaurantsList({
  restaurantData,
  userId,
}: SavedRestaurantsListProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = AppColor[colorScheme];
  const [savedRestaurants, setSavedRestaurants] =
    useState<SavedRestaurantsData>({});
  const [selectedCategory, setSelectedCategory] = useState<
    RestaurantCategory | 'all'
  >('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetUserId = userId || auth.currentUser?.uid;

    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', targetUserId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const savedByCategory = data.savedByCategory || {};

          // Organize restaurants by category
          const organizedRestaurants: SavedRestaurantsData = {};

          for (const [category, restaurantIds] of Object.entries(
            savedByCategory,
          )) {
            // Find restaurant objects that match the saved IDs
            const restaurants = restaurantData.filter((r) =>
              (restaurantIds as string[]).includes(r.url),
            );
            if (restaurants.length > 0) {
              organizedRestaurants[category] = restaurants;
            }
          }

          setSavedRestaurants(organizedRestaurants);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching saved restaurants:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId, restaurantData]);

  // Get restaurants based on selected category
  const getFilteredRestaurants = (): Restaurant[] => {
    if (selectedCategory === 'all') {
      return Object.values(savedRestaurants).flat();
    }
    return savedRestaurants[selectedCategory] || [];
  };

  // Get total count across all categories
  const getTotalCount = (): number => {
    return Object.values(savedRestaurants).flat().length;
  };

  // Helper functions to get category info
  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.icon || 'list';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.color || '#666';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.label || categoryId;
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    router.push({
      pathname: '/restaurant/[id]',
      params: { id: restaurant.url },
    });
  };

  const filteredRestaurants = getFilteredRestaurants();
  const totalCount = getTotalCount();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator
          size="small"
          color={theme.tint}
          style={{ marginTop: 20 }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Total Count */}
      <ThemedText style={styles.subtitle}>
        {totalCount} {totalCount === 1 ? 'spot' : 'spots'} saved
      </ThemedText>

      {/* Category Filter Pills */}
      {totalCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
          style={styles.categoryScroll}
        >
          {/* "All" category pill */}
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === 'all' && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Ionicons
              name="apps"
              size={18}
              color={selectedCategory === 'all' ? '#fff' : theme.mutedText}
              style={styles.pillIcon}
            />
            <ThemedText
              style={[
                styles.categoryPillText,
                selectedCategory === 'all' && styles.categoryPillTextActive,
              ]}
            >
              All ({totalCount})
            </ThemedText>
          </TouchableOpacity>

          {/* Individual category pills */}
          {Object.keys(savedRestaurants).map((category) => {
            const count = savedRestaurants[category].length;
            const isActive = selectedCategory === category;
            const color = getCategoryColor(category);
            const activeTextColor = getContrastTextColor(color);

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryPill,
                  isActive && { backgroundColor: color },
                ]}
                onPress={() =>
                  setSelectedCategory(category as RestaurantCategory)
                }
              >
                <Ionicons
                  name={getCategoryIcon(category) as any}
                  size={18}
                  color={isActive ? activeTextColor : theme.mutedText}
                  style={styles.pillIcon}
                />
                <ThemedText
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                    isActive && { color: activeTextColor },
                  ]}
                >
                  {getCategoryLabel(category)} ({count})
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Restaurant List */}
      {filteredRestaurants.length > 0 ? (
        <ThemedView style={styles.restaurantList}>
          {filteredRestaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.url}
              style={styles.restaurantCard}
              onPress={() => handleRestaurantPress(restaurant)}
            >
              <ThemedView style={styles.cardContent}>
                <ThemedView style={styles.textContainer}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.restaurantName}
                  >
                    {restaurant.name}
                  </ThemedText>
                  <ThemedText style={styles.categoryText}>
                    {restaurant.categories.join(', ')}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>
      ) : (
        // Empty state
        <ThemedView style={styles.emptyContainer}>
          <Ionicons
            name="bookmark-outline"
            size={48}
            color={theme.mutedText}
            style={styles.emptyIcon}
          />
          <ThemedText style={styles.emptyText}>
            {selectedCategory === 'all'
              ? "You haven't saved any spots yet!"
              : `No spots saved in ${getCategoryLabel(selectedCategory)}`}
          </ThemedText>
          {selectedCategory !== 'all' && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setSelectedCategory('all')}
            >
              <ThemedText style={styles.viewAllButtonText}>
                View All Categories
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    opacity: 0.6,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  categoryScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.xl, // Extend to screen edges
  },
  categoryScrollContainer: {
    paddingHorizontal: Spacing.xl,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: '#f0f0f0',
    marginRight: Spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: '#000',
  },
  pillIcon: {
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#666',
  },
  categoryPillTextActive: {
    color: '#fff',
  },
  restaurantList: {
    marginTop: Spacing.sm,
  },
  restaurantCard: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  cardContent: {
    backgroundColor: 'transparent',
  },
  textContainer: {
    backgroundColor: 'transparent',
  },
  restaurantName: {
    fontSize: Typography.size.md,
    marginBottom: Spacing.xs,
  },
  categoryText: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.jumbo,
    paddingBottom: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.5,
    fontSize: Typography.size.md,
  },
  viewAllButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#000',
    borderRadius: Radius.pill,
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.sm,
  },
});
