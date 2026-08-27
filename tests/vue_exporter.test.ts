import { describe, test, expect } from "bun:test";
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc";
import { toVueSFC } from "../src/vue_exporter";
import { ALL_FIXTURES, FIXTURE_INVALID_JS_FROM_LLM } from "./fixtures";

/**
 * Actually compiles every exported .vue string through the real
 * @vue/compiler-sfc, the same way src/verify_vue_export.ts does — this is
 * the automated version of that manual verification script, running against
 * fixed fixture specs instead of live LLM output so it's deterministic in CI.
 */
function compileVueSFCOrThrow(sfc: string, filename: string) {
  const { descriptor, errors: parseErrors } = parse(sfc, { filename });
  if (parseErrors.length > 0) {
    throw new Error(`Parse errors: ${JSON.stringify(parseErrors)}`);
  }
  compileScript(descriptor, { id: "test-id" });
  if (descriptor.template) {
    const tplResult = compileTemplate({
      source: descriptor.template.content,
      filename,
      id: "test-id",
    });
    if (tplResult.errors.length > 0) {
      throw new Error(`Template errors: ${JSON.stringify(tplResult.errors)}`);
    }
  }
}

describe("vue_exporter: toVueSFC produces real, compiler-verified Vue 3 SFCs", () => {
  for (const fixture of ALL_FIXTURES) {
    test(`"${fixture.name.trim()}" compiles as a valid Vue 3 SFC`, () => {
      const sfc = toVueSFC(fixture);
      expect(() => compileVueSFCOrThrow(sfc, `${fixture.name}.vue`)).not.toThrow();
    });
  }

  test("emits <script setup>, v-html mount point and <style scoped>", () => {
    const sfc = toVueSFC(ALL_FIXTURES[0]);
    expect(sfc).toContain("<script setup>");
    expect(sfc).toContain("v-html=\"templateHtml\"");
    expect(sfc).toContain("<style scoped>");
    expect(sfc).toContain("onMounted");
  });

  test("strips top-level body{} rules from the generated CSS (page-owning styles don't belong in an embeddable SFC)", () => {
    const sfc = toVueSFC(ALL_FIXTURES[0]); // FIXTURE_SIMPLE_COUNTER has `body { margin: 0; }`
    const styleBlock = sfc.slice(sfc.indexOf("<style scoped>"));
    expect(styleBlock).not.toContain("margin: 0");
  });

  test("sanitizes a punctuation-heavy, lowercase, multi-word name into a valid PascalCase identifier", () => {
    const sfc = toVueSFC({
      name: "  weird--name!! with   spaces  ",
      category: "form",
      htmlCode: "<div></div>",
      cssCode: "",
      jsCode: "",
    });
    expect(sfc).toMatch(/<!-- WeirdnameWithSpaces\.vue -->/);
  });

  test("falls back to GeneratedComponent when the name has no usable characters", () => {
    const sfc = toVueSFC({ name: "!!!", category: "widget", htmlCode: "<div></div>", cssCode: "", jsCode: "" });
    expect(sfc).toContain("<!-- GeneratedComponent.vue -->");
  });

  test("escapes backticks, ${} and backslashes so the template literal stays syntactically valid", () => {
    const sfc = toVueSFC({
      name: "Escaping Test",
      category: "widget",
      htmlCode: "<div>`backtick` ${notAnExpr} \\backslash\\</div>",
      cssCode: "",
      jsCode: "",
    });
    expect(() => compileVueSFCOrThrow(sfc, "EscapingTest.vue")).not.toThrow();
  });

  test("KNOWN LIMITATION: invalid JS from an upstream LLM (unterminated string spanning lines) breaks Vue compilation too", () => {
    // Reproduces a real failure observed against a live Ollama model
    // (granite3-dense:2b): the generator does not validate jsCode before
    // embedding it verbatim in <script setup>. This is not a bug in the
    // exporter's own logic (every fixture with *valid* JS above compiles
    // cleanly) — it means the "compiler-verified" guarantee is only as
    // strong as the syntactic validity of the upstream jsCode, which an LLM
    // is not guaranteed to produce. See README "Test automatizzati".
    const sfc = toVueSFC(FIXTURE_INVALID_JS_FROM_LLM);
    expect(() => compileVueSFCOrThrow(sfc, "UserRegistrationAndContactForm.vue")).toThrow();
  });
});
