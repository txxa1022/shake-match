import {
  canSendMessage,
  getActiveProximityMatch,
  getConversationPartnerIds,
  getMessagesBetween,
  isBlocked,
} from "@/lib/store";
import { CURRENT_USER_ID } from "@/lib/types";
import type { ConversationSummary } from "@/lib/types";
import { getPublicProfile } from "@/lib/users";

export function getConversationsForUser(
  userId: string = CURRENT_USER_ID,
): ConversationSummary[] {
  const partnerIds = getConversationPartnerIds(userId);

  return partnerIds
    .map((partnerId) => {
      const partner = getPublicProfile(partnerId);
      if (!partner || isBlocked(userId, partnerId)) return null;

      const messages = getMessagesBetween(userId, partnerId);
      const lastMessage = messages.at(-1) ?? null;
      const unreadCount = messages.filter(
        (message) =>
          message.receiverId === userId && message.readAt === null,
      ).length;
      const proximity = getActiveProximityMatch(userId, partnerId);
      const sendCheck = canSendMessage(userId, partnerId);

      return {
        partnerId,
        partner,
        lastMessage,
        unreadCount,
        canMessage: sendCheck.allowed,
        proximityExpiresAt: proximity?.expiresAt ?? null,
      } satisfies ConversationSummary;
    })
    .filter((conversation): conversation is ConversationSummary => !!conversation)
    .sort((a, b) => {
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : a.proximityExpiresAt
          ? new Date(a.proximityExpiresAt).getTime()
          : 0;
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : b.proximityExpiresAt
          ? new Date(b.proximityExpiresAt).getTime()
          : 0;
      return bTime - aTime;
    });
}
