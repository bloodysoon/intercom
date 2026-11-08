import { MessageSquareText, X } from "lucide-react";
import { useState } from "react";
import type { IntercomCommand, IntercomState, Tone } from "@/features/intercom/types";
import { CtlButton, Panel } from "./ui";

const TONES: { tone: Tone; label: string; cls: string }[] = [
  { tone: "info", label: "Info", cls: "bg-sky-400" },
  { tone: "warning", label: "Atenție", cls: "bg-amber-400" },
  { tone: "error", label: "Eroare", cls: "bg-red-500" },
  { tone: "success", label: "Succes", cls: "bg-emerald-500" },
  { tone: "neutral", label: "Neutru", cls: "bg-slate-300" },
];

/** Ready-made lines for improvisation, all in the device's serious register. */
const PRESETS: { title: string; subtitle?: string; tone: Tone }[] = [
  { title: "Față nerecunoscută", subtitle: "Vă rugăm să încercați din nou", tone: "error" },
  { title: "Vă rugăm să vă apropiați", tone: "info" },
  { title: "Nu vă mișcați", subtitle: "Scanare în curs…", tone: "info" },
  { title: "Răspuns incorect", subtitle: "Mai aveți o încercare", tone: "error" },
  { title: "Verificare de securitate", subtitle: "Vă rugăm să așteptați", tone: "warning" },
  { title: "Cod de verificare necesar", tone: "warning" },
  { title: "Sistem în curs de actualizare", subtitle: "Vă rugăm să reveniți mai târziu", tone: "warning" },
  { title: "Acces refuzat", tone: "error" },
];

interface Props {
  state: IntercomState | null;
  send: (c: IntercomCommand) => void;
}

export function MessageEditor({ state, send }: Props) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<Tone>("info");
  const active = state?.messageOverride ?? null;

  const show = () => {
    if (!title.trim()) return;
    send({
      type: "setMessageOverride",
      message: { title: title.trim(), subtitle: subtitle.trim() || undefined, status: status.trim() || undefined, tone },
    });
  };

  return (
    <Panel
      title="Mesaj personalizat"
      aside={
        active && (
          <CtlButton variant="warning" hint="Esc" className="min-h-10! pr-9" onClick={() => send({ type: "setMessageOverride", message: null })}>
            <X size={18} /> Șterge
          </CtlButton>
        )
      }
    >
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          show();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titlu (ex. Majestatea Voastră?)"
          maxLength={80}
          className="min-h-12 rounded-xl border border-white/15 bg-black/40 px-3 text-lg"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Subtitlu (opțional)"
          maxLength={120}
          className="min-h-11 rounded-xl border border-white/15 bg-black/40 px-3"
        />
        <input
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Linie de stare (opțional)"
          maxLength={60}
          className="min-h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.tone}
              type="button"
              onClick={() => setTone(t.tone)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                tone === t.tone ? "border-sky-400 bg-sky-400/15" : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${t.cls}`} />
              {t.label}
            </button>
          ))}
        </div>
        <CtlButton type="submit" variant="primary" disabled={!title.trim()}>
          <MessageSquareText size={18} /> Afișează pe interfon
        </CtlButton>
      </form>

      <div className="mt-3 grid gap-1.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mesaje rapide</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => send({ type: "setMessageOverride", message: p })}
              className="min-h-10 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-left text-sm hover:bg-white/[0.08]"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}
