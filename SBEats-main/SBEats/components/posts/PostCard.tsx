/**
 * Reusable card component displaying a single user post in a feed.
 */
import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebaseconfig';
import { Post } from '@/types/Post';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppColor, Spacing, Typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PostCardProps {
  post: Post;
}

const { width } = Dimensions.get('window');

export default function PostCard({ post }: PostCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const currentUser = auth.currentUser;
  const [liked, setLiked] = useState(
    currentUser ? post.likes.includes(currentUser.uid) : false
  );
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    if (!currentUser || !post.id) return;
    const postRef = doc(db, 'posts', post.id);
    if (liked) {
      await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
      setLikeCount((c) => c - 1);
    } else {
      await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
      setLikeCount((c) => c + 1);
    }
    setLiked(!liked);
  };

  const handleProfilePress = () => {
    if (!post.userId) return;
    // If it's the current user, go to their own profile tab
    if (currentUser && post.userId === currentUser.uid) {
      router.push('/(tabs)/profile');
    } else {
      router.push({ pathname: '/user/[id]', params: { id: post.userId } });
    }
  };

  const handleRestaurantPress = () => {
    if (!post.restaurantId) return;
    router.push({ pathname: '/restaurant/[id]', params: { id: post.restaurantId } });
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ThemedView style={[styles.card, { borderBottomColor: AppColor[colorScheme].border }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileTouchable}>
          <Image
            source={{
              uri:
                post.avatarUrl ||
                'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <TouchableOpacity onPress={handleProfilePress}>
            <ThemedText style={styles.username}>{post.username}</ThemedText>
          </TouchableOpacity>
          {post.restaurantName && (
            <TouchableOpacity onPress={handleRestaurantPress}>
              <ThemedText style={styles.restaurantName}>
                📍 {post.restaurantName}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
        <ThemedText style={styles.date}>{formatDate(post.createdAt)}</ThemedText>
      </View>

      {/* Image */}
      <Image
        source={{ uri: post.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={26}
            color={liked ? '#e0245e' : AppColor[colorScheme].mutedText}
          />
          <ThemedText style={styles.likeCount}>{likeCount}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <TouchableOpacity onPress={handleProfilePress}>
          <ThemedText style={styles.captionUsername}>{post.username}</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.caption}> {post.caption}</ThemedText>
      </View>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <View style={styles.hashtagContainer}>
          {post.hashtags.map((tag, i) => (
            <ThemedText key={i} style={[styles.hashtag, { color: AppColor[colorScheme].tint }]}>
              #{tag}
            </ThemedText>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    paddingBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  profileTouchable: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerText: { flex: 1 },
  username: { fontWeight: Typography.weight.bold, fontSize: Typography.size.sm },
  restaurantName: { fontSize: Typography.size.xs, color: '#888', marginTop: 1 },
  date: { fontSize: Typography.size.xs, color: '#aaa' },
  postImage: {
    width: width,
    height: width,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 5,
    fontSize: Typography.size.sm,
    color: '#555',
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    alignItems: 'flex-start',
  },
  captionUsername: { fontWeight: Typography.weight.bold, fontSize: Typography.size.sm },
  caption: { fontSize: Typography.size.sm, flexShrink: 1 },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    gap: 6,
  },
  hashtag: {
    fontSize: 13,
  },
});
