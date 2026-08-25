/**
 * 🎨 REAL Generative UI Compiler & Live Component Generator
 * Auto-detects local Ollama models (llama3.2:3b, qwen2.5:7b, etc.) or Claude Router (port 3001)
 * with rich multi-archetype procedural generator for distinct UI outputs.
 */

import { toVueSFC } from "./vue_exporter";

export interface GeneratedUIComponent {
  componentId: string;
  name: string;
  category: "calculator" | "dashboard" | "form" | "widget" | "chart" | "timer" | "ecommerce" | "kanban" | "game" | "converter";
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  fullBundleHtml: string;
  reactCode: string;
  vueCode?: string;
  generationSource: string;
}

export class GenUICompiler {
  private ollamaHost = "http://localhost:11434";
  private studioUrl = "http://localhost:3001/api/chat";

  public async compileComponent(prompt: string): Promise<GeneratedUIComponent> {
    const component = await this.compileComponentInner(prompt);
    // Real Vue 3 SFC export, derived from whatever htmlCode/cssCode/jsCode this
    // component ended up with (Ollama-generated or procedurally synthesized) —
    // see src/vue_exporter.ts. Compiler-verified in src/verify_vue_export.ts.
    component.vueCode = toVueSFC(component);
    return component;
  }

  private async compileComponentInner(prompt: string): Promise<GeneratedUIComponent> {
    const trimmed = prompt.trim() || "Calcolatore interattivo";

    // 1. Try local Ollama with dynamic model auto-discovery
    try {
      const activeModel = await this.getAvailableOllamaModel();
      if (activeModel) {
        const systemPrompt = `Sei un esperto frontend developer. Genera un'interfaccia web HTML5/CSS3/JavaScript per: "${trimmed}".
Rispondi con un JSON valido:
{
  "name": "Nome Componente",
  "category": "calculator|dashboard|form|widget|chart|timer|ecommerce|kanban|game|converter",
  "htmlCode": "<div class='card'>...</div>",
  "cssCode": "body { ... }",
  "jsCode": "...",
  "reactCode": "export function Component() { ... }"
}`;

        const res = await fetch(`${this.ollamaHost}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: activeModel,
            prompt: systemPrompt,
            stream: false,
            format: "json"
          }),
          signal: AbortSignal.timeout(45000)
        });

        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.response || "{}");
          if (parsed.htmlCode && parsed.cssCode) {
            const bundle = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${parsed.cssCode}</style></head><body>${parsed.htmlCode}<script>${parsed.jsCode || ""}<\/script></body></html>`;
            return {
              componentId: `COMP-${Date.now().toString().slice(-4)}`,
              name: parsed.name || "AI Generated UI",
              category: parsed.category || "widget",
              htmlCode: parsed.htmlCode,
              cssCode: parsed.cssCode,
              jsCode: parsed.jsCode || "",
              fullBundleHtml: bundle,
              reactCode: parsed.reactCode || `export function CustomUI() { return <div>${parsed.name}</div>; }`,
              generationSource: `Local Ollama (${activeModel})`
            };
          }
        }
      }
    } catch {}

