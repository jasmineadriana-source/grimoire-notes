export type BuiltInThemeKey =
  | "parchment"
  | "arcane"
  | "druid"
  | "dragon"
  | "ivory"
  | "sand"
  | "slate"
  | "midnight"
  | "pink"
  | "purple"
  | "blue";

/** Theme key — built-in or any custom theme id (e.g. "custom-abc123"). */
export type ThemeKey = BuiltInThemeKey | string;

export const BUILTIN_THEME_KEYS: BuiltInThemeKey[] = [
  "parchment", "arcane", "druid", "dragon",
  "ivory", "sand", "slate", "midnight",
  "pink", "purple", "blue",
];

export const isBuiltInTheme = (k: string): k is BuiltInThemeKey =>
  (BUILTIN_THEME_KEYS as string[]).includes(k);

/* ============================================================
   Dice styles — visual skin for the dice roller.
   "white" is free; the rest are Premium-only.
============================================================ */

export type DieStyleKey =
  | "white"
  | "obsidian"
  | "ruby"
  | "emerald"
  | "sapphire"
  | "gold"
  | "arcane";

export type DieStyle = {
  key: DieStyleKey;
  name: string;
  tagline: string;
  premium: boolean;
  /** CSS background for the die face. */
  background: string;
  /** Text/glyph color. */
  fg: string;
  /** Optional glow color. */
  glow?: string;
};

export const DIE_STYLES: DieStyle[] = [
  {
    key: "white", name: "Bone White", tagline: "The classic adventurer's set",
    premium: false,
    background: "linear-gradient(135deg, hsl(40 30% 96%), hsl(35 30% 88%))",
    fg: "hsl(25 40% 18%)",
  },
  {
    key: "obsidian", name: "Obsidian", tagline: "Volcanic glass with silver edges",
    premium: true,
    background: "linear-gradient(135deg, hsl(225 25% 10%), hsl(220 18% 22%))",
    fg: "hsl(40 30% 96%)",
    glow: "hsl(220 30% 50% / 0.5)",
  },
  {
    key: "ruby", name: "Ruby", tagline: "Blood-red, cut for war",
    premium: true,
    background: "linear-gradient(135deg, hsl(350 70% 25%), hsl(0 80% 50%))",
    fg: "hsl(38 60% 95%)",
    glow: "hsl(350 80% 55% / 0.6)",
  },
  {
    key: "emerald", name: "Emerald", tagline: "Wild green of the deep wood",
    premium: true,
    background: "linear-gradient(135deg, hsl(150 60% 18%), hsl(140 65% 42%))",
    fg: "hsl(60 50% 96%)",
    glow: "hsl(140 80% 50% / 0.55)",
  },
  {
    key: "sapphire", name: "Sapphire", tagline: "Cold star-blue",
    premium: true,
    background: "linear-gradient(135deg, hsl(220 65% 22%), hsl(210 85% 55%))",
    fg: "hsl(200 60% 96%)",
    glow: "hsl(210 90% 60% / 0.6)",
  },
  {
    key: "gold", name: "Royal Gold", tagline: "For the dragon's hoard",
    premium: true,
    background: "linear-gradient(135deg, hsl(35 70% 38%), hsl(45 95% 60%))",
    fg: "hsl(25 50% 12%)",
    glow: "hsl(45 95% 60% / 0.65)",
  },
  {
    key: "arcane", name: "Arcane", tagline: "Glyph-etched, faintly humming",
    premium: true,
    background: "linear-gradient(135deg, hsl(265 55% 25%), hsl(280 90% 65%))",
    fg: "hsl(60 80% 96%)",
    glow: "hsl(280 90% 70% / 0.7)",
  },
];

export const isPremiumDieStyle = (k: DieStyleKey): boolean =>
  DIE_STYLES.find((s) => s.key === k)?.premium ?? false;

export const THEMES: { key: BuiltInThemeKey; name: string; tagline: string }[] = [
  { key: "parchment", name: "Classic Parchment", tagline: "Aged paper & burgundy ink" },
  { key: "arcane", name: "Dark Arcane", tagline: "Obsidian & glowing runes" },
  { key: "druid", name: "Forest Druid", tagline: "Moss, wood & leaf" },
  { key: "dragon", name: "Dragon Fire", tagline: "Black leather & ember" },
  { key: "ivory", name: "Ivory (Solid)", tagline: "Clean off-white, no texture" },
  { key: "sand", name: "Sand (Solid)", tagline: "Warm beige, no texture" },
  { key: "slate", name: "Slate (Solid)", tagline: "Cool gray, no texture" },
  { key: "midnight", name: "Midnight (Solid)", tagline: "Deep dark, no texture" },
  { key: "pink", name: "Pink (Solid)", tagline: "Soft rose blush" },
  { key: "purple", name: "Purple (Solid)", tagline: "Lavender twilight" },
  { key: "blue", name: "Blue (Solid)", tagline: "Calm sky blue" },
];

/** A user-defined theme. Colors are HSL component strings like "210 50% 94%". */
export type CustomTheme = {
  id: string;          // "custom-xxxx"
  name: string;
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    primary: string;
    accent: string;
    foreground: string;
  };
  appBgImage?: string; // data URL — fills app background
  pageBgImage?: string; // data URL — fills notebook page surface
};

