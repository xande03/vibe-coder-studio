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
5. O preview é renderizado a partir de "index.html" na raiz do projeto. SEMPRE crie/mantenha um index.html na raiz que funcione sem build: HTML + CSS + JS puros ou React via CDN (esm.sh/unpkg) com <script type="module">. Referencie styles.css / app.js por caminho relativo — eles são resolvidos automaticamente.
6. Para projetos full stack, gere também o backend real (ex.: server/index.js, requirements.txt, package.json) e faça o frontend funcionar no preview com dados mock quando o backend não estiver acessível.
7. Escreva código limpo, moderno, responsivo e bonito. Sem placeholders do tipo "TODO".
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

    const Shape = z.object({
      projectName: z.string().optional(),
      plan: z.array(z.string()).default([]),
      files: z.array(FileInput).default([]),
      deleted: z.array(z.string()).default([]),
      commands: z.array(z.string()).default([]),
      servers: z
        .array(z.object({ name: z.string(), status: z.string() }))
        .default([]),
      summary: z.string().default("Operação concluída."),
    });

    return Shape.parse(result);
  });
