"use client";

import Link from "next/link";
import type { ConversationSummary } from "@/lib/types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

interface ChatListProps {
  conversations: ConversationSummary[];
}

export function ChatList({ conversations }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-lg ring-1 ring-rose-100">
        <p className="text-lg font-semibold text-gray-800">
          チャットはまだありません
        </p>
        <p className="mt-2 text-sm text-gray-500">
          シェイクで近くのユーザーを見つけて、メッセージを送ってみましょう
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-gradient-to-r from-rose-400 to-orange-400 px-6 py-2.5 text-sm font-semibold text-white"
        >
          近くの人を探す
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {conversations.map((conversation) => {
        const isExpired = conversation.matchStatus === "expired";
        const preview = isExpired
          ? "マッチ解除されました"
          : (conversation.lastMessage?.content ?? "まだメッセージはありません");
        const timeSource = conversation.lastMessage?.createdAt;

        return (
          <li key={conversation.partnerId}>
            <Link
              href={`/chats/${conversation.partnerId}`}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-rose-50 transition hover:ring-rose-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={conversation.partner.photoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-gray-900">
                    {conversation.partner.nickname}
                  </p>
                  {timeSource && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatTime(timeSource)}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 truncate text-sm ${
                    isExpired ? "text-amber-600" : "text-gray-500"
                  }`}
                >
                  {preview}
                </p>
                {conversation.partnerLastActiveLabel && (
                  <p className="mt-1 text-xs text-gray-400">
                    {conversation.partnerLastActiveLabel}
                  </p>
                )}
                {!conversation.canMessage && !isExpired && (
                  <p className="mt-1 text-xs text-amber-600">
                    現在メッセージを送信できません
                  </p>
                )}
              </div>
              {conversation.unreadCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-bold text-white">
                  {conversation.unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
