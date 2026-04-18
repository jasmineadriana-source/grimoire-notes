import { THEMES, ThemeKey } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Check, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const swatchFor: Record<ThemeKey, string> = {
  parchment: "linear-gradient(135deg, hsl(38 55% 80%), hsl(42 75% 50%), hsl(350 55% 32%))",
  arcane: "linear-gradient(135deg, hsl(245 40% 14%), hsl(270 80% 60%), hsl(195 85% 55%))",
  druid: "linear-gradient(135deg, hsl(100 30% 18%), hsl(110 50% 45%), hsl(35 55% 50%))",
  dragon: "linear-gradient(135deg, hsl(15 20% 12%), hsl(18 95% 55%), hsl(45 95% 55%))",
  ivory: "hsl(40 30% 96%)",
  sand: "hsl(35 35% 82%)",
  slate: "hsl(220 12% 32%)",
  midnight: "hsl(225 25% 10%)",
};

type Props = { notebookId?: string };

export function ThemeSwitcher({ notebookId }: Props) {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const setNotebookTheme = useApp((s) => s.setNotebookTheme);

  const choose = (t: ThemeKey) => {
    if (notebookId) setNotebookTheme(notebookId, t);
    setTheme(t);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-display">
          <span
            className="h-4 w-4 rounded-full border border-border"
            style={{ background: swatchFor[theme] }}
          />
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-display">Choose a theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.key}
            onClick={() => choose(t.key)}
            className="gap-3 py-2 cursor-pointer"
          >
            <span
              className="h-7 w-7 rounded-md border border-border shrink-0"
              style={{ background: swatchFor[t.key] }}
            />
            <span className="flex-1">
              <span className="block font-display text-sm">{t.name}</span>
              <span className="block text-xs text-muted-foreground italic">{t.tagline}</span>
            </span>
            {theme === t.key && <Check className="h-4 w-4 text-accent" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
