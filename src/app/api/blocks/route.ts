import { NextResponse } from "next/server";
import { enforceApiAccess } from "@/lib/authGuards";
import { blockUser } from "@/lib/store";
import { getPublicProfileAsync } from "@/lib/users";

interface BlockBody {
  blockedId: string;
}

export async function POST(request: Request) {
  try {
    const access = enforceApiAccess(request);
    if (!access.ok) return access.response;

    const currentUserId = access.user.id;
    const body = (await request.json()) as BlockBody;

    if (!body.blockedId || typeof body.blockedId !== "string") {
      return NextResponse.json(
        { error: "ブロック対象のユーザーIDが必要です" },
        { status: 400 },
      );
    }

    if (body.blockedId === currentUserId) {
      return NextResponse.json(
        { error: "自分自身はブロックできません" },
        { status: 400 },
      );
    }

    const target = await getPublicProfileAsync(body.blockedId);
    if (!target) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    const block = blockUser(currentUserId, body.blockedId);
    return NextResponse.json({ block, success: true });
  } catch {
    return NextResponse.json(
      { error: "ブロックに失敗しました" },
      { status: 500 },
    );
  }
}
