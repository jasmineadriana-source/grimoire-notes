import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Menu,
  ChevronLeft,
  Plus,
  FileText,
  Sparkles,
  Trash2,
  Dices,
  Upload,
} from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DiceRoller } from "./DiceRoller";
import { CharacterSheetEditor } from "./CharacterSheetEditor";
import { BlankPage } from "./BlankPage";
import { toast } from "sonner";

export function NotebookView({ onBack }: { onBack: () => void }) {
  const notebookId = useApp((s) => s.activeNotebookId)!;
  const notebook = useApp((s) => s.notebooks.find((n) => n.id === notebookId));
  const activePageId = useApp((s) => s.activePageId);
  const setActivePage = useApp((s) => s.setActivePage);
  const addPage = useApp((s) => s.addPage);
  const deletePage = useApp((s) => s.deletePage);
  const renameNotebook = useApp((s) => s.renameNotebook);

  const [pagesOpen, setPagesOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);

  if (!notebook) return null;
  const activePage = notebook.pages.find((p) => p.id === activePageId) ?? notebook.pages[0];

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
              {p.kind === "character" ? (
                <Sparkles className="h-4 w-4 shrink-0 text-sidebar-primary" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-sidebar-primary" />
              )}
              <span className="flex-1 truncate text-sm font-display">
                {idx + 1}. {p.kind === "character" ? p.sheet?.name || "Character" : p.title}
              </span>
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
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
          onClick={() => addPage(notebook.id, "character")}
        >
          <Sparkles className="h-4 w-4" /> Add character sheet
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
          onClick={() => addPage(notebook.id, "blank")}
        >
          <FileText className="h-4 w-4" /> Add blank page
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2 bg-sidebar-accent/40 text-sidebar-foreground/60 hover:bg-sidebar-accent/60"
          onClick={() => toast("PDF import lands in Phase 2 — once Cloud is enabled.")}
        >
          <Upload className="h-4 w-4" /> Import PDF (soon)
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop / iPad landscape sidebar */}
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
            <span className="text-muted-foreground italic mr-2 hidden sm:inline">Page</span>
            {activePage?.kind === "character"
              ? activePage.sheet?.name || "Character"
              : activePage?.title}
          </div>

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

        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {activePage?.kind === "character" && activePage.sheet && (
            <CharacterSheetEditor
              notebookId={notebook.id}
              pageId={activePage.id}
              sheet={activePage.sheet}
            />
          )}
          {activePage?.kind === "blank" && (
            <BlankPage
              notebookId={notebook.id}
              pageId={activePage.id}
              title={activePage.title}
              text={activePage.text ?? ""}
            />
          )}
        </main>
      </div>
    </div>
  );
}
