## Posts Feature

### Overview
The Posts feature allows users to share food photos in an Instagram-style feed. Users can upload photos, write captions, add hashtags, and tag restaurants from the SBEats database. Other users can like posts in real time.

### How to Use
1. Tap the **Posts** tab (📷 icon) in the bottom navigation bar
2. Tap the **+** icon in the top right to create a new post
3. Choose a photo from your library or take a new one
4. Write a caption (up to 300 characters)
5. Add hashtags by typing and pressing **Add**
6. Optionally tag a restaurant by searching in the **Tag a Restaurant** field
7. Tap **Share** to publish your post to the feed
8. Like other users' posts by tapping the ❤️ button

### Technical Implementation
| Component | Description |
| --- | --- |
| `app/(tabs)/posts.tsx` | Main feed screen — fetches posts from Firestore in real time using `onSnapshot` |
| `app/create-post.tsx` | Create post modal — handles image picking, compression, and Firestore upload |
| `components/posts/PostCard.tsx` | Reusable post card component with like functionality |
| `types/Post.ts` | TypeScript interface for the Post data model |

### Firestore Data Model
Posts are stored in a `posts` collection with the following structure:
```
posts/{postId}
  ├── userId: string
  ├── username: string
  ├── avatarUrl: string
  ├── restaurantId: string | null
  ├── restaurantName: string | null
  ├── imageUrl: string        (base64 encoded image)
  ├── caption: string
  ├── hashtags: string[]
  ├── likes: string[]         (array of userIds)
  └── createdAt: timestamp
```

### Notes
- Images are stored as base64 strings directly in Firestore (no Firebase Storage required)
- Images are compressed to quality 0.2 on upload to stay within Firestore's 1MB document limit
- The feed is sorted by most recent posts first
- Likes update in real time
