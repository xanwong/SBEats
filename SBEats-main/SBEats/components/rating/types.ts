/**
 * TypeScript type definitions related to ratings and reviews.
 */
export  const RATING_CATEGORIES = [
  { key: "food", label: "Food Quality" },
  { key: "service", label: "Service" },
  { key: "study", label: "Study Spot" },
  { key: "value", label: "Value" },
] as const;

export type RatingKey = typeof RATING_CATEGORIES[number]["key"];

export const STUDY_AMENITIES = [
  { key: "outlets", label: "Outlets Available" },
  { key: "freeWifi", label: "Free WiFi" },
  { key: "largeSeating", label: "Lots of Seating" },
  { key: "quietEnvironment", label: "Quiet Environment" },
  { key: "naturalLight", label: "Natural Light" },
  { key: "openLate", label: "Open Late" },
] as const;

export type StudyAmenityKey = typeof STUDY_AMENITIES[number]["key"];

export type RatingDoc = {
  restaurantId: string;
  userId: string;
  food: number;
  service: number;
  study: number;
  value: number;
  studyAmenities?: StudyAmenityKey[];
  createdAt?: any;
  updatedAt?: any;
};