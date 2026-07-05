/**
 * HTML Playground — HTMLユーティリティ
 */

export const TAG_COMPLETIONS = [
  '<!DOCTYPE html>', '<html lang="ja">', '</html>',
  '<head>', '</head>', '<meta charset="UTF-8">',
  '<title></title>', '<body>', '</body>',
  '<h1></h1>', '<h2></h2>', '<p></p>',
  '<a href=""></a>', '<img src="" alt="">',
  '<ul>', '</ul>', '<li></li>',
  '<table>', '</table>', '<tr>', '</tr>', '<td></td>',
  '<form>', '</form>', '<input type="text">',
  '<button></button>', '<header>', '</header>',
  '<main>', '</main>', '<footer>', '</footer>',
];

export function detectIssues(code) {
  const issues = [];
  const trimmed = code.trim();
  if (trimmed && !code.includes('<!DOCTYPE')) {
    issues.push({ message: 'DOCTYPE宣言がありません。<!DOCTYPE html> を追加することをおすすめします。', severity: 'warning', line: 1 });
  }
  if (!code.includes('<html')) {
    issues.push({ message: '<html> タグが見つかりません。', severity: 'error', line: 1 });
  }
  if (!code.includes('<body')) {
    issues.push({ message: '<body> タグが見つかりません。', severity: 'error', line: 1 });
  }
  if (code.includes('<img') && !code.includes('alt=')) {
    issues.push({ message: 'img タグに alt 属性がありません。', severity: 'warning', line: findLine(code, '<img') });
  }
  if (code.includes('<a') && !code.includes('href=')) {
    issues.push({ message: 'a タグに href 属性がありません。', severity: 'error', line: findLine(code, '<a') });
  }
  return issues;
}

function findLine(code, substr) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(substr)) return i + 1;
  }
  return 1;
}

export function formatHTML(code) {
  let result = '';
  let indent = 0;
  for (const line of code.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) { result += '\n'; continue; }
    if (trimmed.startsWith('</')) indent = Math.max(0, indent - 1);
    result += '  '.repeat(indent) + trimmed + '\n';
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') &&
        !trimmed.endsWith('/>') && !trimmed.includes('</') &&
        !/^<(img|br|hr|input|meta|link)/i.test(trimmed) && !trimmed.startsWith('<!')) {
      indent++;
    }
  }
  return result.trim() + '\n';
}

export function highlightHTML(code) {
  return escapeHtml(code)
    .replace(/(&lt;\!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    .replace(/(&quot;[^&]*?&quot;)/g, '<span class="hl-string">$1</span>')
    .replace(/(&lt;[^&]*?&gt;)/g, '<span class="hl-tag">$1</span>');
}

export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function gradePractice(code, solution) {
  const norm = s => s.toLowerCase().replace(/\s/g, '');
  const codeNorm = norm(code);
  const tags = [...solution.matchAll(/<([a-z][a-z0-9]*)/gi)].map(m => `<${m[1].toLowerCase()}`);
  return tags.every(t => codeNorm.includes(t.replace(/\s/g, '')));
}

export function gradeExercise(code, criteria) {
  const lower = code.toLowerCase();
  const feedback = criteria.map(c => {
    const pass = checkCriterion(c, lower);
    return { text: c, pass };
  });
  const passed = feedback.filter(f => f.pass).length;
  const score = criteria.length ? Math.round(passed / criteria.length * 100) : 0;
  return { passed: score >= 80, score, feedback };
}

function checkCriterion(criterion, lower) {
  if (criterion.includes('h1')) return lower.includes('<h1');
  if (criterion.includes('段落') || criterion.includes('p')) return lower.includes('<p');
  if (criterion.includes('リンク') || criterion.includes('a')) return lower.includes('<a') && lower.includes('href');
  if (criterion.includes('画像') || criterion.includes('img')) return lower.includes('<img');
  if (criterion.includes('リスト') || criterion.includes('ul')) return lower.includes('<ul') || lower.includes('<ol');
  if (criterion.includes('表') || criterion.includes('table')) return lower.includes('<table');
  if (criterion.includes('フォーム') || criterion.includes('form')) return lower.includes('<form');
  if (criterion.includes('alt')) return lower.includes('alt=');
  if (criterion.includes('lang')) return lower.includes('lang=');
  if (criterion.includes('DOCTYPE')) return lower.includes('<!doctype');
  if (criterion.includes('viewport')) return lower.includes('viewport');
  if (criterion.includes('セマンティック')) return lower.includes('<header') || lower.includes('<main');
  return lower.includes(criterion.toLowerCase());
}

export function wrapPreviewHTML(code, deviceWidth) {
  if (!deviceWidth) return code;
  const bodyMatch = code.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : code;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=${deviceWidth},initial-scale=1"><style>body{margin:0}.frame{max-width:${deviceWidth}px;margin:0 auto;border:1px solid #ccc;min-height:100vh;box-sizing:border-box}</style></head><body><div class="frame">${inner}</div></body></html>`;
}

export function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return d.toLocaleDateString('ja-JP');
}
