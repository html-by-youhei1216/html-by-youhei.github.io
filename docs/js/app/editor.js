/**
 * HTML Playground — コードエディタコンポーネント
 */
import { highlightHTML, escapeHtml } from './utils.js';

export function createEditor(container, options = {}) {
  const { initialCode = '', fontSize = 14, showLineNumbers = true, onChange } = options;

  container.innerHTML = `
    <div class="editor-wrap">
      ${showLineNumbers ? '<div class="editor-gutter" aria-hidden="true"></div>' : ''}
      <div class="editor-body">
        <pre class="editor-highlight" aria-hidden="true"><code></code></pre>
        <textarea class="editor-textarea" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="HTMLエディタ"></textarea>
      </div>
    </div>
  `;

  const wrap = container.querySelector('.editor-wrap');
  const gutter = container.querySelector('.editor-gutter');
  const highlight = container.querySelector('.editor-highlight code');
  const textarea = container.querySelector('.editor-textarea');

  textarea.value = initialCode;
  textarea.style.fontSize = fontSize + 'px';
  highlight.style.fontSize = fontSize + 'px';

  function sync() {
    const code = textarea.value;
    highlight.innerHTML = highlightHTML(code) + '\n';
    if (gutter) {
      const lines = code.split('\n').length || 1;
      gutter.innerHTML = Array.from({ length: lines }, (_, i) =>
        `<div class="gutter-line">${i + 1}</div>`
      ).join('');
    }
    onChange?.(code);
  }

  function syncScroll() {
    if (gutter) gutter.scrollTop = textarea.scrollTop;
    highlight.parentElement.scrollTop = textarea.scrollTop;
    highlight.parentElement.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('input', sync);
  textarea.addEventListener('scroll', syncScroll);

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      sync();
    }
  });

  sync();

  return {
    getValue: () => textarea.value,
    setValue: (v) => { textarea.value = v; sync(); },
    focus: () => textarea.focus(),
    setFontSize: (size) => {
      textarea.style.fontSize = size + 'px';
      highlight.style.fontSize = size + 'px';
    },
    element: wrap,
  };
}

export function createPreview(container) {
  container.innerHTML = `
    <div class="preview-wrap">
      <iframe class="preview-frame" title="HTMLプレビュー" sandbox="allow-same-origin"></iframe>
    </div>
  `;
  const iframe = container.querySelector('.preview-frame');

  return {
    update(html, deviceWidth = 0) {
      const doc = deviceWidth ? wrapPreview(html, deviceWidth) : html;
      iframe.srcdoc = doc;
    },
    setDeviceClass(cls) {
      container.className = 'preview-panel ' + (cls || '');
    },
  };
}

function wrapPreview(code, width) {
  const bodyMatch = code.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : code;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=${width},initial-scale=1"><style>body{margin:0}.f{max-width:${width}px;margin:0 auto;border:1px solid #ccc;min-height:100vh}</style></head><body><div class="f">${inner}</div></body></html>`;
}
