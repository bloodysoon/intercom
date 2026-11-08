import { CircleCheck, CircleX, Power, ScanFace } from "lucide-react";
import type { IntercomCommand, IntercomState, LedMode, ScreenTextMode } from "@/features/intercom/types";
import { CtlButton, Panel, Toggle } from "./ui";

const LED_OPTIONS: { mode: LedMode | null; label: string; color: string }[] = [
  { mode: null, label: "Auto (după scenă)", color: "conic-gradient(#4aa8ff, #2fe08a, #ffb21e, #ff4747, #4aa8ff)" },
  { mode: "idle", label: "Repaus", color: "#9fb1c9" },
  { mode: "active", label: "Albastru", color: "#409eff" },
  { mode: "scanning", label: "Scanare", color: "#3492ff" },
  { mode: "verifying", label: "Chihlimbar", color: "#ffaa14" },
  { mode: "failed", label: "Roșu", color: "#ff2828" },
  { mode: "success", label: "Verde", color: "#1ee678" },
  { mode: "unlocked", label: "Verde puls", color: "#1ee678" },
];

const SCREEN_TEXT_OPTIONS: { mode: ScreenTextMode; label: string; description: string }[] = [
  { mode: "access", label: "Doar acces", description: "Filmare: doar „Acces refuzat / Se verifică… / Acces permis”, fără iconițe" },
  { mode: "short", label: "Stări scurte", description: "Stări și instrucțiuni scurte, cu iconițe și detalii pe imagine" },
  { mode: "full", label: "Replica completă", description: "Repetiție: toată replica Dochiței pe ecran" },
];

interface Props {
  state: IntercomState | null;
  send: (c: IntercomCommand) => void;
}

export function LedControls({ state, send }: Props) {
  const power = state?.ledPower ?? true;
  return (
    <Panel
      title="Inel LED"
      aside={
        <CtlButton
          variant={power ? "success" : "default"}
          hint="L"
          className="min-h-10! pr-7"
          onClick={() => send({ type: "setLedPower", on: !power })}
        >
          <Power size={18} /> {power ? "Pornit" : "Oprit"}
        </CtlButton>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {LED_OPTIONS.map((o) => {
          const active = (state?.ledOverride ?? null) === o.mode;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => send({ type: "setLedOverride", mode: o.mode })}
              className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3 text-left text-[15px] font-semibold ${
                active ? "border-sky-400 bg-sky-400/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
            >
              <span
                className="h-5 w-5 flex-none rounded-full"
                style={{ background: o.color, boxShadow: o.mode ? `0 0 10px ${o.color}` : undefined }}
              />
              {o.label}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function EffectControls({ send }: Props) {
  return (
    <Panel title="Efecte">
      <div className="grid grid-cols-3 gap-2">
        <CtlButton hint="S" onClick={() => send({ type: "triggerEffect", kind: "scan" })}>
          <ScanFace size={20} /> Scanare
        </CtlButton>
        <CtlButton variant="success" hint="G" onClick={() => send({ type: "triggerEffect", kind: "success" })}>
          <CircleCheck size={20} /> Succes
        </CtlButton>
        <CtlButton variant="danger" hint="F" onClick={() => send({ type: "triggerEffect", kind: "failure" })}>
          <CircleX size={20} /> Eșec
        </CtlButton>
      </div>
    </Panel>
  );
}

export function DisplaySettings({ state, send }: Props) {
  const settings = state?.settings;
  return (
    <Panel title="Afișaj și tastatură">
      <div className="grid gap-2">
        <Toggle
          label="Carcasă desenată"
          description={
            settings?.skin === "hardware"
              ? "Pe tabletă e desenat un interfon metalic (carcasă, obiectiv, taste)"
              : "Tableta este interfonul: interfață pe tot ecranul"
          }
          checked={settings?.skin === "hardware"}
          onChange={(v) => send({ type: "setSettings", settings: { skin: v ? "hardware" : "screen" } })}
        />
        <Toggle
          label="Imagine pătrată 1:1"
          description={
            (settings?.aspect ?? "square") === "square"
              ? "Interfon pe tot ecranul, imaginea camerei pătrată, taste mari"
              : "Imaginea camerei ocupă tot spațiul liber"
          }
          checked={(settings?.aspect ?? "square") === "square"}
          onChange={(v) => send({ type: "setSettings", settings: { aspect: v ? "square" : "full" } })}
        />
        <Toggle
          label="Lumină pe margini"
          description={
            (settings?.edgeGlow ?? true)
              ? "Marginile ecranului se aprind în culoarea inelului LED"
              : "Marginile ecranului rămân întunecate (inelul LED merge în continuare)"
          }
          checked={settings?.edgeGlow ?? true}
          onChange={(v) => send({ type: "setSettings", settings: { edgeGlow: v } })}
        />
        <div className="grid gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <span className="text-[15px] font-semibold">Text pe ecran</span>
          <div className="grid grid-cols-3 gap-1.5">
            {SCREEN_TEXT_OPTIONS.map((o) => (
              <button
                key={o.mode}
                type="button"
                onClick={() => send({ type: "setSettings", settings: { screenText: o.mode } })}
                className={`min-h-11 rounded-lg border px-2 text-sm font-semibold ${
                  (settings?.screenText ?? "access") === o.mode
                    ? "border-sky-400 bg-sky-400/15"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">
            {SCREEN_TEXT_OPTIONS.find((o) => o.mode === (settings?.screenText ?? "access"))?.description}
          </span>
        </div>
        <Toggle
          label="Luminozitate ridicată"
          hint="B"
          description="LED și text mai puternice pentru platou"
          checked={settings?.highBrightness ?? false}
          onChange={(v) => send({ type: "setSettings", settings: { highBrightness: v } })}
        />
        <Toggle
          label="Deblocare din tastatură"
          description={`Codul ${settings?.unlockCode ?? "1225"} deschide ușa (implicit oprit)`}
          checked={settings?.keypadUnlockEnabled ?? false}
          onChange={(v) => send({ type: "setSettings", settings: { keypadUnlockEnabled: v } })}
        />
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5">
          <span className="text-[15px] font-semibold">Cod de deblocare</span>
          <input
            key={settings?.unlockCode}
            defaultValue={settings?.unlockCode ?? "1225"}
            inputMode="numeric"
            maxLength={6}
            pattern="\d{1,6}"
            className="w-28 rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-center font-mono text-lg tracking-widest"
            onBlur={(e) => {
              const v = e.currentTarget.value.replace(/\D/g, "").slice(0, 6);
              if (v && v !== settings?.unlockCode) send({ type: "setSettings", settings: { unlockCode: v } });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </label>
      </div>
    </Panel>
  );
}
