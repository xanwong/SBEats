/**
 * Public profile screen for viewing another user's profile and their activity.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebaseconfig';
import { UserProfile } from '@/types/User';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import SavedRestaurantsList from '@/components/profile-page/SavedRestaurantsList';
import restaurantData from '@/assets/iv_restaurants.json';
import { Restaurant } from '../(tabs)/explore';
import { sendFriendRequest, getFriendStatus } from '@/services/friendService';

const DEFAULT_AVATAR =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

export default function UserProfileModal() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = AppColor[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'sent' | 'received' | 'friends' | 'self'>('none');
  const [sendingRequest, setSendingRequest] = useState(false);

  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === id;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', id));
        if (snap.exists()) {
          setUser({ uid: snap.id, ...snap.data() } as UserProfile);
        }

        // Fetch friend status if viewing another user's profile
        if (currentUser && currentUser.uid !== id) {
          const status = await getFriendStatus(currentUser.uid, id);
          setFriendStatus(status);
        } else {
          setFriendStatus('self');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleAddFriend = async () => {
    if (!currentUser || !id) return;

    setSendingRequest(true);
    try {
      await sendFriendRequest(currentUser.uid, id);
      // Re-check status (might have auto-accepted if reverse request existed)
      const newStatus = await getFriendStatus(currentUser.uid, id);
      setFriendStatus(newStatus);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request.');
    } finally {
      setSendingRequest(false);
    }
  };

  const cuisineCategories = user?.savedByCategory
    ? Object.keys(user.savedByCategory)
    : [];

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen
          options={{ presentation: 'modal', title: 'User Profile' }}
        />
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen
          options={{ presentation: 'modal', title: 'User Profile' }}
        />
        <Ionicons name="alert-circle-outline" size={48} color={theme.mutedText} />
        <ThemedText style={styles.errorText}>User not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: user.username ?? 'User Profile',
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={user.avatarUrl || DEFAULT_AVATAR}
            style={styles.avatar}
          />
        </View>

        {/* Username */}
        <ThemedText style={styles.username}>{user.username}</ThemedText>

        {/* Add Friend Button */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.friendButton,
              { backgroundColor: theme.tint },
              friendStatus === 'sent' && styles.friendButtonSent,
              friendStatus === 'friends' && styles.friendButtonFriends,
            ]}
            onPress={handleAddFriend}
            disabled={friendStatus !== 'none' || sendingRequest}
            activeOpacity={0.7}
          >
            {sendingRequest ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={
                    friendStatus === 'friends'
                      ? 'people'
                      : friendStatus === 'sent'
                      ? 'time-outline'
                      : 'person-add-outline'
                  }
                  size={18}
                  color="#fff"
                  style={{ marginRight: Spacing.sm }}
                />
                <ThemedText style={styles.friendButtonText}>
                  {friendStatus === 'friends'
                    ? 'Friends'
                    : friendStatus === 'sent'
                    ? 'Request Sent'
                    : friendStatus === 'received'
                    ? 'Accept Request'
                    : 'Add Friend'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cuisine Interests */}
        {cuisineCategories.length > 0 && (
          <View style={styles.cuisineSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Cuisine Interests
            </ThemedText>
            <View style={styles.badgeContainer}>
              {cuisineCategories.map((cat) => (
                <View key={cat} style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
                  <ThemedText style={styles.badgeText}>{cat}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Saved Restaurants Section */}
        <ThemedView style={styles.savedSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Saved Spots
          </ThemedText>
          <SavedRestaurantsList
            restaurantData={restaurantData as Restaurant[]}
            userId={user.uid}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.jumbo,
  },
  avatarContainer: {
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  username: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.lg,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6704ad',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
    minWidth: 160,
  },
  friendButtonSent: {
    backgroundColor: '#999',
  },
  friendButtonFriends: {
    backgroundColor: '#4CAF50',
  },
  friendButtonText: {
    color: '#fff',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  cuisineSection: {
    width: '100%',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  badgeText: {
    fontSize: 13,
    color: '#555',
  },
  savedSection: {
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.md,
    color: '#999',
  },
});
