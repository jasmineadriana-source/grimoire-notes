import { useEffect, useRef, useState } from "react";
import { Stroke, Tool } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  X,
  Hand,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  "#1a1a1a", "#ffffff", "#dc2626", "#ea580c", "#eab308",
  "#16a34a", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899",
];

const TOOL_DEFAULTS: Record<Tool, { size: number; color: string; opacity: number }> = {
  pen:         { size: 2.5, color: "#1a1a1a", opacity: 1 },
  pencil:      { size: 1.5, color: "#3a3a3a", opacity: 0.85 },
  highlighter: { size: 18,  color: "#fde047", opacity: 0.35 },
  eraser:      { size: 16,  color: "#000000", opacity: 1 },
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Hoisted outside the main component so React doesn't unmount/remount these
 * buttons (and their lucide SVGs) on every parent render — that was causing
 * the tool icons to flicker/disappear when switching tools. */
const ToolBtn = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Pen;
  label: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={cn(
      "h-9 w-9 rounded-md flex items-center justify-center border transition-all shrink-0 [&_svg]:stroke-[2.25]",
      active
        ? "border-accent bg-gradient-accent text-black accent-glow"
        : "border-border bg-card text-foreground hover:border-accent/60",
    )}
  >
    <Icon className="h-4 w-4" />
  </button>
);

type Props = {
  notebookId: string;
  pageId: string;
  strokes: Stroke[];
};

