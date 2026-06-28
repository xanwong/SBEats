/**
 * TypeScript interface for user profiles.
 */
export interface UserProfile {
  uid?: string;                    // User's unique ID
  email: string;                   // User's email
  username: string;                    // User's display name
  avatarUrl?: string;              // Profile picture URL 
  friends?: string[];              // List of friend UIDs
  savedByCategory?: {              // Saved restaurants categorized by type
    [category: string]: string[];  // e.g., { "Coffee": ["ID1", "ID2"], "Sit-Down": ["ID3"] }
  };
  visitedDates?: {                 // Marked visited restaurants and dates
    [restaurantId: string]: string[]; 
  };
  createdAt?: Date;                // Account creation date 
  updatedAt?: Date;                // Last profile update date
}