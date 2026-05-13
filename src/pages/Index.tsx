import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { ThemeBridge } from "@/lib/ThemeBridge";
import { Library } from "@/components/Library";
import { NotebookView } from "@/components/NotebookView";
import { Loader2 } from "lucide-react";

const Index = () => {
  const activeNotebookId = useApp((s) => s.activeNotebookId);
  const setActiveNotebook = useApp((s) => s.setActiveNotebook);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

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
