import { NextResponse } from "next/server";
import { getConversationsForUser } from "@/lib/conversations";
import { enforceApiAccess } from "@/lib/authGuards";
import { canSendMessage, createMessage } from "@/lib/store";
import { getPublicProfileAsync } from "@/lib/users";
import type { Message } from "@/lib/types";

export async function GET(request: Request) {
  const access = enforceApiAccess(request);
  if (!access.ok) return access.response;

  const conversations = getConversationsForUser(access.user.id);
  return NextResponse.json({ conversations });
}

interface SendMessageBody {
  receiverId: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const access = enforceApiAccess(request);
    if (!access.ok) return access.response;

    const currentUserId = access.user.id;
    const body = (await request.json()) as SendMessageBody;

    if (!body.receiverId || typeof body.receiverId !== "string") {
      return NextResponse.json(
        { error: "送信先ユーザーIDが必要です" },
        { status: 400 },
      );
    }

    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "メッセージ本文を入力してください" },
        { status: 400 },
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "メッセージは1000文字以内にしてください" },
        { status: 400 },
      );
    }

    const receiver = await getPublicProfileAsync(body.receiverId);
    if (!receiver) {
      return NextResponse.json(
        { error: "送信先ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    const sendCheck = canSendMessage(currentUserId, body.receiverId);
    if (!sendCheck.allowed) {
      return NextResponse.json(
        { error: sendCheck.reason },
        { status: 403 },
      );
    }

    const message = createMessage({
      senderId: currentUserId,
      receiverId: body.receiverId,
      content,
    });

    return NextResponse.json({ message } satisfies { message: Message });
  } catch {
    return NextResponse.json(
      { error: "メッセージの送信に失敗しました" },
      { status: 500 },
    );
  }
}
