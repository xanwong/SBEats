/**
 * Detailed restaurant screen showing information, ratings, and options to save, share, or log visits for a specific restaurant.
 */
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Image, View, TouchableOpacity, Linking, Share, Platform } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, onSnapshot, setDoc, deleteField, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../firebaseconfig';
import restaurantData from '@/assets/iv_restaurants.json';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';
import { getCalendarTheme } from '@/constants/calendar-theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from "@react-navigation/native";
import { useColorScheme } from '@/hooks/use-color-scheme';
import computeOverallRating from "../ratings/compute";
import computeStudyRating from "../ratings/computeStudyRating";
import { getRestaurantRatings } from "../../components/rating/ratingService";
import { STUDY_AMENITIES, StudyAmenityKey } from "../../components/rating/types";
import Toast from 'react-native-toast-message';
import CategoryModal, { RestaurantCategory } from '@/components/category-saving';

const categoryImages: Record<string, string> = {
  Mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  Coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
  Pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
  Japanese: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
  Burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  Bakeries: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
  Chinese: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800',
  Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
  American: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
  Smoothies: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800',
  Deli: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
  Dessert: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
};

const getVibeImages = (categories: string[]): string[] => {
  const vibeImageSets: Record<string, string[]> = {
    Mexican: [
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
      'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400',
      'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',
    ],
    Coffee: [
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400',
      'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400',
    ],
    Bakeries: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    ],
    Pizza: [
      'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    ],
    Japanese: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    ],
    Burgers: [
      'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
      'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400',
    ],
    Chinese: [
      'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400',
      'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
    ],
    Indian: [
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
      'https://images.unsplash.com/photo-1574653853027-5218bc26bd3f?w=400',
    ],
  };
  const primaryCategory = categories[0];
  return (
    vibeImageSets[primaryCategory] || [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
    ]
  );
};

function computeAmenityVotes(
  docs: { studyAmenities?: StudyAmenityKey[] }[]
): StudyAmenityKey[] {
  const seen = new Set<StudyAmenityKey>();
  for (const d of docs) {
    for (const key of d.studyAmenities ?? []) {
      seen.add(key);
    }
  }
  return STUDY_AMENITIES.map((a) => a.key).filter((k) => seen.has(k));
}

