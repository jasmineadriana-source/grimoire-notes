import { useRef, useState } from "react";
import { PageImage } from "@/lib/types";
import { useApp } from "@/lib/store";
import { Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const uid = () => Math.random().toString(36).slice(2, 10);
const MAX_IMG_BYTES = 4 * 1024 * 1024; // 4MB cap (data URLs in localStorage)

async function fileToDataUrl(file: File): Promise<string> {
  // Downscale large images to keep storage manageable
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  if (file.size < 600_000) return dataUrl;
  // Downscale via canvas to max 1280px
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const max = 1280;
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

export function AddImagesButton({
  notebookId,
  pageId,
  images,
}: {
  notebookId: string;
  pageId: string;
  images: PageImage[];
}) {
  const updatePage = useApp((s) => s.updatePage);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newOnes: PageImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_IMG_BYTES * 2) {
        toast.error(`${f.name} is too large.`);
        continue;
      }
      const src = await fileToDataUrl(f);
      newOnes.push({
        id: uid(),
        src,
        x: 0.1 + Math.random() * 0.1,
        y: 0.1 + Math.random() * 0.1,
        w: 0.35,
      });
    }
    if (newOnes.length > 0) {
      updatePage(notebookId, pageId, { images: [...images, ...newOnes] });
      toast.success(`Added ${newOnes.length} image${newOnes.length > 1 ? "s" : ""}.`);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" /> <span className="hidden sm:inline">Image</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Renders draggable, resizable images on top of the page. */
export function ImagesLayer({
  notebookId,
  pageId,
  images,
  drawingActive,
}: {
  notebookId: string;
  pageId: string;
  images: PageImage[];
  drawingActive?: boolean;
}) {
  const updatePage = useApp((s) => s.updatePage);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const update = (id: string, patch: Partial<PageImage>) =>
    updatePage(notebookId, pageId, {
      images: images.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  const remove = (id: string) =>
    updatePage(notebookId, pageId, { images: images.filter((i) => i.id !== id) });

  const startDrag = (e: React.PointerEvent, img: PageImage) => {
    if (drawingActive) return;
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    dragOffset.current = {
      dx: px - img.x * rect.width,
      dy: py - img.y * rect.height,
    };
    setDragId(img.id);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left - dragOffset.current.dx;
    const py = e.clientY - rect.top - dragOffset.current.dy;
    update(dragId, {
      x: Math.max(0, Math.min(1, px / rect.width)),
      y: Math.max(0, Math.min(1, py / rect.height)),
    });
  };

  const onUp = () => setDragId(null);

  if (images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{ pointerEvents: drawingActive ? "none" : "auto" }}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {images.map((img) => (
        <div
          key={img.id}
          className="absolute group"
          style={{
            left: `${img.x * 100}%`,
            top: `${img.y * 100}%`,
            width: `${img.w * 100}%`,
            cursor: dragId === img.id ? "grabbing" : "grab",
          }}
          onPointerDown={(e) => startDrag(e, img)}
        >
          <img
            src={img.src}
            alt="attachment"
            draggable={false}
            className="w-full rounded-md shadow-page border border-paper-edge select-none"
          />
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                remove(img.id);
              }}
              className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="absolute -bottom-1 -right-1">
            <input
              type="range"
              min={0.1}
              max={0.95}
              step={0.01}
              value={img.w}
              onChange={(e) => update(img.id, { w: +e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-24 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Resize"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