/** Full-page absolute overlay. Toggles between Write (drawing) and Touch (interact). */
export function AnnotationLayer({ notebookId, pageId, strokes }: Props) {
  const updatePage = useApp((s) => s.updatePage);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveStroke = useRef<Stroke | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Keep latest values in refs so pointer handlers never use stale closures.
  // Without this, switching pages mid-session would commit strokes to the wrong page.
  const strokesRef = useRef(strokes);
  const notebookIdRef = useRef(notebookId);
  const pageIdRef = useRef(pageId);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  useEffect(() => { notebookIdRef.current = notebookId; }, [notebookId]);
  useEffect(() => { pageIdRef.current = pageId; }, [pageId]);

  // Cancel any in-progress stroke when the page changes so it can't leak across pages.
  useEffect(() => {
    liveStroke.current = null;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const [drawing, setDrawing] = useState(false); // tool palette open / canvas active
  const [tool, setTool] = useState<Tool>("pen");
  const [colors, setColors] = useState<Record<Tool, string>>({
    pen: TOOL_DEFAULTS.pen.color,
    pencil: TOOL_DEFAULTS.pencil.color,
    highlighter: TOOL_DEFAULTS.highlighter.color,
    eraser: "#000000",
  });
  const [sizes, setSizes] = useState<Record<Tool, number>>({
    pen: TOOL_DEFAULTS.pen.size,
    pencil: TOOL_DEFAULTS.pencil.size,
    highlighter: TOOL_DEFAULTS.highlighter.size,
    eraser: TOOL_DEFAULTS.eraser.size,
  });

  // Resize observer: keep canvas pixel size in sync with container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      const dpr = window.devicePixelRatio || 1;
      const c = canvasRef.current;
      if (c) {
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        c.style.width = `${rect.width}px`;
        c.style.height = `${rect.height}px`;
        redraw();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw whenever strokes change
  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) => {
    if (s.points.length < 1) return;
    ctx.save();
    const def = TOOL_DEFAULTS[s.tool];
    ctx.globalAlpha = def.opacity;
    ctx.strokeStyle = s.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (s.tool === "highlighter") {
      ctx.globalCompositeOperation = "multiply";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.beginPath();
    const first = s.points[0];
    ctx.moveTo(first.x * w, first.y * h);
    for (let i = 1; i < s.points.length; i++) {
      const p = s.points[i];
      const prev = s.points[i - 1];
      const lw = s.size * (s.tool === "pencil" ? 0.6 + p.p * 0.8 : s.tool === "pen" ? 0.7 + p.p * 0.9 : 1);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(prev.x * w, prev.y * h);
      ctx.lineTo(p.x * w, p.y * h);
      ctx.stroke();
    }
    ctx.restore();
  };

  const redraw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    const { w, h } = sizeRef.current;
    for (const s of strokes) drawStroke(ctx, s, w, h);
    if (liveStroke.current) drawStroke(ctx, liveStroke.current, w, h);
  };

  const pointerDown = (e: React.PointerEvent) => {
    if (!drawing) return;
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    if (tool === "eraser") {
      // hit-test: remove any stroke whose any point is within eraser radius
      const cur = strokesRef.current;
      const radius = sizes.eraser / Math.max(rect.width, rect.height);
      const remaining = cur.filter((s) =>
        !s.points.some((p) => Math.hypot(p.x - x, p.y - y) < radius),
      );
      if (remaining.length !== cur.length) {
        updatePage(notebookIdRef.current, pageIdRef.current, { strokes: remaining });
      }
      liveStroke.current = null;
      return;
    }

    liveStroke.current = {
      id: uid(),
      tool,
      color: colors[tool],
      size: sizes[tool],
      points: [{ x, y, p: pressure }],
    };
    // Tag the stroke with the page it was started on so we can drop it if the user switches pages mid-stroke.
    (liveStroke.current as Stroke & { _pageId?: string })._pageId = pageIdRef.current;
    redraw();
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    if (tool === "eraser" && (e.buttons & 1)) {
      const cur = strokesRef.current;
      const radius = sizes.eraser / Math.max(rect.width, rect.height);
      const remaining = cur.filter((s) =>
        !s.points.some((p) => Math.hypot(p.x - x, p.y - y) < radius),
      );
      if (remaining.length !== cur.length) {
        updatePage(notebookIdRef.current, pageIdRef.current, { strokes: remaining });
      }
      return;
    }

    if (!liveStroke.current) return;
    liveStroke.current.points.push({ x, y, p: pressure });
    redraw();
  };

  const pointerUp = () => {
    if (!liveStroke.current) return;
    const finished = liveStroke.current;
    const startedOn = (finished as Stroke & { _pageId?: string })._pageId;
    liveStroke.current = null;
    // Only commit the stroke if we're still on the page where it started.
    if (finished.points.length > 1 && startedOn === pageIdRef.current) {
      const clean: Stroke = {
        id: finished.id, tool: finished.tool, color: finished.color,
        size: finished.size, points: finished.points,
      };
      updatePage(notebookIdRef.current, pageIdRef.current, {
        strokes: [...strokesRef.current, clean],
      });
    } else {
      redraw();
    }
  };

  const undo = () => {
    const cur = strokesRef.current;
    if (cur.length === 0) return;
    updatePage(notebookIdRef.current, pageIdRef.current, { strokes: cur.slice(0, -1) });
  };

  const clearAll = () => {
    const cur = strokesRef.current;
    if (cur.length === 0) return;
    if (!confirm("Erase all annotations on this page?")) return;
    updatePage(notebookIdRef.current, pageIdRef.current, { strokes: [] });
  };

  const activeColor = colors[tool];
  const activeSize = sizes[tool];

  return (
    <>
      {/* Floating canvas overlay — covers the whole page area */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-20"
        style={{
          touchAction: drawing ? "none" : "auto",
          pointerEvents: drawing ? "auto" : "none",
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />
      </div>

      {/* Floating tool palette (always visible) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-page p-1.5 max-w-[95vw] flex-wrap justify-center animate-fade-in">
        <button
          onClick={() => setDrawing((d) => !d)}
          title={drawing ? "Switch to touch (interact with sheet)" : "Switch to draw (Apple Pencil)"}
          className={cn(
            "h-9 w-9 rounded-md flex items-center justify-center border transition-all",
            !drawing
              ? "border-accent bg-gradient-accent text-black accent-glow"
              : "border-border bg-card text-foreground hover:border-accent/60",
          )}
        >
          <Hand className="h-4 w-4" />
        </button>

        <span className="w-px h-6 bg-border" />

        <ToolBtn active={tool === "pen"} onClick={() => setTool("pen")} icon={Pen} label="Pen" />
        <ToolBtn active={tool === "pencil"} onClick={() => setTool("pencil")} icon={Pencil} label="Pencil" />
        <ToolBtn active={tool === "highlighter"} onClick={() => setTool("highlighter")} icon={Highlighter} label="Highlighter" />
        <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} icon={Eraser} label="Eraser" />

        {tool !== "eraser" && (
          <>
            <span className="w-px h-6 bg-border" />
            {/* Color swatches */}
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColors({ ...colors, [tool]: c })}
                  className={cn(
                    "h-6 w-6 rounded-full border transition-transform",
                    activeColor === c ? "border-foreground scale-110 ring-2 ring-accent" : "border-border",
                  )}
                  style={{ background: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={activeColor}
                onChange={(e) => setColors({ ...colors, [tool]: e.target.value })}
                className="h-7 w-7 rounded-md border border-border cursor-pointer bg-card"
                title="Custom color"
              />
            </div>
          </>
        )}

        <span className="w-px h-6 bg-border" />
        {/* Size slider */}
        <input
          type="range"
          min={tool === "highlighter" ? 8 : 1}
          max={tool === "highlighter" ? 40 : tool === "eraser" ? 50 : 12}
          step={0.5}
          value={activeSize}
          onChange={(e) => setSizes({ ...sizes, [tool]: +e.target.value })}
          className="w-20 sm:w-24 accent-accent"
          title={`Size: ${activeSize}`}
        />

        <span className="w-px h-6 bg-border" />
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearAll} title="Clear all">
          <Trash2 className="h-4 w-4" />
        </Button>
        {drawing && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDrawing(false)} title="Done">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
}
