/**
 * GenUI Compiler v2 — Real LLM-powered component generation
 *
 * Supports:
 * - Ollama (local, default)
 * - Any OpenAI-compatible endpoint (nexus-local-engine, LM Studio, etc.)
 * - Streaming token callback for SSE
 *
 * When NO LLM is available: returns a clearly-labeled DEMO placeholder,
 * not a fake AI-generated component.
 */

import { toVueSFC } from "./vue_exporter";
import { toSvelteComponent } from "./svelte_exporter";

export interface GeneratedUIComponent {
  componentId: string;
  name: string;
  category: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  fullBundleHtml: string;
  reactCode: string;
  vueCode?: string;
  svelteCode?: string;
  generationSource: string;
  isDemo: boolean;
  prompt: string;
  createdAt: string;
}

interface LLMProvider {
  id: string;
  name: string;
  available: boolean;
  activeModel?: string;
}

const SYSTEM_PROMPT = `You are an expert frontend developer. Generate a modern, interactive UI component as a single HTML5/CSS3/JavaScript module.

REQUIREMENTS:
- Use high-contrast colors: dark backgrounds (#0f172a, #1e293b) with light text (#f8fafc, #e2e8f0)
- Make buttons styled with distinct colors (#2563eb for primary, #10b981 for success, #ef4444 for danger)
- Include real interactivity (event listeners, state changes, animations)
- Use modern CSS: grid, flexbox, border-radius, box-shadow, transitions
- The component must be self-contained (no external dependencies)

Respond with ONLY a valid JSON object, no explanation text:
{
  "name": "Component Name",
  "category": "widget",
  "htmlCode": "<div class='card'>...</div>",
  "cssCode": "body { ... }",
  "jsCode": "// interactive logic"
}`;

export class GenUICompiler {
  private ollamaHost = "http://localhost:11434";

  // ── Public API ──

  async checkOllamaAvailable(): Promise<boolean> {
    return (await this.getAvailableOllamaModel()) !== null;
  }

  async getActiveModelName(): Promise<string | null> {
    return this.getAvailableOllamaModel();
  }

