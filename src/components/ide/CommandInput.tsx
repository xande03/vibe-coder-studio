import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowUp,
  Bot,
  FileText,
  ImageIcon,
  Lightbulb,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { readUploads, type ProjectFile } from "@/lib/project";

const SUGGESTIONS = [
  "Crie uma landing page moderna para um app de finanças",
  "Monte um dashboard com gráficos de vendas",
  "Crie um jogo da velha com placar e histórico",
  "Gere um portfólio pessoal elegante com tema escuro",
];

export function CommandInput({
  onSubmit,
  busy,
  hasProject,
}: {
  onSubmit: (instruction: string, attachments: ProjectFile[]) => void;
  busy: boolean;
  hasProject: boolean;
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ProjectFile[]>([]);
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSubmit = !busy && (value.trim().length > 0 || attachments.length > 0);

  const submitInstruction = (instruction: string) => {
    const trimmed = instruction.trim();
    if (busy) return;
    if (!trimmed && attachments.length === 0) return;
    onSubmit(
      trimmed || "Integre os arquivos enviados ao projeto.",
      attachments,
    );
    setValue("");
    setAttachments([]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitInstruction(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitInstruction(value);
    }
  };

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setReading(true);
    try {
      const uploaded = await readUploads(Array.from(list));
      setAttachments((prev) => {
        const map = new Map(prev.map((f) => [f.path, f]));
        for (const file of uploaded) map.set(file.path, file);
        return [...map.values()];
      });
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-border/60 bg-elevated/40 p-3">
      {!hasProject && (
        <p className="mb-2 flex items-center gap-1.5 px-1 text-mono-xs text-muted-foreground">
          <Lightbulb className="size-3.5 text-primary" />
          Sugestões para começar
        </p>
      )}

      {!hasProject && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={busy}
              onClick={() => submitInstruction(suggestion)}
              className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-mono-xs text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-95 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {attachments.map((file) => (
            <span
              key={file.path}
              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-border bg-background/70 px-2.5 py-1 text-mono-xs text-muted-foreground shadow-sm"
            >
              {file.content.startsWith("data:image") ? (
                <ImageIcon className="size-3 shrink-0 text-primary" />
              ) : (
                <FileText className="size-3 shrink-0 text-primary" />
              )}
              <span className="truncate">{file.path}</span>
              <button
                type="button"
                aria-label={`Remover ${file.path}`}
                onClick={() =>
                  setAttachments((prev) =>
                    prev.filter((f) => f.path !== file.path),
                  )
                }
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-2xl border border-border/70 bg-background/85 p-2 shadow-inner backdrop-blur transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15"
      >
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Bot className="size-4" />
        </div>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={
            hasProject
              ? "Diga o que o agente deve modificar no projeto..."
              : "Descreva o projeto que você quer construir..."
          }
          className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || reading}
          aria-label="Anexar imagens ou arquivos"
          title="Anexar imagens ou arquivos ao projeto"
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-elevated/70 text-muted-foreground shadow-sm transition-all hover:text-foreground hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {reading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
        </button>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Enviar instrução"
          title="Enviar instrução (Enter)"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </button>
      </form>

      <p className="mt-2 px-1 text-mono-xs text-muted-foreground/70">
        Enter para enviar · Shift+Enter para nova linha · clipe para anexar
        imagens e arquivos
      </p>
    </div>
  );
}
