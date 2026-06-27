import { CURRENT_USER } from "./currentUser";
import { MOCK_USERS } from "./mockUsers";
import { getSql, isDbConfigured, isUuid } from "./db";
import { BEACON_DURATION_MINUTES } from "./types";

export interface UserLocationSnapshot {
  userId: string;
  latitude: number;
  longitude: number;
  beaconActiveUntil: string | null;
  updatedAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __shakeMatchMockLocations: Map<string, UserLocationSnapshot> | undefined;
}

function getMockLocations(): Map<string, UserLocationSnapshot> {
  if (!globalThis.__shakeMatchMockLocations) {
    globalThis.__shakeMatchMockLocations = new Map();
  }
  return globalThis.__shakeMatchMockLocations;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function seedMockUserLocation(userId: string): UserLocationSnapshot | null {
  const profile = [CURRENT_USER, ...MOCK_USERS].find(
    (user) => user.id === userId,
  );
  if (!profile) return null;

  const now = new Date();
  const snapshot: UserLocationSnapshot = {
    userId,
    latitude: profile.latitude,
    longitude: profile.longitude,
    beaconActiveUntil: addMinutes(now, BEACON_DURATION_MINUTES).toISOString(),
    updatedAt: now.toISOString(),
  };
  getMockLocations().set(userId, snapshot);
  return snapshot;
}

export async function upsertUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const now = new Date();
  const beaconActiveUntil = addMinutes(
    now,
    BEACON_DURATION_MINUTES,
  ).toISOString();

  if (!isDbConfigured() || !isUuid(userId)) {
    getMockLocations().set(userId, {
      userId,
      latitude,
      longitude,
      beaconActiveUntil,
      updatedAt: now.toISOString(),
    });
    return;
  }

  const sql = getSql();
  if (!sql) return;

  await sql`
    select upsert_user_location(
      ${userId}::uuid,
      ${latitude},
      ${longitude},
      ${BEACON_DURATION_MINUTES}
    )
  `;
}

export async function getUserLocation(
  userId: string,
): Promise<UserLocationSnapshot | null> {
  if (!isDbConfigured() || !isUuid(userId)) {
    const stored = getMockLocations().get(userId);
    if (stored) return stored;
    return seedMockUserLocation(userId);
  }

  const sql = getSql();
  if (!sql) {
    const stored = getMockLocations().get(userId);
    if (stored) return stored;
    return seedMockUserLocation(userId);
  }

  try {
    const rows = await sql`
      select
        user_id,
        st_y(location::geometry) as latitude,
        st_x(location::geometry) as longitude,
        beacon_active_until,
        updated_at
      from user_locations
      where user_id = ${userId}::uuid
      limit 1
    `;

    const row = rows[0] as {
      user_id: string;
      latitude: number;
      longitude: number;
      beacon_active_until: string | null;
      updated_at: string;
    } | undefined;

    if (!row) return null;

    return {
      userId: row.user_id,
      latitude: row.latitude,
      longitude: row.longitude,
      beaconActiveUntil: row.beacon_active_until,
      updatedAt: row.updated_at,
    };
  } catch {
    return getMockLocations().get(userId) ?? seedMockUserLocation(userId);
  }
}

export function isBeaconActive(beaconActiveUntil: string | null): boolean {
  if (!beaconActiveUntil) return false;
  return new Date(beaconActiveUntil).getTime() > Date.now();
}

export function formatLastActiveLabel(
  beaconActiveUntil: string | null,
): string {
  if (!beaconActiveUntil) {
    return "在席表示オフ";
  }

  const until = new Date(beaconActiveUntil).getTime();
  const now = Date.now();

  if (until > now) {
    return "今アクティブ";
  }

  const minutesAgo = Math.max(1, Math.floor((now - until) / 60_000));
  if (minutesAgo < 60) {
    return `最後にアクティブ: ${minutesAgo}分前`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `最後にアクティブ: ${hoursAgo}時間前`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  return `最後にアクティブ: ${daysAgo}日前`;
}
