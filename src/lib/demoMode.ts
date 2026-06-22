/** サーバー専用: DEMO_MODE が有効かどうか */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export const DEMO_USER_ID = "me";
export const DEMO_USER_NAME = "デモユーザー";
