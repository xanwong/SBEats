import { searchRestaurants } from "./restaurantSearch";
import restaurants from "../assets/iv_restaurants.json";

describe("searchRestaurants", () => {
  it("matches restaurant names case-insensitively", () => {
    const results = searchRestaurants("aSiA 101");
    expect(results.some((r) => r.name === "Asia 101")).toBe(true);
  });

  it("matches categories case-insensitively", () => {
    const results = searchRestaurants("mexican");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.categories.includes("Mexican"))).toBe(true);
  });

  it("returns all restaurants for empty query", () => {
    const results = searchRestaurants("");
    expect(results.length).toBe(restaurants.length);
  });

  it("returns empty array when no matches exist", () => {
    expect(searchRestaurants("zzzz-no-match-zzzz")).toEqual([]);
  });
});
