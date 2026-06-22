import { CURRENT_USER_ID } from "@/lib/types";
import { DEMO_USER_ID, isDemoMode } from "@/lib/demoMode";

/**
 * リクエストからユーザーIDを解決する（本番用フォールバック）。
 * DEMO_MODE 時は authGuards.enforceApiAccess を優先すること。
 */
export function getUserIdFromRequest(request: Request): string {
  if (isDemoMode()) {
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    return DEMO_USER_ID;
  }

  const headerUserId = request.headers.get("x-user-id")?.trim();
  return headerUserId || CURRENT_USER_ID;
}
