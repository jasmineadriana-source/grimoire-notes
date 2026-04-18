import { CharacterSheet } from "@/lib/types";
import { useApp } from "@/lib/store";
import { PdfImportButton } from "./PdfImportButton";
import { Bed, Coffee, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const modOf = (raw: string) => {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return "+0";
  const m = Math.floor((n - 10) / 2);
  return (m >= 0 ? "+" : "") + m;
};

function StatBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="stat-box">
      <span className="font-display text-[10px] uppercase tracking-widest text-ink/70">{label}</span>
      <input
        className="bg-transparent text-center font-display text-2xl w-full outline-none text-ink"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-xs font-display text-accent">{modOf(value)}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-0.5 ${className}`}>
      <input
        className="field-line font-script text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="font-display text-[10px] uppercase tracking-widest text-ink/60 text-center">
        {label}
      </span>
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[11px] uppercase tracking-widest text-ink/70">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border-2 bg-paper/40 p-2 font-script text-sm text-ink outline-none resize-none"
        style={{ borderColor: "hsl(var(--ink) / 0.25)" }}
      />
    </div>
  );
}

/** Format a timestamp as a friendly relative + absolute string. */
function formatRest(ts?: number): string {
  if (!ts) return "Not yet taken";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  let rel: string;
  if (mins < 1) rel = "just now";
  else if (mins < 60) rel = `${mins}m ago`;
  else if (hours < 24) rel = `${hours}h ago`;
  else rel = `${days}d ago`;
  const d = new Date(ts);
  const abs = d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  return `${rel} · ${abs}`;
}

function RestTracker({
  sheet,
  onChange,
}: {
  sheet: CharacterSheet;
  onChange: (patch: Partial<CharacterSheet>) => void;
}) {
  const takeShort = () => {
    onChange({ lastShortRest: Date.now() });
    toast.success("Short rest taken — 1 hour of light activity.");
  };
  const takeLong = () => {
    onChange({ lastLongRest: Date.now() });
    toast.success("Long rest taken — fully restored.");
  };
  const reset = () => {
    if (!confirm("Clear both rest timestamps?")) return;
    onChange({ lastShortRest: undefined, lastLongRest: undefined });
  };

  return (
    <div className="rounded-lg border-2 p-3 sm:p-4 mb-6"
         style={{ borderColor: "hsl(var(--ink) / 0.25)", background: "hsl(var(--paper) / 0.4)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-[11px] uppercase tracking-widest text-ink/70">
          Rest Tracker
        </span>
        <button
          onClick={reset}
          className="text-ink/50 hover:text-ink transition-colors"
          title="Reset rest timestamps"
          aria-label="Reset rest timestamps"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          onClick={takeShort}
          className="flex items-center gap-3 rounded-md border-2 px-3 py-2 text-left transition-all hover:border-accent hover:bg-accent/10"
          style={{ borderColor: "hsl(var(--ink) / 0.2)" }}
        >
          <Coffee className="h-5 w-5 text-accent shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block font-display text-sm text-ink">Short Rest</span>
            <span className="block text-[11px] text-ink/60 italic truncate">
              {formatRest(sheet.lastShortRest)}
            </span>
          </span>
        </button>
        <button
          onClick={takeLong}
          className="flex items-center gap-3 rounded-md border-2 px-3 py-2 text-left transition-all hover:border-accent hover:bg-accent/10"
          style={{ borderColor: "hsl(var(--ink) / 0.2)" }}
        >
          <Bed className="h-5 w-5 text-accent shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block font-display text-sm text-ink">Long Rest</span>
            <span className="block text-[11px] text-ink/60 italic truncate">
              {formatRest(sheet.lastLongRest)}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

export function CharacterSheetEditor({
  notebookId,
  pageId,
  sheet,
}: {
  notebookId: string;
  pageId: string;
  sheet: CharacterSheet;
}) {
  const updatePage = useApp((s) => s.updatePage);
  const set = (patch: Partial<CharacterSheet>) =>
    updatePage(notebookId, pageId, { sheet: { ...sheet, ...patch } });

  return (
    <div className="page-surface rounded-xl p-6 sm:p-8 mx-auto max-w-4xl animate-fade-in relative">
      <div className="absolute top-3 right-3 z-10">
        <PdfImportButton notebookId={notebookId} pageId={pageId} current={sheet} />
      </div>
      <div className="text-center mb-3">
        <input
          value={sheet.name}
          onChange={(e) => set({ name: e.target.value })}
          className="bg-transparent font-decorative text-3xl sm:text-5xl text-ink text-center w-full outline-none"
        />
        <p className="font-script text-sm text-ink/60 italic">Character Sheet</p>
      </div>
      <div className="ornament-divider my-4" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Field label="Class & Level" value={sheet.classLevel} onChange={(v) => set({ classLevel: v })} />
        <Field label="Race" value={sheet.race} onChange={(v) => set({ race: v })} />
        <Field label="Background" value={sheet.background} onChange={(v) => set({ background: v })} />
        <Field label="Alignment" value={sheet.alignment} onChange={(v) => set({ alignment: v })} />
        <Field label="Player" value={sheet.playerName} onChange={(v) => set({ playerName: v })} />
        <Field label="Experience" value={sheet.experience} onChange={(v) => set({ experience: v })} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        <StatBox label="STR" value={sheet.str} onChange={(v) => set({ str: v })} />
        <StatBox label="DEX" value={sheet.dex} onChange={(v) => set({ dex: v })} />
        <StatBox label="CON" value={sheet.con} onChange={(v) => set({ con: v })} />
        <StatBox label="INT" value={sheet.int} onChange={(v) => set({ int: v })} />
        <StatBox label="WIS" value={sheet.wis} onChange={(v) => set({ wis: v })} />
        <StatBox label="CHA" value={sheet.cha} onChange={(v) => set({ cha: v })} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Field label="Armor Class" value={sheet.ac} onChange={(v) => set({ ac: v })} />
        <Field label="Initiative" value={sheet.initiative} onChange={(v) => set({ initiative: v })} />
        <Field label="Speed" value={sheet.speed} onChange={(v) => set({ speed: v })} />
        <Field label="Prof. Bonus" value={sheet.proficiencyBonus} onChange={(v) => set({ proficiencyBonus: v })} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Field label="HP Max" value={sheet.hpMax} onChange={(v) => set({ hpMax: v })} />
        <Field label="HP Current" value={sheet.hpCurrent} onChange={(v) => set({ hpCurrent: v })} />
        <Field label="HP Temp" value={sheet.hpTemp} onChange={(v) => set({ hpTemp: v })} />
      </div>

      <RestTracker sheet={sheet} onChange={set} />

      <div className="ornament-divider my-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Area label="Features & Traits" value={sheet.features} onChange={(v) => set({ features: v })} />
        <Area label="Equipment" value={sheet.equipment} onChange={(v) => set({ equipment: v })} />
        <Area label="Spells & Abilities" value={sheet.spells} onChange={(v) => set({ spells: v })} />
        <Area label="Notes" value={sheet.notes} onChange={(v) => set({ notes: v })} />
      </div>
    </div>
  );
}
