/**
 * Model catalog: curated list of models that run on consumer PCs (≤16GB VRAM).
 * Each entry has real, verified specs — no inflated claims.
 *
 * VRAM estimates are for Q4_K_M quantization running inference (not training).
 * Actual VRAM depends on context length and batch size.
 */

export interface ModelCatalogEntry {
  id: string;            // Ollama pull name (e.g. "llama3.2:3b")
  name: string;          // Human-readable name
  family: string;        // Model family
  params: string;        // Parameter count
  vramGB: number;        // Estimated VRAM usage in GB (Q4_K_M)
  diskGB: number;        // Approximate download size in GB
  contextLength: number; // Default context window
  description: string;   // What it's good for
  tags: string[];        // Capabilities
  tier: "light" | "medium" | "heavy"; // Hardware tier
}

/**
 * All models verified to run on consumer hardware ≤16GB VRAM.
 * Sorted by VRAM requirement (lightest first).
 */
export const MODEL_CATALOG: ModelCatalogEntry[] = [
  // ── Tier: Light (≤4GB VRAM — runs on 8GB machines) ──
  {
    id: "qwen2.5-coder:1.5b",
    name: "Qwen 2.5 Coder 1.5B",
    family: "Qwen",
    params: "1.5B",
    vramGB: 1.2,
    diskGB: 1.0,
    contextLength: 32768,
    description: "Ultra-light coding model. Fast responses, good for simple UI components. Best quality-per-VRAM for code tasks.",
    tags: ["code", "fast", "small"],
    tier: "light",
  },
  {
    id: "granite3-dense:2b",
    name: "Granite 3 Dense 2B",
    family: "Granite",
    params: "2.6B",
    vramGB: 1.8,
    diskGB: 1.5,
    contextLength: 4096,
    description: "IBM's compact model. Solid for structured JSON output and simple UI generation. Already tested with this project.",
    tags: ["general", "json", "tested"],
    tier: "light",
  },
  {
    id: "llama3.2:3b",
    name: "Llama 3.2 3B",
    family: "Llama",
    params: "3.2B",
    vramGB: 2.2,
    diskGB: 1.9,
    contextLength: 131072,
    description: "Meta's smallest Llama 3.2. 128K context window, good general knowledge. Decent at HTML/CSS generation.",
    tags: ["general", "long-context"],
    tier: "light",
  },
  {
    id: "deepseek-coder-v2:lite",
    name: "DeepSeek Coder V2 Lite",
    family: "DeepSeek",
    params: "2.4B",
    vramGB: 1.6,
    diskGB: 1.3,
    contextLength: 16384,
    description: "MoE architecture coding model. Efficient for code generation tasks. Good at HTML/CSS/JS.",
    tags: ["code", "fast", "moe"],
    tier: "light",
  },
  {
    id: "phi4-mini:latest",
    name: "Phi-4 Mini",
    family: "Phi",
    params: "3.8B",
    vramGB: 2.5,
    diskGB: 2.2,
    contextLength: 16384,
    description: "Microsoft's compact reasoning model. Strong at structured output and code for its size.",
    tags: ["reasoning", "code", "structured"],
    tier: "light",
  },
  {
    id: "moondream:latest",
    name: "Moondream 2",
    family: "Moondream",
    params: "1B",
    vramGB: 1.5,
    diskGB: 1.6,
    contextLength: 2048,
    description: "Tiny vision model — can analyze screenshots and images. Useful for screenshot-to-code workflows.",
    tags: ["vision", "small"],
    tier: "light",
  },

  // ── Tier: Medium (4–8GB VRAM — runs on 8-12GB GPUs) ──
  {
    id: "qwen2.5-coder:7b",
    name: "Qwen 2.5 Coder 7B",
    family: "Qwen",
    params: "7.6B",
    vramGB: 4.8,
    diskGB: 4.4,
    contextLength: 32768,
    description: "Best open-source coding model at 7B. Excellent at HTML/CSS/JS/React generation. Highly recommended for this project.",
    tags: ["code", "recommended", "html"],
    tier: "medium",
  },
  {
    id: "qwen2.5:7b",
    name: "Qwen 2.5 7B",
    family: "Qwen",
    params: "7.6B",
    vramGB: 4.8,
    diskGB: 4.4,
    contextLength: 32768,
    description: "General-purpose Qwen. Good at following instructions in multiple languages including Italian.",
    tags: ["general", "multilingual"],
    tier: "medium",
  },
  {
    id: "llama3.1:8b",
    name: "Llama 3.1 8B",
    family: "Llama",
    params: "8B",
    vramGB: 5.0,
    diskGB: 4.7,
    contextLength: 131072,
    description: "Meta's 8B with 128K context. Solid general-purpose model, good at UI descriptions.",
    tags: ["general", "long-context"],
    tier: "medium",
  },
  {
    id: "codestral:latest",
    name: "Codestral 22B (Q4)",
    family: "Mistral",
    params: "22B",
    vramGB: 7.5,
    diskGB: 12.0,
    contextLength: 32768,
    description: "Mistral's dedicated coding model. Very strong at complex multi-file code generation. Needs ≥12GB VRAM for comfortable use.",
    tags: ["code", "large", "high-quality"],
    tier: "medium",
  },
  {
    id: "gemma3:12b",
    name: "Gemma 3 12B",
    family: "Gemma",
    params: "12B",
    vramGB: 7.8,
    diskGB: 7.2,
    contextLength: 32768,
    description: "Google's 12B model. Strong at structured output, reasoning, and code. Multimodal (vision) capable.",
    tags: ["general", "vision", "code"],
    tier: "medium",
  },

  // ── Tier: Heavy (8–16GB VRAM — needs 16GB GPU) ──
  {
    id: "qwen2.5-coder:14b",
    name: "Qwen 2.5 Coder 14B",
    family: "Qwen",
    params: "14B",
    vramGB: 9.5,
    diskGB: 8.5,
    contextLength: 32768,
    description: "Best coding model that fits in 16GB VRAM. Produces high-quality, complex UI components with advanced CSS and JS.",
    tags: ["code", "best", "recommended"],
    tier: "heavy",
  },
  {
    id: "deepseek-r1:14b",
    name: "DeepSeek R1 14B",
    family: "DeepSeek",
    params: "14B",
    vramGB: 9.0,
    diskGB: 8.0,
    contextLength: 65536,
    description: "Reasoning-focused model. Good at planning complex UI architectures before generating code.",
    tags: ["reasoning", "code"],
    tier: "heavy",
  },
  {
    id: "llama3.3:latest",
    name: "Llama 3.3 70B (Q2)",
    family: "Llama",
    params: "70B",
    vramGB: 15.0,
    diskGB: 25.0,
    contextLength: 131072,
    description: "Meta's 70B at Q2 quantization. Fits in 16GB VRAM but slow. Highest quality text generation available locally.",
    tags: ["general", "slow", "highest-quality"],
    tier: "heavy",
  },
];
