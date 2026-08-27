import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { parse, compileScript } from "@vue/compiler-sfc";
import { compile as compileSvelte } from "svelte/compiler";
import { GenUICompiler } from "../src/genui_compiler";

/**
 * These tests exercise the deterministic parts of GenUICompiler without any
 * live LLM: pure helpers (buildFullBundleHtml), and the "no LLM reachable"
 * failure/fallback paths. Network calls to Ollama/Nexus/LM Studio are
 * stubbed via a global fetch override, so these tests behave the same in CI
 * (no LLM running) and on a dev machine that happens to have Ollama up.
 */

const realFetch = globalThis.fetch;

function stubNoLLMReachable() {
  // @ts-ignore - test stub
  globalThis.fetch = async () => {
    throw new Error("connection refused (stubbed: no LLM reachable)");
  };
}

describe("GenUICompiler.buildFullBundleHtml (pure, no LLM)", () => {
  const compiler = new GenUICompiler();

  test("wraps html/css/js into a self-contained document with a runtime error guard", () => {
    const html = compiler.buildFullBundleHtml("<div>hi</div>", ".x{color:red}", "console.log('run')");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<div>hi</div>");
    expect(html).toContain(".x{color:red}");
    expect(html).toContain("console.log('run')");
    expect(html).toContain("try {");
    expect(html).toContain("GenUI runtime error");
  });

  test("tolerates missing css/js", () => {
    const html = compiler.buildFullBundleHtml("<p>only html</p>", "");
    expect(html).toContain("<p>only html</p>");
    expect(html).toContain("<!DOCTYPE html>");
  });
});

describe("GenUICompiler.compileComponent — honest demo fallback when no LLM is reachable", () => {
  beforeEach(stubNoLLMReachable);
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("resolves to a clearly-labeled demo component instead of throwing or fabricating AI output", async () => {
    const compiler = new GenUICompiler();
    const result = await compiler.compileComponent("Crea un calcolatore di mutuo");

    expect(result.isDemo).toBe(true);
    expect(result.generationSource).toContain("DEMO MODE");
    expect(result.htmlCode).toContain("DEMO MODE");
    expect(result.htmlCode).not.toContain("undefined");
  });

  test("the demo component's Vue export still compiles as a valid SFC (compiler-verified end to end)", async () => {
    const compiler = new GenUICompiler();
    const result = await compiler.compileComponent("Crea un timer");

    expect(result.vueCode).toBeTruthy();
    const { descriptor, errors } = parse(result.vueCode!, { filename: "Demo.vue" });
    expect(errors.length).toBe(0);
    expect(() => compileScript(descriptor, { id: "demo-id" })).not.toThrow();
  });

  test("the demo component's Svelte export still compiles as a valid Svelte 5 component", async () => {
    const compiler = new GenUICompiler();
    const result = await compiler.compileComponent("Crea una dashboard");

    expect(result.svelteCode).toBeTruthy();
    const out = compileSvelte(result.svelteCode!, { filename: "Demo.svelte", generate: "client" });
    expect(out.js.code.length).toBeGreaterThan(0);
  });

  test("rejects an empty prompt before ever touching the network", async () => {
    const compiler = new GenUICompiler();
    await expect(compiler.compileComponent("   ")).rejects.toThrow("Empty prompt");
  });
});

describe("GenUICompiler.refineComponent — no fake fallback for iterative refinement", () => {
  const baseline = {
    name: "Counter",
    category: "widget",
    htmlCode: "<div>0</div>",
    cssCode: "",
    jsCode: "",
  };

  test("rejects an empty refinement instruction without calling the network", async () => {
    const compiler = new GenUICompiler();
    await expect(compiler.refineComponent(baseline, "   ")).rejects.toThrow(
      "Refinement instruction is empty."
    );
  });

  test("refuses to fabricate a refinement when no LLM is reachable — real error, not a silent no-op", async () => {
    stubNoLLMReachable();
    try {
      const compiler = new GenUICompiler();
      await expect(compiler.refineComponent(baseline, "make the button bigger")).rejects.toThrow(
        "No LLM available"
      );
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
