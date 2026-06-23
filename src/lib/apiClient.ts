import { getStoredUserId } from "@/lib/userIdStorage";

interface ApiFetchOptions extends RequestInit {
  json?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = options;

  const response = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      // TEMP: DEMO_MODE bypass - 本番では削除必須（JWT 等に置き換え）
      "X-User-Id": getStoredUserId(),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "リクエストに失敗しました");
  }

  return data;
}
