import { describe, test, expect } from "bun:test";
import { compile } from "svelte/compiler";
import { toSvelteComponent } from "../src/svelte_exporter";
import { ALL_FIXTURES, FIXTURE_INVALID_JS_FROM_LLM } from "./fixtures";

/**
 * Actually compiles every exported .svelte string through the real Svelte 5
 * compiler, the same way src/verify_svelte_export.ts does — the automated
 * version of that manual verification script, running against fixed
 * fixture specs instead of live LLM output so it's deterministic in CI.
 */
function compileSvelteOrThrow(src: string, filename: string) {
  const result = compile(src, { filename, generate: "client" });
  if (!result.js || !result.js.code || result.js.code.length === 0) {
    throw new Error(`Empty JS output for ${filename}`);
  }
  return result;
}

describe("svelte_exporter: toSvelteComponent produces real, compiler-verified Svelte 5 components", () => {
  for (const fixture of ALL_FIXTURES) {
    test(`"${fixture.name.trim()}" compiles as a valid Svelte 5 component`, () => {
      const src = toSvelteComponent(fixture);
      expect(() => compileSvelteOrThrow(src, `${fixture.name}.svelte`)).not.toThrow();
    });
  }

  test("emits onMount, {@html} mount point and a plain <style> block", () => {
    const src = toSvelteComponent(ALL_FIXTURES[0]);
    expect(src).toContain("import { onMount } from 'svelte';");
    expect(src).toContain("{@html templateHtml}");
    expect(src).toContain("<style>");
  });

  test("strips top-level body{} rules from the generated CSS", () => {
    const src = toSvelteComponent(ALL_FIXTURES[0]); // has `body { margin: 0; }`
    const styleBlock = src.slice(src.indexOf("<style>"));
    expect(styleBlock).not.toContain("margin: 0");
  });

  test("sanitizes a punctuation-heavy, lowercase, multi-word name into a valid PascalCase identifier", () => {
    const src = toSvelteComponent({
      name: "  weird--name!! with   spaces  ",
      category: "form",
      htmlCode: "<div></div>",
      cssCode: "",
      jsCode: "",
    });
    expect(src).toMatch(/<!-- WeirdnameWithSpaces\.svelte -->/);
  });

  test("escapes backticks, ${} and backslashes so the template literal stays syntactically valid", () => {
    const src = toSvelteComponent({
      name: "Escaping Test",
      category: "widget",
      htmlCode: "<div>`backtick` ${notAnExpr} \\backslash\\</div>",
      cssCode: "",
      jsCode: "",
    });
    expect(() => compileSvelteOrThrow(src, "EscapingTest.svelte")).not.toThrow();
  });

  test("KNOWN LIMITATION: invalid JS from an upstream LLM (unterminated string spanning lines) breaks Svelte compilation too", () => {
    // Same root cause as the Vue equivalent test: reproduces a real failure
    // seen with a live Ollama model (granite3-dense:2b). Confirms the gap is
    // in "jsCode is trusted verbatim", not specific to one target framework.
    const src = toSvelteComponent(FIXTURE_INVALID_JS_FROM_LLM);
    expect(() => compileSvelteOrThrow(src, "UserRegistrationAndContactForm.svelte")).toThrow();
  });
});
