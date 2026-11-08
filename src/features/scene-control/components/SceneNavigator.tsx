import { ChevronLeft, ChevronRight, CornerDownRight, LockOpen, RotateCcw } from "lucide-react";
import { SCENES, SCREENPLAY_SCENE_TITLES, sceneIndex } from "@/features/intercom/constants/scenes";
import { selectView } from "@/features/intercom/lib/state-machine";
import type { IntercomCommand, IntercomState, SceneDefinition, Tone } from "@/features/intercom/types";
import { CtlButton, Panel } from "./ui";

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-slate-200",
  info: "text-sky-300",
  warning: "text-amber-300",
  error: "text-red-300",
  success: "text-emerald-300",
};
const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-l-slate-400",
  info: "border-l-sky-400",
  warning: "border-l-amber-400",
  error: "border-l-red-400",
  success: "border-l-emerald-400",
};

interface SceneNavigatorProps {
  state: IntercomState | null;
  send: (c: IntercomCommand) => void;
}

/** "Dochița: «…»" or the beat's silent label. */
function DochitaLine({ scene, className = "" }: { scene: SceneDefinition; className?: string }) {
  return scene.line ? (
    <span className={className}>
      <span className="font-bold text-slate-400">DOCHIȚA: </span>„{scene.line}”
    </span>
  ) : (
    <span className={`${className} italic text-slate-400`}>(fără replică — {scene.label.toLowerCase()})</span>
  );
}

export function SceneNavigator({ state, send }: SceneNavigatorProps) {
  const view = state ? selectView(state) : null;
  const index = state ? sceneIndex(state.sceneId) : -1;
  const next = index >= 0 && index < SCENES.length - 1 ? SCENES[index + 1] : null;

  return (
    <div className="grid gap-4">
      <section
        className={`rounded-2xl border border-white/10 border-l-4 bg-white/[0.04] p-5 ${view ? TONE_BORDER[view.tone] : "border-l-slate-600"}`}
      >
        {view ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-semibold uppercase tracking-widest text-slate-400">
                {SCREENPLAY_SCENE_TITLES[view.scene.scene]} · replica {index + 1} din {SCENES.length}
              </span>
              {view.isCustomMessage && (
                <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">MESAJ PERSONALIZAT</span>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Indiciu: </span>
              {view.scene.cue}
            </div>
            <div className={`mt-2 text-2xl font-extrabold leading-snug sm:text-3xl ${TONE_TEXT[view.tone]}`}>
              {view.isCustomMessage ? view.title : <DochitaLine scene={view.scene} />}
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[15px] text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pe ecran:</span>
              <span className="font-semibold">{view.title}</span>
              {view.subtitle && <span className="text-slate-400">· {view.subtitle}</span>}
            </div>
            {next && (
              <div className="mt-4 flex gap-2 rounded-xl bg-black/30 px-3 py-2.5 text-[15px] text-slate-300">
                <CornerDownRight className="mt-0.5 flex-none text-slate-500" size={18} />
                <span>
                  <span className="font-semibold uppercase tracking-wider text-slate-500">Următoarea · după: </span>
                  {next.cue}
                  <br />
                  <DochitaLine scene={next} className="text-slate-200" />
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-lg text-slate-400">Se așteaptă starea interfonului…</div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CtlButton size="lg" hint="←" onClick={() => send({ type: "prev" })} disabled={index === 0}>
          <ChevronLeft /> Înapoi
        </CtlButton>
        <CtlButton
          size="lg"
          variant="primary"
          hint="→"
          onClick={() => send({ type: "next" })}
          disabled={index === SCENES.length - 1}
        >
          Înainte <ChevronRight />
        </CtlButton>
        <CtlButton size="lg" variant="success" hint="U" onClick={() => send({ type: "unlock" })}>
          <LockOpen /> Deblochează
        </CtlButton>
        <CtlButton size="lg" variant="danger" hint="⇧R" onClick={() => send({ type: "reset" })}>
          <RotateCcw /> Resetare
        </CtlButton>
      </div>

      <Panel title="Scenariu">
        <ol className="grid gap-2">
          {SCENES.map((scene, i) => {
            const active = state?.sceneId === scene.id;
            const header = i === 0 || SCENES[i - 1].scene !== scene.scene;
            return (
              <li key={scene.id} className="grid gap-2">
                {header && (
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 first:mt-0">
                    {SCREENPLAY_SCENE_TITLES[scene.scene]}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => send({ type: "goto", sceneId: scene.id })}
                  className={[
                    "flex min-h-14 w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition",
                    active
                      ? "border-sky-400 bg-sky-400/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]",
                  ].join(" ")}
                >
                  <span
                    className={`mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg font-mono text-sm font-bold ${
                      active ? "bg-sky-400 text-sky-950" : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-xs text-slate-500">{scene.cue}</span>
                    <span className={`text-[15px] font-semibold leading-snug ${TONE_TEXT[scene.tone]}`}>
                      {scene.line ? `„${scene.line}”` : scene.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
