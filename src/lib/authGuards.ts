import { NextResponse } from "next/server";
import {
  getAuthUserById,
  getDemoAuthUser,
  verifyAuthToken,
  type AuthUser,
} from "@/lib/auth";
import { DEMO_USER_ID, isDemoMode } from "@/lib/demoMode";
import { getUserIdFromRequest } from "@/lib/serverAuth";

export type ApiAccessResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/**
 * API ルート用: 認証 + KYC (is_adult_verified) を検証する。
 * DEMO_MODE=true のときは固定ダミーユーザーでバイパスする。
 */
export function enforceApiAccess(request: Request): ApiAccessResult {
  if (isDemoMode()) {
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    return { ok: true, user: getDemoAuthUser() };
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
export function getServerAuthenticatedUser(): AuthUser {
  if (isDemoMode()) {
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    return getDemoAuthUser();
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
