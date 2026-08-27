/**
 * Fixed, deterministic component specs used across the test suite.
 * These stand in for what GenUICompiler.compileComponent() would normally
 * produce, so exporter/generator tests never need a live LLM call.
 */

export interface FixtureSpec {
  name: string;
  category: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

export const FIXTURE_SIMPLE_COUNTER: FixtureSpec = {
  name: "Simple Counter",
  category: "widget",
  htmlCode: `<div class="card">
  <h2 id="count-label">0</h2>
  <button id="inc-btn">+1</button>
</div>`,
  cssCode: `body { margin: 0; }
.card { padding: 24px; text-align: center; }
button { padding: 8px 16px; }`,
  jsCode: `let count = 0;
const label = document.getElementById('count-label');
const btn = document.getElementById('inc-btn');
btn.addEventListener('click', () => {
  count++;
  label.textContent = String(count);
});`,
};

// Exercises escaping: backticks, \${} interpolation markers and backslashes
// inside the generated markup/JS, which the exporters must neutralize when
// embedding into a template literal.
export const FIXTURE_SPECIAL_CHARS: FixtureSpec = {
  name: "Special Chars Widget!!",
  category: "widget",
  htmlCode: "<div class=\"card\">`backtick` and ${notAnExpression} and a \\backslash\\</div>",
  cssCode: `.card { content: "\${fake}"; }`,
  jsCode: "const tpl = `literal ${1 + 1}`;\nconsole.log('backslash \\\\ done');",
};

// No interactive logic and no styling at all.
export const FIXTURE_EMPTY_JS_CSS: FixtureSpec = {
  name: "static block",
  category: "widget",
  htmlCode: `<p>Just static text, no interactivity.</p>`,
  cssCode: ``,
  jsCode: ``,
};

// A lowercase, multi-word, punctuation-heavy name to exercise toComponentName().
export const FIXTURE_MESSY_NAME: FixtureSpec = {
  name: "  weird--name!! with   spaces  ",
  category: "form",
  htmlCode: `<form id="f"><input id="email" type="email" /><button type="submit">Send</button></form>`,
  cssCode: `body { background: red; } form { display: grid; gap: 8px; }`,
  jsCode: `document.getElementById('f').addEventListener('submit', (e) => { e.preventDefault(); });`,
};

export const ALL_FIXTURES: FixtureSpec[] = [
  FIXTURE_SIMPLE_COUNTER,
  FIXTURE_SPECIAL_CHARS,
  FIXTURE_EMPTY_JS_CSS,
  FIXTURE_MESSY_NAME,
];

// Reproduces a REAL failure observed when driving the app against a live
// Ollama model (granite3-dense:2b, prompt "Crea un modulo di contatto e
// registrazione"): the LLM emitted a JS string literal with an embedded,
// unescaped newline (single-quoted string spanning multiple source lines).
// That is invalid JavaScript to begin with — it would break the plain HTML
// bundle export too — but it also breaks the Vue/Svelte "compiler-verified"
// export path, because neither exporter validates jsCode before embedding
// it verbatim into the SFC/component <script>. See README "Test
// automatizzati" section for the full writeup.
export const FIXTURE_INVALID_JS_FROM_LLM: FixtureSpec = {
  name: "User Registration and Contact Form",
  category: "widget",
  htmlCode: `<form class="card"><input id="name" /><input id="email" /><textarea id="message"></textarea><button id="submit-btn">Send</button></form>`,
  cssCode: `.card { padding: 16px; }`,
  jsCode: `document.getElementById('submit-btn').addEventListener('click', () => {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;
  alert('Name: ' + name + '
  Email: ' + email + '
  Message: ' + message);
});`,
};
