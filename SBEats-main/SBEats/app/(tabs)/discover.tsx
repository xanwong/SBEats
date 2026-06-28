/**
 * Discover tab screen for exploring popular restaurants and users.
 */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Elevation, Radius, Spacing, Typography } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import restaurantData from '../../assets/iv_restaurants.json';
import { auth, db } from '../../firebaseconfig';
import { Restaurant } from './explore';

// Type from SavedRestaurantsList context
interface SavedRestaurantsData {
  [category: string]: string[]; // Array of URLs
}

const DEFAULT_RECOMMENDATION_LIMIT = 5; // 5 New + 5 Saved = 10 Total
const DEFAULT_AVATAR =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

interface DiscoverUser {
  uid: string;
  username: string;
  avatarUrl?: string;
  cuisines: string[]; // Derived from savedByCategory keys
  sharedCount: number; // Number of overlapping cuisine categories
}

const categoryImages: Record<string, string> = {
  Mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  Coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
  Pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
  Japanese:
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
  Burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  Bakeries:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
  Chinese: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800',
  Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  American: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
  Smoothies:
    'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800',
  Deli: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
  Dessert: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
};

const getRestaurantImage = (categories: string[]): string => {
  // Try to find a matching category image
  for (const cat of categories) {
    if (categoryImages[cat]) {
      return categoryImages[cat];
    }
  }
  // Default fallback if no category match
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
};

const ALL_RESTAURANTS = restaurantData as Restaurant[];

