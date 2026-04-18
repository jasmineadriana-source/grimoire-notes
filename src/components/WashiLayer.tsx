import { useRef, useState } from "react";
import { CustomWashi, WashiStrip } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Trash2, Tag, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const uid = () => Math.random().toString(36).slice(2, 10);
const MAX_IMG_BYTES = 4 * 1024 * 1024;

/* ---------------- Built-in tape designs ----------------
 * Each style is a pure CSS background, sized to the strip.
 * Using HSL so they look good across themes. */
type WashiPreset = {
  id: string;
  name: string;
  background: string;
  /** Optional overlay opacity (tape look). */
  opacity?: number;
};

export const WASHI_PRESETS: WashiPreset[] = [
  {
    id: "rose-stripes",
    name: "Rose Stripes",
    background:
      "repeating-linear-gradient(135deg, hsl(340 75% 78%) 0 12px, hsl(340 60% 88%) 12px 24px)",
  },
  {
    id: "mint-dots",
    name: "Mint Dots",
    background:
      "radial-gradient(hsl(160 50% 35% / 0.55) 2px, transparent 2.5px) 0 0 / 14px 14px, hsl(160 60% 80%)",
  },
  {
    id: "sky-waves",
    name: "Sky Waves",
    background:
      "repeating-linear-gradient(90deg, hsl(200 80% 70%) 0 16px, hsl(200 60% 85%) 16px 32px)",
  },
  {
    id: "lavender-floral",
    name: "Lavender Bloom",
    background:
      "radial-gradient(circle at 25% 50%, hsl(280 50% 55% / 0.65) 3px, transparent 4px) 0 0 / 22px 22px, radial-gradient(circle at 75% 50%, hsl(45 80% 60% / 0.7) 2px, transparent 3px) 0 0 / 22px 22px, hsl(280 50% 88%)",
  },
  {
    id: "sunny-stars",
    name: "Sunny Stars",
    background:
      "radial-gradient(hsl(45 95% 50% / 0.7) 1.5px, transparent 2px) 0 0 / 10px 10px, hsl(50 100% 80%)",
  },
  {
    id: "gold-foil",
    name: "Gold Foil",
    background:
      "linear-gradient(110deg, hsl(45 90% 70%) 0%, hsl(48 100% 85%) 30%, hsl(35 95% 55%) 50%, hsl(48 100% 85%) 70%, hsl(45 90% 65%) 100%)",
  },
  {
    id: "midnight-stars",
    name: "Midnight Stars",
    background:
      "radial-gradient(hsl(45 95% 70% / 0.9) 1.2px, transparent 2px) 0 0 / 18px 18px, radial-gradient(hsl(0 0% 100% / 0.7) 0.8px, transparent 1.5px) 9px 9px / 18px 18px, hsl(245 50% 18%)",
  },
  {
    id: "kraft-tape",
    name: "Kraft Paper",
    background:
      "repeating-linear-gradient(45deg, hsl(30 40% 60% / 0.25) 0 2px, transparent 2px 6px), hsl(30 50% 70%)",
  },
  {
    id: "candy-checks",
    name: "Candy Checks",
    background:
      "repeating-conic-gradient(hsl(0 70% 75%) 0 25%, hsl(0 30% 95%) 0 50%) 0 0 / 16px 16px",
  },
  {
    id: "forest-leaves",
    name: "Forest Leaves",
    background:
      "radial-gradient(ellipse at center, hsl(110 50% 35% / 0.6) 3px, transparent 5px) 0 0 / 18px 18px, hsl(110 35% 70%)",
  },
  {
    id: "blush-solid",
    name: "Blush",
    background: "hsl(355 75% 82%)",
  },
  {
    id: "ink-stripes",
    name: "Ink Stripes",
    background:
      "repeating-linear-gradient(90deg, hsl(220 25% 25%) 0 6px, hsl(220 20% 35%) 6px 12px)",
  },
];

