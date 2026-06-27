import { NextResponse } from "next/server";
import { enforceApiAccess } from "@/lib/authGuards";
import { canSendMessageAsync } from "@/lib/matching";
import {
  getMatchBetween,
  getMessagesBetween,
  isBlocked,
  markMessagesAsRead,
} from "@/lib/store";
import { formatLastActiveLabel, getUserLocation } from "@/lib/userLocations";
import { getPublicProfileAsync } from "@/lib/users";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const access = enforceApiAccess(request);
  if (!access.ok) return access.response;

  const currentUserId = access.user.id;
  const { userId: partnerId } = await context.params;

  const partner = await getPublicProfileAsync(partnerId);
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
  const match = getMatchBetween(currentUserId, partnerId);
  const sendCheck = await canSendMessageAsync(currentUserId, partnerId);
  const partnerLocation = await getUserLocation(partnerId);

  return NextResponse.json({
    partner,
    messages,
    canMessage: sendCheck.allowed,
    messageRestriction: sendCheck.allowed ? null : sendCheck.reason,
    matchStatus: match?.status ?? null,
    partnerLastActiveLabel: formatLastActiveLabel(
      partnerLocation?.beaconActiveUntil ?? null,
    ),
  });
}
