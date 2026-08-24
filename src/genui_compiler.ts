/**
 * 🎨 Generative UI Compiler & Live Component Generator
 * Streams interactive mini-applications (React, Tailwind, HTML5/CSS3)
 * ready to be rendered inside an isolated browser canvas sandbox.
 */

export interface GeneratedUIComponent {
  componentId: string;
  name: string;
  category: "calculator" | "dashboard" | "form" | "widget" | "chart";
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  fullBundleHtml: string;
  reactCode: string;
}

export class GenUICompiler {
  public compileComponent(prompt: string): GeneratedUIComponent {
    const text = prompt.toLowerCase();

    if (text.includes("mutuo") || text.includes("mortgage") || text.includes("calc")) {
      const html = `
<div class="calc-card">
  <h2>🏡 Mortgage & Loan Estimator</h2>
  <div class="input-row">
    <label>Loan Amount (€):</label>
    <input type="number" id="amount" value="250000" step="5000">
  </div>
  <div class="input-row">
    <label>Interest Rate (%):</label>
    <input type="number" id="rate" value="3.2" step="0.1">
  </div>
  <div class="input-row">
    <label>Duration (Years):</label>
    <input type="range" id="years" min="5" max="35" value="25" oninput="document.getElementById('years-val').textContent = this.value">
    <span id="years-val">25</span> years
  </div>
  <div class="result-box">
    <span>Estimated Monthly Payment:</span>
    <strong id="monthly-out">€ 1,212.18 / mo</strong>
  </div>
</div>`;

      const css = `
body { font-family: -apple-system, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 16px; display: flex; justify-content: center; }
.calc-card { background: #131b2e; border: 1px solid #233354; border-radius: 12px; padding: 20px; width: 100%; max-width: 360px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
h2 { font-size: 15px; margin-top: 0; color: #38bdf8; }
.input-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; font-size: 12px; color: #94a3b8; }
input[type="number"], input[type="range"] { background: #070a12; border: 1px solid #233354; color: #fff; padding: 8px; border-radius: 6px; }
.result-box { background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; border-radius: 8px; padding: 12px; margin-top: 14px; text-align: center; }
.result-box strong { display: block; font-size: 18px; color: #38bdf8; margin-top: 4px; font-family: monospace; }`;

      const js = `
function update() {
  const p = parseFloat(document.getElementById('amount').value) || 0;
  const r = (parseFloat(document.getElementById('rate').value) || 0) / 100 / 12;
  const n = (parseFloat(document.getElementById('years').value) || 25) * 12;
  if (p > 0 && r > 0 && n > 0) {
    const m = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    document.getElementById('monthly-out').textContent = '€ ' + m.toFixed(2) + ' / mo';
  }
}
document.getElementById('amount').addEventListener('input', update);
document.getElementById('rate').addEventListener('input', update);
document.getElementById('years').addEventListener('input', update);
update();`;

      const bundle = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
      const react = `export function MortgageEstimator() {\n  return (\n    <div className="p-4 bg-slate-900 text-white rounded-xl">\n      <h2 className="text-sky-400 font-bold">Mortgage Estimator</h2>\n      {/* Interactive React State Hook */}\n    </div>\n  );\n}`;

      return {
        componentId: `COMP-${Date.now().toString().slice(-4)}`,
        name: "Interactive Mortgage Estimator",
        category: "calculator",
        htmlCode: html,
        cssCode: css,
        jsCode: js,
        fullBundleHtml: bundle,
        reactCode: react
      };
    }

    // Default: Cyberpunk Telemetry Widget
    const html = `
<div class="widget-card">
  <div class="header">
    <span>⚡ Hardware Mesh Cluster</span>
    <span class="badge">ONLINE</span>
  </div>
  <div class="meter-row">
    <span>M3 Max GPU (64GB)</span>
    <div class="bar"><div class="fill" style="width: 78%;"></div></div>
    <span class="pct">78%</span>
  </div>
  <div class="meter-row">
    <span>Exo LAN Node #2</span>
    <div class="bar"><div class="fill" style="width: 42%;"></div></div>
    <span class="pct">42%</span>
  </div>
  <button class="btn" onclick="alert('Cluster Re-balanced!')">Rebalance Mesh</button>
</div>`;

    const css = `
body { font-family: -apple-system, sans-serif; background: #070a12; color: #f3f4f6; margin: 0; padding: 16px; display: flex; justify-content: center; }
.widget-card { background: #101626; border: 1px solid #1e2a44; border-radius: 12px; padding: 18px; width: 100%; max-width: 360px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-weight: 600; font-size: 13px; color: #a78bfa; }
.badge { background: rgba(52, 211, 153, 0.2); color: #34d399; font-size: 10px; padding: 2px 6px; border-radius: 10px; border: 1px solid #34d399; }
.meter-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 10px; color: #94a3b8; }
.bar { flex: 1; height: 6px; background: #070a12; margin: 0 10px; border-radius: 3px; overflow: hidden; border: 1px solid #233354; }
.fill { height: 100%; background: linear-gradient(90deg, #a78bfa, #38bdf8); }
.pct { font-family: monospace; color: #fff; }
.btn { width: 100%; margin-top: 10px; background: #7c3aed; border: none; color: #fff; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn:hover { background: #6d28d9; }`;

    const js = ``;
    const bundle = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
    const react = `export function ClusterTelemetry() {\n  return (\n    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">\n      <h3 className="text-purple-400 font-bold">Hardware Mesh Cluster</h3>\n    </div>\n  );\n}`;

    return {
      componentId: `COMP-${Date.now().toString().slice(-4)}`,
      name: "Cyberpunk Telemetry Widget",
      category: "widget",
      htmlCode: html,
      cssCode: css,
      jsCode: js,
      fullBundleHtml: bundle,
      reactCode: react
    };
  }
}
