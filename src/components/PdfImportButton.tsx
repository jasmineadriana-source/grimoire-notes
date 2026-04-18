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

type Item = { text: string; x: number; y: number; w: number; h: number; page: number };

/** Extract every text run with its page-space coordinates.
 * pdf.js: transform = [a, b, c, d, e, f] where (e, f) = origin (lower-left).
 * We convert to top-down y so "above" / "below" reasoning is intuitive. */
async function extractItems(file: File): Promise<Item[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const items: Item[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    for (const it of content.items as any[]) {
      const text = (it.str ?? "").trim();
      if (!text) continue;
      const tr = it.transform as number[]; // [a,b,c,d,e,f]
      const x = tr[4];
      const yBottom = tr[5];
      const h = it.height ?? Math.abs(tr[3]) ?? 10;
      const w = it.width ?? text.length * 5;
      items.push({ text, x, y: viewport.height - yBottom, w, h, page: p });
    }
  }
  return items;
}

/** Group adjacent items on the same line (same page, similar y, close x)
 * into a single Item. */
function mergeLines(items: Item[]): Item[] {
  const sorted = [...items].sort(
    (a, b) => a.page - b.page || a.y - b.y || a.x - b.x,
  );
  const merged: Item[] = [];
  for (const it of sorted) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.page === it.page &&
      Math.abs(last.y - it.y) < 3 &&
      it.x - (last.x + last.w) < 6
    ) {
      last.text += " " + it.text;
      last.w = it.x + it.w - last.x;
    } else {
      merged.push({ ...it });
    }
  }
  return merged;
}

/** Find every item whose merged text matches `label` (case-insensitive,
 * ignoring punctuation/ampersand differences). */
function findLabels(items: Item[], label: string): Item[] {
  const norm = (s: string) =>
    s.replace(/[^A-Za-z& ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  const want = norm(label);
  return items.filter((it) => norm(it.text) === want);
}

/** Find the value for a label by looking for the nearest item directly
 * `above` or `below` the label on the same page, within a column of width
 * `xTol` and a vertical band of `yMax`. */
function nearestValue(
  items: Item[],
  label: Item,
  opts: {
    direction: "above" | "below";
    xTol?: number;
    yMax?: number;
    filter?: (text: string) => boolean;
  },
): Item | null {
  const { direction, xTol = 60, yMax = 35, filter } = opts;
  const labelCx = label.x + label.w / 2;
  let best: Item | null = null;
  let bestDy = Infinity;
  for (const it of items) {
    if (it === label || it.page !== label.page) continue;
    const dy = direction === "above" ? label.y - it.y : it.y - label.y;
    if (dy <= 0 || dy > yMax) continue;
    const itCx = it.x + it.w / 2;
    if (Math.abs(itCx - labelCx) > xTol) continue;
    if (filter && !filter(it.text)) continue;
    if (dy < bestDy) {
      bestDy = dy;
      best = it;
    }
  }
  return best;
}

const isNumeric = (s: string) => /^-?\d{1,3}$/.test(s.trim());
const isSignedNum = (s: string) => /^[+-]?\d{1,3}$/.test(s.trim());
const hasLetters = (s: string) => /[A-Za-z]/.test(s) && s.length < 60;

function parseSheet(items: Item[]): Partial<CharacterSheet> {
  const lines = mergeLines(items);
  const out: Partial<CharacterSheet> = {};

  const above = (labelText: string, filter?: (s: string) => boolean, yMax = 35, xTol = 80) => {
    for (const lbl of findLabels(lines, labelText)) {
      const v = nearestValue(lines, lbl, { direction: "above", filter, yMax, xTol });
      if (v) return v.text.trim();
    }
    return "";
  };
  const below = (labelText: string, filter?: (s: string) => boolean, yMax = 40, xTol = 80) => {
    for (const lbl of findLabels(lines, labelText)) {
      const v = nearestValue(lines, lbl, { direction: "below", filter, yMax, xTol });
      if (v) return v.text.trim();
    }
    return "";
  };

  // ---- Header (value sits just above the ALL-CAPS label) ----
  const name = above("CHARACTER NAME", hasLetters);
  if (name) out.name = name;

  const cls = above("CLASS & LEVEL", hasLetters) || above("CLASS LEVEL", hasLetters);
  if (cls) out.classLevel = cls;

  const race = above("SPECIES", hasLetters) || above("RACE", hasLetters);
  if (race) out.race = race;

  const bg = above("BACKGROUND", hasLetters);
  if (bg) out.background = bg;

  const align = above("ALIGNMENT", hasLetters);
  if (align) out.alignment = align;

  const player = above("PLAYER NAME", (s) => /[A-Za-z0-9]/.test(s) && s.length < 60);
  if (player) out.playerName = player;

  const xp = above("EXPERIENCE POINTS", (s) => /[\d(]/.test(s)) || above("EXPERIENCE", (s) => /[\d(]/.test(s));
  if (xp) out.experience = xp;

  // ---- Ability scores: big number sits BELOW the ability label ----
  const abilities: { key: keyof CharacterSheet; label: string }[] = [
    { key: "str", label: "STRENGTH" },
    { key: "dex", label: "DEXTERITY" },
    { key: "con", label: "CONSTITUTION" },
    { key: "int", label: "INTELLIGENCE" },
    { key: "wis", label: "WISDOM" },
    { key: "cha", label: "CHARISMA" },
  ];
  for (const { key, label } of abilities) {
    // Bigger search box because the score sits ~15-50pt below.
    const v = below(label, isNumeric, 60, 40);
    if (v) (out as any)[key] = v;
  }

  // ---- Combat stats ----
  const ac = above("ARMOR CLASS", isNumeric, 40, 60) || above("ARMOR", isNumeric, 40, 60);
  if (ac) out.ac = ac;

  const init = above("INITIATIVE", isSignedNum, 40, 60);
  if (init) out.initiative = /^[+-]/.test(init) ? init : `+${init}`;

  const speed = above("SPEED", (s) => /\d/.test(s), 50, 80);
  if (speed) out.speed = speed;

  // HP — three numbers under three side-by-side headers.
  const maxHp = below("MAX HP", isNumeric, 50, 50);
  const curHp = below("CURRENT HP", isNumeric, 50, 50);
  const tmpHp = below("TEMP HP", (s) => /^(\d{1,3}|--)$/.test(s), 50, 50);
  if (maxHp) out.hpMax = maxHp;
  if (curHp && curHp !== "--") out.hpCurrent = curHp;
  else if (maxHp) out.hpCurrent = maxHp;
  if (tmpHp && tmpHp !== "--") out.hpTemp = tmpHp;

  const prof = above("PROFICIENCY BONUS", isSignedNum, 40, 60)
    || below("PROFICIENCY BONUS", isSignedNum, 40, 60);
  if (prof) out.proficiencyBonus = /^[+-]/.test(prof) ? prof : `+${prof}`;

  const hd = above("HIT DICE", (s) => /^\d+\s*d\d+/i.test(s), 50, 80)
    || below("HIT DICE", (s) => /^\d+\s*d\d+/i.test(s), 50, 80);
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
      const items = await extractItems(file);
      const parsed = parseSheet(items);
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
