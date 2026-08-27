# 🎨 GenUI-Canvas Studio

[![Bun](https://img.shields.io/badge/Bun-v1.4+-black.svg?logo=bun)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Engine](https://img.shields.io/badge/Engine-v0%20%26%20OpenUI%20Style-purple.svg)](#-features)

[English 🇬🇧](#english) • [Italiano 🇮🇹](#italiano)

> **A local Generative UI Component Studio (v0 & OpenUI style): describe a UI in natural language, get back a real, runnable component (HTML/CSS/JS) rendered live in a sandboxed iframe, with React (TSX), a real Vue 3 SFC, a real Svelte 5 component, and a raw HTML bundle export. Generation uses a locally running Ollama model when available, falling back to a clearly-labeled, honest "no LLM available" demo placeholder (not a fake AI-generated result), and an existing component can be iteratively refined with a follow-up instruction instead of only being regenerated from scratch.**
>
> *Uno studio locale di componenti Generative UI (stile v0 e OpenUI): descrivi una UI in linguaggio naturale e ottieni un componente reale e funzionante (HTML/CSS/JS), renderizzato live in un iframe sandbox, con esportazione React (TSX), un vero Single File Component Vue 3, un vero componente Svelte 5, e bundle HTML grezzo. La generazione usa un modello Ollama locale quando disponibile, altrimenti mostra un placeholder "nessun LLM disponibile" chiaramente etichettato come demo (non un risultato finto spacciato per generato dall'AI); un componente esistente puo' anche essere raffinato in modo iterativo con un'istruzione di modifica, invece di essere solo rigenerato da zero.*

![GenUI-Canvas Studio Dashboard](./public/screenshot.jpg)

---

> **2026-08-25 update (2):** added a real Svelte 5 component export (`src/svelte_exporter.ts`) plus a real iterative-refinement endpoint (`POST /api/genui/refine` in `server.ts` / `GenUICompiler.refineComponent` in `src/genui_compiler.ts`). Every generated component (Ollama-backed or procedural) is now also converted into an actual `.svelte` file, compiler-verified — not just asserted — by compiling it with the real `svelte/compiler` package in `src/verify_svelte_export.ts` (`bun src/verify_svelte_export.ts`). This closes the remaining framework gap this project had against Bolt.new (React, Vue, Svelte, Next.js, Astro, HTML). Refinement is a genuine v0.dev/bolt.new-style follow-up edit: the current component's HTML/CSS/JS plus a natural-language instruction (e.g. "make the button blue") are sent back to the local Ollama model, which returns the full updated component — this is real re-conditioning on the previous output, not a client-side patch, and it requires a running Ollama model (there is no fake fallback for edits, unlike first-time generation). Both new pieces were verified end-to-end against the real running server: `bun server.ts`, a real `POST /api/genui/compile` call to a live local Ollama model (`granite3-dense:2b`), and the resulting `svelteCode` field fed through the real `svelte/compiler` — confirmed to produce valid, compilable JS output. The Svelte conversion carries the same documented, honest limitation as the Vue export: the generated vanilla JS keeps using `document.getElementById`/`querySelector` against fixed ids (same assumption the HTML bundle and Vue export already make), so it's not idiomatic reactive Svelte (`$state`/`$derived`) and two instances of the same component on one page would collide. Any `body { ... }` rule in the generated CSS is stripped, for the same reason as the Vue export. **Known shared limitation, found during this verification pass:** because Ollama-generated JS is arbitrary model output, it is occasionally invalid JavaScript in its own right (e.g. reassigning a `const`, or misplacing a CSS `@import` inside the `jsCode` field) — when that happens it breaks identically across the standalone HTML bundle, the Vue export, and the Svelte export, since all three embed the same generated JS verbatim. This is a property of the underlying LLM output, not of any one exporter; the compiler-verification scripts prove the *exporter's own template mechanics* are always valid Vue/Svelte, not that every possible Ollama response will be.

> **2026-08-25 update (1):** added a real Vue 3 SFC export (`src/vue_exporter.ts`). Every generated component (Ollama-backed or procedural) is now also converted into an actual `<script setup>` Vue 3 Single File Component, and that conversion is verified — not just asserted — by compiling it with the real `@vue/compiler-sfc` package in `src/verify_vue_export.ts` (`bun src/verify_vue_export.ts`). This closes the "React only" gap this project previously had against Bolt.new and Lovable.dev, which both support Vue output (verified via web search — v0.dev, unlike Bolt/Lovable, is still React/Next.js-only as of 2026). The conversion has a documented limitation: the generated vanilla JS keeps using `document.getElementById`/`querySelector` against fixed ids (same assumption the existing HTML bundle export already makes), so it is not idiomatic reactive Vue and two instances of the same component on one page would collide. See the doc comment at the top of `src/vue_exporter.ts` for details. Any `body { ... }` rule in the generated CSS is also stripped for the Vue export, since an embeddable SFC shouldn't own the page the standalone HTML bundle does.

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
   * Copy clean React (TSX) straight from the code tab, a real Vue 3 `<script setup>` SFC (compiler-verified, see `src/vue_exporter.ts` and `src/verify_vue_export.ts`), a real Svelte 5 component (compiler-verified, see `src/svelte_exporter.ts` and `src/verify_svelte_export.ts`), or the full standalone HTML5/CSS3/JS bundle.
4. **🔁 Iterative Refinement**:
   * Once a component exists, give a follow-up instruction ("add a delete button", "make the header sticky") and the current component is genuinely re-edited by the local Ollama model — the same interaction pattern v0.dev/bolt.new use — via `POST /api/genui/refine`. Requires a live Ollama model; there is no fake fallback for edits.
5. **🔒 100% Local & Free**:
   * Runs offline. When a local Ollama model (e.g. llama3.2, qwen2.5, granite3-dense) is running, it's used for generation; otherwise the app never blocks — it returns a clearly-labeled "⚠️ DEMO MODE" placeholder instead of pretending to be AI output (`GenUICompiler.makeDemoPlaceholder` in `src/genui_compiler.ts`).

---

### 📊 Honest Comparison vs. Similar Tools

This is a small local project, not a rigorous competitive benchmark — the table below reflects our own reading of each tool's publicly documented features, not independent testing.

| Metric / Feature | 🎨 **GenUI-Canvas Studio** | **v0.dev (Vercel)** | **wandb OpenUI** | **tldraw make-real** | **Bolt.new** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Interactive Sandbox**| ✓ Yes (Live State) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes |
| **100% Local Offline** | ✓ Yes (Local Bun + Ollama) | ✗ Cloud SaaS | ✓ Local Python | ✗ Cloud API | ✗ Cloud SaaS |
| **Code Export** | React (TSX) + Vue 3 SFC + Svelte 5 + HTML bundle | React only | ✗ Limited | ✗ HTML only | ✓ React, Vue, Next.js, Svelte, Astro |
| **Monthly Cost** | $0.00 | $20 / month | $0.00 | Pay-per-token | $20 / month |
| **Infinite / Multi-Component Canvas**| ✗ No (single active preview) | ✗ No | ✗ No | ✓ Yes | ✗ No |

*(Verified via web search, August 2026: v0.dev remains React/Next.js-only with no Vue/Svelte/Angular export; Bolt.new supports React, Vue, Svelte, Next.js, Astro, and plain HTML/CSS/JS project export/download.)*

---

### ✅ Test automatizzati / Automated Tests

31 real tests (`bun test`, 153 `expect()` calls, `tests/*.test.ts`), all passing, running in CI (`.github/workflows/ci.yml`, GitHub Actions, `ubuntu-latest`, on every push/PR):

* **Vue 3 export (`tests/vue_exporter.test.ts`)** — every fixture spec is actually run through the real `@vue/compiler-sfc` (`parse` + `compileScript` + `compileTemplate`), the same way `src/verify_vue_export.ts` does manually. Covers a plain interactive component, empty CSS/JS, a punctuation-heavy name, `body{}` stripping, and escaping of backticks/`${}`/backslashes inside the generated markup.
* **Svelte 5 export (`tests/svelte_exporter.test.ts`)** — same fixtures, actually compiled with the real `svelte/compiler` (`generate: "client"`), mirroring `src/verify_svelte_export.ts`.
* **Core compiler logic (`tests/genui_compiler.test.ts`)** — `buildFullBundleHtml` (pure), the honest "no LLM reachable" demo fallback of `compileComponent` (network stubbed via `globalThis.fetch`, so it's deterministic in CI regardless of whether Ollama happens to be running on the host), and `refineComponent`'s two failure paths (empty instruction; no LLM reachable — it throws instead of fabricating a fake edit, by design).
* **Model catalog (`tests/model_catalog.test.ts`)** — structural sanity checks on `src/model_catalog.ts` (unique ids, sane fields, tier/VRAM consistency).

**Does the "compiler-verified export" claim hold up?** Yes for syntactically valid input — every fixture with well-formed JS compiles cleanly through both real compilers. But writing these tests also turned a previously-manual finding into an automated regression test: **`tests/vue_exporter.test.ts` and `tests/svelte_exporter.test.ts` each include a "KNOWN LIMITATION" test, built from JS actually observed coming out of a live Ollama model (`granite3-dense:2b`), that documents a real edge case — if the upstream jsCode itself is invalid JavaScript (e.g. an unterminated string spanning multiple source lines), that same invalid JS is embedded verbatim into the Vue/Svelte `<script>` and breaks compilation there too.** This isn't a bug in either exporter's own template logic (they don't rewrite or validate the JS they're given, by design — see the doc comments in `src/vue_exporter.ts` / `src/svelte_exporter.ts`); it's a real gap between "the exporter's own mechanics are always valid" and "any possible LLM response compiles," and it's now covered by an automated test instead of only a prose note.

**What still needs a live LLM for full manual verification:** the actual prompt→component generation path (`GenUICompiler.compileComponentStreaming`, Ollama/Nexus/LM Studio integration) and `refineComponent`'s success path (an LLM actually returning a valid refined component) are not exercised by the automated suite — they require a running local model and are non-deterministic by nature. `src/verify_vue_export.ts` and `src/verify_svelte_export.ts` remain available as manual, live-LLM verification scripts (`bun src/verify_vue_export.ts` / `bun src/verify_svelte_export.ts`) for that path.

---

### 🛠️ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lobbenedesign/genui-canvas-studio.git
cd genui-canvas-studio

# 2. Install dependencies and run the tests
bun install
bun test

# 3. Run with Bun
bun server.ts
```

Open your browser at **`http://localhost:3010`**.

---

<a name="italiano"></a>
## 🇮🇹 Documentazione in Italiano

### 🏆 Cosa fa davvero GenUI-Canvas Studio

1. **🎨 Generatore Prompt-to-Componente**: descrivi una UI e ottieni un componente reale, renderizzato nel pannello di anteprima. Ogni nuova generazione sostituisce l'anteprima corrente — è uno studio a singolo pannello, non una lavagna infinita multi-nodo (idea per il futuro, non ancora implementata).
2. **⚡ Anteprima Interattiva Reale**: prova subito slider, form e calcoli in un iframe sandbox sicuro.
3. **📦 Esportazione**: copia il componente React (TSX) dalla tab codice, un vero Single File Component Vue 3 `<script setup>` (verificato per compilazione reale, vedi `src/vue_exporter.ts`), un vero componente Svelte 5 (verificato per compilazione reale, vedi `src/svelte_exporter.ts`), oppure il bundle HTML/CSS/JS standalone.
4. **🔁 Raffinamento Iterativo**: una volta generato un componente, si puo' dare un'istruzione di modifica ("aggiungi un pulsante Annulla", "rendi l'header sticky") e il componente corrente viene realmente ri-editato dal modello Ollama locale, tramite `POST /api/genui/refine`. Richiede un modello Ollama attivo; non esiste un fallback finto per le modifiche.
5. **🔒 100% Locale e Gratuito**: gira offline; usa un modello Ollama locale se disponibile, altrimenti mostra un placeholder "⚠️ DEMO MODE" chiaramente etichettato invece di spacciarlo per output AI.

---

### ✅ Test automatizzati

31 test reali (`bun test`, 153 chiamate `expect()`, `tests/*.test.ts`), tutti verdi, eseguiti in CI (`.github/workflows/ci.yml`, GitHub Actions, `ubuntu-latest`, ad ogni push/PR):

* **Export Vue 3 (`tests/vue_exporter.test.ts`)** — ogni spec di fixture viene realmente compilata con `@vue/compiler-sfc` (`parse` + `compileScript` + `compileTemplate`), come fa a mano `src/verify_vue_export.ts`. Copre un componente interattivo semplice, CSS/JS vuoti, un nome pieno di punteggiatura, la rimozione di `body{}`, e l'escaping di backtick/`${}`/backslash nel markup generato.
* **Export Svelte 5 (`tests/svelte_exporter.test.ts`)** — stesse fixture, compilate davvero con `svelte/compiler` (`generate: "client"`), speculare a `src/verify_svelte_export.ts`.
* **Logica core del compiler (`tests/genui_compiler.test.ts`)** — `buildFullBundleHtml` (pura), il fallback demo onesto di `compileComponent` quando nessun LLM e' raggiungibile (rete stubbata via `globalThis.fetch`, quindi deterministico in CI a prescindere da Ollama sulla macchina locale), e i due percorsi di fallimento di `refineComponent` (istruzione vuota; nessun LLM raggiungibile — lancia un errore invece di inventare una modifica finta, per design).
* **Catalogo modelli (`tests/model_catalog.test.ts`)** — controlli strutturali su `src/model_catalog.ts` (id unici, campi sensati, coerenza tier/VRAM).

**Il claim "export verificato dal compilatore" regge davvero?** Si', per input sintatticamente valido — ogni fixture con JS ben formato compila senza errori con entrambi i compilatori reali. Scrivere questi test ha pero' anche trasformato in test di regressione automatico un riscontro finora solo manuale: **sia `tests/vue_exporter.test.ts` che `tests/svelte_exporter.test.ts` includono un test "KNOWN LIMITATION", costruito da JS realmente osservato in output da un modello Ollama live (`granite3-dense:2b`), che documenta un caso limite reale — se il jsCode a monte e' gia' JavaScript non valido (es. una stringa non terminata su piu' righe), quello stesso JS non valido viene incorporato cosi' com'e' nello `<script>` di Vue/Svelte e ne rompe la compilazione anche li.** Non e' un bug nella logica dei due exporter (non riscrivono ne' validano il JS che ricevono, per scelta di design — vedi i commenti in `src/vue_exporter.ts` / `src/svelte_exporter.ts`); e' un divario reale tra "la meccanica dell'exporter e' sempre valida" e "qualsiasi risposta dell'LLM compila", ed ora e' coperto da un test automatico invece che solo da una nota testuale.

**Cosa richiede ancora un LLM live per la verifica manuale completa:** il percorso vero e proprio prompt→componente (`GenUICompiler.compileComponentStreaming`, integrazione Ollama/Nexus/LM Studio) e il percorso di successo di `refineComponent` (un LLM che restituisce davvero un componente raffinato valido) non sono coperti dalla suite automatica — richiedono un modello locale in esecuzione e sono non deterministici per natura. `src/verify_vue_export.ts` e `src/verify_svelte_export.ts` restano disponibili come script di verifica manuale con LLM live (`bun src/verify_vue_export.ts` / `bun src/verify_svelte_export.ts`) per quel percorso.

---

### 🛠️ Avvio Rapido

```bash
git clone https://github.com/lobbenedesign/genui-canvas-studio.git
cd genui-canvas-studio
bun install
bun test
bun server.ts
```

Apri il browser all'indirizzo **`http://localhost:3010`**.

---

## 📄 License
Released under the [MIT License](LICENSE).
