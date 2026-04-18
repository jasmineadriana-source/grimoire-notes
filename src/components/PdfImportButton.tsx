import { useRef, useState } from "react";
import { CharacterSheet } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

// pdfjs setup — use CDN worker matching installed version
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/** Extract text as line-per-text-item — preserves order of glyph runs which
 * is what D&D Beyond / Wizards official sheets rely on (value line followed
 * by ALL-CAPS label line). */
async function extractLines(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    for (const it of content.items as any[]) {
      const s = (it.str ?? "").trim();
      if (s) lines.push(s);
    }
  }
  return lines;
}

const isLabel = (s: string, label: string) =>
  s.replace(/[^A-Z& ]/g, "").trim().toUpperCase() === label.toUpperCase();

/** Find the value that immediately PRECEDES a given label line. Walks back
 * over blank/junk lines until it finds plausible content. */
function valueBefore(
  lines: string[],
  labelMatcher: (s: string) => boolean,
  opts: { numeric?: boolean; maxBack?: number; allow?: RegExp } = {},
): string {
  const { numeric = false, maxBack = 6, allow } = opts;
  for (let i = 0; i < lines.length; i++) {
    if (!labelMatcher(lines[i])) continue;
    for (let j = i - 1, steps = 0; j >= 0 && steps < maxBack; j--, steps++) {
      const v = lines[j].trim();
      if (!v) continue;
      if (numeric) {
        const m = v.match(/^[+-]?\d{1,3}$/);
        if (m) return v;
        continue;
      }
      if (allow && !allow.test(v)) continue;
      // skip pure punctuation / single bullet chars
      if (/^[•·\-—|]+$/.test(v)) continue;
      return v;
    }
  }
  return "";
}

/** Find the value that immediately FOLLOWS a given label line. */
function valueAfter(
  lines: string[],
  labelMatcher: (s: string) => boolean,
  opts: { numeric?: boolean; maxFwd?: number; allow?: RegExp } = {},
): string {
  const { numeric = false, maxFwd = 6, allow } = opts;
  for (let i = 0; i < lines.length; i++) {
    if (!labelMatcher(lines[i])) continue;
    for (let j = i + 1, steps = 0; j < lines.length && steps < maxFwd; j++, steps++) {
      const v = lines[j].trim();
      if (!v) continue;
      if (numeric) {
        const m = v.match(/^[+-]?\d{1,3}$/);
        if (m) return v;
        continue;
      }
      if (allow && !allow.test(v)) continue;
      if (/^[•·\-—|]+$/.test(v)) continue;
      return v;
    }
  }
  return "";
}

const eq = (label: string) => (s: string) => isLabel(s, label);

