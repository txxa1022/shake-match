"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_FILTERS,
  FILTER_STORAGE_KEY,
  type FilterSettings,
} from "@/lib/types";

interface FilterModalProps {
  isOpen: boolean;
  filters: FilterSettings;
  onClose: () => void;
  onApply: (filters: FilterSettings) => void;
}

const DISTANCE_OPTIONS = [
  { label: "500m以内", value: 500 },
  { label: "1km以内", value: 1000 },
  { label: "2km以内", value: 2000 },
];

export function FilterModal({
  isOpen,
  filters,
  onClose,
  onApply,
}: FilterModalProps) {
  const [draft, setDraft] = useState<FilterSettings>(filters);

  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="filter-title" className="text-lg font-bold text-gray-900">
            絞り込み
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            閉じる
          </button>
        </div>

        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-gray-800">
              性別
            </legend>
            <div className="flex gap-2">
              {(
                [
                  ["any", "指定しない"],
                  ["female", "女性"],
                  ["male", "男性"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, gender: value }))}
                  className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                    draft.gender === value
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              年齢: {draft.ageMin}〜{draft.ageMax}歳
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min={18}
                max={60}
                value={draft.ageMin}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    ageMin: Math.min(Number(e.target.value), prev.ageMax),
                  }))
                }
                className="w-full accent-rose-500"
              />
              <input
                type="range"
                min={18}
                max={60}
                value={draft.ageMax}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    ageMax: Math.max(Number(e.target.value), prev.ageMin),
                  }))
                }
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              距離
            </label>
            <div className="flex gap-2">
              {DISTANCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      maxDistanceMeters: option.value,
                    }))
                  }
                  className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
                    draft.maxDistanceMeters === option.value
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onApply(draft);
            if (typeof window !== "undefined") {
              localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(draft));
            }
            onClose();
          }}
          className="mt-8 w-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400 py-3.5 text-sm font-semibold text-white shadow-md"
        >
          適用
        </button>
      </div>
    </div>
  );
}

export function loadFiltersFromStorage(): FilterSettings {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<FilterSettings>;
    return {
      gender: parsed.gender ?? DEFAULT_FILTERS.gender,
      ageMin: Math.max(18, parsed.ageMin ?? DEFAULT_FILTERS.ageMin),
      ageMax: parsed.ageMax ?? DEFAULT_FILTERS.ageMax,
      maxDistanceMeters: Math.min(
        2000,
        parsed.maxDistanceMeters ?? DEFAULT_FILTERS.maxDistanceMeters,
      ),
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}
