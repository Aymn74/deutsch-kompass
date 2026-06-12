/* App shell: routing, language toggle, global keyboard */
(function () {
  const VIEWS = { atlas: KK.atlas, adjektiv: KK.adjektiv, genus: KK.genus, pronomen: KK.pronomen, drill: KK.drill, stats: KK.stats };
  let current = 'atlas';

  function show(view) {
    if (current === 'drill' && view !== 'drill') KK.drill.stop();
    const changed = current !== view;
    current = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.querySelectorAll('#nav button').forEach(b =>
      b.classList.toggle('active', b.dataset.view === view));
    VIEWS[view].render();
    window.scrollTo({ top: 0 });
    if (changed) KK.sfx.transition();
  }

  function applyLang() {
    const lang = KK.state.get().lang;
    document.querySelectorAll('#langToggle button').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === lang));
    VIEWS[current].render();
  }

  document.getElementById('nav').addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if (b) show(b.dataset.view);
  });

  document.getElementById('langToggle').addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    KK.state.setLang(b.dataset.lang);
    applyLang();
    KK.sfx.transition();
  });

  /* Feedback-sound mute toggle in the header */
  const sfxBtn = document.getElementById('sfxToggle');
  function sfxIcon() {
    sfxBtn.textContent = KK.sfx.muted() ? '🔇' : '🔊';
    sfxBtn.title = KK.sfx.muted() ? 'Feedback-Töne einschalten' : 'Feedback-Töne stummschalten';
    sfxBtn.classList.toggle('muted', KK.sfx.muted());
  }
  sfxBtn.addEventListener('click', () => { KK.sfx.toggle(); sfxIcon(); KK.sfx.tap(); });
  sfxIcon();

  /* 🔊 pronunciation buttons (atlas + drills) — one delegated listener */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-speak]');
    if (b) KK.speak(b.dataset.speak);
  });

  /* Subtle button tap, separate from correct/wrong feedback sounds. */
  document.addEventListener('click', e => {
    const b = e.target.closest('button, [role="button"]');
    if (!b || b.disabled || b.id === 'sfxToggle') return;
    KK.sfx.tap();
  }, true);

  /* Global keyboard: drill answers first, then navigation shortcuts */
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // active drill/quiz consumes number keys / Enter
    if (current === 'drill' && KK.drillKey(e)) { e.preventDefault(); return; }
    if (current === 'genus' && KK.genus.key(e)) { e.preventDefault(); return; }
    if (current === 'pronomen' && KK.pronomen.key(e)) { e.preventDefault(); return; }

    const k = e.key.toLowerCase();

    // while a drill/quiz is running, letters must not navigate away (progress would be lost)
    const busy = (current === 'drill' && KK.drill.isActive()) ||
                 (current === 'genus' && KK.genus.isQuizActive()) ||
                 (current === 'pronomen' && KK.pronomen.isQuizActive());

    if (k === 'escape') {
      if (current === 'atlas') KK.atlas.clearLock();
      else if (current === 'drill' && KK.drill.isActive()) KK.drill.back();
    }
    else if (busy) { /* letter shortcuts disabled mid-training */ }
    else if (k === 'a') show('atlas');
    else if (k === 'j') show('adjektiv');
    else if (k === 'g') show('genus');
    else if (k === 'p') show('pronomen');
    else if (k === 's') show('stats');
    else if (k === 'd') show('drill');
    else if (current === 'drill' && '1234'.includes(e.key)) {
      // no active question → number selects a mode
      KK.drill.modeKey(parseInt(e.key, 10));
      e.preventDefault();
    }
  });

  KK.app = { show, applyLang };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  }

  // boot
  applyLang();
  show('atlas');
})();
