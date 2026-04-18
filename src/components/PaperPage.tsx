import { useApp } from "@/lib/store";
import { PageKind } from "@/lib/types";

type Props = {
  notebookId: string;
  pageId: string;
  kind: Extract<PageKind, "blank" | "lined" | "graph">;
  title: string;
  text: string;
};

const surfaces: Record<Props["kind"], { bg: string; lineHeight: string }> = {
  blank: {
    bg: "none",
    lineHeight: "leading-9",
  },
  lined: {
    // College ruled ~7.1mm; we use 28px for screen comfort. Red margin line at left.
    bg: `linear-gradient(to right, transparent 48px, hsl(var(--destructive) / 0.5) 48px, hsl(var(--destructive) / 0.5) 49px, transparent 49px),
         repeating-linear-gradient(transparent, transparent 27px, hsl(195 60% 45% / 0.45) 27px, hsl(195 60% 45% / 0.45) 28px)`,
    lineHeight: "leading-7",
  },
  graph: {
    bg: `repeating-linear-gradient(0deg, transparent, transparent 23px, hsl(var(--ink) / 0.18) 23px, hsl(var(--ink) / 0.18) 24px),
         repeating-linear-gradient(90deg, transparent, transparent 23px, hsl(var(--ink) / 0.18) 23px, hsl(var(--ink) / 0.18) 24px)`,
    lineHeight: "leading-6",
  },
};

export function PaperPage({ notebookId, pageId, kind, title, text }: Props) {
  const updatePage = useApp((s) => s.updatePage);
  const surface = surfaces[kind];

  return (
    <div className="page-surface rounded-xl p-6 sm:p-10 mx-auto max-w-4xl animate-fade-in">
      <input
        value={title}
        onChange={(e) => updatePage(notebookId, pageId, { title: e.target.value })}
        className="bg-transparent font-decorative text-3xl sm:text-4xl text-ink text-center w-full outline-none mb-2"
      />
      <div className="ornament-divider mb-4" />
      {kind === "blank" ? (
        <div
          className="w-full min-h-[640px]"
          aria-label="Blank drawable page"
        />
      ) : (
        <textarea
          value={text}
          onChange={(e) => updatePage(notebookId, pageId, { text: e.target.value })}
          placeholder={
            kind === "graph"
              ? "Sketch maps, draw battle grids, plot dungeons…"
              : "Begin your chronicle…"
          }
          rows={20}
          className={`w-full bg-transparent font-script text-base sm:text-lg text-ink outline-none resize-none ${surface.lineHeight}`}
          style={{
            backgroundImage: surface.bg,
            paddingLeft: kind === "lined" ? "60px" : undefined,
          }}
        />
      )}
