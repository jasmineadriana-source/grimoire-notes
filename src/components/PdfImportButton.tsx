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

async function extractText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return text;
}

const grab = (re: RegExp, text: string) => {
  const m = text.match(re);
  return m?.[1]?.trim() ?? "";
};

function parseSheet(text: string): Partial<CharacterSheet> {
  const t = text.replace(/\s+/g, " ");
  const out: Partial<CharacterSheet> = {};

  const name = grab(/Character\s*Name[:\s]+([A-Z][\w' -]{2,40})/i, t);
  if (name) out.name = name;

  const cls = grab(/Class\s*&?\s*Level[:\s]+([\w ,/]+?)(?:\s+(?:Background|Race|Player|Alignment|Experience))/i, t)
    || grab(/(?:Class|Level)[:\s]+([\w ,/]{2,40})/i, t);
  if (cls) out.classLevel = cls;

  const race = grab(/Race[:\s]+([\w '-]{2,30})/i, t);
  if (race) out.race = race;
  const bg = grab(/Background[:\s]+([\w '-]{2,40})/i, t);
  if (bg) out.background = bg;
  const align = grab(/Alignment[:\s]+([\w '-]{2,30})/i, t);
  if (align) out.alignment = align;
  const player = grab(/Player\s*Name[:\s]+([\w' -]{2,40})/i, t);
  if (player) out.playerName = player;
  const xp = grab(/(?:Experience\s*Points?|XP)[:\s]+([\d,]+)/i, t);
  if (xp) out.experience = xp;

  // Stats — try labeled forms first
  const statPairs: [keyof CharacterSheet, RegExp[]][] = [
    ["str", [/Strength[^0-9]{0,15}(\d{1,2})/i, /\bSTR[^0-9]{0,15}(\d{1,2})/i]],
    ["dex", [/Dexterity[^0-9]{0,15}(\d{1,2})/i, /\bDEX[^0-9]{0,15}(\d{1,2})/i]],
    ["con", [/Constitution[^0-9]{0,15}(\d{1,2})/i, /\bCON[^0-9]{0,15}(\d{1,2})/i]],
    ["int", [/Intelligence[^0-9]{0,15}(\d{1,2})/i, /\bINT[^0-9]{0,15}(\d{1,2})/i]],
    ["wis", [/Wisdom[^0-9]{0,15}(\d{1,2})/i, /\bWIS[^0-9]{0,15}(\d{1,2})/i]],
    ["cha", [/Charisma[^0-9]{0,15}(\d{1,2})/i, /\bCHA[^0-9]{0,15}(\d{1,2})/i]],
  ];
  for (const [k, regs] of statPairs) {
    for (const r of regs) {
      const v = grab(r, t);
      if (v) {
        (out as any)[k] = v;
        break;
      }
    }
  }

  const ac = grab(/Armou?r\s*Class[:\s]+(\d{1,2})/i, t) || grab(/\bAC[:\s]+(\d{1,2})/i, t);
  if (ac) out.ac = ac;
  const init = grab(/Initiative[:\s]+([+-]?\d{1,2})/i, t);
  if (init) out.initiative = init.startsWith("+") || init.startsWith("-") ? init : `+${init}`;
  const speed = grab(/Speed[:\s]+(\d{1,3}\s*(?:ft\.?|feet)?)/i, t);
  if (speed) out.speed = speed;
  const hpMax = grab(/(?:Hit Point Maximum|Max\s*HP)[:\s]+(\d{1,3})/i, t)
    || grab(/Hit\s*Points?[:\s]+(\d{1,3})/i, t);
  if (hpMax) {
    out.hpMax = hpMax;
    if (!out.hpCurrent) out.hpCurrent = hpMax;
  }
  const prof = grab(/Proficiency\s*Bonus[:\s]+([+-]?\d{1,2})/i, t);
  if (prof) out.proficiencyBonus = prof.startsWith("+") || prof.startsWith("-") ? prof : `+${prof}`;
  const hd = grab(/Hit\s*Dice[:\s]+([\dd /+-]{2,15})/i, t);
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
      const text = await extractText(file);
      const parsed = parseSheet(text);
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
