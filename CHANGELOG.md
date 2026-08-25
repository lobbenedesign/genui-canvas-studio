# Changelog

## 2026-08-25 — real Vue 3 SFC export, closing a named competitive gap

Researched what this project's named competitors actually support today (web search,
August 2026): v0.dev (Vercel) remains React/Next.js-only with no Vue/Svelte/Angular
export, while Bolt.new (StackBlitz) supports React, Vue, Svelte, Next.js, Astro, and
plain HTML/CSS/JS project export. This project's own `README.md` and
`src/competitor_benchmark.ts` already honestly flagged `exportReactVueHTML: false` —
the export UI's own label ("Multi-Framework Exporter (React/Vue/HTML5)") was aspirational
and didn't match reality.

**What was built:**
- `src/vue_exporter.ts`: converts a generated component's `htmlCode`/`cssCode`/`jsCode`
  (from either the Ollama path or the procedural synthesizer) into a real Vue 3
  `<script setup>` Single File Component. Documented, not hidden, limitation: the
  generated vanilla JS keeps its original `document.getElementById`/`querySelector`
  calls (run inside `onMounted()`), which is correct for one mounted instance but not
  idiomatic reactive Vue — the same single-instance assumption the pre-existing raw
  HTML bundle export already makes. `body { ... }` CSS rules are stripped, since an
  embeddable SFC shouldn't own the whole page the way the standalone bundle does.
- `src/genui_compiler.ts`: every `compileComponent()` result now also carries a
  `vueCode` field produced by the exporter above.
- `server.ts` / `public/app.js` / `public/index.html`: the `/api/status` `exportEngines`
  list, the code-export tab (new "Copy Vue 3 SFC" button), and the top chip now
  accurately reflect the Vue export.
- `src/competitor_benchmark.ts`: `exportReactVueHTML` flipped from `false` to `true`
  for this project's own row, with the SFC's documented limitation noted in-line.

**How it was verified — not just asserted:**
- `src/verify_vue_export.ts` (`bun src/verify_vue_export.ts`) actually compiles the
  generated `.vue` output through the real `@vue/compiler-sfc` package (added as a
  devDependency) — `parse()`, `compileScript()`, and `compileTemplate()` — for 4
  different prompts. 3 of the 4 ran through the real local Ollama model
  (`granite3-dense:2b`, confirmed running via `curl localhost:11434/api/tags`) and one
  hit the procedural fallback; all 4 produced valid, compiler-verified Vue 3 SFCs with
  zero parse/compile errors.
- Ran the real server (`bun server.ts`, port 3010) and hit `/api/genui/compile` with a
  live `curl` request (`"Crea un timer pomodoro"`) — the JSON response's `vueCode` field
  contained a real `<script setup>` SFC generated from that live Ollama call, and
  `/api/competitors` returned the updated `exportReactVueHTML: true` row.
- `bun build server.ts --target=bun --outfile=/dev/null` passes with no type/syntax
  errors after wiring `vueCode` through `GeneratedUIComponent`.

No percentage or performance claim is made anywhere in this change — it's a binary
capability (Vue export exists and compiles) verified by actually compiling it, not a
benchmark number.
