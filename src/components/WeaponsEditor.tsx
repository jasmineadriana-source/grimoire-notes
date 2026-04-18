import { useApp } from "@/lib/store";
import { WeaponEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Sword, Trash2 } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

type Props = {
  notebookId: string;
  pageId: string;
  title: string;
  weapons: WeaponEntry[];
};

const newWeapon = (): WeaponEntry => ({
  id: uid(),
  name: "",
  attack: "",
  damage: "",
  notes: "",
});

export function WeaponsEditor({ notebookId, pageId, title, weapons }: Props) {
  const updatePage = useApp((s) => s.updatePage);

  const setWeapons = (next: WeaponEntry[]) =>
    updatePage(notebookId, pageId, { weapons: next });

  const update = (id: string, patch: Partial<WeaponEntry>) =>
    setWeapons(weapons.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const add = () => setWeapons([...weapons, newWeapon()]);
  const remove = (id: string) => setWeapons(weapons.filter((w) => w.id !== id));

  return (
    <div className="page-surface rounded-xl p-6 sm:p-10 mx-auto max-w-4xl animate-fade-in">
      <input
        value={title}
        onChange={(e) => updatePage(notebookId, pageId, { title: e.target.value })}
        className="bg-transparent font-decorative text-3xl sm:text-4xl text-ink text-center w-full outline-none mb-2"
      />
      <div className="ornament-divider mb-6" />

      {weapons.length === 0 ? (
        <div className="text-center py-12">
          <Sword className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="font-script italic text-muted-foreground mb-4">
            Your armoury is empty. Forge your first weapon entry.
          </p>
          <Button onClick={add} className="gap-2 bg-gradient-accent text-primary-foreground font-display">
            <Plus className="h-4 w-4" /> Add weapon
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header row — hidden on mobile */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr_2fr_auto] gap-2 px-2 text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            <span>Name</span>
            <span>Attack</span>
            <span>Damage / Type</span>
            <span>Notes</span>
            <span />
          </div>

          {weapons.map((w) => (
            <div
              key={w.id}
              className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr_2fr_auto] gap-2 items-start bg-background/40 rounded-lg p-3 sm:p-2 border border-border/50"
            >
              <div>
                <Label className="sm:hidden text-[10px] uppercase tracking-widest text-muted-foreground">Name</Label>
                <Input
                  value={w.name}
                  onChange={(e) => update(w.id, { name: e.target.value })}
                  placeholder="Longsword"
                  className="font-display"
                />
              </div>
              <div>
                <Label className="sm:hidden text-[10px] uppercase tracking-widest text-muted-foreground">Attack</Label>
                <Input
                  value={w.attack}
                  onChange={(e) => update(w.id, { attack: e.target.value })}
                  placeholder="+5"
                  className="text-center"
                />
              </div>
              <div>
                <Label className="sm:hidden text-[10px] uppercase tracking-widest text-muted-foreground">Damage / Type</Label>
                <Input
                  value={w.damage}
                  onChange={(e) => update(w.id, { damage: e.target.value })}
                  placeholder="1d8+3 slashing"
                />
              </div>
              <div>
                <Label className="sm:hidden text-[10px] uppercase tracking-widest text-muted-foreground">Notes</Label>
                <Input
                  value={w.notes}
                  onChange={(e) => update(w.id, { notes: e.target.value })}
                  placeholder="Versatile (1d10), finesse"
                />
              </div>
              <div className="flex sm:items-center sm:justify-center sm:pt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(w.id)}
                  className="text-muted-foreground hover:text-destructive h-9 w-9"
                  aria-label="Delete weapon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Button onClick={add} variant="outline" size="sm" className="gap-2 font-display">
              <Plus className="h-4 w-4" /> Add weapon
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
