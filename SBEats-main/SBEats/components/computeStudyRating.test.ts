import computeStudyRating from "../app/ratings/computeStudyRating";
import { RatingDoc } from "./rating/types";

const makeDoc = (study: any): RatingDoc => ({
  restaurantId: "r1",
  userId: "u1",
  food: 5,
  service: 5,
  study,
  value: 5,
});

describe("computeStudyRating", () => {
  it("returns null for empty input", () => {
    expect(computeStudyRating([])).toBeNull();
  });

  it("ignores invalid study values and computes average", () => {
    const docs: RatingDoc[] = [makeDoc(8), makeDoc(9), makeDoc(0), makeDoc(11), makeDoc("x")];

    expect(computeStudyRating(docs)).toBe(8.5);
  });

  it("rounds to one decimal place", () => {
    const docs: RatingDoc[] = [makeDoc(8.11), makeDoc(8.14)];
    expect(computeStudyRating(docs)).toBe(8.1);
  });
});
