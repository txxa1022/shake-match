import type { KycStatus } from "@/lib/types";
import { CURRENT_USER_ID } from "@/lib/types";
import { DEMO_USER_ID, isDemoMode } from "@/lib/demoMode";
import { getUserById } from "@/lib/users";

export interface AuthUser {
  id: string;
  nickname: string;
  kycStatus: KycStatus;
  isAdultVerified: boolean;
}

function toAuthUser(
  id: string,
  nickname: string,
  kycStatus: KycStatus,
  isAdultVerified: boolean,
): AuthUser {
  return { id, nickname, kycStatus, isAdultVerified };
}

/** 本番用: Bearer トークンからユーザーを解決（未実装の場合は null） */
export function verifyAuthToken(token: string): AuthUser | null {
  // TODO: JWT / セッション検証を実装
  void token;
  return null;
}

/** 本番用: ユーザーIDから KYC 状態を取得 */
export function getAuthUserById(userId: string): AuthUser | null {
  const profile = getUserById(userId);
  if (!profile) return null;

  // TODO: DB の kyc_status / is_adult_verified を参照
  return toAuthUser(profile.id, profile.nickname, "pending", false);
}

/** DEMO_MODE 時に返す固定ダミーユーザー */
export function getDemoAuthUser(): AuthUser {
  return toAuthUser(DEMO_USER_ID, "デモユーザー", "verified", true);
}

export function getDefaultAuthenticatedUserId(): string {
  return CURRENT_USER_ID;
}
