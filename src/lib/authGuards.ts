import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAuthUserById,
  getDemoAuthUser,
  verifyAuthToken,
  type AuthUser,
} from "@/lib/auth";
import { isUuid } from "@/lib/db";
import { DEMO_USER_ID, isDemoMode } from "@/lib/demoMode";
import { getUserIdFromRequest } from "@/lib/serverAuth";
import { USER_ID_COOKIE } from "@/lib/userIdStorage";

export type ApiAccessResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

function resolveDemoUserFromRequest(request: Request): AuthUser {
  const headerUserId = request.headers.get("x-user-id")?.trim();
  const demoUser = getDemoAuthUser();
  if (headerUserId && headerUserId !== DEMO_USER_ID && isUuid(headerUserId)) {
    return { ...demoUser, id: headerUserId };
  }
  return demoUser;
}

/**
 * API ルート用: 認証 + KYC (is_adult_verified) を検証する。
 * DEMO_MODE=true のときは固定ダミーユーザーでバイパスする。
 */
export function enforceApiAccess(request: Request): ApiAccessResult {
  if (isDemoMode()) {
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    return { ok: true, user: resolveDemoUserFromRequest(request) };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "認証トークンが必要です" },
        { status: 401 },
      ),
    };
  }

  const user = verifyAuthToken(token);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "無効な認証トークンです" },
        { status: 401 },
      ),
    };
  }

  if (!user.isAdultVerified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "KYC確認が完了していません。本人確認を行ってください。" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}

/**
 * サーバーコンポーネント用: 認証済みユーザーIDを取得する。
 */
export async function getServerAuthenticatedUser(): Promise<AuthUser> {
  if (isDemoMode()) {
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    const cookieStore = await cookies();
    const userId = cookieStore.get(USER_ID_COOKIE)?.value;
    const demoUser = getDemoAuthUser();
    if (userId && isUuid(userId)) {
      return { ...demoUser, id: userId };
    }
    return demoUser;
  }

  // TODO: セッション Cookie からユーザーを解決
  const user = getAuthUserById(DEMO_USER_ID);
  if (!user?.isAdultVerified) {
    throw new Error("KYC確認が完了していません");
  }

  return user;
}

export function resolveRequestUserId(request: Request): string {
  if (isDemoMode()) {
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    return DEMO_USER_ID;
  }

  return getUserIdFromRequest(request);
}
