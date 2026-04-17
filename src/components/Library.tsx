import { useState } from "react";
import { useApp } from "@/lib/store";
import { ThemeKey, THEMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DiceRoller } from "./DiceRoller";
import { Book, Dices, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const swatchFor: Record<ThemeKey, string> = {
  parchment: "linear-gradient(135deg, hsl(38 55% 80%), hsl(42 75% 50%), hsl(350 55% 32%))",
  arcane: "linear-gradient(135deg, hsl(245 40% 14%), hsl(270 80% 60%), hsl(195 85% 55%))",
  druid: "linear-gradient(135deg, hsl(100 30% 18%), hsl(110 50% 45%), hsl(35 55% 50%))",
  dragon: "linear-gradient(135deg, hsl(15 20% 12%), hsl(18 95% 55%), hsl(45 95% 55%))",
};

export function Library() {
  const notebooks = useApp((s) => s.notebooks);
  const setActiveNotebook = useApp((s) => s.setActiveNotebook);
  const createNotebook = useApp((s) => s.createNotebook);
  const deleteNotebook = useApp((s) => s.deleteNotebook);

  const [creating, setCreating] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeKey>("parchment");

  const onCreate = () => {
    const trimmed = name.trim() || "Untitled Grimoire";
    const id = createNotebook(trimmed, theme);
    setActiveNotebook(id);
    setCreating(false);
    setName("");
    toast.success(`"${trimmed}" forged.`);
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-2 px-4 sm:px-8 py-4 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-accent accent-glow flex items-center justify-center shrink-0">
            <Book className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-decorative text-xl sm:text-2xl text-foreground leading-none truncate">Grimoire</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground italic truncate">Your D&D companion</p>
          </div>
        </div>
        <ThemeSwitcher />
        <Dialog open={diceOpen} onOpenChange={setDiceOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 bg-gradient-accent text-primary-foreground hover:opacity-90 font-display">
              <Dices className="h-4 w-4" /><span className="hidden sm:inline">Dice</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-0 border-none bg-transparent shadow-none">
            <DiceRoller onClose={() => setDiceOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <section className="px-4 sm:px-8 pt-10 sm:pt-16 pb-8 text-center max-w-3xl mx-auto">
        <h2 className="font-decorative text-4xl sm:text-6xl text-foreground mb-3 leading-tight">
          Your Adventurer's Library
        </h2>
        <p className="font-script text-base sm:text-lg text-muted-foreground italic">
          Forge notebooks, scribe character sheets, and let the dice decide your fate.
        </p>
        <div className="ornament-divider my-6 mx-auto max-w-xs" />
      </section>

      <main className="px-4 sm:px-8 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <button className="group relative h-64 rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors flex flex-col items-center justify-center gap-3 bg-card/30 hover:bg-card/60">
                <div className="h-14 w-14 rounded-full bg-gradient-accent flex items-center justify-center accent-glow group-hover:scale-110 transition-transform">
                  <Plus className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="font-display text-lg">Forge a new notebook</span>
                <span className="text-xs text-muted-foreground italic">Begin a new tale</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-decorative text-2xl">Forge a new notebook</DialogTitle>
                <DialogDescription className="font-script italic">
                  Name your tome and choose its binding.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nb-name">Notebook name</Label>
                  <Input
                    id="nb-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="The Chronicles of..."
                    autoFocus
                  />
                </div>
                <div>
                  <Label>Theme</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTheme(t.key)}
                        className={`rounded-lg border-2 p-3 flex items-center gap-2 transition-all text-left ${
                          theme === t.key ? "border-accent accent-glow" : "border-border"
                        }`}
                      >
                        <span
                          className="h-8 w-8 rounded-md shrink-0"
                          style={{ background: swatchFor[t.key] }}
                        />
                        <span className="min-w-0">
                          <span className="block font-display text-sm truncate">{t.name}</span>
                          <span className="block text-[10px] text-muted-foreground italic truncate">
                            {t.tagline}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                <Button onClick={onCreate} className="bg-gradient-accent text-primary-foreground font-display">
                  Forge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {notebooks.map((nb) => (
            <div
              key={nb.id}
              className="group relative h-64 rounded-xl cover-surface overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => setActiveNotebook(nb.id)}
              style={{ background: swatchFor[nb.theme] }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <span className="text-[10px] uppercase tracking-widest font-display text-white/80 bg-black/30 backdrop-blur-sm rounded px-2 py-0.5">
                  {THEMES.find((t) => t.key === nb.theme)?.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${nb.name}"?`)) deleteNotebook(nb.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm rounded p-1.5 text-white/80 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-decorative text-2xl text-white drop-shadow-lg leading-tight mb-1">
                  {nb.name}
                </h3>
                <p className="text-xs text-white/80 italic">
                  {nb.pages.length} page{nb.pages.length !== 1 ? "s" : ""}
                </p>
              </div>
              {/* spine */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/40" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
