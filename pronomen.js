/* Module: Pronomen - Personalpronomen + Possessivartikel */
(function () {
  const root = () => document.getElementById('view-pronomen');
  const CASES = ['nom', 'akk', 'dat', 'gen'];
  const QUIZ_LEN = 10;
  let tab = 'ref';
  let activeOwner = 'ich';
  let refKind = 'personal';
  let detail = null; // { type: 'personal'|'possessive', id }
  let quiz = null;
  let keyHandler = null;

  const shuffle = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ownerById(id) {
    return KK.PRONOUNS.possessiveOwners.find(x => x.id === id) || KK.PRONOUNS.possessiveOwners[0];
  }
  function uiLang() { return KK.state.get().lang; }
  function langAttr() { return uiLang() === 'ar' ? ' dir="rtl" lang="ar"' : ''; }
  function tipHtml(text, c) {
    return text ? `<div class="tipp-strip ${c ? 'tip-' + c : ''}"><b>Tipp</b><span${langAttr()}>${text}</span></div>` : '';
  }
  function merksatzHtml(text, c) {
    return text ? `<div class="merksatz-line ${c ? 'tip-' + c : ''}"><b>Merksatz</b><span${langAttr()}>${text}</span></div>` : '';
  }

  function caseHead(id) {
    const c = KK.PRONOUN_CASES.find(x => x.id === id);
    return `<span class="k-${id}">${c ? c.label : id}</span><small>${c ? c.ar : ''}</small>`;
  }

  function attr(s) {
    return esc(s).replace(/'/g, '&#39;');
  }

  function personalExample(row, c) {
    if (row.ex[c]) return row.ex[c];
    return `Wir gedenken ${row.gen}.`;
  }

  function formCell(htmlHead, value, example) {
    return `<button type="button" class="pronoun-form-cell" data-example-cell data-example-text="${attr(example)}" data-example-speak="${attr(example)}">
      <b>${htmlHead}</b><strong>${esc(value)}</strong>
    </button>`;
  }

  function examplePanel(example) {
    return `<div class="pronoun-example-panel" data-example-panel data-pinned="false">
      <div class="example-status" data-example-status>Beispiel</div>
      <p data-example-output>${esc(example)}</p>
      ${KK.speakBtn(example)}
    </div>`;
  }

  function possessiveExample(ownerId, c, g, form) {
    const nouns = {
      m: { nom: 'Vater', akk: 'Vater', dat: 'Vater', gen: 'Vaters' },
      f: { nom: 'Mutter', akk: 'Mutter', dat: 'Mutter', gen: 'Mutter' },
      n: { nom: 'Kind', akk: 'Kind', dat: 'Kind', gen: 'Kindes' },
      pl: { nom: 'Freunde', akk: 'Freunde', dat: 'Freunden', gen: 'Freunde' },
    };
    const noun = nouns[g][c];
    if (c === 'nom') return `${form} ${noun} ist hier.`;
    if (c === 'akk') return `Ich sehe ${form} ${noun}.`;
    if (c === 'dat') return `Ich helfe ${form} ${noun}.`;
    return `Das ist die Tasche ${form} ${noun}.`;
  }

  function personalDetailHtml(row) {
    const firstExample = personalExample(row, 'nom');
    return `<section class="pronoun-section">
      <div class="drill-runner-head compact-detail-head">
        <button class="btn drill-back" type="button" data-pron-ref-back>‹ Zurueck</button>
        <div>
          <h1>${esc(row.label)}</h1>
          <p class="lede" dir="rtl" lang="ar">${esc(row.ar)}</p>
        </div>
      </div>
      <article class="pronoun-card pronoun-detail-card">
        <div class="pronoun-forms">
          ${CASES.map(c => formCell(caseHead(c), row[c], personalExample(row, c))).join('')}
        </div>
        ${examplePanel(firstExample)}
        <div class="pronoun-note" dir="rtl" lang="ar">لاحظ الفرق العملي: Nominativ للفاعل، Akkusativ للمفعول المباشر، وDativ غالباً بعد أفعال مثل helfen / danken / antworten.</div>
      </article>
    </section>`;
  }

  function possessiveDetailHtml(owner) {
    const rows = KK.CASES.map(c => `<div class="poss-row">
      <b>${caseHead(c.id)}</b>
      ${KK.GENDERS.map(g => {
        const form = KK.possessiveForm(owner.id, c.id, g.id);
        const ex = possessiveExample(owner.id, c.id, g.id, form);
        return `<button type="button" class="poss-cell gc-border-${g.id}" data-example-cell data-example-text="${attr(ex)}" data-example-speak="${attr(ex)}">
          <small>${g.short}</small>${esc(form)}
        </button>`;
      }).join('')}
    </div>`).join('');
    const firstForm = KK.possessiveForm(owner.id, 'nom', 'm');
    const firstExample = possessiveExample(owner.id, 'nom', 'm', firstForm);

    return `<section class="pronoun-section">
      <div class="drill-runner-head compact-detail-head">
        <button class="btn drill-back" type="button" data-pron-ref-back>‹ Zurueck</button>
        <div>
          <h1>${esc(owner.owner)} -> ${esc(owner.stem)}-</h1>
          <p class="lede" dir="rtl" lang="ar">${esc(owner.ar)}</p>
        </div>
      </div>
      <article class="pronoun-card possessive-card pronoun-detail-card">
        <div class="pronoun-card-head">
          <h3>${esc(owner.owner)} -> ${esc(owner.stem)}-</h3>
          <span dir="rtl" lang="ar">${esc(owner.ar)}</span>
        </div>
        <div class="poss-table">
          <div class="poss-head"><span></span>${KK.GENDERS.map(g => `<b>${g.short}</b>`).join('')}</div>
          ${rows}
        </div>
        ${examplePanel(firstExample)}
        <div class="pronoun-note" dir="rtl" lang="ar">القاعدة الذهبية: اختر صاحب الشيء أولاً، ثم صرّف حسب الشيء المملوك لا حسب صاحبه.</div>
      </article>
    </section>`;
  }

  function pickerButton(row) {
    return `<button type="button" class="pronoun-pick" data-pronoun="${row.id}">
      <b>${esc(row.label)}</b><small>${esc(row.akk)} · ${esc(row.dat)}</small>
      <span dir="rtl" lang="ar">${esc(row.ar)}</span>
    </button>`;
  }

  function ownerButton(owner) {
    return `<button type="button" class="pronoun-pick" data-owner-detail="${owner.id}">
      <b>${esc(owner.owner)}</b><small>${esc(owner.stem)}-</small>
      <span dir="rtl" lang="ar">${esc(owner.ar)}</span>
    </button>`;
  }

  function overviewHtml() {
    const body = refKind === 'personal'
      ? `<section class="pronoun-section">
          <div class="section-head"><h2>Personalpronomen</h2><span>اضغط ضميراً لعرض التصريفات والأمثلة</span></div>
          <div class="pronoun-picker personal-picker">${KK.PRONOUNS.personal.map(pickerButton).join('')}</div>
        </section>`
      : `<section class="pronoun-section">
          <div class="section-head"><h2>Possessivartikel</h2><span>اختر صاحب الشيء</span></div>
          <div class="pronoun-picker owner-picker">${KK.PRONOUNS.possessiveOwners.map(ownerButton).join('')}</div>
        </section>`;
    return `<div class="pronoun-overview">
      <div class="pron-ref-switch" role="group" aria-label="Pronomen Referenztyp">
        <button type="button" data-ref-kind="personal" class="${refKind === 'personal' ? 'active' : ''}">Personalpronomen</button>
        <button type="button" data-ref-kind="possessive" class="${refKind === 'possessive' ? 'active' : ''}">Possessivartikel</button>
      </div>
      ${body}
    </div>`;
  }

  function referenceHtml() {
    if (detail && detail.type === 'personal') {
      return personalDetailHtml(KK.PRONOUNS.personal.find(x => x.id === detail.id) || KK.PRONOUNS.personal[0]);
    }
    if (detail && detail.type === 'possessive') {
      return possessiveDetailHtml(ownerById(detail.id || activeOwner));
    }
    return overviewHtml();
  }

  function quizIntroHtml() {
    return `<div class="modes pronoun-modes">
      <button class="mode-card" type="button" data-quiz-mode="personal"><span class="key">1</span>
        <h3>Personalpronomen</h3><p>ich, mich, mir - waehle die richtige Form im Satz.</p></button>
      <button class="mode-card" type="button" data-quiz-mode="possessive"><span class="key">2</span>
        <h3>Possessivartikel</h3><p>mein, meine, meinem - Besitzer + Kasus + Genus.</p></button>
      <button class="mode-card" type="button" data-quiz-mode="mix"><span class="key">3</span>
        <h3>Mix-Quiz</h3><p>Beides gemischt, wie es in echten Saetzen passiert.</p></button>
    </div>`;
  }

  function allPersonalAnswers() {
    const out = new Set();
    for (const row of KK.PRONOUNS.personal) {
      CASES.forEach(c => out.add(row[c]));
      out.add(row.nom.charAt(0).toUpperCase() + row.nom.slice(1));
    }
    return [...out];
  }

  function personalOptions(answer) {
    return shuffle([answer, ...shuffle(allPersonalAnswers().filter(x => x !== answer)).slice(0, 3)]);
  }

  function possessiveOptions(answer, ownerId) {
    const pool = new Set();
    for (const c of KK.CASES) for (const g of KK.GENDERS) pool.add(KK.possessiveForm(ownerId, c.id, g.id));
    for (const o of KK.PRONOUNS.possessiveOwners) pool.add(KK.possessiveForm(o.id, 'nom', 'm'));
    return shuffle([answer, ...shuffle([...pool].filter(x => x !== answer)).slice(0, 3)]);
  }

  function startQuiz(mode) {
    quiz = { mode, i: 0, right: 0, streak: 0, phase: 'q', q: null, opts: [] };
    nextQ();
    KK.sfx.transition();
  }

  function pickQuestion() {
    const usePersonal = quiz.mode === 'personal' || (quiz.mode === 'mix' && Math.random() < 0.5);
    if (usePersonal) {
      const q = KK.PRONOUN_DRILLS[Math.floor(Math.random() * KK.PRONOUN_DRILLS.length)];
      const row = KK.PRONOUNS.personal.find(x => x.id === q.who);
      return { type: 'personal', ...q, group: row ? row.group : 'm' };
    }
    const q = KK.POSSESSIVE_DRILLS[Math.floor(Math.random() * KK.POSSESSIVE_DRILLS.length)];
    const answer = KK.possessiveForm(q.owner, q.c, q.g);
    return { type: 'possessive', ...q, a: answer };
  }

  function nextQ() {
    if (quiz.i >= QUIZ_LEN) return endQuiz();
    quiz.i++;
    quiz.phase = 'q';
    quiz.q = pickQuestion();
    quiz.opts = quiz.q.type === 'personal'
      ? personalOptions(quiz.q.a)
      : possessiveOptions(quiz.q.a, quiz.q.owner);
    renderQuiz();
  }

  function questionHtml(q) {
    if (q.type === 'personal') {
      return `<div class="drill-q">${esc(q.t).replace('___', '<span class="gap current">&nbsp;&nbsp;&nbsp;</span>')}</div>`;
    }
    const owner = ownerById(q.owner);
    const label = `${KK.CASE[q.c].de} · ${KK.GENDER_META[q.g].de}`;
    return `<div class="drill-q"><span class="gap current">&nbsp;&nbsp;&nbsp;</span> ${esc(q.noun)}
      <span class="g-badge g-${q.g}">${esc(label)}</span></div>
      <p class="note">Besitzer: <b>${esc(owner.owner)}</b> -> ${esc(owner.stem)}- <span dir="rtl" lang="ar">(${esc(q.ar)})</span></p>`;
  }

  function feedbackHtml(q, ok) {
    if (q.type === 'personal') {
      return `${ok ? '<span class="yes">Richtig!</span>' : '<span class="no">Leider nein.</span>'}
        <b>${esc(q.a)}</b> · ${esc(q.note)} ${KK.speakBtn(q.t.replace('___', q.a))}`;
    }
    const phrase = `${q.a} ${q.noun}`;
    return `${ok ? '<span class="yes">Richtig!</span>' : '<span class="no">Leider nein.</span>'}
      <b>${esc(phrase)}</b>${KK.genderBadge(q.g)} · ${KK.CASE[q.c].de} ${KK.speakBtn(phrase)}`;
  }

  function renderQuiz() {
    const q = quiz.q;
    document.getElementById('pronomenBody').innerHTML = `<div class="drill-runner-head">
      <button class="btn drill-back" type="button" data-pron-back>‹ Zurueck</button>
      <div><h1>${quiz.mode === 'personal' ? 'Personalpronomen' : quiz.mode === 'possessive' ? 'Possessivartikel' : 'Mix-Quiz'}</h1>
      <p class="lede">${QUIZ_LEN} Fragen - antworte direkt, dann weiter.</p></div>
    </div>
    <div class="drill-stage">
      <div class="drill-meta">
        <span>Frage <b>${quiz.i}</b> / ${QUIZ_LEN}</span>
        <span>Richtig: <b>${quiz.right}</b></span>
        <span class="streak ${quiz.streak >= 5 ? 'hot' : ''}">🔥 ${quiz.streak}</span>
      </div>
      ${q.type === 'personal'
        ? tipHtml(KK.memoryTips.pronounMerksatz(q.who, uiLang()) || KK.memoryTips.caseTipp(q.c, uiLang()), q.c)
        : tipHtml(KK.memoryTips.caseTipp(q.c, uiLang()) + ' ' + KK.memoryTips.possessiveMerksatz(uiLang()), q.c)}
      ${questionHtml(q)}
      ${quiz.phase === 'fb'
        ? `<div class="feedback">${feedbackHtml(q, quiz.ok)}${quiz.ok ? '' : merksatzHtml(q.type === 'personal' ? KK.memoryTips.pronounMerksatz(q.who, uiLang()) : KK.memoryTips.possessiveMerksatz(uiLang()), q.c)}</div>
           <button class="btn primary" type="button" data-pron-next>${quiz.i >= QUIZ_LEN ? 'Ergebnis' : 'Weiter'} <kbd>Enter</kbd></button>`
        : `<div class="opts">${quiz.opts.map((o, i) => `<button class="opt" type="button" data-answer="${i}">
            <span class="num">${i + 1}</span>${esc(o)}
          </button>`).join('')}</div>`}
      <div class="kbd-hint"><kbd>1</kbd>-<kbd>4</kbd> waehlen · <kbd>Enter</kbd> weiter</div>
    </div>`;

    keyHandler = e => {
      if (quiz.phase === 'q') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= quiz.opts.length) { answer(n - 1); return true; }
      }
      if (quiz.phase === 'fb' && e.key === 'Enter') { nextQ(); return true; }
      return false;
    };
  }

  function answer(i) {
    if (!quiz || quiz.phase !== 'q') return;
    const q = quiz.q;
    const ok = quiz.opts[i] === q.a;
    quiz.ok = ok;
    quiz.phase = 'fb';
    KK.sfx.play(ok);
    if (ok) { quiz.right++; quiz.streak++; } else quiz.streak = 0;
    KK.state.setBestStreak(quiz.streak);
    if (q.type === 'personal') KK.state.record('pron', q.c, q.group, ok);
    else KK.state.record('possessive', q.c, q.g, ok);
    renderQuiz();
  }

  function endQuiz() {
    const perfect = quiz.right === QUIZ_LEN;
    if (perfect) KK.sfx.win();
    document.getElementById('pronomenBody').innerHTML = `<div class="drill-stage blitz-result">
      <div class="big">${perfect ? '🏆 ' : ''}${quiz.right} / ${QUIZ_LEN}</div>
      <p>${perfect ? 'Saubere Runde - die Formen sitzen!' : 'Runde abgeschlossen. Deine Antworten zaehlen in der Statistik.'}</p>
      <button class="btn primary" type="button" data-quiz-mode="${quiz.mode}">Nochmal <kbd>Enter</kbd></button>
      <button class="btn" type="button" data-pron-back>Zur Auswahl</button>
    </div>`;
    keyHandler = e => { if (e.key === 'Enter') { startQuiz(quiz.mode); return true; } return false; };
    quiz = null;
  }

  function updateExamplePanel(cell, pinned) {
    const panel = document.querySelector('#view-pronomen [data-example-panel]');
    if (!panel || !cell) return;
    const text = cell.dataset.exampleText || '';
    const speak = cell.dataset.exampleSpeak || text;
    const out = panel.querySelector('[data-example-output]');
    const status = panel.querySelector('[data-example-status]');
    const speakBtn = panel.querySelector('[data-speak]');
    if (out) out.textContent = text;
    if (status) status.textContent = pinned ? 'مثبت · Beispiel' : 'Beispiel';
    if (speakBtn) {
      speakBtn.dataset.speak = speak;
      speakBtn.setAttribute('aria-label', 'Anhören: ' + speak);
      speakBtn.setAttribute('title', 'Anhören (Deutsch)');
    }
    panel.dataset.pinned = pinned ? 'true' : 'false';
    panel.classList.toggle('is-pinned', !!pinned);
    document.querySelectorAll('#view-pronomen [data-example-cell]').forEach(x =>
      x.classList.toggle('is-pinned', pinned && x === cell));
  }

  function render() {
    // keep a running quiz alive across re-renders (e.g. language switch)
    if (tab !== 'quiz' || !quiz) {
      quiz = null;
      keyHandler = null;
    }
    const el = root();
    el.innerHTML = `
      <h1>Pronomen</h1>
      <div class="tabs" id="pronomenTabs">
        <button type="button" data-tab="ref" class="${tab === 'ref' ? 'active' : ''}">Referenz<small>Formen + Beispiele</small></button>
        <button type="button" data-tab="quiz" class="${tab === 'quiz' ? 'active' : ''}">Quiz<small>Personal + Possessiv</small></button>
      </div>
      <div id="pronomenBody">${tab === 'ref' ? referenceHtml() : (quiz ? '' : quizIntroHtml())}</div>`;
    if (tab === 'quiz' && quiz) renderQuiz();

    el.onclick = e => {
      const exampleCell = e.target.closest('[data-example-cell]');
      if (exampleCell) {
        updateExamplePanel(exampleCell, true);
        KK.sfx.tap();
        return;
      }
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        tab = tabBtn.dataset.tab;
        detail = null;
        render();
        KK.sfx.transition();
        return;
      }
      const refKindBtn = e.target.closest('[data-ref-kind]');
      if (refKindBtn) {
        refKind = refKindBtn.dataset.refKind;
        detail = null;
        render();
        KK.sfx.transition();
        return;
      }
      const pronBtn = e.target.closest('[data-pronoun]');
      if (pronBtn) {
        detail = { type: 'personal', id: pronBtn.dataset.pronoun };
        render();
        if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
        KK.sfx.transition();
        return;
      }
      const ownerBtn = e.target.closest('[data-owner-detail]');
      if (ownerBtn) {
        activeOwner = ownerBtn.dataset.ownerDetail;
        detail = { type: 'possessive', id: activeOwner };
        render();
        if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
        KK.sfx.transition();
        return;
      }
      if (e.target.closest('[data-pron-ref-back]')) {
        detail = null;
        render();
        KK.sfx.transition();
        return;
      }
      const modeBtn = e.target.closest('[data-quiz-mode]');
      if (modeBtn) {
        tab = 'quiz';
        startQuiz(modeBtn.dataset.quizMode);
        return;
      }
      if (e.target.closest('[data-pron-back]')) {
        quiz = null;
        keyHandler = null;
        tab = 'quiz';
        render();
        KK.sfx.transition();
        return;
      }
      const answerBtn = e.target.closest('[data-answer]');
      if (answerBtn) answer(Number(answerBtn.dataset.answer));
      if (e.target.closest('[data-pron-next]')) nextQ();
    };

    el.onmouseover = e => {
      const cell = e.target.closest('[data-example-cell]');
      const panel = document.querySelector('#view-pronomen [data-example-panel]');
      if (cell && panel && panel.dataset.pinned !== 'true') updateExamplePanel(cell, false);
    };

    el.onpointerover = el.onmouseover;
    el.onmousemove = el.onmouseover;

    el.onfocusin = e => {
      const cell = e.target.closest('[data-example-cell]');
      const panel = document.querySelector('#view-pronomen [data-example-panel]');
      if (cell && panel && panel.dataset.pinned !== 'true') updateExamplePanel(cell, false);
    };
  }

  KK.pronomen = {
    render,
    key: e => keyHandler ? keyHandler(e) : false,
    isQuizActive: () => quiz !== null,
  };
})();
