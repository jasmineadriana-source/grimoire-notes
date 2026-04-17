import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Menu,
  ChevronLeft,
  Plus,
  FileText,
  Sparkles,
  Trash2,
  Dices,
  Grid3x3,
  AlignJustify,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  PinOff,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DiceRoller } from "./DiceRoller";
import { CharacterSheetEditor } from "./CharacterSheetEditor";
import { PaperPage } from "./PaperPage";
import { AnnotationLayer } from "./AnnotationLayer";
import { AddImagesButton, ImagesLayer } from "./ImagesLayer";
import { toast } from "sonner";

const pageIcon = (k: PageKind) => {
  switch (k) {
    case "character": return Sparkles;
    case "blank": return FileText;
    case "lined": return AlignJustify;
    case "graph": return Grid3x3;
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
  const renameNotebook = useApp((s) => s.renameNotebook);

  const [pagesOpen, setPagesOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);

  if (!notebook) return null;
  const activePage = notebook.pages.find((p) => p.id === activePageId) ?? notebook.pages[0];

  const addAnd = (k: PageKind) => {
    addPage(notebook.id, k);
    setPagesOpen(false);
  };

  const PageList = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <input
          value={notebook.name}
          onChange={(e) => renameNotebook(notebook.id, e.target.value)}
          className="bg-transparent font-decorative text-xl w-full outline-none"
        />
        <p className="text-xs text-sidebar-foreground/60 italic mt-1">
          {notebook.pages.length} page{notebook.pages.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {notebook.pages.map((p, idx) => {
          const active = p.id === activePage?.id;
          const Icon = pageIcon(p.kind);
          return (
            <div
              key={p.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60"
              }`}
              onClick={() => {
                setActivePage(p.id);
                setPagesOpen(false);
              }}
            >
              <Icon className="h-4 w-4 shrink-0 text-sidebar-primary" />
              <span className="flex-1 truncate text-sm font-display">
                {idx + 1}. {p.kind === "character" ? p.sheet?.name || "Character" : p.title}
              </span>
              <button
                className={`transition-opacity ${p.pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updatePage(notebook.id, p.id, { pinned: !p.pinned });
                }}
                title={p.pinned ? "Unpin from quick sidebar" : "Pin to quick sidebar"}
                aria-label={p.pinned ? "Unpin page" : "Pin page"}
              >
                {p.pinned ? (
                  <Pin className="h-3.5 w-3.5 fill-sidebar-primary text-sidebar-primary" />
                ) : (
                  <Pin className="h-3.5 w-3.5 text-sidebar-foreground/60 hover:text-sidebar-primary" />
                )}
              </button>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (notebook.pages.length === 1) {
                    toast("A notebook needs at least one page.");
                    return;
                  }
                  deletePage(notebook.id, p.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-sidebar-foreground/60 hover:text-destructive" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="w-full justify-start gap-2 bg-gradient-accent text-primary-foreground font-display"
            >
              <Plus className="h-4 w-4" /> Add page
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Choose a template</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => addAnd("character")} className="gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4 text-accent" /> Character Sheet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addAnd("blank")} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4" /> Blank Page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addAnd("lined")} className="gap-2 cursor-pointer">
              <AlignJustify className="h-4 w-4" /> College-Ruled
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addAnd("graph")} className="gap-2 cursor-pointer">
              <Grid3x3 className="h-4 w-4" /> Graph Paper
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const strokes = activePage?.strokes ?? [];
  const images = activePage?.images ?? [];

  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-72 shrink-0 border-r border-sidebar-border">
        <PageList />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center gap-2 px-3 sm:px-4 bg-card/60 backdrop-blur-sm">
          <Sheet open={pagesOpen} onOpenChange={setPagesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <PageList />
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 font-display">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Library</span>
          </Button>

          <div className="flex-1 text-center font-display text-sm sm:text-base truncate px-2">
            {activePage?.kind === "character"
              ? activePage.sheet?.name || "Character"
              : activePage?.title}
          </div>

          {activePage && (
            <AddImagesButton notebookId={notebook.id} pageId={activePage.id} images={images} />
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
                <AnnotationLayer
                  notebookId={notebook.id}
                  pageId={activePage.id}
                  strokes={strokes}
                />
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
