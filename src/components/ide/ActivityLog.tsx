import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  Sparkles,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import type { LogEntry } from "@/lib/project";

function StatusIcon({ status }: { status: LogEntry["status"] }) {
  if (status === "running")
    return <Loader2 className="size-4 animate-spin text-primary" />;
  if (status === "error")
    return <TriangleAlert className="size-4 text-destructive" />;
  return <CheckCircle2 className="size-4 text-success" />;
}

export function ActivityLog({ entries }: { entries: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="rounded-full border border-border bg-elevated p-3 shadow-sm">
          <Sparkles className="size-5 text-primary" />
        </div>
        <h2 className="text-base font-semibold">Descreva o que quer construir</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          O agente planeja a arquitetura, gera o código full stack e mostra cada
          passo aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-xl border border-border bg-elevated/60 shadow-sm">
          <header className="flex items-start gap-2 border-b border-border px-3 py-2.5">
            <Terminal className="mt-0.5 size-4 shrink-0 text-accent" />
            <p className="flex-1 text-sm leading-snug text-foreground">
              {entry.instruction}
            </p>
            <StatusIcon status={entry.status} />
          </header>

          <div className="space-y-2 px-3 py-3">
            <ol className="space-y-1.5">
              {entry.steps.map((step, i) => (
                <li
                  key={`${entry.id}-${i}`}
                  className="flex items-center gap-2 text-mono-xs text-muted-foreground"
                >
                  {entry.status === "running" && i === entry.steps.length - 1 ? (
                    <CircleDashed className="size-3 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="size-3 text-success" />
                  )}
                  {step}
                </li>
              ))}
            </ol>

            {entry.commands && entry.commands.length > 0 && (
              <div className="rounded-lg border border-border bg-background/60 p-2">
                {entry.commands.map((cmd) => (
                  <p key={cmd} className="text-mono-xs text-accent">
                    $ {cmd}
                  </p>
                ))}
              </div>
            )}

            {entry.summary && (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                <p className="text-sm leading-relaxed text-surface-foreground">
                  {entry.summary}
                </p>
                {(entry.changed?.length || entry.deleted?.length) && (
                  <p className="mt-2 text-mono-xs text-muted-foreground">
                    {entry.changed?.length ?? 0} arquivo(s) escrito(s)
                    {entry.deleted?.length
                      ? ` · ${entry.deleted.length} removido(s)`
                      : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
      <div ref={endRef} />
    </div>
  );
}
