/**
 * Utility specifically for computing aggregated study spot scores for a restaurant.
 */
import { RatingDoc } from "../../components/rating/types";

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * solves for average study spot rating (1–10) across all ratings
 * returns null if no valid study ratings exist
 */
export default function computeStudyRating(docs: RatingDoc[]): number | null {
  if (!docs.length) return null;

  const vals = docs
    .map((d) => d.study)
    .filter((v) => typeof v === "number" && v >= 1 && v <= 10);

  if (!vals.length) return null;

  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return round1(avg);
}