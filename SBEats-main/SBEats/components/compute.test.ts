import computeOverallRating from "../app/ratings/compute";
import { RatingDoc } from "./rating/types";

const makeDoc = (overrides: Partial<RatingDoc>): RatingDoc => ({
  restaurantId: "r1",
  userId: "u1",
  food: 5,
  service: 5,
  study: 5,
  value: 5,
  ...overrides,
});

describe("computeOverallRating", () => {
  it("returns null for empty input", () => {
    expect(computeOverallRating([])).toBeNull();
  });

  it("computes average of category averages and ignores invalid values", () => {
    const docs: RatingDoc[] = [
      makeDoc({ food: 10, service: 0, study: 0, value: 0 }),
      makeDoc({ food: 2, service: 8, study: 8, value: 8 }),
    ];

    expect(computeOverallRating(docs)).toBe(7.5);
  });

  it("returns null when no valid category values exist", () => {
    const docs: RatingDoc[] = [
      makeDoc({ food: 0, service: 11, study: -2, value: 100 }),
      makeDoc({ food: 0, service: 0, study: 0, value: 0 }),
    ];

    expect(computeOverallRating(docs)).toBeNull();
  });
});
