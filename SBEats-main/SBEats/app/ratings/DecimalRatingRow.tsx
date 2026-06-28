/**
 * Component displaying a slider to represent decimal rating adjustment.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { ThemedText } from "@/components/themed-text";
import { AppColor, Spacing, Typography } from "@/constants/design";
import { useColorScheme } from "@/hooks/use-color-scheme";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function DecimalRatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppColor[colorScheme];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.value}>{value.toFixed(1)}</ThemedText>
      </View>

      <Slider
        minimumValue={1}
        maximumValue={10}
        step={0.1}
        value={value}
        onValueChange={(v) => onChange(round1(Number(v)))}
        minimumTrackTintColor={theme.tint}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.tint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: Typography.size.sm },
  value: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
});