const styleBackground = (
  styleId: string,
  customWashi: CustomWashi[],
): { background: string; backgroundSize?: string; backgroundRepeat?: string } => {
  if (styleId.startsWith("custom:")) {
    const id = styleId.slice("custom:".length);
    const cw = customWashi.find((c) => c.id === id);
    if (!cw) return { background: "hsl(var(--muted))" };
    if (cw.fit === "tile") {
      return {
        background: `url(${cw.src})`,
        backgroundSize: "auto 100%",
        backgroundRepeat: "repeat",
      };
    }
    return {
      background: `url(${cw.src}) center / 100% 100% no-repeat`,
    };
  }
  const preset = WASHI_PRESETS.find((p) => p.id === styleId);
  return { background: preset?.background ?? "hsl(var(--muted))" };
};

async function fileToScaledDataUrl(file: File, max = 1280): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  if (file.size < 400_000) return dataUrl;
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

/* =====================================================================
 * Toolbar button + popover with presets, custom uploads, and "draw mode"
 * ===================================================================== */

export function AddWashiButton({
  notebookId,
  pageId,
  washi,
  onStartDrawing,
}: {
  notebookId: string;
  pageId: string;
  washi: WashiStrip[];
  onStartDrawing: (styleId: string) => void;
}) {
  const updatePage = useApp((s) => s.updatePage);
  const customWashi = useApp((s) => s.customWashi);
  const addCustomWashi = useApp((s) => s.addCustomWashi);
  const removeCustomWashi = useApp((s) => s.removeCustomWashi);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFit, setPendingFit] = useState<"tile" | "stretch">("tile");
  const [open, setOpen] = useState(false);

  const dropOnPage = (styleId: string) => {
    const newStrip: WashiStrip = {
      id: uid(),
      styleId,
      cx: 0.25 + Math.random() * 0.5,
      cy: 0.15 + Math.random() * 0.6,
      length: 0.35,
      thickness: 0.04,
      rotation: -8 + Math.random() * 16,
    };
    updatePage(notebookId, pageId, { washi: [...washi, newStrip] });
    toast.success("Tape added — drag, rotate, or resize it.");
    setOpen(false);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_IMG_BYTES * 2) {
        toast.error(`${f.name} is too large.`);
        continue;
      }
      const src = await fileToScaledDataUrl(f);
      addCustomWashi({ name: f.name.replace(/\.[^.]+$/, ""), src, fit: pendingFit });
    }
    toast.success("Custom tape saved.");
  };

  const Swatch = ({
    styleId,
    label,
    onUse,
    onDraw,
    onDelete,
  }: {
    styleId: string;
    label: string;
    onUse: () => void;
    onDraw: () => void;
    onDelete?: () => void;
  }) => {
    const bg = styleBackground(styleId, customWashi);
    return (
      <div className="group relative">
        <button
          type="button"
          onClick={onUse}
          title={`${label} — click to drop on page`}
          className="block w-full h-9 rounded-md border border-paper-edge shadow-sm overflow-hidden hover:ring-2 hover:ring-accent transition-all"
          style={bg as React.CSSProperties}
        />
        <div className="flex items-center justify-between gap-1 mt-1">
          <span className="text-[10px] font-display truncate flex-1">{label}</span>
          <button
            onClick={onDraw}
            title="Draw on page"
            className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 hover:bg-accent/30 text-accent-foreground/90 font-display"
          >
            Draw
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete custom tape"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Tag className="h-4 w-4" /> <span className="hidden sm:inline">Tape</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3 max-h-[70vh] overflow-y-auto">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
              Washi tape
            </p>
            <p className="text-[11px] text-muted-foreground italic mb-2 leading-snug">
              Click a swatch to drop a strip on the page, or hit <span className="font-medium">Draw</span> to drag one out at any angle.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {WASHI_PRESETS.map((p) => (
                <Swatch
                  key={p.id}
                  styleId={p.id}
                  label={p.name}
                  onUse={() => dropOnPage(p.id)}
                  onDraw={() => {
                    onStartDrawing(p.id);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-display uppercase tracking-wider text-muted-foreground">
                My tapes
              </p>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-muted-foreground">Fit:</span>
                <button
                  className={cn(
                    "px-1.5 py-0.5 rounded font-display",
                    pendingFit === "tile" ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setPendingFit("tile")}
                >
                  Tile
                </button>
                <button
                  className={cn(
                    "px-1.5 py-0.5 rounded font-display",
                    pendingFit === "stretch" ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => setPendingFit("stretch")}
                >
                  Stretch
                </button>
              </div>
            </div>

            {customWashi.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic mb-2">
                Upload an image to make your own washi tape.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {customWashi.map((c) => (
                  <Swatch
                    key={c.id}
                    styleId={`custom:${c.id}`}
                    label={`${c.name} (${c.fit})`}
                    onUse={() => dropOnPage(`custom:${c.id}`)}
                    onDraw={() => {
                      onStartDrawing(`custom:${c.id}`);
                      setOpen(false);
                    }}
                    onDelete={() => removeCustomWashi(c.id)}
                  />
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" /> Upload custom tape
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* =====================================================================
 * The actual layer rendered on top of the page surface
 * ===================================================================== */

type Mode = "idle" | "drawing";

export function WashiLayer({
  notebookId,
  pageId,
  washi,
  drawingActive,
  drawStyleId,
  onFinishDrawing,
}: {
  notebookId: string;
  pageId: string;
  washi: WashiStrip[];
  /** True when the annotation tool is active — disables interaction. */
  drawingActive?: boolean;
  /** When set, user has chosen a tape style and clicks-drags to draw a new strip. */
  drawStyleId: string | null;
  onFinishDrawing: () => void;
}) {
  const updatePage = useApp((s) => s.updatePage);
  const customWashi = useApp((s) => s.customWashi);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<
    | { kind: "move"; id: string; offX: number; offY: number }
    | { kind: "resize"; id: string; startX: number; startLen: number; rotation: number }
    | { kind: "rotate"; id: string; cx: number; cy: number }
    | { kind: "draw"; tempId: string; startX: number; startY: number }
    | null
  >(null);

  const isDrawing = !!drawStyleId;
  const layerActive = !drawingActive; // pen tool blocks tape interaction

  const update = (id: string, patch: Partial<WashiStrip>) =>
    updatePage(notebookId, pageId, {
      washi: washi.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });

  const remove = (id: string) =>
    updatePage(notebookId, pageId, { washi: washi.filter((w) => w.id !== id) });

  const getLocal = (e: React.PointerEvent) => {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      rect,
    };
  };

  /* --- Draw mode: click-drag to create a new strip --- */
  const onContainerPointerDown = (e: React.PointerEvent) => {
    if (!isDrawing || drawingActive) return;
    const { x, y } = getLocal(e);
    const tempId = uid();
    const newStrip: WashiStrip = {
      id: tempId,
      styleId: drawStyleId!,
      cx: x,
      cy: y,
      length: 0.001,
      thickness: 0.04,
      rotation: 0,
    };
    updatePage(notebookId, pageId, { washi: [...washi, newStrip] });
    setDragState({ kind: "draw", tempId, startX: x, startY: y });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onContainerPointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const { x, y } = getLocal(e);

    if (dragState.kind === "draw") {
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;
      const length = Math.max(0.02, Math.hypot(dx, dy));
      const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
      const cx = dragState.startX + dx / 2;
      const cy = dragState.startY + dy / 2;
      update(dragState.tempId, { cx, cy, length, rotation });
      return;
    }
    if (dragState.kind === "move") {
      update(dragState.id, {
        cx: Math.max(0, Math.min(1, x - dragState.offX)),
        cy: Math.max(0, Math.min(1, y - dragState.offY)),
      });
      return;
    }
    if (dragState.kind === "resize") {
      const strip = washi.find((w) => w.id === dragState.id);
      if (!strip) return;
      // Project mouse delta along strip rotation axis
      const dx = x - dragState.startX;
      const rad = (strip.rotation * Math.PI) / 180;
      const along = dx * Math.cos(rad) + (x - dragState.startX) * 0; // simplified, length scales with horiz drag
      const next = Math.max(0.02, Math.min(1.5, dragState.startLen + along * 2));
      update(dragState.id, { length: next });
      return;
    }
    if (dragState.kind === "rotate") {
      const dxp = x - dragState.cx;
      const dyp = y - dragState.cy;
      const rotation = (Math.atan2(dyp, dxp) * 180) / Math.PI;
      update(dragState.id, { rotation });
      return;
    }
  };

  const onContainerPointerUp = () => {
    if (dragState?.kind === "draw") {
      const strip = washi.find((w) => w.id === dragState.tempId);
      if (strip && strip.length < 0.04) {
        // too small — give it a sensible default
        update(strip.id, { length: 0.25 });
      }
      onFinishDrawing();
    }
    setDragState(null);
  };

  /* --- Strip interactions --- */
  const startMove = (e: React.PointerEvent, strip: WashiStrip) => {
    if (drawingActive || isDrawing) return;
    e.stopPropagation();
    const { x, y } = getLocal(e);
    setActiveId(strip.id);
    setDragState({ kind: "move", id: strip.id, offX: x - strip.cx, offY: y - strip.cy });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const startResize = (e: React.PointerEvent, strip: WashiStrip) => {
    if (drawingActive) return;
    e.stopPropagation();
    e.preventDefault();
    const { x } = getLocal(e);
    setActiveId(strip.id);
    setDragState({
      kind: "resize",
      id: strip.id,
      startX: x,
      startLen: strip.length,
      rotation: strip.rotation,
    });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const startRotate = (e: React.PointerEvent, strip: WashiStrip) => {
    if (drawingActive) return;
    e.stopPropagation();
    e.preventDefault();
    setActiveId(strip.id);
    setDragState({ kind: "rotate", id: strip.id, cx: strip.cx, cy: strip.cy });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  if (washi.length === 0 && !isDrawing) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[15]"
      style={{
        pointerEvents: layerActive ? "auto" : "none",
        cursor: isDrawing ? "crosshair" : "default",
      }}
      onPointerDown={onContainerPointerDown}
      onPointerMove={onContainerPointerMove}
      onPointerUp={onContainerPointerUp}
      onPointerCancel={onContainerPointerUp}
    >
      {isDrawing && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-display shadow-lg pointer-events-none">
          Drag on the page to lay tape
        </div>
      )}
      {washi.map((strip) => {
        const bg = styleBackground(strip.styleId, customWashi);
        const isActive = activeId === strip.id;
        return (
          <div
            key={strip.id}
            className={cn("absolute", isActive && "outline outline-2 outline-accent/70")}
            style={{
              left: `${strip.cx * 100}%`,
              top: `${strip.cy * 100}%`,
              width: `${strip.length * 100}%`,
              height: `${strip.thickness * 100}%`,
              transform: `translate(-50%, -50%) rotate(${strip.rotation}deg)`,
              transformOrigin: "center center",
              cursor: dragState?.kind === "move" ? "grabbing" : "grab",
              touchAction: "none",
              ...(bg as React.CSSProperties),
              boxShadow:
                "0 1px 2px hsl(0 0% 0% / 0.18), inset 0 0 0 1px hsl(0 0% 100% / 0.18)",
              opacity: 0.92,
            }}
            onPointerDown={(e) => startMove(e, strip)}
            onClick={(e) => {
              e.stopPropagation();
              setActiveId(strip.id);
            }}
          >
            {isActive && (
              <>
                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(strip.id);
                    setActiveId(null);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                  title="Remove tape"
                  style={{ transform: `translate(-50%, 0) rotate(${-strip.rotation}deg)` }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {/* Resize handle (right end) */}
                <div
                  onPointerDown={(e) => startResize(e, strip)}
                  className="absolute top-1/2 -right-2 -translate-y-1/2 h-4 w-4 rounded-full bg-card border border-border shadow"
                  style={{ cursor: "ew-resize" }}
                  title="Drag to resize length"
                />
                {/* Rotate handle (top center) */}
                <div
                  onPointerDown={(e) => startRotate(e, strip)}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-accent border border-border shadow"
                  style={{ cursor: "crosshair" }}
                  title="Drag to rotate"
                />
              </>
            )}
          </div>
        );
      })}

      {/* Click-away to deselect */}
      {activeId && (
        <div
          className="absolute inset-0 -z-10"
          onPointerDown={() => setActiveId(null)}
        />
      )}
    </div>
  );
}

// Re-export for convenience so NotebookView can pluck both
export { type WashiStrip };
