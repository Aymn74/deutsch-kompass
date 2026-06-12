/* Kasus-Kompass — progress state, localStorage, Leitner-style weighting */
(function () {
  const KEY = 'kasus-kompass-v1';
  const VALID_GRIDS = new Set(['art', 'weak', 'mixed', 'strong', 'genus', 'prep', 'pron', 'possessive']);
  const VALID_CASES = new Set(['nom', 'akk', 'dat', 'gen', 'hint', 'wechsel']);
  const VALID_GENDERS = new Set(['m', 'f', 'n', 'pl']);
  const VALID_LANGS = new Set(['de', 'ar']);

  const blank = () => ({
    /* cells: { "<grid>.<case>.<gender>": {n: attempts, e: errors} }
       grids: art | weak | mixed | strong | prep (prep uses prep-class as "case") */
    cells: {},
    total: { n: 0, e: 0 },
    sessions: [],           // {d: ISO date, n, e} one entry per day
    bestStreak: 0,
    lang: 'de',
  });

  let S = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = normalizeState(JSON.parse(raw));
  } catch (e) { /* corrupted storage → start fresh */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  }

  function cellKey(grid, c, g) { return grid + '.' + c + '.' + g; }

  function countPair(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('bad count');
    const n = value.n;
    const e = value.e;
    if (!Number.isInteger(n) || !Number.isInteger(e) || n < 0 || e < 0 || e > n || n > 1000000) {
      throw new Error('bad count');
    }
    return { n, e };
  }

  function normalizeCellKey(key) {
    if (typeof key !== 'string') throw new Error('bad key');
    const parts = key.split('.');
    if (parts.length !== 3) throw new Error('bad key');
    const [grid, c, g] = parts;
    if (!VALID_GRIDS.has(grid) || !VALID_CASES.has(c) || !VALID_GENDERS.has(g)) throw new Error('bad key');
    if (grid === 'genus' && c !== 'hint') throw new Error('bad key');
    if (grid !== 'genus' && c === 'hint') throw new Error('bad key');
    return cellKey(grid, c, g);
  }

  function normalizeState(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad format');
    if (!data.cells || typeof data.cells !== 'object' || Array.isArray(data.cells)) throw new Error('bad cells');

    const out = blank();
    for (const [key, value] of Object.entries(data.cells)) {
      out.cells[normalizeCellKey(key)] = countPair(value);
    }
    out.total = countPair(data.total);

    if (data.sessions !== undefined) {
      if (!Array.isArray(data.sessions)) throw new Error('bad sessions');
      out.sessions = data.sessions.slice(-60).map(day => {
        if (!day || typeof day !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(day.d || '')) {
          throw new Error('bad session');
        }
        return { d: day.d, ...countPair(day) };
      });
    }

    if (data.bestStreak !== undefined) {
      if (!Number.isInteger(data.bestStreak) || data.bestStreak < 0 || data.bestStreak > 1000000) {
        throw new Error('bad streak');
      }
      out.bestStreak = data.bestStreak;
    }
    out.lang = VALID_LANGS.has(data.lang) ? data.lang : 'de';
    return out;
  }

  function record(grid, c, g, correct) {
    const k = cellKey(grid, c, g);
    const cell = S.cells[k] || (S.cells[k] = { n: 0, e: 0 });
    cell.n++; if (!correct) cell.e++;
    S.total.n++; if (!correct) S.total.e++;
    const today = new Date().toISOString().slice(0, 10);
    let day = S.sessions[S.sessions.length - 1];
    if (!day || day.d !== today) { day = { d: today, n: 0, e: 0 }; S.sessions.push(day); }
    day.n++; if (!correct) day.e++;
    if (S.sessions.length > 60) S.sessions = S.sessions.slice(-60);
    save();
  }

  function cell(grid, c, g) { return S.cells[cellKey(grid, c, g)] || { n: 0, e: 0 }; }

  /* Smoothed error rate — Laplace so unseen cells sit at 0.5 (unknown = worth drilling) */
  function errRate(grid, c, g) {
    const x = cell(grid, c, g);
    return (x.e + 1) / (x.n + 2);
  }

  /* Leitner-ish weight for an item: average smoothed error over its gaps, plus jitter */
  function weight(gapList) {
    if (!gapList.length) return 1;
    let s = 0;
    for (const gp of gapList) {
      const grid = gp.k === 'adj' ? gp.w : 'art';
      s += errRate(grid, gp.c, gp.g);
    }
    return s / gapList.length + Math.random() * 0.15;
  }

  /* Pick index from items[] using weights — sample 5 candidates, take heaviest */
  function pickWeighted(items, gapsOf, avoidIdx) {
    let best = -1, bestW = -1;
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * items.length);
      if (idx === avoidIdx && items.length > 1) continue;
      const w = weight(gapsOf(items[idx]));
      if (w > bestW) { bestW = w; best = idx; }
    }
    return best === -1 ? Math.floor(Math.random() * items.length) : best;
  }

  function weakest(limit) {
    const rows = [];
    for (const [k, v] of Object.entries(S.cells)) {
      if (v.n < 2) continue;
      const [grid, c, g] = k.split('.');
      rows.push({ grid, c, g, n: v.n, e: v.e, rate: v.e / v.n });
    }
    rows.sort((a, b) => b.rate - a.rate || b.n - a.n);
    return rows.slice(0, limit);
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kasus-kompass-fortschritt.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSON(file, done) {
    const r = new FileReader();
    r.onload = () => {
      try {
        S = normalizeState(JSON.parse(r.result));
        save(); done(true);
      } catch (e) { done(false); }
    };
    r.readAsText(file);
  }

  function reset() { S = blank(); save(); }

  KK.state = {
    get: () => S, save, record, cell, errRate, weight, pickWeighted,
    weakest, exportJSON, importJSON, reset,
    setLang(l) { S.lang = l; save(); },
    setBestStreak(v) { if (v > S.bestStreak) { S.bestStreak = v; save(); } },
  };
})();
