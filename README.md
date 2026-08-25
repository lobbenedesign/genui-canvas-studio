# 🎨 GenUI-Canvas Studio

[![Bun](https://img.shields.io/badge/Bun-v1.4+-black.svg?logo=bun)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Engine](https://img.shields.io/badge/Engine-v0%20%26%20OpenUI%20Style-purple.svg)](#-features)

[English 🇬🇧](#english) • [Italiano 🇮🇹](#italiano)

> **A local Generative UI Component Studio (v0 & OpenUI style): describe a UI in natural language, get back a real, runnable component (HTML/CSS/JS) rendered live in a sandboxed iframe, with React (TSX) and raw HTML bundle export. Generation uses a locally running Ollama model when available, falling back to a deterministic procedural synthesizer.**
>
> *Uno studio locale di componenti Generative UI (stile v0 e OpenUI): descrivi una UI in linguaggio naturale e ottieni un componente reale e funzionante (HTML/CSS/JS), renderizzato live in un iframe sandbox, con esportazione React (TSX) e bundle HTML grezzo. La generazione usa un modello Ollama locale quando disponibile, altrimenti ricade su un sintetizzatore procedurale deterministico.*

![GenUI-Canvas Studio Dashboard](./public/screenshot.jpg)

---

<a name="english"></a>
## 🇬🇧 English Documentation

### 🏆 What GenUI-Canvas Studio Actually Does

Instead of paying recurring cloud subscriptions for single-component sandboxes:

1. **🎨 Prompt-to-Component Generator**:
   * Describe a UI in natural language and get back one real, runnable component (HTML/CSS/JS) rendered in the sandbox. Generating a new component replaces the current preview — this is a single-pane studio, not a multi-node infinite canvas (that's a possible future direction, not implemented yet).
2. **⚡ Live Interactive Sandboxed Iframe**:
   * Test state changes, calculations, sliders, and form inputs live without leaving the studio.
3. **📦 Multi-Framework Export**:
   * Copy clean React (TSX) straight from the code tab; the full HTML5/CSS3/JS bundle is also shown for standalone use. (Vue export is not currently generated — the export UI advertises it but only React and the raw HTML bundle are produced today.)
4. **🔒 100% Local & Free**:
   * Runs offline. When a local Ollama model (e.g. llama3.2, qwen2.5, granite3-dense) is running, it's used for generation; otherwise a deterministic procedural synthesizer produces a component so the app never blocks on a missing model.

---

### 📊 Honest Comparison vs. Similar Tools

This is a small local project, not a rigorous competitive benchmark — the table below reflects our own reading of each tool's publicly documented features, not independent testing.

| Metric / Feature | 🎨 **GenUI-Canvas Studio** | **v0.dev (Vercel)** | **wandb OpenUI** | **tldraw make-real** | **Bolt.new** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Interactive Sandbox**| ✓ Yes (Live State) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes |
| **100% Local Offline** | ✓ Yes (Local Bun + Ollama) | ✗ Cloud SaaS | ✓ Local Python | ✗ Cloud API | ✗ Cloud SaaS |
| **Code Export** | React (TSX) + HTML bundle | React only | ✗ Limited | ✗ HTML only | ✓ React, Next.js |
| **Monthly Cost** | $0.00 | $20 / month | $0.00 | Pay-per-token | $20 / month |
| **Infinite / Multi-Component Canvas**| ✗ No (single active preview) | ✗ No | ✗ No | ✓ Yes | ✗ No |

---

### 🛠️ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lobbenedesign/genui-canvas-studio.git
cd genui-canvas-studio

# 2. Run with Bun
bun server.ts
```

Open your browser at **`http://localhost:3010`**.

---

<a name="italiano"></a>
## 🇮🇹 Documentazione in Italiano

### 🏆 Cosa fa davvero GenUI-Canvas Studio

1. **🎨 Generatore Prompt-to-Componente**: descrivi una UI e ottieni un componente reale, renderizzato nel pannello di anteprima. Ogni nuova generazione sostituisce l'anteprima corrente — è uno studio a singolo pannello, non una lavagna infinita multi-nodo (idea per il futuro, non ancora implementata).
2. **⚡ Anteprima Interattiva Reale**: prova subito slider, form e calcoli in un iframe sandbox sicuro.
3. **📦 Esportazione**: copia il componente React (TSX) dalla tab codice; è mostrato anche il bundle HTML/CSS/JS standalone. (L'export Vue 3 non è implementato: viene generato solo React + bundle HTML.)
4. **🔒 100% Locale e Gratuito**: gira offline; usa un modello Ollama locale se disponibile, altrimenti ricade su un sintetizzatore procedurale deterministico.

---

### 🛠️ Avvio Rapido

```bash
git clone https://github.com/lobbenedesign/genui-canvas-studio.git
cd genui-canvas-studio
bun server.ts
```

Apri il browser all'indirizzo **`http://localhost:3010`**.

---

## 📄 License
Released under the [MIT License](LICENSE).
