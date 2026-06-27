"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { CURRENT_USER_ID } from "@/lib/types";
import type { MatchStatus, Message, PublicUserProfile } from "@/lib/types";

interface ThreadResponse {
  partner: PublicUserProfile;
  messages: Message[];
  canMessage: boolean;
  messageRestriction: string | null;
  matchStatus: MatchStatus | null;
  partnerLastActiveLabel: string | null;
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ChatThreadProps {
  partnerId: string;
}

export function ChatThread({ partnerId }: ChatThreadProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [partner, setPartner] = useState<PublicUserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [canMessage, setCanMessage] = useState(false);
  const [restriction, setRestriction] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [partnerLastActiveLabel, setPartnerLastActiveLabel] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ThreadResponse>(`/api/messages/${partnerId}`);
      setPartner(data.partner);
      setMessages(data.messages);
      setCanMessage(data.canMessage);
      setRestriction(data.messageRestriction);
      setMatchStatus(data.matchStatus);
      setPartnerLastActiveLabel(data.partnerLastActiveLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending || !canMessage) return;

    setIsSending(true);
    setError(null);
    try {
      const data = await apiFetch<{ message: Message }>("/api/messages", {
        method: "POST",
        json: { receiverId: partnerId, content },
      });
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
      setMatchStatus("active");
      setCanMessage(true);
      setRestriction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  };

  const handleBlock = async () => {
    if (!confirm(`${partner?.nickname}さんをブロックしますか？`)) return;

    try {
      await apiFetch("/api/blocks", {
        method: "POST",
        json: { blockedId: partnerId },
      });
      router.push("/chats");
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "ブロックに失敗しました",
      );
    }
  };

  const handleReport = async () => {
    const reason = reportReason.trim();
    if (!reason) {
      setActionMessage("通報理由を入力してください");
      return;
    }

    try {
      await apiFetch("/api/reports", {
        method: "POST",
        json: { reportedUserId: partnerId, reason },
      });
      setActionMessage("通報を受け付けました");
      setReportReason("");
      setShowActions(false);
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "通報に失敗しました",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-700">{error}</p>
        <Link href="/chats" className="text-sm font-medium text-rose-500">
          チャット一覧に戻る
        </Link>
      </div>
    );
  }

  if (!partner) return null;

  const isExpired = matchStatus === "expired";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-rose-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <Link
          href="/chats"
          className="rounded-full px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
        >
          ←
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={partner.photoUrl}
          alt=""
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">
            {partner.nickname}
          </p>
          {partnerLastActiveLabel && (
            <p className="text-xs text-gray-400">{partnerLastActiveLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowActions((prev) => !prev)}
          className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="その他"
        >
          ⋯
        </button>
      </header>

      {showActions && (
        <div className="border-b border-rose-100 bg-white px-4 py-3">
          <div className="space-y-3">
            <input
              type="text"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="通報理由を入力"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleReport()}
                className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800"
              >
                通報
              </button>
              <button
                type="button"
                onClick={() => void handleBlock()}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
              >
                ブロック
              </button>
            </div>
            {actionMessage && (
              <p className="text-xs text-gray-500">{actionMessage}</p>
            )}
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
          マッチ解除されました。メッセージ履歴は閲覧できますが、新しいメッセージは送信できません。
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isExpired && (
          <p className="text-center text-sm text-gray-400">
            最初のメッセージを送ってみましょう
          </p>
        )}
        {messages.map((message) => {
          const isMine = message.senderId === CURRENT_USER_ID;
          return (
            <div
              key={message.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? "rounded-br-md bg-gradient-to-r from-rose-400 to-orange-400 text-white"
                    : "rounded-bl-md bg-white text-gray-800 shadow ring-1 ring-rose-50"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`mt-1 text-[10px] ${
                    isMine ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-rose-100 bg-white px-4 py-3">
        {!canMessage && restriction && (
          <p className="mb-2 text-center text-xs text-amber-600">
            {restriction}
          </p>
        )}
        {error && <p className="mb-2 text-center text-xs text-red-500">{error}</p>}
        <form onSubmit={(e) => void handleSend(e)} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              canMessage ? "メッセージを入力…" : "送信できません"
            }
            disabled={!canMessage || isSending}
            className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!canMessage || isSending || !draft.trim()}
            className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            送信
          </button>
        </form>
      </footer>
    </div>
  );
}
