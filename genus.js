/* Module 5 — Geschlecht-Hinweise: Genus an Endung & Kategorie erkennen (Referenz + Hinweis-Quiz) */
(function () {
  const root = () => document.getElementById('view-genus');
  const ART = { m: 'der', f: 'die', n: 'das' };
  const QUIZ_LEN = 10;
  let tab = 'ref';
  let activeGender = 'm';
  const rulePages = {};
  let quiz = null;        // {i, right, streak, used:Set, q, phase, ok}
  let keyHandler = null;

  /* quiz pool built once from the reference data (ex + quiz words) */
  let POOL = null;
  function buildPool() {
    if (POOL) return POOL;
    POOL = [];
    const seen = new Set();
    for (const g of ['m', 'f', 'n'])
      for (const kind of ['endings', 'categories'])
        for (const r of KK.GENUS[g][kind]) {
          if (r.noQuiz) continue;
          for (const w of (r.ex || []).concat(r.quiz || [])) {
            if (seen.has(w)) continue;
            seen.add(w);
            POOL.push({ w, g, rule: r, kind });
          }
        }
    return POOL;
  }

  /* ============ Referenz ============ */
  function indicatorRow(g, r, kind, index, activeIndex) {
    const sufSpeak = kind === 'endings' ? r.lbl.replace(/^-/, '').split(/[\s/]/)[0] : ART[g] + ' ' + r.ex[0];
    return `<div class="ind${r.abs ? ' ind-abs' : ''}${index === activeIndex ? ' is-active' : ''}" data-rule-card="${kind}" data-rule-index="${index}">
      <div class="ind-head">
        <button type="button" class="suf-chip gc-${g}" data-speak="${sufSpeak}">${r.lbl} 🔊</button>
        <span class="rel${r.rel >= 99 ? ' rel-100' : ''}">${r.rel >= 99 ? '100%' : '~' + r.rel + '%'}</span>
        ${r.abs ? '<span class="abs-tag">💎 absolute Regel — keine Ausnahmen</span>' : ''}
      </div>
      <div class="ind-ex">${r.ex.map(w =>
        `<span class="ex-word" data-speak="${ART[g]} ${w}">${ART[g]} <b>${w}</b></span>`).join(' · ')}</div>
      <div class="ind-ar" dir="rtl" lang="ar">${r.ar}</div>
      ${r.trap ? `<div class="trap-note">⚠️ ${r.trap}<div dir="rtl" lang="ar">${r.trapAr || ''}</div></div>` : ''}
    </div>`;
  }

  function pageKey(g, kind) {
    return `${g}-${kind}`;
  }

  function pageIndex(g, kind, total) {
    const key = pageKey(g, kind);
    const current = rulePages[key] || 0;
    return Math.min(Math.max(current, 0), Math.max(total - 1, 0));
  }

  function pagerHtml(g, kind, total, index) {
    return `<div class="page-controls rule-pager" data-rule-pager="${kind}">
      <button type="button" data-rule-page="${kind}" data-step="-1" ${index <= 0 ? 'disabled' : ''}>‹</button>
      <span>${index + 1} / ${total}</span>
      <button type="button" data-rule-page="${kind}" data-step="1" ${index >= total - 1 ? 'disabled' : ''}>›</button>
    </div>`;
  }

  function pickerHtml() {
    return `<div class="genus-picker" role="group" aria-label="Genus auswählen">
      ${['m', 'f', 'n'].map(g => `<button type="button" data-gender-filter="${g}" aria-pressed="${g === activeGender}" class="${g === activeGender ? 'active' : ''}">
        <span class="gc-${g}">${ART[g]}</span><small>${KK.GENDER_META[g].de}</small>
      </button>`).join('')}
    </div>`;
  }

  function groupHtml(g) {
    const grp = KK.GENUS[g];
    const endingIndex = pageIndex(g, 'endings', grp.endings.length);
    const categoryIndex = pageIndex(g, 'categories', grp.categories.length);
    return `<section class="genus-group gg-${g}${g === activeGender ? ' is-active' : ''}" data-g="${g}">
      <h2>${KK.genderBadge(g)} <span class="gg-art gc-${g}">${ART[g]}</span></h2>
      <div class="ind-section">
        <div class="section-head"><h4>Endungen</h4>${pagerHtml(g, 'endings', grp.endings.length, endingIndex)}</div>
        <div class="ind-strip">${grp.endings.map((r, i) => indicatorRow(g, r, 'endings', i, endingIndex)).join('')}</div>
      </div>
      <div class="ind-section">
        <div class="section-head"><h4>Kategorien</h4>${pagerHtml(g, 'categories', grp.categories.length, categoryIndex)}</div>
        <div class="ind-strip">${grp.categories.map((r, i) => indicatorRow(g, r, 'categories', i, categoryIndex)).join('')}</div>
      </div>
    </section>`;
  }

  function renderRef() {
    keyHandler = null;
    const host = body();
    host.innerHTML = `
      <details class="absolute-rule">
        <summary><b>Die zwei absoluten Regeln:</b> -chen / -lein → ${KK.genderBadge('n')}</summary>
        <div class="absolute-rule-body">
          Alles auf <b>-chen</b> und <b>-lein</b> ist <b>immer</b>
          ${KK.genderBadge('n')} — ohne eine einzige Ausnahme. Sogar
          <span class="ex-word" data-speak="das Mädchen">das <b>Mädchen</b></span>:
          ein Mädchen ist weiblich, das Wort trotzdem Neutrum.
          <div dir="rtl" lang="ar">القاعدتان المطلقتان: كل ما ينتهي بـ -chen أو -lein محايد دائمًا، بلا أي استثناء — حتى كلمة «بنت» das Mädchen محايدة نحويًا.</div>
        </div>
      </details>
      ${pickerHtml()}
      <div class="genus-groups" data-active-gender="${activeGender}">${['m', 'f', 'n'].map(groupHtml).join('')}</div>`;

    host.onclick = e => {
      const genderButton = e.target.closest('[data-gender-filter]');
      if (genderButton) {
        activeGender = genderButton.dataset.genderFilter;
        renderRef();
        KK.sfx.transition();
        return;
      }

      const b = e.target.closest('[data-rule-page]');
      if (!b) return;
      const kind = b.dataset.rulePage;
      const grp = KK.GENUS[activeGender][kind];
      const key = pageKey(activeGender, kind);
      const next = pageIndex(activeGender, kind, grp.length) + Number(b.dataset.step);
      rulePages[key] = Math.min(Math.max(next, 0), grp.length - 1);
      renderRef();
      KK.sfx.transition();
    };
  }

  /* ============ Hinweis-Quiz ============ */
  function startQuiz() {
    quiz = { i: 0, right: 0, streak: 0, used: new Set(), q: null, phase: 'q', ok: false };
    nextQ();
  }

  function pickItem() {
    const s = quiz;
    // traps appear from question 6 on, ~25% of the time
    if (s.i > 5 && Math.random() < 0.25) {
      const rem = KK.GENUS_TRAPS.filter(t => !s.used.has(t.w));
      if (rem.length) {
        const t = rem[Math.floor(Math.random() * rem.length)];
        return { w: t.w, g: t.g, trap: t };
      }
    }
    // first 5 questions: only the ~100% rules; afterwards the full pool
    let pool = buildPool().filter(p => !s.used.has(p.w) && (s.i <= 5 ? p.rule.rel >= 99 : true));
    if (!pool.length) pool = buildPool();
    // lean toward the learner's weakest gender (existing Leitner stats)
    let best = null, bestW = -1;
    for (let i = 0; i < 5; i++) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      const w = KK.state.errRate('genus', 'hint', c.g) + Math.random() * 0.3;
      if (w > bestW) { bestW = w; best = c; }
    }
    return best;
  }

  function nextQ() {
    const s = quiz;
    if (s.i >= QUIZ_LEN) return endQuiz();
    s.i++;
    s.q = pickItem();
    s.used.add(s.q.w);
    s.phase = 'q';
    renderQuiz();
  }

  function whyHtml(q) {
    if (q.trap) return `<div class="trap-note">⚠️ <b>Falle!</b> ${q.trap.de}
      <div dir="rtl" lang="ar">${q.trap.ar}</div></div>`;
    const r = q.rule;
    const head = q.kind === 'endings' ? `endet auf <b>${r.lbl}</b>` : `Kategorie: <b>${r.lbl}</b>`;
    return `<div class="why-rule">${head} → ${r.rel >= 99 ? 'immer' : 'meist'} ${KK.genderBadge(q.g)}
      <div dir="rtl" lang="ar">${r.ar}</div></div>`;
  }

  function renderQuiz() {
    const s = quiz;
    if (!s) {  // intro screen
      startQuiz();
      return;
    }
    const answered = s.phase === 'fb';
    body().innerHTML = `<div class="drill-runner-head">
      <button class="btn drill-back" type="button" id="quizBack">‹ Zurück</button>
      <div>
        <h1>Hinweis-Quiz</h1>
        <p class="lede">${QUIZ_LEN} Nomen — wähle der, die oder das.</p>
      </div>
    </div>
    <div class="drill-stage">
      <div class="drill-meta">
        <span>Frage <b>${s.i}</b> / ${QUIZ_LEN}</span>
        <span>Richtig: <b>${s.right}</b></span>
        <span class="streak ${s.streak >= 5 ? 'hot' : ''}">🔥 ${s.streak}</span>
      </div>
      <div class="blitz-big">___ <b>${s.q.w}</b> <button type="button" class="speak-btn" data-speak="${s.q.w}" title="Wort anhören">🔊</button></div>
      ${answered ? `
        <div class="feedback">${s.ok ? '<span class="yes">Richtig!</span>' : '<span class="no">Leider nein.</span>'}
          — <b class="gc-${s.q.g}">${ART[s.q.g]} ${s.q.w}</b>${KK.genderBadge(s.q.g)}${KK.speakBtn(ART[s.q.g] + ' ' + s.q.w)}
          ${whyHtml(s.q)}</div>
        <button class="btn primary" id="quizNext">${s.i >= QUIZ_LEN ? 'Ergebnis' : 'Weiter'} <kbd style="opacity:.6">Enter</kbd></button>`
        : `<div class="opts" style="justify-content:center">${['m', 'f', 'n'].map((g, i) =>
          `<button class="opt opt-art gc-border-${g}" data-g="${g}"><span class="num">${i + 1}</span><span class="gc-${g}">${ART[g]}</span></button>`).join('')}</div>`}
      <div class="kbd-hint"><kbd>1</kbd> der · <kbd>2</kbd> die · <kbd>3</kbd> das · <kbd>Enter</kbd> weiter</div>
    </div>`;
    body().querySelector('#quizBack').addEventListener('click', backToRef);
    if (!answered) {
      body().querySelectorAll('.opt-art').forEach(b => b.addEventListener('click', () => answer(b.dataset.g)));
      keyHandler = e => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 3) { answer(['m', 'f', 'n'][n - 1]); return true; }
        return false;
      };
    } else {
      body().querySelector('#quizNext').addEventListener('click', nextQ);
      keyHandler = e => { if (e.key === 'Enter') { nextQ(); return true; } return false; };
    }
  }

  function answer(g) {
    const s = quiz;
    if (!s || s.phase !== 'q') return;
    const ok = g === s.q.g;
    s.ok = ok;
    KK.sfx.play(ok);
    KK.state.record('genus', 'hint', s.q.g, ok);
    if (ok) { s.right++; s.streak++; } else s.streak = 0;
    KK.state.setBestStreak(s.streak);
    s.phase = 'fb';
    renderQuiz();
  }

  function endQuiz() {
    const s = quiz;
    const perfect = s.right === QUIZ_LEN;
    if (perfect) KK.sfx.win();
    body().innerHTML = `<div class="drill-runner-head">
      <button class="btn drill-back" type="button" id="quizBack">‹ Zurück</button>
      <div>
        <h1>Hinweis-Quiz</h1>
        <p class="lede">Runde abgeschlossen.</p>
      </div>
    </div>
    <div class="drill-stage blitz-result">
      <div class="big">${perfect ? '🏆 ' : ''}${s.right} / ${QUIZ_LEN}</div>
      <p>${perfect ? 'Fehlerfreie Runde — die Endungen sitzen! 🎉' : 'Geschafft! Deine Genus-Ergebnisse zählen in der Statistik mit.'}</p>
      <button class="btn primary" id="quizAgain">Nochmal <kbd style="opacity:.6">Enter</kbd></button>
    </div>`;
    body().querySelector('#quizBack').addEventListener('click', backToRef);
    body().querySelector('#quizAgain').addEventListener('click', startQuiz);
    keyHandler = e => { if (e.key === 'Enter') { startQuiz(); return true; } return false; };
    quiz = null;
  }

  /* ============ shell ============ */
  function body() { return document.getElementById('genusBody'); }

  function backToRef() {
    quiz = null;
    keyHandler = null;
    tab = 'ref';
    render();
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    KK.sfx.transition();
  }

  function render() {
    const el = root();
    const lang = KK.state.get().lang;
    // keep a running quiz alive across re-renders (e.g. language switch)
    if (tab !== 'quiz') quiz = null;
    el.innerHTML = `
      <h1>Geschlecht-Hinweise</h1>
      <p class="lede">Errate das Genus nicht — erkenne es. Endung und Kategorie verraten der/die/das meistens, bevor du das Wort je gelernt hast.</p>
      <div class="tabs" id="genusTabs">
        <button data-tab="ref" class="${tab === 'ref' ? 'active' : ''}">📖 Referenz<small>Endungen &amp; Kategorien</small></button>
        <button data-tab="quiz" class="${tab === 'quiz' ? 'active' : ''}">🎯 Hinweis-Quiz<small>der / die / das raten</small></button>
      </div>
      <div id="genusBody"></div>
      <div class="explain" ${lang === 'ar' ? 'dir="rtl" lang="ar"' : ''}>${KK.EXPLAIN.genus[lang]}</div>`;
    el.querySelector('#genusTabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (b) { tab = b.dataset.tab; render(); KK.sfx.transition(); }
    });
    if (tab === 'ref') renderRef();
    else if (quiz) renderQuiz();
    else startQuiz();
  }

  KK.genus = {
    render,
    key: e => keyHandler ? keyHandler(e) : false,
    isQuizActive: () => quiz !== null,
  };
})();
