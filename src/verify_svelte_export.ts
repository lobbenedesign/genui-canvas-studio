/**
 * Standalone verification script (not part of the server runtime).
 * Actually compiles the Svelte component output for several procedural archetypes using
 * the real `svelte/compiler`, to prove the exported .svelte files are not just string
 * templates but genuinely valid, compilable Svelte 5 components.
 *
 * Run with: bun src/verify_svelte_export.ts
 */
import { compile } from "svelte/compiler";
import { GenUICompiler } from "./genui_compiler";
import { toSvelteComponent } from "./svelte_exporter";

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
    const svelteSrc = toSvelteComponent(component);

    try {
      const result = compile(svelteSrc, {
        filename: `${component.name}.svelte`,
        generate: "client",
      });
      if (!result.js || !result.js.code || result.js.code.length === 0) {
        console.error(`❌ EMPTY OUTPUT for "${prompt}"`);
        failures++;
        continue;
      }
      console.log(`✅ "${prompt}" -> ${component.name} (${component.category}, source=${component.generationSource}) compiles as valid Svelte 5 component (${result.js.code.length} bytes JS emitted)`);
    } catch (e: any) {
      console.error(`❌ COMPILE ERROR for "${prompt}":`, e.message);
      failures++;
      continue;
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} archetype(s) FAILED Svelte compilation.`);
    process.exit(1);
  } else {
    console.log(`\nAll ${prompts.length} archetypes produced valid, compiler-verified Svelte 5 components.`);
  }
}

main();
