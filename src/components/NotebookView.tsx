import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  Plus,
  FileText,
  Sparkles,
  Trash2,
  Dices,
  Grid3x3,
  AlignJustify,
  Pin,
  PinOff,
  PanelRightClose,
  PanelRightOpen,
  ListOrdered,
  Sword,
  BookOpen,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DiceRoller } from "./DiceRoller";
import { CharacterSheetEditor } from "./CharacterSheetEditor";
import { PaperPage } from "./PaperPage";
import { AnnotationLayer } from "./AnnotationLayer";
import { AddImagesButton, ImagesLayer } from "./ImagesLayer";
import { AddWashiButton, WashiLayer } from "./WashiLayer";
import { WeaponsEditor } from "./WeaponsEditor";
import { SpellbookEditor } from "./SpellbookEditor";
import { toast } from "sonner";

const pageIcon = (k: PageKind) => {
  switch (k) {
    case "character": return Sparkles;
    case "blank": return FileText;
    case "lined": return AlignJustify;
    case "graph": return Grid3x3;
    case "weapons": return Sword;
    case "spells": return BookOpen;
  }
};

export function NotebookView({ onBack }: { onBack: () => void }) {
  const notebookId = useApp((s) => s.activeNotebookId)!;
  const notebook = useApp((s) => s.notebooks.find((n) => n.id === notebookId));
  const activePageId = useApp((s) => s.activePageId);
  const setActivePage = useApp((s) => s.setActivePage);
  const addPage = useApp((s) => s.addPage);
  const deletePage = useApp((s) => s.deletePage);
  const updatePage = useApp((s) => s.updatePage);

  const [diceOpen, setDiceOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [washiDrawStyle, setWashiDrawStyle] = useState<string | null>(null);

  if (!notebook) return null;
  const activePage = notebook.pages.find((p) => p.id === activePageId) ?? notebook.pages[0];

  const strokes = activePage?.strokes ?? [];
  const images = activePage?.images ?? [];
  const washi = activePage?.washi ?? [];
  const pinned = notebook.pages
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.pinned);

  const labelFor = (p: typeof notebook.pages[number]) =>
    p.kind === "character" ? p.sheet?.name || "Character" : p.title;

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center gap-2 px-3 sm:px-4 bg-card/60 backdrop-blur-sm">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 font-display">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Library</span>
          </Button>

          {/* All pages dropdown — replaces left sidebar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 font-display">
                <ListOrdered className="h-4 w-4" />
                <span className="hidden sm:inline">All pages</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-auto">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{notebook.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {notebook.pages.length} page{notebook.pages.length !== 1 ? "s" : ""}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notebook.pages.map((p, idx) => {
                const Icon = pageIcon(p.kind);
                const active = p.id === activePage?.id;
                return (
                  <div
                    key={p.id}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm ${
                      active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    }`}
                    onClick={() => setActivePage(p.id)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate font-display">
                      {idx + 1}. {labelFor(p)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePage(notebook.id, p.id, { pinned: !p.pinned });
                      }}
                      title={p.pinned ? "Unpin from sidebar" : "Pin to sidebar"}
                      aria-label={p.pinned ? "Unpin page" : "Pin page"}
                    >
                      <Pin
                        className={`h-3.5 w-3.5 ${
                          p.pinned
                            ? "fill-primary text-primary"
                            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notebook.pages.length === 1) {
                          toast("A notebook needs at least one page.");
                          return;
                        }
                        deletePage(notebook.id, p.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete page"
                      aria-label="Delete page"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 text-center font-display text-sm sm:text-base truncate px-2">
            {activePage ? labelFor(activePage) : ""}
          </div>

          {activePage && (
            <>
              <AddImagesButton notebookId={notebook.id} pageId={activePage.id} images={images} />
              <AddWashiButton
                notebookId={notebook.id}
                pageId={activePage.id}
                washi={washi}
                onStartDrawing={(styleId) => setWashiDrawStyle(styleId)}
              />
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Page</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Choose a template</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addPage(notebook.id, "character")} className="gap-2 cursor-pointer">
                <Sparkles className="h-4 w-4 text-accent" /> Character Sheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addPage(notebook.id, "blank")} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" /> Blank Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addPage(notebook.id, "lined")} className="gap-2 cursor-pointer">
                <AlignJustify className="h-4 w-4" /> College-Ruled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addPage(notebook.id, "graph")} className="gap-2 cursor-pointer">
                <Grid3x3 className="h-4 w-4" /> Graph Paper
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeSwitcher notebookId={notebook.id} />

          <Dialog open={diceOpen} onOpenChange={setDiceOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 bg-gradient-accent text-primary-foreground hover:opacity-90 font-display">
                <Dices className="h-4 w-4" /> <span className="hidden sm:inline">Dice</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-0 border-none bg-transparent shadow-none">
              <DiceRoller onClose={() => setDiceOpen(false)} />
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 overflow-auto p-3 sm:p-6 pb-24">
            {activePage && (
              <div className="relative mx-auto max-w-4xl">
                {activePage.kind === "character" && activePage.sheet && (
                  <CharacterSheetEditor
                    notebookId={notebook.id}
                    pageId={activePage.id}
                    sheet={activePage.sheet}
                  />
                )}
                {(activePage.kind === "blank" ||
                  activePage.kind === "lined" ||
                  activePage.kind === "graph") && (
                  <PaperPage
                    notebookId={notebook.id}
                    pageId={activePage.id}
                    kind={activePage.kind}
                    title={activePage.title}
                    text={activePage.text ?? ""}
                  />
                )}
                <ImagesLayer
                  notebookId={notebook.id}
                  pageId={activePage.id}
                  images={images}
                />
                <WashiLayer
                  notebookId={notebook.id}
                  pageId={activePage.id}
                  washi={washi}
                  drawStyleId={washiDrawStyle}
                  onFinishDrawing={() => setWashiDrawStyle(null)}
                />
                <AnnotationLayer
                  notebookId={notebook.id}
                  pageId={activePage.id}
                  strokes={strokes}
                />
              </div>
            )}
          </main>

          {/* Right sidebar — pinned pages */}
          <aside
            className={`relative shrink-0 border-l border-border bg-card/40 backdrop-blur-sm transition-[width] duration-300 ${
              rightOpen ? "w-44" : "w-10"
            }`}
          >
            <button
              onClick={() => setRightOpen((v) => !v)}
              className="absolute -left-3 top-3 z-10 h-6 w-6 rounded-full border border-border bg-background shadow-sm flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
              title={rightOpen ? "Collapse pinned pages" : "Expand pinned pages"}
              aria-label={rightOpen ? "Collapse pinned pages" : "Expand pinned pages"}
            >
              {rightOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            </button>

            <div className="h-full overflow-y-auto overscroll-contain scroll-smooth">
              <div className="flex flex-col gap-2 p-2 pt-12">
                {rightOpen && (
                  <p className="px-1 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    Pinned pages
                  </p>
                )}

                {pinned.length === 0 ? (
                  rightOpen ? (
                    <div className="text-[11px] text-muted-foreground italic px-1 leading-snug">
                      No pinned pages yet. Open <span className="font-medium">All pages</span> in the header and tap the pin icon to feature pages here.
                    </div>
                  ) : (
                    <div className="flex justify-center pt-2">
                      <PinOff className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                  )
                ) : (
                  pinned.map(({ p, idx }) => {
                    const active = p.id === activePage?.id;
                    const Icon = pageIcon(p.kind);
                    const label = labelFor(p);
                    return (
                      <div
                        key={p.id}
                        className={`group flex items-center gap-1 rounded-md border transition-colors ${
                          active
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background/60 border-border hover:bg-accent/40"
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            setActivePage(p.id);
                            (e.currentTarget.parentElement as HTMLElement)?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            });
                          }}
                          className={`flex items-center gap-1.5 py-1.5 text-xs font-display text-left flex-1 min-w-0 ${
                            rightOpen ? "px-2.5" : "px-1.5 justify-center"
                          }`}
                          title={`${idx + 1}. ${label}`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {rightOpen && (
                            <span className="flex-1 truncate">
                              {idx + 1}. {label}
                            </span>
                          )}
                        </button>
                        {rightOpen && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePage(notebook.id, p.id, { pinned: false });
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity pr-1.5"
                            title="Unpin"
                            aria-label="Unpin page"
                          >
                            <PinOff className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
