import type { UserProfile } from "./types";
import { CURRENT_USER_ID } from "./types";
import { DEMO_USER_NAME } from "./demoMode";

export const CURRENT_USER: UserProfile = {
  id: CURRENT_USER_ID,
  nickname: DEMO_USER_NAME,
  age: 25,
  gender: "male",
  photoUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=500&fit=crop",
  favoriteFood: "和食",
  hobbies: "散歩・音楽",
  spotMeText: "",
  latitude: 35.658,
  longitude: 139.7016,
};
