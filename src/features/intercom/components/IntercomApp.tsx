"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useCamera } from "@/features/camera/hooks/use-camera";
import type { DeviceInfo } from "@/features/scene-control/lib/protocol";
import { useFullscreen } from "@/shared/hooks/use-fullscreen";
import { useLongPress } from "@/shared/hooks/use-long-press";
import { useWakeLock } from "@/shared/hooks/use-wake-lock";
import { readJson, writeJson } from "@/shared/lib/storage";
import { useIntercomRemote } from "../hooks/use-intercom-remote";
import { useIntercomStore } from "../hooks/use-intercom-store";
import { useKeyboardKeypad } from "../hooks/use-keyboard-keypad";
import type { KeypadKey } from "../types";
import { BootScreen, type BootPreferences } from "./BootScreen";
import { DeviceView } from "./DeviceView";
import { TechnicianSheet } from "./TechnicianSheet";

const PREFS_KEY = "dochita.boot.v1";
const STARTED_KEY = "dochita.started";
const DEFAULT_PREFS: BootPreferences = { demo: false, fullscreen: true, wakeLock: true };

function loadPrefs(): BootPreferences {
  const v = readJson(PREFS_KEY);
  if (v && typeof v === "object") return { ...DEFAULT_PREFS, ...(v as Partial<BootPreferences>) };
  return DEFAULT_PREFS;
}

const noopSubscribe = () => () => {};

/** Client-only gate: the intercom depends on browser APIs and local storage. */
export function IntercomApp() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div className="kiosk" />;
  return <IntercomRuntime />;
}

function IntercomRuntime() {
  const [prefs, setPrefs] = useState<BootPreferences>(loadPrefs);
  // Survives an accidental reload within the same session, so the device comes straight back.
  const [started, setStarted] = useState<boolean>(() => readJson(STARTED_KEY, "session") === true);
  const [techOpen, setTechOpen] = useState(false);
  const [keyFlash, setKeyFlash] = useState<{ key: KeypadKey; id: number } | null>(null);
  const flashId = useRef(0);

  const { state, dispatch, store } = useIntercomStore();
  const camera = useCamera(started && !prefs.demo);
  const fullscreen = useFullscreen();
  const wakeLock = useWakeLock();

  // High-brightness mode is applied at the root so every glow scales.
  const bright = state.settings.highBrightness;
  useEffect(() => {
    document.documentElement.dataset.bright = String(bright);
  }, [bright]);


  // After a reload the browser forgets fullscreen and wake lock; restore them on the first touch.
  const { enter: enterFullscreen, active: fsActive, supported: fsSupported } = fullscreen;
  const { request: requestWakeLock, active: wlActive, supported: wlSupported } = wakeLock;
  useEffect(() => {
    if (!started) return;
    const restore = () => {
      if (prefs.fullscreen && fsSupported && !fsActive) void enterFullscreen();
      if (prefs.wakeLock && wlSupported && !wlActive) void requestWakeLock();
    };
    window.addEventListener("pointerdown", restore, { once: true, capture: true });
    return () => window.removeEventListener("pointerdown", restore, { capture: true });
  }, [started, prefs, fsSupported, fsActive, enterFullscreen, wlSupported, wlActive, requestWakeLock]);

  const device = useMemo<DeviceInfo>(
    () => ({
      camera: camera.status,
      cameraDetail: camera.detail,
      demo: prefs.demo,
      fullscreen: fsActive,
      wakeLock: wlActive,
    }),
    [camera.status, camera.detail, prefs.demo, fsActive, wlActive],
  );
  const remote = useIntercomRemote(store, dispatch, device);

  const onKey = useCallback((key: KeypadKey) => dispatch({ type: "keypadPress", key }), [dispatch]);
  const onKeyboard = useCallback(
    (key: KeypadKey) => {
      onKey(key);
      flashId.current += 1;
      setKeyFlash({ key, id: flashId.current });
    },
    [onKey],
  );
  useKeyboardKeypad(onKeyboard, started && !techOpen);

  const openTech = useCallback(() => setTechOpen(true), []);
  const brandPress = useLongPress(openTech, 3000);

  const start = (next: BootPreferences) => {
    if (next.fullscreen && fsSupported) void enterFullscreen();
    if (next.wakeLock && wlSupported) void requestWakeLock();
    setPrefs(next);
    writeJson(PREFS_KEY, next);
    writeJson(STARTED_KEY, true, "session");
    setStarted(true);
  };

  const live = camera.status === "live" && camera.stream !== null;
  const source = {
    stream: live ? camera.stream : null,
    mirrored: camera.mirrored,
    width: live ? camera.width : null,
    height: live ? camera.height : null,
  };

  return (
    <div className="kiosk" onContextMenu={(e) => e.preventDefault()}>
      <DeviceView
        state={state}
        source={source}
        cameraOk={live || prefs.demo}
        connection={remote.status}
        onKey={onKey}
        keyFlash={keyFlash}
        brandPressHandlers={brandPress}
      />

      {!started && (
        <BootScreen
          initial={prefs}
          fullscreenSupported={fsSupported}
          wakeLockSupported={wlSupported}
          secureContext={window.isSecureContext}
          onStart={start}
        />
      )}

      {techOpen && (
        <TechnicianSheet
          camera={camera.status}
          cameraDetail={camera.detail}
          demo={prefs.demo}
          connection={remote.status}
          controls={remote.presence.controls}
          via={remote.info?.mode === "mqtt" ? `Cloud · sala ${remote.info.room}` : "Rețea locală (server pe laptop)"}
          settings={state.settings}
          fullscreen={{ supported: fsSupported, active: fsActive }}
          onClose={() => setTechOpen(false)}
          onRestartCamera={camera.restart}
          onToggleDemo={() => {
            const next = { ...prefs, demo: !prefs.demo };
            setPrefs(next);
            writeJson(PREFS_KEY, next);
          }}
          onFullscreen={() => void (fsActive ? fullscreen.exit() : enterFullscreen())}
          onSettings={(settings) => dispatch({ type: "setSettings", settings })}
          onResetScene={() => {
            dispatch({ type: "reset" });
            setTechOpen(false);
          }}
        />
      )}
    </div>
  );
}
