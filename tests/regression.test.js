const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function runFile(ctx, file) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });
}

function createLocalStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

function createBaseContext(extra = {}) {
  const ctx = {
    console,
    localStorage: createLocalStorage(extra.localStorage),
    Blob: function Blob() {},
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    document: {
      createElement: () => ({ click() {} }),
    },
    ...extra.globals,
  };
  ctx.window = ctx;
  ctx.KK = {};
  vm.createContext(ctx);
  runFile(ctx, 'data.js');
  return ctx;
}

function importProgress(KK, text) {
  return new Promise(resolve => {
    KK.state.importJSON({ text }, resolve);
  });
}

function testBrandingUsesDeutschKompass() {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

  assert.ok(index.includes('Deutsch-Kompass'), 'index should use the new Deutsch-Kompass brand');
  assert.ok(index.includes('<b>Deutsch</b>-Kompass'), 'visible header should show Deutsch-Kompass');
  assert.strictEqual(manifest.name, 'Deutsch-Kompass');
  assert.strictEqual(manifest.short_name, 'Deutsch');
  assert.ok(readme.includes('Deutsch-Kompass'), 'README should use the new brand');
}

async function testImportRejectsMalformedState() {
  class FakeFileReader {
    readAsText(file) {
      this.result = file.text;
      this.onload();
    }
  }

  const ctx = createBaseContext({ globals: { FileReader: FakeFileReader } });
  runFile(ctx, 'state.js');

  ctx.KK.state.record('art', 'nom', 'm', true);
  const before = JSON.stringify(ctx.KK.state.get());
  const invalid = JSON.stringify({
    cells: { 'art.nom.<img src=x onerror=alert(1)>': { n: 1, e: 1 } },
    total: { n: '<b>bad</b>', e: 0 },
    sessions: [{ d: 'not-a-date', n: 1, e: 0 }],
    bestStreak: '<script>1</script>',
    lang: 'ar',
  });

  const ok = await importProgress(ctx.KK, invalid);

  assert.strictEqual(ok, false, 'malformed imported progress should be rejected');
  assert.strictEqual(JSON.stringify(ctx.KK.state.get()), before, 'failed import should keep current state');
}

async function testImportAcceptsValidState() {
  class FakeFileReader {
    readAsText(file) {
      this.result = file.text;
      this.onload();
    }
  }

  const ctx = createBaseContext({ globals: { FileReader: FakeFileReader } });
  runFile(ctx, 'state.js');

  const valid = JSON.stringify({
    cells: { 'art.nom.m': { n: 4, e: 1 } },
    total: { n: 4, e: 1 },
    sessions: [{ d: '2026-06-11', n: 4, e: 1 }],
    bestStreak: 3,
    lang: 'ar',
  });

  const ok = await importProgress(ctx.KK, valid);

  assert.strictEqual(ok, true, 'valid imported progress should be accepted');
  assert.strictEqual(ctx.KK.state.get().cells['art.nom.m'].n, 4);
  assert.strictEqual(ctx.KK.state.get().cells['art.nom.m'].e, 1);
  assert.strictEqual(ctx.KK.state.get().bestStreak, 3);
  assert.strictEqual(ctx.KK.state.get().lang, 'ar');
}

function createElementStub() {
  const element = {
    innerHTML: '',
    dataset: {},
    disabled: false,
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    querySelector(selector) {
      if (selector === '#fb' || selector === '#nextBtn' || selector === '#againBtn' || selector === '#goBtn' || selector === '#blitzGap') {
        return createElementStub();
      }
      return createElementStub();
    },
    querySelectorAll(selector) {
      if (selector === '.opt') return [createElementStub(), createElementStub(), createElementStub(), createElementStub()];
      return [];
    },
  };
  return element;
}

