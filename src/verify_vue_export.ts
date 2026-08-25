/**
 * Standalone verification script (not part of the server runtime).
 * Actually compiles the Vue SFC output for every procedural archetype using the real
 * @vue/compiler-sfc, to prove the exported .vue files are not just string templates but
 * genuinely valid, compilable Vue 3 components.
 *
 * Run with: bun src/verify_vue_export.ts
 */
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc";
import { GenUICompiler } from "./genui_compiler";
import { toVueSFC } from "./vue_exporter";

const prompts = [
  "Crea un calcolatore di mutuo interattivo con slider",
  "Crea un cronometro per allenamenti",
  "Crea un modulo di contatto e registrazione",
  "Crea una dashboard di telemetria server",
];

async function main() {
  const compiler = new GenUICompiler();
  let failures = 0;

  for (const prompt of prompts) {
    const component = await compiler.compileComponent(prompt);
    const sfc = toVueSFC(component);

    const { descriptor, errors: parseErrors } = parse(sfc, { filename: `${component.name}.vue` });
    if (parseErrors.length > 0) {
      console.error(`❌ PARSE ERROR for "${prompt}":`, parseErrors);
      failures++;
      continue;
    }

    try {
      compileScript(descriptor, { id: "test-id" });
    } catch (e: any) {
      console.error(`❌ SCRIPT COMPILE ERROR for "${prompt}":`, e.message);
      failures++;
      continue;
    }

    if (descriptor.template) {
      const tplResult = compileTemplate({
        source: descriptor.template.content,
        filename: `${component.name}.vue`,
        id: "test-id",
      });
      if (tplResult.errors.length > 0) {
        console.error(`❌ TEMPLATE COMPILE ERROR for "${prompt}":`, tplResult.errors);
        failures++;
        continue;
      }
    }

    console.log(`✅ "${prompt}" -> ${component.name} (${component.category}, source=${component.generationSource}) compiles as valid Vue 3 SFC`);
  }

  if (failures > 0) {
    console.error(`\n${failures} archetype(s) FAILED Vue SFC compilation.`);
    process.exit(1);
  } else {
    console.log(`\nAll ${prompts.length} archetypes produced valid, compiler-verified Vue 3 SFCs.`);
  }
}

main();
