/**
 Displays the list of restaurants the current user has rated/visited,
 showing name, category, overall rating (1–10), study-spot star rating (1–5), and date.
 */
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const CATEGORY_IMAGES: Record<string, string> = {
  Mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
  Coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  Japanese: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
  Burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  Bakeries: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
  Chinese: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800",
  Indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
  American: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
  Smoothies: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800",
  Deli: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800",
  Dessert: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

import { auth, db } from "@/firebaseconfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

import { ThemedText } from "@/components/themed-text";
import { AppColor, Radius, Spacing, Typography } from "@/constants/design";
import { useColorScheme } from "@/hooks/use-color-scheme";

import restaurantData from "@/assets/iv_restaurants.json";

interface RatingDoc {
  restaurantId: string;
  userId: string;
  food: number;
  service: number;
  study: number;
  value: number;
  studyAmenities?: string[];
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | string | null;
  updatedAt?: Timestamp | { seconds: number; nanoseconds: number } | string | null;
}

interface VisitedEntry {
  restaurantId: string;
  name: string;
  category: string;
  imageUri: string;
  overallRating: number;
  studyStars: number;
  visitedAt: Date | null;
}

function toDate(
  ts?: Timestamp | { seconds: number; nanoseconds: number } | string | null
): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (typeof ts === "object" && "seconds" in ts)
    return new Date((ts as { seconds: number }).seconds * 1000);
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function studyScoreToStars(score: number): number {
  const raw = (score / 10) * 5;
  return Math.max(1, Math.min(5, Math.round(raw * 2) / 2));
}

function avg(...nums: number[]): number {
  const valid = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (!valid.length) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function formatDate(d: Date | null): string {
  if (!d) return "Date unknown";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRow({ stars }: { stars: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = stars >= i;
        const half = !filled && stars >= i - 0.5;
        return (
          <Ionicons
            key={i}
            name={filled ? "star" : half ? "star-half" : "star-outline"}
            size={13}
            color="#f5a623"
            style={{ marginRight: 1 }}
          />
        );
      })}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});

export default function VisitedPlacesList() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const theme = AppColor[colorScheme];
  const router = useRouter();

  const [entries, setEntries] = useState<VisitedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "ratings"),
      where("userId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const visited: VisitedEntry[] = snap.docs
          .map((d) => {
            const data = d.data() as RatingDoc;
            const restaurant = (restaurantData as any[]).find(
              (r) => r.url === data.restaurantId
            );

            const overallRating = Math.round(
              avg(data.food, data.service, data.study, data.value) * 10
            ) / 10;

            const studyStars = studyScoreToStars(data.study ?? 5);

            const visitedAt =
              toDate(data.updatedAt) ?? toDate(data.createdAt);

            const primaryCategory: string =
              restaurant?.categories?.[0] ?? restaurant?.category ?? "";
            const imageUri =
              CATEGORY_IMAGES[primaryCategory] ?? FALLBACK_IMAGE;

            return {
              restaurantId: data.restaurantId,
              name: restaurant?.name ?? data.restaurantId,
              category: primaryCategory || "Restaurant",
              imageUri,
              overallRating,
              studyStars,
              visitedAt,
            };
          })
          .sort((a, b) => {
            if (!a.visitedAt && !b.visitedAt) return 0;
            if (!a.visitedAt) return 1;
            if (!b.visitedAt) return -1;
            return b.visitedAt.getTime() - a.visitedAt.getTime();
          });

        setEntries(visited);
        setLoading(false);
      },
      (err) => {
        console.error("VisitedPlacesList snapshot error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const cardBg = isDark ? "#1e1e22" : "#fff";
  const cardBorder = isDark ? "#333" : "#efefef";
  const categoryColor = isDark ? "#a78bfa" : theme.tint;
  const ratingBg = isDark ? "#2d2c30" : "#f3eeff";
  const ratingColor = isDark ? "#d8b4fe" : "#5b21b6";
  const metaColor = isDark ? "#888" : "#999";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={theme.tint} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="location-outline" size={36} color="#bbb" />
        <ThemedText style={styles.emptyText}>No visited places yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Rate a restaurant to see it here
        </ThemedText>
      </View>
    );
  }

  const renderItem = ({ item }: { item: VisitedEntry }) => (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() =>
        router.push({
          pathname: "/restaurant/[id]",
          params: { id: item.restaurantId },
        } as any)
      }
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.thumb}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={[styles.category, { color: categoryColor }]}>
          {item.category}
        </ThemedText>
        <View style={styles.metaRow}>
          <StarRow stars={item.studyStars} />
          <ThemedText style={[styles.metaText, { color: metaColor }]}>
            {"  ·  "}
            {formatDate(item.visitedAt)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.ratingBadge, { backgroundColor: ratingBg }]}>
        <ThemedText style={[styles.ratingNum, { color: ratingColor }]}>
          {item.overallRating.toFixed(1)}
        </ThemedText>
        <ThemedText style={[styles.ratingMax, { color: metaColor }]}>
          /10
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.restaurantId}
      renderItem={renderItem}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
  },
  empty: {
    paddingVertical: 30,
    alignItems: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: "#aaa",
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#bbb",
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: "#e0e0e0",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  category: {
    fontSize: 12,
    fontWeight: Typography.weight.medium,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ratingNum: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.heavy,
    lineHeight: 20,
  },
  ratingMax: {
    fontSize: 11,
    fontWeight: Typography.weight.medium,
    marginBottom: 1,
    marginLeft: 1,
  },
});
