import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  blankSheet,
  CustomTheme,
  CustomWashi,
  Notebook,
  NotebookPage,
  PageKind,
  RollPreset,
  RollResult,
  ThemeKey,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

type AppState = {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;

  notebooks: Notebook[];
  activeNotebookId: string | null;
  activePageId: string | null;

  setActiveNotebook: (id: string | null) => void;
  setActivePage: (id: string | null) => void;

  createNotebook: (name: string, theme: ThemeKey) => string;
  renameNotebook: (id: string, name: string) => void;
  setNotebookTheme: (id: string, theme: ThemeKey) => void;
  deleteNotebook: (id: string) => void;

  addPage: (notebookId: string, kind: PageKind) => string;
  updatePage: (notebookId: string, pageId: string, patch: Partial<NotebookPage>) => void;
  deletePage: (notebookId: string, pageId: string) => void;

  rollHistory: RollResult[];
  presets: RollPreset[];
  pushRoll: (r: RollResult) => void;
  clearHistory: () => void;
  addPreset: (p: Omit<RollPreset, "id">) => void;
  removePreset: (id: string) => void;

  customWashi: CustomWashi[];
  addCustomWashi: (c: Omit<CustomWashi, "id">) => string;
  removeCustomWashi: (id: string) => void;

  customThemes: CustomTheme[];
  addCustomTheme: (t: Omit<CustomTheme, "id">) => string;
  updateCustomTheme: (id: string, patch: Partial<Omit<CustomTheme, "id">>) => void;
  deleteCustomTheme: (id: string) => void;
};

const seedNotebook = (): Notebook => ({
  id: uid(),
  name: "My First Grimoire",
  theme: "parchment",
  createdAt: Date.now(),
  pages: [
    {
      id: uid(),
      kind: "character",
      title: "Adventurer",
      sheet: blankSheet("Thalia Moonwhisper"),
    },
  ],
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "parchment",
      setTheme: (theme) => set({ theme }),

      notebooks: [seedNotebook()],
      activeNotebookId: null,
      activePageId: null,

      setActiveNotebook: (id) => {
        const nb = get().notebooks.find((n) => n.id === id);
        set({
          activeNotebookId: id,
          activePageId: nb?.pages[0]?.id ?? null,
          theme: nb?.theme ?? get().theme,
        });
      },
      setActivePage: (id) => set({ activePageId: id }),

      createNotebook: (name, theme) => {
        const nb: Notebook = {
          id: uid(),
          name,
          theme,
          createdAt: Date.now(),
          pages: [
            { id: uid(), kind: "character", title: "Adventurer", sheet: blankSheet(name) },
          ],
        };
        set({ notebooks: [...get().notebooks, nb] });
        return nb.id;
      },
      renameNotebook: (id, name) =>
        set({ notebooks: get().notebooks.map((n) => (n.id === id ? { ...n, name } : n)) }),
      setNotebookTheme: (id, theme) => {
        set({ notebooks: get().notebooks.map((n) => (n.id === id ? { ...n, theme } : n)) });
        if (get().activeNotebookId === id) set({ theme });
      },
      deleteNotebook: (id) => {
        const remaining = get().notebooks.filter((n) => n.id !== id);
        set({
          notebooks: remaining,
          activeNotebookId: get().activeNotebookId === id ? null : get().activeNotebookId,
          activePageId: get().activeNotebookId === id ? null : get().activePageId,
        });
      },

      addPage: (notebookId, kind) => {
        const id = uid();
        const titleByKind: Record<string, string> = {
          character: "New Character",
          blank: "Notes",
          lined: "College-Ruled",
          graph: "Graph Paper",
        };
        const newPage: NotebookPage =
          kind === "character"
            ? { id, kind, title: titleByKind[kind], sheet: blankSheet("New Adventurer"), strokes: [], images: [] }
            : { id, kind, title: titleByKind[kind] ?? "Page", text: "", strokes: [], images: [] };
        set({
          notebooks: get().notebooks.map((n) =>
            n.id === notebookId ? { ...n, pages: [...n.pages, newPage] } : n,
          ),
          activePageId: id,
        });
        return id;
      },
      updatePage: (notebookId, pageId, patch) =>
        set({
          notebooks: get().notebooks.map((n) =>
            n.id === notebookId
              ? { ...n, pages: n.pages.map((p) => (p.id === pageId ? { ...p, ...patch } as NotebookPage : p)) }
              : n,
          ),
        }),
      deletePage: (notebookId, pageId) =>
        set((s) => {
          const notebooks = s.notebooks.map((n) =>
            n.id === notebookId ? { ...n, pages: n.pages.filter((p) => p.id !== pageId) } : n,
          );
          const nb = notebooks.find((n) => n.id === notebookId);
          const newActive =
            s.activePageId === pageId ? (nb?.pages[0]?.id ?? null) : s.activePageId;
          return { notebooks, activePageId: newActive };
        }),

      rollHistory: [],
      presets: [
        { id: uid(), label: "Attack Roll", die: "d20", count: 1, modifier: 5 },
        { id: uid(), label: "Fireball", die: "d6", count: 8, modifier: 0 },
      ],
      pushRoll: (r) => set({ rollHistory: [r, ...get().rollHistory].slice(0, 50) }),
      clearHistory: () => set({ rollHistory: [] }),
      addPreset: (p) => set({ presets: [{ id: uid(), ...p }, ...get().presets] }),
      removePreset: (id) => set({ presets: get().presets.filter((x) => x.id !== id) }),

      customWashi: [],
      addCustomWashi: (c) => {
        const id = uid();
        set({ customWashi: [{ id, ...c }, ...get().customWashi] });
        return id;
      },
      removeCustomWashi: (id) =>
        set({ customWashi: get().customWashi.filter((x) => x.id !== id) }),
    }),
    {
      name: "grimoire-v1",
      partialize: (s) => ({
        theme: s.theme,
        notebooks: s.notebooks,
        presets: s.presets,
        rollHistory: s.rollHistory,
        customWashi: s.customWashi,
      }),
    },
  ),
);
