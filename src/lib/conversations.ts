import { canSendMessageAsync } from "@/lib/matching";
import {
  getConversationPartnerIds,
  getMatchBetween,
  getMessagesBetween,
  isBlocked,
} from "@/lib/store";
import type { ConversationSummary } from "@/lib/types";
import {
  formatLastActiveLabel,
  getUserLocation,
} from "@/lib/userLocations";
import { getProfileByIdAsync } from "@/lib/users";

export async function getConversationsForUser(
  userId: string,
): Promise<ConversationSummary[]> {
  const partnerIds = getConversationPartnerIds(userId);
  const summaries: ConversationSummary[] = [];

  for (const partnerId of partnerIds) {
    const partner = await getProfileByIdAsync(partnerId);
    if (!partner || isBlocked(userId, partnerId)) continue;

    const messages = getMessagesBetween(userId, partnerId);
    const lastMessage = messages.at(-1) ?? null;
    const unreadCount = messages.filter(
      (message) => message.receiverId === userId && message.readAt === null,
    ).length;
    const match = getMatchBetween(userId, partnerId);
    const sendCheck = await canSendMessageAsync(userId, partnerId);
    const partnerLocation = await getUserLocation(partnerId);

    summaries.push({
      partnerId,
      partner,
      lastMessage,
      unreadCount,
      canMessage: sendCheck.allowed,
      matchStatus: match?.status ?? null,
      partnerLastActiveLabel: formatLastActiveLabel(
        partnerLocation?.beaconActiveUntil ?? null,
      ),
    });
  }

  return summaries.sort((a, b) => {
    const aTime = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : 0;
    const bTime = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : 0;
    return bTime - aTime;
  });
}
