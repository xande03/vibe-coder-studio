import { MonitorPlay } from "lucide-react";

export function PreviewFrame({ doc }: { doc: string }) {
  if (!doc) {
    return (
      <div className="grid h-full place-items-center bg-background/40">
        <div className="flex flex-col items-center gap-2 text-center">
          <MonitorPlay className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            O preview aparece aqui quando o projeto tiver um index.html.
          </p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title="Preview do projeto"
      srcDoc={doc}
      className="h-full w-full border-0 bg-white"
      sandbox="allow-scripts allow-forms allow-modals allow-popups"
    />
  );
}
