/**
 * HTML Playground — ローカルストレージ管理
 */

const STORAGE_KEYS = {
  progress: 'hp_progress',
  projects: 'hp_projects',
  settings: 'hp_settings',
};

const DEFAULT_PROGRESS = {
  lessonProgress: {},
  exerciseProgress: {},
  totalStudyTimeSeconds: 0,
  onboardingCompleted: false,
  tutorialCompleted: false,
  earnedBadgeIds: [],
  lastOpenedProjectId: null,
};

const DEFAULT_SETTINGS = {
  theme: 'system',
  fontSize: 14,
  showLineNumbers: true,
  autoIndent: true,
  teacherModeEnabled: false,
  studentName: '学習者',
};

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>マイページ</title>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.6;
    }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>HTML Playground へようこそ！</h1>
  <p>ここでHTMLを書いて、右側のプレビューで確認できます。</p>
</body>
</html>`;

const SAMPLE_PROJECTS = [
  {
    id: 'sample-intro',
    name: '自己紹介ページ',
    isSample: true,
    htmlCode: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>自己紹介</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; }
    .profile { display: flex; gap: 1rem; align-items: center; }
    .avatar { width: 80px; height: 80px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; }
  </style>
</head>
<body>
  <div class="profile">
    <div class="avatar">👤</div>
    <div>
      <h1>山田 太郎</h1>
      <p>HTMLを学習中の学生です。</p>
    </div>
  </div>
  <h2>趣味</h2>
  <ul>
    <li>プログラミング</li>
    <li>読書</li>
    <li>音楽</li>
  </ul>
</body>
</html>`,
  },
  {
    id: 'sample-recipe',
    name: 'レシピカード',
    isSample: true,
    htmlCode: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>カレーの作り方</title>
  <style>
    body { font-family: sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; background: #fef3c7; }
    .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #d97706; }
    ol li { margin: 0.5rem 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🍛 カレーの作り方</h1>
    <p><strong>材料：</strong>玉ねぎ、にんじん、じゃがいも、肉、カレールー</p>
    <h2>手順</h2>
    <ol>
      <li>野菜と肉を切る</li>
      <li>肉を炒める</li>
      <li>野菜を加えて煮込む</li>
      <li>ルーを溶かして完成</li>
    </ol>
  </div>
</body>
</html>`,
  },
];

const BADGES = [
  { id: 'first_lesson', title: 'はじめの一歩', description: '最初のレッスンを完了', icon: '⭐', requiredLessonCount: 1 },
  { id: 'five_lessons', title: 'HTML見習い', description: '5レッスンを完了', icon: '🌟', requiredLessonCount: 5 },
  { id: 'half_course', title: 'HTML中級者', description: '半分のレッスンを完了', icon: '🏅', requiredLessonCount: 6 },
  { id: 'full_course', title: 'HTMLマスター', description: '全レッスンを完了', icon: '👑', requiredLessonCount: 12 },
  { id: 'study_hour', title: '学習の達人', description: '1時間以上学習', icon: '⏱', requiredLessonCount: 0 },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const Storage = {
  getProgress() {
    return loadJSON(STORAGE_KEYS.progress, { ...DEFAULT_PROGRESS });
  },

  saveProgress(progress) {
    saveJSON(STORAGE_KEYS.progress, progress);
  },

  getSettings() {
    return { ...DEFAULT_SETTINGS, ...loadJSON(STORAGE_KEYS.settings, {}) };
  },

  saveSettings(settings) {
    saveJSON(STORAGE_KEYS.settings, settings);
  },

  getProjects() {
    let projects = loadJSON(STORAGE_KEYS.projects, []);
    const existingIds = new Set(projects.map(p => p.id));
    for (const sample of SAMPLE_PROJECTS) {
      if (!projects.some(p => p.id === sample.id || (p.isSample && p.name === sample.name))) {
        projects.push({
          ...sample,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        });
      }
    }
    return projects;
  },

  saveProjects(projects) {
    saveJSON(STORAGE_KEYS.projects, projects);
  },

  lessonProgress(lessonId) {
    const p = this.getProgress();
    return p.lessonProgress[lessonId] || {
      isCompleted: false, quizScore: 0, practicePassed: false,
      lastAccessedAt: null, timeSpentSeconds: 0,
    };
  },

  isLessonUnlocked(lesson, lessons) {
    if (!lesson.requiredLessonId) return true;
    return this.lessonProgress(lesson.requiredLessonId).isCompleted;
  },

  markLessonAccessed(lessonId) {
    const p = this.getProgress();
    const lp = p.lessonProgress[lessonId] || {};
    lp.lastAccessedAt = Date.now();
    p.lessonProgress[lessonId] = lp;
    this.saveProgress(p);
  },

  markPracticePassed(lessonId) {
    const p = this.getProgress();
    const lp = { ...this.lessonProgress(lessonId), practicePassed: true };
    p.lessonProgress[lessonId] = lp;
    this.checkLessonComplete(p, lessonId);
    this.saveProgress(p);
    this.updateBadges(p);
  },

  saveQuizScore(lessonId, score) {
    const p = this.getProgress();
    const lp = this.lessonProgress(lessonId);
    lp.quizScore = Math.max(lp.quizScore || 0, score);
    p.lessonProgress[lessonId] = lp;
    this.checkLessonComplete(p, lessonId);
    this.saveProgress(p);
    this.updateBadges(p);
  },

  checkLessonComplete(p, lessonId) {
    const lp = p.lessonProgress[lessonId];
    if (lp?.practicePassed && (lp.quizScore || 0) >= 60) {
      lp.isCompleted = true;
      p.lessonProgress[lessonId] = lp;
    }
  },

  completionRate(totalLessons) {
    const p = this.getProgress();
    const completed = Object.values(p.lessonProgress).filter(lp => lp.isCompleted).length;
    return totalLessons ? (completed / totalLessons) * 100 : 0;
  },

  exerciseProgress(exerciseId) {
    const p = this.getProgress();
    return p.exerciseProgress[exerciseId] || {
      isCompleted: false, attempts: 0, hintsUsed: 0, lastAttemptAt: null,
    };
  },

  markExerciseAttempt(exerciseId, passed, hintsUsed) {
    const p = this.getProgress();
    const ep = this.exerciseProgress(exerciseId);
    ep.attempts += 1;
    ep.hintsUsed = hintsUsed;
    ep.lastAttemptAt = Date.now();
    if (passed) ep.isCompleted = true;
    p.exerciseProgress[exerciseId] = ep;
    this.saveProgress(p);
  },

  updateBadges(p) {
    const completed = Object.values(p.lessonProgress).filter(lp => lp.isCompleted).length;
    for (const badge of BADGES) {
      if (badge.requiredLessonCount > 0 && completed >= badge.requiredLessonCount) {
        if (!p.earnedBadgeIds.includes(badge.id)) p.earnedBadgeIds.push(badge.id);
      }
    }
    if (p.totalStudyTimeSeconds >= 3600 && !p.earnedBadgeIds.includes('study_hour')) {
      p.earnedBadgeIds.push('study_hour');
    }
    this.saveProgress(p);
  },

  hasBadge(id) {
    return this.getProgress().earnedBadgeIds.includes(id);
  },

  formattedStudyTime() {
    const secs = this.getProgress().totalStudyTimeSeconds;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}時間${m}分` : `${m}分`;
  },

  addStudyTime(seconds) {
    const p = this.getProgress();
    p.totalStudyTimeSeconds += seconds;
    this.saveProgress(p);
    this.updateBadges(p);
  },

  completeOnboarding() {
    const p = this.getProgress();
    p.onboardingCompleted = true;
    this.saveProgress(p);
  },

  completeTutorial() {
    const p = this.getProgress();
    p.tutorialCompleted = true;
    this.saveProgress(p);
  },

  createProject(name, htmlCode = DEFAULT_HTML) {
    const projects = this.getProjects();
    const project = {
      id: 'proj_' + Date.now(),
      name,
      htmlCode,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      isSample: false,
    };
    projects.unshift(project);
    this.saveProjects(projects);
    return project;
  },

  updateProject(id, htmlCode) {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      projects[idx].htmlCode = htmlCode;
      projects[idx].modifiedAt = Date.now();
      this.saveProjects(projects);
    }
  },

  renameProject(id, name) {
    const projects = this.getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      projects[idx].name = name;
      projects[idx].modifiedAt = Date.now();
      this.saveProjects(projects);
    }
  },

  deleteProject(id) {
    const projects = this.getProjects().filter(p => p.id !== id && !p.isSample);
    this.saveProjects(projects);
  },

  exportForTeacher(studentName, lessons) {
    const p = this.getProgress();
    const completed = lessons.filter(l => this.lessonProgress(l.id).isCompleted).map(l => l.title);
    return {
      exportedAt: new Date().toISOString(),
      studentName,
      progress: p,
      completedLessons: completed,
      completionRate: this.completionRate(lessons.length),
    };
  },

  DEFAULT_HTML,
  BADGES,
};
