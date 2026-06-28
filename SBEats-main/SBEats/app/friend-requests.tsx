import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebaseconfig';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserProfile } from '@/types/User';
import { FriendRequest } from '@/types/FriendRequest';
import {
  getIncomingFriendRequests,
  acceptFriendRequest,
  denyFriendRequest,
  getFriendsList,
} from '@/services/friendService';

const DEFAULT_AVATAR =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

interface FriendRequestWithUser extends FriendRequest {
  fromUser?: UserProfile;
}

export default function FriendRequestsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = AppColor[colorScheme];
  const router = useRouter();
  const [requests, setRequests] = useState<FriendRequestWithUser[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch requests and friends in parallel
      const [incoming, friendsList] = await Promise.all([
        getIncomingFriendRequests(currentUser.uid),
        getFriendsList(currentUser.uid),
      ]);

      // Fetch sender profile info for each request
      const withUsers: FriendRequestWithUser[] = await Promise.all(
        incoming.map(async (req) => {
          try {
            const userSnap = await getDoc(doc(db, 'users', req.fromUserId));
            const fromUser = userSnap.exists()
              ? ({ uid: userSnap.id, ...userSnap.data() } as UserProfile)
              : undefined;
            return { ...req, fromUser };
          } catch {
            return { ...req };
          }
        }),
      );

      setRequests(withUsers);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friend data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (request: FriendRequestWithUser) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await acceptFriendRequest(
        request.id,
        request.fromUserId,
        request.toUserId,
      );
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      // Add the accepted user to the friends list immediately
      if (request.fromUser) {
        setFriends((prev) => [...prev, request.fromUser!]);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert(
        'Error',
        'Failed to accept friend request. Please try again.',
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleDeny = async (request: FriendRequestWithUser) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await denyFriendRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error('Error denying friend request:', error);
      Alert.alert('Error', 'Failed to deny friend request. Please try again.');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Friends',
          presentation: 'modal',
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Incoming Friend Requests Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Friend Requests</ThemedText>
            {requests.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="mail-open-outline" size={36} color={theme.mutedText} />
                <ThemedText style={styles.emptySubtitle}>
                  No pending requests
                </ThemedText>
              </View>
            ) : (
              requests.map((item) => {
                const isProcessing = processingIds.has(item.id);
                const user = item.fromUser;
                return (
                  <View key={item.id} style={[styles.requestCard, { backgroundColor: theme.surfaceMuted }]}>
                    <TouchableOpacity
                      style={styles.requestInfo}
                      onPress={() => router.push(`/user/${item.fromUserId}`)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={user?.avatarUrl || DEFAULT_AVATAR}
                        style={styles.avatar}
                      />
                      <View style={styles.nameContainer}>
                        <ThemedText style={styles.username}>
                          {user?.username || 'Unknown User'}
                        </ThemedText>
                        <ThemedText style={styles.email}>
                          {user?.email || ''}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.actionButtons}>
                      {isProcessing ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[styles.acceptButton, { backgroundColor: theme.tint }]}
                            onPress={() => handleAccept(item)}
                          >
                            <ThemedText style={styles.acceptText}>
                              Accept
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.denyButton, { backgroundColor: theme.surfaceMuted }]}
                            onPress={() => handleDeny(item)}
                          >
                            <ThemedText style={styles.denyText}>
                              Deny
                            </ThemedText>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* My Friends Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>My Friends</ThemedText>
            {friends.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="people-outline" size={36} color={theme.mutedText} />
                <ThemedText style={styles.emptySubtitle}>
                  No friends yet
                </ThemedText>
              </View>
            ) : (
              friends.map((friend) => (
                <TouchableOpacity
                  key={friend.uid}
                  style={[styles.friendCard, { backgroundColor: theme.surfaceMuted }]}
                  onPress={() => router.push(`/user/${friend.uid}`)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={friend.avatarUrl || DEFAULT_AVATAR}
                    style={styles.avatar}
                  />
                  <ThemedText style={styles.friendUsername}>
                    {friend.username}
                  </ThemedText>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.md,
    color: '#666',
  },
  scrollContent: {
    paddingBottom: Spacing.jumbo,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: '#999',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  nameContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  username: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  email: {
    fontSize: Typography.size.xs,
    color: '#999',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  acceptButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  acceptText: {
    color: '#fff',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  denyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  denyText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#666',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
    borderRadius: Radius.md,
  },
  friendUsername: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    marginLeft: Spacing.md,
  },
});
