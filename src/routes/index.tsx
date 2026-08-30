import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ActivityLog } from "@/components/ide/ActivityLog";
import { CommandInput } from "@/components/ide/CommandInput";
import { FileTree } from "@/components/ide/FileTree";
import { CodeViewer } from "@/components/ide/CodeViewer";
import { PreviewFrame } from "@/components/ide/PreviewFrame";
import { ProjectToolbar } from "@/components/ide/ProjectToolbar";
import { runAgent } from "@/lib/agent.functions";
import {
  buildPreviewDocument,
  downloadProjectZip,
  mergeFiles,
  type LogEntry,
  type ProjectFile,
  type ServerStatus,
} from "@/lib/project";

export const Route = createFileRoute("/")({
  head: () => ({
    scripts: [
      {
        children: `(function(){try{var t=localStorage.getItem('vibe-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`,
      },
    ],
    meta: [
      { title: "Xerife Brasa — Vibe Coding com agente de IA" },
      {
        name: "description",
        content:
          "Descreva seu projeto em linguagem natural e o agente constrói o código full stack, com preview ao vivo, árvore de arquivos e download em .zip.",
      },
      { property: "og:title", content: "Xerife Brasa — Vibe Coding" },
      {
        property: "og:description",
        content:
          "IDE de vibe coding: o agente planeja, gera e modifica projetos full stack em tempo real.",
      },
    ],
  }),
  component: IdePage,
});

const PROGRESS_STEPS = [
  "Interpretando a solicitação...",
  "Planejando a arquitetura do projeto...",
  "Gerando código (frontend e backend)...",
  "Resolvendo dependências e configurações...",
  "Iniciando servidores e atualizando o preview...",
];

function IdePage() {
  const callAgent = useServerFn(runAgent);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [projectName, setProjectName] = useState("");
  const [activePath, setActivePath] = useState<string | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [busy, setBusy] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const leftPanelRef = useRef<any>(null);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("vibe-theme");
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    window.localStorage.setItem("vibe-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const toggleLeftPanel = useCallback(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (leftPanelOpen) {
      panel.collapse();
    } else {
      panel.expand();
    }
  }, [leftPanelOpen]);

  const previewDoc = useMemo(() => buildPreviewDocument(files), [files]);
  const activeContent =
    files.find((f) => f.path === activePath)?.content ?? "";

  const submit = useCallback(
    async (instruction: string) => {
      const id = `${Date.now()}`;
      setBusy(true);
      setEntries((prev) => [
        ...prev,
        {
          id,
          instruction,
          steps: [PROGRESS_STEPS[0]!],
          status: "running",
          createdAt: Date.now(),
        },
      ]);

      let step = 1;
      const ticker = window.setInterval(() => {
        if (step >= PROGRESS_STEPS.length) return;
        const next = PROGRESS_STEPS[step++]!;
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, steps: [...e.steps, next] } : e,
          ),
        );
      }, 2600);

      try {
        const history = entries
          .filter((e) => e.summary)
          .map((e) => ({ instruction: e.instruction, summary: e.summary! }));

        const result = await callAgent({
          data: { instruction, files, history },
        });

        window.clearInterval(ticker);

        const merged = mergeFiles(files, result.files, result.deleted);
        setFiles(merged);
        if (result.projectName) setProjectName(result.projectName);
        if (result.servers.length > 0) setServers(result.servers);
        else if (servers.length === 0)
          setServers([
            { name: "Frontend", status: "Build concluído" },
            { name: "Backend", status: "Rodando" },
          ]);

        const firstChanged = result.files[0]?.path;
        if (firstChanged) setActivePath(firstChanged.replace(/^\.?\//, ""));
        setPreviewKey((k) => k + 1);

        setEntries((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: "done",
                  steps: [
                    ...e.steps,
                    ...result.plan.slice(0, 6),
                    "Tarefa concluída.",
                  ],
                  summary: result.summary,
                  commands: result.commands,
                  changed: result.files.map((f) => f.path),
                  deleted: result.deleted,
                }
              : e,
          ),
        );
        toast.success("Projeto atualizado pelo agente.");
      } catch (error) {
        window.clearInterval(ticker);
        const message =
          error instanceof Error ? error.message : "Falha inesperada.";
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: "error", summary: message } : e,
          ),
        );
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [callAgent, entries, files, servers.length],
  );

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center gap-3 border-b border-border/60 bg-surface/80 backdrop-blur-xl px-4 py-2.5 shadow-sm">
        <div className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30 transition-transform hover:scale-105">
          <Bot className="size-4" />
        </div>
        <h1 className="text-sm font-bold tracking-tight text-foreground">
          Xerife Brasa
        </h1>
        <span className="rounded-full border border-primary/20 bg-elevated/70 px-3 py-1 text-mono-xs text-muted-foreground shadow-sm backdrop-blur">
          vibe coding · agente de IA
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLeftPanel}
            aria-label={leftPanelOpen ? "Minimizar painel lateral" : "Maximizar painel lateral"}
            title={leftPanelOpen ? "Minimizar painel" : "Maximizar painel"}
            className="grid size-8 place-items-center rounded-full border border-border bg-elevated/70 text-muted-foreground shadow-sm transition-all hover:shadow-md hover:text-foreground active:scale-95"
          >
            {leftPanelOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            className="grid size-8 place-items-center rounded-full border border-border bg-elevated/70 text-muted-foreground shadow-sm transition-all hover:shadow-md hover:text-foreground active:scale-95"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel
          ref={leftPanelRef}
          defaultSize="34"
          minSize="24"
          collapsible
          collapsedSize={0}
          onCollapse={() => setLeftPanelOpen(false)}
          onExpand={() => setLeftPanelOpen(true)}
        >
          <section className="flex h-full flex-col bg-surface/95 backdrop-blur">
            <ActivityLog entries={entries} />
            <CommandInput
              onSubmit={submit}
              busy={busy}
              hasProject={files.length > 0}
            />
          </section>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize="66" minSize="35">
          <section className="flex h-full flex-col bg-surface">
            <ProjectToolbar
              projectName={projectName}
              view={view}
              onViewChange={setView}
              servers={servers}
              fileCount={files.length}
              busy={busy}
              onRefresh={() => setPreviewKey((k) => k + 1)}
              onDownload={() => {
                void downloadProjectZip(files, projectName);
                toast.success("Download iniciado.");
              }}
            />

            {view === "preview" ? (
              <div className="flex-1 overflow-hidden rounded-bl-2xl">
                <PreviewFrame key={previewKey} doc={previewDoc} />
              </div>
            ) : (
              <ResizablePanelGroup orientation="horizontal" className="flex-1">
                <ResizablePanel defaultSize="26" minSize="15">
                  <div className="h-full border-r border-border/60 bg-background/40">
                    <FileTree
                      files={files}
                      activePath={activePath}
                      onSelect={setActivePath}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize="74">
                  <CodeViewer
                    path={activePath}
                    content={activeContent}
                    onChange={(value) =>
                      setFiles((prev) =>
                        prev.map((f) =>
                          f.path === activePath ? { ...f, content: value } : f,
                        ),
                      )
                    }
                    dark={theme === "dark"}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
"
    },
    {
      "path": "src/components/ide/ProjectToolbar.tsx