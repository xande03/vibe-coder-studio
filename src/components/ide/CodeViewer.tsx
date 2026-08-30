import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { languageForPath } from "@/lib/project";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.default })),
);

export function CodeViewer({
  path,
  content,
  onChange,
  dark,
}: {
  path: string | null;
  content: string;
  onChange: (value: string) => void;
  dark: boolean;
}) {
  if (!path) {
    return (
      <div className="grid h-full place-items-center text-mono-xs text-muted-foreground">
        Selecione um arquivo para ver o código.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="text-mono-xs text-surface-foreground">{path}</span>
      </div>
      <Suspense
        fallback={
          <div className="grid flex-1 place-items-center">
            <Loader2 className="size-4 animate-spin text-primary" />
          </div>
        }
      >
        <MonacoEditor
          key={path}
          height="100%"
          theme={dark ? "vs-dark" : "light"}
          language={languageForPath(path)}
          value={content}
          onChange={(v) => onChange(v ?? "")}
          options={{
            fontSize: 12.5,
            fontFamily: "JetBrains Mono, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            tabSize: 2,
            padding: { top: 12 },
          }}
        />
      </Suspense>
    </div>
  );
}