export default function DiscoverScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [savedRestaurantUrls, setSavedRestaurantUrls] = useState<string[]>([]);
  const [myCategories, setMyCategories] = useState<string[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Logic to fetch saved restaurants
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const savedByCategory = (data.savedByCategory ||
            {}) as SavedRestaurantsData;

          // Track the user's own cuisine categories for matching
          setMyCategories(Object.keys(savedByCategory));

          // Flatten all saved restaurants across all categories
          const allSaved = new Set<string>();
          Object.values(savedByCategory).forEach((urls) => {
            if (Array.isArray(urls)) {
              urls.forEach((url) => allSaved.add(url));
            }
          });
          setSavedRestaurantUrls(Array.from(allSaved));
        } else {
          setMyCategories([]);
          setSavedRestaurantUrls([]);
        }
      },
      (error) => {
        console.error('Error fetching user data:', error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Fetch all users and rank by shared cuisine interests
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUsersLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const myCats = new Set(myCategories);

        const scored: DiscoverUser[] = [];
        snap.forEach((docSnap) => {
          // Skip the current user
          if (docSnap.id === currentUser.uid) return;

          const data = docSnap.data();
          const theirCategories = Object.keys(
            (data.savedByCategory || {}) as SavedRestaurantsData,
          );

          // Count overlapping cuisines
          const shared = theirCategories.filter((c) => myCats.has(c));

          scored.push({
            uid: docSnap.id,
            username: data.username ?? 'Anonymous',
            avatarUrl: data.avatarUrl,
            cuisines: theirCategories,
            sharedCount: shared.length,
          });
        });

        // Sort by most shared cuisines first
        scored.sort((a, b) => b.sharedCount - a.sharedCount);

        setDiscoverUsers(scored.slice(0, 6));
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [myCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Re-fetch users on pull-to-refresh
      const currentUser = auth.currentUser;
      if (currentUser) {
        const snap = await getDocs(collection(db, 'users'));
        const myCats = new Set(myCategories);
        const scored: DiscoverUser[] = [];
        snap.forEach((docSnap) => {
          if (docSnap.id === currentUser.uid) return;
          const data = docSnap.data();
          const theirCategories = Object.keys(
            (data.savedByCategory || {}) as SavedRestaurantsData,
          );
          const shared = theirCategories.filter((c) => myCats.has(c));
          scored.push({
            uid: docSnap.id,
            username: data.username ?? 'Anonymous',
            avatarUrl: data.avatarUrl,
            cuisines: theirCategories,
            sharedCount: shared.length,
          });
        });
        scored.sort((a, b) => b.sharedCount - a.sharedCount);
        setDiscoverUsers(scored.slice(0, 6));
      }
    } catch (err) {
      console.error('Error refreshing users:', err);
    } finally {
      setRefreshing(false);
    }
  }, [myCategories]);

  const savedRestaurantsForFeed = useMemo(() => {
    // Return actual restaurant objects for the saved URLs, limited to 5
    return ALL_RESTAURANTS
      .filter((r) => savedRestaurantUrls.includes(r.url))
      .slice(0, 5); // Limit "Want Again" section to 5
  }, [savedRestaurantUrls]);

  const recommendedRestaurants = useMemo(() => {
    // 1. If no saved restaurants, return default list (e.g. first N restaurants or random shuffle)
    if (savedRestaurantUrls.length === 0) {
      // Return more defaults if user has no history, max 10
      return ALL_RESTAURANTS.slice(0, 10);
    }

    // 2. Calculate category preferences
    // Find all saved restaurant objects
    const savedRestaurantsArray = ALL_RESTAURANTS.filter((r) =>
      savedRestaurantUrls.includes(r.url),
    );

    const categoryScores: Record<string, number> = {};
    savedRestaurantsArray.forEach((r) => {
      r.categories.forEach((cat) => {
        categoryScores[cat] = (categoryScores[cat] || 0) + 1;
      });
    });

    // 3. Score all other restaurants
    const scoredRestaurants = ALL_RESTAURANTS
      .filter((r) => !savedRestaurantUrls.includes(r.url)) // Exclude already saved
      .map((r) => {
        let score = 0;
        const reasons: string[] = [];
        r.categories.forEach((cat) => {
          if (categoryScores[cat]) {
            score += categoryScores[cat];
            if (!reasons.includes(cat)) reasons.push(cat);
          }
        });
        return { restaurant: r, score, reasons };
      });

    // 4. Sort by score
    scoredRestaurants.sort((a, b) => b.score - a.score);

    // Return the top N
    return scoredRestaurants
      .slice(0, DEFAULT_RECOMMENDATION_LIMIT)
      .map((item) => item.restaurant);
  }, [savedRestaurantUrls]); // Re-calculate when saved list changes

  const filteredData = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return ALL_RESTAURANTS;
    return ALL_RESTAURANTS.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(search);
      const categoryMatch = item.categories.some((cat) =>
        cat.toLowerCase().includes(search),
      );
      return nameMatch || categoryMatch;
    });
  }, [searchQuery]);

  const closeSearch = () => {
    setShowSearchResults(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const renderItem = (item: Restaurant) => (
    <TouchableOpacity
      key={item.url}
      style={[
        styles.itemCard,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={() =>
        router.push({
          pathname: '/restaurant/[id]',
          params: { id: item.url },
        })
      }
    >
      <Image
        source={{ uri: getRestaurantImage(item.categories) }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      <ThemedView style={styles.cardContent}>
        <ThemedText type="subtitle" numberOfLines={1} style={styles.cardTitle}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.addressText} numberOfLines={1}>
          {item.address}
        </ThemedText>

        <View style={styles.categoriesContainer}>
          {item.categories.slice(0, 2).map((cat, idx) => (
            <ThemedView key={idx} style={styles.badge}>
              <ThemedText style={styles.badgeText}>{cat}</ThemedText>
            </ThemedView>
          ))}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderRestaurantGrid = (restaurants: Restaurant[]) => (
    <View style={styles.masonryContainer}>
      <View style={styles.column}>
        {restaurants.filter((_, i) => i % 2 === 0).map(renderItem)}
      </View>
      <View style={styles.column}>
        {restaurants.filter((_, i) => i % 2 === 1).map(renderItem)}
      </View>
    </View>
  );

  const renderUserCard = ({ item }: { item: DiscoverUser }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={() =>
        router.push({
          pathname: '/user/[id]' as any,
          params: { id: item.uid },
        })
      }
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.avatarUrl || DEFAULT_AVATAR }}
        style={styles.userAvatar}
      />
      <ThemedText numberOfLines={1} style={styles.userName}>
        {item.username}
      </ThemedText>
      <View style={styles.userCuisines}>
        {item.cuisines.slice(0, 2).map((cat) => (
          <View key={cat} style={styles.userBadge}>
            <ThemedText style={styles.userBadgeText}>{cat}</ThemedText>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderSearchResultItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={[
        styles.searchItemCard,
        { borderBottomColor: Colors[colorScheme].tabIconDefault },
      ]}
      onPress={() =>
        router.push({
          pathname: '/restaurant/[id]' as any,
          params: { id: item.url },
        })
      }
    >
      <ThemedView style={styles.searchItemHeader}>
        <ThemedText type="subtitle">{item.name}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.searchAddressText}>{item.address}</ThemedText>
      <ThemedView style={styles.searchCategoryRow}>
        <ThemedText style={styles.searchCategoryText}>
          {item.categories.join(', ')}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: Colors[colorScheme].inputBackground,
              borderColor: Colors[colorScheme].border,
            },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Search restaurants or cuisines..."
            placeholderTextColor={Colors[colorScheme].mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSearchResults(true)}
          />
          {showSearchResults && (
            <TouchableOpacity onPress={closeSearch}>
              <ThemedText style={styles.searchCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>

      {showSearchResults ? (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.url}
          renderItem={renderSearchResultItem}
          contentContainerStyle={styles.searchListContent}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section 0: Discover New Users */}
          {usersLoading ? (
            <View style={styles.sectionContainer}>
              <ThemedText type="title" style={styles.sectionTitle}>
                Discover New Users
              </ThemedText>
              <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
            </View>
          ) : (
            discoverUsers.length > 0 && (
              <View style={styles.sectionContainer}>
                <ThemedText type="title" style={styles.sectionTitle}>
                  Discover New Users
                </ThemedText>
                <FlatList
                  data={discoverUsers}
                  renderItem={renderUserCard}
                  keyExtractor={(u) => u.uid}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.userListContent}
                />
              </View>
            )
          )}

          {/* Section 1: Ranked (New) - Only if user has history */}
          {recommendedRestaurants.length > 0 && (
            <View style={styles.sectionContainer}>
              <ThemedText type="title" style={styles.sectionTitle}>
                {'Popular Spots for You!'}
              </ThemedText>
              {renderRestaurantGrid(recommendedRestaurants)}
            </View>
          )}

          {/* Section 2: Saved (Want Again) */}
          {savedRestaurantsForFeed.length > 0 && (
            <View style={styles.sectionContainer}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Restaurants You Might Want Again!
              </ThemedText>
              {renderRestaurantGrid(savedRestaurantsForFeed)}
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.jumbo,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: 0,
    gap: Spacing.lg,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.family,
    fontSize: Typography.size.md,
  },
  searchCancelText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  searchListContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.jumbo,
  },
  searchItemCard: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchItemHeader: {
    flexDirection: 'row',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  searchAddressText: {
    opacity: 0.6,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
  },
  searchCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  searchCategoryText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  sectionContainer: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    marginBottom: Spacing.md,
    fontWeight: Typography.weight.semibold,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  itemCard: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    ...Elevation.card,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
    fontSize: Typography.size.md,
  },
  addressText: {
    fontSize: Typography.size.xs,
    color: '#666',
    marginBottom: Spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 10,
    color: '#555',
  },
  // --- Discover Users styles ---
  userListContent: {
    paddingRight: Spacing.sm,
  },
  userCard: {
    width: 130,
    marginRight: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Elevation.card,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eee',
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  userCuisines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  userBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userBadgeText: {
    fontSize: 10,
    color: '#555',
  },
});
