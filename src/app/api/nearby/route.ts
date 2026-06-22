import { NextResponse } from "next/server";
import { enforceApiAccess } from "@/lib/authGuards";
import { findNearbyUsers } from "@/lib/nearbySearch";
import { recordProximityMatches } from "@/lib/store";
import {
  DEFAULT_FILTERS,
  type FilterSettings,
  type Gender,
} from "@/lib/types";

interface NearbyRequestBody {
  latitude: number;
  longitude: number;
  filters?: Partial<FilterSettings>;
}

function parseFilters(raw?: Partial<FilterSettings>): FilterSettings {
  return {
    gender: raw?.gender ?? DEFAULT_FILTERS.gender,
    ageMin: Math.max(18, raw?.ageMin ?? DEFAULT_FILTERS.ageMin),
    ageMax: raw?.ageMax ?? DEFAULT_FILTERS.ageMax,
    maxDistanceMeters: Math.min(
      2000,
      raw?.maxDistanceMeters ?? DEFAULT_FILTERS.maxDistanceMeters,
    ),
  };
}

export async function POST(request: Request) {
  try {
    const access = enforceApiAccess(request);
    if (!access.ok) return access.response;

    const body = (await request.json()) as NearbyRequestBody;

    if (
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number" ||
      Number.isNaN(body.latitude) ||
      Number.isNaN(body.longitude)
    ) {
      return NextResponse.json(
        { error: "有効な緯度・経度が必要です" },
        { status: 400 },
      );
    }

    const filters = parseFilters(body.filters);
    const users = findNearbyUsers(body.latitude, body.longitude, filters);
    const publicUsers = users.map(
      ({ latitude: _lat, longitude: _lng, ...rest }) => rest,
    );

    const currentUserId = access.user.id;
    const proximityMatches = recordProximityMatches(
      currentUserId,
      publicUsers.map((user) => user.id),
    );

    return NextResponse.json({
      users: publicUsers,
      count: publicUsers.length,
      filters,
      proximityMatchCount: proximityMatches.length,
    });
  } catch {
    return NextResponse.json(
      { error: "近接ユーザーの取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST /api/nearby with { latitude, longitude, filters? }",
    supportedGenders: ["male", "female", "any"] satisfies (Gender | "any")[],
  });
}
