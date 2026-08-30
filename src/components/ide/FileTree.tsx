import { useState } from "react";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { buildTree, type ProjectFile, type TreeNode } from "@/lib/project";

function Node({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (node.type === "file") {
    const active = activePath === node.path;
    return (
      <button
        type="button"
        onClick={() => onSelect(node.path)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left text-mono-xs transition-all rounded-md ${
          active
            ? "bg-primary/12 text-primary"
            : "text-muted-foreground hover:bg-elevated hover:text-foreground"
        }`}
      >
        <File className="size-3.5 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-mono-xs text-surface-foreground transition-all hover:bg-elevated rounded-md"
      >
        {open ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
        {open ? (
          <FolderOpen className="size-3.5 shrink-0 text-accent" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-accent" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open &&
        node.children?.map((child) => (
          <Node
            key={child.path}
            node={child}
            depth={depth + 1}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function FileTree({
  files,
  activePath,
  onSelect,
}: {
  files: ProjectFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = buildTree(files);

  return (
    <div className="h-full overflow-y-auto py-2">
      {tree.length === 0 ? (
        <p className="px-3 py-2 text-mono-xs text-muted-foreground">
          Nenhum arquivo ainda.
        </p>
      ) : (
        tree.map((node) => (
          <Node
            key={node.path}
            node={node}
            depth={0}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
