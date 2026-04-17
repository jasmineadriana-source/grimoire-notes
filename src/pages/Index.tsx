import { useApp } from "@/lib/store";
import { ThemeBridge } from "@/lib/ThemeBridge";
import { Library } from "@/components/Library";
import { NotebookView } from "@/components/NotebookView";

const Index = () => {
  const activeNotebookId = useApp((s) => s.activeNotebookId);
  const setActiveNotebook = useApp((s) => s.setActiveNotebook);

  return (
    <>
      <ThemeBridge />
      {activeNotebookId ? (
        <NotebookView onBack={() => setActiveNotebook(null)} />
      ) : (
        <Library />
      )}
    </>
  );
};

export default Index;
