/**
 * 🎨 GENUI-CANVAS STUDIO CLIENT SCRIPT
 * Handles Generative Component Compilations, Sandboxed Iframe Rendering,
 * Source Code Copying, and Competitor Benchmark Matrix.
 */

let currentComponent = null;

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupGenUIActions();
  fetchCompetitorMatrix();
});

function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = `tab-${tab.getAttribute("data-tab")}`;
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

// 1. GenUI Actions
function setupGenUIActions() {
  const btnCompile = document.getElementById("btn-compile-ui");
  const btnPreset = document.getElementById("btn-preset-telemetry");
  const btnCopy = document.getElementById("btn-copy-code");
  const inputPrompt = document.getElementById("input-ui-prompt");
  const metaBox = document.getElementById("comp-meta-box");
  const iframe = document.getElementById("sandbox-iframe");
  const codeView = document.getElementById("code-export-view");

  async function compileUI(promptText) {
    btnCompile.textContent = "🎨 Generating Interactive Code...";
    try {
      const res = await fetch("/api/genui/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText })
      });
      const data = await res.json();
      currentComponent = data;

      document.getElementById("badge-rendered-id").textContent = data.componentId;

      // Update Meta
      metaBox.innerHTML = `
        <strong style="color: #fff;">Component:</strong> ${data.name}<br>
        <strong style="color: #fff;">Category:</strong> <span style="color: #c084fc; text-transform: uppercase;">${data.category}</span><br>
        <strong style="color: #fff;">Frameworks:</strong> React (TSX), Standalone HTML5/CSS3<br>
        <strong style="color: #fff;">Interactivity:</strong> Live State Reactive Events Active
      `;

      // Render inside Sandboxed Iframe
      iframe.srcdoc = data.fullBundleHtml;

      // Update Code View
      codeView.textContent = `// === ⚛️ REACT COMPONENT EXPORT ===\n\n${data.reactCode}\n\n// === 🌐 STANDALONE HTML/CSS/JS BUNDLE ===\n\n${data.fullBundleHtml}`;

      btnCompile.textContent = "🎨 Generate Interactive Component";
    } catch (e) {
      btnCompile.textContent = "🎨 Generate Component";
    }
  }

  btnCompile?.addEventListener("click", () => compileUI(inputPrompt.value));
  btnPreset?.addEventListener("click", () => {
    inputPrompt.value = "Crea un widget cyberpunk di telemetria GPU/RAM per cluster locale";
    compileUI(inputPrompt.value);
  });

  btnCopy?.addEventListener("click", () => {
    if (!currentComponent) return;
    navigator.clipboard.writeText(currentComponent.reactCode);
    alert("📋 React Component copied to clipboard!");
  });

  compileUI(inputPrompt.value); // Auto-compile initial mortgage component
}

// 2. Competitors
async function fetchCompetitorMatrix() {
  const container = document.getElementById("competitor-table-container");
  if (!container) return;

  try {
    const res = await fetch("/api/competitors");
    const competitors = await res.json();

    let html = `
      <table class="bench-table">
        <thead>
          <tr>
            <th>Generative UI Studio</th>
            <th>Infinite Canvas</th>
            <th>Live Interactive Iframe</th>
            <th>100% Local Offline</th>
            <th>Multi-Framework Export</th>
            <th>Monthly Cost</th>
            <th>Multi-Component Workspace</th>
          </tr>
        </thead>
        <tbody>
    `;

    competitors.forEach((c, i) => {
      const isOur = i === 0;
      html += `
        <tr class="${isOur ? 'bench-row-highlight' : ''}">
          <td>${c.name}</td>
          <td>${c.infiniteCanvas ? '✓ Yes' : '✗ No'}</td>
          <td>${c.liveIframeSandbox ? '✓ Yes' : '✗ No'}</td>
          <td>${c.localOfflineRunning ? '✓ 100% Local' : '☁️ Cloud Only'}</td>
          <td>${c.exportReactVueHTML ? '✓ React/Vue/HTML' : '✗ Limited'}</td>
          <td style="color: ${c.costMonthly.includes('0.00') ? '#34d399' : '#f87171'}; font-weight: 700;">${c.costMonthly}</td>
          <td>${c.multiComponentWorkspace ? '✓ Yes' : '✗ No'}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch {}
}
