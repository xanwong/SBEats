/**
 * TypeScript interface for posts.
 */
export interface Post {
    id?: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    restaurantId?: string;
    restaurantName?: string;
    imageUrl: string;
    caption: string;
    hashtags: string[];
    likes: string[]; // array of userIds who liked
    createdAt: Date | any;
  }