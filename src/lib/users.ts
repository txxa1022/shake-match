import { ageFromBirthDate } from "./age";
import { CURRENT_USER } from "./currentUser";
import { getSql, isDbConfigured } from "./db";
import { MOCK_USERS } from "./mockUsers";
import type { Gender, PublicUserProfile, UserProfile } from "./types";
import { SPOT_ME_TEXT_MAX_LENGTH } from "./types";

const DEFAULT_PHOTO_URL =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=500&fit=crop";

const ALL_MOCK_USERS: UserProfile[] = [CURRENT_USER, ...MOCK_USERS];

interface UserRow {
  id: string;
  nickname: string;
  gender: Gender;
  birth_date: string;
  photo_url: string | null;
  favorite_food: string | null;
  hobbies: string | null;
  spot_me_text: string | null;
}

function mapRowToPublicProfile(row: UserRow): PublicUserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    age: ageFromBirthDate(row.birth_date),
    gender: row.gender,
    photoUrl: row.photo_url || DEFAULT_PHOTO_URL,
    favoriteFood: row.favorite_food || "",
    hobbies: row.hobbies || "",
    spotMeText: row.spot_me_text || "",
  };
}

export function getUserById(userId: string): UserProfile | undefined {
  return ALL_MOCK_USERS.find((user) => user.id === userId);
}

export function toPublicProfile(user: UserProfile): PublicUserProfile {
  return {
    id: user.id,
    nickname: user.nickname,
    age: user.age,
    gender: user.gender,
    photoUrl: user.photoUrl,
    favoriteFood: user.favoriteFood,
    hobbies: user.hobbies,
    spotMeText: user.spotMeText,
  };
}

export function getPublicProfile(userId: string): PublicUserProfile | undefined {
  const user = getUserById(userId);
  return user ? toPublicProfile(user) : undefined;
}

export async function getPublicProfileAsync(
  userId: string,
): Promise<PublicUserProfile | undefined> {
  const mockProfile = getPublicProfile(userId);
  if (mockProfile) return mockProfile;

  if (!isDbConfigured()) return undefined;

  const sql = getSql();
  if (!sql) return undefined;

  try {
    const rows = await sql`
      select id, nickname, gender, birth_date, photo_url, favorite_food, hobbies, spot_me_text
      from users
      where id = ${userId}::uuid
      limit 1
    `;

    const row = (rows as UserRow[])[0];
    if (!row) return undefined;
    return mapRowToPublicProfile(row);
  } catch {
    return undefined;
  }
}

export async function getProfileByIdAsync(
  userId: string,
): Promise<PublicUserProfile | undefined> {
  if (!isDbConfigured()) {
    return getPublicProfile(userId);
  }

  const dbProfile = await getPublicProfileAsync(userId);
  if (dbProfile) return dbProfile;

  return getPublicProfile(userId);
}

interface CreateUserInput {
  nickname: string;
  gender: Gender;
  birthDate: string;
  favoriteFood: string;
  hobbies: string;
  spotMeText: string;
  isAdultVerified: boolean;
  kycStatus: "pending" | "verified" | "rejected";
}

export async function createUserInDb(
  input: CreateUserInput,
): Promise<PublicUserProfile> {
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL が設定されていません");
  }

  const rows = await sql`
    insert into users (
      nickname,
      gender,
      birth_date,
      favorite_food,
      hobbies,
      spot_me_text,
      kyc_status,
      is_adult_verified
    )
    values (
      ${input.nickname},
      ${input.gender},
      ${input.birthDate},
      ${input.favoriteFood},
      ${input.hobbies},
      ${input.spotMeText || null},
      ${input.kycStatus},
      ${input.isAdultVerified}
    )
    returning id, nickname, gender, birth_date, photo_url, favorite_food, hobbies, spot_me_text
  `;

  const row = (rows as UserRow[])[0];
  if (!row) {
    throw new Error("ユーザーの作成に失敗しました");
  }

  return mapRowToPublicProfile(row);
}

interface UpdateProfileInput {
  userId: string;
  nickname?: string;
  favoriteFood?: string;
  hobbies?: string;
  spotMeText?: string;
}

export async function updateUserInDb(
  input: UpdateProfileInput,
): Promise<PublicUserProfile | null> {
  if (!isDbConfigured()) return null;

  const sql = getSql();
  if (!sql) return null;

  const spotMeText =
    input.spotMeText !== undefined
      ? input.spotMeText.slice(0, SPOT_ME_TEXT_MAX_LENGTH)
      : undefined;

  const rows = await sql`
    update users
    set
      nickname = coalesce(${input.nickname ?? null}, nickname),
      favorite_food = coalesce(${input.favoriteFood ?? null}, favorite_food),
      hobbies = coalesce(${input.hobbies ?? null}, hobbies),
      spot_me_text = coalesce(${spotMeText ?? null}, spot_me_text)
    where id = ${input.userId}::uuid
    returning id, nickname, gender, birth_date, photo_url, favorite_food, hobbies, spot_me_text
  `;

  const row = (rows as UserRow[])[0];
  if (!row) return null;
  return mapRowToPublicProfile(row);
}

export { SPOT_ME_TEXT_MAX_LENGTH };