function testBlitzTimerStopsWhenModeChanges() {
  const activeTimers = new Set();
  let nextTimerId = 1;
  const view = createElementStub();
  const stage = createElementStub();
  const modeCards = ['luecke', 'detektiv', 'praep', 'blitz'].map(mode => ({
    dataset: { mode },
    classList: { toggle() {} },
  }));

  const ctx = createBaseContext({
    globals: {
      localStorage: createLocalStorage(),
      document: {
        getElementById(id) {
          if (id === 'view-drill') return view;
          if (id === 'stage') return stage;
          return createElementStub();
        },
        querySelectorAll(selector) {
          return selector === '#modes .mode-card' ? modeCards : [];
        },
      },
      setInterval(callback) {
        const id = nextTimerId++;
        activeTimers.add(id);
        return id;
      },
      clearInterval(id) {
        activeTimers.delete(id);
      },
      setTimeout() {},
    },
  });
  runFile(ctx, 'state.js');
  runFile(ctx, 'drill.js');

  ctx.KK.drill.modeKey(4);
  assert.strictEqual(ctx.KK.drillKey({ key: 'Enter' }), true, 'Enter should start Blitz');
  assert.strictEqual(activeTimers.size, 1, 'Blitz should create one timer');

  ctx.KK.drill.modeKey(1);

  assert.strictEqual(activeTimers.size, 0, 'changing drill mode should clear the Blitz timer');
}

function testContentBanksMeetExpandedMinimums() {
  const ctx = createBaseContext();
  const KK = ctx.KK;

  assert.ok(KK.VOCAB.length >= 120, 'VOCAB should contain at least 120 words after expansion');
  assert.ok(KK.LUECKEN.length >= 90, 'LUECKEN should contain at least 90 sentence drills after expansion');
  assert.ok(KK.DETEKTIV.length >= 40, 'DETEKTIV should contain at least 40 detective drills after expansion');
  assert.ok(KK.WECHSEL_DRILLS.length >= 28, 'WECHSEL_DRILLS should contain at least 28 Wechselpraeposition drills after expansion');
}

function testAdjectiveDemoCoversGenderCaseAndWorld() {
  const ctx = createBaseContext();
  const demo = ctx.KK.adjDemoPhrase;

  assert.strictEqual(typeof demo, 'function', 'adjective demo phrase helper should exist');
  assert.strictEqual(demo('weak', 'nom', 'm').plain, 'der gute Mann');
  assert.strictEqual(demo('mixed', 'nom', 'm').plain, 'ein guter Mann');
  assert.strictEqual(demo('strong', 'nom', 'm').plain, 'guter Mann');
  assert.strictEqual(demo('weak', 'akk', 'm').plain, 'den guten Mann');
  assert.strictEqual(demo('weak', 'nom', 'pl').plain, 'die guten Kinder');
  assert.strictEqual(demo('mixed', 'nom', 'n').plain, 'ein gutes Kind');
  assert.strictEqual(demo('mixed', 'akk', 'pl').plain, 'keine guten Kinder');
  assert.strictEqual(demo('strong', 'dat', 'pl').plain, 'guten Kindern');
  assert.strictEqual(demo('mixed', 'gen', 'pl').plain, 'keiner guten Kinder');
}

