"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SHAKE_THRESHOLD = 15;
const SHAKE_COOLDOWN_MS = 2000;

export type MotionPermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported";

interface UseShakeDetectionOptions {
  enabled: boolean;
  onShake: () => void;
}

interface UseShakeDetectionResult {
  requestMotionPermission: () => Promise<MotionPermissionState>;
  motionPermission: MotionPermissionState;
}

export function useShakeDetection({
  enabled,
  onShake,
}: UseShakeDetectionOptions): UseShakeDetectionResult {
  const [motionPermission, setMotionPermission] =
    useState<MotionPermissionState>("prompt");
  const lastValues = useRef({ x: 0, y: 0, z: 0 });
  const lastUpdate = useRef(0);
  const lastShakeAt = useRef(0);
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      typeof (
        DeviceMotionEvent as unknown as {
          requestPermission?: () => Promise<"granted" | "denied">;
        }
      ).requestPermission !== "function"
    ) {
      setMotionPermission("granted");
    }
  }, []);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const currentTime = Date.now();
    if (currentTime - lastUpdate.current <= 100) return;

    const diffTime = currentTime - lastUpdate.current;
    lastUpdate.current = currentTime;

    const { x, y, z } = acceleration;
    if (x === null || y === null || z === null) return;

    const { x: lastX, y: lastY, z: lastZ } = lastValues.current;
    const speed =
      (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;

    lastValues.current = { x, y, z };

    if (
      speed > SHAKE_THRESHOLD &&
      currentTime - lastShakeAt.current > SHAKE_COOLDOWN_MS
    ) {
      lastShakeAt.current = currentTime;
      onShakeRef.current();
    }
  }, []);

  const requestMotionPermission =
    useCallback(async (): Promise<MotionPermissionState> => {
      if (typeof window === "undefined") return "unsupported";

      const requestPermission = (
        DeviceMotionEvent as unknown as {
          requestPermission?: () => Promise<"granted" | "denied">;
        }
      ).requestPermission;

      if (typeof requestPermission !== "function") {
        setMotionPermission("granted");
        return "granted";
      }

      try {
        const state = await requestPermission();
        setMotionPermission(state);
        return state;
      } catch {
        setMotionPermission("denied");
        return "denied";
      }
    }, []);

  useEffect(() => {
    if (!enabled || motionPermission !== "granted") return;

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [enabled, motionPermission, handleMotion]);

  return {
    requestMotionPermission,
    motionPermission,
  };
}
