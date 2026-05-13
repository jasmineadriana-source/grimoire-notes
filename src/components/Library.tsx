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
import { ThemeSwitcher, swatchForTheme } from "./ThemeSwitcher";
import { DiceRoller } from "./DiceRoller";
import { Book, Crown, Dices, Lock, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "./UpgradeModal";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

export function Library() {
  const customThemes = useApp((s) => s.customThemes);
  const notebooks = useApp((s) => s.notebooks);
  const setActiveNotebook = useApp((s) => s.setActiveNotebook);
  const createNotebook = useApp((s) => s.createNotebook);
  const deleteNotebook = useApp((s) => s.deleteNotebook);
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const [creating, setCreating] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [name, setName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [theme, setTheme] = useState<ThemeKey>("parchment");

  const notebookLimitReached = !isPremium && notebooks.length >= 1;

  const onCreate = () => {
    if (notebookLimitReached) {
      setCreating(false);
      setUpgradeOpen(true);
      return;
    }
    const trimmed = name.trim() || "Untitled Grimoire";
    const id = createNotebook(trimmed, theme, characterName.trim() || undefined);
    setActiveNotebook(id);
    setCreating(false);
    setName("");
    setCharacterName("");
    toast.success(`"${trimmed}" forged.`);
  };

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <header
        className="flex items-center gap-2 px-4 sm:px-8 py-4 border-b border-border bg-card/60 backdrop-blur-sm"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
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
        {!isPremium && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 font-display border-accent/60 text-accent hover:bg-accent/10"
            onClick={() => setUpgradeOpen(true)}
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </Button>
        )}
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
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 font-display"
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
          }}
          title={user?.email ? `Sign out (${user.email})` : "Sign out"}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
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
          <Dialog
            open={creating}
            onOpenChange={(o) => {
              if (o && notebookLimitReached) {
                setUpgradeOpen(true);
                return;
              }
              setCreating(o);
            }}
          >
            <DialogTrigger asChild>
              <button
                className={`group relative h-64 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 bg-card/30 hover:bg-card/60 ${
                  notebookLimitReached
                    ? "border-accent/40 hover:border-accent"
                    : "border-border hover:border-accent"
                }`}
              >
                <div className="h-14 w-14 rounded-full bg-gradient-accent flex items-center justify-center accent-glow group-hover:scale-110 transition-transform">
                  {notebookLimitReached ? (
                    <Lock className="h-7 w-7 text-primary-foreground" />
                  ) : (
                    <Plus className="h-7 w-7 text-primary-foreground" />
                  )}
                </div>
                <span className="font-display text-lg flex items-center gap-2">
                  {notebookLimitReached ? "Unlock more notebooks" : "Forge a new notebook"}
                  {notebookLimitReached && <Crown className="h-4 w-4 text-accent" />}
                </span>
                <span className="text-xs text-muted-foreground italic px-4 text-center">
                  {notebookLimitReached
                    ? "Free includes 1 notebook. Premium unlocks unlimited."
                    : "Begin a new tale"}
                </span>
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
                  <Label htmlFor="char-name">
                    Character name <span className="text-muted-foreground italic font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="char-name"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Thalia Moonwhisper"
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
                          style={{ background: swatchForTheme(t.key, customThemes) }}
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
                <Button variant="ghost" onClick={onCreate}>Forge</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {notebooks.map((nb) => (
            <div
              key={nb.id}
              className="group relative h-64 rounded-xl cover-surface overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => setActiveNotebook(nb.id)}
              style={{ background: swatchForTheme(nb.theme, customThemes) }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <span className="text-[10px] uppercase tracking-widest font-display text-white/80 bg-black/30 backdrop-blur-sm rounded px-2 py-0.5">
                  {THEMES.find((t) => t.key === nb.theme)?.name ?? customThemes.find((t) => t.id === nb.theme)?.name ?? "Custom"}
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
