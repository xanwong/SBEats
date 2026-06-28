/**
 * Posts tab screen showing a feed of user-generated food posts and reviews.
 */
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseconfig';
import { Post } from '@/types/Post';
import PostCard from '@/components/posts/PostCard';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColor, Radius, Spacing } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Typography } from '@/constants/design';

export default function PostsFeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Post, 'id'>),
      }));
      setPosts(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={AppColor[colorScheme].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {posts.length === 0 ? (
        <ThemedView style={styles.empty}>
          <Ionicons name="images-outline" size={60} color={AppColor[colorScheme].mutedText} />
          <ThemedText style={styles.emptyText}>No posts yet.</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Be the first to share a food photo!
          </ThemedText>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: AppColor[colorScheme].tint }]}
            onPress={() => router.push('/create-post')}
          >
            <ThemedText style={styles.createBtnText}>Create Post</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => <PostCard post={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.jumbo,
  },
  emptyText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, marginTop: Spacing.lg },
  emptySubtext: { fontSize: Typography.size.sm, color: '#888', marginTop: Spacing.sm, textAlign: 'center' },
  createBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  createBtnText: { color: '#fff', fontWeight: Typography.weight.bold, fontSize: Typography.size.sm },
});
