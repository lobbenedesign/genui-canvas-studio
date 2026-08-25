/**
 * 🟩 REAL Vue 3 SFC Exporter
 *
 * Converts a generated component's htmlCode/cssCode/jsCode (produced by GenUICompiler,
 * either from Ollama or the procedural synthesizer) into an actual, compilable Vue 3
 * Single File Component using <script setup>.
 *
 * Honest limitations (documented, not hidden):
 * - The original vanilla JS uses document.getElementById/querySelector against fixed ids
 *   baked into the HTML. Those calls are preserved as-is inside onMounted(), which works
 *   correctly for a single mounted instance of the component (same assumption the raw
 *   HTML bundle export already makes). It is NOT converted to idiomatic Vue reactivity
 *   (refs/computed) — that would require rewriting arbitrary generated JS, which we don't
 *   attempt. Mounting two instances of the same generated component on one page would
 *   collide, exactly like the HTML bundle would.
 * - Any `body { ... }` rule in the generated CSS is stripped, because a Vue SFC is meant
 *   to be embedded inside an existing app shell, not to own the whole page the way the
 *   standalone HTML bundle does.
 */

export interface VueExportInput {
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

export function toVueSFC(input: VueExportInput): string {
  const compName = toComponentName(input.name);
  const escapedHtml = (input.htmlCode || "").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const scopedCss = stripBodySelector(input.cssCode || "");
  const js = (input.jsCode || "").trim();

  return `<!-- ${compName}.vue -->
<!--
  Auto-generated Vue 3 SFC export from GenUI-Canvas Studio.
  Uses <script setup> + v-html to mount the generated markup, then runs the
  original generated JS inside onMounted(). See src/vue_exporter.ts for the
  documented limitations of this conversion (single-instance ids, stripped
  page-level "body" CSS).
-->
<template>
  <div ref="genuiRoot" class="genui-vue-root" v-html="templateHtml"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const genuiRoot = ref(null)
const templateHtml = \`${escapedHtml}\`

onMounted(() => {
${js ? js.split("\n").map(l => "  " + l).join("\n") : "  // no interactive logic generated"}
})
</script>

<style scoped>
${scopedCss}
</style>
`;
}
