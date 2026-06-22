import { haversineDistanceMeters, formatDistanceLabel } from "./haversine";
import { MOCK_USERS } from "./mockUsers";
import type { FilterSettings, NearbyUser } from "./types";

export function findNearbyUsers(
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
    .filter((user) => user.distanceMeters <= filters.maxDistanceMeters)
    .filter((user) => user.age >= filters.ageMin && user.age <= filters.ageMax)
    .filter((user) => filters.gender === "any" || user.gender === filters.gender)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
