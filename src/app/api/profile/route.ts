import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demoMode";
import { isDbConfigured } from "@/lib/db";
import { createUserInDb } from "@/lib/users";
import { USER_ID_COOKIE } from "@/lib/userIdStorage";
import type { Gender } from "@/lib/types";

interface CreateProfileBody {
  nickname: string;
  gender: Gender;
  birthDate: string;
  favoriteFood: string;
  hobbies: string;
}

function isValidBirthDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
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