    // 2. Try Claude Local Studio router (Port 3001)
    try {
      const res = await fetch(this.studioUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Genera componente HTML/CSS/JS JSON per: ${trimmed}` }],
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.content || data.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.htmlCode) {
            const bundle = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${parsed.cssCode || ""}</style></head><body>${parsed.htmlCode}<script>${parsed.jsCode || ""}<\/script></body></html>`;
            return {
              componentId: `COMP-${Date.now().toString().slice(-4)}`,
              name: parsed.name || "Claude Router UI",
              category: parsed.category || "widget",
              htmlCode: parsed.htmlCode,
              cssCode: parsed.cssCode || "",
              jsCode: parsed.jsCode || "",
              fullBundleHtml: bundle,
              reactCode: parsed.reactCode || "export function CustomUI() {}",
              generationSource: "Claude Router (Port 3001)"
            };
          }
        }
      }
    } catch {}

    // 3. Multi-Archetype Dynamic Procedural Synthesizer
    return this.synthesizeMultiArchetypeUI(trimmed);
  }

  private async getAvailableOllamaModel(): Promise<string | null> {
    try {
      const res = await fetch(`${this.ollamaHost}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const models: any[] = data.models || [];
        if (models.length > 0) {
          // Prioritize fast instruction models
          const preferred = models.find(m => m.name.includes("llama3.2") || m.name.includes("qwen") || m.name.includes("granite"));
          return preferred ? preferred.name : models[0].name;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Generates completely distinct DOM structures, layouts, and JS logic based on problem domain
   */
  private synthesizeMultiArchetypeUI(prompt: string): GeneratedUIComponent {
    const id = `COMP-${Date.now().toString().slice(-4)}`;
    const lower = prompt.toLowerCase();

    // Archetype A: Calculator / Currency / Math Converter
    if (lower.includes("calc") || lower.includes("somm") || lower.includes("convert") || lower.includes("eur") || lower.includes("usd")) {
      const html = `<div class="app-calc">
  <h2>🧮 Calcolatore Dinamico</h2>
  <div class="display" id="calc-disp">0</div>
  <div class="keypad">
    <button class="btn num">7</button><button class="btn num">8</button><button class="btn num">9</button><button class="btn op">/</button>
    <button class="btn num">4</button><button class="btn num">5</button><button class="btn num">6</button><button class="btn op">*</button>
    <button class="btn num">1</button><button class="btn num">2</button><button class="btn num">3</button><button class="btn op">-</button>
    <button class="btn clear">C</button><button class="btn num">0</button><button class="btn eq">=</button><button class="btn op">+</button>
  </div>
</div>`;
      const css = `body{background:#0f172a;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;}
.app-calc{background:#1e293b;padding:24px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.5);width:280px;}
.display{background:#090d16;padding:16px;font-size:28px;text-align:right;border-radius:8px;margin-bottom:16px;font-family:monospace;color:#38bdf8;overflow:hidden;}
.keypad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.btn{padding:14px;font-size:16px;font-weight:700;border:none;border-radius:8px;background:#334155;color:#fff;cursor:pointer;}
.btn.op{background:#0284c7;color:#fff;}
.btn.eq{background:#10b981;color:#fff;}
.btn.clear{background:#ef4444;color:#fff;}`;
      const js = `let exp = "";
const d = document.getElementById("calc-disp");
document.querySelectorAll(".btn").forEach(b => {
  b.addEventListener("click", () => {
    const t = b.textContent;
    if (t === "C") { exp = ""; d.textContent = "0"; }
    else if (t === "=") { try { exp = eval(exp).toString(); d.textContent = exp; } catch { d.textContent = "Error"; exp = ""; } }
    else { exp += t; d.textContent = exp; }
  });
});`;
      return {
        componentId: id,
        name: "Calcolatore Interattivo",
        category: "calculator",
        htmlCode: html,
        cssCode: css,
        jsCode: js,
        fullBundleHtml: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`,
        reactCode: `export function Calculator() { return <div className="calc">Calculator UI</div>; }`,
        generationSource: "Dynamic Procedural Synthesizer (Calculator Archetype)"
      };
    }

    // Archetype B: Timer / Stopwatch / Pomodoro
    if (lower.includes("timer") || lower.includes("cronometr") || lower.includes("stopwatch") || lower.includes("pomodoro")) {
      const html = `<div class="timer-card">
  <h2>⏱️ Cronometro di Precisione</h2>
  <div class="time-display" id="timer-val">00:00.00</div>
  <div class="timer-controls">
    <button id="start-btn" class="t-btn start">Avvia</button>
    <button id="reset-btn" class="t-btn reset">Reset</button>
  </div>
</div>`;
      const css = `body{background:#030712;color:#f9fafb;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;}
.timer-card{background:#111827;border:1px solid #1f2937;padding:32px;border-radius:20px;text-align:center;width:320px;}
.time-display{font-size:42px;font-weight:800;font-family:monospace;color:#a855f7;margin:24px 0;}
.timer-controls{display:flex;gap:12px;justify-content:center;}
.t-btn{padding:12px 24px;border-radius:10px;font-weight:700;border:none;cursor:pointer;}
.t-btn.start{background:#a855f7;color:#fff;}
.t-btn.reset{background:#374151;color:#d1d5db;}`;
      const js = `let startTime = 0, elapsed = 0, timerId = null;
const disp = document.getElementById("timer-val");
const sBtn = document.getElementById("start-btn");
const rBtn = document.getElementById("reset-btn");
function update() {
  const diff = Date.now() - startTime + elapsed;
  const m = Math.floor(diff / 60000).toString().padStart(2, '0');
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
  const ms = Math.floor((diff % 1000) / 10).toString().padStart(2, '0');
  disp.textContent = m + ":" + s + "." + ms;
}
sBtn.addEventListener("click", () => {
  if (!timerId) {
    startTime = Date.now();
    timerId = setInterval(update, 30);
    sBtn.textContent = "Pausa";
    sBtn.style.background = "#f59e0b";
  } else {
    clearInterval(timerId);
    elapsed += Date.now() - startTime;
    timerId = null;
    sBtn.textContent = "Riprendi";
    sBtn.style.background = "#a855f7";
  }
});
rBtn.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  elapsed = 0;
  disp.textContent = "00:00.00";
  sBtn.textContent = "Avvia";
  sBtn.style.background = "#a855f7";
});`;
      return {
        componentId: id,
        name: "Cronometro ad Alta Precisione",
        category: "timer",
        htmlCode: html,
        cssCode: css,
        jsCode: js,
        fullBundleHtml: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`,
        reactCode: `export function Timer() { return <div className="timer">Timer UI</div>; }`,
        generationSource: "Dynamic Procedural Synthesizer (Timer Archetype)"
      };
    }

    // Archetype C: Form / Lead Registration
    if (lower.includes("form") || lower.includes("registraz") || lower.includes("login") || lower.includes("contatt")) {
      const html = `<div class="form-box">
  <h3>📝 Modulo di Contatto & Registrazione</h3>
  <form id="contact-form">
    <div class="field"><label>Nome Completo</label><input type="text" required placeholder="Mario Rossi"></div>
    <div class="field"><label>Email</label><input type="email" required placeholder="mario@example.com"></div>
    <div class="field"><label>Messaggio</label><textarea rows="3" placeholder="Scrivi qui..."></textarea></div>
    <button type="submit" class="submit-btn">Invia Dati</button>
  </form>
  <div id="form-msg" class="msg hidden">✓ Messaggio inviato con successo!</div>
</div>`;
      const css = `body{background:#040d21;color:#e2e8f0;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;}
.form-box{background:#0b192c;border:1px solid #1e3e62;padding:28px;border-radius:14px;width:340px;}
.field{margin-bottom:14px;}
label{display:block;font-size:12px;margin-bottom:4px;color:#94a3b8;}
input,textarea{width:100%;box-sizing:border-box;background:#00000040;border:1px solid #1e3e62;color:#fff;padding:8px 12px;border-radius:6px;}
.submit-btn{width:100%;padding:10px;background:#008dda;color:#fff;font-weight:700;border:none;border-radius:6px;cursor:pointer;margin-top:8px;}
.msg{margin-top:12px;padding:8px;background:#064e3b;color:#34d399;border-radius:6px;font-size:13px;text-align:center;}
.hidden{display:none;}`;
      const js = `document.getElementById("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("form-msg").classList.remove("hidden");
});`;
      return {
        componentId: id,
        name: "Modulo Registrazione",
        category: "form",
        htmlCode: html,
        cssCode: css,
        jsCode: js,
        fullBundleHtml: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`,
        reactCode: `export function ContactForm() { return <form>Contact Form</form>; }`,
        generationSource: "Dynamic Procedural Synthesizer (Form Archetype)"
      };
    }

    // Default Archetype D: Interactive Dashboard & Task Counter
    const html = `<div class="dash-card">
  <h3>📊 Telemetria & Task Monitor: ${prompt.slice(0, 30)}</h3>
  <div class="metric-row">
    <div class="m-card"><span>Attività</span><strong id="counter-val">0</strong></div>
    <div class="m-card"><span>Stato</span><strong class="green">ATTIVO</strong></div>
  </div>
  <button id="add-btn" class="plus-btn">+ Incrementa Task</button>
</div>`;
    const css = `body{background:#0a0a0c;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;}
.dash-card{background:#18181b;border:1px solid #27272a;padding:24px;border-radius:14px;width:320px;text-align:center;}
.metric-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0;}
.m-card{background:#09090b;padding:12px;border-radius:8px;}
.m-card span{font-size:11px;color:#a1a1aa;display:block;}
.m-card strong{font-size:20px;color:#38bdf8;}
.m-card strong.green{color:#22c55e;}
.plus-btn{width:100%;padding:10px;background:#38bdf8;color:#000;font-weight:700;border:none;border-radius:8px;cursor:pointer;}`;
    const js = `let count = 0;
document.getElementById("add-btn").addEventListener("click", () => {
  count++;
  document.getElementById("counter-val").textContent = count;
});`;
    return {
      componentId: id,
      name: `Dashboard ${prompt.slice(0, 20)}`,
      category: "dashboard",
      htmlCode: html,
      cssCode: css,
      jsCode: js,
      fullBundleHtml: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`,
      reactCode: `export function Dashboard() { return <div>Dashboard</div>; }`,
      generationSource: "Dynamic Procedural Synthesizer (Dashboard Archetype)"
    };
  }
}
