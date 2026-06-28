import React, { JSX, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, Alert, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { Image } from "expo-image";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { auth, db } from "../../firebaseconfig";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, getDocs, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/types/User";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppColor, Radius, Spacing, Typography } from "@/constants/design";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import LeaderboardScreen from "./leaderboard";

import SavedRestaurantsList from "../../components/profile-page/SavedRestaurantsList";
import VisitedPlacesList from "../../components/profile-page/visitedPlaces";
import restaurantData from '@/assets/iv_restaurants.json';
import { getIncomingRequestCount } from "@/services/friendService";


const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export default function ProfileScreen(): JSX.Element {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppColor[colorScheme];

  // State to hold user data
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [profilePicture, setProfilePicture] = useState<string>(DEFAULT_AVATAR);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [savingUsername, setSavingUsername] = useState<boolean>(false);
  const [requestCount, setRequestCount] = useState<number>(0);

  const router = useRouter();
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [leaderboardTotal, setLeaderboardTotal] = useState<number>(0);
  const [leaderboardRatings, setLeaderboardRatings] = useState<number>(0);

  // Fetch user data when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUser(userData);
          setNewUsername(userData.username || "");
          setProfilePicture(userData.avatarUrl || DEFAULT_AVATAR);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Fetch incoming friend request count
  useEffect(() => {
    const fetchRequestCount = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const count = await getIncomingRequestCount(currentUser.uid);
        setRequestCount(count);
      } catch (error) {
        console.error("Error fetching request count:", error);
      }
    };

    fetchRequestCount();
  }, []);

  const fetchLeaderboardSummary = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    setLeaderboardLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const ratingsSnapshot = await getDocs(collection(db, "ratings"));

      const ratingsCountMap = new Map<string, number>();
      ratingsSnapshot.docs.forEach((entryDoc) => {
        const data = entryDoc.data();
        const userId = data.userId;
        if (userId) {
          ratingsCountMap.set(userId, (ratingsCountMap.get(userId) || 0) + 1);
        }
      });

      const entries = usersSnapshot.docs.map((entryDoc) => ({
        uid: entryDoc.id,
        ratingCount: ratingsCountMap.get(entryDoc.id) || 0,
      }));

      entries.sort((a, b) => b.ratingCount - a.ratingCount);
      const myIndex = entries.findIndex((entry) => entry.uid === currentUserId);
      const myEntry = myIndex >= 0 ? entries[myIndex] : null;

      setLeaderboardTotal(entries.length);
      setLeaderboardRank(myEntry ? myIndex + 1 : null);
      setLeaderboardRatings(myEntry?.ratingCount || 0);
    } catch (error) {
      console.error("Error fetching leaderboard summary:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardSummary();
  }, []);

  const uploadAvatar = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Not Logged In", "Please log in to update your profile picture.");
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow photo library access to upload a profile picture.");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets.length) return;

      const asset = pickerResult.assets[0];
      if (!asset.base64) {
        Alert.alert("Error", "Could not read image data. Please try again.");
        return;
      }

      setProfilePicture(asset.uri);
      setUploadingAvatar(true);

      // Upload to Cloudinary via REST
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${asset.base64}`);
      formData.append("upload_preset", "vp0qmy6g");
      formData.append("folder", `avatars/${currentUser.uid}`);

      const uploadResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dxkxatybu/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Cloudinary upload error:", errorText);
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      const avatarUrl = uploadResult.secure_url;

      // Save URL to Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        avatarUrl,
        updatedAt: new Date(),
      });

      setProfilePicture(avatarUrl);
    } catch (error: any) {
      console.error("Error uploading avatar:", error?.message);
      setProfilePicture(user?.avatarUrl || DEFAULT_AVATAR);
      Alert.alert("Upload Failed", `${error?.message || "Unknown error"}. Please try again.`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Invalid Username", "Username cannot be empty.");
      return;
    }

    if (newUsername.trim() === user?.username) {
      setIsEditing(false);
      return;
    }

    setSavingUsername(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not logged in");

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        username: newUsername.trim()
      });

      setUser((prev) => prev ? { ...prev, username: newUsername.trim() } : prev);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert("Update Failed", "Could not update your username. Please try again.");
    } finally {
      setSavingUsername(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tint} />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <ThemedText style={styles.errorText}>Failed to load profile</ThemedText>
      </ThemedView>
    );
  }

  if (showLeaderboard) {
    return (
      <ThemedView style={styles.screenContainer}>
        <Tabs.Screen
          options={{
            title: "Leaderboard",
            headerRight: () => null,
          }}
        />
        <View style={styles.backBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowLeaderboard(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={18} color="#444" />
            <ThemedText style={styles.backButtonText}>Back to Profile</ThemedText>
          </TouchableOpacity>
        </View>
        <LeaderboardScreen />
      </ThemedView>
    );
  }

  const topPercent =
    leaderboardRank && leaderboardTotal > 0
      ? Math.max(1, Math.ceil((leaderboardRank / leaderboardTotal) * 100))
      : null;

  return (
    <ThemedView style={styles.screenContainer}>
      <Tabs.Screen
        options={{
          title: "Profile",
          headerRight: () => (
            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                onPress={() => router.push('/friend-requests' as any)}
                style={styles.headerActionButton}
              >
                <View>
                  <Ionicons name="people-outline" size={24} color={theme.tint} />
                  {requestCount > 0 && (
                    <View style={styles.badge}>
                      <ThemedText style={styles.badgeText}>
                        {requestCount > 9 ? '9+' : requestCount}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.headerActionButton}>
                <Ionicons name="log-out-outline" size={24} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
          <Image
            source={profilePicture || DEFAULT_AVATAR}
            style={styles.avatar}
          />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={uploadAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="pencil" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ThemedView style={styles.container}>
          {/* Name */}
          <View style={styles.usernameRow}>
            {isEditing ? (
              <View style={styles.editUsernameContainer}>
                <View style={styles.editActionSpacer} />
                <TextInput
                  style={styles.usernameInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoFocus
                  maxLength={30}
                  editable={!savingUsername}
                />
                <View style={styles.editActionButtons}>
                  {savingUsername ? (
                    <ActivityIndicator size="small" color={theme.tint} style={styles.actionIcon} />
                  ) : (
                    <>
                      <TouchableOpacity onPress={handleSaveUsername} style={styles.actionIcon}>
                        <Ionicons name="checkmark-circle" size={28} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        setIsEditing(false);
                        setNewUsername(user.username || "");
                      }} style={styles.actionIcon}>
                        <Ionicons name="close-circle" size={28} color="#666" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.usernameDisplay}>
                <View style={styles.editIconSlot} />
                <ThemedText style={styles.username}>{user.username}</ThemedText>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIcon}>
                  <Feather name="edit-2" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.leaderboardTag,
              {
                backgroundColor: theme.leaderboardCardBackground,
                borderColor: theme.leaderboardCardBorder,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => setShowLeaderboard(true)}
          >
            <View style={styles.leaderboardTagLeft}>
              <View
                style={[
                  styles.leaderboardIconBadge,
                  { backgroundColor: theme.leaderboardCardBadge },
                ]}
              >
                <Ionicons name="trophy-outline" size={16} color="#fff" />
              </View>
              <View>
                <ThemedText
                  style={[
                    styles.leaderboardTagTitle,
                    { color: theme.leaderboardCardTitle },
                  ]}
                >
                  {leaderboardLoading
                    ? "Loading leaderboard..."
                    : leaderboardRank
                      ? `Leaderboard Rank #${leaderboardRank}`
                      : "Leaderboard Rank Unavailable"}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.leaderboardTagSubtitle,
                    { color: theme.leaderboardCardSubtitle },
                  ]}
                >
                  {leaderboardLoading
                    ? "Syncing your stats"
                    : leaderboardRank && topPercent
                      ? `${leaderboardRatings} ratings • Top ${topPercent}% of ${leaderboardTotal} users`
                      : "Tap to view full rankings"}
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.leaderboardCardChevron}
            />
          </TouchableOpacity>

          {/* Saved Restaurants Section */}
          <ThemedView style={styles.savedSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              My Saved Spots
            </ThemedText>
            <SavedRestaurantsList restaurantData={restaurantData} />
          </ThemedView>

          {/* ── Visited Places Section ── */}
          <ThemedView style={styles.savedSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              My Visited Places
            </ThemedText>
            <VisitedPlacesList />
          </ThemedView>

        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerActionButton: {
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.jumbo,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.md,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.md,
    color: "#999",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: Spacing.xxxl,
    marginBottom: 0,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#fff", 
  },
  editAvatarButton: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: "#6d5a90",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  container: {
    alignItems: "center",
    paddingBottom: Spacing.md,
  },
  usernameRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  usernameDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  editIconSlot: {
    width: 28,
    height: 28,
  },
  username: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.semibold,
    lineHeight: 34,
  },
  editIcon: {
    padding: Spacing.xs,
    alignSelf: "center",
  },
  editUsernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editActionSpacer: {
    width: 96,
  },
  usernameInput: {
    fontSize: 24,
    fontWeight: Typography.weight.semibold,
    color: "#333",
    borderBottomWidth: 2,
    borderBottomColor: "#6704ad",
    minWidth: 150,
    textAlign: "center",
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
  },
  editActionButtons: {
    flexDirection: "row",
    marginLeft: Spacing.md,
    minWidth: 86,
  },
  actionIcon: {
    padding: 5,
    marginLeft: 5,
  },
  leaderboardTag: {
    marginTop: 2,
    marginBottom: 6,
    width: "92%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e4f3",
    backgroundColor: "#f8f5ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  leaderboardTagLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  leaderboardIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6704ad",
  },
  leaderboardTagTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: "#2c1e44",
  },
  leaderboardTagSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
    color: "#6d5a90",
  },
  backBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    color: "#444",
  },
  savedSection: {
    width: "100%",
    marginVertical: 30,
  },
  sectionTitle: {
    marginBottom: 5,
    textAlign: "center",
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: Typography.weight.bold,
  },
});
