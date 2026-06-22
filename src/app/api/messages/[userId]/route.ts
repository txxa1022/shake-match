import { NextResponse } from "next/server";
import { enforceApiAccess } from "@/lib/authGuards";
import {
  canSendMessage,
  getActiveProximityMatch,
  getMessagesBetween,
  isBlocked,
  markMessagesAsRead,
} from "@/lib/store";
import { getPublicProfile } from "@/lib/users";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const access = enforceApiAccess(request);
  if (!access.ok) return access.response;

  const currentUserId = access.user.id;
  const { userId: partnerId } = await context.params;

  const partner = getPublicProfile(partnerId);
  if (!partner) {
    return NextResponse.json(
      { error: "ユーザーが見つかりません" },
      { status: 404 },
    );
  }

  if (isBlocked(currentUserId, partnerId)) {
    return NextResponse.json(
      { error: "このユーザーとのやり取りはできません" },
      { status: 403 },
    );
  }

  markMessagesAsRead(currentUserId, partnerId);

  const messages = getMessagesBetween(currentUserId, partnerId);
  const proximity = getActiveProximityMatch(currentUserId, partnerId);
  const sendCheck = canSendMessage(currentUserId, partnerId);

  return NextResponse.json({
    partner,
    messages,
    canMessage: sendCheck.allowed,
    messageRestriction: sendCheck.allowed ? null : sendCheck.reason,
    proximityExpiresAt: proximity?.expiresAt ?? null,
  });
}
