import { useApp } from "@/lib/store";

export function BlankPage({
  notebookId,
  pageId,
  title,
  text,
}: {
  notebookId: string;
  pageId: string;
  title: string;
  text: string;
}) {
  const updatePage = useApp((s) => s.updatePage);

  return (
    <div className="page-surface rounded-xl p-6 sm:p-10 mx-auto max-w-4xl animate-fade-in">
      <input
        value={title}
        onChange={(e) => updatePage(notebookId, pageId, { title: e.target.value })}
        className="bg-transparent font-decorative text-3xl sm:text-4xl text-ink text-center w-full outline-none mb-2"
      />
      <div className="ornament-divider mb-4" />
      <textarea
        value={text}
        onChange={(e) => updatePage(notebookId, pageId, { text: e.target.value })}
        placeholder="The page awaits your quill..."
        rows={20}
        className="w-full bg-transparent font-script text-base sm:text-lg text-ink outline-none resize-none leading-9"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 35px, hsl(var(--ink) / 0.18) 35px, hsl(var(--ink) / 0.18) 36px)",
        }}
      />
    </div>
  );
}
