/* Module 1 — Reference Atlas: four color-coded article tables */
(function () {
  const root = () => document.getElementById('view-atlas');
  let currentTable = 'def';
  let locked = null;   // {c, g} — pinned cell; hover previews are suppressed while set

  /* Split a word into stem + signal ending for the Signal-Endungen toggle.
     Signal = the final letter(s) that carry case info. */
  function splitSignal(word, c, g) {
    if (!word) return null;
    const sig = KK.SIGNAL[c][g];
    if (/^(ein|kein|mein|dein|sein|ihr|unser|euer)$/.test(word)) return { stem: word, sig: '' }; // bare form, no signal
    // 'des'/'dieses'/'eines' genitive m/n: signal really is -(e)s; show 'es' for longer words, 's' for 'des'/'das'
    if ((c === 'gen' && (g === 'm' || g === 'n')) && word.endsWith('es') && word.length > 3)
      return { stem: word.slice(0, -2), sig: 'es' };
    if (word.endsWith(sig)) return { stem: word.slice(0, -1), sig: word.slice(-1) };
    return { stem: word, sig: '' };
  }

  function exampleFor(tableId, c, g) {
    const ex = KK.EXAMPLES[c][g];
    const art = KK.ARTICLES[tableId][c][KK.GENDERS.findIndex(x => x.id === g)];
    if (!art) return null;
    // genitive plural noun differs for tables — keep 'Blumen'; fine for all.
    let artShown = art;
    // Capitalize when the article starts the sentence
    let t = ex.t;
    if (t.startsWith('{art}')) artShown = art.charAt(0).toUpperCase() + art.slice(1);
    const plain = t.replace('{art}', artShown).replace(/\{tr:([^}]+)\}/, '$1');
    t = t.replace('{art}', `<span class="art-hl k-${c}">${artShown}</span>`);
    t = t.replace(/\{tr:([^}]+)\}/, '<u>$1</u>');
    return { html: t, plain, trigger: ex.trigger };
  }

  function render() {
    const el = root();
    const lang = KK.state.get().lang;
    const tbl = KK.ARTICLES[currentTable];

    let tabsHtml = Object.entries(KK.ARTICLES).map(([id, t]) =>
      `<button data-table="${id}" class="${id === currentTable ? 'active' : ''}">${t.label}<small>${t.sub}</small></button>`
    ).join('');

    let rows = KK.CASES.map(c => {
      const cells = KK.GENDERS.map((g, gi) => {
        const word = tbl[c.id][gi];
        if (!word) return `<td class="impossible">— gibt’s nicht —</td>`;
        const sp = splitSignal(word, c.id, g.id);
        const noSig = sp.sig === '';
        const inner = noSig
          ? `<span class="stem">${sp.stem}</span>`
          : `<span class="stem">${sp.stem}</span><span class="sig">${sp.sig}</span>`;
        return `<td data-c="${c.id}" data-g="${g.id}" class="${noSig ? 'no-signal' : ''}" tabindex="0">${inner}</td>`;
      }).join('');
      return `<tr data-case="${c.id}">
        <th class="case-h k-${c.id}">${c.de}<small>${c.q}</small></th>${cells}</tr>`;
    }).join('');

    el.innerHTML = `
      <h1>Der Referenz-Atlas</h1>
      <p class="lede">Vier Tabellen, ein System. Fahre über eine Zelle für einen echten Beispielsatz — das Wort, das den Kasus auslöst, ist unterstrichen. Klick oder <kbd>Enter</kbd> fixiert das Beispiel, <kbd>Esc</kbd> löst es.</p>
      <div class="tabs" id="atlasTabs">${tabsHtml}</div>
      <label class="switch"><input type="checkbox" id="sigToggle" ${document.body.classList.contains('signals-on') ? 'checked' : ''}>
        <span class="track"></span> Signal-Endungen hervorheben</label>
      <div class="decl-wrap">
        <table class="decl">
          <thead><tr><th></th>${KK.GENDERS.map(g => `<th><span class="full-label">${g.de}</span><span class="short-label">${g.short}</span></th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="example-bar" id="exampleBar"><span class="hint">→ Zelle berühren für ein Beispiel</span></div>
      ${KK.MNEMOS.slice(0, 2).map(m => `<div class="mnemo" ${lang === 'ar' ? 'dir="rtl"' : ''}>${lang === 'ar' ? m.ar : m.de}</div>`).join('')}
      <div class="explain" ${lang === 'ar' ? 'dir="rtl" lang="ar"' : ''}>${KK.EXPLAIN.atlas[lang]}</div>
    `;

    el.querySelector('#atlasTabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-table]');
      if (!b) return;
      currentTable = b.dataset.table;
      render();
      KK.sfx.transition();
    });

    el.querySelector('#sigToggle').addEventListener('change', e => {
      document.body.classList.toggle('signals-on', e.target.checked);
    });

    const bar = el.querySelector('#exampleBar');
    const tds = el.querySelectorAll('td[data-c]');
    const showEx = (td, isLock) => {
      const { c, g } = td.dataset;
      const ex = exampleFor(currentTable, c, g);
      if (!ex) return;
      const cs = KK.CASE[c];
      bar.innerHTML = `${isLock ? '<span class="pin" title="Fixiert — Esc löst">📌</span>' : ''}<span class="tag bg-${c}">${cs.de}</span>${KK.genderBadge(g)}
        <span>${ex.html}</span>${KK.speakBtn(ex.plain)}<span class="hint">${ex.trigger}${isLock ? ' · Esc löst' : ''}</span>`;
    };
    const lockTd = td => {
      locked = { c: td.dataset.c, g: td.dataset.g };
      tds.forEach(x => x.classList.toggle('locked', x === td));
      showEx(td, true);
    };
    tds.forEach(td => {
      const preview = () => { if (!locked) showEx(td, false); };
      td.addEventListener('mouseenter', preview);
      td.addEventListener('focus', preview);
      td.addEventListener('click', () => lockTd(td));         // click/tap pins
      td.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lockTd(td); }
      });
    });
    // restore the pin across re-renders (table/language switch); impossible cells drop it
    if (locked) {
      const td = el.querySelector(`td[data-c="${locked.c}"][data-g="${locked.g}"]`);
      if (td) lockTd(td); else locked = null;
    }
  }

  function clearLock() {
    locked = null;
    const el = root();
    el.querySelectorAll('td.locked').forEach(x => x.classList.remove('locked'));
    const bar = el.querySelector('#exampleBar');
    if (bar) bar.innerHTML = '<span class="hint">→ Zelle berühren für ein Beispiel</span>';
  }

  KK.atlas = { render, clearLock };
})();
