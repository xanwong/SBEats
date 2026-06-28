import { Timestamp } from "firebase/firestore";

export interface FriendRequest {
  id: string;                // Firestore document ID
  fromUserId: string;        // UID of the sender
  toUserId: string;          // UID of the recipient
  status: "pending" | "accepted" | "denied";
  createdAt: Timestamp;
}
