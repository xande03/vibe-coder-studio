import { useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Crie um dashboard de vendas com gráficos",
  "Landing page para um SaaS de finanças",
  "App full stack de tarefas com backend Node.js",
];

export function CommandInput({
  onSubmit,
  busy,
  hasProject,
}: {
  onSubmit: (value: string) => void;
  busy: boolean;
  hasProject: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  return (
    <div className="border-t border-border p-3">
      {!hasProject && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-elevated px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-all hover:scale-105 hover:border-primary/50 hover:text-foreground hover:shadow-md disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-border bg-elevated p-2 shadow-sm transition-all focus-within:border-primary/60 focus-within:shadow-md">
        <textarea
          ref={ref}
          rows={2}
          value={value}
          disabled={busy}
          placeholder={
            hasProject
              ? "Peça uma alteração: adicione uma página, corrija um bug..."
              : "Descreva o projeto que deseja criar..."
          }
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(value);
            }
          }}
          className="max-h-44 flex-1 resize-none bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => send(value)}
          disabled={busy || !value.trim()}
          aria-label="Enviar solicitação"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow transition-all hover:shadow-md hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-mono-xs text-muted-foreground">
        agnes-2.5-flash · Enter envia, Shift+Enter quebra linha
      </p>
    </div>
  );
}
