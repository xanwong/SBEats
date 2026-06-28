/**
 * Screen for creating a new post, allowing users to upload a photo, add a caption, hashtags, and tag a restaurant.
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';
import { auth, db } from '../firebaseconfig';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppColor, Radius, Spacing, Typography } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';
import restaurantData from '@/assets/iv_restaurants.json';

interface Restaurant {
  name: string;
  url: string;
  address: string | null;
  categories: string[];
}

export default function CreatePostScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = AppColor[colorScheme];
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // very low quality to keep well under 1MB
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const handleRestaurantSearch = (text: string) => {
    setRestaurantQuery(text);
    if (!text.trim()) {
      setRestaurantResults([]);
      return;
    }
    const lower = text.toLowerCase();
    const results = (restaurantData as Restaurant[])
      .filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          r.categories.some((c) => c.toLowerCase().includes(lower))
      )
      .slice(0, 5);
    setRestaurantResults(results);
  };

  // Convert image URI to base64 using fetch + FileReader (no extra packages needed)
  const imageToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('No photo', 'Please select or take a photo first.');
      return;
    }
    if (!caption.trim()) {
      Alert.alert('No caption', 'Please write a caption.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to post.');
      return;
    }

    setUploading(true);
    try {
      const base64Image = await imageToBase64(image);

      // Check size — Firestore docs max out at ~1MB
      const sizeInBytes = base64Image.length * 0.75;
      if (sizeInBytes > 900000) {
        Alert.alert(
          'Image too large',
          'Please choose a smaller image. Try taking a new photo instead of picking from library.'
        );
        setUploading(false);
        return;
      }

      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        username: userData?.username || user.email || 'Anonymous',
        avatarUrl: userData?.avatarUrl || '',
        restaurantId: selectedRestaurant?.url || null,
        restaurantName: selectedRestaurant?.name || null,
        imageUrl: base64Image,
        caption: caption.trim(),
        hashtags,
        likes: [],
        createdAt: serverTimestamp(),
      });

      Alert.alert('Posted!', 'Your food photo has been shared.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Post upload error:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        {/* Nav Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.navTitle}>New Post</ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploading}
            style={[styles.shareBtn, uploading && { opacity: 0.5 }]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.shareText}>Share</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Picker */}
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
                <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPickerContainer}>
              <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
                <Ionicons name="images-outline" size={36} color={theme.tint} />
                <ThemedText style={styles.photoOptionText}>Choose from Library</ThemedText>
              </TouchableOpacity>
              <View style={styles.photoSeparator} />
              <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={36} color={theme.tint} />
                <ThemedText style={styles.photoOptionText}>Take a Photo</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Caption */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Caption</ThemedText>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor={theme.mutedText}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={300}
            />
            <ThemedText style={styles.charCount}>{caption.length}/300</ThemedText>
          </View>

          {/* Hashtags */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Hashtags</ThemedText>
            <View style={styles.hashtagInputRow}>
              <TextInput
                style={styles.hashtagTextInput}
                placeholder="#foodie"
                placeholderTextColor={theme.mutedText}
                value={hashtagInput}
                onChangeText={setHashtagInput}
                onSubmitEditing={handleAddHashtag}
                returnKeyType="done"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={handleAddHashtag}>
                <ThemedText style={styles.addTagText}>Add</ThemedText>
              </TouchableOpacity>
            </View>
            {hashtags.length > 0 && (
              <View style={styles.tagsRow}>
                {hashtags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => removeHashtag(tag)}
                  >
                    <ThemedText style={styles.tagChipText}>#{tag}</ThemedText>
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={theme.tint}
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Tag a Restaurant */}
          <View style={styles.section}>
            <ThemedText style={styles.label}>Tag a Restaurant</ThemedText>
            {selectedRestaurant ? (
              <View style={styles.selectedRestaurant}>
                <Ionicons name="location-sharp" size={16} color={theme.tint} />
                <ThemedText style={styles.selectedRestaurantText}>
                  {selectedRestaurant.name}
                </ThemedText>
                <TouchableOpacity onPress={() => setSelectedRestaurant(null)}>
                  <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.restaurantInput}
                  placeholder="Search restaurants..."
                  placeholderTextColor={theme.mutedText}
                  value={restaurantQuery}
                  onChangeText={handleRestaurantSearch}
                />
                {restaurantResults.length > 0 && (
                  <View style={styles.restaurantDropdown}>
                    {restaurantResults.map((r) => (
                      <TouchableOpacity
                        key={r.url}
                        style={styles.restaurantOption}
                        onPress={() => {
                          setSelectedRestaurant(r);
                          setRestaurantQuery('');
                          setRestaurantResults([]);
                        }}
                      >
                        <Ionicons name="restaurant-outline" size={14} color={theme.mutedText} />
                        <ThemedText style={styles.restaurantOptionText}>
                          {r.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelText: { fontSize: Typography.size.md, color: '#888', fontFamily: Typography.family },
  navTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, fontFamily: Typography.family },
  shareBtn: {
    backgroundColor: '#6704ad',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  shareText: { color: '#fff', fontWeight: Typography.weight.bold, fontSize: Typography.size.sm },
  scrollContent: { paddingBottom: 60 },
  imagePreviewContainer: { alignItems: 'center', paddingVertical: Spacing.lg },
  imagePreview: { width: 300, height: 300, borderRadius: Radius.sm },
  changePhotoBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: '#6704ad',
    borderRadius: Radius.lg,
  },
  changePhotoText: { color: '#6704ad', fontSize: Typography.size.sm },
  photoPickerContainer: {
    flexDirection: 'row',
    margin: Spacing.lg,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  photoOption: {
    flex: 1,
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionText: {
    fontSize: 13,
    color: '#6704ad',
    textAlign: 'center',
    marginTop: 6,
  },
  photoSeparator: { width: 1, backgroundColor: '#ddd' },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  label: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, marginBottom: Spacing.sm, color: '#555' },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.size.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#333',
    fontFamily: Typography.family,
  },
  charCount: { textAlign: 'right', fontSize: Typography.size.xs, color: '#aaa', marginTop: Spacing.xs },
  hashtagInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hashtagTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.sm,
    color: '#333',
    fontFamily: Typography.family,
  },
  addTagBtn: {
    backgroundColor: '#6704ad',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  addTagText: { color: '#fff', fontWeight: Typography.weight.semibold },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md, gap: Spacing.sm },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0e6ff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  tagChipText: { color: '#6704ad', fontSize: 13, fontWeight: Typography.weight.semibold },
  restaurantInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.sm,
    color: '#333',
    fontFamily: Typography.family,
  },
  restaurantDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  restaurantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: Spacing.sm,
  },
  restaurantOptionText: { fontSize: Typography.size.sm },
  selectedRestaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0e6ff',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  selectedRestaurantText: {
    flex: 1,
    color: '#6704ad',
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.sm,
  },
});
