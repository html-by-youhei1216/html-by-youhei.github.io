/**
 * HTML Playground — 各画面の描画
 */
import { Storage } from './storage.js';
import { detectIssues, formatHTML, gradePractice, gradeExercise, TAG_COMPLETIONS, escapeHtml } from './utils.js';
import { createEditor, createPreview } from './editor.js';

let editorInstance = null;
let previewInstance = null;
let practiceEditor = null;
let exerciseEditor = null;

export function renderSidebar(active, lessons) {
  const rate = Storage.completionRate(lessons.length).toFixed(0);
  const items = [
    { id: 'home', icon: '🏠', label: 'ホーム' },
    { id: 'lessons', icon: '📚', label: 'レッスン' },
    { id: 'editor', icon: '💻', label: 'エディタ' },
    { id: 'exercises', icon: '✏️', label: '練習問題' },
    { id: 'roadmap', icon: '🗺', label: 'ロードマップ' },
    { id: 'snippets', icon: '📋', label: 'スニペット' },
    { id: 'badges', icon: '🏆', label: 'バッジ' },
    { id: 'teacher', icon: '👩‍🏫', label: '教師モード' },
    { id: 'help', icon: '❓', label: 'ヘルプ' },
    { id: 'settings', icon: '⚙️', label: '設定' },
  ];
  return `
    <aside class="sidebar" role="navigation" aria-label="メインメニュー">
      <div class="sidebar-brand">
        <img src="/images/icon-512.png" alt="" width="40" height="40">
        <span>HTML Playground</span>
      </div>
      <nav class="sidebar-nav">
        ${items.map(i => `
          <button class="nav-item ${active === i.id ? 'active' : ''}" data-nav="${i.id}" aria-current="${active === i.id ? 'page' : 'false'}">
            <span class="nav-icon">${i.icon}</span>${i.label}
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-progress">
        <div class="progress-label"><span>達成率</span><strong>${rate}%</strong></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${rate}%"></div></div>
        <div class="study-time">⏱ ${Storage.formattedStudyTime()}</div>
      </div>
    </aside>
  `;
}

export function renderHome(lessons, navigate) {
  const projects = Storage.getProjects().sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 5);
  const next = lessons.find(l => !Storage.lessonProgress(l.id).isCompleted && Storage.isLessonUnlocked(l, lessons));
  const rate = Storage.completionRate(lessons.length).toFixed(0);
  const badges = Storage.getProgress().earnedBadgeIds.length;

  return `
    <div class="view home-view">
      <h1>HTML Playground へようこそ</h1>
      <p class="lead">HTMLを楽しく学べる、インタラクティブな学習環境です。</p>
      <div class="search-box">
        <input type="search" id="home-search" placeholder="レッスンを検索..." aria-label="レッスン検索">
      </div>
      <div class="quick-actions">
        <button class="card-btn" data-go="lessons"><span>📚</span>レッスンを始める</button>
        <button class="card-btn" data-go="editor"><span>💻</span>エディタを開く</button>
        <button class="card-btn" data-go="exercises"><span>✏️</span>練習問題</button>
        <button class="card-btn" data-go="roadmap"><span>🗺</span>ロードマップ</button>
      </div>
      ${next ? `
        <section class="section">
          <h2>学習を続ける</h2>
          <button class="continue-card" data-lesson="${next.id}">
            <div><strong>第${next.chapter}章: ${next.title}</strong><br><small>${next.subtitle}</small></div>
            <span>→</span>
          </button>
        </section>
      ` : rate >= 100 ? '<p class="success-msg">🎉 全レッスン完了！おめでとうございます！</p>' : ''}
      <section class="section">
        <div class="section-header"><h2>最近のプロジェクト</h2><button class="btn-sm" id="new-project">新規作成</button></div>
        ${projects.length ? projects.map(p => `
          <button class="list-item" data-project="${p.id}">
            <span>${p.isSample ? '📄' : '📝'} ${escapeHtml(p.name)}</span>
            <small>${p.isSample ? 'サンプル' : ''}</small>
          </button>
        `).join('') : '<p class="muted">プロジェクトがありません</p>'}
      </section>
      <div class="stats-row">
        <div class="stat"><strong>${rate}%</strong><span>達成率</span></div>
        <div class="stat"><strong>${Storage.formattedStudyTime()}</strong><span>学習時間</span></div>
        <div class="stat"><strong>${badges}/${Storage.BADGES.length}</strong><span>バッジ</span></div>
      </div>
    </div>
  `;
}

export function bindHome(root, navigate, lessons) {
  root.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.go)));
  root.querySelectorAll('[data-lesson]').forEach(el => el.addEventListener('click', () => navigate('lesson', el.dataset.lesson)));
  root.querySelectorAll('[data-project]').forEach(el => el.addEventListener('click', () => navigate('editor', el.dataset.project)));
  root.querySelector('#new-project')?.addEventListener('click', () => {
    const p = Storage.createProject('新規プロジェクト ' + (Storage.getProjects().length + 1));
    navigate('editor', p.id);
  });
  root.querySelector('#home-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (q.length > 1) navigate('lessons', null, q);
  });
}

export function renderLessons(lessons, filter = '') {
  const filtered = filter
    ? lessons.filter(l => l.title.includes(filter) || l.subtitle.includes(filter) || l.content.includes(filter))
    : lessons;
  return `
    <div class="view">
      <h1>HTML学習コース</h1>
      ${filter ? `<p class="muted">「${escapeHtml(filter)}」の検索結果</p>` : ''}
      <div class="lesson-list">
        ${filtered.map(l => {
          const prog = Storage.lessonProgress(l.id);
          const unlocked = Storage.isLessonUnlocked(l, lessons);
          return `
            <button class="lesson-card ${!unlocked ? 'locked' : ''}" data-lesson="${l.id}" ${!unlocked ? 'disabled' : ''}>
              <div class="lesson-num">${prog.isCompleted ? '✓' : !unlocked ? '🔒' : l.chapter}</div>
              <div class="lesson-info">
                <strong>第${l.chapter}章: ${l.title}</strong>
                <small>${l.subtitle}</small>
                <span class="tag">${l.difficulty} · 約${l.estimatedMinutes}分</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderLessonDetail(lesson, lessons) {
  return `
    <div class="view lesson-detail">
      <button class="back-btn" data-nav="lessons">← レッスン一覧</button>
      <h1>第${lesson.chapter}章: ${lesson.title}</h1>
      <p class="lead">${lesson.subtitle}</p>
      <div class="tabs" role="tablist">
        <button class="tab active" data-tab="explain">解説</button>
        <button class="tab" data-tab="practice">練習</button>
        <button class="tab" data-tab="quiz">クイズ</button>
      </div>
      <div class="tab-panel active" id="tab-explain">
        <div class="prose">${lesson.content.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>
        <h3>コード例</h3>
        <pre class="code-block"><code>${escapeHtml(lesson.codeExample)}</code></pre>
      </div>
      <div class="tab-panel" id="tab-practice">
        <p>${escapeHtml(lesson.practicePrompt)}</p>
        <div id="practice-editor" class="editor-container"></div>
        <div class="btn-row">
          <button class="btn-secondary" id="practice-hint">ヒントを見る</button>
          <button class="btn-primary" id="practice-submit">提出する</button>
        </div>
        <div id="practice-result" class="result-box hidden"></div>
      </div>
      <div class="tab-panel" id="tab-quiz">
        ${lesson.quiz.length ? lesson.quiz.map((q, qi) => `
          <div class="quiz-item" data-quiz="${q.id}">
            <p><strong>${escapeHtml(q.question)}</strong></p>
            ${q.options.map((opt, oi) => `
              <label class="quiz-option"><input type="radio" name="quiz_${qi}" value="${oi}"> ${escapeHtml(opt)}</label>
            `).join('')}
            <div class="quiz-feedback hidden"></div>
          </div>
        `).join('') + '<button class="btn-primary" id="quiz-submit">クイズを提出</button>' : '<p class="muted">このレッスンにはクイズがありません</p>'}
      </div>
    </div>
  `;
}

export function bindLessonDetail(root, lesson, lessons, navigate) {
  Storage.markLessonAccessed(lesson.id);
  root.querySelector('.back-btn')?.addEventListener('click', () => navigate('lessons'));

  root.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      root.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      root.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      root.querySelector('tab-' + tab.dataset.tab)?.classList.add('active');
      if (tab.dataset.tab === 'practice' && !practiceEditor) {
        practiceEditor = createEditor(root.querySelector('practice-editor'), {
          initialCode: lesson.practiceStarterCode,
          fontSize: Storage.getSettings().fontSize,
          showLineNumbers: true,
        });
      }
    });
  });

  let hintIdx = 0;
  root.querySelector('practice-hint')?.addEventListener('click', () => {
    const box = root.querySelector('practice-result');
    if (hintIdx < lesson.hints.length) {
      box.textContent = '💡 ヒント: ' + lesson.hints[hintIdx++];
      box.classList.remove('hidden');
    }
  });

  root.querySelector('practice-submit')?.addEventListener('click', () => {
    if (!practiceEditor) return;
    const passed = gradePractice(practiceEditor.getValue(), lesson.practiceSolution);
    const box = root.querySelector('practice-result');
    box.textContent = passed ? '🎉 正解です！よくできました。' : 'もう一度挑戦してみましょう。ヒントを参考にしてください。';
    box.classList.toggle('success', passed);
    box.classList.remove('hidden');
    if (passed) Storage.markPracticePassed(lesson.id);
  });

  root.querySelector('quiz-submit')?.addEventListener('click', () => {
    let correct = 0;
    lesson.quiz.forEach((q, qi) => {
      const selected = root.querySelector(`input[name="quiz_${qi}"]:checked`);
      const fb = root.querySelectorAll('.quiz-feedback')[qi];
      const isCorrect = selected && parseInt(selected.value) === q.correctIndex;
      if (isCorrect) correct++;
      fb.textContent = isCorrect ? '✅ 正解！' : '❌ 不正解 — ' + q.explanation;
      fb.classList.remove('hidden');
    });
    const score = lesson.quiz.length ? Math.round(correct / lesson.quiz.length * 100) : 100;
    Storage.saveQuizScore(lesson.id, score);
  });
}

export function renderEditor(projectId) {
  const projects = Storage.getProjects();
  const current = projects.find(p => p.id === projectId) || projects[0];
  if (!current) {
    const p = Storage.createProject('新規プロジェクト');
    return renderEditor(p.id);
  }
  return `
    <div class="view editor-view">
      <div class="editor-header">
        <select id="project-select" aria-label="プロジェクト選択">
          ${projects.map(p => `<option value="${p.id}" ${p.id === current.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
        </select>
        <div class="editor-tools">
          <button class="btn-sm" id="format-code">コード整形</button>
          <button class="btn-sm" id="tag-complete">タグ補完</button>
          <button class="btn-sm" id="check-issues">問題を確認</button>
          <div class="device-picker" role="group" aria-label="プレビューデバイス">
            <button class="device-btn active" data-device="0">パソコン</button>
            <button class="device-btn" data-device="768">タブレット</button>
            <button class="device-btn" data-device="375">スマホ</button>
          </div>
        </div>
      </div>
      <div class="editor-split">
        <div class="editor-panel">
          <div class="panel-label">HTMLエディタ</div>
          <div id="main-editor" class="editor-container"></div>
        </div>
        <div class="preview-panel">
          <div class="panel-label">プレビュー</div>
          <div id="main-preview"></div>
        </div>
      </div>
      <div id="issues-panel" class="issues-panel hidden"></div>
      <div id="completion-panel" class="completion-panel hidden"></div>
    </div>
  `;
}

export function bindEditor(root, projectId, navigate) {
  editorInstance = null;
  previewInstance = null;
  let currentId = projectId;
  let deviceWidth = 0;
  let saveTimer = null;

  function loadProject(id) {
    currentId = id;
    const project = Storage.getProjects().find(p => p.id === id);
    if (!project) return;
    const settings = Storage.getSettings();
    const editorEl = root.querySelector('main-editor');
    const previewEl = root.querySelector('main-preview');
    editorEl.innerHTML = '';
    previewEl.innerHTML = '';
    editorInstance = createEditor(editorEl, {
      initialCode: project.htmlCode,
      fontSize: settings.fontSize,
      showLineNumbers: settings.showLineNumbers,
      onChange: (code) => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => Storage.updateProject(currentId, code), 500);
        previewInstance?.update(code, deviceWidth || undefined);
      },
    });
    previewInstance = createPreview(previewEl);
    previewInstance.update(project.htmlCode, deviceWidth || undefined);
  }

  loadProject(currentId);

  root.querySelector('project-select')?.addEventListener('change', (e) => loadProject(e.target.value));

  root.querySelector('format-code')?.addEventListener('click', () => {
    if (editorInstance) {
      editorInstance.setValue(formatHTML(editorInstance.getValue()));
      Storage.updateProject(currentId, editorInstance.getValue());
    }
  });

  root.querySelector('check-issues')?.addEventListener('click', () => {
    const issues = detectIssues(editorInstance?.getValue() || '');
    const panel = root.querySelector('issues-panel');
    panel.innerHTML = issues.length
      ? issues.map(i => `<div class="issue ${i.severity}"><strong>${i.severity === 'error' ? 'エラー' : '警告'}</strong> 行${i.line}: ${i.message}</div>`).join('')
      : '<div class="issue ok">✅ 問題は見つかりませんでした</div>';
    panel.classList.remove('hidden');
  });

  root.querySelector('tag-complete')?.addEventListener('click', () => {
    const panel = root.querySelector('completion-panel');
    panel.innerHTML = TAG_COMPLETIONS.slice(0, 15).map(t =>
      `<button class="completion-item">${escapeHtml(t)}</button>`
    ).join('');
    panel.classList.toggle('hidden');
    panel.querySelectorAll('.completion-item').forEach(btn => {
      btn.addEventListener('click', () => {
        if (editorInstance) {
          editorInstance.setValue(editorInstance.getValue() + '\n' + btn.textContent);
          panel.classList.add('hidden');
        }
      });
    });
  });

  root.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      deviceWidth = parseInt(btn.dataset.device) || 0;
      previewInstance?.update(editorInstance?.getValue() || '', deviceWidth || undefined);
    });
  });
}

