/**
 * HTML Playground — メインアプリケーション
 */
import { Storage } from './storage.js';
import {
  renderSidebar, renderHome, bindHome,
  renderLessons, renderLessonDetail, bindLessonDetail,
  renderEditor, bindEditor,
  renderExercises, renderExerciseDetail, bindExerciseDetail,
  renderRoadmap, renderSnippets, bindSnippets,
  renderBadges, renderTeacher, bindTeacher,
  renderHelp, renderSettings, bindSettings,
  renderOnboarding, renderTutorial,
} from './views.js';

const App = {
  view: 'home',
  param: null,
  filter: '',
  lessons: [],
  exercises: [],
  snippets: [],
  studyTimer: null,
  obStep: 0,
  tutStep: 0,

  async init() {
    await this.loadData();
    this.applyTheme();
    this.startStudyTimer();
    this.checkOnboarding();
    if (location.hash) {
      this.parseHash();
    } else {
      this.render();
    }
    window.addEventListener('hashchange', () => this.parseHash());
  },

  async loadData() {
    const [lessons, exercises, snippets] = await Promise.all([
      fetch('/data/lessons.json').then(r => r.json()),
      fetch('/data/exercises.json').then(r => r.json()),
      fetch('/data/snippets.json').then(r => r.json()),
    ]);
    this.lessons = lessons.sort((a, b) => a.chapter - b.chapter);
    this.exercises = exercises;
    this.snippets = snippets;
  },

  parseHash() {
    const hash = location.hash.slice(1) || 'home';
    const [view, param] = hash.split('/');
    this.view = view;
    this.param = param || null;
    this.render();
  },

  navigate(view, param = null, filter = '') {
    this.view = view;
    this.param = param;
    if (filter) this.filter = filter;
    const hash = param ? `${view}/${param}` : view;
    if (location.hash !== '#' + hash) {
      location.hash = hash;
    } else {
      this.render();
    }
  },

  applyTheme() {
    const s = Storage.getSettings();
    let theme = s.theme;
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  },

  startStudyTimer() {
    const start = Date.now();
    this.studyTimer = setInterval(() => {
      Storage.addStudyTime(60);
    }, 60000);
    window.addEventListener('beforeunload', () => {
      Storage.addStudyTime(Math.floor((Date.now() - start) / 1000));
    });
  },

  checkOnboarding() {
    const p = Storage.getProgress();
    if (!p.onboardingCompleted) {
      this.obStep = 0;
      this.showOnboarding();
    } else if (!p.tutorialCompleted) {
      this.tutStep = 0;
      this.showTutorial();
    }
  },

  showOnboarding() {
    const container = document.getElementById('modals');
    container.innerHTML = renderOnboarding(this.obStep);
    container.querySelector('#ob-back')?.addEventListener('click', () => {
      this.obStep--;
      this.showOnboarding();
    });
    container.querySelector('#ob-next')?.addEventListener('click', () => {
      if (this.obStep < 3) {
        this.obStep++;
        this.showOnboarding();
      } else {
        Storage.completeOnboarding();
        container.innerHTML = '';
        this.tutStep = 0;
        this.showTutorial();
      }
    });
  },

  showTutorial() {
    const container = document.getElementById('modals');
    container.innerHTML = renderTutorial(this.tutStep);
    container.querySelector('#tut-skip')?.addEventListener('click', () => {
      Storage.completeTutorial();
      container.innerHTML = '';
    });
    container.querySelector('#tut-next')?.addEventListener('click', () => {
      if (this.tutStep < 3) {
        this.tutStep++;
        this.showTutorial();
      } else {
        Storage.completeTutorial();
        container.innerHTML = '';
      }
    });
  },

  render() {
    const app = document.getElementById('app');
    const sidebarView = this.view.startsWith('lesson') && this.param ? 'lessons' :
      this.view.startsWith('exercise') && this.param ? 'exercises' : this.view;

    app.innerHTML = `
      ${renderSidebar(sidebarView, this.lessons)}
      <div class="main-area">
        <button class="mobile-menu-btn" id="mobile-menu" aria-label="メニューを開く">☰</button>
        <main id="content" role="main"></main>
      </div>
    `;

    app.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.nav);
        this.toggleMobileNav(false);
      });
    });

    document.getElementById('mobile-menu')?.addEventListener('click', () => {
      app.querySelector('.sidebar')?.classList.toggle('open');
    });

    const content = document.getElementById('content');
    this.renderContent(content);
  },

  renderContent(content) {
    const { view, param, lessons, exercises, snippets, filter } = this;

    switch (view) {
      case 'home':
        content.innerHTML = renderHome(lessons, (v, p, f) => this.navigate(v, p, f));
        bindHome(content, (v, p) => this.navigate(v, p), lessons);
        break;
      case 'lessons':
        content.innerHTML = renderLessons(lessons, filter);
        content.querySelectorAll('[data-lesson]').forEach(el =>
          el.addEventListener('click', () => this.navigate('lesson', el.dataset.lesson)));
        break;
      case 'lesson':
        const lesson = lessons.find(l => l.id === param);
        if (!lesson) { content.innerHTML = '<p>レッスンが見つかりません</p>'; return; }
        if (!Storage.isLessonUnlocked(lesson, lessons)) {
          content.innerHTML = '<p>前のレッスンを完了してください。</p>';
          return;
        }
        content.innerHTML = renderLessonDetail(lesson, lessons);
        bindLessonDetail(content, lesson, lessons, (v, p) => this.navigate(v, p));
        break;
      case 'editor':
        content.innerHTML = renderEditor(param);
        bindEditor(content, param, (v, p) => this.navigate(v, p));
        break;
      case 'exercises':
        content.innerHTML = renderExercises(exercises, param || '初級');
        content.querySelectorAll('.diff-tab').forEach(tab =>
          tab.addEventListener('click', () => this.navigate('exercises', tab.dataset.diff)));
        content.querySelectorAll('[data-exercise]').forEach(el =>
          el.addEventListener('click', () => this.navigate('exercise', el.dataset.exercise)));
        break;
      case 'exercise':
        const ex = exercises.find(e => e.id === param);
        if (!ex) { content.innerHTML = '<p>練習問題が見つかりません</p>'; return; }
        content.innerHTML = renderExerciseDetail(ex);
        bindExerciseDetail(content, ex, (v, p) => this.navigate(v, p));
        break;
      case 'roadmap':
        content.innerHTML = renderRoadmap(lessons);
        break;
      case 'snippets':
        content.innerHTML = renderSnippets(snippets);
        bindSnippets(content);
        break;
      case 'badges':
        content.innerHTML = renderBadges();
        break;
      case 'teacher':
        content.innerHTML = renderTeacher(lessons);
        bindTeacher(content, lessons);
        break;
      case 'help':
        content.innerHTML = renderHelp();
        break;
      case 'settings':
        content.innerHTML = renderSettings();
        bindSettings(content, () => this.applyTheme());
        break;
      default:
        content.innerHTML = renderHome(lessons, (v, p) => this.navigate(v, p));
        bindHome(content, (v, p) => this.navigate(v, p), lessons);
    }
  },

  toggleMobileNav(open) {
    document.querySelector('.sidebar')?.classList.toggle('open', open);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
