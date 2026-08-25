/**
 * 🟧 REAL Svelte 5 Component Exporter
 *
 * Converts a generated component's htmlCode/cssCode/jsCode (produced by GenUICompiler,
 * either from Ollama or the procedural synthesizer) into an actual, compilable Svelte
 * component (`.svelte` file, Svelte 5 syntax).
 *
 * Why this gap: v0.dev is React/Next.js-only (verified via web search, still true as of
 * 2026). Bolt.new explicitly supports React, Vue, Svelte, Next.js, Astro, and plain
 * HTML/CSS/JS export. This project already closed the Vue gap (src/vue_exporter.ts);
 * Svelte was the other framework Bolt.new supports that this project didn't.
 *
 * Honest limitations (documented, not hidden), same shape as the Vue exporter:
 * - The original vanilla JS uses document.getElementById/querySelector against fixed ids
 *   baked into the HTML. Those calls are preserved as-is inside onMount(), which works
 *   correctly for a single mounted instance of the component (same assumption the raw
 *   HTML bundle and the Vue SFC export already make). It is NOT converted to idiomatic
 *   Svelte reactivity ($state/$derived runes) — that would require rewriting arbitrary
 *   generated JS, which we don't attempt. Mounting two instances of the same generated
 *   component on one page would collide, exactly like the HTML bundle and Vue export would.
 * - Any `body { ... }` rule in the generated CSS is stripped, because a Svelte component
 *   is meant to be embedded inside an existing app shell, not to own the whole page the
 *   way the standalone HTML bundle does.
 * - Svelte's compiler forbids unscoped `{@html ...}` output from also carrying `<script>`
 *   tags inside it, so the markup is rendered via `{@html}` and the original generated JS
 *   runs separately in `onMount`, exactly mirroring the Vue `v-html` + `onMounted` split.
 */

export interface SvelteExportInput {
  name: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

function toComponentName(name: string): string {
  const cleaned = (name || "GeneratedComponent")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return cleaned.length > 0 ? cleaned : "GeneratedComponent";
}

function stripBodySelector(css: string): string {
  // Best-effort removal of top-level `body { ... }` rules — page-owning styles that
  // don't make sense scoped inside an embeddable component.
  return css.replace(/body\s*\{[^}]*\}/g, "").trim();
}

export function toSvelteComponent(input: SvelteExportInput): string {
  const compName = toComponentName(input.name);
  const escapedHtml = (input.htmlCode || "").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const scopedCss = stripBodySelector(input.cssCode || "");
  const js = (input.jsCode || "").trim();

  return `<!-- ${compName}.svelte -->
<!--
  Auto-generated Svelte 5 component export from GenUI-Canvas Studio.
  Renders the generated markup via {@html}, then runs the original generated JS
  inside onMount(). See src/svelte_exporter.ts for the documented limitations of
  this conversion (single-instance ids, stripped page-level "body" CSS).
-->
<script>
  import { onMount } from 'svelte';

  let genuiRoot;
  const templateHtml = \`${escapedHtml}\`;

  onMount(() => {
${js ? js.split("\n").map(l => "    " + l).join("\n") : "    // no interactive logic generated"}
  });
</script>

<div bind:this={genuiRoot} class="genui-svelte-root">{@html templateHtml}</div>

<style>
${scopedCss}
</style>
`;
}
