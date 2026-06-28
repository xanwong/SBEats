/**
 * Main home/index screen for the tabs, containing the primary map.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput, Linking } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import IV_RESTAURANTS from '../../assets/iv_restaurants.json';
import { getMyRatings, getRestaurantRatings } from '../../components/rating/ratingService';
import computeOverallRating from '../ratings/compute';
import computeStudyRating from '../ratings/computeStudyRating';
import { useFocusEffect } from '@react-navigation/native';
import { RatingDoc } from '../../components/rating/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/design';

type FoodCategory = 'All' | 'Mexican' | 'Coffee' | 'Japanese' | 'Pizza' | 'Burgers' | 'Chinese' | 'Bakeries' | 'Deli' | 'Markets' | 'American' | 'Indian' | 'Middle Eastern' | 'Smoothies' | 'Dessert' | 'Fusion' | 'Korean' | 'Vietnamese';

interface FoodSpot {
  id: string;
  name: string;
  categories: string[];
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  url?: string;
}

const ALL_CATEGORIES: FoodCategory[] = [
  'All', 'Mexican', 'Coffee', 'Japanese', 'Pizza', 'Burgers', 'Chinese',
  'Bakeries', 'Deli', 'Markets', 'American', 'Indian', 'Middle Eastern',
  'Smoothies', 'Dessert', 'Fusion', 'Korean', 'Vietnamese',
];

const CATEGORY_ICONS: Record<string, string> = {
  'All': 'grid-outline',
  'Mexican': 'fast-food-outline',
  'Coffee': 'cafe-outline',
  'Japanese': 'restaurant-outline',
  'Pizza': 'restaurant-outline',
  'Burgers': 'fast-food-outline',
  'Chinese': 'restaurant-outline',
  'Bakeries': 'restaurant-outline',
  'Deli': 'restaurant-outline',
  'Markets': 'basket-outline',
  'American': 'restaurant-outline',
  'Indian': 'restaurant-outline',
  'Middle Eastern': 'restaurant-outline',
  'Smoothies': 'nutrition-outline',
  'Dessert': 'ice-cream-outline',
  'Fusion': 'restaurant-outline',
  'Korean': 'restaurant-outline',
  'Vietnamese': 'restaurant-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  'All': '#FF6B35', 'Mexican': '#E63946', 'Coffee': '#8B5E3C',
  'Japanese': '#E76F51', 'Pizza': '#F4A261', 'Burgers': '#E9C46A',
  'Chinese': '#2A9D8F', 'Bakeries': '#F4A261', 'Deli': '#457B9D',
  'Markets': '#6A4C93', 'American': '#1D3557', 'Indian': '#E9C46A',
  'Middle Eastern': '#2A9D8F', 'Smoothies': '#43AA8B', 'Dessert': '#F72585',
  'Fusion': '#7209B7', 'Korean': '#3A86FF', 'Vietnamese': '#06D6A0',
};

const SPOTS: FoodSpot[] = IV_RESTAURANTS.map((r: any, i: number) => ({
  id: String(i),
  name: r.name,
  categories: r.categories,
  latitude: r.latitude,
  longitude: r.longitude,
  address: `${r.address}, ${r.city}`,
  phone: r.phone,
  url: r.url,
}));

function getRatingColor(rating: number): string {
  if (rating <= 3.9) return '#CC0000';
  if (rating <= 6.9) return '#DAA520';
  return '#006B3F';
}

function computeOverall(doc: RatingDoc): number {
  const vals = [doc.food, doc.service, doc.study, doc.value].filter(
    (v) => typeof v === 'number' && v >= 1 && v <= 10
  );
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

const ISLA_VISTA_REGION = {
    latitude: 34.4133,
    longitude: -119.8610,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

export default function MapScreen() {
  const [region, setRegion] = useState(ISLA_VISTA_REGION);  // default fallback
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedSpot, setSelectedSpot] = useState<FoodSpot | null>(null);

  const [cardRating, setCardRating] = useState<number | null>(null);
  const [cardStudyRating, setCardStudyRating] = useState<number | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  const mapRef = useRef<MapView>(null);

  const [myRatings, setMyRatings] = useState<Record<string, RatingDoc>>({});
  const insets = useSafeAreaInsets();

  const openLocationSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const requestLocationAccess = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      setPermissionDenied(true);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setPermissionDenied(false);
    setRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }, []);

  const syncLocationPermission = useCallback(async () => {
    const perm = await Location.getForegroundPermissionsAsync();

    if (perm.status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPermissionDenied(false);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      setPermissionDenied(true);
    }
  }, []);

useFocusEffect(
  useCallback(() => {
    syncLocationPermission();
  }, [syncLocationPermission])
);


  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const ratings = await getMyRatings();
        if (alive) setMyRatings(ratings);
      })();
      return () => { alive = false; };
    }, [])
  );

  useEffect(() => {
    (async () => {
      try {
        await requestLocationAccess();
      } catch (e) {
        console.log('Location request failed:', e);
        setPermissionDenied(true);
      }
    })();
  }, [requestLocationAccess]);


  useEffect(() => {
    if (!selectedSpot?.url) {
      setCardRating(null);
      setCardStudyRating(null);
      return;
    }
    let alive = true;
    setRatingsLoading(true);
    setCardRating(null);
    setCardStudyRating(null);
    (async () => {
      try {
        const docs = await getRestaurantRatings(selectedSpot.url!);
        if (!alive) return;
        setCardRating(computeOverallRating(docs));
        setCardStudyRating(computeStudyRating(docs));
      } catch (e) {
        console.log('Map card ratings error:', e);
      } finally {
        if (alive) setRatingsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedSpot?.url]);

  const filteredSpots = SPOTS.filter((s) => {
    const matchesCategory = activeCategory === 'All' || s.categories.includes(activeCategory);
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recenter = () => {
    if (!region || !mapRef.current) return;
    mapRef.current.animateToRegion(region, 600);
  };

  const handleViewProfile = (spot: FoodSpot) => {
    if (!spot.url) return;
    router.push({ pathname: '/restaurant/[id]', params: { id: spot.url } });
  };

  const getSpotRating = (spot: FoodSpot): { score: number; color: string } | null => {
    const ratingDoc = spot.url ? myRatings[spot.url] : null;
    if (!ratingDoc) return null;
    const score = computeOverall(ratingDoc);
    if (score === 0) return null;
    return { score, color: getRatingColor(score) };
  };

  if (!region) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Finding your location…</Text>
      </View>
    );
  }

  const selectedRating = selectedSpot ? getSpotRating(selectedSpot) : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredSpots.map((spot) => {
          const ratingInfo = getSpotRating(spot);
          const pinColor = ratingInfo
            ? ratingInfo.color
            : (CATEGORY_COLORS[spot.categories[0]] ?? '#FF6B35');

          return (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              onPress={() => setSelectedSpot(spot)}
            >
              <View style={[styles.pin, !ratingInfo && styles.pinSmall, { backgroundColor: pinColor }]}>
                {ratingInfo ? (
                  <Text style={styles.pinRatingText}>{ratingInfo.score.toFixed(1)}</Text>
                ) : (
                  <Ionicons
                name={(CATEGORY_ICONS[spot.categories[0]] ?? 'restaurant') as any}
                size={14}
                color="#fff"
              />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.filterBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat] as any}
                  size={13}
                  color={active ? '#fff' : '#555'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, active && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.recenterBtn} onPress={recenter} activeOpacity={0.8}>
        <Ionicons name="locate" size={22} color="#FF6B35" />
      </TouchableOpacity>

      {selectedSpot && (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => {
            if (selectedSpot.url) {
              router.push({ pathname: '/restaurant/[id]', params: { id: selectedSpot.url } });
            }
          }}
        >
          <View style={styles.cardHeader}>
            <View style={[
              styles.cardIcon,
              { backgroundColor: selectedRating ? selectedRating.color : (CATEGORY_COLORS[selectedSpot.categories[0]] ?? '#FF6B35') }
            ]}>
              {selectedRating ? (
                <Text style={styles.cardIconRating}>{selectedRating.score.toFixed(1)}</Text>
              ) : (
                <Ionicons name={CATEGORY_ICONS[selectedSpot.categories[0]] as any} size={18} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{selectedSpot.name}</Text>
              <Text style={styles.cardAddress}>{selectedSpot.address}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedSpot(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardCategory}>{selectedSpot.categories.join(', ')}</Text>

          <View style={styles.ratingsRow}>
            {ratingsLoading ? (
              <ActivityIndicator size="small" color="#aaa" />
            ) : (
              <>
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingPillValue}>
                    {cardRating !== null ? cardRating.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.ratingPillLabel}>Avg</Text>
                </View>
                <View style={styles.ratingDivider} />
                <View style={styles.ratingPill}>
                  <Ionicons name="book-outline" size={13} color="#555" style={{ marginRight: 3 }} />
                  <Text style={styles.ratingPillValue}>
                    {cardStudyRating !== null ? cardStudyRating.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.ratingPillLabel}>Study</Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => handleViewProfile(selectedSpot)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewProfileText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {permissionDenied && (
        <View style={styles.notice}>
          {/* <Text style={styles.noticeText}>Location access denied</Text> */}
          <TouchableOpacity onPress={openLocationSettings} activeOpacity={0.8}>
            <Text style={styles.noticeAction}>Enable location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  loading: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fafafa', gap: 12,
  },
  loadingText: {
    fontSize: 15, color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  filterBar: { position: 'absolute', top: 10, left: 0, right: 0 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, marginHorizontal: 12, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  filterScroll: { paddingHorizontal: 12, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },

  pin: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  pinSelected: { width: 38, height: 38, borderRadius: 19, borderWidth: 3 },
  pinSmall: { width: 24, height: 24, borderRadius: 12 },
  pinRatingText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  recenterBtn: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 28, width: 46, height: 46,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },

  card: {
    position: 'absolute', bottom: 70, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardIconRating: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cardAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  cardCategory: { fontSize: 13, color: '#888', marginBottom: 10 },

  ratingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingPillValue: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  ratingPillLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  ratingDivider: { width: 1, height: 18, backgroundColor: '#ddd', marginHorizontal: 4 },

  viewProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000', borderRadius: 10, paddingVertical: 13, gap: 6,
  },
  viewProfileText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  notice: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: 'rgba(60, 60, 60, 0.5)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  noticeText: { color: '#fff', fontSize: 12 },
  noticeAction: {
    color: '#9cd3ff',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
