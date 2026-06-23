import { DEMO_USER_ID } from "@/lib/demoMode";

export const USER_ID_STORAGE_KEY = "shake-match-user-id";
export const USER_ID_COOKIE = "shake-match-user-id";

export function getStoredUserId(): string {
  if (typeof window === "undefined") return DEMO_USER_ID;
  return localStorage.getItem(USER_ID_STORAGE_KEY) || DEMO_USER_ID;
}

export function setStoredUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
}
