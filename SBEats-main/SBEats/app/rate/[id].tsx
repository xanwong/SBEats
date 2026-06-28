/**
 * Screen for rating a specific restaurant, including detailed categories and study spot perks.
 */
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import restaurantData from "@/assets/iv_restaurants.json";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppColor, Radius, Spacing, Typography } from "@/constants/design";
import { useColorScheme } from "@/hooks/use-color-scheme";
import DecimalRatingRow from "../ratings/DecimalRatingRow";
import { RATING_CATEGORIES, STUDY_AMENITIES, RatingKey, StudyAmenityKey } from "../../components/rating/types";
import { saveRating, getMyRating } from "../../components/rating/ratingService";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function RateVisit() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppColor[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = restaurantData.find((r: any) => r.url === id);

  const [values, setValues] = React.useState<Record<RatingKey, number>>({
    food: 5.0,
    service: 5.0,
    study: 5.0,
    value: 5.0,
  });

  const [selectedAmenities, setSelectedAmenities] = React.useState<
    StudyAmenityKey[]
  >([]);

  const [loadingPrev, setLoadingPrev] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!id || typeof id !== "string") return;
      try {
        if (alive) setLoadingPrev(true);
        const mine = await getMyRating(id);
        if (!alive) return;
        if (mine) {
          setValues({
            food: round1(mine.food ?? 5.0),
            service: round1(mine.service ?? 5.0),
            study: round1(mine.study ?? 5.0),
            value: round1(mine.value ?? 5.0),
          });
          if (mine.studyAmenities) {
            setSelectedAmenities(mine.studyAmenities);
          }
        }
      } catch (e) {
        console.log("getMyRating error:", e);
      } finally {
        if (alive) setLoadingPrev(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (!restaurant) {
    return (
      <>
        <Stack.Screen options={{ title: "Rank Visit" }} />
        <ThemedView style={[styles.container, styles.center]}>
          <ThemedText>Restaurant not found</ThemedText>
        </ThemedView>
      </>
    );
  }

  const toggleAmenity = (key: StudyAmenityKey) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const onSave = async () => {
    if (!id || typeof id !== "string") return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await saveRating(id, values, selectedAmenities);
      setSaved(true);
    } catch (e: any) {
      console.log("saveRating error:", e);
      setError(e?.message ?? "Failed to save rating");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: `Rank ${restaurant.name}` }} />
      <ThemedView>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedView style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.title}>Rank this visit</ThemedText>
          <ThemedText style={styles.subtitle}>
            Rate each category from 1.0 to 10.0
          </ThemedText>

          {loadingPrev && (
            <ThemedText style={styles.loadingText}>
              Loading previous ratings...
            </ThemedText>
          )}

          {RATING_CATEGORIES.map((c) => (
            <DecimalRatingRow
              key={c.key}
              label={c.label}
              value={values[c.key]}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, [c.key]: v }))
              }
            />
          ))}
        </ThemedView>

        <ThemedView style={[styles.card, styles.cardSpacing, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.title}>Study Spot Offerings</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select everything available at this spot
          </ThemedText>

          <View style={styles.amenitiesGrid}>
            {STUDY_AMENITIES.map((amenity) => {
              const selected = selectedAmenities.includes(amenity.key);
              return (
                <TouchableOpacity
                  key={amenity.key}
                  style={[
                    styles.amenityChip,
                    { borderColor: theme.border, backgroundColor: theme.inputBackground },
                    selected && [styles.amenityChipSelected, { borderColor: theme.tint, backgroundColor: theme.tint }],
                  ]}
                  onPress={() => toggleAmenity(amenity.key)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.amenityChipText,
                      selected && styles.amenityChipTextSelected,
                    ]}
                  >
                    {amenity.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, styles.cardSpacing, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.tint }, saving && styles.disabled]}
            onPress={onSave}
            disabled={saving}
          >
            <ThemedText style={styles.saveText}>
              {saving ? "Saving..." : "Save Ratings"}
            </ThemedText>
          </TouchableOpacity>

          {saved && (
            <ThemedText style={styles.successText}>
              ✓ Ratings saved!
            </ThemedText>
          )}
          {error && (
            <ThemedText style={styles.error}>{error}</ThemedText>
          )}
        </ThemedView>
        <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f5f5f5", padding: Spacing.lg },
  center: { justifyContent: "center", alignItems: "center" },
  card: { borderRadius: Radius.md, padding: Spacing.lg },
  cardSpacing: { marginTop: Spacing.md },
  title: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, marginBottom: 6 },
  subtitle: { fontSize: 13, opacity: 0.6, marginBottom: 14 },
  loadingText: { opacity: 0.6, color: "#000", marginBottom: 10 },

  // Amenities
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  amenityChip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
  },
  amenityChipSelected: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  amenityChipText: {
    fontSize: 13,
    fontWeight: Typography.weight.medium,
    color: "#444",
  },
  amenityChipTextSelected: {
    color: "#fff",
  },

  // Save button
  saveBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: Typography.weight.semibold, fontSize: Typography.size.sm },
  disabled: { opacity: 0.5 },
  successText: {
    marginTop: 10,
    color: "green",
    textAlign: "center",
    fontWeight: "500",
  },
  error: { marginTop: 10, color: "crimson", textAlign: "center" },
});
