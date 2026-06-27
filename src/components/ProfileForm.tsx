"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { apiFetch } from "@/lib/apiClient";
import { setStoredUserId } from "@/lib/userIdStorage";
import type { Gender, PublicUserProfile } from "@/lib/types";
import { SPOT_ME_TEXT_MAX_LENGTH } from "@/lib/types";

export function ProfileForm() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [birthDate, setBirthDate] = useState("");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [spotMeText, setSpotMeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiFetch<{
          profile: PublicUserProfile;
          editable?: boolean;
        }>("/api/profile");
        if (data.editable) {
          setIsEditMode(true);
        }
        setNickname(data.profile.nickname);
        setGender(data.profile.gender);
        setFavoriteFood(data.profile.favoriteFood);
        setHobbies(data.profile.hobbies);
        setSpotMeText(data.profile.spotMeText);
      } catch {
        setIsEditMode(false);
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        await apiFetch<{ profile: PublicUserProfile }>("/api/profile", {
          method: "PATCH",
          json: {
            nickname,
            favoriteFood,
            hobbies,
            spotMeText,
          },
        });
        router.push("/");
        return;
      }

      const data = await apiFetch<{ profile: PublicUserProfile }>(
        "/api/profile",
        {
          method: "POST",
          json: {
            nickname,
            gender,
            birthDate,
            favoriteFood,
            hobbies,
            spotMeText,
          },
        },
      );

      setStoredUserId(data.profile.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6 pb-24">
      <header className="mb-6">
        <p className="text-sm font-medium text-rose-500">Shake Match</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "プロフィール編集" : "プロフィール作成"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {isEditMode
            ? "Spot me などプロフィール情報を更新できます"
            : "近接検索に表示されるプロフィールを登録します"}
        </p>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            ニックネーム
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={30}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            placeholder="例: ゆい"
          />
        </div>

        {!isEditMode && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-gray-800">
                性別
              </legend>
              <div className="flex gap-2">
                {(
                  [
                    ["female", "女性"],
                    ["male", "男性"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGender(value)}
                    className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                      gender === value
                        ? "bg-rose-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-800">
                生年月日
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Spot me（今のあなたの目印）
          </label>
          <input
            type="text"
            value={spotMeText}
            onChange={(e) => setSpotMeText(e.target.value)}
            maxLength={SPOT_ME_TEXT_MAX_LENGTH}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            placeholder="窓際で赤いキャップを被っています"
          />
          <p className="mt-1 text-xs text-gray-400">
            任意・{SPOT_ME_TEXT_MAX_LENGTH}文字以内
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            好きな食事
          </label>
          <input
            type="text"
            value={favoriteFood}
            onChange={(e) => setFavoriteFood(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            placeholder="例: イタリアン"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            普段の遊び方
          </label>
          <input
            type="text"
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            placeholder="例: カフェ巡り・映画"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400 py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          {isSubmitting
            ? "保存中…"
            : isEditMode
              ? "プロフィールを更新"
              : "プロフィールを登録"}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
