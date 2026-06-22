export type Gender = "male" | "female";

export type KycStatus = "pending" | "verified" | "rejected";

export interface UserProfile {
  id: string;
  nickname: string;
  age: number;
  gender: Gender;
  photoUrl: string;
  favoriteFood: string;
  hobbies: string;
  latitude: number;
  longitude: number;
}

export interface PublicUserProfile {
  id: string;
  nickname: string;
  age: number;
  gender: Gender;
  photoUrl: string;
  favoriteFood: string;
  hobbies: string;
}

export interface NearbyUser extends UserProfile {
  distanceMeters: number;
  distanceLabel: string;
}

export interface FilterSettings {
  gender: Gender | "any";
  ageMin: number;
  ageMax: number;
  maxDistanceMeters: number;
}

export interface ProximityMatch {
  id: string;
  userId: string;
  matchedUserId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConversationSummary {
  partnerId: string;
  partner: PublicUserProfile;
  lastMessage: Message | null;
  unreadCount: number;
  canMessage: boolean;
  proximityExpiresAt: string | null;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  messageId: string | null;
  createdAt: string;
}

export const DEFAULT_FILTERS: FilterSettings = {
  gender: "any",
  ageMin: 18,
  ageMax: 35,
  maxDistanceMeters: 2000,
};

export const FILTER_STORAGE_KEY = "shake-match-filters";
export const CURRENT_USER_ID = "me";

export const PROXIMITY_EXPIRY_HOURS = 24;
