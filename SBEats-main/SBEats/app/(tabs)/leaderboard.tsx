/**
 * Leaderboard tab screen displaying top-ranked users.
 */
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  View,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { db, auth } from '../../firebaseconfig';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Spacing, Typography } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserProfile } from '@/types/User';

interface LeaderboardEntry {
  uid: string;
  username: string;
  avatarUrl?: string;
  ratingCount: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const currentUserId = auth.currentUser?.uid;
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboardData();
    }, []),
  );

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap = new Map<string, UserProfile>();
      usersSnapshot.docs.forEach((doc) => {
        usersMap.set(doc.id, { uid: doc.id, ...doc.data() } as UserProfile);
      });

      const ratingsSnapshot = await getDocs(collection(db, 'ratings'));

      const ratingsCountMap = new Map<string, number>();
      ratingsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        if (userId) {
          ratingsCountMap.set(userId, (ratingsCountMap.get(userId) || 0) + 1);
        }
      });

      const entries: LeaderboardEntry[] = [];
      usersMap.forEach((user, uid) => {
        entries.push({
          uid,
          username: user.username || 'Anonymous',
          avatarUrl: user.avatarUrl,
          ratingCount: ratingsCountMap.get(uid) || 0,
          rank: 0,
        });
      });

      // Sort by rating count descending
      entries.sort((a, b) => b.ratingCount - a.ratingCount);

      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboardData(entries);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.uid === currentUserId;
    const backgroundColor = isCurrentUser
      ? colorScheme === 'dark'
        ? '#333'
        : '#e6f7ff'
      : 'transparent';

    return (
      <View style={[styles.row, { backgroundColor }]}>
        <ThemedText style={styles.rank}>{item.rank}</ThemedText>
        <Image
          source={{
            uri:
              item.avatarUrl ||
              'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <ThemedText
          style={[
            styles.username,
            isCurrentUser && styles.currentUserText,
            isCurrentUser && { color: AppColor[colorScheme].tint },
          ]}
          >
            {item.username} {isCurrentUser && '(You)'}
          </ThemedText>
        </View>
        <ThemedText style={styles.score}>{item.ratingCount}</ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? 'light'].tint}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerRank}>#</ThemedText>
        <ThemedText style={styles.headerUser}>User</ThemedText>
        <ThemedText style={styles.headerScore}>Ratings</ThemedText>
      </View>
      <FlatList
        data={leaderboardData}
        renderItem={renderItem}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchLeaderboardData}
      />
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
  header: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  headerRank: {
    width: 40,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  headerUser: {
    flex: 1,
    fontWeight: Typography.weight.bold,
    marginLeft: 50, // Space for avatar
  },
  headerScore: {
    width: 60,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  rank: {
    width: 40,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: Typography.size.md,
  },
  currentUserText: {
    fontWeight: Typography.weight.bold,
  },
  score: {
    width: 60,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
});
