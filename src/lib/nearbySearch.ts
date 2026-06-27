import { ageFromBirthDate } from "./age";
import { formatDistanceLabel, haversineDistanceMeters } from "./haversine";
import { MOCK_USERS } from "./mockUsers";
import { getSql, isDbConfigured, isUuid } from "./db";
import { isBeaconActive } from "./userLocations";
import type { FilterSettings, Gender, NearbyUser } from "./types";
import { BEACON_DURATION_MINUTES } from "./types";

const DEFAULT_PHOTO_URL =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=500&fit=crop";

declare global {
  // eslint-disable-next-line no-var
  var __shakeMatchMockBeacons: Map<string, string> | undefined;
}

function getMockBeacons(): Map<string, string> {
  if (!globalThis.__shakeMatchMockBeacons) {
    globalThis.__shakeMatchMockBeacons = new Map();
  }
  return globalThis.__shakeMatchMockBeacons;
}

function getMockUserBeacon(userId: string): string | null {
  const beacons = getMockBeacons();
  const existing = beacons.get(userId);
  if (existing) return existing;

  const until = new Date(
    Date.now() + BEACON_DURATION_MINUTES * 60 * 1000,
  ).toISOString();
  beacons.set(userId, until);
  return until;
}

export function expireMockUserBeacon(userId: string): void {
  getMockBeacons().set(userId, new Date(Date.now() - 60_000).toISOString());
}

interface NearbyUserRow {
  id: string;
  nickname: string;
  gender: Gender;
  birth_date: string;
  photo_url: string | null;
  favorite_food: string | null;
  hobbies: string | null;
  spot_me_text: string | null;
  distance_meters: number;
}

function findNearbyUsersMock(
  latitude: number,
  longitude: number,
  filters: FilterSettings,
  limit = 20,
): NearbyUser[] {
  return MOCK_USERS.map((user) => {
    const distanceMeters = haversineDistanceMeters(
      latitude,
      longitude,
      user.latitude,
      user.longitude,
    );
    return {
      ...user,
      distanceMeters,
      distanceLabel: formatDistanceLabel(distanceMeters),
    };
  })
    .filter((user) => {
      const beaconUntil = getMockUserBeacon(user.id);
      return beaconUntil !== null && isBeaconActive(beaconUntil);
    })
    .filter((user) => user.distanceMeters <= filters.maxDistanceMeters)
    .filter((user) => user.age >= filters.ageMin && user.age <= filters.ageMax)
    .filter(
      (user) => filters.gender === "any" || user.gender === filters.gender,
    )
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

function mapRowToNearbyUser(row: NearbyUserRow): NearbyUser {
  return {
    id: row.id,
    nickname: row.nickname,
    age: ageFromBirthDate(row.birth_date),
    gender: row.gender,
    photoUrl: row.photo_url || DEFAULT_PHOTO_URL,
    favoriteFood: row.favorite_food || "",
    hobbies: row.hobbies || "",
    spotMeText: row.spot_me_text || "",
    latitude: 0,
    longitude: 0,
    distanceMeters: row.distance_meters,
    distanceLabel: formatDistanceLabel(row.distance_meters),
  };
}

export async function findNearbyUsers(
  latitude: number,
  longitude: number,
  filters: FilterSettings,
  options?: { excludeUserId?: string; limit?: number },
): Promise<NearbyUser[]> {
  const limit = options?.limit ?? 20;

  if (!isDbConfigured()) {
    return findNearbyUsersMock(latitude, longitude, filters, limit);
  }

  const sql = getSql();
  if (!sql) {
    return findNearbyUsersMock(latitude, longitude, filters, limit);
  }

  const excludeUserId = options?.excludeUserId;
  const excludeUuid =
    excludeUserId && isUuid(excludeUserId) ? excludeUserId : null;

  try {
    const rows = await sql`
      select *
      from find_nearby_users(
        ${latitude},
        ${longitude},
        ${filters.maxDistanceMeters},
        ${filters.ageMin},
        ${filters.ageMax},
        ${filters.gender},
        ${excludeUuid},
        ${limit}
      )
    `;

    return (rows as NearbyUserRow[]).map(mapRowToNearbyUser);
  } catch (error) {
    console.error("find_nearby_users failed, falling back to mock:", error);
    return findNearbyUsersMock(latitude, longitude, filters, limit);
  }
}

export function usesDbNearbySearch(): boolean {
  return isDbConfigured();
}
