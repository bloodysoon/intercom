import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

type Variant = "default" | "primary" | "danger" | "success" | "warning";

const VARIANTS: Record<Variant, string> = {
  default: "bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-slate-100",
  primary: "bg-sky-500 hover:bg-sky-400 border-sky-300/40 text-sky-950",
  danger: "bg-red-500/90 hover:bg-red-400 border-red-300/40 text-red-950",
  success: "bg-emerald-500 hover:bg-emerald-400 border-emerald-300/40 text-emerald-950",
  warning: "bg-amber-400 hover:bg-amber-300 border-amber-200/40 text-amber-950",
};

interface CtlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  active?: boolean;
  hint?: string;
  size?: "md" | "lg";
}

/** Large touch-friendly console button with optional keyboard hint. */
export function CtlButton({ variant = "default", active, hint, size = "md", className = "", children, ...rest }: CtlButtonProps) {
  return (
    <button
      type="button"
      className={[
        "relative inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition active:scale-[0.98] select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
        "disabled:cursor-not-allowed disabled:opacity-40",
        size === "lg" ? "min-h-16 px-5 text-lg" : "min-h-12 px-3.5 text-[15px]",
        VARIANTS[variant],
        active ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-[#0b0d10]" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
      {hint && (
        <kbd className="absolute right-1.5 top-1 rounded bg-black/30 px-1 font-mono text-[10px] font-medium opacity-70">
          {hint}
        </kbd>
      )}
    </button>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-left hover:bg-white/[0.07]"
    >
      <span className="grid">
        <span className="text-[15px] font-semibold text-slate-100">
          {label}
          {hint && <kbd className="ml-2 rounded bg-black/30 px-1 font-mono text-[10px] text-slate-400">{hint}</kbd>}
        </span>
        {description && <span className="text-xs text-slate-400">{description}</span>}
      </span>
      <span className={`relative h-7 w-12 flex-none rounded-full transition ${checked ? "bg-emerald-500" : "bg-white/15"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