export default function RestaurantProfile() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const theme = AppColor[colorScheme];
  const { id } = useLocalSearchParams();
  const restaurant = restaurantData.find(r => r.url === id);
  const [isSaved, setIsSaved] = React.useState(false);
  const [currentCategory, setCurrentCategory] = React.useState<RestaurantCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visitedDatesList, setVisitedDatesList] = useState<string[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [studyRating, setStudyRating] = useState<number | null>(null);
  const [confirmedAmenities, setConfirmedAmenities] = useState<StudyAmenityKey[]>([]);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useFocusEffect(
    useCallback(() => {
      if (!id || typeof id !== "string") return;
      let alive = true;
      setLoading(true);
      (async () => {
        try {
          const docs = await getRestaurantRatings(id);
          const avg = computeOverallRating(docs);
          const studyAvg = computeStudyRating(docs);
          const amenities = computeAmenityVotes(docs);
          if (alive) {
            setRating(avg);
            setStudyRating(studyAvg);
            setConfirmedAmenities(amenities);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to load rating:", error);
          if (alive) setLoading(false);
        }
      })();
      return () => { alive = false; };
    }, [id])
  );

  React.useEffect(() => {
    if (!user || !restaurant) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const savedByCategory = data.savedByCategory || {};
        const visitedDatesMap = data.visitedDates || {};
        let foundCategory: RestaurantCategory | null = null;
        for (const [category, restaurants] of Object.entries(savedByCategory)) {
          if ((restaurants as string[]).includes(restaurant.url)) {
            foundCategory = category as RestaurantCategory;
            break;
          }
        }
        setIsSaved(!!foundCategory);
        setCurrentCategory(foundCategory);

        const restaurantVisits = visitedDatesMap[restaurant.url] || [];
        setVisitedDatesList(restaurantVisits);
      }
    });
    return () => unsubscribe();
  }, [restaurant, user]);

  if (!restaurant) {
    return (
      <>
        <Stack.Screen options={{ title: 'SBEats' }} />
        <ThemedView style={[styles.container, { backgroundColor: theme.background }, styles.centerContent]}>
          <ThemedText>Restaurant not found</ThemedText>
        </ThemedView>
      </>
    );
  }

  const handleCall = () => {
    if (restaurant.phone) Linking.openURL(`tel:${restaurant.phone}`);
  };

  const handleDirections = () => {
    const address = `${restaurant.address}, ${restaurant.city}, CA ${restaurant.zip}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const handleOpenMenu = () => {
    const query = `${restaurant.name} ${restaurant.city} menu`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const handleSaveSpot = async () => {
    if (!user || !restaurant) return;
    if (isSaved && currentCategory) {
      await unsaveRestaurant(currentCategory);
    } else {
      setShowCategoryModal(true);
    }
  };

  const saveRestaurantToCategory = async (category: RestaurantCategory) => {
    if (!user || !restaurant) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        savedByCategory: { [category]: arrayUnion(restaurant.url) }
      }, { merge: true });
      Toast.show({ type: 'success', text1: 'Saved!', text2: `Added to ${category.replace(/-/g, ' ')}` });
    } catch (error) {
      console.error("Error saving restaurant: ", error);
      Toast.show({ type: 'error', text1: 'Error saving restaurant' });
    }
  };

  const unsaveRestaurant = async (category: RestaurantCategory) => {
    if (!user || !restaurant) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(userDocRef,
          (doc) => { unsubscribe(); resolve(doc); },
          (error) => { unsubscribe(); reject(error); }
        );
      });
      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedByCategory = data.savedByCategory || {};
        const categoryRestaurants = savedByCategory[category] || [];
        const updatedRestaurants = categoryRestaurants.filter(
          (url: string) => url !== restaurant.url
        );
        const updates: any = {};
        const categoryPath = `savedByCategory.${category}`;
        if (updatedRestaurants.length === 0) {
          updates[categoryPath] = deleteField();
        } else {
          updates[categoryPath] = updatedRestaurants;
        }
        await updateDoc(userDocRef, updates);
      }
      Toast.show({ type: 'info', text1: 'Removed from saves' });
    } catch (error) {
      console.error("Error removing restaurant: ", error);
      Toast.show({ type: 'error', text1: 'Error removing restaurant' });
    }
  };

  const handleRankVisit = () => {
    if (!id) return;
    router.push({ pathname: "/rate/[id]", params: { id: String(id) } });
  };

  const handleShare = async () => {
    try {
      const fullAddress = `${restaurant.address}, ${restaurant.city}, CA ${restaurant.zip}`;
      const message = `Check out ${restaurant.name} at ${fullAddress}!\n${restaurant.url}`;

      await Share.share(
        {
          message: Platform.OS === 'ios'
            ? `Check out ${restaurant.name} at ${fullAddress}!`
            : message,
          url: Platform.OS === 'ios' ? restaurant.url : undefined,
          title: restaurant.name,
        },
        {
          dialogTitle: `Share ${restaurant.name}`,
          subject: `Check out ${restaurant.name}!`,
        }
      );
    } catch (error: any) {
      console.error('Share error:', error.message);
    }
  };

  const handleMarkVisitedPress = () => {
    if (!user || !restaurant) return;
    setShowDatePicker(true);
  };

  const toggleVisitedDate = (dateString: string) => {
    setVisitedDatesList(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(d => d !== dateString);
      } else {
        return [...prev, dateString];
      }
    });
  };

  const saveVisitedDates = async () => {
    if (!user || !restaurant) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        visitedDates: {
          [restaurant.url]: visitedDatesList
        }
      }, { merge: true });

      Toast.show({ 
        type: 'success', 
        text1: 'Visits Saved!',
        text2: `Recorded ${visitedDatesList.length} date(s)`
      });
      setShowDatePicker(false);
    } catch (error) {
      console.error("Error saving visit dates: ", error);
      Toast.show({ 
        type: 'error', 
        text1: 'Error saving visit dates'
      });
    }
  };

  const markedDatesObj = visitedDatesList.reduce((acc, date) => {
    acc[date] = { selected: true, marked: true, selectedColor: theme.tint };
    return acc;
  }, {} as any);

  const heroImage =
    categoryImages[restaurant.categories[0]] ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
  const vibeImages = getVibeImages(restaurant.categories);

  const heroGradientColors = isDark
    ? ['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.52)'] as const
    : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.3)'] as const;
  const bodyTextColor = theme.text;
  const secondaryTextColor = theme.mutedText;
  const actionButtonDefaultBg = theme.inputBackground;
  const actionButtonSelectedBg = theme.tint;
  const actionButtonDefaultText = theme.text;
  const actionButtonSelectedText = isDark ? '#13131a' : '#fff';
  const chipBg = isDark ? theme.inputBackground : theme.text;
  const chipText = isDark ? theme.text : '#fff';
  const calendarTheme = getCalendarTheme(theme, isDark);
  const quickInfoValueColor = isDark ? theme.text : '#1c1530';
  const quickInfoLabelColor = secondaryTextColor;

  return (
    <>
      <Stack.Screen options={{ title: 'SBEats', headerBackTitle: 'Back' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.surface }]}
        contentContainerStyle={[styles.contentContainer, { backgroundColor: theme.surface }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.hero} resizeMode="cover" />
          <LinearGradient colors={heroGradientColors} style={styles.heroGradient} />
          <TouchableOpacity style={[styles.backButton]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroOverlay}>
            {/* <View style={styles.quickInfoTags}>
              {restaurant.categories.map((category) => (
                <View key={category} style={[styles.quickInfoTag, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                  <ThemedText style={[styles.quickInfoTagText, { color: quickInfoLabelColor }]}>{category}</ThemedText>
              </View>
              ))}
            </View> */}
            <ThemedText style={styles.heroTitle}>{restaurant.name}</ThemedText>
            <ThemedText style={styles.heroAddress}>{restaurant.address}</ThemedText>
          </View>
        </View>

        {/* Ratings */}
        <ThemedView style={[styles.ratingSection, { backgroundColor: theme.surface }]}>
          <View style={styles.ratingRow}>
            <ThemedText style={[styles.ratingNumber, { color: bodyTextColor }]}>
              {loading ? "…" : rating !== null ? rating.toFixed(1) : "—"}
            </ThemedText>
            <ThemedText style={[styles.ratingLabel, { color: secondaryTextColor }]}>Overall</ThemedText>
            <ThemedText style={[styles.divider, { color: secondaryTextColor }]}>|</ThemedText>
            <Ionicons name="book-outline" size={15} color={theme.mutedText} style={{ marginRight: 4 }} />
            <ThemedText style={[styles.studyScore, { color: bodyTextColor }]}>
              {loading ? "…" : studyRating !== null ? studyRating.toFixed(1) : "—"}
            </ThemedText>
            <ThemedText style={[styles.ratingLabel, { color: secondaryTextColor }]}>Study</ThemedText>
          </View>
        </ThemedView>

        {/* Primary Action Buttons */}
          <ThemedView style={[styles.ratingSection, { backgroundColor: theme.surface }]}>
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonsRow}>
                {/* Save Spot */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: actionButtonDefaultBg, borderColor: theme.border },
                    isSaved && { backgroundColor: actionButtonSelectedBg, borderColor: actionButtonSelectedBg },
                  ]}
                  onPress={handleSaveSpot}
                >
                  <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={16} color={isSaved ? actionButtonSelectedText : actionButtonDefaultText} />
                  <ThemedText style={[styles.buttonText, { color: actionButtonDefaultText }, isSaved && { color: actionButtonSelectedText }]}>
                    {isSaved ? 'Saved' : 'Save'}
                  </ThemedText>
                </TouchableOpacity>

                {/* Menu */}
                <TouchableOpacity style={[styles.button, { backgroundColor: actionButtonDefaultBg, borderColor: theme.border }]} onPress={handleOpenMenu}>
                  <Ionicons name="globe-outline" size={16} color={actionButtonDefaultText} />
                  <ThemedText style={[styles.buttonText, { color: actionButtonDefaultText }]}>Menu</ThemedText>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity style={[styles.button, { backgroundColor: actionButtonDefaultBg, borderColor: theme.border }]} onPress={handleShare}>
                  <Ionicons name="share-outline" size={16} color={actionButtonDefaultText} />
                  <ThemedText style={[styles.buttonText, { color: actionButtonDefaultText }]}>Share</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={[styles.actionButtonsRow, { marginTop: Spacing.sm }]}>
                {/* Rank Visit */}
                <TouchableOpacity style={[styles.button, { backgroundColor: actionButtonDefaultBg, borderColor: theme.border }]} onPress={handleRankVisit}>
                    <ThemedText style={[styles.buttonText, { color: actionButtonDefaultText }]}>Rank Visit</ThemedText>
                </TouchableOpacity>

                {/* Mark Visited */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: actionButtonDefaultBg, borderColor: theme.border },
                    visitedDatesList.length > 0 && { backgroundColor: actionButtonSelectedBg, borderColor: actionButtonSelectedBg },
                  ]}
                  onPress={handleMarkVisitedPress}
                >
                  <ThemedText
                    style={[
                      styles.buttonText,
                      { color: actionButtonDefaultText },
                      visitedDatesList.length > 0 && { color: actionButtonSelectedText },
                    ]}
                  >
                    {visitedDatesList.length > 0 ? `Visited (${visitedDatesList.length})` : 'Mark Visited'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <View style={[styles.datePickerContainer, { backgroundColor: theme.inputBackground }]}>
                  <Calendar
                    markingType={'multi-dot'}
                    markedDates={markedDatesObj}
                    onDayPress={(day: any) => toggleVisitedDate(day.dateString)}
                    theme={calendarTheme}
                  />
                  <View style={styles.calendarActions}>
                    <TouchableOpacity style={[styles.cancelDateButton, { backgroundColor: theme.mutedText }]} onPress={() => setShowDatePicker(false)}>
                      <ThemedText style={[styles.buttonText, { color: isDark ? '#13131a' : '#fff' }]}>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmDateButton, { backgroundColor: theme.tint }]} onPress={saveVisitedDates}>
                      <ThemedText style={styles.buttonText}>Save Dates</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ThemedView>

         {/* Gallery */}
        <ThemedView style={[styles.imagesSection, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: bodyTextColor, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }]}>
            Gallery
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScroll}
          >
            {vibeImages.map((imageUri, idx) => (
                <View key={idx} style={styles.imageBox}>
                  <Image source={{ uri: imageUri }} style={styles.vibeImage} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          </ThemedView>

        {/* Quick Info */}
        <ThemedView style={[styles.section, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: bodyTextColor }]}>Quick Info</ThemedText>
          <View style={styles.quickInfoRow}>
            <Ionicons name="location-outline" size={24} color={quickInfoLabelColor} />
            <ThemedText style={[styles.quickInfoText, { color: quickInfoValueColor }]} onPress={handleDirections}>
              {restaurant.address}, {restaurant.city}, CA {restaurant.zip}
            </ThemedText>
          </View>
          <View style={styles.quickInfoRow}>
            <Ionicons name="call-outline" size={24} color={quickInfoLabelColor} />
            <ThemedText style={[styles.quickInfoText, { color: quickInfoValueColor }]} onPress={handleCall}>
              {restaurant.phone ? restaurant.phone : 'No phone number available'}
            </ThemedText>
          </View>
        </ThemedView>

        <View> 
          {/* study spot offerings */}
          {confirmedAmenities.length > 0 && (
            <ThemedView style={[styles.section, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.sectionTitle, { color: bodyTextColor }]}>Study Spot Offerings</ThemedText>
              <View style={styles.offeringsGrid}>
                {confirmedAmenities.map((key) => {
                  const amenity = STUDY_AMENITIES.find((a) => a.key === key);
                  if (!amenity) return null;
                  return (
                    <View key={key} style={[styles.offeringChip, { backgroundColor: chipBg }]}>
                      <ThemedText style={[styles.offeringChipText, { color: chipText }]}>
                        {amenity.label}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            </ThemedView>
          )}

        </View>
      </ScrollView>
      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelectCategory={saveRestaurantToCategory}
        restaurantName={restaurant.name}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingBottom: Spacing.xxxl,
  },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  heroContainer: { position: 'relative', width: '100%', height: 280},
  hero: { width: '100%', height: '100%' },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  heroTitle: {
    fontSize: Typography.size.display, fontWeight: Typography.weight.bold, color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10, lineHeight: Typography.lineHeight.display,
  },
  heroAddress: {
    fontSize: Typography.size.sm, color: '#fff', marginTop: Spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  ratingSection: { backgroundColor: '#fff', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', marginBottom: 4 },
  ratingNumber: { fontSize: Typography.size.xl, fontWeight: Typography.weight.semibold, color: '#000', marginRight: Spacing.xs },
  ratingLabel: { fontSize: Typography.size.xs, opacity: 0.55, color: '#000', marginRight: 2 },
  studyScore: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: '#000', marginRight: Spacing.xs },
  divider: { fontSize: 20, marginHorizontal: 6, opacity: 0.3, color: '#000' },
  categories: { fontSize: Typography.size.sm, opacity: 0.7, color: '#000', flexShrink: 1 },
  actionButtonsContainer: {
    flexDirection: 'column',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quickInfoText: {
    fontSize: Typography.size.sm,
    flex: 1,
  },
  quickInfoTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  quickInfoTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  quickInfoTagText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  datePickerContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  confirmDateButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.sm,
  },
  cancelDateButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.sm,
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1, paddingVertical: 14,
    borderWidth: 1,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  buttonText: { color: '#fff', fontWeight: Typography.weight.semibold, fontSize: 13 },
  imagesSection: { backgroundColor: '#fff', paddingVertical: Spacing.lg, marginTop: 0 },
  imagesScroll: { paddingHorizontal: Spacing.lg },
  imageBox: {
    width: 140, height: 170, marginRight: Spacing.md, borderRadius: 4,
    overflow: 'hidden', backgroundColor: '#e0e0e0',
    borderWidth: 1, borderColor: '#ccc',
  },
  vibeImage: { width: '100%', height: '100%' },
  imageTextOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.sm, justifyContent: 'center',
  },
  imageText: { fontSize: 10, fontWeight: '600', color: '#000', textAlign: 'left' },
  section: { backgroundColor: '#fff', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, marginTop: 0 },
  sectionTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, marginBottom: Spacing.md, color: '#000' },
  phoneNumber: { fontSize: Typography.size.md, color: '#000' },
  offeringsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  offeringChip: { backgroundColor: '#000', borderRadius: Radius.sm, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  offeringChipText: { color: '#fff', fontSize: 13, fontWeight: Typography.weight.semibold },
});
