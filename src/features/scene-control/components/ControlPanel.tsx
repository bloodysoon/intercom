"use client";

import { Keyboard, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { useControlSync } from "../hooks/use-control-sync";
import { commandForKey, SHORTCUTS } from "../lib/shortcuts";
import { DEFAULT_ROOM } from "../lib/transport";
import { ConnectionBar } from "./ConnectionBar";
import { DisplaySettings, EffectControls, LedControls, SoundControls } from "./DeviceControls";
import { LivePreview } from "./LivePreview";
import { MessageEditor } from "./MessageEditor";
import { SceneNavigator } from "./SceneNavigator";
import { Panel } from "./ui";

/** Director / operator console. Runs on a laptop, phone or second tablet. */
export function ControlPanel() {
  const { status, presence, remote, device, ack, send, info } = useControlSync();
  const remoteRef = useRef(remote);
  useEffect(() => {
    remoteRef.current = remote;
  }, [remote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.repeat) return;
      const command = commandForKey(e, remoteRef.current);
      if (!command) return;
      e.preventDefault();
      send(command);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [send]);

  const tabletMissing = status === "open" && presence.intercoms === 0;

  return (
    <main className="min-h-dvh bg-[#0b0d10] text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d10]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-wide">
              DOCHIȚA <span className="font-medium text-slate-400">· Panou regizor</span>
            </h1>
          </div>
          <ConnectionBar status={status} presence={presence} device={device} ack={ack} info={info} />
        </div>
      </header>

      {(status !== "open" || tabletMissing) && (
        <div className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-200">
            <TriangleAlert className="flex-none" />
            {status !== "open"
              ? "Fără conexiune la server. Se reconectează automat; interfonul își păstrează starea curentă."
              : `Interfonul nu este conectat. Deschideți pagina principală pe tabletă${
                  info?.mode === "mqtt" && info.room !== DEFAULT_ROOM ? ` (cu ?sala=${info.room})` : ""
                }.`}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1600px] gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)_minmax(300px,360px)]">
        <div className="grid content-start gap-4">
          <SceneNavigator state={remote} send={send} />
        </div>

        <div className="grid content-start gap-4">
          <LedControls state={remote} send={send} />
          <EffectControls state={remote} send={send} />
          <MessageEditor state={remote} send={send} />
        </div>

        <div className="grid content-start gap-4 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          <Panel title="Previzualizare interfon">
            <LivePreview state={remote} connection={status} />
          </Panel>
          <SoundControls state={remote} send={send} />
          <DisplaySettings state={remote} send={send} />
          <Panel title="Scurtături tastatură" aside={<Keyboard size={16} className="text-slate-500" />}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="contents">
                  <dt>
                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">{s.keys}</kbd>
                  </dt>
                  <dd className="text-slate-300">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </main>
  );
}
