/* Module 2 - Adjective declension: three worlds + interactive signal lab */
(function () {
  const root = () => document.getElementById('view-adjektiv');

  let demoWorld = 'weak';
  let demoCase = 'nom';
  let demoGender = 'm';
  let activeWorld = 'weak';

  const CASE_LABELS = { nom: 'Nom', akk: 'Akk', dat: 'Dat', gen: 'Gen' };
  const WORLD_OPTIONS = ['weak', 'mixed', 'strong'];

  function phrase(world, c, g) {
    const ex = KK.adjDemoPhrase(world, c, g);
    return ex ? ex.html : '';
  }

  function worldTable(worldId) {
    const w = KK.ADJ[worldId];
    const rows = KK.CASES.map(c => {
      const cells = KK.GENDERS.map((g, gi) => {
        const ending = w[c.id][gi];
        const isEn = worldId === 'weak' && ending === 'en';
        return `<td class="${isEn ? 'en-ocean' : ''}" data-w="${worldId}" data-c="${c.id}" data-g="${g.id}" tabindex="0">
          <span class="stem">-</span><span class="sig">${ending}</span></td>`;
      }).join('');
      return `<tr data-case="${c.id}"><th class="case-h k-${c.id}">${c.de}</th>${cells}</tr>`;
    }).join('');
    return `<div class="world ${worldId === activeWorld ? 'is-active' : ''}" data-world-card="${worldId}">
      <h3>${w.label}</h3>
      <p class="sub">${w.sub} - <b>${w.ex}</b></p>
      <div class="decl-wrap"><table class="decl">
        <thead><tr><th></th>${KK.GENDERS.map(g => `<th>${g.short}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  }

  function articleSignalHtml(article, c, g) {
    if (!article) return '';
    const sig = KK.SIGNAL[c][g];
    if (article.endsWith(sig)) {
      return `${article.slice(0, -sig.length)}<span class="signal-chip k-${c}">${sig}</span>`;
    }
    return `<span class="demo-article no-signal">${article}</span>`;
  }

  function articleHasSignal(article, c, g) {
    return Boolean(article && article.endsWith(KK.SIGNAL[c][g]));
  }

  function demoCaption(ex, lang) {
    const hasSignal = articleHasSignal(ex.article, ex.c, ex.g);
    if (lang === 'ar') {
      if (ex.world === 'weak') return `الأداة <b>${ex.article}</b> تحمل علامة الحالة، لذلك الصفة تأخذ النهاية الهادئة <b>-${ex.ending}</b>.`;
      if (ex.world === 'mixed' && !hasSignal) return `الأداة <b>${ex.article}</b> بلا علامة ظاهرة هنا، لذلك الصفة تكمل الإشارة: gut<b>${ex.ending}</b>.`;
      if (ex.world === 'mixed') return `الأداة <b>${ex.article}</b> تحمل الإشارة هنا، فتعود الصفة إلى النهاية الضعيفة <b>-${ex.ending}</b>.`;
      if (ex.c === 'gen' && (ex.g === 'm' || ex.g === 'n')) return `بلا أداة. في Genitiv للمذكر والمحايد تظهر الملكية أيضًا على الاسم: <b>${ex.noun}</b>.`;
      return `لا توجد أداة، لذلك الصفة نفسها تحمل علامة الحالة: gut<b>${ex.ending}</b>.`;
    }
    if (ex.world === 'weak') return `Der Artikel <b>${ex.article}</b> trägt das Signal, deshalb nimmt das Adjektiv die ruhige Endung <b>-${ex.ending}</b>.`;
    if (ex.world === 'mixed' && !hasSignal) return `Der Artikel <b>${ex.article}</b> zeigt hier kein Signal, deshalb ergänzt das Adjektiv: gut<b>${ex.ending}</b>.`;
    if (ex.world === 'mixed') return `Der Artikel <b>${ex.article}</b> trägt hier das Signal, das Adjektiv fällt auf <b>-${ex.ending}</b> zurück.`;
    if (ex.c === 'gen' && (ex.g === 'm' || ex.g === 'n')) return `Ohne Artikel. Im Genitiv Maskulin/Neutrum markiert auch das Nomen Besitz: <b>${ex.noun}</b>.`;
    return `Kein Artikel, deshalb trägt das Adjektiv das Signal selbst: gut<b>${ex.ending}</b>.`;
  }

  function worldOption(world) {
    if (world === 'strong') return { main: 'ohne', sub: 'stark' };
    const ex = KK.adjDemoPhrase(world, demoCase, demoGender);
    return {
      main: ex.article || 'kein',
      sub: world === 'weak' ? 'bestimmt' : 'ein/kein',
    };
  }

  function worldOptionHtml(world) {
    const opt = worldOption(world);
    return `<span class="main">${opt.main}</span><span class="sub">${opt.sub}</span>`;
  }

  function demoSummary(ex) {
    const gender = KK.GENDERS.find(g => g.id === ex.g).de;
    const world = ex.world === 'weak' ? 'bestimmter Artikel' : ex.world === 'mixed' ? 'ein/kein' : 'ohne Artikel';
    return `${KK.CASE[ex.c].de} · ${gender} · ${world}`;
  }

  function renderDemo(el) {
    const stage = el.querySelector('#jumpStage');
    const cap = el.querySelector('#jumpCaption');
    const lang = KK.state.get().lang;
    const ex = KK.adjDemoPhrase(demoWorld, demoCase, demoGender);
    const summary = el.querySelector('#demoSummary');

    if (summary) summary.textContent = demoSummary(ex);
    const article = ex.article
      ? `<span class="word">${articleSignalHtml(ex.article, demoCase, demoGender)}</span>`
      : '<span class="word gone">Artikel</span>';
    stage.innerHTML = `${article}<span class="word">gut<span class="signal-chip k-${demoCase}">${ex.ending}</span></span><span class="word">${ex.noun}</span>`;
    cap.innerHTML = demoCaption(ex, lang);
    if (lang === 'ar') cap.setAttribute('dir', 'rtl'); else cap.removeAttribute('dir');

    el.querySelectorAll('[data-demo-kind]').forEach(b => {
      if (b.dataset.demoKind === 'world') b.innerHTML = worldOptionHtml(b.dataset.demoValue);
      const active =
        (b.dataset.demoKind === 'world' && b.dataset.demoValue === demoWorld) ||
        (b.dataset.demoKind === 'case' && b.dataset.demoValue === demoCase) ||
        (b.dataset.demoKind === 'gender' && b.dataset.demoValue === demoGender);
      b.classList.toggle('active', active);
    });
    el.querySelectorAll('[data-world-card]').forEach(card => {
      card.classList.toggle('is-active', card.dataset.worldCard === activeWorld);
    });
    el.querySelectorAll('[data-world-page]').forEach(b => {
      const active = b.dataset.worldPage === activeWorld;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function worldPagerHtml() {
    return `<div class="page-controls world-pager" aria-label="Adjektivwelt auswählen">
      ${WORLD_OPTIONS.map(id => `<button type="button" data-world-page="${id}" class="${id === activeWorld ? 'active' : ''}" aria-pressed="${id === activeWorld}">
        ${KK.ADJ[id].label}
      </button>`).join('')}
    </div>`;
  }

  function render() {
    const el = root();
    const lang = KK.state.get().lang;

    el.innerHTML = `
      <h1>Adjektivdeklination: die drei Welten</h1>
      <p class="lede">Schwach, gemischt, stark - klingt nach drei Tabellen, ist aber nur eine Frage: <i>Wer trägt das Signal?</i></p>

      <div class="signal-stage">
        <h3>Wer trägt das Signal?</h3>
        <div class="merksatz-line tip-akk"><b>Merksatz</b><span${lang === 'ar' ? ' dir="rtl" lang="ar"' : ''}>${KK.memoryTips.adjMerksatz(lang)}</span></div>
        <div class="demo-summary" id="demoSummary"></div>
        <div class="signal-phrase" id="jumpStage"></div>
        <div class="caption" id="jumpCaption"></div>
        <div class="demo-controls">
          <div class="seg-wrap">
            <div class="seg-title">Artikel</div>
            <div class="seg vertical article-seg" aria-label="Artikeltyp">
              ${WORLD_OPTIONS.map(id =>
                `<button type="button" data-demo-kind="world" data-demo-value="${id}" class="${id === demoWorld ? 'active' : ''}">${worldOptionHtml(id)}</button>`).join('')}
            </div>
          </div>
          <div class="seg-wrap">
            <div class="seg-title">Kasus</div>
            <div class="seg choice-grid" aria-label="Kasus">
              ${KK.CASES.map(c =>
                `<button type="button" data-demo-kind="case" data-demo-value="${c.id}" class="${c.id === demoCase ? 'active' : ''}">${CASE_LABELS[c.id]}</button>`).join('')}
            </div>
          </div>
          <div class="seg-wrap">
            <div class="seg-title">Genus</div>
            <div class="seg choice-grid" aria-label="Genus">
              ${KK.GENDERS.map(g =>
                `<button type="button" data-demo-kind="gender" data-demo-value="${g.id}" class="${g.id === demoGender ? 'active' : ''}">${g.short}</button>`).join('')}
            </div>
          </div>
        </div>
        <details class="view-options">
          <summary>Anzeige-Optionen</summary>
          <div class="view-options-body">
            <label class="switch">
              <input type="checkbox" id="oceanToggle" ${document.body.classList.contains('ocean-on') ? 'checked' : ''}>
              <span class="track"></span> <span>„-en-Meer“ zeigen</span>
            </label>
            <label class="switch">
              <input type="checkbox" id="sigToggle2" ${document.body.classList.contains('signals-on') ? 'checked' : ''}>
              <span class="track"></span> <span>Signal-Endungen hervorheben</span>
            </label>
          </div>
        </details>
      </div>

      ${worldPagerHtml()}
      <div class="worlds">
        ${worldTable('weak')}${worldTable('mixed')}${worldTable('strong')}
      </div>
      <div class="example-bar" id="adjExampleBar"><span class="hint">→ Zelle berühren für die Phrase</span></div>

      <div class="mnemo" ${lang === 'ar' ? 'dir="rtl"' : ''}>${lang === 'ar' ? KK.MNEMOS[2].ar : KK.MNEMOS[2].de}</div>
      <div class="explain" ${lang === 'ar' ? 'dir="rtl" lang="ar"' : ''}>${KK.EXPLAIN.adjektiv[lang]}</div>
    `;

    el.querySelector('.demo-controls').addEventListener('click', e => {
      const b = e.target.closest('[data-demo-kind]');
      if (!b) return;
      if (b.dataset.demoKind === 'world') {
        demoWorld = b.dataset.demoValue;
        activeWorld = demoWorld;
        KK.sfx.transition();
      }
      if (b.dataset.demoKind === 'case') demoCase = b.dataset.demoValue;
      if (b.dataset.demoKind === 'gender') demoGender = b.dataset.demoValue;
      renderDemo(el);
    });

    el.querySelector('.world-pager').addEventListener('click', e => {
      const b = e.target.closest('[data-world-page]');
      if (!b) return;
      activeWorld = b.dataset.worldPage;
      demoWorld = activeWorld;
      renderDemo(el);
      KK.sfx.transition();
    });
    renderDemo(el);

    el.querySelector('#oceanToggle').addEventListener('change', e => {
      document.body.classList.toggle('ocean-on', e.target.checked);
    });
    el.querySelector('#sigToggle2').addEventListener('change', e => {
      document.body.classList.toggle('signals-on', e.target.checked);
    });

    const bar = el.querySelector('#adjExampleBar');
    el.querySelectorAll('td[data-w]').forEach(td => {
      const show = () => {
        const { w, c, g } = td.dataset;
        const cs = KK.CASE[c];
        bar.innerHTML = `<span class="tag bg-${c}">${cs.de} · ${KK.GENDERS.find(x => x.id === g).de} · ${KK.ADJ[w].label}</span>
          <span>${phrase(w, c, g)}</span>`;
      };
      td.addEventListener('mouseenter', show);
      td.addEventListener('focus', show);
      td.addEventListener('click', show);
    });
  }

  KK.adjektiv = { render };
})();
