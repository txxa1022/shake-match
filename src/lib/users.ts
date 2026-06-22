import { CURRENT_USER } from "./currentUser";
import { MOCK_USERS } from "./mockUsers";
import type { PublicUserProfile, UserProfile } from "./types";

const ALL_USERS: UserProfile[] = [CURRENT_USER, ...MOCK_USERS];

export function getUserById(userId: string): UserProfile | undefined {
  return ALL_USERS.find((user) => user.id === userId);
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
  };
}

export function getPublicProfile(userId: string): PublicUserProfile | undefined {
  const user = getUserById(userId);
  return user ? toPublicProfile(user) : undefined;
}