export function renderExercises(exercises, difficulty = '初級') {
  const filtered = exercises.filter(e => e.difficulty === difficulty);
  return `
    <div class="view">
      <h1>練習問題</h1>
      <div class="difficulty-tabs">
        ${['初級', '中級', '上級'].map(d => `
          <button class="diff-tab ${d === difficulty ? 'active' : ''}" data-diff="${d}">${d}</button>
        `).join('')}
      </div>
      <div class="exercise-list">
        ${filtered.map(ex => {
          const prog = Storage.exerciseProgress(ex.id);
          return `
            <button class="exercise-card" data-exercise="${ex.id}">
              <span>${prog.isCompleted ? '✅' : '⭕'}</span>
              <div><strong>${ex.title}</strong><br><small>${ex.description}</small></div>
              <span class="tag">${ex.difficulty}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderExerciseDetail(exercise) {
  return `
    <div class="view">
      <button class="back-btn" data-nav="exercises">← 練習問題一覧</button>
      <h1>${escapeHtml(exercise.title)}</h1>
      <p>${escapeHtml(exercise.description)}</p>
      <h3>課題</h3>
      <ul>${exercise.testCriteria.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
      <div id="exercise-editor" class="editor-container"></div>
      <div class="btn-row">
        <button class="btn-secondary" id="ex-hint">ヒント</button>
        <button class="btn-secondary" id="ex-solution">解答を表示</button>
        <button class="btn-primary" id="ex-submit">採点する</button>
      </div>
      <div id="ex-result" class="result-box hidden"></div>
      <div id="ex-hint-box" class="hint-box hidden"></div>
    </div>
  `;
}

export function bindExerciseDetail(root, exercise, navigate) {
  exerciseEditor = null;
  let hintIdx = 0;
  let hintsUsed = 0;

  root.querySelector('.back-btn')?.addEventListener('click', () => navigate('exercises'));
  exerciseEditor = createEditor(root.querySelector('exercise-editor'), {
    initialCode: exercise.starterCode,
    fontSize: Storage.getSettings().fontSize,
    showLineNumbers: true,
  });

  root.querySelector('ex-hint')?.addEventListener('click', () => {
    if (hintIdx < exercise.hints.length) {
      hintsUsed++;
      const box = root.querySelector('ex-hint-box');
      box.textContent = '💡 ' + exercise.hints[hintIdx++];
      box.classList.remove('hidden');
    }
  });

  root.querySelector('ex-solution')?.addEventListener('click', () => {
    exerciseEditor?.setValue(exercise.solution);
  });

  root.querySelector('ex-submit')?.addEventListener('click', () => {
    const result = gradeExercise(exerciseEditor.getValue(), exercise.testCriteria);
    Storage.markExerciseAttempt(exercise.id, result.passed, hintsUsed);
    const box = root.querySelector('ex-result');
    box.innerHTML = `<strong>${result.passed ? '🎉 合格！' : 'もう一度挑戦しましょう'}</strong> スコア: ${result.score}点<br>` +
      result.feedback.map(f => `${f.pass ? '✅' : '❌'} ${f.text}`).join('<br>');
    box.classList.toggle('success', result.passed);
    box.classList.remove('hidden');
  });
}

export function renderRoadmap(lessons) {
  return `
    <div class="view">
      <h1>学習ロードマップ</h1>
      <p class="lead">レッスンを順番に進めて、HTMLの基礎から応用まで学びましょう。</p>
      <div class="progress-bar large"><div class="progress-fill" style="width:${Storage.completionRate(lessons.length)}%"></div></div>
      <p class="muted">達成率: ${Storage.completionRate(lessons.length).toFixed(0)}%</p>
      <div class="roadmap">
        ${lessons.map((l, i) => {
          const prog = Storage.lessonProgress(l.id);
          const unlocked = Storage.isLessonUnlocked(l, lessons);
          return `
            <div class="roadmap-item">
              <div class="roadmap-node ${prog.isCompleted ? 'done' : unlocked ? 'active' : 'locked'}">
                ${prog.isCompleted ? '✓' : !unlocked ? '🔒' : l.chapter}
              </div>
              ${i < lessons.length - 1 ? `<div class="roadmap-line ${prog.isCompleted ? 'done' : ''}"></div>` : ''}
              <div class="roadmap-text">
                <strong>${l.title}</strong><br>
                <small>${l.subtitle} · ${l.difficulty} · 約${l.estimatedMinutes}分</small>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderSnippets(snippets) {
  const cats = ['すべて', ...new Set(snippets.map(s => s.category))];
  return `
    <div class="view">
      <h1>スニペット集</h1>
      <p class="lead">よく使うHTMLコード。クリックでコピーできます。</p>
      <div id="snippet-list">
        ${snippets.map(s => `
          <div class="snippet-card">
            <div class="snippet-header"><strong>${s.title}</strong><span class="tag">${s.category}</span></div>
            <p class="muted">${s.description}</p>
            <pre class="code-block"><code>${escapeHtml(s.code)}</code></pre>
            <button class="btn-sm copy-snippet" data-code="${escapeHtml(s.code).replace(/"/g, '&quot;')}">コピー</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindSnippets(root) {
  root.querySelectorAll('.copy-snippet').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.snippet-card').querySelector('code').textContent;
      navigator.clipboard.writeText(code);
      btn.textContent = 'コピーしました！';
      setTimeout(() => btn.textContent = 'コピー', 2000);
    });
  });
}

