"use client";

import { useCallback, useState } from "react";

interface GeolocationResult {
  latitude: number;
  longitude: number;
}

interface UseGeolocationResult {
  getCurrentPosition: () => Promise<GeolocationResult>;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation(): UseGeolocationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback((): Promise<GeolocationResult> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const message = "このブラウザは位置情報に対応していません";
        setError(message);
        setIsLoading(false);
        reject(new Error(message));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          const message =
            geoError.code === geoError.PERMISSION_DENIED
              ? "位置情報の許可が必要です。設定から許可してください。"
              : "位置情報の取得に失敗しました";
          setError(message);
          setIsLoading(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  return { getCurrentPosition, isLoading, error };
}
