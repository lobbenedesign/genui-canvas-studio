import { describe, test, expect } from "bun:test";
import { MODEL_CATALOG } from "../src/model_catalog";

describe("model_catalog data integrity", () => {
  test("catalog is non-empty", () => {
    expect(MODEL_CATALOG.length).toBeGreaterThan(0);
  });

  test("every entry has a unique Ollama pull id", () => {
    const ids = MODEL_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every entry has consistent, sane fields", () => {
    for (const m of MODEL_CATALOG) {
      expect(m.id.length).toBeGreaterThan(0);
      expect(m.name.length).toBeGreaterThan(0);
      expect(["light", "medium", "heavy"]).toContain(m.tier);
      expect(m.vramGB).toBeGreaterThan(0);
      expect(m.diskGB).toBeGreaterThan(0);
      expect(m.contextLength).toBeGreaterThan(0);
      expect(Array.isArray(m.tags)).toBe(true);
    }
  });

  test("tier labels are consistent with the documented VRAM bands", () => {
    for (const m of MODEL_CATALOG) {
      if (m.tier === "light") expect(m.vramGB).toBeLessThanOrEqual(4);
      if (m.tier === "heavy") expect(m.vramGB).toBeGreaterThan(8);
    }
  });
});
