import { NextResponse } from "next/server";
import { enforceApiAccess } from "@/lib/authGuards";
import { isDemoMode } from "@/lib/demoMode";
import { isDbConfigured } from "@/lib/db";
import {
  createUserInDb,
  getProfileByIdAsync,
  getPublicProfileAsync,
  SPOT_ME_TEXT_MAX_LENGTH,
  updateUserInDb,
} from "@/lib/users";
import { USER_ID_COOKIE } from "@/lib/userIdStorage";
import type { Gender } from "@/lib/types";

interface CreateProfileBody {
  nickname: string;
  gender: Gender;
  birthDate: string;
  favoriteFood: string;
  hobbies: string;
  spotMeText?: string;
}

interface UpdateProfileBody {
  nickname?: string;
  favoriteFood?: string;
  hobbies?: string;
  spotMeText?: string;
}

function isValidBirthDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function normalizeSpotMeText(value: string | undefined): string {
  return (value ?? "").trim().slice(0, SPOT_ME_TEXT_MAX_LENGTH);
}

export async function GET(request: Request) {
  const access = enforceApiAccess(request);
  if (!access.ok) return access.response;

  if (isDbConfigured()) {
    const profile = await getPublicProfileAsync(access.user.id);
    if (!profile) {
      return NextResponse.json(
        { error: "プロフィールが見つかりません" },
        { status: 404 },
      );
    }
    return NextResponse.json({ profile, editable: true });
  }

  const mockProfile = await getProfileByIdAsync(access.user.id);
  if (!mockProfile) {
    return NextResponse.json(
      { error: "プロフィールが見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({ profile: mockProfile, editable: false });
}

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL が未設定のためプロフィール登録は利用できません" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as CreateProfileBody;
    const nickname = body.nickname?.trim();
    const favoriteFood = body.favoriteFood?.trim();
    const hobbies = body.hobbies?.trim();
    const spotMeText = normalizeSpotMeText(body.spotMeText);

    if (!nickname) {
      return NextResponse.json(
        { error: "ニックネームを入力してください" },
        { status: 400 },
      );
    }

    if (body.gender !== "male" && body.gender !== "female") {
      return NextResponse.json(
        { error: "性別を選択してください" },
        { status: 400 },
      );
    }

    if (!isValidBirthDate(body.birthDate)) {
      return NextResponse.json(
        { error: "生年月日の形式が正しくありません (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const isAdultVerified = isDemoMode();
    const kycStatus = isDemoMode() ? "verified" : "pending";

    const profile = await createUserInDb({
      nickname,
      gender: body.gender,
      birthDate: body.birthDate,
      favoriteFood: favoriteFood || "",
      hobbies: hobbies || "",
      spotMeText,
      isAdultVerified,
      kycStatus,
    });

    const response = NextResponse.json({ profile });
    response.cookies.set(USER_ID_COOKIE, profile.id, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error("Profile creation failed:", error);
    return NextResponse.json(
      { error: "プロフィールの作成に失敗しました" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const access = enforceApiAccess(request);
  if (!access.ok) return access.response;

  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL が未設定のためプロフィール編集は利用できません" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as UpdateProfileBody;
    const nickname = body.nickname?.trim();
    const favoriteFood = body.favoriteFood?.trim();
    const hobbies = body.hobbies?.trim();
    const spotMeText =
      body.spotMeText !== undefined
        ? normalizeSpotMeText(body.spotMeText)
        : undefined;

    const profile = await updateUserInDb({
      userId: access.user.id,
      nickname,
      favoriteFood,
      hobbies,
      spotMeText,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "プロフィールが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました" },
      { status: 500 },
    );
  }
}
