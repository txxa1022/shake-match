import type {
  Block,
  ConversationMatch,
  Message,
  ProximityMatch,
  Report,
} from "@/lib/types";
import { PROXIMITY_EXPIRY_HOURS } from "@/lib/types";

interface PrototypeStore {
  proximityMatches: ProximityMatch[];
  conversationMatches: ConversationMatch[];
  messages: Message[];
  blocks: Block[];
  reports: Report[];
}

declare global {
  // eslint-disable-next-line no-var
  var __shakeMatchStore: PrototypeStore | undefined;
}

function createStore(): PrototypeStore {
  return {
    proximityMatches: [],
    conversationMatches: [],
    messages: [],
    blocks: [],
    reports: [],
  };
}

function getStore(): PrototypeStore {
  if (!globalThis.__shakeMatchStore) {
    globalThis.__shakeMatchStore = createStore();
  }
  return globalThis.__shakeMatchStore;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function pairKey(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

export function recordProximityMatches(
  userId: string,
  matchedUserIds: string[],
): ProximityMatch[] {
  const store = getStore();
  const now = new Date();
  const expiresAt = addHours(now, PROXIMITY_EXPIRY_HOURS);

  const created = matchedUserIds.map((matchedUserId) => {
    const match: ProximityMatch = {
      id: newId("pm"),
      userId,
      matchedUserId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    store.proximityMatches.push(match);
    return match;
  });

  return created;
}

export function getMatchBetween(
  userA: string,
  userB: string,
): ConversationMatch | null {
  const store = getStore();
  const [a, b] = pairKey(userA, userB);

  return (
    store.conversationMatches.find(
      (match) => match.userA === a && match.userB === b,
    ) ?? null
  );
}

export function createOrActivateMatch(
  userA: string,
  userB: string,
): ConversationMatch {
  const store = getStore();
  const existing = getMatchBetween(userA, userB);
  if (existing) {
    if (existing.status === "expired") {
      return existing;
    }
    return existing;
  }

  const [a, b] = pairKey(userA, userB);
  const now = new Date().toISOString();
  const match: ConversationMatch = {
    id: newId("cm"),
    userA: a,
    userB: b,
    status: "active",
    createdAt: now,
    expiredAt: null,
  };
  store.conversationMatches.push(match);
  return match;
}

export function expireMatch(userA: string, userB: string): ConversationMatch | null {
  const store = getStore();
  const match = getMatchBetween(userA, userB);
  if (!match || match.status === "expired") return match;

  match.status = "expired";
  match.expiredAt = new Date().toISOString();
  const index = store.conversationMatches.findIndex((entry) => entry.id === match.id);
  if (index >= 0) {
    store.conversationMatches[index] = match;
  }
  return match;
}

export function getMatchPartnerIds(userId: string): string[] {
  const store = getStore();
  const partnerIds = new Set<string>();

  for (const match of store.conversationMatches) {
    if (match.userA === userId) partnerIds.add(match.userB);
    if (match.userB === userId) partnerIds.add(match.userA);
  }

  for (const message of store.messages) {
    if (message.senderId === userId) partnerIds.add(message.receiverId);
    if (message.receiverId === userId) partnerIds.add(message.senderId);
  }

  return Array.from(partnerIds).filter((id) => !isBlocked(userId, id));
}

export function isBlocked(userA: string, userB: string): boolean {
  const store = getStore();
  return store.blocks.some(
    (block) =>
      (block.blockerId === userA && block.blockedId === userB) ||
      (block.blockerId === userB && block.blockedId === userA),
  );
}

export function blockUser(blockerId: string, blockedId: string): Block {
  const store = getStore();
  if (isBlocked(blockerId, blockedId)) {
    const existing = store.blocks.find(
      (block) => block.blockerId === blockerId && block.blockedId === blockedId,
    );
    if (existing) return existing;
  }

  const block: Block = {
    id: newId("block"),
    blockerId,
    blockedId,
    createdAt: new Date().toISOString(),
  };
  store.blocks.push(block);
  return block;
}

export function createReport(input: {
  reporterId: string;
  reportedUserId: string;
  reason: string;
  messageId?: string | null;
}): Report {
  const store = getStore();
  const report: Report = {
    id: newId("report"),
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    reason: input.reason,
    messageId: input.messageId ?? null,
    createdAt: new Date().toISOString(),
  };
  store.reports.push(report);
  return report;
}

export function createMessage(input: {
  senderId: string;
  receiverId: string;
  content: string;
}): Message {
  const store = getStore();
  const message: Message = {
    id: newId("msg"),
    senderId: input.senderId,
    receiverId: input.receiverId,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  store.messages.push(message);
  return message;
}

export function getMessagesBetween(
  userA: string,
  userB: string,
): Message[] {
  const store = getStore();
  return store.messages
    .filter(
      (message) =>
        (message.senderId === userA && message.receiverId === userB) ||
        (message.senderId === userB && message.receiverId === userA),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function markMessagesAsRead(
  readerId: string,
  partnerId: string,
): number {
  const store = getStore();
  const now = new Date().toISOString();
  let count = 0;

  for (const message of store.messages) {
    if (
      message.receiverId === readerId &&
      message.senderId === partnerId &&
      message.readAt === null
    ) {
      message.readAt = now;
      count += 1;
    }
  }

  return count;
}

export function getConversationPartnerIds(userId: string): string[] {
  return getMatchPartnerIds(userId);
}
