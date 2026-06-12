/* Module 3 — Drill Arena: Lückentext, Kasus-Detektiv, Präpositionen, Blitz-Runde */
(function () {
  const root = () => document.getElementById('view-drill');
  let mode = null;          // 'luecke' | 'detektiv' | 'praep' | 'blitz'
  let session = null;       // per-mode state
  let keyHandler = null;    // active option keys
  const pendingTimeouts = new Set();

  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- option generation ---------- */
  const ADJ_ENDINGS = ['e', 'en', 'er', 'es', 'em'];
  function artOptions(answer) {
    // distractors from the same article family
    const fam = /^d/.test(answer) && !/^dies/.test(answer)
      ? ['der', 'die', 'das', 'den', 'dem', 'des']
      : /^dies/.test(answer)
        ? ['dieser', 'diese', 'dieses', 'diesen', 'diesem']
        : /^sein/.test(answer)
          ? ['sein', 'seine', 'seinen', 'seinem', 'seiner']
          : ['ein', 'eine', 'einen', 'einem', 'einer', 'eines'];
    const pool = fam.filter(x => x !== answer);
    return shuffle([answer, ...shuffle(pool).slice(0, 3)]);
  }
  function adjOptions(answer) {
    const pool = ADJ_ENDINGS.filter(x => x !== answer);
    return shuffle([answer, ...shuffle(pool).slice(0, 3)]);
  }

  function gridOf(gap) { return gap.k === 'adj' ? gap.w : 'art'; }

  function setKeys(fn) { keyHandler = fn; }
  function later(fn, delay) {
    const id = setTimeout(() => {
      pendingTimeouts.delete(id);
      fn();
    }, delay);
    pendingTimeouts.add(id);
    return id;
  }
  function clearPendingTimeouts() {
    pendingTimeouts.forEach(id => clearTimeout(id));
    pendingTimeouts.clear();
  }
  function cleanupSession() {
    if (session && session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }
    clearPendingTimeouts();
    setKeys(null);
  }
  KK.drillKey = (e) => {
    if (!keyHandler) return false;
    return keyHandler(e);
  };

  function fbLang() { return KK.state.get().lang; }
  function langAttr() { return fbLang() === 'ar' ? ' dir="rtl" lang="ar"' : ''; }
  function tipHtml(text, c) {
    return text ? `<div class="tipp-strip ${c ? 'tip-' + c : ''}"><b>Tipp</b><span${langAttr()}>${text}</span></div>` : '';
  }
  function merksatzHtml(text, c) {
    return text ? `<div class="merksatz-line ${c ? 'tip-' + c : ''}"><b>Merksatz</b><span${langAttr()}>${text}</span></div>` : '';
  }

  /* ============ shell ============ */
  const MODE_LABELS = {
    luecke: 'Lückentext',
    detektiv: 'Kasus-Detektiv',
    praep: 'Präpositionen',
    blitz: 'Blitz-Runde',
  };

  function render() {
    if (mode) {
      renderRunner();
      if (session) {
        // re-render in place (e.g. language switch) — keep the running session
        rerenderQuestion();
      } else {
        cleanupSession();
        launchMode(mode);
      }
      return;
    }
    renderList();
  }

  function rerenderQuestion() {
    if (mode === 'luecke') renderLuecke();
    else if (mode === 'detektiv') renderDetektiv();
    else if (mode === 'praep') renderPraep();
    else if (mode === 'blitz') { if (session.timer) renderBlitz(); else endBlitz(); }
  }

  function renderList() {
    const el = root();
    const lang = fbLang();
    cleanupSession();
    el.innerHTML = `
      <h1>Drill-Arena</h1>
      <p class="lede">Hier wird trainiert. Der Trainer kennt deine schwachen Zellen und fragt sie öfter ab.</p>
      <div class="modes" id="modes">
        <button class="mode-card ${mode === 'luecke' ? 'active' : ''}" data-mode="luecke"><span class="key">1</span>
          <h3>Lückentext</h3><p>Artikel &amp; Endungen in echten Sätzen ergänzen.</p></button>
        <button class="mode-card ${mode === 'detektiv' ? 'active' : ''}" data-mode="detektiv"><span class="key">2</span>
          <h3>Kasus-Detektiv</h3><p>Welcher Kasus — und warum? Trigger erkennen.</p></button>
        <button class="mode-card ${mode === 'praep' ? 'active' : ''}" data-mode="praep"><span class="key">3</span>
          <h3>Präpositionen</h3><p>mit/für/wegen … und die 9 Wechselpräpositionen.</p></button>
        <button class="mode-card ${mode === 'blitz' ? 'active' : ''}" data-mode="blitz"><span class="key">4</span>
          <h3>Blitz-Runde ⚡</h3><p>60 Sekunden, Streak-Zähler, volle Geschwindigkeit.</p></button>
      </div>
      <div class="explain" ${lang === 'ar' ? 'dir="rtl" lang="ar"' : ''}>${KK.EXPLAIN.drill[lang]}</div>
    `;
    el.querySelector('#modes').addEventListener('click', e => {
      const b = e.target.closest('[data-mode]');
      if (b) startMode(b.dataset.mode);
    });
  }

  function renderRunner() {
    const el = root();
    el.innerHTML = `
      <div class="drill-runner-head">
        <button class="btn drill-back" type="button" id="drillBack">‹ Zurück</button>
        <div>
          <h1>${MODE_LABELS[mode]}</h1>
          <p class="lede">Trainiere diesen Abschnitt. Du kannst jederzeit zur Auswahl zurück.</p>
        </div>
      </div>
      <div id="stage"></div>
    `;
    el.querySelector('#drillBack').addEventListener('click', backToModes);
  }

  function stageEl() { return document.getElementById('stage'); }

  function startMode(m) {
    cleanupSession();
    mode = m; session = null;
    renderRunner();
    launchMode(m);
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    KK.sfx.transition();
  }

  function launchMode(m) {
    if (m === 'luecke') startLuecke();
    if (m === 'detektiv') startDetektiv();
    if (m === 'praep') startPraep();
    if (m === 'blitz') startBlitzIntro();
  }

  function backToModes() {
    cleanupSession();
    mode = null;
    session = null;
    renderList();
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    KK.sfx.transition();
  }

  function metaBar(extra) {
    const s = session;
    return `<div class="drill-meta">
      <span>Frage <b>${s.qnum}</b></span>
      <span>Richtig: <b>${s.right}</b> / ${s.answered}</span>
      <span class="streak ${s.streak >= 5 ? 'hot' : ''}">🔥 Streak: ${s.streak}</span>
      ${extra || ''}</div>`;
  }

  function feedbackHtml(ok, correctAnswer, note, noteAr, g, speakText) {
    const lang = fbLang();
    const badge = g ? KK.genderBadge(g) : '';
    const spk = speakText ? KK.speakBtn(speakText) : '';
    const head = ok
      ? `<span class="yes">Richtig!</span> — „${correctAnswer}“${badge}${spk}`
      : `<span class="no">Leider nein — richtig ist „${correctAnswer}“.</span>${badge}${spk}`;
    const body = lang === 'ar' && noteAr ? noteAr : (note || '');
    return `${head} ${body ? '· ' + body : ''}`;
  }

  /* ============ Mode 1: Lückentext ============ */
  function startLuecke() {
    session = { qnum: 0, right: 0, answered: 0, streak: 0, lastIdx: -1 };
    nextLuecke();
  }
  function nextLuecke() {
    const s = session;
    s.qnum++;
    const idx = KK.state.pickWeighted(KK.LUECKEN, it => it.gaps, s.lastIdx);
    s.lastIdx = idx;
    s.item = KK.LUECKEN[idx];
    s.gapIdx = 0;
    s.results = [];
    renderLuecke();
  }
  function renderLuecke(showNext) {
    const s = session, it = s.item;
    let gi = 0;
    const sentence = it.t.replace(/___/g, () => {
      const i = gi++;
      const r = s.results[i];
      const cls = r === undefined ? (i === s.gapIdx ? 'gap current' : 'gap')
        : (r.ok ? 'gap ok' : 'gap bad');
      const content = r === undefined ? '&nbsp;&nbsp;&nbsp;'
        : r.shown + (r.k === 'art' ? KK.genderBadge(r.g, true) : '');
      return `<span class="${cls}">${content}</span>`;
    });

    const done = s.gapIdx >= it.gaps.length;
    let optsHtml = '', fb = '';
    if (!done) {
      const gap = it.gaps[s.gapIdx];
      s.opts = gap.k === 'art' ? artOptions(gap.a) : adjOptions(gap.a);
      const kindLbl = gap.k === 'art' ? 'Artikel wählen' : 'Adjektiv-Endung wählen';
      const tip = gap.k === 'adj' ? KK.memoryTips.adjMerksatz(fbLang()) : KK.memoryTips.caseTipp(gap.c, fbLang());
      optsHtml = `${tipHtml(tip, gap.c)}<div style="color:var(--ink-faint);font-size:.82rem">${kindLbl}:</div>
        <div class="opts">${s.opts.map((o, i) =>
          `<button class="opt" data-i="${i}"><span class="num">${i + 1}</span>${gap.k === 'adj' ? '-' : ''}${o}</button>`).join('')}</div>`;
    } else {
      const allOk = s.results.every(r => r.ok);
      let k = 0;
      const full = it.t.replace(/___/g, () => it.gaps[k++].a);
      const artChips = it.gaps.filter(gp => gp.k === 'art').map(gp =>
        `<span class="answer-chip"><b>${gp.a}</b>${KK.genderBadge(gp.g)}${KK.speakBtn(gp.a)}</span>`).join('');
      fb = `<div class="feedback">${allOk ? '<span class="yes">Perfekt — ganzer Satz richtig! 🎉</span>' : '<span class="no">Satz abgeschlossen.</span>'}
        ${KK.speakBtn(full)} · <i>${it.note}</i>
        ${artChips ? `<div class="answer-row">${artChips}</div>` : ''}</div>
        <button class="btn primary" id="nextBtn">Weiter <kbd style="opacity:.6">Enter</kbd></button>`;
    }

    stageEl().innerHTML = `<div class="drill-stage">
      ${metaBar()}
      <div class="drill-q">${sentence}</div>
      ${optsHtml}${fb}
      <div id="merksatzSlot"></div>
      <div class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> wählen · <kbd>Enter</kbd> weiter</div>
    </div>`;

    if (!done) {
      stageEl().querySelectorAll('.opt').forEach(b =>
        b.addEventListener('click', () => answerLuecke(+b.dataset.i)));
      setKeys(e => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= s.opts.length) { answerLuecke(n - 1); return true; }
        return false;
      });
    } else {
      const nb = stageEl().querySelector('#nextBtn');
      if (nb) nb.addEventListener('click', nextLuecke);
      setKeys(e => { if (e.key === 'Enter') { nextLuecke(); return true; } return false; });
    }
  }
  function answerLuecke(i) {
    const s = session, gap = s.item.gaps[s.gapIdx];
    const chosen = s.opts[i];
    const ok = chosen === gap.a;
    KK.sfx.play(ok);
    KK.state.record(gridOf(gap), gap.c, gap.g, ok);
    s.answered++; if (ok) { s.right++; s.streak++; } else s.streak = 0;
    KK.state.setBestStreak(s.streak);
    // show the answer in the gap (always the CORRECT one; mark red if user missed)
    s.results[s.gapIdx] = { ok, shown: gap.a, k: gap.k, g: gap.g };
    // brief visual on buttons
    stageEl().querySelectorAll('.opt').forEach((b, bi) => {
      b.disabled = true;
      if (s.opts[bi] === gap.a) b.classList.add('ok');
      else if (bi === i) b.classList.add('bad');
    });
    if (!ok) {
      const slot = stageEl().querySelector('#merksatzSlot');
      if (slot) slot.innerHTML = merksatzHtml(KK.memoryTips.gapMerksatz(gap, fbLang()), gap.c);
    }
    setKeys(null);
    later(() => { s.gapIdx++; renderLuecke(); }, ok ? 350 : 1700);
  }

  /* ============ Mode 2: Kasus-Detektiv ============ */
  function startDetektiv() {
    session = { qnum: 0, right: 0, answered: 0, streak: 0, lastIdx: -1 };
    nextDetektiv();
  }
  function nextDetektiv() {
    const s = session;
    s.qnum++;
    const gapsOf = it => [{ k: 'art', c: it.c, g: 'm' }]; // weight by case row
    const idx = KK.state.pickWeighted(KK.DETEKTIV, gapsOf, s.lastIdx);
    s.lastIdx = idx;
    s.item = KK.DETEKTIV[idx];
    s.phase = 'case'; // then 'why', then 'done'
    renderDetektiv();
  }
  function whyOptions(correct) {
    const all = Object.keys(KK.REASONS).filter(k => k !== correct);
    return shuffle([correct, ...shuffle(all).slice(0, 3)]);
  }
  function renderDetektiv() {
    const s = session, it = s.item;
    const lang = fbLang();
    const sentence = it.t.replace(/\{([^}]+)\}/, (m, np) =>
      `<span class="${s.phase === 'done' ? 'k-' + it.c : ''}" style="border-bottom:2px solid ${s.phase === 'done' ? 'currentColor' : 'var(--ink-faint)'};font-weight:600">${np}</span>`);

    let body = '';
    if (s.phase === 'case') {
      s.opts = KK.CASES.map(c => c.id);
      body = `${tipHtml(KK.memoryTips.detektivTipp(lang), null)}<div style="color:var(--ink-faint);font-size:.82rem">In welchem Kasus steht das markierte Nomen?</div>
        <div class="opts">${KK.CASES.map((c, i) =>
          `<button class="opt" data-i="${i}" style="border-color:color-mix(in srgb, ${c.id === 'nom' ? 'var(--c-nom)' : c.id === 'akk' ? 'var(--c-akk)' : c.id === 'dat' ? 'var(--c-dat)' : 'var(--c-gen)'} 45%, var(--line))">
            <span class="num">${i + 1}</span><span class="k-${c.id}">${c.de}</span></button>`).join('')}</div>`;
    } else if (s.phase === 'why') {
      body = `${s.caseOk ? '' : merksatzHtml(KK.memoryTips.caseMerksatz(it.c, lang), it.c)}<div style="color:var(--ink-faint);font-size:.82rem">Richtig: <b class="k-${it.c}">${KK.CASE[it.c].de}</b>. Und <b>warum</b>?</div>
        <div class="opts" style="flex-direction:column;align-items:stretch">${s.whyOpts.map((w, i) =>
          `<button class="opt" data-i="${i}" style="font-family:var(--sans);font-size:.95rem;text-align:left">
            <span class="num">${i + 1}</span>${lang === 'ar' ? KK.REASONS[w].ar + ' — ' + KK.REASONS[w].de : KK.REASONS[w].de}</button>`).join('')}</div>`;
    } else {
      const okC = s.caseOk, okW = s.whyOk;
      body = `<div class="feedback">
        ${okC && okW ? '<span class="yes">Voll aufgeklärt, Detektiv! 🕵️</span>' : okC ? '<span class="no">Kasus richtig, Grund daneben.</span>' : '<span class="no">Der Fall geht an dich zurück.</span>'}
        <br>Trigger: <b>${it.trigger}</b> → <span class="k-${it.c}">${KK.CASE[it.c].de}</span> (${lang === 'ar' ? KK.REASONS[it.why].ar : KK.REASONS[it.why].de}) ${KK.speakBtn(it.t.replace(/\{([^}]+)\}/, '$1'))}<br><i>${it.expl}</i></div>
        <button class="btn primary" id="nextBtn">Nächster Fall <kbd style="opacity:.6">Enter</kbd></button>`;
    }

    stageEl().innerHTML = `<div class="drill-stage">
      ${metaBar()}
      <div class="drill-q">${sentence}</div>
      ${body}
      <div class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> wählen · <kbd>Enter</kbd> weiter</div>
    </div>`;

    if (s.phase === 'case') {
      const pick = i => {
        const ok = s.opts[i] === it.c;
        s.caseOk = ok;
        KK.sfx.play(ok);
        KK.state.record('art', it.c, 'm', ok); // detective trains case recognition; log under case row
        s.answered++; if (ok) { s.right++; s.streak++; } else s.streak = 0;
        KK.state.setBestStreak(s.streak);
        s.whyOpts = whyOptions(it.why);
        s.phase = 'why';
        renderDetektiv();
      };
      stageEl().querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
      setKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) { pick(n - 1); return true; } return false; });
    } else if (s.phase === 'why') {
      const pick = i => { s.whyOk = s.whyOpts[i] === it.why; KK.sfx.play(s.whyOk); s.phase = 'done'; renderDetektiv(); };
      stageEl().querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
      setKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= s.whyOpts.length) { pick(n - 1); return true; } return false; });
    } else {
      stageEl().querySelector('#nextBtn').addEventListener('click', nextDetektiv);
      setKeys(e => { if (e.key === 'Enter') { nextDetektiv(); return true; } return false; });
    }
  }

  /* ============ Mode 3: Präpositionen ============ */
  function startPraep() {
    session = { qnum: 0, right: 0, answered: 0, streak: 0, lastIdx: -1 };
    nextPraep();
  }
  function buildPraepPool() {
    const pool = [];
    for (const [cls, preps] of Object.entries(KK.PREPS))
      for (const p of preps) pool.push({ type: 'map', prep: p, cls });
    for (const w of KK.WECHSEL_DRILLS) pool.push({ type: 'wechsel', ...w });
    return pool;
  }
  function nextPraep() {
    const s = session;
    s.qnum++;
    if (!s.pool) s.pool = buildPraepPool();
    s.item = s.pool[Math.floor(Math.random() * s.pool.length)];
    s.phase = 'q';
    renderPraep();
  }
  function clsLabel(cls) {
    return cls === 'dat' ? '<span class="k-dat">immer Dativ</span>'
      : cls === 'akk' ? '<span class="k-akk">immer Akkusativ</span>'
        : cls === 'gen' ? '<span class="k-gen">Genitiv</span>'
          : '<span style="color:#4cc2cf">Wechselpräposition</span>';
  }
  function renderPraep() {
    const s = session, it = s.item;
    const lang = fbLang();
    let q = '', optHtml = '';

    if (it.type === 'map') {
      q = `<div class="drill-q" style="text-align:center;font-size:2rem">„${it.prep}“ — welcher Kasus?</div>`;
      s.opts = ['dat', 'akk', 'gen', 'wechsel'];
      optHtml = `${tipHtml(KK.memoryTips.prepMerksatz(it, lang), it.cls === 'wechsel' ? null : it.cls)}<div class="opts" style="justify-content:center">${s.opts.map((o, i) =>
        `<button class="opt" data-i="${i}"><span class="num">${i + 1}</span>${clsLabel(o)}</button>`).join('')}</div>`;
    } else {
      // wechsel sentence: step 1 wo/wohin, step 2 article
      if (s.phase === 'q') {
        q = `<div class="drill-q">${it.t.replace('___', '<span class="gap current">&nbsp;&nbsp;</span>')}</div>`;
        s.opts = ['wohin', 'wo'];
        optHtml = `${tipHtml(KK.memoryTips.prepMerksatz(it, lang), it.dir ? 'akk' : 'dat')}<div style="color:var(--ink-faint);font-size:.82rem">„${it.prep}“ ist eine Wechselpräposition. Bewegung oder Position?</div>
          <div class="opts">
            <button class="opt" data-i="0"><span class="num">1</span>wohin? → <span class="k-akk">Akkusativ</span></button>
            <button class="opt" data-i="1"><span class="num">2</span>wo? → <span class="k-dat">Dativ</span></button>
          </div>`;
      } else {
        q = `<div class="drill-q">${it.t.replace('___', '<span class="gap current">&nbsp;&nbsp;</span>')}</div>`;
        s.opts = shuffle([it.a, it.alt]);
        optHtml = `${tipHtml(KK.memoryTips.caseTipp(it.dir ? 'akk' : 'dat', lang), it.dir ? 'akk' : 'dat')}<div style="color:var(--ink-faint);font-size:.82rem">Und welcher Artikel?</div>
          <div class="opts">${s.opts.map((o, i) =>
            `<button class="opt" data-i="${i}"><span class="num">${i + 1}</span>${o}</button>`).join('')}</div>`;
      }
    }

    stageEl().innerHTML = `<div class="drill-stage">
      ${metaBar()}
      ${q}${optHtml}
      <div class="feedback" id="fb"></div>
      <div class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> wählen · <kbd>Enter</kbd> weiter</div>
    </div>`;

    const fb = stageEl().querySelector('#fb');

    const finish = (ok, correctLabel, note, noteAr, g, speakText) => {
      s.answered++; if (ok) { s.right++; s.streak++; } else s.streak = 0;
      KK.state.setBestStreak(s.streak);
      fb.innerHTML = feedbackHtml(ok, correctLabel, note, noteAr, g, speakText) +
        ' &nbsp;<button class="btn primary" id="nextBtn" style="padding:.3rem .9rem">Weiter</button>';
      stageEl().querySelector('#nextBtn').addEventListener('click', nextPraep);
      setKeys(e => { if (e.key === 'Enter') { nextPraep(); return true; } return false; });
    };

    if (it.type === 'map') {
      const pick = i => {
        const ok = s.opts[i] === it.cls;
        KK.sfx.play(ok);
        KK.state.record('art', it.cls === 'wechsel' ? 'dat' : it.cls, 'm', ok);
        stageEl().querySelectorAll('.opt').forEach((b, bi) => {
          b.disabled = true;
          if (s.opts[bi] === it.cls) b.classList.add('ok'); else if (bi === i) b.classList.add('bad');
        });
        const mn = KK.PREP_MNEMO[it.cls];
        finish(ok, KK.CASE[it.cls] ? KK.CASE[it.cls].de : 'Wechselpräposition', `${ok ? '' : merksatzHtml(KK.memoryTips.prepMerksatz(it, lang), it.cls)}<i>${mn}</i>`, undefined, null, it.prep);
      };
      stageEl().querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
      setKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) { pick(n - 1); return true; } return false; });
    } else if (s.phase === 'q') {
      const pick = i => {
        const ok = (s.opts[i] === 'wohin') === it.dir;
        KK.sfx.play(ok);
        if (!ok) { // record miss on the case row
          KK.state.record('art', it.dir ? 'akk' : 'dat', it.g, false);
          s.answered++; s.streak = 0;
          fb.innerHTML = `<span class="no">Nein — hier: ${it.dir ? 'Bewegung → wohin? → Akkusativ' : 'Position → wo? → Dativ'}.</span>${merksatzHtml(KK.memoryTips.prepMerksatz(it, lang), it.dir ? 'akk' : 'dat')}`;
          later(() => { s.phase = 'art'; renderPraep(); }, 1300);
        } else {
          s.answered++; s.right++; s.streak++;
          KK.state.setBestStreak(s.streak);
          s.phase = 'art'; renderPraep();
        }
        setKeys(null);
      };
      stageEl().querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
      setKeys(e => { const n = parseInt(e.key, 10); if (n === 1 || n === 2) { pick(n - 1); return true; } return false; });
    } else {
      const pick = i => {
        const ok = s.opts[i] === it.a;
        KK.sfx.play(ok);
        KK.state.record('art', it.dir ? 'akk' : 'dat', it.g, ok);
        stageEl().querySelectorAll('.opt').forEach((b, bi) => {
          b.disabled = true;
          if (s.opts[bi] === it.a) b.classList.add('ok'); else if (bi === i) b.classList.add('bad');
        });
        finish(ok, it.a, `${it.prep} + ${it.dir ? 'wohin → <span class="k-akk">Akkusativ</span>' : 'wo → <span class="k-dat">Dativ</span>'}`,
          undefined, it.g, it.t.replace('___', it.a));
      };
      stageEl().querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
      setKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= s.opts.length) { pick(n - 1); return true; } return false; });
    }

    // reference card under the drill (collapsed visually as groups)
    if (it.type === 'map' && s.qnum === 1) {
      stageEl().insertAdjacentHTML('beforeend', `<div class="prep-groups">${Object.entries(KK.PREPS).map(([cls, ps]) => `
        <div class="prep-group"><h4>${clsLabel(cls)}</h4>
          <div class="chips">${ps.map(p => `<span class="chip">${p}</span>`).join('')}</div>
          <div class="mnemo-line">${KK.PREP_MNEMO[cls]}</div></div>`).join('')}</div>`);
    }
  }

  /* ============ Mode 4: Blitz-Runde ============ */
  function startBlitzIntro() {
    stageEl().innerHTML = `<div class="drill-stage blitz-result">
      <div class="big">⚡</div>
      <p>60 Sekunden. Richtige Artikelform wählen, so schnell du kannst.<br>
      <span style="color:var(--ink-faint)">Tasten 1–4 · Streak nicht reißen lassen!</span></p>
      <button class="btn primary" id="goBtn">Los! <kbd style="opacity:.6">Enter</kbd></button>
    </div>`;
    stageEl().querySelector('#goBtn').addEventListener('click', startBlitz);
    setKeys(e => { if (e.key === 'Enter') { startBlitz(); return true; } return false; });
  }
  function startBlitz() {
    cleanupSession();
    session = { qnum: 0, right: 0, answered: 0, streak: 0, best: 0, t: 60, timer: null };
    session.timer = setInterval(() => {
      session.t--;
      const bar = document.getElementById('blitzBar');
      const lbl = document.getElementById('blitzT');
      if (bar) bar.style.width = (session.t / 60 * 100) + '%';
      if (lbl) lbl.textContent = session.t + 's';
      if (session.t <= 0) endBlitz();
    }, 1000);
    nextBlitz();
  }
  function nextBlitz() {
    const s = session;
    s.qnum++;
    // weighted case pick: prefer weak cells
    const cases = ['nom', 'akk', 'dat', 'gen'];
    let bestC = null, bestW = -1;
    for (const c of cases) {
      for (const g of ['m', 'f', 'n', 'pl']) {
        const w = KK.state.errRate('art', c, g) + Math.random() * 0.35;
        if (w > bestW) { bestW = w; bestC = { c, g }; }
      }
    }
    const { c, g } = bestC;
    const nouns = KK.VOCAB.filter(v => g === 'pl' ? v[2] : v[1] === g);
    const v = nouns[Math.floor(Math.random() * nouns.length)];
    const noun = g === 'pl' ? v[2] : v[0];
    const gi = ['m', 'f', 'n', 'pl'].indexOf(g);
    const answer = KK.ARTICLES.def[c][gi];
    s.q = { c, g, noun, answer, ar: v[3] };
    s.opts = artOptions(answer);
    renderBlitz();
  }
  function renderBlitz() {
    const s = session;
    const cs = KK.CASE[s.q.c];
    stageEl().innerHTML = `<div class="drill-stage">
      <div class="blitz-timer"><i id="blitzBar" style="width:${s.t / 60 * 100}%"></i></div>
      <div class="drill-meta">
        <span id="blitzT">${s.t}s</span>
        <span>Punkte: <b>${s.right}</b></span>
        <span class="streak ${s.streak >= 5 ? 'hot' : ''}">🔥 ${s.streak}</span>
      </div>
      <div class="blitz-big">
        <span class="case-tag bg-${s.q.c}">${cs.de}</span> <span id="blitzGap">___</span> ${s.q.noun}
        <span style="color:var(--ink-faint);font-size:1rem"> (${s.q.ar})</span>
      </div>
      <div class="opts" style="justify-content:center">${s.opts.map((o, i) =>
        `<button class="opt" data-i="${i}"><span class="num">${i + 1}</span>${o}</button>`).join('')}</div>
    </div>`;
    const pick = i => {
      const ok = s.opts[i] === s.q.answer;
      KK.sfx.play(ok);
      KK.state.record('art', s.q.c, s.q.g, ok);
      s.answered++; if (ok) { s.right++; s.streak++; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
      KK.state.setBestStreak(s.streak);
      stageEl().querySelectorAll('.opt').forEach((b, bi) => {
        b.disabled = true;
        if (s.opts[bi] === s.q.answer) b.classList.add('ok'); else if (bi === i) b.classList.add('bad');
      });
      // reveal the answer in the blank: article + gender badge (+ 🔊 when missed)
      const gapEl = stageEl().querySelector('#blitzGap');
      if (gapEl) gapEl.innerHTML =
        `<span style="color:${ok ? 'var(--good)' : 'var(--bad)'};font-weight:700">${s.q.answer}</span>` +
        KK.genderBadge(s.q.g, true) + (ok ? '' : KK.speakBtn(s.q.answer + ' ' + s.q.noun));
      setKeys(null);
      later(() => { if (session && session.timer) nextBlitz(); }, ok ? 220 : 1100);
    };
    stageEl().querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
    setKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= s.opts.length) { pick(n - 1); return true; } return false; });
  }
  function endBlitz() {
    const s = session;
    clearInterval(s.timer); s.timer = null;
    const acc = s.answered ? Math.round(s.right / s.answered * 100) : 0;
    stageEl().innerHTML = `<div class="drill-stage blitz-result">
      <div class="big">${s.right}</div>
      <p>richtige Antworten in 60 s · Genauigkeit ${acc}% · bester Streak dieser Sitzung: ${s.best} 🔥</p>
      <button class="btn primary" id="againBtn">Nochmal! <kbd style="opacity:.6">Enter</kbd></button>
    </div>`;
    stageEl().querySelector('#againBtn').addEventListener('click', startBlitz);
    setKeys(e => { if (e.key === 'Enter') { startBlitz(); return true; } return false; });
  }

  KK.drill = {
    render,
    stop() { cleanupSession(); },
    modeKey(n) { startMode(['luecke', 'detektiv', 'praep', 'blitz'][n - 1]); },
    isActive: () => mode !== null,
    back: backToModes,
  };
})();