function parseSheet(lines: string[]): Partial<CharacterSheet> {
  const out: Partial<CharacterSheet> = {};
  const flat = lines.join(" ");

  // ---- Header fields (value appears just BEFORE the ALL-CAPS label) ----
  const name = valueBefore(lines, eq("CHARACTER NAME"), { allow: /[A-Za-z]/ });
  if (name) out.name = name;

  const cls = valueBefore(lines, eq("CLASS & LEVEL"), { allow: /[A-Za-z]/ })
    || valueBefore(lines, (s) => /^CLASS\s*(&|AND)?\s*LEVEL$/i.test(s.trim()), { allow: /[A-Za-z]/ });
  if (cls) out.classLevel = cls;

  const race = valueBefore(lines, eq("SPECIES"), { allow: /[A-Za-z]/ })
    || valueBefore(lines, eq("RACE"), { allow: /[A-Za-z]/ });
  if (race) out.race = race;

  const bg = valueBefore(lines, eq("BACKGROUND"), { allow: /[A-Za-z]/ });
  if (bg) out.background = bg;

  const align = valueBefore(lines, eq("ALIGNMENT"), { allow: /[A-Za-z]/ });
  if (align) out.alignment = align;

  const player = valueBefore(lines, eq("PLAYER NAME"), { allow: /[A-Za-z0-9]/ });
  if (player) out.playerName = player;

  const xp = valueBefore(lines, (s) => /^EXPERIENCE\s*POINTS?$/i.test(s.trim()), {
    allow: /[\d(]/,
  });
  if (xp) out.experience = xp;

  // ---- Ability scores (number appears between the ability name header and the next block) ----
  const abilities: { key: keyof CharacterSheet; label: string }[] = [
    { key: "str", label: "STRENGTH" },
    { key: "dex", label: "DEXTERITY" },
    { key: "con", label: "CONSTITUTION" },
    { key: "int", label: "INTELLIGENCE" },
    { key: "wis", label: "WISDOM" },
    { key: "cha", label: "CHARISMA" },
  ];
  for (const { key, label } of abilities) {
    const v = valueAfter(lines, eq(label), { numeric: true, maxFwd: 8 });
    if (v) (out as any)[key] = v;
  }

  // ---- Combat stats ----
  // AC: D&D Beyond shows the number above "ARMOR" then "CLASS" on next line.
  const ac =
    valueBefore(lines, eq("ARMOR CLASS"), { numeric: true }) ||
    valueBefore(lines, eq("ARMOR"), { numeric: true }) ||
    (flat.match(/Armou?r\s*Class[^0-9]{0,10}(\d{1,2})/i)?.[1] ?? "");
  if (ac) out.ac = ac;

  const init = valueBefore(lines, eq("INITIATIVE"), { allow: /^[+-]?\d/ });
  if (init) out.initiative = /^[+-]/.test(init) ? init : `+${init}`;

  const speed = valueBefore(lines, eq("SPEED"), { allow: /\d/ });
  if (speed) out.speed = speed;

  // HP — values appear in the order Max / Current / Temp under those headers.
  const findAfterAll = (label: string) => {
    const idx = lines.findIndex(eq(label));
    return idx === -1 ? -1 : idx;
  };
  const maxIdx = findAfterAll("MAX HP");
  const curIdx = findAfterAll("CURRENT HP");
  const tmpIdx = findAfterAll("TEMP HP");
  // Values typically appear AFTER all three header labels in a row.
  const headerEnd = Math.max(maxIdx, curIdx, tmpIdx);
  if (headerEnd > -1) {
    const numsAfter: { idx: number; v: string }[] = [];
    for (let i = headerEnd + 1; i < lines.length && numsAfter.length < 3; i++) {
      const m = lines[i].match(/^(\d{1,3}|--)$/);
      if (m) numsAfter.push({ idx: i, v: m[1] });
    }
    if (numsAfter[0]) out.hpMax = numsAfter[0].v === "--" ? "" : numsAfter[0].v;
    if (numsAfter[1]) out.hpCurrent = numsAfter[1].v === "--" ? "" : numsAfter[1].v;
    if (numsAfter[2]) out.hpTemp = numsAfter[2].v === "--" ? "" : numsAfter[2].v;
    if (out.hpMax && !out.hpCurrent) out.hpCurrent = out.hpMax;
  } else {
    const m = flat.match(/(?:Hit Point Maximum|Max\s*HP)[^0-9]{0,10}(\d{1,3})/i);
    if (m) {
      out.hpMax = m[1];
      out.hpCurrent = m[1];
    }
  }

  const prof = valueAfter(lines, eq("PROFICIENCY BONUS"), { allow: /^[+-]?\d/ })
    || valueBefore(lines, eq("PROFICIENCY BONUS"), { allow: /^[+-]?\d/ });
  if (prof) out.proficiencyBonus = /^[+-]/.test(prof) ? prof : `+${prof}`;

  const hd = valueAfter(lines, eq("HIT DICE"), { allow: /^\d+\s*d\d+/i })
    || valueBefore(lines, eq("HIT DICE"), { allow: /^\d+\s*d\d+/i })
    || (flat.match(/(\d+\s*d\d+)\s*(?:Total|HIT DICE)/i)?.[1] ?? "");
  if (hd) out.hitDice = hd;

  return out;
}

export function PdfImportButton({
  notebookId,
  pageId,
  current,
}: {
  notebookId: string;
  pageId: string;
  current: CharacterSheet;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const updatePage = useApp((s) => s.updatePage);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const lines = await extractLines(file);
      const parsed = parseSheet(lines);
      const filledCount = Object.keys(parsed).length;
      if (filledCount === 0) {
        toast.error("Couldn't recognize fields in that PDF. Try another sheet.");
      } else {
        updatePage(notebookId, pageId, { sheet: { ...current, ...parsed } });
        toast.success(`Imported ${filledCount} field${filledCount > 1 ? "s" : ""} from PDF.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span className="hidden sm:inline">{busy ? "Reading…" : "Import PDF"}</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </>
  );
}
