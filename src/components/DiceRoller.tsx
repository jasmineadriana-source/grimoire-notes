import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DICE, DIE_SIDES, DieKind, RollResult } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dice1, History, Plus, Star, Trash2, X } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

const dieGlyph: Record<DieKind, string> = {
  d4: "▲", d6: "■", d8: "◆", d10: "◈", d12: "⬟", d20: "⬢", d100: "⊛",
};

function rollOne(sides: number) {
  return 1 + Math.floor(Math.random() * sides);
}

function performRoll(die: DieKind, count: number, modifier: number, label: string): RollResult {
  const sides = DIE_SIDES[die];
  const rolls = Array.from({ length: Math.max(1, count) }, () => rollOne(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return {
    id: uid(),
    label: label || `${count}${die}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
    die,
    count,
    modifier,
    rolls,
    total,
    at: Date.now(),
  };
}

function DieFace({ die, rolling, value }: { die: DieKind; rolling: boolean; value?: number }) {
  return (
    <div className="relative h-28 w-28 flex items-center justify-center">
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-accent accent-glow transition-all ${
          rolling ? "animate-dice-roll" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      />
      <div className="relative flex flex-col items-center justify-center text-primary-foreground">
        <span className="text-5xl leading-none drop-shadow">{dieGlyph[die]}</span>
        <span className="font-display text-xs mt-1 tracking-widest">{die.toUpperCase()}</span>
      </div>
      {value !== undefined && !rolling && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-card border-2 border-accent flex items-center justify-center font-display text-lg shadow-page"
        >
          {value}
        </motion.div>
      )}
    </div>
  );
}

export function DiceRoller({ onClose }: { onClose?: () => void }) {
  const presets = useApp((s) => s.presets);
  const addPreset = useApp((s) => s.addPreset);
  const removePreset = useApp((s) => s.removePreset);
  const history = useApp((s) => s.rollHistory);
  const clearHistory = useApp((s) => s.clearHistory);
  const pushRoll = useApp((s) => s.pushRoll);

  const [die, setDie] = useState<DieKind>("d20");
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [label, setLabel] = useState("");
  const [last, setLast] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);

  const doRoll = (d = die, c = count, m = modifier, l = label) => {
    setRolling(true);
    setLast(null);
    setTimeout(() => {
      const result = performRoll(d, c, m, l);
      setLast(result);
      pushRoll(result);
      setRolling(false);
    }, 1100);
  };

  const rollPreset = (p: typeof presets[number]) => {
    setDie(p.die);
    setCount(p.count);
    setModifier(p.modifier);
    setLabel(p.label);
    doRoll(p.die, p.count, p.modifier, p.label);
  };

  return (
    <Card className="page-surface p-4 sm:p-6 relative max-h-[85vh] overflow-hidden flex flex-col">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      <header className="mb-4 pr-10">
        <h2 className="font-display text-2xl sm:text-3xl text-ink">The Roller's Table</h2>
        <p className="text-xs sm:text-sm text-muted-foreground italic">Cast the bones of fate</p>
      </header>

      <Tabs defaultValue="roll" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="self-start">
          <TabsTrigger value="roll" className="gap-1"><Dice1 className="h-4 w-4" />Roll</TabsTrigger>
          <TabsTrigger value="presets" className="gap-1"><Star className="h-4 w-4" />Presets</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><History className="h-4 w-4" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="roll" className="flex-1 overflow-auto mt-3 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {DICE.map((d) => (
              <button
                key={d}
                onClick={() => setDie(d)}
                className={`px-3 py-2 rounded-lg border-2 font-display text-sm transition-all ${
                  die === d
                    ? "border-accent bg-gradient-accent text-primary-foreground accent-glow scale-105"
                    : "border-border bg-card hover:border-accent/60"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex justify-center py-4">
            <DieFace die={die} rolling={rolling} value={last?.total} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Count</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, +e.target.value || 1)))}
              />
            </div>
            <div>
              <Label className="text-xs">Modifier</Label>
              <Input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(+e.target.value || 0)}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                placeholder="e.g. Sneak Attack"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => doRoll()} className="flex-1 min-w-[140px] bg-gradient-accent text-primary-foreground hover:opacity-90 font-display tracking-wide">
              Roll {count}{die}{modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ""}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSavePreset((s) => !s)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Preset
            </Button>
          </div>

          {showSavePreset && (
            <div className="rounded-lg border border-border p-3 bg-card/50 flex gap-2 items-end animate-fade-in">
              <div className="flex-1">
                <Label className="text-xs">Preset name</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Longsword Attack" />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!label.trim()) return;
                  addPreset({ label, die, count, modifier });
                  setShowSavePreset(false);
                }}
              >
                Save
              </Button>
            </div>
          )}

          <AnimatePresence>
            {last && !rolling && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border-2 border-accent/40 bg-card/70 p-3"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display text-base">{last.label}</span>
                  <span className="font-display text-3xl text-accent">{last.total}</span>
                </div>
                <div className="text-xs text-muted-foreground italic">
                  {last.rolls.join(" + ")}
                  {last.modifier ? ` ${last.modifier > 0 ? "+" : ""}${last.modifier}` : ""}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="presets" className="flex-1 overflow-auto mt-3 space-y-2">
          {presets.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No presets yet. Save one from the Roll tab.</p>
          )}
          {presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-2"
            >
              <button
                onClick={() => rollPreset(p)}
                className="flex-1 text-left flex items-center gap-3 hover:text-accent transition-colors"
              >
                <span className="text-xl">{dieGlyph[p.die]}</span>
                <span>
                  <span className="block font-display text-sm">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.count}{p.die}{p.modifier ? (p.modifier > 0 ? `+${p.modifier}` : p.modifier) : ""}
                  </span>
                </span>
              </button>
              <Button variant="ghost" size="icon" onClick={() => removePreset(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto mt-3 space-y-2">
          <div className="flex justify-end">
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="gap-1 text-xs">
                <Trash2 className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No rolls yet. Cast the dice!</p>
          )}
          {history.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card/60 p-2 flex items-center gap-3">
              <span className="text-2xl">{dieGlyph[r.die]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm truncate">{r.label}</div>
                <div className="text-xs text-muted-foreground italic truncate">
                  [{r.rolls.join(", ")}]{r.modifier ? ` ${r.modifier > 0 ? "+" : ""}${r.modifier}` : ""}
                </div>
              </div>
              <div className="font-display text-2xl text-accent">{r.total}</div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
