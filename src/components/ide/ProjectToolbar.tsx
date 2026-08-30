import { Code2, Download, Eye, RefreshCw } from "lucide-react";
import type { ServerStatus } from "@/lib/project";

export function ProjectToolbar({
  projectName,
  view,
  onViewChange,
  servers,
  fileCount,
  onDownload,
  onRefresh,
  busy,
}: {
  projectName: string;
  view: "preview" | "code";
  onViewChange: (view: "preview" | "code") => void;
  servers: ServerStatus[];
  fileCount: number;
  onDownload: () => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{projectName || "novo-projeto"}</span>
        <span className="text-mono-xs text-muted-foreground">
          {fileCount} arquivo(s)
        </span>
      </div>

      <div className="ml-2 flex rounded-lg border border-border bg-elevated p-0.5 shadow-sm">
        {(
          [
            { id: "preview" as const, label: "Preview", Icon: Eye },
            { id: "code" as const, label: "Código", Icon: Code2 },
          ]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
              view === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        {servers.map((server) => (
          <span
            key={server.name}
            className="flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-1 text-mono-xs text-muted-foreground shadow-sm"
          >
            <span
              className={`size-1.5 rounded-full ${
                busy ? "bg-warning animate-pulse" : "bg-success"
              }`}
            />
            {server.name}: {server.status}
          </span>
        ))}

        <button
          type="button"
          onClick={onRefresh}
          aria-label="Recarregar preview"
          className="grid size-8 place-items-center rounded-full border border-border bg-elevated text-muted-foreground shadow-sm transition-all hover:shadow-md hover:text-foreground active:scale-95"
        >
          <RefreshCw className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={fileCount === 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow transition-all hover:shadow-md hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          <Download className="size-3.5" />
          Download .zip
        </button>
      </div>
    </div>
  );
}
