export type ProjectFile = { path: string; content: string };

export type LogStatus = "running" | "done" | "error";

export type LogEntry = {
  id: string;
  instruction: string;
  steps: string[];
  status: LogStatus;
  summary?: string;
  commands?: string[];
  changed?: string[];
  deleted?: string[];
  createdAt: number;
};

export type ServerStatus = { name: string; status: string };

export function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    py: "python",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    sh: "shell",
    txt: "plaintext",
    env: "plaintext",
  };
  return map[ext] ?? "plaintext";
}

function findFile(files: ProjectFile[], candidates: string[]) {
  for (const candidate of candidates) {
    const hit = files.find((f) => f.path.replace(/^\.?\//, "") === candidate);
    if (hit) return hit;
  }
  return undefined;
}

/** Builds a self-contained document for the live preview iframe. */
export function buildPreviewDocument(files: ProjectFile[]): string {
  const entry =
    findFile(files, ["index.html", "public/index.html", "src/index.html"]) ??
    files.find((f) => f.path.endsWith(".html"));

  if (!entry) return "";

  const baseDir = entry.path.includes("/")
    ? entry.path.slice(0, entry.path.lastIndexOf("/") + 1)
    : "";

  const resolve = (ref: string) => {
    const clean =
      ref.replace(/^\.\//, "").replace(/^\//, "").split("?")[0] ?? "";
    return (
      findFile(files, [baseDir + clean, clean]) ??
      files.find((f) => f.path.endsWith(clean))
    );
  };

  let html = entry.content;

  // Inline local stylesheets.
  html = html.replace(
    /<link[^>]*rel=["']stylesheet["'][^>]*>/gi,
    (tag: string) => {
      const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
      if (!href || /^https?:/i.test(href)) return tag;
      const file = resolve(href);
      return file ? `<style>\n${file.content}\n</style>` : tag;
    },
  );

  // Inline local scripts.
  html = html.replace(
    /<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (tag: string, pre: string, src: string, post: string) => {
      if (/^https?:/i.test(src)) return tag;
      const file = resolve(src);
      if (!file) return tag;
      const attrs = `${pre} ${post}`.replace(/\s+/g, " ").trim();
      const typeAttr = /type=/.test(attrs) ? attrs : `${attrs} type="module"`;
      return `<script ${typeAttr.trim()}>\n${file.content}\n</script>`;
    },
  );

  return html;
}

export type TreeNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: TreeNode[];
};

export function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = file.path.replace(/^\.?\//, "").split("/");
    let level = root;
    let current = "";

    parts.forEach((part, index) => {
      current = current ? `${current}/${part}` : part;
      const isFile = index === parts.length - 1;
      let node = level.find((n) => n.name === part && n.path === current);
      if (!node) {
        node = {
          name: part,
          path: current,
          type: isFile ? "file" : "dir",
          ...(isFile ? {} : { children: [] }),
        };
        level.push(node);
      }
      if (!isFile) level = node.children!;
    });
  }

  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((n) => (n.children ? { ...n, children: sort(n.children) } : n))
      .sort((a, b) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : a.type === "dir"
            ? -1
            : 1,
      );

  return sort(root);
}

export function mergeFiles(
  current: ProjectFile[],
  incoming: ProjectFile[],
  deleted: string[] = [],
): ProjectFile[] {
  const map = new Map(current.map((f) => [f.path, f.content]));
  for (const path of deleted) map.delete(path.replace(/^\.?\//, ""));
  for (const file of incoming) map.set(file.path.replace(/^\.?\//, ""), file.content);
  return [...map.entries()]
    .map(([path, content]) => ({ path, content }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function downloadProjectZip(
  files: ProjectFile[],
  projectName: string,
) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) zip.file(file.path, file.content);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName || "projeto"}.zip`;
  link.click();
  URL.revokeObjectURL(url);
}
