/**
 * GenUI Component Studio v2 — Client
 * SSE streaming, component persistence, library, code viewer with syntax highlighting
 */

let currentComponent = null;
let refinementHistory = [];
let activeCodeLang = "html";
let selectedModel = null; // null = auto-detect, string = forced model name

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initStudio();
  initCodeViewer();
  initPreviewToolbar();
  initModels();
  checkStatus();
  loadLibrary();
});

// ── Status Check ──
async function checkStatus() {
  const dot = document.getElementById("llm-status");
  const text = document.getElementById("llm-status-text");
  const select = document.getElementById("provider-select");

  try {
    const [statusRes, providersRes] = await Promise.all([
      fetch("/api/status"),
      fetch("/api/providers"),
    ]);
    const status = await statusRes.json();
    const providers = await providersRes.json();

    if (status.ollamaAvailable) {
      dot.className = "status-dot online";
      text.textContent = status.activeModel || "Online";
      text.style.color = "#10b981";
    } else {
      dot.className = "status-dot offline";
      text.textContent = "No LLM — DEMO mode";
      text.style.color = "#ef4444";
    }

    // Populate provider selector
    select.innerHTML = "";
    providers.forEach((p) => {
      if (p.available) {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name}${p.activeModel ? " (" + p.activeModel + ")" : ""}`;
        select.appendChild(opt);
      }
    });
    if (select.options.length === 0) {
      const opt = document.createElement("option");
      opt.value = "ollama";
      opt.textContent = "No providers available";
      select.appendChild(opt);
    }
  } catch {
    dot.className = "status-dot offline";
    text.textContent = "Server unreachable";
    text.style.color = "#ef4444";
  }
}

// ── Tabs ──
function initTabs() {
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      const target = document.getElementById("tab-" + btn.dataset.tab);
      if (target) target.classList.add("active");

      if (btn.dataset.tab === "library") loadLibrary();
      if (btn.dataset.tab === "models") { loadInstalledModels(); loadCatalog(); }
    });
  });
}

// ── Studio ──
function initStudio() {
  const btnGen = document.getElementById("btn-generate");
  const btnRefine = document.getElementById("btn-refine");
  const promptInput = document.getElementById("prompt-input");
  const refineInput = document.getElementById("refine-input");

  btnGen.addEventListener("click", () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;
    generateComponentSSE(prompt);
  });

  // Allow Ctrl+Enter to generate
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      btnGen.click();
    }
  });

  btnRefine.addEventListener("click", () => {
    const instruction = refineInput.value.trim();
    if (!instruction || !currentComponent) return;
    refineComponent(instruction);
  });

  document.getElementById("btn-save").addEventListener("click", saveCurrentComponent);
  document.getElementById("btn-download").addEventListener("click", downloadAsZip);
}

// ── SSE Streaming Generation ──
async function generateComponentSSE(prompt) {
  const btnGen = document.getElementById("btn-generate");
  const streamSection = document.getElementById("section-stream");
  const streamOutput = document.getElementById("stream-output");
  const provider = document.getElementById("provider-select").value;

  btnGen.disabled = true;
  btnGen.classList.add("loading");
  btnGen.innerHTML = '<span class="btn-icon">⏳</span> Generating...';

  streamSection.style.display = "block";
  streamOutput.textContent = "";

  try {
    const reqBody = { prompt, provider };
    if (selectedModel) reqBody.model = selectedModel;
    const res = await fetch("/api/genui/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          const event = line.slice(7);
          continue; // Event type line
        }
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);

            // Check what kind of event this is based on content
            if (parsed.token !== undefined) {
              // Token event
              streamOutput.textContent += parsed.token;
              streamOutput.scrollTop = streamOutput.scrollHeight;
            } else if (parsed.phase !== undefined) {
              // Status event
              streamOutput.textContent += `[${parsed.message}]\n`;
            } else if (parsed.componentId !== undefined) {
              // Complete event
              onComponentReceived(parsed);
            } else if (parsed.message !== undefined && parsed.componentId === undefined) {
              // Error event
              streamOutput.textContent += `\n[ERROR] ${parsed.message}`;
              showError(parsed.message);
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    showError("Connection to server failed: " + err.message);
  } finally {
    btnGen.disabled = false;
    btnGen.classList.remove("loading");
    btnGen.innerHTML = '<span class="btn-icon">⚡</span> Generate Component';
  }
}

function onComponentReceived(data) {
  currentComponent = data;
  refinementHistory = [];

  // Update preview iframe
  const iframe = document.getElementById("preview-iframe");
  iframe.srcdoc = data.fullBundleHtml;

  // Update component info
  const info = document.getElementById("component-info");
  info.innerHTML = `
    <strong>Name:</strong> ${escapeHtml(data.name)}<br>
    <strong>Category:</strong> <span style="color:#a78bfa;text-transform:uppercase">${escapeHtml(data.category)}</span><br>
    <strong>Source:</strong> ${escapeHtml(data.generationSource)}<br>
    <strong>ID:</strong> <code style="color:#64748b;font-size:11px">${data.componentId}</code>
    ${data.isDemo ? '<br><span style="color:#f59e0b;font-weight:700">⚠️ DEMO — This is a placeholder, not AI-generated</span>' : ""}
  `;

  // Show refine section
  document.getElementById("section-refine").style.display = "block";
  document.getElementById("refine-history").innerHTML = "";
  document.getElementById("refine-input").value = "";

  // Enable save & download
  document.getElementById("btn-save").disabled = false;
  document.getElementById("btn-download").disabled = false;

  // Update code viewer
  updateCodeViewer();
}

// ── Refinement ──
async function refineComponent(instruction) {
  const btn = document.getElementById("btn-refine");
  btn.disabled = true;
  btn.textContent = "🔁 Applying...";

  try {
    const res = await fetch("/api/genui/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current: {
          name: currentComponent.name,
          category: currentComponent.category,
          htmlCode: currentComponent.htmlCode,
          cssCode: currentComponent.cssCode,
          jsCode: currentComponent.jsCode,
        },
        instruction,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Refinement failed");

    onComponentReceived(data);
    refinementHistory.push(instruction);

    const historyBox = document.getElementById("refine-history");
    historyBox.innerHTML = refinementHistory
      .map((s, i) => `<div class="refine-step">✓ Step ${i + 1}: ${escapeHtml(s)}</div>`)
      .join("");
  } catch (err) {
    showError("Refinement failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "🔁 Apply Refinement";
  }
}

// ── Code Viewer ──
function initCodeViewer() {
  document.querySelectorAll(".code-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".code-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeCodeLang = tab.dataset.lang;
      updateCodeViewer();
    });
  });

  document.getElementById("btn-copy-code").addEventListener("click", () => {
    const codeEl = document.getElementById("code-output");
    navigator.clipboard.writeText(codeEl.textContent || "");
    const btn = document.getElementById("btn-copy-code");
    btn.textContent = "✓ Copied!";
    setTimeout(() => (btn.textContent = "📋 Copy"), 1500);
  });
}

function updateCodeViewer() {
  if (!currentComponent) return;
  const codeEl = document.getElementById("code-output");
  let code = "";
  let lang = "html";

  switch (activeCodeLang) {
    case "html":
      code = currentComponent.htmlCode || "";
      lang = "html";
      break;
    case "css":
      code = currentComponent.cssCode || "";
      lang = "css";
      break;
    case "js":
      code = currentComponent.jsCode || "";
      lang = "javascript";
      break;
    case "react":
      code = currentComponent.reactCode || "";
      lang = "javascript";
      break;
    case "vue":
      code = currentComponent.vueCode || "// Vue export not available";
      lang = "html";
      break;
    case "svelte":
      code = currentComponent.svelteCode || "// Svelte export not available";
      lang = "html";
      break;
    case "bundle":
      code = currentComponent.fullBundleHtml || "";
      lang = "html";
      break;
  }

  codeEl.textContent = code;
  codeEl.className = `hljs language-${lang}`;
  if (window.hljs) hljs.highlightElement(codeEl);
}

// ── Preview Toolbar ──
function initPreviewToolbar() {
  const wrapper = document.getElementById("canvas-wrapper");
  const frame = document.getElementById("iframe-frame");

  // Theme buttons
  document.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-theme]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      wrapper.className = "canvas-wrapper theme-" + btn.dataset.theme;
    });
  });

  // Viewport buttons
  document.querySelectorAll("[data-vp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-vp]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      frame.style.width = btn.dataset.vp;
    });
  });

  // Reload
  document.getElementById("btn-reload").addEventListener("click", () => {
    if (currentComponent) {
      document.getElementById("preview-iframe").srcdoc = currentComponent.fullBundleHtml;
    }
  });
}

// ── Persistence & Library ──
async function saveCurrentComponent() {
  if (!currentComponent) return;
  const btn = document.getElementById("btn-save");

  try {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentComponent),
    });
    const data = await res.json();
    btn.textContent = "✓ Saved!";
    setTimeout(() => (btn.textContent = "💾 Save"), 1500);
  } catch (err) {
    showError("Save failed: " + err.message);
  }
}

async function loadLibrary() {
  const grid = document.getElementById("library-grid");
  const count = document.getElementById("library-count");

  try {
    const res = await fetch("/api/store");
    const components = await res.json();

    count.textContent = `${components.length} component${components.length !== 1 ? "s" : ""}`;

    if (components.length === 0) {
      grid.innerHTML = '<p class="info-empty">No saved components yet. Generate and save components from the Studio tab.</p>';
      return;
    }

    grid.innerHTML = components
      .map(
        (c) => `
      <div class="library-card" data-id="${c.componentId}">
        <div class="library-card-preview">
          <iframe sandbox="allow-scripts" srcdoc="${escapeAttr(c.fullBundleHtml)}"></iframe>
        </div>
        <div class="library-card-info">
          <div class="library-card-name">${escapeHtml(c.name)}</div>
          <div class="library-card-meta">
            <span>${escapeHtml(c.category)}</span>
            <span>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</span>
          </div>
          <div class="library-card-source">${escapeHtml(c.generationSource)}</div>
        </div>
        <div class="library-card-actions">
          <button class="library-card-btn" onclick="loadFromLibrary('${c.componentId}')">Load</button>
          <button class="library-card-btn delete" onclick="deleteFromLibrary('${c.componentId}')">Delete</button>
        </div>
      </div>
    `
      )
      .join("");
  } catch {
    grid.innerHTML = '<p class="info-empty">Could not load library.</p>';
  }
}

window.loadFromLibrary = async function (id) {
  try {
    const res = await fetch("/api/store");
    const components = await res.json();
    const comp = components.find((c) => c.componentId === id);
    if (comp) {
      onComponentReceived(comp);
      // Switch to studio tab
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelector('[data-tab="studio"]').classList.add("active");
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      document.getElementById("tab-studio").classList.add("active");
    }
  } catch {}
};

window.deleteFromLibrary = async function (id) {
  try {
    await fetch(`/api/store/${id}`, { method: "DELETE" });
    loadLibrary();
  } catch {}
};

// ── Download ZIP ──
async function downloadAsZip() {
  if (!currentComponent) return;
  const btn = document.getElementById("btn-download");
  btn.textContent = "📥 Building...";

  // Build a simple HTML file download (no JSZip dependency — keep it honest)
  const blob = new Blob([currentComponent.fullBundleHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(currentComponent.name || "component").replace(/[^a-zA-Z0-9]/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);

  btn.textContent = "📥 ZIP";
}

// ── Utilities ──
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showError(msg) {
  console.error("[GenUI]", msg);
}

// ══════════════════════════════════════════
// ── Models Tab ──
// ══════════════════════════════════════════

let catalogData = [];
let activeTier = "all";

function initModels() {
  // Tier filter buttons
  document.querySelectorAll(".tier-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tier-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTier = btn.dataset.tier;
      renderCatalog();
    });
  });
}

async function loadInstalledModels() {
  const grid = document.getElementById("installed-grid");
  const statusText = document.getElementById("ollama-status-text");

  try {
    const res = await fetch("/api/models");
    const data = await res.json();

    if (!data.ollama) {
      statusText.textContent = "⚠️ Ollama not running";
      statusText.style.color = "#ef4444";
      grid.innerHTML = `<p class="info-empty">Ollama is not running. Start it with: <code style="color:#38bdf8">ollama serve</code></p>`;
      return;
    }

    statusText.textContent = `${data.models.length} model${data.models.length !== 1 ? "s" : ""} installed`;
    statusText.style.color = "#10b981";

    if (data.models.length === 0) {
      grid.innerHTML = '<p class="info-empty">No models installed. Use the catalog below to download one.</p>';
      return;
    }

    // Get active model: user selection takes priority, then server auto-detect
    let activeModel = selectedModel;
    if (!activeModel) {
      try {
        const statusRes = await fetch("/api/status");
        const statusData = await statusRes.json();
        activeModel = statusData.activeModel;
      } catch {}
    }

    grid.innerHTML = data.models
      .filter((m) => m.capabilities.includes("completion")) // Only show generative models, not just embeddings
      .concat(data.models.filter((m) => !m.capabilities.includes("completion"))) // Then show others
      .map((m) => {
        const isActive = m.name === activeModel;
        const isUserSelected = m.name === selectedModel;
        const caps = m.capabilities.map((c) => `<span class="cap-badge ${c}">${c}</span>`).join("");
        return `
        <div class="installed-card ${isActive ? "active-model" : ""}">
          <div class="installed-card-header">
            <span class="installed-card-name">${escapeHtml(m.name)}</span>
            ${isUserSelected ? '<span class="installed-card-active">✦ Selected</span>' : isActive ? '<span class="installed-card-active" style="opacity:0.6">● Auto</span>' : ""}
          </div>
          <div class="installed-card-meta">
            <span>📐 ${m.params}</span>
            <span>📦 ${m.sizeGB} GB</span>
            <span>🔢 ${m.quantization}</span>
            <span>📏 ${m.contextLength.toLocaleString()} ctx</span>
          </div>
          <div class="installed-card-caps">${caps}</div>
          <div class="installed-card-actions">
            ${m.capabilities.includes("completion") ? `<button class="model-action-btn use-btn" onclick="selectModel('${m.name}')">Use for Generation</button>` : ""}
            <button class="model-action-btn delete-btn" onclick="deleteModel('${m.name}')">Delete</button>
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    grid.innerHTML = '<p class="info-empty">Could not connect to server.</p>';
  }
}

async function loadCatalog() {
  try {
    const res = await fetch("/api/models/catalog");
    catalogData = await res.json();
    renderCatalog();
  } catch {
    document.getElementById("catalog-grid").innerHTML = '<p class="info-empty">Could not load catalog.</p>';
  }
}

function renderCatalog() {
  const grid = document.getElementById("catalog-grid");
  const filtered = activeTier === "all" ? catalogData : catalogData.filter((m) => m.tier === activeTier);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="info-empty">No models in this tier.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map((m) => {
      const tags = m.tags
        .map((t) => `<span class="tag ${t === "recommended" ? "recommended" : ""}">${t}</span>`)
        .join("");

      return `
      <div class="catalog-card ${m.installed ? "installed" : ""}" data-tier="${m.tier}">
        <div class="catalog-card-header">
          <span class="catalog-card-name">${escapeHtml(m.name)}</span>
          <span class="catalog-card-family">${escapeHtml(m.family)}</span>
        </div>
        <div class="catalog-card-desc">${escapeHtml(m.description)}</div>
        <div class="catalog-card-specs">
          <span class="spec-item">📐 <strong>${m.params}</strong></span>
          <span class="spec-item">🎮 <strong>${m.vramGB} GB</strong> VRAM</span>
          <span class="spec-item">📥 <strong>${m.diskGB} GB</strong> download</span>
          <span class="spec-item">📏 <strong>${m.contextLength.toLocaleString()}</strong> ctx</span>
        </div>
        <div class="catalog-card-tags">${tags}</div>
        <div class="catalog-card-actions">
          ${m.installed
            ? '<span class="catalog-installed-badge">✓ Installed</span>'
            : `<button class="model-action-btn" onclick="pullModel('${m.id}')">📥 Install</button>`
          }
        </div>
      </div>`;
    })
    .join("");
}

async function pullModel(modelId) {
  const section = document.getElementById("pull-progress-section");
  const bar = document.getElementById("pull-bar-fill");
  const status = document.getElementById("pull-status");

  section.style.display = "block";
  bar.style.width = "0%";
  status.textContent = `Starting download: ${modelId}...`;

  try {
    const res = await fetch("/api/models/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.status === "complete") {
            bar.style.width = "100%";
            status.textContent = `✓ ${modelId} installed successfully!`;
            // Refresh lists
            setTimeout(() => {
              loadInstalledModels();
              loadCatalog();
              checkStatus();
              section.style.display = "none";
            }, 2000);
          } else if (data.status === "error") {
            status.textContent = `✗ Error: ${data.message}`;
            status.style.color = "#ef4444";
          } else if (data.total && data.completed) {
            const pct = Math.round((data.completed / data.total) * 100);
            bar.style.width = pct + "%";
            const completedMB = Math.round(data.completed / 1048576);
            const totalMB = Math.round(data.total / 1048576);
            status.textContent = `${data.status}: ${completedMB} / ${totalMB} MB (${pct}%)`;
          } else {
            status.textContent = data.status || "Downloading...";
          }
        } catch {}
      }
    }
  } catch (err) {
    status.textContent = `✗ Download failed: ${err.message}`;
    status.style.color = "#ef4444";
  }
}

window.pullModel = pullModel;

window.deleteModel = async function (modelName) {
  if (!confirm(`Delete model "${modelName}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/api/models/${encodeURIComponent(modelName)}`, { method: "DELETE" });
    const data = await res.json();
    if (data.deleted) {
      loadInstalledModels();
      loadCatalog();
      checkStatus();
    } else {
      showError("Delete failed: " + (data.error || "unknown error"));
    }
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
};

window.selectModel = function (modelName) {
  selectedModel = modelName;

  // Update header status to reflect selection
  const dot = document.getElementById("llm-status");
  const text = document.getElementById("llm-status-text");
  dot.className = "status-dot online";
  text.textContent = modelName;
  text.style.color = "#10b981";

  // Re-render installed cards to highlight the active one
  loadInstalledModels();

  // Switch to Studio tab so user can start generating
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('[data-tab="studio"]').classList.add("active");
  document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
  document.getElementById("tab-studio").classList.add("active");
};
