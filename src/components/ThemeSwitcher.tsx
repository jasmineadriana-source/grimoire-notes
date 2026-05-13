import { useState } from "react";
import { THEMES, ThemeKey, isBuiltInTheme, BuiltInThemeKey } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Check, Crown, Palette, Pencil, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CustomThemeDialog } from "./CustomThemeDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "./UpgradeModal";

const builtInSwatch: Record<BuiltInThemeKey, string> = {
  parchment: "linear-gradient(135deg, hsl(38 55% 80%), hsl(42 75% 50%), hsl(350 55% 32%))",
  arcane: "linear-gradient(135deg, hsl(245 40% 14%), hsl(270 80% 60%), hsl(195 85% 55%))",
  druid: "linear-gradient(135deg, hsl(100 30% 18%), hsl(110 50% 45%), hsl(35 55% 50%))",
  dragon: "linear-gradient(135deg, hsl(15 20% 12%), hsl(18 95% 55%), hsl(45 95% 55%))",
  ivory: "hsl(40 30% 96%)",
  sand: "hsl(35 35% 82%)",
  slate: "hsl(220 12% 32%)",
  midnight: "hsl(225 25% 10%)",
  pink: "hsl(340 75% 78%)",
  purple: "hsl(265 55% 65%)",
  blue: "hsl(210 75% 60%)",
};

/** Public helper so other components (Library) can render a swatch for any theme. */
export const swatchForTheme = (
  key: ThemeKey,
  customThemes: { id: string; colors: { background: string; accent: string }; appBgImage?: string }[],
): string => {
  if (isBuiltInTheme(key)) return builtInSwatch[key];
  const ct = customThemes.find((t) => t.id === key);
  if (!ct) return "hsl(var(--muted))";
  if (ct.appBgImage) return `url(${ct.appBgImage}) center/cover`;
  return `linear-gradient(135deg, hsl(${ct.colors.background}), hsl(${ct.colors.accent}))`;
};

type Props = { notebookId?: string };

export function ThemeSwitcher({ notebookId }: Props) {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const setNotebookTheme = useApp((s) => s.setNotebookTheme);
  const customThemes = useApp((s) => s.customThemes);
  const { isPremium } = useSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const choose = (t: ThemeKey) => {
    if (notebookId) setNotebookTheme(notebookId, t);
    setTheme(t);
  };

  const openCreate = () => {
    if (!isPremium) { setUpgradeOpen(true); return; }
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (id: string) => {
    if (!isPremium) { setUpgradeOpen(true); return; }
    setEditingId(id);
    setDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 font-display">
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ background: swatchForTheme(theme, customThemes) }}
            />
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="font-display">Choose a theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t, i) => {
            const prev = THEMES[i - 1];
            const isFirstSolid =
              t.name.includes("(Solid)") && (!prev || !prev.name.includes("(Solid)"));
            return (
              <div key={t.key}>
                {isFirstSolid && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="font-display text-xs text-muted-foreground">
                      Solid colors
                    </DropdownMenuLabel>
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => choose(t.key)}
                  className="gap-3 py-2 cursor-pointer"
                >
                  <span
                    className="h-7 w-7 rounded-md border border-border shrink-0"
                    style={{ background: builtInSwatch[t.key] }}
                  />
                  <span className="flex-1">
                    <span className="block font-display text-sm">{t.name}</span>
                    <span className="block text-xs text-muted-foreground italic">{t.tagline}</span>
                  </span>
                  {theme === t.key && <Check className="h-4 w-4 text-accent" />}
                </DropdownMenuItem>
              </div>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-display text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              Custom {!isPremium && <Crown className="h-3 w-3 text-accent" />}
            </span>
          </DropdownMenuLabel>
          {customThemes.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground italic">
              No custom themes yet.
            </div>
          )}
          {customThemes.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm hover:bg-accent/40"
              onClick={() => choose(t.id)}
            >
              <span
                className="h-7 w-7 rounded-md border border-border shrink-0"
                style={{ background: swatchForTheme(t.id, customThemes) }}
              />
              <span className="flex-1 min-w-0">
                <span className="block font-display text-sm truncate">{t.name}</span>
                <span className="block text-xs text-muted-foreground italic">
                  {t.isDark ? "Dark" : "Light"} · custom
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-accent"
                title="Edit theme"
                aria-label="Edit theme"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {theme === t.id && <Check className="h-4 w-4 text-accent" />}
            </div>
          ))}
          <DropdownMenuItem
            onClick={openCreate}
            className="gap-2 py-2 cursor-pointer text-accent font-display"
          >
            <Plus className="h-4 w-4" /> Create custom theme…
            {!isPremium && <Crown className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CustomThemeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
      />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason="Design your own themes — pick custom colors, dark/light mode, and even background images."
      />
    </>
  );
}
