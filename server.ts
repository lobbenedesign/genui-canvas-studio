#!/usr/bin/env bun
/**
 * 🎨 GENUI-CANVAS STUDIO SERVER (v1.0.0)
 * Infinite Generative UI Canvas & Real-Time Streaming Component Studio
 */

import { GenUICompiler } from "./src/genui_compiler";
import { GenUICompetitorBenchmark } from "./src/competitor_benchmark";
import { join } from "path";
import { existsSync } from "fs";

const PORT = Number(process.env.PORT) || 3010;

const compiler = new GenUICompiler();
const benchmark = new GenUICompetitorBenchmark();

console.log(`\n======================================================`);
console.log(`🎨 GENUI-CANVAS STUDIO running on http://localhost:${PORT}`);
console.log(`🖼️ Infinite 2D Component Workspace: Ready`);
console.log(`⚡ Sandboxed Iframe Live Interactive Compiler: Online`);
console.log(`📦 Multi-Framework Exporter (React/Vue/HTML5): Active`);
console.log(`======================================================\n`);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (req.method === "OPTIONS") return new Response(null, { headers });

    // Serve Static UI Assets
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const p = join(__dirname, "public", "index.html");
      return new Response(Bun.file(p), { headers: { "Content-Type": "text/html" } });
    }
    if (url.pathname === "/app.js") {
      const p = join(__dirname, "public", "app.js");
      return new Response(Bun.file(p), { headers: { "Content-Type": "application/javascript" } });
    }
    if (url.pathname === "/style.css") {
      const p = join(__dirname, "public", "style.css");
      return new Response(Bun.file(p), { headers: { "Content-Type": "text/css" } });
    }
    if (url.pathname.startsWith("/public/")) {
      const p = join(__dirname, url.pathname);
      if (existsSync(p)) return new Response(Bun.file(p));
    }

    // 1. Status
    if (url.pathname === "/api/status" && req.method === "GET") {
      return new Response(JSON.stringify({
        status: "online",
        version: "1.0.0-genui",
        canvasMode: "infinite-interactive-grid",
        exportEngines: ["React (TSX)", "Vue 3", "Tailwind HTML5"]
      }), { headers });
    }

    // 2. Generate Component
    if (url.pathname === "/api/genui/compile" && req.method === "POST") {
      try {
        let body: any = {};
        try { body = await req.json(); } catch {}
        const prompt = body.prompt || "Crea un calcolatore di mutuo interattivo con slider";
        const component = compiler.compileComponent(prompt);
        return new Response(JSON.stringify(component), { headers });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // 3. 5-Competitor Matrix
    if (url.pathname === "/api/competitors" && req.method === "GET") {
      return new Response(JSON.stringify(benchmark.getComparison()), { headers });
    }

    return new Response("Not Found", { status: 404, headers });
  }
});
