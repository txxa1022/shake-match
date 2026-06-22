import type {
  Block,
  Message,
  ProximityMatch,
  Report,
} from "@/lib/types";
import { PROXIMITY_EXPIRY_HOURS } from "@/lib/types";

interface PrototypeStore {
  proximityMatches: ProximityMatch[];
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

export function hasActiveProximityMatch(
  userId: string,
  matchedUserId: string,
): ProximityMatch | null {
  const store = getStore();
  const now = Date.now();

  const match = store.proximityMatches
    .filter(
      (entry) =>
        entry.userId === userId &&
        entry.matchedUserId === matchedUserId &&
        new Date(entry.expiresAt).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  return match ?? null;
}

export function getActiveProximityMatch(
  userId: string,
  matchedUserId: string,
): ProximityMatch | null {
  return hasActiveProximityMatch(userId, matchedUserId);
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
  const store = getStore();
  const partnerIds = new Set<string>();

  for (const message of store.messages) {
    if (message.senderId === userId) partnerIds.add(message.receiverId);
    if (message.receiverId === userId) partnerIds.add(message.senderId);
  }

  for (const match of store.proximityMatches) {
    if (match.userId === userId) partnerIds.add(match.matchedUserId);
  }

  return Array.from(partnerIds).filter((id) => !isBlocked(userId, id));
}

export function canSendMessage(senderId: string, receiverId: string): {
  allowed: boolean;
  reason?: string;
} {
  if (senderId === receiverId) {
    return { allowed: false, reason: "自分自身には送信できません" };
  }

  if (isBlocked(senderId, receiverId)) {
    return { allowed: false, reason: "ブロックされているため送信できません" };
  }

  const match = hasActiveProximityMatch(senderId, receiverId);
  if (!match) {
    return {
      allowed: false,
      reason:
        "このユーザーにはメッセージを送れません。シェイクで近接表示された相手のみ送信可能です（24時間以内）",
    };
  }

  return { allowed: true };
}
