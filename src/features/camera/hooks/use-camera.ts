"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraInfo, CameraStatus } from "../types";

const IDEAL: MediaTrackConstraints = {
  facingMode: { ideal: "user" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
};

const RETRY_MS = [1_000, 2_000, 4_000, 8_000];

interface CameraState extends CameraInfo {
  stream: MediaStream | null;
  mirrored: boolean;
}

const INITIAL: CameraState = {
  status: "off",
  detail: null,
  width: null,
  height: null,
  stream: null,
  mirrored: true,
};

function classify(err: unknown): { status: CameraStatus; detail: string } {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "Error";
  const message = err instanceof Error ? err.message : String(err);
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return { status: "denied", detail: "Permisiunea pentru cameră a fost refuzată" };
    case "NotFoundError":
    case "OverconstrainedError":
      return { status: "unavailable", detail: "Nu a fost găsită nicio cameră" };
    case "NotReadableError":
    case "AbortError":
      return { status: "error", detail: "Camera este folosită de altă aplicație" };
    default:
      return { status: "error", detail: message || name };
  }
}

/**
 * Front camera lifecycle:
 * - prefers the user-facing camera, falls back to any camera
 * - releases the camera when the page is hidden, reacquires when visible
 * - restarts automatically if the track ends (rotation on some Android
 *   devices, OS interruptions) or the camera was busy
 * - never throws; failures surface as `status`
 */
export function useCamera(enabled: boolean) {
  const [state, setState] = useState<CameraState>(INITIAL);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const enabledRef = useRef(enabled);
  const startRef = useRef<() => Promise<void>>(async () => {});

  const stopStream = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
    const s = streamRef.current;
    streamRef.current = null;
    s?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
  }, []);

  const scheduleRetry = useCallback(() => {
    if (!enabledRef.current) return;
    const delay = RETRY_MS[Math.min(retryCount.current, RETRY_MS.length - 1)];
    retryCount.current += 1;
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => void startRef.current(), delay);
  }, []);

  const start = useCallback(async () => {
    const gen = ++generation.current;
    stopStream();

    if (typeof window === "undefined") return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState({
        ...INITIAL,
        status: "unavailable",
        detail: window.isSecureContext
          ? "Browserul nu permite accesul la cameră"
          : "Camera necesită HTTPS (conexiune securizată)",
      });
      return;
    }

    setState((s) => ({ ...s, status: "starting", detail: null }));

    let stream: MediaStream;
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: IDEAL, audio: false });
      } catch (err) {
        if (err instanceof DOMException && err.name === "OverconstrainedError") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (gen !== generation.current) return;
      const { status, detail } = classify(err);
      setState({ ...INITIAL, status, detail });
      if (status === "error") scheduleRetry();
      return;
    }

    // A newer start() or a disable happened while we were waiting.
    if (gen !== generation.current || !enabledRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    retryCount.current = 0;
    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings() ?? {};
    if (track) {
      track.onended = () => {
        if (gen !== generation.current) return;
        setState((s) => ({ ...s, status: "error", detail: "Semnal video întrerupt", stream: null }));
        scheduleRetry();
      };
    }

    setState({
      status: "live",
      detail: track?.label ?? null,
      width: settings.width ?? null,
      height: settings.height ?? null,
      stream,
      mirrored: settings.facingMode !== "environment",
    });
  }, [scheduleRetry, stopStream]);

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  /** Invalidates any in-flight getUserMedia call and releases the camera. */
  const invalidate = useCallback(() => {
    generation.current++;
    stopStream();
  }, [stopStream]);

  // Enable / disable. Starting is deferred one tick so state updates happen
  // outside the effect body (and StrictMode double-mounts never open two streams).
  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      invalidate();
      return;
    }
    const t = setTimeout(() => void start(), 0);
    return () => {
      clearTimeout(t);
      invalidate();
    };
  }, [enabled, start, invalidate]);

  // Release the camera while hidden; reacquire when visible.
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        generation.current++;
        stopStream();
        setState((s) => ({ ...s, status: "starting", stream: null }));
      } else {
        retryCount.current = 0;
        void start();
      }
    };
    const onDeviceChange = () => {
      if (!streamRef.current) {
        retryCount.current = 0;
        void start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.mediaDevices?.removeEventListener?.("devicechange", onDeviceChange);
    };
  }, [enabled, start, stopStream]);

  const restart = useCallback(() => {
    retryCount.current = 0;
    void start();
  }, [start]);

  return { ...(enabled ? state : INITIAL), restart };
}
