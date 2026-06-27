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
  spotMeText: string;
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
  spotMeText: string;
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

export type MatchStatus = "active" | "expired";

export interface ConversationMatch {
  id: string;
  userA: string;
  userB: string;
  status: MatchStatus;
  createdAt: string;
  expiredAt: string | null;
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
  matchStatus: MatchStatus | null;
  partnerLastActiveLabel: string | null;
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

/** ビーコン（在席表示）の有効時間（分） */
export const BEACON_DURATION_MINUTES = Number(
  process.env.BEACON_DURATION_MINUTES ?? 30,
);

/** メッセージ送信可能な最大距離（メートル） */
export const MESSAGE_MAX_DISTANCE_METERS = 1500;

/** マッチ自動解除の距離閾値（メートル） */
export const MATCH_EXPIRE_DISTANCE_METERS = 3000;

export const SPOT_ME_TEXT_MAX_LENGTH = 50;
