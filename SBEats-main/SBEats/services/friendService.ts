import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { FriendRequest } from '@/types/FriendRequest';
import { UserProfile } from '@/types/User';

/**
 * Send a friend request from one user to another.
 * Prevents duplicate pending requests and self-requests.
 */
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  if (fromUserId === toUserId) {
    throw new Error('Cannot send a friend request to yourself.');
  }

  // Check if they are already friends
  const userDoc = await getDoc(doc(db, 'users', fromUserId));
  if (userDoc.exists()) {
    const userData = userDoc.data() as UserProfile;
    if (userData.friends?.includes(toUserId)) {
      throw new Error('You are already friends with this user.');
    }
  }

  // Check for an existing pending request in either direction
  const existingQuery = query(
    collection(db, 'friendRequests'),
    where('status', '==', 'pending'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId),
  );
  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    throw new Error('A friend request has already been sent.');
  }

  // Also check if the target already sent us a request
  const reverseQuery = query(
    collection(db, 'friendRequests'),
    where('status', '==', 'pending'),
    where('fromUserId', '==', toUserId),
    where('toUserId', '==', fromUserId),
  );
  const reverse = await getDocs(reverseQuery);

  if (!reverse.empty) {
    // Auto-accept: the other person already sent us a request
    const reverseDoc = reverse.docs[0];
    await acceptFriendRequest(reverseDoc.id, toUserId, fromUserId);
    return;
  }

  await addDoc(collection(db, 'friendRequests'), {
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/**
 * Accept a friend request: update the request doc status and
 * add each user to the other's friends array.
 */
export async function acceptFriendRequest(
  requestId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, { status: 'accepted' });

  // Add to both users' friends arrays
  const fromUserRef = doc(db, 'users', fromUserId);
  const toUserRef = doc(db, 'users', toUserId);

  await Promise.all([
    updateDoc(fromUserRef, { friends: arrayUnion(toUserId) }),
    updateDoc(toUserRef, { friends: arrayUnion(fromUserId) }),
  ]);
}

/**
 * Deny a friend request: update the request doc status to "denied".
 */
export async function denyFriendRequest(requestId: string): Promise<void> {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, { status: 'denied' });
}

/**
 * Get all pending incoming friend requests for a user.
 */
export async function getIncomingFriendRequests(
  userId: string,
): Promise<FriendRequest[]> {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as FriendRequest[];
}

/**
 * Get the friend request status between the current user and a target user.
 * Returns: "none" | "sent" | "received" | "friends"
 */
export async function getFriendStatus(
  currentUserId: string,
  targetUserId: string,
): Promise<'none' | 'sent' | 'received' | 'friends'> {
  // Check if already friends
  const userDoc = await getDoc(doc(db, 'users', currentUserId));
  if (userDoc.exists()) {
    const userData = userDoc.data() as UserProfile;
    if (userData.friends?.includes(targetUserId)) {
      return 'friends';
    }
  }

  // Check if we sent a pending request
  const sentQuery = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', currentUserId),
    where('toUserId', '==', targetUserId),
    where('status', '==', 'pending'),
  );
  const sentSnap = await getDocs(sentQuery);
  if (!sentSnap.empty) return 'sent';

  // Check if we received a pending request
  const receivedQuery = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', targetUserId),
    where('toUserId', '==', currentUserId),
    where('status', '==', 'pending'),
  );
  const receivedSnap = await getDocs(receivedQuery);
  if (!receivedSnap.empty) return 'received';

  return 'none';
}

/**
 * Get the count of pending incoming friend requests for badge display.
 */
export async function getIncomingRequestCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Get the full profile data for all friends of a user.
 */
export async function getFriendsList(userId: string): Promise<UserProfile[]> {
  const userSnap = await getDoc(doc(db, 'users', userId));
  if (!userSnap.exists()) return [];

  const userData = userSnap.data() as UserProfile;
  const friendIds = userData.friends ?? [];
  if (friendIds.length === 0) return [];

  const friends = await Promise.all(
    friendIds.map(async (fid) => {
      try {
        const snap = await getDoc(doc(db, 'users', fid));
        if (snap.exists()) {
          return { uid: snap.id, ...snap.data() } as UserProfile;
        }
        return null;
      } catch {
        return null;
      }
    }),
  );

  return friends.filter((f): f is UserProfile => f !== null);
}
