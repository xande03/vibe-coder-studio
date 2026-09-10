import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FileInput = z.object({ path: z.string(), content: z.string() });

const AgentInput = z.object({
  instruction: z.string().min(1),
  files: z.array(FileInput).default([]),
  history: z
    .array(z.object({ instruction: z.string(), summary: z.string() }))
    .default([]),
});

const SYSTEM_PROMPT = `Você é o Agnes Agent, um agente de engenharia de software autônomo dentro de uma IDE de "vibe coding".

Você constrói e modifica projetos completos (websites, landing pages, web apps, dashboards, extensões de navegador, slides HTML, apps full stack com backend Node.js/Python).

REGRAS CRÍTICAS:
1. Responda SEMPRE e SOMENTE com um objeto JSON válido, sem markdown, sem cercas de código.
2. Formato exato:
{
  "projectName": "nome-curto-em-kebab-case",
  "plan": ["passo curto 1", "passo curto 2", "..."],
  "files": [{ "path": "index.html", "content": "código completo do arquivo" }],
  "deleted": ["caminho/removido.js"],
  "commands": ["npm install", "npm run dev"],
  "servers": [{ "name": "Frontend", "status": "Build concluído" }],
  "summary": "Síntese em português do que foi construído, alterado ou corrigido."
}
3. "files" contém o conteúdo COMPLETO de cada arquivo criado ou alterado (nunca diffs, nunca "...").
4. Só inclua arquivos que precisam ser criados ou modificados neste passo. Mantenha os outros intactos.
5. O preview é renderizado a partir de "index.html" na raiz do projeto. SEMPRE crie/mantenha um index.html na raiz que funcione sem build: HTML + CSS + JS puros ou React via CDN (esm.sh/unpkg) com <script type="module">. Referencie arquivos locais (ex.: src/styles/main.css, src/js/app.js, assets/foto.png) por caminho relativo — eles são resolvidos automaticamente.
6. ARQUITETURA OBRIGATÓRIA: nunca entregue tudo num único arquivo e nunca junte HTML+CSS+JS no mesmo arquivo. Separe o projeto em uma estrutura full stack organizada por camadas e responsabilidades, por exemplo:
   - index.html (apenas markup e referências)
   - src/styles/tokens.css, src/styles/main.css, src/styles/components.css
   - src/js/app.js (bootstrap), src/js/api.js (chamadas HTTP), src/js/state.js, src/js/components/*.js, src/js/utils/*.js
   - server/index.js (API), server/routes/*.js, server/controllers/*.js, server/services/*.js, server/models/*.js, server/db.js
   - package.json, .env.example, README.md
   Adapte os nomes ao stack pedido (Node/Express, Python/FastAPI, etc.), mas mantenha SEMPRE frontend, estilos, lógica e backend em arquivos e pastas separados, com módulos pequenos e coesos.
7. Sempre gere o backend real quando houver dados, autenticação, persistência ou integrações (rotas, controllers, serviços, modelos, migrações/schema). No preview o frontend deve funcionar com dados mock (src/js/mocks.js) quando a API não estiver acessível.
8. Arquivos enviados pelo usuário (imagens, dados, documentos) aparecem no contexto em uploads/ ou assets/. Referencie-os pelos caminhos existentes, integre-os ao layout/lógica e NUNCA reescreva o conteúdo de binários.
9. Escreva código limpo, moderno, responsivo e bonito. Sem placeholders do tipo "TODO".
8. Todos os textos de UI e o summary em português do Brasil.`;

function buildContext(files: { path: string; content: string }[]) {
  if (files.length === 0) return "O projeto está vazio. Construa do zero.";
  return files
    .map(
      (f) =>
        `--- ARQUIVO: ${f.path} ---\n${f.content.length > 12000 ? f.content.slice(0, 12000) + "\n/* ...truncado... */" : f.content}`,
    )
    .join("\n\n");
}

export const runAgent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AgentInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("Chave da API não configurada no servidor.");

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.history.slice(-6).flatMap((h) => [
        { role: "user", content: h.instruction },
        { role: "assistant", content: h.summary },
      ]),
      {
        role: "user",
        content: `ESTADO ATUAL DO PROJETO:\n${buildContext(data.files)}\n\nSOLICITAÇÃO DO USUÁRIO:\n${data.instruction}`,
      },
    ];

    const res = await fetch("https://apihub.agnes-ai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "agnes-2.5-flash",
        messages,
        stream: true,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `O agente não respondeu (${res.status}). ${text.slice(0, 300)}`,
      );
    }

    // Stream is consumed server-side so bytes keep flowing during long generations.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          content += parsed.choices?.[0]?.delta?.content ?? "";
        } catch {
          // ignore malformed keepalive chunks
        }
      }
    }

    const cleaned = content
      .replace(/^\s*```(?:json)?/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("O agente retornou uma resposta inválida.");
    }

    let result: unknown;
    try {
      result = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new Error("Não foi possível interpretar o plano do agente.");
    }

    // O agente às vezes devolve itens em formatos alternativos; normalizamos.
    const LooseFile = z.preprocess((raw) => {
      if (typeof raw === "string") {
        const nl = raw.indexOf("\n");
        return nl === -1
          ? { path: raw.trim(), content: "" }
          : { path: raw.slice(0, nl).trim(), content: raw.slice(nl + 1) };
      }
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        const path = o["path"] ?? o["file"] ?? o["filename"] ?? o["name"];
        const content = o["content"] ?? o["code"] ?? o["source"] ?? "";
        return { path: String(path ?? ""), content: String(content) };
      }
      return { path: "", content: "" };
    }, FileInput);

    const Shape = z.object({
      projectName: z.string().optional(),
      plan: z.array(z.string()).default([]),
      files: z
        .array(LooseFile)
        .default([])
        .transform((fs) => fs.filter((f) => f.path.length > 0)),
      deleted: z.array(z.string()).default([]),
      commands: z.array(z.string()).default([]),
      servers: z
        .array(z.object({ name: z.string(), status: z.string() }))
        .default([]),
      summary: z.string().default("Operação concluída."),
    });

    return Shape.parse(result);
  });
