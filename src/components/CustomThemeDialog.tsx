import { useEffect, useState } from "react";
import { CustomTheme } from "@/lib/types";
import { useApp } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const MAX_IMG_BYTES = 4 * 1024 * 1024;

/* ---- HSL <-> hex helpers ---- */
const hexToHsl = (hex: string): string => {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const hslToHex = (hslStr: string): string => {
  const m = hslStr.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return "#000000";
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

async function fileToScaledDataUrl(file: File, max = 1600): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  if (file.size < 600_000) return dataUrl;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > max || height > max) {
    const r = Math.min(max / width, max / height);
    width = Math.round(width * r);
    height = Math.round(height * r);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

const DEFAULT_LIGHT: CustomTheme["colors"] = {
  background: "210 40% 96%",
  card: "210 45% 98%",
  primary: "215 70% 45%",
  accent: "200 80% 50%",
  foreground: "215 40% 18%",
};
const DEFAULT_DARK: CustomTheme["colors"] = {
  background: "225 25% 10%",
  card: "225 25% 14%",
  primary: "260 70% 65%",
  accent: "195 85% 60%",
  foreground: "220 20% 95%",
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When provided, edits an existing theme; otherwise creates new. */
  editingId?: string | null;
};

const COLOR_FIELDS: { key: keyof CustomTheme["colors"]; label: string; hint: string }[] = [
  { key: "background", label: "Background", hint: "Main app background" },
  { key: "card", label: "Card / Paper", hint: "Notebook page surface" },
  { key: "primary", label: "Primary", hint: "Buttons, headings, brand" },
  { key: "accent", label: "Accent", hint: "Highlights, active states" },
  { key: "foreground", label: "Text", hint: "Body text & ink" },
];

export function CustomThemeDialog({ open, onOpenChange, editingId }: Props) {
  const customThemes = useApp((s) => s.customThemes);
  const addCustomTheme = useApp((s) => s.addCustomTheme);
  const updateCustomTheme = useApp((s) => s.updateCustomTheme);
  const deleteCustomTheme = useApp((s) => s.deleteCustomTheme);
  const setTheme = useApp((s) => s.setTheme);

  const editing = editingId ? customThemes.find((t) => t.id === editingId) : null;

  const [name, setName] = useState("My Theme");
  const [isDark, setIsDark] = useState(false);
  const [colors, setColors] = useState<CustomTheme["colors"]>(DEFAULT_LIGHT);
  const [appBgImage, setAppBgImage] = useState<string | undefined>();
  const [pageBgImage, setPageBgImage] = useState<string | undefined>();

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setIsDark(editing.isDark);
      setColors(editing.colors);
      setAppBgImage(editing.appBgImage);
      setPageBgImage(editing.pageBgImage);
    } else {
      setName("My Theme");
      setIsDark(false);
      setColors(DEFAULT_LIGHT);
      setAppBgImage(undefined);
      setPageBgImage(undefined);
    }
  }, [open, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setColor = (key: keyof CustomTheme["colors"], hex: string) =>
    setColors((c) => ({ ...c, [key]: hexToHsl(hex) }));

  const toggleDark = (next: boolean) => {
    setIsDark(next);
    // Only auto-fill when creating; don't clobber user's edits when editing
    if (!editing) setColors(next ? DEFAULT_DARK : DEFAULT_LIGHT);
  };

  const onPickImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "app" | "page",
  ) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > MAX_IMG_BYTES * 2) {
      toast.error(`${f.name} is too large.`);
      return;
    }
    const src = await fileToScaledDataUrl(f);
    if (target === "app") setAppBgImage(src);
    else setPageBgImage(src);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Give the theme a name.");
      return;
    }
    if (editing) {
      updateCustomTheme(editing.id, { name: name.trim(), isDark, colors, appBgImage, pageBgImage });
      setTheme(editing.id);
      toast.success(`${name} updated.`);
    } else {
      const id = addCustomTheme({ name: name.trim(), isDark, colors, appBgImage, pageBgImage });
      setTheme(id);
      toast.success(`${name} created.`);
    }
    onOpenChange(false);
  };

  const handleSaveAsNew = () => {
    if (!name.trim()) {
      toast.error("Give the theme a name.");
      return;
    }
    const id = addCustomTheme({ name: name.trim(), isDark, colors, appBgImage, pageBgImage });
    setTheme(id);
    toast.success(`${name} saved.`);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    if (!confirm(`Delete theme "${editing.name}"?`)) return;
    deleteCustomTheme(editing.id);
    toast.success("Theme deleted.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit custom theme" : "Create custom theme"}
          </DialogTitle>
          <DialogDescription>
            Pick a full palette and optionally upload background images. Saved to this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name + dark toggle */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="theme-name">Name</Label>
              <Input
                id="theme-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunset, Forest, Cozy"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Label htmlFor="dark-toggle" className="text-sm">Dark mode</Label>
              <Switch id="dark-toggle" checked={isDark} onCheckedChange={toggleDark} />
            </div>
          </div>

          {/* Color pickers */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Palette
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {COLOR_FIELDS.map((f) => {
                const hex = hslToHex(colors[f.key]);
                return (
                  <div key={f.key} className="flex items-center gap-3 border border-border rounded-md p-2">
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      className="h-10 w-12 rounded border border-border cursor-pointer bg-transparent"
                      aria-label={f.label}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display">{f.label}</div>
                      <div className="text-[11px] text-muted-foreground">{f.hint}</div>
                    </div>
                    <code className="text-[10px] text-muted-foreground">{hex}</code>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Background images */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Background images (optional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[
                { kind: "app" as const, label: "App background", value: appBgImage, set: setAppBgImage },
                { kind: "page" as const, label: "Page surface", value: pageBgImage, set: setPageBgImage },
              ].map((slot) => (
                <div key={slot.kind} className="border border-border rounded-md p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-display">{slot.label}</span>
                    {slot.value && (
                      <button
                        onClick={() => slot.set(undefined)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Clear image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div
                    className="h-20 rounded border border-border bg-muted"
                    style={
                      slot.value
                        ? { backgroundImage: `url(${slot.value})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : undefined
                    }
                  />
                  <label className="flex items-center justify-center gap-1 text-xs cursor-pointer rounded border border-dashed border-border py-1.5 hover:bg-muted">
                    <Upload className="h-3.5 w-3.5" />
                    {slot.value ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickImage(e, slot.kind)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preview</Label>
            <ThemePreview
              colors={colors}
              isDark={isDark}
              appBgImage={appBgImage}
              pageBgImage={pageBgImage}
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <div>
            {editing && (
              <Button variant="ghost" onClick={handleDelete} className="text-destructive gap-1">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {editing && (
              <Button variant="outline" onClick={handleSaveAsNew}>
                Save as new
              </Button>
            )}
            <Button onClick={handleSave} className="bg-gradient-accent text-primary-foreground">
              {editing ? "Save changes" : "Create theme"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -- Inline preview -- */
function ThemePreview({
  colors,
  isDark,
  appBgImage,
  pageBgImage,
}: {
  colors: CustomTheme["colors"];
  isDark: boolean;
  appBgImage?: string;
  pageBgImage?: string;
}) {
  const cssVars: React.CSSProperties = {
    // @ts-expect-error custom CSS vars
    "--bg": colors.background,
    "--card": colors.card,
    "--primary": colors.primary,
    "--accent": colors.accent,
    "--fg": colors.foreground,
  };
  return (
    <div
      className="mt-2 rounded-lg border border-border overflow-hidden"
      style={cssVars}
    >
      <div
        className="p-4"
        style={{
          background: appBgImage ? `url(${appBgImage}) center/cover` : `hsl(var(--bg))`,
          color: `hsl(var(--fg))`,
        }}
      >
        <div
          className="rounded-md p-4 shadow-sm border"
          style={{
            background: pageBgImage
              ? `url(${pageBgImage}) center/cover, hsl(var(--card))`
              : `hsl(var(--card))`,
            borderColor: `hsl(var(--fg) / 0.15)`,
          }}
        >
          <div className="font-display text-lg" style={{ color: `hsl(var(--fg))` }}>
            Sample notebook page
          </div>
          <p className="text-sm mt-1" style={{ color: `hsl(var(--fg) / 0.8)` }}>
            The quick brown fox jumps over the lazy dragon. {isDark ? "(dark)" : "(light)"}
          </p>
          <div className="flex gap-2 mt-3">
            <span
              className="inline-block px-3 py-1 rounded text-xs font-display"
              style={{
                background: `hsl(var(--primary))`,
                color: `hsl(var(--card))`,
              }}
            >
              Primary
            </span>
            <span
              className="inline-block px-3 py-1 rounded text-xs font-display"
              style={{
                background: `hsl(var(--accent))`,
                color: `hsl(var(--card))`,
              }}
            >
              Accent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
