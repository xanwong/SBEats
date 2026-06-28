/**
 * Service handling the logic for submitting and fetching ratings from the firestore database.
 */
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebaseconfig";
import { RatingDoc, RatingKey, StudyAmenityKey } from "./types";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function safeId(raw: string) {
  return encodeURIComponent(raw);
}

function clamp1to10(n: number) {
  if (Number.isNaN(n)) return 5.0;
  if (n < 1) return 1.0;
  if (n > 10) return 10.0;
  return n;
}

export async function saveRating(
  restaurantId: string,
  ratings: Record<RatingKey, number>,
  studyAmenities: StudyAmenityKey[] = []
) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  const docId = `${safeId(restaurantId)}_${user.uid}`;
  const ref = doc(db, "ratings", docId);
  const now = Timestamp.now();
  const payload: Partial<RatingDoc> = {
    restaurantId,
    userId: user.uid,
    food: round1(clamp1to10(ratings.food)),
    service: round1(clamp1to10(ratings.service)),
    study: round1(clamp1to10(ratings.study)),
    value: round1(clamp1to10(ratings.value)),
    studyAmenities,
    updatedAt: now,
    createdAt: now,
  };
  try {
    await setDoc(ref, payload, { merge: true });
    console.log("Rating Saved to DB");
  } catch (e) {
    console.log("Rating Save failed:", (e as any).message);
  }
}

export async function getMyRating(
  restaurantId: string
): Promise<RatingDoc | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const docId = `${safeId(restaurantId)}_${user.uid}`;
  try {
    const snap = await getDoc(doc(db, "ratings", docId));
    console.log("Rating Returned from DB");
    return snap.exists() ? (snap.data() as RatingDoc) : null;
  } catch (error: any) {
    console.log("getMyRating error:", error.message);
    return null;
  }
}

export async function getRestaurantRatings(
  restaurantId: string
): Promise<RatingDoc[]> {
  try {
    const q = query(
      collection(db, "ratings"),
      where("restaurantId", "==", restaurantId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RatingDoc);
  } catch (error: any) {
    console.log("getRestaurantRatings error:", error.message);
    return [];
  }
}

export async function getMyRatings(): Promise<Record<string, RatingDoc>> {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const q = query(
      collection(db, "ratings"),
      where("userId", "==", user.uid)
    );
    const snap = await getDocs(q);
    const map: Record<string, RatingDoc> = {};
    for (const d of snap.docs) {
      const data = d.data() as RatingDoc;
      map[data.restaurantId] = data;
    }
    return map;
  } catch (error: any) {
    console.log("getMyRatings error:", error.message);
    return {};
  }
}