import { useEffect } from "react";
import { useApp } from "./store";
import { CustomTheme, isBuiltInTheme } from "./types";

/** Parse "210 50% 94%" into [h, s, l]. */
const parseHsl = (v: string): [number, number, number] => {
  const m = v.trim().match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return [0, 0, 50];
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
};
const fmtHsl = (h: number, s: number, l: number) =>
  `${Math.round(h)} ${Math.max(0, Math.min(100, Math.round(s)))}% ${Math.max(0, Math.min(100, Math.round(l)))}%`;

/** Lighten/darken HSL string by L delta. */
const tintL = (hsl: string, delta: number) => {
  const [h, s, l] = parseHsl(hsl);
  return fmtHsl(h, s, l + delta);
};

/** Build CSS variable block for a custom theme. */
const buildCss = (t: CustomTheme): string => {
  const { background, card, primary, accent, foreground } = t.colors;
  const dark = t.isDark;

  // Derived tokens
  const popover = card;
  const muted = dark ? tintL(background, 8) : tintL(background, -4);
  const mutedFg = dark ? tintL(foreground, -25) : tintL(foreground, 25);
  const secondary = dark ? tintL(background, 12) : tintL(background, -6);
  const border = dark ? tintL(background, 14) : tintL(background, -10);
  const input = dark ? tintL(background, 12) : tintL(background, -8);
  const primaryGlow = dark ? tintL(primary, 10) : tintL(primary, 8);
  const ring = accent;
  const paperEdge = dark ? tintL(background, 18) : tintL(background, -14);
  const ink = foreground;
  const accentFg = dark ? tintL(background, -2) : tintL(background, 8);
  const primaryFg = dark ? tintL(background, -2) : tintL(background, 10);

  const appBg = t.appBgImage ? `url("${t.appBgImage}")` : null;
  const pageBg = t.pageBgImage ? `url("${t.pageBgImage}")` : null;

  return `
[data-theme="${t.id}"] {
  --background: ${background};
  --foreground: ${foreground};
  --card: ${card};
  --card-foreground: ${foreground};
  --popover: ${popover};
  --popover-foreground: ${foreground};
  --primary: ${primary};
  --primary-foreground: ${primaryFg};
  --primary-glow: ${primaryGlow};
  --secondary: ${secondary};
  --secondary-foreground: ${foreground};
  --muted: ${muted};
  --muted-foreground: ${mutedFg};
  --accent: ${accent};
  --accent-foreground: ${accentFg};
  --destructive: 0 70% ${dark ? 55 : 45}%;
  --destructive-foreground: ${primaryFg};
  --border: ${border};
  --input: ${input};
  --ring: ${ring};
  --paper: ${card};
  --paper-edge: ${paperEdge};
  --ink: ${ink};
  --gradient-page: hsl(${card});
  --gradient-cover: hsl(${dark ? tintL(background, -4) : tintL(primary, -10)});
  --gradient-accent: hsl(${accent});
  --shadow-page: 0 4px 14px -6px hsl(0 0% 0% / ${dark ? 0.55 : 0.22});
  --shadow-glow: 0 0 0 transparent;
  --texture: none;
  ${appBg ? `--app-bg-image: ${appBg};` : ""}
  ${pageBg ? `--page-bg-image: ${pageBg};` : ""}
  --sidebar-background: ${card};
  --sidebar-foreground: ${foreground};
  --sidebar-primary: ${primary};
  --sidebar-primary-foreground: ${primaryFg};
  --sidebar-accent: ${muted};
  --sidebar-accent-foreground: ${foreground};
  --sidebar-border: ${border};
  --sidebar-ring: ${ring};
}
`;
};

const STYLE_ID = "custom-theme-vars";

/** Applies the current theme to <html data-theme="..."> and injects CSS for custom themes. */
export function ThemeBridge() {
  const theme = useApp((s) => s.theme);
  const customThemes = useApp((s) => s.customThemes);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    // Always rebuild the injected stylesheet — covers all custom themes so
    // swatches/previews look right even when not currently active.
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (customThemes.length === 0) {
      style.textContent = "";
    } else {
      style.textContent = customThemes.map(buildCss).join("\n");
    }

    // If the active theme id no longer exists (deleted), fall back.
    if (!isBuiltInTheme(theme) && !customThemes.find((t) => t.id === theme)) {
      root.setAttribute("data-theme", "parchment");
    }
  }, [theme, customThemes]);

  return null;
}