  async getAvailableProviders(): Promise<LLMProvider[]> {
    const providers: LLMProvider[] = [];

    // Ollama
    const ollamaModel = await this.getAvailableOllamaModel();
    providers.push({
      id: "ollama",
      name: "Ollama (Local)",
      available: ollamaModel !== null,
      activeModel: ollamaModel || undefined,
    });

    // Nexus Local Engine (port 3000)
    try {
      const res = await fetch("http://localhost:3000/v1/models", { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const models = data.data || [];
        providers.push({
          id: "nexus",
          name: "Nexus Local Engine",
          available: models.length > 0,
          activeModel: models[0]?.id,
        });
      }
    } catch {}

    // LM Studio (port 1234)
    try {
      const res = await fetch("http://localhost:1234/v1/models", { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const models = data.data || [];
        providers.push({
          id: "lmstudio",
          name: "LM Studio",
          available: models.length > 0,
          activeModel: models[0]?.id,
        });
      }
    } catch {}

    return providers;
  }

  /**
   * Streaming generation: calls the LLM with stream=true and sends tokens
   * via the onToken callback. Returns the final parsed component.
   */
  async compileComponentStreaming(
    prompt: string,
    provider: string = "ollama",
    modelOverride: string | null = null,
    onToken?: (token: string) => void
  ): Promise<GeneratedUIComponent> {
    const trimmed = prompt.trim();
    if (!trimmed) throw new Error("Empty prompt");

    // Try streaming from the appropriate provider
    if (provider === "ollama") {
      return this.streamFromOllama(trimmed, modelOverride, onToken);
    } else {
      return this.streamFromOpenAICompat(trimmed, provider, modelOverride, onToken);
    }
  }

  /**
   * Non-streaming generation (backward compatible endpoint)
   */
  async compileComponent(prompt: string, provider: string = "ollama"): Promise<GeneratedUIComponent> {
    const trimmed = prompt.trim();
    if (!trimmed) throw new Error("Empty prompt");

    try {
      const result = await this.compileComponentStreaming(trimmed, provider);
      return result;
    } catch {
      // No LLM available — return honest demo
      return this.makeDemoPlaceholder(trimmed);
    }
  }

  /**
   * Iterative refinement — requires live LLM, no fake fallback
   */
  async refineComponent(
    current: { name: string; category: string; htmlCode: string; cssCode: string; jsCode: string },
    instruction: string
  ): Promise<GeneratedUIComponent> {
    const trimmedInstruction = (instruction || "").trim();
    if (!trimmedInstruction) throw new Error("Refinement instruction is empty.");

    const activeModel = await this.getAvailableOllamaModel();
    if (!activeModel) {
      throw new Error("No LLM available. Real editing requires a running model — there is no fake fallback.");
    }

    const refinePrompt = `You are an expert frontend developer. Below is an existing HTML5/CSS3/JavaScript component and a user's modification instruction. Apply ONLY the requested change, keeping everything else intact.

CURRENT COMPONENT (name: "${current.name}", category: "${current.category}"):
--- HTML ---
${current.htmlCode}
--- CSS ---
${current.cssCode}
--- JS ---
${current.jsCode}

USER INSTRUCTION: "${trimmedInstruction}"

Respond with ONLY a valid JSON object containing the complete updated component:
{
  "name": "Component Name",
  "category": "${current.category}",
  "htmlCode": "<complete updated html>",
  "cssCode": "<complete updated css>",
  "jsCode": "<complete updated js>"
}`;

    const res = await fetch(`${this.ollamaHost}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: activeModel,
        prompt: refinePrompt,
        stream: false,
        format: "json",
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);

    const data = await res.json();
    const parsed = JSON.parse(data.response || "{}");
    if (!parsed.htmlCode || !parsed.cssCode) {
      throw new Error("LLM returned incomplete refinement (missing htmlCode/cssCode).");
    }

    return this.buildComponent(parsed, `Ollama (${activeModel}) — refined: "${trimmedInstruction.slice(0, 60)}"`, trimmedInstruction, false);
  }

  // ── Private: Streaming Implementations ──

  private async streamFromOllama(
    prompt: string,
    modelOverride: string | null,
    onToken?: (token: string) => void
  ): Promise<GeneratedUIComponent> {
    const model = modelOverride || (await this.getAvailableOllamaModel());
    if (!model) {
      throw new Error("No Ollama model available. Start Ollama and pull a model first.");
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: "${prompt}"`;

    const res = await fetch(`${this.ollamaHost}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: true,
        format: "json",
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);

    // Read streaming NDJSON
    let fullResponse = "";
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Ollama streams NDJSON — each line is a JSON object with a "response" field
      const lines = chunk.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.response) {
            fullResponse += obj.response;
            onToken?.(obj.response);
          }
        } catch {}
      }
    }

    const parsed = this.parseJSONResponse(fullResponse);
    if (!parsed.htmlCode) {
      throw new Error("LLM returned invalid JSON (no htmlCode found).");
    }

    return this.buildComponent(parsed, `Ollama (${model})`, prompt, false);
  }

  private async streamFromOpenAICompat(
    prompt: string,
    provider: string,
    modelOverride: string | null,
    onToken?: (token: string) => void
  ): Promise<GeneratedUIComponent> {
    const endpoints: Record<string, string> = {
      nexus: "http://localhost:3000/v1/chat/completions",
      lmstudio: "http://localhost:1234/v1/chat/completions",
    };

    const baseUrl = endpoints[provider];
    if (!baseUrl) throw new Error(`Unknown provider: ${provider}`);

    // Auto-detect model if not specified
    let model = modelOverride;
    if (!model) {
      const modelsUrl = baseUrl.replace("/chat/completions", "/models");
      try {
        const res = await fetch(modelsUrl, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          model = data.data?.[0]?.id;
        }
      } catch {}
    }
    if (!model) throw new Error(`No model available on ${provider}`);

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        stream: true,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`${provider} returned status ${res.status}`);

    let fullResponse = "";
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const obj = JSON.parse(data);
          const token = obj.choices?.[0]?.delta?.content || "";
          if (token) {
            fullResponse += token;
            onToken?.(token);
          }
        } catch {}
      }
    }

    const parsed = this.parseJSONResponse(fullResponse);
    if (!parsed.htmlCode) throw new Error("LLM returned invalid JSON (no htmlCode found).");

    return this.buildComponent(parsed, `${provider} (${model})`, prompt, false);
  }

  // ── Private: Helpers ──

  private async getAvailableOllamaModel(): Promise<string | null> {
    try {
      const res = await fetch(`${this.ollamaHost}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const models: any[] = data.models || [];
        if (models.length > 0) {
          const preferred = models.find(
            (m) => m.name.includes("llama3") || m.name.includes("qwen") || m.name.includes("granite") || m.name.includes("codestral") || m.name.includes("deepseek")
          );
          return preferred ? preferred.name : models[0].name;
        }
      }
    } catch {}
    return null;
  }

  private parseJSONResponse(raw: string): any {
    // Try direct parse
    try {
      return JSON.parse(raw);
    } catch {}

    // Extract JSON from markdown code blocks or surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }

    return {};
  }

  private buildComponent(
    parsed: any,
    source: string,
    prompt: string,
    isDemo: boolean
  ): GeneratedUIComponent {
    const component: GeneratedUIComponent = {
      componentId: `COMP-${Date.now().toString(36).toUpperCase()}`,
      name: parsed.name || "Generated Component",
      category: parsed.category || "widget",
      htmlCode: parsed.htmlCode || "",
      cssCode: parsed.cssCode || "",
      jsCode: parsed.jsCode || "",
      fullBundleHtml: this.buildFullBundleHtml(parsed.htmlCode || "", parsed.cssCode || "", parsed.jsCode),
      reactCode: parsed.reactCode || this.generateReactWrapper(parsed),
      generationSource: source,
      isDemo,
      prompt,
      createdAt: new Date().toISOString(),
    };
    component.vueCode = toVueSFC(component);
    component.svelteCode = toSvelteComponent(component);
    return component;
  }

  private generateReactWrapper(parsed: any): string {
    const name = (parsed.name || "GeneratedComponent")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(/\s+/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
    return `import React, { useEffect, useRef } from 'react';

export function ${name || "GeneratedComponent"}() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    ${parsed.jsCode ? `// Original generated logic\n    ${parsed.jsCode.split("\n").join("\n    ")}` : "// No interactive logic generated"}
  }, []);

  return (
    <>
      <style>{\`${(parsed.cssCode || "").replace(/`/g, "\\`")}\`}</style>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: \`${(parsed.htmlCode || "").replace(/`/g, "\\`")}\` }} />
    </>
  );
}`;
  }

  public buildFullBundleHtml(htmlCode: string, cssCode: string, jsCode?: string): string {
    const baseReset = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0; padding: 0; min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        background-color: #0f172a; color: #f8fafc;
        display: flex; justify-content: center; align-items: center;
        -webkit-font-smoothing: antialiased;
      }
      input, button, select, textarea { font-family: inherit; font-size: 14px; color: inherit; }
      button {
        cursor: pointer; border-radius: 8px; padding: 9px 16px; font-weight: 600;
        border: 1px solid rgba(255,255,255,0.15); background: #2563eb; color: #ffffff;
        transition: all 0.15s ease;
      }
      button:hover:not(:disabled) { background: #1d4ed8; box-shadow: 0 0 12px rgba(37,99,235,0.4); }
      button:disabled { opacity: 0.45; cursor: not-allowed; }
      input[type="text"], input[type="number"], input[type="email"], input[type="password"],
      input[type="range"], textarea, select {
        background: #1e293b; border: 1px solid #334155; color: #f8fafc;
        border-radius: 8px; padding: 9px 12px; outline: none;
      }
      input:focus, textarea:focus, select:focus {
        border-color: #38bdf8; box-shadow: 0 0 0 2px rgba(56,189,248,0.25);
      }
      .card, .container, .box, [class*="card"], [class*="container"],
      [class*="timer"], [class*="calc"], [class*="widget"] {
        background: #1e293b; border: 1px solid #334155; border-radius: 14px;
        padding: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
      }
    `;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${baseReset}
    ${cssCode || ""}
  </style>
</head>
<body>
  ${htmlCode || ""}
  <script>
    try {
      ${jsCode || ""}
    } catch(err) {
      console.error("GenUI runtime error:", err);
    }
  <\/script>
</body>
</html>`;
  }

  /**
   * Honest demo placeholder when no LLM is available.
   * Clearly labeled as NOT AI-generated.
   */
  private makeDemoPlaceholder(prompt: string): GeneratedUIComponent {
    const html = `<div class="demo-notice">
  <div class="demo-badge">⚠️ DEMO MODE</div>
  <h2>No LLM Available</h2>
  <p>This is a static placeholder — not generated by AI.</p>
  <p class="prompt-echo">Your prompt: "${prompt.slice(0, 100)}"</p>
  <div class="demo-instructions">
    <p>To generate real UI components, start a local LLM:</p>
    <code>ollama run llama3.2:3b</code>
    <p>or</p>
    <code>ollama run qwen2.5-coder:7b</code>
  </div>
</div>`;
    const css = `.demo-notice{text-align:center;max-width:420px;padding:32px;}
.demo-badge{display:inline-block;background:#f59e0b;color:#000;font-weight:700;padding:4px 12px;border-radius:6px;font-size:12px;margin-bottom:16px;letter-spacing:1px;}
h2{margin:0 0 8px;font-size:20px;color:#f8fafc;}
p{color:#94a3b8;font-size:14px;margin:4px 0;}
.prompt-echo{color:#38bdf8;font-style:italic;margin:12px 0;}
.demo-instructions{margin-top:20px;background:#0f172a;padding:16px;border-radius:10px;border:1px solid #334155;}
.demo-instructions p{color:#94a3b8;font-size:13px;}
code{display:block;background:#1e293b;color:#38bdf8;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:13px;margin:6px 0;}`;

    return this.buildComponent(
      { name: "Demo Placeholder", category: "widget", htmlCode: html, cssCode: css, jsCode: "" },
      "DEMO MODE — No LLM running",
      prompt,
      true
    );
  }
}
