/**
 * Utility functions and components for computing and displaying aggregated restaurant ratings.
 */
import { RatingDoc } from "../../components/rating/types";

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function computeOverallRating(docs: RatingDoc[]) {
  if (!docs.length) return null;

  const keys: (keyof Pick<RatingDoc, "food" | "service" | "study" | "value">)[] = [
    "food",
    "service",
    "study",
    "value",
  ];

  const categoryAverages: number[] = [];

  for (const k of keys) {
    const vals = docs
      .map((d) => d[k])
      .filter((v) => typeof v === "number" && v >= 1 && v <= 10);

    if (!vals.length) continue;

    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    categoryAverages.push(avg);
  }

  if (!categoryAverages.length) return null;

  const overall = categoryAverages.reduce((a, b) => a + b, 0) / categoryAverages.length;
  return round1(overall);
}
