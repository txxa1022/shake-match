import { NextResponse } from "next/server";
import { enforceApiAccess } from "@/lib/authGuards";
import { createReport } from "@/lib/store";
import { getPublicProfileAsync } from "@/lib/users";

interface ReportBody {
  reportedUserId: string;
  reason: string;
  messageId?: string | null;
}

export async function POST(request: Request) {
  try {
    const access = enforceApiAccess(request);
    if (!access.ok) return access.response;

    const currentUserId = access.user.id;
    const body = (await request.json()) as ReportBody;

    if (!body.reportedUserId || typeof body.reportedUserId !== "string") {
      return NextResponse.json(
        { error: "通報対象のユーザーIDが必要です" },
        { status: 400 },
      );
    }

    const reason = body.reason?.trim();
    if (!reason) {
      return NextResponse.json(
        { error: "通報理由を入力してください" },
        { status: 400 },
      );
    }

    const target = await getPublicProfileAsync(body.reportedUserId);
    if (!target) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    const report = createReport({
      reporterId: currentUserId,
      reportedUserId: body.reportedUserId,
      reason,
      messageId: body.messageId ?? null,
    });

    return NextResponse.json({ report, success: true });
  } catch {
    return NextResponse.json(
      { error: "通報に失敗しました" },
      { status: 500 },
    );
  }
}
