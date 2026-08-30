import { CheckCircle2, ChevronRight, FileDiff, FolderX, Loader2, Sparkles, Terminal, XCircle } from "lucide-react";
import { type LogEntry } from "@/lib/project";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Sparkles className="size-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">Nenhuma atividade ainda</p>
        <p className="max-w-[230px] text-mono-xs leading-relaxed text-muted-foreground">
          Descreva o que você quer construir e o agente começa a trabalhar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
      {entries.map((entry) => {
        const status =
          entry.status === "error"
            ? { icon: XCircle, className: "text-red-500" }
            : entry.status === "done"
              ? { icon: CheckCircle2, className: "text-emerald-500" }
              : { icon: Loader2, className: "animate-spin text-primary" };
        const StatusIcon = status.icon;

        return (
          <article
            key={entry.id}
            className={`rounded-2xl border p-3 shadow-sm transition-all ${
              entry.status === "error"
                ? "border-red-500/30 bg-red-500/5"
                : entry.status === "running"
                  ? "border-primary/20 bg-primary/5"
                  : "border-border/60 bg-elevated/60"
            }`}
          >
            <header className="flex items-start gap-2.5">
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-background/80 text-muted-foreground shadow-sm">
                <StatusIcon className={`size-3.5 ${status.className}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-xs font-medium leading-relaxed text-foreground">
                    {entry.instruction}
                  </p>
                  <time className="shrink-0 text-mono-xs text-muted-foreground/70">
                    {formatTime(entry.createdAt)}
                  </time>
                </div>

                {entry.steps.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {entry.steps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-1.5 text-mono-xs text-muted-foreground"
                      >
                        <ChevronRight className="size-3 shrink-0 text-primary/60" />
                        {step}
                      </li>
                    ))}
                  </ul>
                )}

                {entry.summary && (
                  <p className="mt-2 rounded-xl bg-background/70 px-2.5 py-2 text-xs leading-relaxed text-surface-foreground">
                    {entry.summary}
                  </p>
                )}

                {entry.commands && entry.commands.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {entry.commands.map((command, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 overflow-hidden rounded-lg bg-background/80 px-2 py-1 font-mono text-mono-xs text-primary"
                      >
                        <Terminal className="size-3 shrink-0" />
                        <span className="truncate">{command}</span>
                      </div>
                    ))}
                  </div>
                )}

                {entry.changed?.length || entry.deleted?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.changed?.map((path) => (
                      <span
                        key={path}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-mono-xs text-primary"
                      >
                        <FileDiff className="size-3" />
                        <span className="max-w-[180px] truncate">{path}</span>
                      </span>
                    ))}
                    {entry.deleted?.map((path) => (
                      <span
                        key={path}
                        className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-mono-xs text-red-500"
                      >
                        <FolderX className="size-3" />
                        <span className="max-w-[180px] truncate">{path}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </header>
          </article>
        );
      })}
    </div>
  );
}
