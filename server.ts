#!/usr/bin/env bun
/**
 * GenUI Component Studio — Server (v2.0)
 * Real prompt-to-component generator with SSE streaming, persistence, and multi-provider LLM.
 */

import { GenUICompiler } from "./src/genui_compiler";
import { MODEL_CATALOG } from "./src/model_catalog";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const PORT = Number(process.env.PORT) || 3010;
const STORE_DIR = join(__dirname, ".genui-store");
const STORE_FILE = join(STORE_DIR, "components.json");

// Ensure store directory exists
if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });

const compiler = new GenUICompiler();

function loadStore(): any[] {
  try {
    if (existsSync(STORE_FILE)) return JSON.parse(readFileSync(STORE_FILE, "utf-8"));
  } catch {}
  return [];
}

function saveStore(components: any[]) {
  writeFileSync(STORE_FILE, JSON.stringify(components, null, 2), "utf-8");
}

console.log(`\n──────────────────────────────────────────`);
console.log(`  GenUI Component Studio v2.0`);
console.log(`  http://localhost:${PORT}`);
console.log(`──────────────────────────────────────────`);
console.log(`  Streaming:  SSE (Server-Sent Events)`);
console.log(`  Storage:    ${STORE_FILE}`);
console.log(`  LLM:        Ollama / OpenAI-compatible`);
console.log(`──────────────────────────────────────────\n`);

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serveMime(ext: string): string {
  return MIME[ext] || "application/octet-stream";
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // ── Static files ──
    if (path === "/" || path === "/index.html") {
      return new Response(Bun.file(join(__dirname, "public", "index.html")), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Serve any file under /public/
    const publicPath = path.startsWith("/public/") ? join(__dirname, path) : join(__dirname, "public", path.slice(1));
    if (existsSync(publicPath) && !path.startsWith("/api/")) {
      const ext = "." + publicPath.split(".").pop();
      return new Response(Bun.file(publicPath), { headers: { "Content-Type": serveMime(ext) } });
    }

    // ── API: Status ──
    if (path === "/api/status" && req.method === "GET") {
      const ollamaAvailable = await compiler.checkOllamaAvailable();
      return new Response(
        JSON.stringify({
          status: "online",
          version: "2.0.0",
          ollamaAvailable,
          activeModel: ollamaAvailable ? await compiler.getActiveModelName() : null,
          storedComponents: loadStore().length,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── API: LLM Providers ──
    if (path === "/api/providers" && req.method === "GET") {
      const providers = await compiler.getAvailableProviders();
      return new Response(JSON.stringify(providers), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── API: Generate (SSE Streaming) ──
    if (path === "/api/genui/stream" && req.method === "POST") {
      let body: any = {};
      try { body = await req.json(); } catch {}
      const prompt = (body.prompt || "").trim();
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Empty prompt" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const provider = body.provider || "ollama";
      const modelOverride = body.model || null;

      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const send = (event: string, data: any) => {
              controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
              send("status", { phase: "starting", message: "Connecting to LLM..." });

              const result = await compiler.compileComponentStreaming(prompt, provider, modelOverride, (token: string) => {
                send("token", { token });
              });

              send("complete", result);
            } catch (err: any) {
              send("error", { message: err.message || "Generation failed" });
            } finally {
              controller.close();
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...corsHeaders,
          },
        }
      );
    }

    // ── API: Generate (non-streaming fallback) ──
    if (path === "/api/genui/compile" && req.method === "POST") {
      try {
        let body: any = {};
        try { body = await req.json(); } catch {}
        const prompt = body.prompt || "";
        const provider = body.provider || "ollama";
        const component = await compiler.compileComponent(prompt, provider);
        return new Response(JSON.stringify(component), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // ── API: Refine ──
    if (path === "/api/genui/refine" && req.method === "POST") {
      try {
        let body: any = {};
        try { body = await req.json(); } catch {}
        const current = body.current;
        const instruction = body.instruction;
        if (!current || !current.htmlCode) {
          return new Response(JSON.stringify({ error: "Missing 'current' component." }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        const refined = await compiler.refineComponent(current, instruction);
        return new Response(JSON.stringify(refined), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // ── API: Store (persistence) ──
    if (path === "/api/store" && req.method === "GET") {
      return new Response(JSON.stringify(loadStore()), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (path === "/api/store" && req.method === "POST") {
      try {
        const component = await req.json();
        const store = loadStore();
        // Replace if same componentId exists, otherwise push
        const idx = store.findIndex((c: any) => c.componentId === component.componentId);
        if (idx >= 0) store[idx] = component;
        else store.push(component);
        saveStore(store);
        return new Response(JSON.stringify({ saved: true, total: store.length }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    if (path.startsWith("/api/store/") && req.method === "DELETE") {
      const id = path.split("/api/store/")[1];
      const store = loadStore().filter((c: any) => c.componentId !== id);
      saveStore(store);
      return new Response(JSON.stringify({ deleted: true, total: store.length }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── API: Models — List Installed ──
    if (path === "/api/models" && req.method === "GET") {
      try {
        const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error("Ollama not responding");
        const data = await res.json();
        const models = (data.models || []).map((m: any) => ({
          name: m.name,
          family: m.details?.family || "unknown",
          params: m.details?.parameter_size || "?",
          quantization: m.details?.quantization_level || "?",
          contextLength: m.details?.context_length || 0,
          sizeBytes: m.size || 0,
          sizeGB: Number((m.size / (1024 * 1024 * 1024)).toFixed(1)),
          capabilities: m.capabilities || [],
          modifiedAt: m.modified_at,
        }));
        return new Response(JSON.stringify({ ollama: true, models }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch {
        return new Response(JSON.stringify({ ollama: false, models: [], error: "Ollama is not running. Start it with: ollama serve" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // ── API: Models — Catalog (recommended for ≤16GB VRAM) ──
    if (path === "/api/models/catalog" && req.method === "GET") {
      // Cross-reference catalog with installed models
      let installed: string[] = [];
      try {
        const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          installed = (data.models || []).map((m: any) => m.name);
        }
      } catch {}

      const catalog = MODEL_CATALOG.map((entry) => ({
        ...entry,
        installed: installed.some((name) => name.startsWith(entry.id.split(":")[0])),
      }));

      return new Response(JSON.stringify(catalog), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── API: Models — Pull (SSE streaming progress) ──
    if (path === "/api/models/pull" && req.method === "POST") {
      let body: any = {};
      try { body = await req.json(); } catch {}
      const modelName = body.model;
      if (!modelName) {
        return new Response(JSON.stringify({ error: "Missing 'model' field" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const send = (data: any) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
              send({ status: "starting", model: modelName });

              const res = await fetch("http://localhost:11434/api/pull", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: modelName, stream: true }),
              });

              if (!res.ok) {
                send({ status: "error", message: `Ollama returned ${res.status}` });
                controller.close();
                return;
              }

              const reader = res.body!.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter(Boolean);
                for (const line of lines) {
                  try {
                    const obj = JSON.parse(line);
                    send({
                      status: obj.status || "downloading",
                      digest: obj.digest,
                      total: obj.total,
                      completed: obj.completed,
                    });
                  } catch {}
                }
              }

              send({ status: "complete", model: modelName });
            } catch (err: any) {
              send({ status: "error", message: err.message });
            } finally {
              controller.close();
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...corsHeaders,
          },
        }
      );
    }

    // ── API: Models — Delete ──
    if (path.startsWith("/api/models/") && req.method === "DELETE") {
      const modelName = decodeURIComponent(path.split("/api/models/")[1]);
      try {
        const res = await fetch("http://localhost:11434/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelName }),
        });
        if (res.ok) {
          return new Response(JSON.stringify({ deleted: true, model: modelName }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } else {
          return new Response(JSON.stringify({ error: `Ollama returned ${res.status}` }), {
            status: res.status,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

// Keep the process alive — prevent Bun from exiting when idle
setInterval(() => {}, 1 << 30); // ~12 days, effectively infinite

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[GenUI] Shutting down...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("\n[GenUI] Shutting down...");
  process.exit(0);
});
