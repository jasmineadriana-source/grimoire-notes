import { useApp } from "@/lib/store";
import { SpellEntry, SpellbookMeta, blankSpellbookMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);

type Props = {
  notebookId: string;
  pageId: string;
  title: string;
  spells: SpellEntry[];
  spellbook?: SpellbookMeta;
};

const LEVEL_LABELS = [
  "Cantrips",
  "1st Level", "2nd Level", "3rd Level", "4th Level",
  "5th Level", "6th Level", "7th Level", "8th Level", "9th Level",
];

const newSpell = (level: number): SpellEntry => ({
  id: uid(),
  name: "",
  level,
  prepared: false,
  castingTime: "",
  range: "",
  components: "",
  duration: "",
  description: "",
});

export function SpellbookEditor({ notebookId, pageId, title, spells, spellbook }: Props) {
  const updatePage = useApp((s) => s.updatePage);
  const meta = spellbook ?? blankSpellbookMeta();

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const setSpells = (next: SpellEntry[]) =>
    updatePage(notebookId, pageId, { spells: next });
  const setMeta = (patch: Partial<SpellbookMeta>) =>
    updatePage(notebookId, pageId, { spellbook: { ...meta, ...patch } });

  const updateSpell = (id: string, patch: Partial<SpellEntry>) =>
    setSpells(spells.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSpell = (level: number) => {
    const fresh = newSpell(level);
    setSpells([...spells, fresh]);
    setOpenIds((prev) => new Set(prev).add(fresh.id));
  };
  const removeSpell = (id: string) =>
    setSpells(spells.filter((s) => s.id !== id));

  const setSlot = (level: number, patch: Partial<{ used: number; total: number }>) => {
    const slots = meta.slots.map((s, i) =>
      i === level ? { ...s, ...patch } : s,
    );
    setMeta({ slots });
  };

  return (
    <div className="page-surface rounded-xl p-6 sm:p-10 mx-auto max-w-4xl animate-fade-in">
      <input
        value={title}
        onChange={(e) => updatePage(notebookId, pageId, { title: e.target.value })}
        className="bg-transparent font-decorative text-3xl sm:text-4xl text-ink text-center w-full outline-none mb-2"
      />
      <div className="ornament-divider mb-6" />

      {/* Spellcasting summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ability</Label>
          <Input
            value={meta.ability}
            onChange={(e) => setMeta({ ability: e.target.value })}
            placeholder="WIS"
            className="text-center font-display"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Save DC</Label>
          <Input
            value={meta.saveDc}
            onChange={(e) => setMeta({ saveDc: e.target.value })}
            placeholder="15"
            className="text-center font-display"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Attack</Label>
          <Input
            value={meta.attackBonus}
            onChange={(e) => setMeta({ attackBonus: e.target.value })}
            placeholder="+7"
            className="text-center font-display"
          />
        </div>
      </div>

      {/* Spell levels */}
      <div className="space-y-6">
        {LEVEL_LABELS.map((label, level) => {
          const atLevel = spells.filter((s) => s.level === level);
          const slot = meta.slots[level];
          return (
            <section key={level}>
              <div className="flex items-center justify-between mb-2 gap-3">
                <h3 className="font-decorative text-xl text-ink">{label}</h3>

                {level > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-display uppercase tracking-widest text-[10px] mr-1">Slots</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={slot.used}
                      onChange={(e) => setSlot(level, { used: Math.max(0, +e.target.value || 0) })}
                      className="h-7 w-12 text-center px-1"
                      aria-label={`${label} slots used`}
                    />
                    <span>/</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={slot.total}
                      onChange={(e) => setSlot(level, { total: Math.max(0, +e.target.value || 0) })}
                      className="h-7 w-12 text-center px-1"
                      aria-label={`${label} slots total`}
                    />
                  </div>
                )}
              </div>

              {atLevel.length === 0 ? (
                <button
                  onClick={() => addSpell(level)}
                  className="w-full text-left text-sm text-muted-foreground italic py-2 px-3 rounded-md border border-dashed border-border hover:border-accent hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add {label.toLowerCase()} spell
                </button>
              ) : (
                <div className="space-y-2">
                  {atLevel.map((sp) => {
                    const isOpen = openIds.has(sp.id);
                    return (
                      <Collapsible key={sp.id} open={isOpen} onOpenChange={() => toggleOpen(sp.id)}>
                        <div className="bg-background/40 rounded-lg border border-border/50">
                          <div className="flex items-center gap-2 p-2">
                            <Checkbox
                              checked={sp.prepared}
                              onCheckedChange={(v) => updateSpell(sp.id, { prepared: !!v })}
                              aria-label="Prepared"
                              className="ml-1"
                            />
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-1 flex-1 min-w-0 text-left">
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <Input
                                  value={sp.name}
                                  onChange={(e) => updateSpell(sp.id, { name: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Spell name"
                                  className="font-display border-0 bg-transparent focus-visible:ring-0 px-1 h-8"
                                />
                              </button>
                            </CollapsibleTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSpell(sp.id)}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                              aria-label="Delete spell"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <CollapsibleContent>
                            <div className="px-3 pb-3 space-y-2">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Casting Time</Label>
                                  <Input
                                    value={sp.castingTime}
                                    onChange={(e) => updateSpell(sp.id, { castingTime: e.target.value })}
                                    placeholder="1 action"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Range</Label>
                                  <Input
                                    value={sp.range}
                                    onChange={(e) => updateSpell(sp.id, { range: e.target.value })}
                                    placeholder="60 ft"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Components</Label>
                                  <Input
                                    value={sp.components}
                                    onChange={(e) => updateSpell(sp.id, { components: e.target.value })}
                                    placeholder="V, S, M"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Duration</Label>
                                  <Input
                                    value={sp.duration}
                                    onChange={(e) => updateSpell(sp.id, { duration: e.target.value })}
                                    placeholder="Concentration, 1m"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
                                <Textarea
                                  value={sp.description}
                                  onChange={(e) => updateSpell(sp.id, { description: e.target.value })}
                                  rows={4}
                                  placeholder="What the spell does, damage rolls, saving throws…"
                                  className="font-script text-base"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                  <button
                    onClick={() => addSpell(level)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1"
                  >
                    <Plus className="h-3 w-3" /> Add another
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {spells.length === 0 && (
        <div className="text-center pt-4">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
