import { haversineDistanceMeters } from "./haversine";
import {
  createOrActivateMatch,
  expireMatch,
  getMatchBetween,
  getMatchPartnerIds,
  getMessagesBetween,
  isBlocked,
} from "./store";
import { getUserLocation } from "./userLocations";
import {
  MATCH_EXPIRE_DISTANCE_METERS,
  MESSAGE_MAX_DISTANCE_METERS,
} from "./types";

export async function getDistanceBetweenUsers(
  userA: string,
  userB: string,
): Promise<number | null> {
  const [locationA, locationB] = await Promise.all([
    getUserLocation(userA),
    getUserLocation(userB),
  ]);

  if (!locationA || !locationB) return null;

  return haversineDistanceMeters(
    locationA.latitude,
    locationA.longitude,
    locationB.latitude,
    locationB.longitude,
  );
}

export async function canSendMessageAsync(
  senderId: string,
  receiverId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (senderId === receiverId) {
    return { allowed: false, reason: "自分自身には送信できません" };
  }

  if (isBlocked(senderId, receiverId)) {
    return { allowed: false, reason: "ブロックされているため送信できません" };
  }

  const match = getMatchBetween(senderId, receiverId);
  if (match?.status === "expired") {
    return {
      allowed: false,
      reason: "マッチが解除されました。新しいメッセージは送信できません",
    };
  }

  const distance = await getDistanceBetweenUsers(senderId, receiverId);
  if (distance === null) {
    return {
      allowed: false,
      reason: "位置情報が取得できないため送信できません",
    };
  }

  if (distance > MESSAGE_MAX_DISTANCE_METERS) {
    return {
      allowed: false,
      reason: `相手との距離が遠すぎます（${Math.round(distance / 100) / 10}km）。1.5km以内の相手にのみ送信できます`,
    };
  }

  return { allowed: true };
}

function lastMessageHasNoReply(userA: string, userB: string): boolean {
  return getMessagesBetween(userA, userB).length > 0;
}

export async function evaluateMatchExpirationsOnShake(
  userId: string,
): Promise<number> {
  const partnerIds = getMatchPartnerIds(userId);
  let expiredCount = 0;

  for (const partnerId of partnerIds) {
    const match = getMatchBetween(userId, partnerId);
    if (!match || match.status !== "active") continue;

    if (!lastMessageHasNoReply(userId, partnerId)) continue;

    const distance = await getDistanceBetweenUsers(userId, partnerId);
    if (distance === null || distance < MATCH_EXPIRE_DISTANCE_METERS) continue;

    expireMatch(userId, partnerId);
    expiredCount += 1;
  }

  return expiredCount;
}

export function ensureMatchOnMessage(
  senderId: string,
  receiverId: string,
): void {
  createOrActivateMatch(senderId, receiverId);
}
