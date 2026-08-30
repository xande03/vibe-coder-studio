import { Code2, Download, Eye, RefreshCw, Rocket } from "lucide-react";
import { type ServerStatus } from "@/lib/project";

export function ProjectToolbar({
  projectName,
  view,
  onViewChange,
  servers,
  fileCount,
  busy,
  onRefresh,
  onDownload,
}: {
  projectName: string;
  view: "preview" | "code";
  onViewChange: (view: "preview" | "code") => void;
  servers: ServerStatus[];
  fileCount: number;
  busy: boolean;
  onRefresh: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-surface/80 px-3 py-2 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary shadow-inner">
          <Rocket className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {projectName || "Projeto sem nome"}
          </p>
          <p className="text-mono-xs text-muted-foreground">
            {fileCount} arquivo{fileCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-border/70 sm:block" />

      <div className="flex items-center gap-1 rounded-full border border-border bg-background/70 p-1 shadow-inner">
        <button
          type="button"
          onClick={() => onViewChange("preview")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            view === "preview"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="size-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => onViewChange("code")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            view === "code"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="size-3.5" />
          Código
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {servers.map((server) => (
          <span
            key={server.name}
            title={server.status}
            className="hidden items-center gap-1.5 rounded-full border border-border bg-elevated/70 px-2.5 py-1 text-mono-xs text-muted-foreground shadow-sm md:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {server.name}
          </span>
        ))}

        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          title="Atualizar preview"
          aria-label="Atualizar preview"
          className="grid size-8 place-items-center rounded-full border border-border bg-elevated/70 text-muted-foreground shadow-sm transition-all hover:shadow-md hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          title="Baixar projeto (.zip)"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-md ring-1 ring-primary/30 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>
    </div>
  );
}