function testAdjectiveRenderSmoke() {
  const stage = createElementStub();
  const caption = { ...createElementStub(), setAttribute() {}, removeAttribute() {} };
  const summary = { ...createElementStub(), textContent: '' };
  const controls = createElementStub();
  const toggle = createElementStub();
  const rootEl = {
    ...createElementStub(),
    querySelector(selector) {
      if (selector === '#jumpStage') return stage;
      if (selector === '#jumpCaption') return caption;
      if (selector === '#demoSummary') return summary;
      if (selector === '.demo-controls') return controls;
      if (selector === '#oceanToggle' || selector === '#sigToggle2') return toggle;
      if (selector === '#adjExampleBar') return createElementStub();
      return createElementStub();
    },
    querySelectorAll() {
      return [];
    },
  };

  const ctx = createBaseContext({
    globals: {
      document: {
        body: { classList: { contains() { return false; } } },
        getElementById(id) {
          return id === 'view-adjektiv' ? rootEl : createElementStub();
        },
        createElement: () => ({ click() {} }),
      },
    },
  });
  runFile(ctx, 'state.js');
  runFile(ctx, 'adjektiv.js');

  ctx.KK.adjektiv.render();

  assert.ok(stage.innerHTML.includes('Mann'), 'adjective demo should render the selected noun');
  assert.ok(caption.innerHTML.includes('Artikel') || caption.innerHTML.includes('الأداة'), 'adjective demo should render an explanation caption');
  assert.ok(rootEl.innerHTML.includes('bestimmt'), 'article controls should label the definite article type');
  assert.ok(rootEl.innerHTML.includes('ein/kein'), 'article controls should label the mixed article type');
  assert.ok(summary.textContent.includes('Nominativ · Maskulin'), 'demo should summarize the current case and gender');
  assert.ok(rootEl.innerHTML.includes('article-seg'), 'article controls should remain a dedicated vertical group');
  assert.ok(rootEl.innerHTML.includes('choice-grid'), 'case and gender controls should render as compact grids');
}

function testGenusReferenceHasMobilePicker() {
  const bodyEl = createElementStub();
  const tabsEl = createElementStub();
  const rootEl = {
    ...createElementStub(),
    querySelector(selector) {
      if (selector === '#genusTabs') return tabsEl;
      return createElementStub();
    },
  };

  const ctx = createBaseContext({
    globals: {
      document: {
        body: { classList: { contains() { return false; } } },
        getElementById(id) {
          if (id === 'view-genus') return rootEl;
          if (id === 'genusBody') return bodyEl;
          return createElementStub();
        },
        createElement: () => ({ click() {} }),
      },
    },
  });
  runFile(ctx, 'state.js');
  runFile(ctx, 'genus.js');

  ctx.KK.genus.render();

  assert.ok(bodyEl.innerHTML.includes('genus-picker'), 'genus reference should offer a compact gender picker');
  assert.ok(bodyEl.innerHTML.includes('data-active-gender="m"'), 'genus reference should mark the active gender');
  assert.ok(bodyEl.innerHTML.includes('data-gender-filter="m"'), 'genus picker should include a masculine filter button');
  assert.ok(bodyEl.innerHTML.includes('<details class="absolute-rule"'), 'absolute genus rule should be collapsible');
  assert.ok(bodyEl.innerHTML.includes('ind-strip'), 'genus reference rules should be grouped into paged strips');
  assert.ok(bodyEl.innerHTML.includes('rule-pager'), 'genus reference rules should provide explicit page controls');
}

function testPronomenBanksMeetMinimums() {
  const ctx = createBaseContext();
  const KK = ctx.KK;

  assert.ok(KK.PRONOUNS, 'pronoun data namespace should exist');
  assert.ok(KK.PRONOUNS.personal.length >= 9, 'personal pronoun bank should cover ich through Sie');
  assert.ok(KK.PRONOUNS.possessiveOwners.length >= 8, 'possessive bank should cover the main owners');
  assert.ok(KK.PRONOUN_DRILLS.length >= 18, 'personal-pronoun quiz bank should contain varied sentence drills');
  assert.ok(KK.POSSESSIVE_DRILLS.length >= 24, 'possessive quiz bank should cover case and gender variety');

  const ich = KK.PRONOUNS.personal.find(row => row.id === 'ich');
  assert.deepStrictEqual({ nom: ich.nom, akk: ich.akk, dat: ich.dat }, { nom: 'ich', akk: 'mich', dat: 'mir' });

  const euer = KK.possessiveForm('euer', 'dat', 'f');
  assert.strictEqual(euer, 'eurer', 'euer should use the natural contracted possessive forms');
}

