export type ThemeKey =
  | "parchment"
  | "arcane"
  | "druid"
  | "dragon"
  | "ivory"
  | "sand"
  | "slate"
  | "midnight";

export const THEMES: { key: ThemeKey; name: string; tagline: string }[] = [
  { key: "parchment", name: "Classic Parchment", tagline: "Aged paper & burgundy ink" },
  { key: "arcane", name: "Dark Arcane", tagline: "Obsidian & glowing runes" },
  { key: "druid", name: "Forest Druid", tagline: "Moss, wood & leaf" },
  { key: "dragon", name: "Dragon Fire", tagline: "Black leather & ember" },
  { key: "ivory", name: "Ivory (Solid)", tagline: "Clean off-white, no texture" },
  { key: "sand", name: "Sand (Solid)", tagline: "Warm beige, no texture" },
  { key: "slate", name: "Slate (Solid)", tagline: "Cool gray, no texture" },
  { key: "midnight", name: "Midnight (Solid)", tagline: "Deep dark, no texture" },
];

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

export type PageKind = "character" | "blank" | "lined" | "graph";

export const PAPER_KINDS: { kind: PageKind; label: string }[] = [
  { kind: "character", label: "Character Sheet" },
  { kind: "blank", label: "Blank Page" },
  { kind: "lined", label: "College-Ruled Paper" },
  { kind: "graph", label: "Graph Paper" },
];

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

export type NotebookPage = {
  id: string;
  kind: PageKind;
  title: string;
  pinned?: boolean;
  // character
  sheet?: CharacterSheet;
  // blank/lined/graph
  text?: string;
  // shared annotations
  strokes?: Stroke[];
  images?: PageImage[];
};

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
