/* Module 4 — Weakness heatmap + dashboard + export/import */
(function () {
  const root = () => document.getElementById('view-stats');
  let grid = 'art';

  const GRID_LABELS = {
    art: 'Artikel', weak: 'Adjektiv · Schwach', mixed: 'Adjektiv · Gemischt', strong: 'Adjektiv · Stark',
  };

  Object.assign(GRID_LABELS, {
    pron: 'Pronomen',
    possessive: 'Possessivartikel',
  });

  function heatColor(rate, n) {
    if (n === 0) return 'transparent';
    // green (good) → red (bad)
    const r = Math.round(40 + rate * 200);
    const g = Math.round(160 - rate * 120);
    return `rgba(${r}, ${g}, 60, ${0.12 + rate * 0.45})`;
  }

  function cellName(w) {
    if (w.grid === 'genus') return `Genus-Hinweise — ${(KK.GENDER_META[w.g] || {}).de || w.g}`;
    const cs = KK.CASE[w.c] ? KK.CASE[w.c].de : w.c;
    const gn = (KK.GENDERS.find(x => x.id === w.g) || {}).de || w.g;
    const grids = { art: 'Artikel', weak: 'Adjektiv nach Artikel', mixed: 'Adjektiv nach ein/kein', strong: 'Adjektiv ohne Artikel' };
    grids.pron = 'Personalpronomen';
    grids.possessive = 'Possessivartikel';
    return `${cs} · ${gn} — ${grids[w.grid] || w.grid}`;
  }

  function render() {
    const el = root();
    const S = KK.state.get();
    const lang = S.lang;
    const acc = S.total.n ? Math.round((S.total.n - S.total.e) / S.total.n * 100) : 0;

    // trend: delta vs previous day + sparkline over the last 14 training days
    let trend = '—';
    const ss = S.sessions;
    if (ss.length >= 2) {
      const a = ss[ss.length - 1], b = ss[ss.length - 2];
      const accA = a.n ? (a.n - a.e) / a.n : 0, accB = b.n ? (b.n - b.e) / b.n : 0;
      const d = Math.round((accA - accB) * 100);
      trend = d > 0 ? `▲ +${d}% vs. letzte Sitzung` : d < 0 ? `▼ ${d}% vs. letzte Sitzung` : '→ stabil';
    }
    let spark = '';
    if (ss.length >= 2) {
      const days = ss.slice(-14);
      const W = 120, H = 28;
      const pts = days.map((day, i) => {
        const x = days.length === 1 ? W : i * (W / (days.length - 1));
        const accD = day.n ? (day.n - day.e) / day.n : 0;
        return `${x.toFixed(1)},${(H - 3 - accD * (H - 6)).toFixed(1)}`;
      }).join(' ');
      spark = `<svg width="${W}" height="${H}" style="display:block;margin-top:.3rem" aria-label="Genauigkeit pro Tag">
        <polyline points="${pts}" fill="none" stroke="var(--c-dat)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>
      </svg>`;
    }

    const weak3 = KK.state.weakest(3);
    const endgegner = weak3.length
      ? `<div class="endgegner">🎯 <b>Dein Endgegner:</b> ${cellName(weak3[0])}
           (${Math.round(weak3[0].rate * 100)}% Fehler bei ${weak3[0].n} Versuchen)
           <ol>${weak3.slice(1).map(w => `<li>${cellName(w)} — ${Math.round(w.rate * 100)}% Fehler</li>`).join('')}</ol></div>`
      : `<div class="endgegner" style="border-color:var(--line);background:var(--bg-2)">Noch keine Daten — ab in die <b style="color:var(--ink)">Drill-Arena</b>! Der Trainer braucht ein paar Antworten, um deine Schwächen zu finden.</div>`;

    const tabs = Object.entries(GRID_LABELS).map(([id, lbl]) =>
      `<button data-grid="${id}" class="${id === grid ? 'active' : ''}">${lbl}</button>`).join('');

    const rows = KK.CASES.map(c => {
      const cells = KK.GENDERS.map(g => {
        const cell = KK.state.cell(grid, c.id, g.id);
        const rate = cell.n ? cell.e / cell.n : 0;
        const inner = cell.n
          ? `<span class="pct">${Math.round((1 - rate) * 100)}%</span><span class="reps">${cell.n} Reps</span>`
          : `<span class="pct">·</span><span class="reps">0</span>`;
        return `<td class="${cell.n ? '' : 'empty'}" style="background:${heatColor(rate, cell.n)}" title="${c.de} ${g.de}: ${cell.e} Fehler / ${cell.n}">${inner}</td>`;
      }).join('');
      return `<tr data-case="${c.id}"><th class="case-h k-${c.id}">${c.de}</th>${cells}</tr>`;
    }).join('');

    el.innerHTML = `
      <h1>Schwächen-Heatmap</h1>
      <p class="lede">Je röter die Zelle, desto öfter daneben. Die Drill-Arena fragt rote Zellen automatisch häufiger ab.</p>
      <div class="dash">
        <div class="stat-card"><div class="label">Gesamt-Reps</div><div class="value">${S.total.n}</div></div>
        <div class="stat-card"><div class="label">Genauigkeit</div><div class="value">${acc}%</div><div class="trend">${trend}</div>${spark}</div>
        <div class="stat-card"><div class="label">Bester Streak</div><div class="value">${S.bestStreak} 🔥</div></div>
        <div class="stat-card"><div class="label">Trainings-Tage</div><div class="value">${ss.length}</div></div>
      </div>
      ${endgegner}
      <div class="tabs" id="heatTabs">${tabs}</div>
      <div class="decl-wrap">
        <table class="decl heat">
          <thead><tr><th></th>${KK.GENDERS.map(g => `<th>${g.de}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="explain" ${lang === 'ar' ? 'dir="rtl" lang="ar"' : ''}>${KK.EXPLAIN.stats[lang]}</div>
      <div class="io-row">
        <button class="btn" id="exportBtn">⬇ Fortschritt exportieren (JSON)</button>
        <button class="btn" id="importBtn">⬆ Importieren</button>
        <input type="file" id="importFile" accept=".json,application/json" style="display:none">
        <button class="btn" id="resetBtn" style="color:var(--bad)">Zurücksetzen</button>
        <span class="note">Alles bleibt lokal in deinem Browser.</span>
      </div>
    `;

    el.querySelector('#heatTabs').addEventListener('click', e => {
      const b = e.target.closest('[data-grid]');
      if (b) { grid = b.dataset.grid; render(); }
    });
    el.querySelector('#exportBtn').addEventListener('click', KK.state.exportJSON);
    el.querySelector('#importBtn').addEventListener('click', () => el.querySelector('#importFile').click());
    el.querySelector('#importFile').addEventListener('change', e => {
      const f = e.target.files[0];
      if (f) KK.state.importJSON(f, ok => {
        alert(ok ? 'Fortschritt importiert! ✓' : 'Datei konnte nicht gelesen werden.');
        if (ok) { KK.app.applyLang(); render(); }
      });
    });
    el.querySelector('#resetBtn').addEventListener('click', () => {
      if (confirm('Wirklich allen Fortschritt löschen?')) { KK.state.reset(); render(); }
    });
  }

  KK.stats = { render };
})();