function testMemoryTipsExist() {
  const ctx = createBaseContext();
  const KK = ctx.KK;

  assert.ok(KK.memoryTips.caseTipp('nom').includes('من يفعل'), 'case tipp should connect Nominativ to Arabic logic');
  assert.ok(KK.memoryTips.caseMerksatz('dat').includes('m r m n'), 'Dativ merksatz should include the sound rhythm');
  assert.ok(KK.memoryTips.caseMerksatz('gen').includes('s r s r'), 'Genitiv merksatz should include the sound rhythm');
  assert.ok(KK.memoryTips.adjMerksatz().includes('علامة الحالة'), 'adjective merksatz should explain the one-signal rule');
  assert.ok(KK.memoryTips.possessiveMerksatz().includes('المملوك'), 'possessive merksatz should point to the owned noun');
  assert.ok(KK.memoryTips.pronounMerksatz('ich').includes('ich → mich → mir'), 'pronoun merksatz should include personal chains');
}

function testPronomenRenderSmoke() {
  const rootEl = {
    ...createElementStub(),
    querySelector(selector) {
      if (selector === '#pronomenBody' || selector === '#pronomenTabs') return createElementStub();
      return createElementStub();
    },
    querySelectorAll() {
      return [];
    },
  };

  const ctx = createBaseContext({
    globals: {
      document: {
        body: { classList: { contains() { return false; } } },
        getElementById(id) {
          return id === 'view-pronomen' ? rootEl : createElementStub();
        },
        createElement: () => ({ click() {} }),
      },
    },
  });
  runFile(ctx, 'state.js');
  runFile(ctx, 'pronomen.js');

  ctx.KK.pronomen.render();

  assert.ok(rootEl.innerHTML.includes('Personalpronomen'), 'pronoun section should include personal pronouns');
  assert.ok(rootEl.innerHTML.includes('Possessivartikel'), 'pronoun section should include possessive forms');
  assert.ok(rootEl.innerHTML.includes('data-tab="quiz"'), 'pronoun section should expose a quiz tab');
  assert.ok(rootEl.innerHTML.includes('pronoun-picker'), 'pronoun reference should start with a compact picker');
  assert.ok(rootEl.innerHTML.includes('data-ref-kind="personal"'), 'pronoun reference should offer a personal picker mode');
  assert.ok(rootEl.innerHTML.includes('data-ref-kind="possessive"'), 'pronoun reference should offer a possessive picker mode');
  assert.ok(rootEl.innerHTML.includes('data-pronoun="ich"'), 'pronoun picker should include personal pronoun choices');
  assert.ok(!rootEl.innerHTML.includes('pronoun-grid'), 'pronoun overview should not render the long detail list');

  rootEl.onclick({
    target: {
      closest(selector) {
        if (selector === '[data-pronoun]') return { dataset: { pronoun: 'ich' } };
        return null;
      },
    },
  });

  assert.ok(rootEl.innerHTML.includes('data-example-cell'), 'pronoun detail cells should expose hover/click examples');
  assert.ok(rootEl.innerHTML.includes('pronoun-example-panel'), 'pronoun detail should include one fixed example panel');
  assert.ok(rootEl.innerHTML.includes('data-example-text="Ich lerne Deutsch."'), 'nominative cell should carry its example');
  assert.ok(rootEl.innerHTML.includes('data-example-speak="Maria sieht mich."'), 'accusative cell should carry speakable example text');
}

async function main() {
  testBrandingUsesDeutschKompass();
  await testImportRejectsMalformedState();
  await testImportAcceptsValidState();
  testBlitzTimerStopsWhenModeChanges();
  testContentBanksMeetExpandedMinimums();
  testAdjectiveDemoCoversGenderCaseAndWorld();
  testAdjectiveRenderSmoke();
  testGenusReferenceHasMobilePicker();
  testPronomenBanksMeetMinimums();
  testMemoryTipsExist();
  testPronomenRenderSmoke();
  console.log('regression tests passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
