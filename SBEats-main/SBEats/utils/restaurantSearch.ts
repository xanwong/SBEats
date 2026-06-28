/**
 * Utility functions providing search and filtering logic for restaurants.
 */
import restaurantData from "../assets/iv_restaurants.json";

export function searchRestaurants(query: string) {
  const search = query.toLowerCase();

  return restaurantData.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(search);
    const categoryMatch = item.categories.some(cat =>
      cat.toLowerCase().includes(search)
    );
    return nameMatch || categoryMatch;
  });
}