export function renderBadges() {
  return `
    <div class="view">
      <h1>学習実績バッジ</h1>
      <div class="badge-grid">
        ${Storage.BADGES.map(b => {
          const earned = Storage.hasBadge(b.id);
          return `
            <div class="badge-card ${earned ? 'earned' : ''}">
              <div class="badge-icon">${b.icon}</div>
              <strong>${b.title}</strong>
              <small>${b.description}</small>
              <span>${earned ? '獲得済み' : '未獲得'}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderTeacher(lessons) {
  const settings = Storage.getSettings();
  const p = Storage.getProgress();
  const completed = Object.values(p.lessonProgress).filter(lp => lp.isCompleted).length;
  return `
    <div class="view">
      <h1>教師モード</h1>
      <p class="lead">学校や教室での利用向け。進捗確認とエクスポートができます。</p>
      <label class="toggle-row"><input type="checkbox" id="teacher-toggle" ${settings.teacherModeEnabled ? 'checked' : ''}> 教師モードを有効にする</label>
      <div id="teacher-content" class="${settings.teacherModeEnabled ? '' : 'hidden'}">
        <label>学習者名 <input type="text" id="student-name" value="${escapeHtml(settings.studentName)}"></label>
        <div class="stats-row">
          <div class="stat"><strong>${Storage.completionRate(lessons.length).toFixed(0)}%</strong><span>達成率</span></div>
          <div class="stat"><strong>${Storage.formattedStudyTime()}</strong><span>学習時間</span></div>
          <div class="stat"><strong>${completed}/${lessons.length}</strong><span>完了レッスン</span></div>
        </div>
        <button class="btn-primary" id="export-progress">進捗をエクスポート（JSON）</button>
      </div>
    </div>
  `;
}

export function bindTeacher(root, lessons) {
  root.querySelector('teacher-toggle')?.addEventListener('change', (e) => {
    const s = Storage.getSettings();
    s.teacherModeEnabled = e.target.checked;
    Storage.saveSettings(s);
    root.querySelector('teacher-content')?.classList.toggle('hidden', !e.target.checked);
  });
  root.querySelector('student-name')?.addEventListener('change', (e) => {
    const s = Storage.getSettings();
    s.studentName = e.target.value;
    Storage.saveSettings(s);
  });
  root.querySelector('export-progress')?.addEventListener('click', () => {
    const data = Storage.exportForTeacher(Storage.getSettings().studentName, lessons);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `progress_${data.studentName}.json`;
    a.click();
  });
}

export function renderHelp() {
  return `
    <div class="view help-view">
      <h1>ヘルプ</h1>
      <div class="help-section"><h2>HTML Playground とは</h2><p>HTMLを楽しく学べるWebベースの教育ツールです。レッスン、エディタ、プレビュー、練習問題など、ブラウザですべて利用できます。</p></div>
      <div class="help-section"><h2>基本的な使い方</h2><p>1. 「レッスン」から学習を始める<br>2. 「エディタ」でHTMLを書きプレビューで確認<br>3. 「練習問題」で理解度をチェック<br>4. 進捗はブラウザに自動保存されます</p></div>
      <div class="help-section"><h2>キーボード操作</h2><p>Tab — インデント（エディタ内）<br>Shift+Tab — インデント解除</p></div>
      <div class="help-section"><h2>データの保存</h2><p>学習進捗とプロジェクトはブラウザの localStorage に保存されます。別のブラウザやシークレットモードでは引き継がれません。</p></div>
    </div>
  `;
}

export function renderSettings() {
  const s = Storage.getSettings();
  return `
    <div class="view">
      <h1>設定</h1>
      <div class="settings-form">
        <label>テーマ
          <select id="set-theme">
            <option value="system" ${s.theme === 'system' ? 'selected' : ''}>システム設定に合わせる</option>
            <option value="light" ${s.theme === 'light' ? 'selected' : ''}>ライトモード</option>
            <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>ダークモード</option>
          </select>
        </label>
        <label>文字サイズ: <span id="font-size-val">${s.fontSize}</span>pt
          <input type="range" id="set-font-size" min="10" max="24" value="${s.fontSize}">
        </label>
        <label class="toggle-row"><input type="checkbox" id="set-line-numbers" ${s.showLineNumbers ? 'checked' : ''}> 行番号を表示</label>
        <label class="toggle-row"><input type="checkbox" id="set-auto-indent" ${s.autoIndent ? 'checked' : ''}> 自動インデント</label>
      </div>
    </div>
  `;
}

export function bindSettings(root, applyTheme) {
  root.querySelector('set-theme')?.addEventListener('change', (e) => {
    const s = Storage.getSettings();
    s.theme = e.target.value;
    Storage.saveSettings(s);
    applyTheme();
  });
  root.querySelector('set-font-size')?.addEventListener('input', (e) => {
    const s = Storage.getSettings();
    s.fontSize = parseInt(e.target.value);
    Storage.saveSettings(s);
    root.querySelector('font-size-val').textContent = s.fontSize;
  });
  root.querySelector('set-line-numbers')?.addEventListener('change', (e) => {
    const s = Storage.getSettings();
    s.showLineNumbers = e.target.checked;
    Storage.saveSettings(s);
  });
  root.querySelector('set-auto-indent')?.addEventListener('change', (e) => {
    const s = Storage.getSettings();
    s.autoIndent = e.target.checked;
    Storage.saveSettings(s);
  });
}

export function renderOnboarding(step) {
  const pages = [
    { icon: '🌐', title: 'HTML Playground へようこそ', text: 'HTMLを楽しく学べるWebアプリです。ブラウザだけで、初心者から上級者まで学べます。' },
    { icon: '📚', title: 'ステップ形式のレッスン', text: '12章の内蔵レッスンで、HTMLの基礎から応用まで順番に学習できます。' },
    { icon: '💻', title: 'リアルタイムプレビュー', text: 'コードを書くと同時にプレビューが更新されます。PC・タブレット・スマホ表示も確認できます。' },
    { icon: '🏆', title: 'バッジと進捗管理', text: '学習実績バッジを集めたり、ロードマップで進捗を確認しましょう。' },
  ];
  const p = pages[step];
  return `
    <div class="modal-overlay" id="onboarding">
      <div class="modal">
        <div class="modal-icon">${p.icon}</div>
        <h2>${p.title}</h2>
        <p>${p.text}</p>
        <div class="modal-dots">${pages.map((_, i) => `<span class="${i === step ? 'active' : ''}"></span>`).join('')}</div>
        <div class="modal-actions">
          ${step > 0 ? '<button class="btn-secondary" id="ob-back">戻る</button>' : ''}
          <button class="btn-primary" id="ob-next">${step < pages.length - 1 ? '次へ' : '始める'}</button>
        </div>
      </div>
    </div>
  `;
}

export function renderTutorial(step) {
  const steps = [
    'サイドバーから「レッスン」を選んで、第1章から始めましょう。',
    '「エディタ」でHTMLを書くと、右側にリアルタイムでプレビューが表示されます。',
    '「練習問題」で理解度をチェック。ヒント機能も使えます。',
    '「設定」から文字サイズやテーマを変更できます。さあ、HTML学習を始めましょう！',
  ];
  return `
    <div class="modal-overlay" id="tutorial">
      <div class="modal">
        <h2>クイックチュートリアル</h2>
        <p class="muted">ステップ ${step + 1}/${steps.length}</p>
        <p>${steps[step]}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${((step + 1) / steps.length) * 100}%"></div></div>
        <div class="modal-actions">
          <button class="btn-secondary" id="tut-skip">スキップ</button>
          <button class="btn-primary" id="tut-next">${step < steps.length - 1 ? '次へ' : '完了'}</button>
        </div>
      </div>
    </div>
  `;
}
