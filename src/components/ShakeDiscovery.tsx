"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FilterModal, loadFiltersFromStorage } from "@/components/FilterModal";
import { ProfileCardCarousel } from "@/components/ProfileCardCarousel";
import { BottomNav } from "@/components/BottomNav";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { apiFetch } from "@/lib/apiClient";
import { DEFAULT_FILTERS, type FilterSettings, type NearbyUser } from "@/lib/types";

type AppPhase =
  | "idle"
  | "requesting-permissions"
  | "ready"
  | "searching"
  | "results"
  | "error";

interface ShakeDiscoveryProps {
  demoMode?: boolean;
}

export function ShakeDiscovery({ demoMode = false }: ShakeDiscoveryProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<AppPhase>(demoMode ? "ready" : "idle");
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    demoMode ? "端末を振るか、ボタンをタップして検索してください" : null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  const { getCurrentPosition, isLoading: isGeoLoading } = useGeolocation();

  useEffect(() => {
    setFilters(loadFiltersFromStorage());
  }, []);

  const searchNearby = useCallback(async () => {
    setPhase("searching");
    setStatusMessage("近くのユーザーを探しています…");

    try {
      const position = await getCurrentPosition();
      const data = await apiFetch<{
        users: NearbyUser[];
        proximityMatchCount: number;
      }>("/api/nearby", {
        method: "POST",
        json: {
          latitude: position.latitude,
          longitude: position.longitude,
          filters,
        },
      });

      setUsers(data.users);
      setPhase("results");
      setStatusMessage(null);
    } catch (error) {
      setPhase("error");
      setStatusMessage(
        error instanceof Error ? error.message : "検索に失敗しました",
      );
    }
  }, [filters, getCurrentPosition]);

  const { requestMotionPermission, motionPermission } = useShakeDetection({
    enabled: motionEnabled && phase === "ready",
    onShake: () => void searchNearby(),
  });

  const handleStart = useCallback(async () => {
    setPhase("requesting-permissions");
    setStatusMessage("センサーと位置情報の許可を確認しています…");

    const motion = await requestMotionPermission();
    if (motion === "denied") {
      setStatusMessage(
        "シェイク検知が使えません。下のボタンで検索できます。",
      );
    }

    setMotionEnabled(motion === "granted");
    setPhase("ready");
    if (motion !== "denied") {
      setStatusMessage("端末を振るか、ボタンをタップして検索してください");
    }
  }, [requestMotionPermission]);

  useEffect(() => {
    if (!demoMode) return;
    // TEMP: DEMO_MODE bypass - 本番では削除必須
    // ログイン/KYC画面を経由せず、シェイク画面を即表示する
    void handleStart();
  }, [demoMode, handleStart]);

  const handleLike = (userId: string) => {
    setStatusMessage(`いいねを送りました（プロトタイプ: ${userId}）`);
  };

  const handleMessage = (userId: string) => {
    router.push(`/chats/${userId}`);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col px-4 py-6 pb-24">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-rose-500">Shake Match</p>
          <h1 className="text-2xl font-bold text-gray-900">近くの人を探す</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-md ring-1 ring-rose-100"
          aria-label="絞り込み"
        >
          絞り込み
        </button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6">
        {phase === "idle" && !demoMode && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-orange-300 text-5xl shadow-lg shadow-rose-200">
              📱
            </div>
            <p className="text-lg font-semibold text-gray-800">
              振ってマッチング相手を探す
            </p>
            <p className="mt-2 text-sm text-gray-500">
              同じ場所・同じ時間帯にいる人のプロフィールが表示されます
            </p>
            <button
              type="button"
              onClick={() => void handleStart()}
              className="mt-8 w-full max-w-xs rounded-full bg-gradient-to-r from-rose-400 to-orange-400 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-rose-200"
            >
              はじめる
            </button>
          </div>
        )}

        {(phase === "requesting-permissions" || phase === "ready") && (
          <div className="w-full text-center">
            <div
              className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-orange-300 text-5xl shadow-lg shadow-rose-200 ${
                phase === "ready" ? "animate-[wiggle_1.2s_ease-in-out_infinite]" : ""
              }`}
            >
              🤝
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {phase === "ready"
                ? "端末を振ってください"
                : "準備しています…"}
            </p>
            {statusMessage && (
              <p className="mt-2 text-sm text-gray-500">{statusMessage}</p>
            )}
            {motionPermission === "denied" && (
              <p className="mt-2 text-xs text-amber-600">
                モーションセンサーが拒否されています
              </p>
            )}
            {phase === "ready" && (
              <button
                type="button"
                onClick={() => void searchNearby()}
                disabled={isGeoLoading}
                className="mt-6 w-full max-w-xs rounded-full border-2 border-rose-300 bg-white px-8 py-3.5 text-base font-semibold text-rose-500 disabled:opacity-60"
              >
                タップで検索
              </button>
            )}
          </div>
        )}

        {phase === "searching" && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
            <p className="font-medium text-gray-700">{statusMessage}</p>
          </div>
        )}

        {phase === "error" && (
          <div className="w-full rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-rose-100">
            <p className="font-semibold text-gray-800">検索できませんでした</p>
            <p className="mt-2 text-sm text-gray-500">{statusMessage}</p>
            <button
              type="button"
              onClick={() => {
                setPhase("ready");
                void searchNearby();
              }}
              className="mt-6 rounded-full bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white"
            >
              再試行
            </button>
          </div>
        )}

        {phase === "results" && (
          <div className="w-full">
            <ProfileCardCarousel
              users={users}
              onLike={handleLike}
              onMessage={handleMessage}
            />
            <button
              type="button"
              onClick={() => void searchNearby()}
              className="mx-auto mt-6 block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-rose-500 shadow ring-1 ring-rose-100"
            >
              もう一度探す
            </button>
          </div>
        )}
      </section>

      {statusMessage && phase === "results" && (
        <p className="mt-4 text-center text-xs text-gray-400">{statusMessage}</p>
      )}

      <FilterModal
        isOpen={isFilterOpen}
        filters={filters}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
      />
      <BottomNav />
    </div>
  );
}