export type CharacterSheet = {
  name: string;
  classLevel: string;
  race: string;
  background: string;
  alignment: string;
  playerName: string;
  experience: string;
  // Stats
  str: string; dex: string; con: string; int: string; wis: string; cha: string;
  // Combat
  ac: string; initiative: string; speed: string;
  hpMax: string; hpCurrent: string; hpTemp: string;
  hitDice: string;
  // Other
  proficiencyBonus: string;
  inspiration: string;
  features: string;
  equipment: string;
  spells: string;
  notes: string;
  // Rest tracker — Unix ms timestamps of the last short / long rest taken.
  lastShortRest?: number;
  lastLongRest?: number;
};

export const blankSheet = (name = "New Adventurer"): CharacterSheet => ({
  name,
  classLevel: "",
  race: "",
  background: "",
  alignment: "",
  playerName: "",
  experience: "",
  str: "10", dex: "10", con: "10", int: "10", wis: "10", cha: "10",
  ac: "10", initiative: "+0", speed: "30 ft",
  hpMax: "", hpCurrent: "", hpTemp: "",
  hitDice: "",
  proficiencyBonus: "+2",
  inspiration: "",
  features: "",
  equipment: "",
  spells: "",
  notes: "",
});

export type PageKind = "character" | "blank" | "lined" | "graph" | "weapons" | "spells";

export const PAPER_KINDS: { kind: PageKind; label: string }[] = [
  { kind: "character", label: "Character Sheet" },
  { kind: "weapons", label: "Weapons" },
  { kind: "spells", label: "Spellbook" },
  { kind: "blank", label: "Blank Page" },
  { kind: "lined", label: "College-Ruled Paper" },
  { kind: "graph", label: "Graph Paper" },
];

/** A single weapon row on a Weapons page. */
export type WeaponEntry = {
  id: string;
  name: string;
  attack: string;       // e.g. "+5"
  damage: string;       // e.g. "1d8+3 slashing"
  notes: string;
};

/** A single spell row on a Spells page. */
export type SpellEntry = {
  id: string;
  name: string;
  level: number;        // 0 = cantrip, 1-9 = spell levels
  prepared: boolean;
  castingTime: string;
  range: string;
  components: string;   // V, S, M (...)
  duration: string;
  description: string;
};

/** Per-level slot tracking. Index 0 unused (cantrips have no slots). */
export type SpellSlot = { used: number; total: number };

export type SpellbookMeta = {
  saveDc: string;
  attackBonus: string;
  ability: string;       // e.g. "WIS"
  slots: SpellSlot[];    // length 10 — index 0 ignored
};

export type Tool = "pen" | "pencil" | "highlighter" | "eraser";

export type Stroke = {
  id: string;
  tool: Tool;
  color: string;     // hex
  size: number;      // px
  points: { x: number; y: number; p: number }[]; // normalized 0-1 coords + pressure
};

export type PageImage = {
  id: string;
  src: string;       // data URL
  x: number;         // 0-1
  y: number;         // 0-1
  w: number;         // 0-1
};

/** A washi-tape strip placed on a page. Coordinates are normalized 0-1
 * relative to the page surface. The strip is rendered as a thin
 * rotated rectangle (tape look). */
export type WashiStrip = {
  id: string;
  /** Visual style identifier — built-in pattern key (e.g. "stripes-rose")
   * or "custom:<id>" referring to a saved custom tape. */
  styleId: string;
  /** Center point on page (0-1). */
  cx: number;
  cy: number;
  /** Length and thickness as fraction of page width. */
  length: number;
  thickness: number;
  /** Rotation in degrees. */
  rotation: number;
};

/** A user-uploaded custom washi tape design. */
export type CustomWashi = {
  id: string;
  name: string;
  src: string;       // data URL
  fit: "tile" | "stretch";
};

export type NotebookPage = {
  id: string;
  kind: PageKind;
  title: string;
  pinned?: boolean;
  // character
  sheet?: CharacterSheet;
  // blank/lined/graph
  text?: string;
  // weapons
  weapons?: WeaponEntry[];
  // spells
  spells?: SpellEntry[];
  spellbook?: SpellbookMeta;
  // shared annotations
  strokes?: Stroke[];
  images?: PageImage[];
  washi?: WashiStrip[];
};

export const blankSpellbookMeta = (): SpellbookMeta => ({
  saveDc: "",
  attackBonus: "",
  ability: "",
  slots: Array.from({ length: 10 }, () => ({ used: 0, total: 0 })),
});

export type Notebook = {
  id: string;
  name: string;
  theme: ThemeKey;
  pages: NotebookPage[];
  createdAt: number;
};

export type DieKind = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
export const DICE: DieKind[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
export const DIE_SIDES: Record<DieKind, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

export type RollResult = {
  id: string;
  label: string;
  die: DieKind;
  count: number;
  modifier: number;
  rolls: number[];
  total: number;
  at: number;
};

export type RollPreset = {
  id: string;
  label: string;
  die: DieKind;
  count: number;
  modifier: number;
};
