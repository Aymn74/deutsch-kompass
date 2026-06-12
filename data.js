/* Kasus-Kompass — data layer. Everything static lives here. */
window.KK = window.KK || {};

KK.CASES = [
  { id: 'nom', de: 'Nominativ', ar: 'المرفوع (الفاعل)', q: 'wer? was?', color: 'var(--c-nom)' },
  { id: 'akk', de: 'Akkusativ', ar: 'المنصوب (المفعول به)', q: 'wen? was?', color: 'var(--c-akk)' },
  { id: 'dat', de: 'Dativ', ar: 'المجرور (المفعول له)', q: 'wem?', color: 'var(--c-dat)' },
  { id: 'gen', de: 'Genitiv', ar: 'المضاف إليه (الملكية)', q: 'wessen?', color: 'var(--c-gen)' },
];
KK.CASE = Object.fromEntries(KK.CASES.map(c => [c.id, c]));

KK.GENDERS = [
  { id: 'm', de: 'Maskulin', short: 'M' },
  { id: 'f', de: 'Feminin', short: 'F' },
  { id: 'n', de: 'Neutrum', short: 'N' },
  { id: 'pl', de: 'Plural', short: 'Pl' },
];

/* ---------- Module 1: article tables. Order: [m, f, n, pl] ---------- */
KK.ARTICLES = {
  def: {
    label: 'Bestimmte Artikel', sub: 'der · die · das',
    nom: ['der', 'die', 'das', 'die'],
    akk: ['den', 'die', 'das', 'die'],
    dat: ['dem', 'der', 'dem', 'den'],
    gen: ['des', 'der', 'des', 'der'],
  },
  indef: {
    label: 'Unbestimmte Artikel', sub: 'ein · eine',
    nom: ['ein', 'eine', 'ein', null],
    akk: ['einen', 'eine', 'ein', null],
    dat: ['einem', 'einer', 'einem', null],
    gen: ['eines', 'einer', 'eines', null],
  },
  kein: {
    label: 'kein-Wörter', sub: 'kein zeigt das Muster für mein · dein · sein …',
    nom: ['kein', 'keine', 'kein', 'keine'],
    akk: ['keinen', 'keine', 'kein', 'keine'],
    dat: ['keinem', 'keiner', 'keinem', 'keinen'],
    gen: ['keines', 'keiner', 'keines', 'keiner'],
  },
  dies: {
    label: 'dieser-Wörter', sub: 'dieser zeigt das Muster für welcher · jeder …',
    nom: ['dieser', 'diese', 'dieses', 'diese'],
    akk: ['diesen', 'diese', 'dieses', 'diese'],
    dat: ['diesem', 'dieser', 'diesem', 'diesen'],
    gen: ['dieses', 'dieser', 'dieses', 'dieser'],
  },
};

/* Signal endings per case+gender: the letters that carry case info. */
KK.SIGNAL = {
  nom: { m: 'r', f: 'e', n: 's', pl: 'e' },
  akk: { m: 'n', f: 'e', n: 's', pl: 'e' },
  dat: { m: 'm', f: 'r', n: 'm', pl: 'n' },
  gen: { m: 's', f: 'r', n: 's', pl: 'r' },
};
/* Words with NO signal ending (the bare forms): ein/kein/mein… in Nom-M, Nom-N, Akk-N */
KK.noSignal = function (word, c, g) {
  return /^(ein|kein|mein|dein|sein|ihr|unser|euer)$/.test(word) ||
    (word === 'das' && false);
};

/* One real example sentence per case×gender. {art} is replaced per table.
   trigger = the word that causes the case (underlined in UI). */
KK.EXAMPLES = {
  nom: {
    m: { t: '{art} Mann {tr:schläft} tief.', trigger: 'Subjekt + Verb' },
    f: { t: '{art} Frau {tr:liest} eine Zeitung.', trigger: 'Subjekt + Verb' },
    n: { t: '{art} Kind {tr:spielt} im Garten.', trigger: 'Subjekt + Verb' },
    pl: { t: '{art} Bücher {tr:liegen} auf dem Tisch.', trigger: 'Subjekt + Verb' },
  },
  akk: {
    m: { t: 'Ich {tr:sehe} {art} Mann.', trigger: 'sehen + Akk.' },
    f: { t: 'Er {tr:kauft} {art} Tasche.', trigger: 'kaufen + Akk.' },
    n: { t: 'Wir {tr:lesen} {art} Buch.', trigger: 'lesen + Akk.' },
    pl: { t: 'Sie {tr:besucht} {art} Freunde.', trigger: 'besuchen + Akk.' },
  },
  dat: {
    m: { t: 'Ich {tr:helfe} {art} Mann.', trigger: 'helfen + Dat.' },
    f: { t: 'Das Auto {tr:gehört} {art} Frau.', trigger: 'gehören + Dat.' },
    n: { t: 'Sie {tr:dankt} {art} Kind.', trigger: 'danken + Dat.' },
    pl: { t: 'Er {tr:antwortet} {art} Lehrern.', trigger: 'antworten + Dat. (+ Dativ-n!)' },
  },
  gen: {
    m: { t: 'Das Auto {art} {tr:Mannes} ist neu.', trigger: 'Besitz (wessen?)' },
    f: { t: 'Die Tasche {art} {tr:Frau} ist rot.', trigger: 'Besitz (wessen?)' },
    n: { t: 'Die Eltern {art} {tr:Kindes} sind nett.', trigger: 'Besitz (wessen?)' },
    pl: { t: 'Die Farben {art} {tr:Blumen} sind schön.', trigger: 'Besitz (wessen?)' },
  },
};
/* Genitive examples need a different plural noun set per table; keep simple. */

/* ---------- Module 2: adjective declension ---------- */
KK.ADJ = {
  weak: {
    label: 'Schwach', sub: 'nach bestimmtem Artikel', ex: 'der gut<b>e</b> Mann',
    nom: ['e', 'e', 'e', 'en'],
    akk: ['en', 'e', 'e', 'en'],
    dat: ['en', 'en', 'en', 'en'],
    gen: ['en', 'en', 'en', 'en'],
  },
  mixed: {
    label: 'Gemischt', sub: 'nach ein / kein / mein …', ex: 'ein gut<b>er</b> Mann',
    nom: ['er', 'e', 'es', 'en'],
    akk: ['en', 'e', 'es', 'en'],
    dat: ['en', 'en', 'en', 'en'],
    gen: ['en', 'en', 'en', 'en'],
  },
  strong: {
    label: 'Stark', sub: 'ohne Artikel', ex: 'gut<b>er</b> Wein',
    nom: ['er', 'e', 'es', 'e'],
    akk: ['en', 'e', 'es', 'e'],
    dat: ['em', 'er', 'em', 'en'],
    gen: ['en', 'er', 'en', 'er'],
  },
};

/* Phrase builders for adjective table cells */
KK.ADJ_NOUNS = {
  weak: { m: ['Mann', 'Mannes'], f: ['Frau', 'Frau'], n: ['Kind', 'Kindes'], pl: ['Leute', 'Leute'] },
  mixed: { m: ['Mann', 'Mannes'], f: ['Frau', 'Frau'], n: ['Kind', 'Kindes'], pl: ['Kinder', 'Kinder'] },
  strong: { m: ['Wein', 'Weines'], f: ['Milch', 'Milch'], n: ['Bier', 'Bieres'], pl: ['Blumen', 'Blumen'] },
};
KK.ADJ_STEMS = { weak: 'gut', mixed: 'gut', strong: { m: 'gut', f: 'frisch', n: 'kalt', pl: 'schön' } };

KK.ADJ_DEMO_NOUNS = {
  m: { nom: 'Mann', akk: 'Mann', dat: 'Mann', gen: 'Mannes' },
  f: { nom: 'Frau', akk: 'Frau', dat: 'Frau', gen: 'Frau' },
  n: { nom: 'Kind', akk: 'Kind', dat: 'Kind', gen: 'Kindes' },
  pl: { nom: 'Kinder', akk: 'Kinder', dat: 'Kindern', gen: 'Kinder' },
};

KK.adjDemoPhrase = function (world, c, g) {
  const gi = KK.GENDERS.findIndex(x => x.id === g);
  if (!KK.ADJ[world] || gi < 0 || !KK.CASE[c]) return null;
  const ending = KK.ADJ[world][c][gi];
  const noun = KK.ADJ_DEMO_NOUNS[g][c];
  const article = world === 'weak'
    ? KK.ARTICLES.def[c][gi]
    : world === 'mixed'
      ? (KK.ARTICLES.indef[c][gi] || KK.ARTICLES.kein[c][gi])
      : '';
  const articlePart = article ? article + ' ' : '';
  const plain = `${articlePart}gut${ending} ${noun}`;
  const html = `${article ? `<span class="demo-article">${article}</span> ` : ''}gut<span class="sig">${ending}</span> ${noun}`;
  return { plain, html, article, ending, noun, world, c, g };
};

/* ---------- Module: Pronomen + Possessivartikel ---------- */
KK.PRONOUNS = {
  personal: [
    { id: 'ich', label: 'ich', ar: 'أنا', group: 'm', nom: 'ich', akk: 'mich', dat: 'mir', gen: 'meiner',
      ex: { nom: 'Ich lerne Deutsch.', akk: 'Maria sieht mich.', dat: 'Der Lehrer hilft mir.' } },
    { id: 'du', label: 'du', ar: 'أنت', group: 'm', nom: 'du', akk: 'dich', dat: 'dir', gen: 'deiner',
      ex: { nom: 'Du liest den Satz.', akk: 'Ich frage dich.', dat: 'Ich antworte dir.' } },
    { id: 'er', label: 'er', ar: 'هو', group: 'm', nom: 'er', akk: 'ihn', dat: 'ihm', gen: 'seiner',
      ex: { nom: 'Er kommt heute.', akk: 'Wir sehen ihn.', dat: 'Sie dankt ihm.' } },
    { id: 'sie_sg', label: 'sie', ar: 'هي', group: 'f', nom: 'sie', akk: 'sie', dat: 'ihr', gen: 'ihrer',
      ex: { nom: 'Sie arbeitet viel.', akk: 'Ich besuche sie.', dat: 'Das Buch gehört ihr.' } },
    { id: 'es', label: 'es', ar: 'هو/هي للمحايد', group: 'n', nom: 'es', akk: 'es', dat: 'ihm', gen: 'seiner',
      ex: { nom: 'Es ist wichtig.', akk: 'Ich verstehe es.', dat: 'Wir folgen ihm.' } },
    { id: 'wir', label: 'wir', ar: 'نحن', group: 'pl', nom: 'wir', akk: 'uns', dat: 'uns', gen: 'unser',
      ex: { nom: 'Wir üben jeden Tag.', akk: 'Der Kurs motiviert uns.', dat: 'Die App hilft uns.' } },
    { id: 'ihr', label: 'ihr', ar: 'أنتم', group: 'pl', nom: 'ihr', akk: 'euch', dat: 'euch', gen: 'euer',
      ex: { nom: 'Ihr sprecht gut.', akk: 'Ich höre euch.', dat: 'Ich zeige euch die Regel.' } },
    { id: 'sie_pl', label: 'sie', ar: 'هم/هن', group: 'pl', nom: 'sie', akk: 'sie', dat: 'ihnen', gen: 'ihrer',
      ex: { nom: 'Sie warten hier.', akk: 'Wir treffen sie.', dat: 'Der Lehrer erklärt ihnen den Kasus.' } },
    { id: 'Sie', label: 'Sie', ar: 'حضرتك/حضراتكم', group: 'pl', nom: 'Sie', akk: 'Sie', dat: 'Ihnen', gen: 'Ihrer',
      ex: { nom: 'Sie haben recht.', akk: 'Ich begrüße Sie.', dat: 'Ich danke Ihnen.' } },
  ],
  possessiveOwners: [
    { id: 'ich', owner: 'ich', stem: 'mein', ar: 'ملكي' },
    { id: 'du', owner: 'du', stem: 'dein', ar: 'ملكك' },
    { id: 'er', owner: 'er/es', stem: 'sein', ar: 'ملكه' },
    { id: 'sie_sg', owner: 'sie', stem: 'ihr', ar: 'ملكها' },
    { id: 'wir', owner: 'wir', stem: 'unser', ar: 'ملكنا' },
    { id: 'ihr', owner: 'ihr', stem: 'euer', ar: 'ملككم' },
    { id: 'sie_pl', owner: 'sie', stem: 'ihr', ar: 'ملكهم/ملكهن' },
    { id: 'Sie', owner: 'Sie', stem: 'Ihr', ar: 'ملك حضرتك/حضراتكم' },
  ],
};

KK.PRONOUN_CASES = [
  { id: 'nom', label: 'Nominativ', ar: 'فاعل' },
  { id: 'akk', label: 'Akkusativ', ar: 'مفعول مباشر' },
  { id: 'dat', label: 'Dativ', ar: 'لمن؟ / مع أفعال الداتيف' },
  { id: 'gen', label: 'Genitiv', ar: 'ملكية - نادر مع الضمائر الشخصية' },
];

KK.possessiveForm = function (ownerId, c, g) {
  const owner = KK.PRONOUNS.possessiveOwners.find(x => x.id === ownerId || x.stem === ownerId);
  if (!owner || !KK.CASE[c]) return '';
  const gi = KK.GENDERS.findIndex(x => x.id === g);
  if (gi < 0) return '';
  const regular = {
    nom: ['', 'e', '', 'e'],
    akk: ['en', 'e', '', 'e'],
    dat: ['em', 'er', 'em', 'en'],
    gen: ['es', 'er', 'es', 'er'],
  };
  if (owner.stem === 'euer') {
    return {
      nom: ['euer', 'eure', 'euer', 'eure'],
      akk: ['euren', 'eure', 'euer', 'eure'],
      dat: ['eurem', 'eurer', 'eurem', 'euren'],
      gen: ['eures', 'eurer', 'eures', 'eurer'],
    }[c][gi];
  }
  return owner.stem + regular[c][gi];
};

KK.PRONOUN_DRILLS = [
  { t: 'Maria sieht ___.', a: 'mich', c: 'akk', who: 'ich', note: 'sehen + Akkusativ: wen sieht Maria?' },
  { t: 'Der Lehrer hilft ___.', a: 'mir', c: 'dat', who: 'ich', note: 'helfen + Dativ: wem hilft der Lehrer?' },
  { t: 'Ich frage ___.', a: 'dich', c: 'akk', who: 'du', note: 'fragen + Akkusativ.' },
  { t: 'Ich antworte ___.', a: 'dir', c: 'dat', who: 'du', note: 'antworten + Dativ.' },
  { t: 'Wir sehen ___.', a: 'ihn', c: 'akk', who: 'er', note: 'er wird im Akkusativ zu ihn.' },
  { t: 'Die Frau dankt ___.', a: 'ihm', c: 'dat', who: 'er', note: 'danken + Dativ: ihm.' },
  { t: 'Ich besuche ___.', a: 'sie', c: 'akk', who: 'sie_sg', note: 'sie bleibt im Akkusativ sie.' },
  { t: 'Das Buch gehört ___.', a: 'ihr', c: 'dat', who: 'sie_sg', note: 'gehören + Dativ: ihr.' },
  { t: 'Ich verstehe ___.', a: 'es', c: 'akk', who: 'es', note: 'es bleibt im Akkusativ es.' },
  { t: 'Wir folgen ___.', a: 'ihm', c: 'dat', who: 'es', note: 'folgen + Dativ: ihm.' },
  { t: 'Der Kurs motiviert ___.', a: 'uns', c: 'akk', who: 'wir', note: 'wir wird in Akkusativ und Dativ zu uns.' },
  { t: 'Die App hilft ___.', a: 'uns', c: 'dat', who: 'wir', note: 'helfen + Dativ: uns.' },
  { t: 'Ich höre ___.', a: 'euch', c: 'akk', who: 'ihr', note: 'ihr wird in Akkusativ und Dativ zu euch.' },
  { t: 'Ich zeige ___ die Regel.', a: 'euch', c: 'dat', who: 'ihr', note: 'zeigen: Person im Dativ, Sache im Akkusativ.' },
  { t: 'Wir treffen ___.', a: 'sie', c: 'akk', who: 'sie_pl', note: 'Plural sie bleibt im Akkusativ sie.' },
  { t: 'Der Lehrer erklärt ___ den Kasus.', a: 'ihnen', c: 'dat', who: 'sie_pl', note: 'Plural-Dativ: ihnen.' },
  { t: 'Ich begrüße ___.', a: 'Sie', c: 'akk', who: 'Sie', note: 'formelles Sie bleibt groß.' },
  { t: 'Ich danke ___.', a: 'Ihnen', c: 'dat', who: 'Sie', note: 'formeller Dativ: Ihnen.' },
  { t: '___ lerne Deutsch.', a: 'Ich', c: 'nom', who: 'ich', note: 'Subjekt: Nominativ.' },
  { t: '___ kommt heute.', a: 'Er', c: 'nom', who: 'er', note: 'Subjekt: Nominativ.' },
];

KK.POSSESSIVE_DRILLS = [
  { owner: 'ich', c: 'nom', g: 'm', noun: 'Vater', ar: 'أبي' },
  { owner: 'ich', c: 'akk', g: 'm', noun: 'Vater', ar: 'أبي' },
  { owner: 'ich', c: 'dat', g: 'f', noun: 'Mutter', ar: 'أمي' },
  { owner: 'du', c: 'nom', g: 'f', noun: 'Tasche', ar: 'حقيبتك' },
  { owner: 'du', c: 'akk', g: 'n', noun: 'Buch', ar: 'كتابك' },
  { owner: 'du', c: 'gen', g: 'm', noun: 'Bruders', ar: 'أخيك' },
  { owner: 'er', c: 'nom', g: 'n', noun: 'Kind', ar: 'طفله' },
  { owner: 'er', c: 'akk', g: 'pl', noun: 'Freunde', ar: 'أصدقاءه' },
  { owner: 'er', c: 'dat', g: 'm', noun: 'Lehrer', ar: 'معلمه' },
  { owner: 'sie_sg', c: 'nom', g: 'm', noun: 'Computer', ar: 'حاسوبها' },
  { owner: 'sie_sg', c: 'akk', g: 'f', noun: 'Jacke', ar: 'سترتها' },
  { owner: 'sie_sg', c: 'dat', g: 'pl', noun: 'Kindern', ar: 'أطفالها' },
  { owner: 'wir', c: 'nom', g: 'pl', noun: 'Bücher', ar: 'كتبنا' },
  { owner: 'wir', c: 'akk', g: 'm', noun: 'Plan', ar: 'خطتنا' },
  { owner: 'wir', c: 'dat', g: 'n', noun: 'Haus', ar: 'بيتنا' },
  { owner: 'ihr', c: 'nom', g: 'f', noun: 'Schule', ar: 'مدرستكم' },
  { owner: 'ihr', c: 'akk', g: 'm', noun: 'Freund', ar: 'صديقكم' },
  { owner: 'ihr', c: 'dat', g: 'f', noun: 'Lehrerin', ar: 'معلمتكم' },
  { owner: 'sie_pl', c: 'nom', g: 'm', noun: 'Kurs', ar: 'دورتهم' },
  { owner: 'sie_pl', c: 'akk', g: 'n', noun: 'Auto', ar: 'سيارتهم' },
  { owner: 'sie_pl', c: 'gen', g: 'pl', noun: 'Eltern', ar: 'والديهم' },
  { owner: 'Sie', c: 'nom', g: 'n', noun: 'Ticket', ar: 'تذكرتكم' },
  { owner: 'Sie', c: 'akk', g: 'f', noun: 'Frage', ar: 'سؤالكم' },
  { owner: 'Sie', c: 'dat', g: 'm', noun: 'Termin', ar: 'موعدكم' },
];

/* ---------- Prepositions ---------- */
KK.PREPS = {
  dat: ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber'],
  akk: ['durch', 'für', 'gegen', 'ohne', 'um', 'bis', 'entlang'],
  gen: ['wegen', 'trotz', 'während', 'statt'],
  wechsel: ['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen'],
};
KK.PREP_MNEMO = {
  dat: 'aus-bei-mit-nach-seit-von-zu — immer mit Dativ du!',
  akk: 'durch-für-gegen-ohne-um — Akkusativ, bumm!',
  gen: 'wegen, trotz, während, statt — wer Stil hat, nimmt Genitiv.',
  wechsel: 'wohin? → Akkusativ (Bewegung) · wo? → Dativ (Position)',
};

/* Wechselpräposition sentence drills: dir=true → wohin/Akk, false → wo/Dat */
KK.WECHSEL_DRILLS = [
  { t: 'Er hängt das Poster an ___ Wand.', prep: 'an', dir: true, a: 'die', alt: 'der', g: 'f' },
  { t: 'Das Poster hängt an ___ Wand.', prep: 'an', dir: false, a: 'der', alt: 'die', g: 'f' },
  { t: 'Sie stellt die Vase auf ___ Tisch.', prep: 'auf', dir: true, a: 'den', alt: 'dem', g: 'm' },
  { t: 'Die Vase steht auf ___ Tisch.', prep: 'auf', dir: false, a: 'dem', alt: 'den', g: 'm' },
  { t: 'Der Hund läuft hinter ___ Haus.', prep: 'hinter', dir: true, a: 'das', alt: 'dem', g: 'n' },
  { t: 'Der Hund schläft hinter ___ Haus.', prep: 'hinter', dir: false, a: 'dem', alt: 'das', g: 'n' },
  { t: 'Wir gehen in ___ Kino.', prep: 'in', dir: true, a: 'das', alt: 'dem', g: 'n' },
  { t: 'Wir sitzen in ___ Kino.', prep: 'in', dir: false, a: 'dem', alt: 'das', g: 'n' },
  { t: 'Ich lege das Buch neben ___ Lampe.', prep: 'neben', dir: true, a: 'die', alt: 'der', g: 'f' },
  { t: 'Das Buch liegt neben ___ Lampe.', prep: 'neben', dir: false, a: 'der', alt: 'die', g: 'f' },
  { t: 'Sie hängt die Uhr über ___ Sofa.', prep: 'über', dir: true, a: 'das', alt: 'dem', g: 'n' },
  { t: 'Die Uhr hängt über ___ Sofa.', prep: 'über', dir: false, a: 'dem', alt: 'das', g: 'n' },
  { t: 'Die Katze kriecht unter ___ Bett.', prep: 'unter', dir: true, a: 'das', alt: 'dem', g: 'n' },
  { t: 'Die Katze schläft unter ___ Bett.', prep: 'unter', dir: false, a: 'dem', alt: 'das', g: 'n' },
  { t: 'Er stellt die Schuhe vor ___ Tür.', prep: 'vor', dir: true, a: 'die', alt: 'der', g: 'f' },
  { t: 'Die Schuhe stehen vor ___ Tür.', prep: 'vor', dir: false, a: 'der', alt: 'die', g: 'f' },
  { t: 'Sie setzt sich zwischen ___ Kinder.', prep: 'zwischen', dir: true, a: 'die', alt: 'den', g: 'pl' },
  { t: 'Sie sitzt zwischen ___ Kindern.', prep: 'zwischen', dir: false, a: 'den', alt: 'die', g: 'pl' },
  { t: 'Er legt den Schlüssel auf ___ Teller.', prep: 'auf', dir: true, a: 'den', alt: 'dem', g: 'm' },
  { t: 'Der Schlüssel liegt auf ___ Teller.', prep: 'auf', dir: false, a: 'dem', alt: 'den', g: 'm' },
  { t: 'Sie stellt die Flasche in ___ Kühlschrank.', prep: 'in', dir: true, a: 'den', alt: 'dem', g: 'm' },
  { t: 'Die Flasche steht in ___ Kühlschrank.', prep: 'in', dir: false, a: 'dem', alt: 'den', g: 'm' },
  { t: 'Wir gehen an ___ Hafen.', prep: 'an', dir: true, a: 'den', alt: 'dem', g: 'm' },
  { t: 'Wir warten an ___ Hafen.', prep: 'an', dir: false, a: 'dem', alt: 'den', g: 'm' },
  { t: 'Das Kind läuft vor ___ Schule.', prep: 'vor', dir: true, a: 'die', alt: 'der', g: 'f' },
  { t: 'Das Kind wartet vor ___ Schule.', prep: 'vor', dir: false, a: 'der', alt: 'die', g: 'f' },
  { t: 'Ich hänge die Jacke über ___ Stuhl.', prep: 'über', dir: true, a: 'den', alt: 'dem', g: 'm' },
  { t: 'Die Jacke hängt über ___ Stuhl.', prep: 'über', dir: false, a: 'dem', alt: 'den', g: 'm' },
];

/* ---------- Vocab pool (~129 nouns): [word, gender, plural, arabic] ---------- */
KK.VOCAB = [
  ['Mann', 'm', 'Männer', 'رجل'], ['Frau', 'f', 'Frauen', 'امرأة'], ['Kind', 'n', 'Kinder', 'طفل'],
  ['Tisch', 'm', 'Tische', 'طاولة'], ['Stuhl', 'm', 'Stühle', 'كرسي'], ['Buch', 'n', 'Bücher', 'كتاب'],
  ['Auto', 'n', 'Autos', 'سيارة'], ['Haus', 'n', 'Häuser', 'بيت'], ['Tür', 'f', 'Türen', 'باب'],
  ['Fenster', 'n', 'Fenster', 'نافذة'], ['Schlüssel', 'm', 'Schlüssel', 'مفتاح'], ['Tasche', 'f', 'Taschen', 'حقيبة'],
  ['Hund', 'm', 'Hunde', 'كلب'], ['Katze', 'f', 'Katzen', 'قطة'], ['Apfel', 'm', 'Äpfel', 'تفاحة'],
  ['Brot', 'n', 'Brote', 'خبز'], ['Wasser', 'n', null, 'ماء'], ['Kaffee', 'm', null, 'قهوة'],
  ['Tee', 'm', null, 'شاي'], ['Milch', 'f', null, 'حليب'], ['Blume', 'f', 'Blumen', 'زهرة'],
  ['Baum', 'm', 'Bäume', 'شجرة'], ['Garten', 'm', 'Gärten', 'حديقة'], ['Stadt', 'f', 'Städte', 'مدينة'],
  ['Land', 'n', 'Länder', 'بلد'], ['Straße', 'f', 'Straßen', 'شارع'], ['Weg', 'm', 'Wege', 'طريق'],
  ['Zug', 'm', 'Züge', 'قطار'], ['Bus', 'm', 'Busse', 'حافلة'], ['Flugzeug', 'n', 'Flugzeuge', 'طائرة'],
  ['Bahnhof', 'm', 'Bahnhöfe', 'محطة قطار'], ['Hotel', 'n', 'Hotels', 'فندق'], ['Zimmer', 'n', 'Zimmer', 'غرفة'],
  ['Küche', 'f', 'Küchen', 'مطبخ'], ['Bett', 'n', 'Betten', 'سرير'], ['Lampe', 'f', 'Lampen', 'مصباح'],
  ['Bild', 'n', 'Bilder', 'صورة'], ['Wand', 'f', 'Wände', 'جدار'], ['Boden', 'm', 'Böden', 'أرضية'],
  ['Lehrer', 'm', 'Lehrer', 'معلم'], ['Lehrerin', 'f', 'Lehrerinnen', 'معلمة'], ['Schüler', 'm', 'Schüler', 'تلميذ'],
  ['Arzt', 'm', 'Ärzte', 'طبيب'], ['Freund', 'm', 'Freunde', 'صديق'], ['Freundin', 'f', 'Freundinnen', 'صديقة'],
  ['Familie', 'f', 'Familien', 'عائلة'], ['Mutter', 'f', 'Mütter', 'أم'], ['Vater', 'm', 'Väter', 'أب'],
  ['Bruder', 'm', 'Brüder', 'أخ'], ['Schwester', 'f', 'Schwestern', 'أخت'], ['Sohn', 'm', 'Söhne', 'ابن'],
  ['Tochter', 'f', 'Töchter', 'ابنة'], ['Brief', 'm', 'Briefe', 'رسالة'], ['Zeitung', 'f', 'Zeitungen', 'جريدة'],
  ['Handy', 'n', 'Handys', 'هاتف'], ['Computer', 'm', 'Computer', 'حاسوب'], ['Film', 'm', 'Filme', 'فيلم'],
  ['Musik', 'f', null, 'موسيقى'], ['Lied', 'n', 'Lieder', 'أغنية'], ['Arbeit', 'f', 'Arbeiten', 'عمل'],
  ['Beruf', 'm', 'Berufe', 'مهنة'], ['Geld', 'n', null, 'مال'], ['Geschenk', 'n', 'Geschenke', 'هدية'],
  ['Brille', 'f', 'Brillen', 'نظارة'], ['Uhr', 'f', 'Uhren', 'ساعة'], ['Jacke', 'f', 'Jacken', 'سترة'],
  ['Schuh', 'm', 'Schuhe', 'حذاء'], ['Hemd', 'n', 'Hemden', 'قميص'], ['Hose', 'f', 'Hosen', 'بنطال'],
  ['Kleid', 'n', 'Kleider', 'فستان'], ['Regen', 'm', null, 'مطر'], ['Sonne', 'f', null, 'شمس'],
  ['Mond', 'm', null, 'قمر'], ['Stern', 'm', 'Sterne', 'نجمة'], ['Meer', 'n', 'Meere', 'بحر'],
  ['Berg', 'm', 'Berge', 'جبل'], ['Wald', 'm', 'Wälder', 'غابة'], ['Fluss', 'm', 'Flüsse', 'نهر'],
  ['Wohnung', 'f', 'Wohnungen', 'شقة'], ['Schule', 'f', 'Schulen', 'مدرسة'],
  ['Universität', 'f', 'Universitäten', 'جامعة'], ['Fahrrad', 'n', 'Fahrräder', 'دراجة'],
  ['Frage', 'f', 'Fragen', 'سؤال'], ['Antwort', 'f', 'Antworten', 'جواب'],
  ['Park', 'm', 'Parks', 'منتزه'], ['Markt', 'm', 'Märkte', 'سوق'], ['Platz', 'm', 'Plätze', 'ساحة'],
  ['Laden', 'm', 'Läden', 'متجر'], ['Supermarkt', 'm', 'Supermärkte', 'سوبرماركت'], ['Flughafen', 'm', 'Flughäfen', 'مطار'],
  ['Hafen', 'm', 'Häfen', 'ميناء'], ['Flasche', 'f', 'Flaschen', 'زجاجة'], ['Glas', 'n', 'Gläser', 'كأس'],
  ['Messer', 'n', 'Messer', 'سكين'], ['Gabel', 'f', 'Gabeln', 'شوكة'], ['Löffel', 'm', 'Löffel', 'ملعقة'],
  ['Teller', 'm', 'Teller', 'طبق'], ['Suppe', 'f', 'Suppen', 'حساء'], ['Salat', 'm', 'Salate', 'سلطة'],
  ['Ei', 'n', 'Eier', 'بيضة'], ['Käse', 'm', null, 'جبن'], ['Reis', 'm', null, 'أرز'],
  ['Fleisch', 'n', null, 'لحم'], ['Fisch', 'm', 'Fische', 'سمك'], ['Büro', 'n', 'Büros', 'مكتب'],
  ['Firma', 'f', 'Firmen', 'شركة'], ['Termin', 'm', 'Termine', 'موعد'], ['Aufgabe', 'f', 'Aufgaben', 'واجب'],
  ['Prüfung', 'f', 'Prüfungen', 'اختبار'], ['Fehler', 'm', 'Fehler', 'خطأ'], ['Regel', 'f', 'Regeln', 'قاعدة'],
  ['Satz', 'm', 'Sätze', 'جملة'], ['Wort', 'n', 'Wörter', 'كلمة'], ['Sprache', 'f', 'Sprachen', 'لغة'],
  ['Kurs', 'm', 'Kurse', 'دورة'], ['Lektion', 'f', 'Lektionen', 'درس'], ['Plan', 'm', 'Pläne', 'خطة'],
  ['Problem', 'n', 'Probleme', 'مشكلة'], ['Lösung', 'f', 'Lösungen', 'حل'], ['Idee', 'f', 'Ideen', 'فكرة'],
  ['Nachricht', 'f', 'Nachrichten', 'رسالة'], ['E-Mail', 'f', 'E-Mails', 'بريد إلكتروني'], ['Foto', 'n', 'Fotos', 'صورة'],
  ['Reise', 'f', 'Reisen', 'رحلة'], ['Urlaub', 'm', 'Urlaube', 'إجازة'], ['Ticket', 'n', 'Tickets', 'تذكرة'],
  ['Koffer', 'm', 'Koffer', 'حقيبة سفر'], ['Pass', 'm', 'Pässe', 'جواز سفر'], ['Karte', 'f', 'Karten', 'بطاقة'],
];

/* ---------- Module 3: Lückentext (90 sentences, 120+ gaps) ----------
   gap: a=answer, k='art'|'adj', c=case, g=gender, w=adj world (for k='adj').
   For k='adj' the gap is only the ENDING (stem printed before the blank). */
KK.LUECKEN = [
  { t: 'Ich gebe ___ Frau ___ schön___ Blume.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }, { a: 'eine', k: 'art', c: 'akk', g: 'f' }, { a: 'e', k: 'adj', w: 'mixed', c: 'akk', g: 'f' }], note: 'geben + Dativ (Person) + Akkusativ (Sache)' },
  { t: 'Er hilft ___ alt___ Mann.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'm' }], note: 'helfen verlangt immer den Dativ' },
  { t: 'Wir sehen ___ klein___ Kind.', gaps: [{ a: 'ein', k: 'art', c: 'akk', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'akk', g: 'n' }], note: 'sehen + Akkusativ; „ein“ trägt kein Signal → Adjektiv übernimmt: -es' },
  { t: 'Die Jacke ___ neu___ Lehrers hängt dort.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'm' }], note: 'Genitiv-Attribut: wessen Jacke?' },
  { t: 'Ich fahre mit ___ Bus zur Arbeit.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'm' }], note: 'mit + Dativ — immer!' },
  { t: 'Sie kauft ___ neu___ Computer.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'kaufen + Akkusativ' },
  { t: 'Das ist das Auto ___ jung___ Frau.', gaps: [{ a: 'der', k: 'art', c: 'gen', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'f' }], note: 'Genitiv: wessen Auto?' },
  { t: 'Kalt___ Wasser schmeckt gut.', gaps: [{ a: 'es', k: 'adj', w: 'strong', c: 'nom', g: 'n' }], note: 'Kein Artikel → starkes Adjektiv trägt das Signal: -es (wie „das“)' },
  { t: 'Er trinkt gern schwarz___ Kaffee.', gaps: [{ a: 'en', k: 'adj', w: 'strong', c: 'akk', g: 'm' }], note: 'trinken + Akk.; ohne Artikel → stark: -en (wie „den“)' },
  { t: 'Nach ___ lang___ Tag bin ich müde.', gaps: [{ a: 'einem', k: 'art', c: 'dat', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'dat', g: 'm' }], note: 'nach + Dativ' },
  { t: 'Ohne ___ Schlüssel kommst du nicht ins Haus.', gaps: [{ a: 'den', k: 'art', c: 'akk', g: 'm' }], note: 'ohne + Akkusativ' },
  { t: 'Die Kinder spielen in ___ Garten.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'm' }], note: 'Wechselpräposition + wo? (Position) → Dativ' },
  { t: 'Wir gehen in ___ Park.', gaps: [{ a: 'den', k: 'art', c: 'akk', g: 'm' }], note: 'Wechselpräposition + wohin? (Bewegung) → Akkusativ' },
  { t: 'Das Bild hängt an ___ Wand.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }], note: 'wo? → Dativ' },
  { t: 'Ich hänge das Bild an ___ Wand.', gaps: [{ a: 'die', k: 'art', c: 'akk', g: 'f' }], note: 'wohin? → Akkusativ' },
  { t: 'Er dankt ___ nett___ Lehrerin.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'f' }], note: 'danken + Dativ' },
  { t: 'Trotz ___ schlecht___ Wetters gehen wir spazieren.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'n' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'n' }], note: 'trotz + Genitiv' },
  { t: 'Sie schenkt ___ Kindern ein Spiel.', gaps: [{ a: 'den', k: 'art', c: 'dat', g: 'pl' }], note: 'schenken + Dativ (Person); Dativ Plural: den + Nomen-n' },
  { t: 'Frisch___ Brot riecht wunderbar.', gaps: [{ a: 'es', k: 'adj', w: 'strong', c: 'nom', g: 'n' }], note: 'ohne Artikel → stark: -es' },
  { t: 'Ich suche ___ rot___ Tasche.', gaps: [{ a: 'eine', k: 'art', c: 'akk', g: 'f' }, { a: 'e', k: 'adj', w: 'mixed', c: 'akk', g: 'f' }], note: 'suchen + Akkusativ' },
  { t: 'Der Hund ___ alt___ Nachbarn bellt laut.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'm' }], note: 'Genitiv; „Nachbar“ ist n-Deklination (→ Nachbarn)' },
  { t: 'Wir wohnen seit ___ Jahr in Berlin.', gaps: [{ a: 'einem', k: 'art', c: 'dat', g: 'n' }], note: 'seit + Dativ' },
  { t: 'Er kommt aus ___ klein___ Stadt.', gaps: [{ a: 'einer', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'mixed', c: 'dat', g: 'f' }], note: 'aus + Dativ' },
  { t: 'Für ___ gut___ Freund tue ich alles.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'für + Akkusativ' },
  { t: 'Die Lehrerin erklärt ___ Schülern die Grammatik.', gaps: [{ a: 'den', k: 'art', c: 'dat', g: 'pl' }], note: 'erklären + Dativ (Person) + Akkusativ (Sache)' },
  { t: 'Ich esse ___ grün___ Apfel.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'essen + Akkusativ' },
  { t: 'Das Haus ___ reich___ Familie ist groß.', gaps: [{ a: 'der', k: 'art', c: 'gen', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'f' }], note: 'Genitiv: wessen Haus?' },
  { t: 'Mit ___ neu___ Brille sehe ich besser.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'f' }], note: 'mit + Dativ' },
  { t: 'Heiß___ Tee hilft gegen die Kälte.', gaps: [{ a: 'er', k: 'adj', w: 'strong', c: 'nom', g: 'm' }], note: 'ohne Artikel → stark: -er (wie „der“)' },
  { t: 'Sie liebt stark___ Kaffee mit warm___ Milch.', gaps: [{ a: 'en', k: 'adj', w: 'strong', c: 'akk', g: 'm' }, { a: 'er', k: 'adj', w: 'strong', c: 'dat', g: 'f' }], note: 'lieben + Akk.; mit + Dat. — beides ohne Artikel → stark' },
  { t: 'Der Zug fährt durch ___ lang___ Tunnel.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'durch + Akkusativ' },
  { t: 'Wir treffen uns bei ___ Bäckerei.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }], note: 'bei + Dativ' },
  { t: 'Das Geschenk ist für ___ klein___ Schwester.', gaps: [{ a: 'die', k: 'art', c: 'akk', g: 'f' }, { a: 'e', k: 'adj', w: 'weak', c: 'akk', g: 'f' }], note: 'für + Akkusativ' },
  { t: 'Er stellt die Lampe auf ___ Tisch.', gaps: [{ a: 'den', k: 'art', c: 'akk', g: 'm' }], note: 'wohin? → Akkusativ' },
  { t: 'Die Lampe steht auf ___ Tisch.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'm' }], note: 'wo? → Dativ' },
  { t: 'Ich warte auf ___ alt___ Freund.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'warten auf + Akkusativ (festes Verb+Präposition)' },
  { t: 'Während ___ Sommers reisen wir viel.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'm' }], note: 'während + Genitiv' },
  { t: 'Sie antwortet ___ Arzt nicht.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'm' }], note: 'antworten + Dativ' },
  { t: 'Die Bank liegt gegenüber ___ Kirche.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }], note: 'gegenüber + Dativ' },
  { t: 'Der Vater ___ klein___ Kindes arbeitet viel.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'n' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'n' }], note: 'Genitiv: wessen Vater?' },
  { t: 'Ich brauche ___ neu___ Handy.', gaps: [{ a: 'ein', k: 'art', c: 'akk', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'akk', g: 'n' }], note: 'brauchen + Akk.; „ein“ ohne Signal → Adjektiv: -es' },
  { t: 'Kalt___ Milch trinke ich nicht gern.', gaps: [{ a: 'e', k: 'adj', w: 'strong', c: 'akk', g: 'f' }], note: 'ohne Artikel → stark: -e (wie „die“)' },
  { t: 'Er läuft gegen ___ Baum.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }], note: 'gegen + Akkusativ' },
  { t: 'Die Katze schläft unter ___ Bett.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'n' }], note: 'wo? → Dativ' },
  { t: 'Die Katze kriecht unter ___ Bett.', gaps: [{ a: 'das', k: 'art', c: 'akk', g: 'n' }], note: 'wohin? → Akkusativ' },
  { t: 'Das ist der Beruf ___ jung___ Mannes.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'm' }], note: 'Genitiv-Attribut' },
  { t: 'Sie hilft ___ klein___ Kindern gern.', gaps: [{ a: 'den', k: 'art', c: 'dat', g: 'pl' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'pl' }], note: 'helfen + Dativ; Dativ Plural → doppeltes n' },
  { t: 'Ich schreibe ___ lang___ Brief.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'schreiben + Akkusativ' },
  { t: 'Alt___ Häuser haben oft hoh___ Decken.', gaps: [{ a: 'e', k: 'adj', w: 'strong', c: 'nom', g: 'pl' }, { a: 'e', k: 'adj', w: 'strong', c: 'akk', g: 'pl' }], note: 'ohne Artikel, Plural → stark: -e (hoch → hoh-)' },
  { t: 'Wegen ___ stark___ Regens bleiben wir zu Hause.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'm' }], note: 'wegen + Genitiv' },
  { t: 'Er wohnt noch bei ___ Eltern.', gaps: [{ a: 'seinen', k: 'art', c: 'dat', g: 'pl' }], note: 'bei + Dativ; Possessiv im Dativ Plural: -en' },
  { t: 'Das ist ___ interessant___ Buch.', gaps: [{ a: 'ein', k: 'art', c: 'nom', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'nom', g: 'n' }], note: '„ein“ trägt kein Signal → Adjektiv: -es' },
  { t: 'Die Blätter ___ alt___ Bäume fallen.', gaps: [{ a: 'der', k: 'art', c: 'gen', g: 'pl' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'pl' }], note: 'Genitiv Plural' },
  { t: 'Ich verstehe ___ schwierig___ Frage nicht.', gaps: [{ a: 'die', k: 'art', c: 'akk', g: 'f' }, { a: 'e', k: 'adj', w: 'weak', c: 'akk', g: 'f' }], note: 'verstehen + Akkusativ' },
  { t: 'Mit gut___ Freunden ist das Leben schöner.', gaps: [{ a: 'en', k: 'adj', w: 'strong', c: 'dat', g: 'pl' }], note: 'mit + Dat.; ohne Artikel → stark: -en (wie „den“)' },
  { t: 'Sie legt das Buch neben ___ Lampe.', gaps: [{ a: 'die', k: 'art', c: 'akk', g: 'f' }], note: 'wohin? → Akkusativ' },
  { t: 'Das Buch liegt neben ___ Lampe.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }], note: 'wo? → Dativ' },
  { t: 'Er kauft seiner Mutter ___ teur___ Geschenk.', gaps: [{ a: 'ein', k: 'art', c: 'akk', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'akk', g: 'n' }], note: 'kaufen + Dat. + Akk.; teuer → teur- vor Endung' },
  { t: 'Die Farbe ___ neu___ Autos gefällt mir.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'n' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'n' }], note: 'Genitiv: wessen Farbe?' },
  { t: 'Ich danke ___ freundlich___ Lehrern.', gaps: [{ a: 'den', k: 'art', c: 'dat', g: 'pl' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'pl' }], note: 'danken + Dativ' },
  { t: 'Ohne warm___ Jacke gehst du nicht raus!', gaps: [{ a: 'e', k: 'adj', w: 'strong', c: 'akk', g: 'f' }], note: 'ohne + Akk.; kein Artikel → stark: -e' },
  { t: 'Zwischen ___ Häusern gibt es ___ klein___ Garten.', gaps: [{ a: 'den', k: 'art', c: 'dat', g: 'pl' }, { a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'zwischen (wo?) + Dat.; es gibt + Akk.' },
  { t: '___ alt___ Termin fällt aus.', gaps: [{ a: 'der', k: 'art', c: 'nom', g: 'm' }, { a: 'e', k: 'adj', w: 'weak', c: 'nom', g: 'm' }], note: 'Termin ist das Subjekt → Nominativ' },
  { t: 'Ich verschiebe ___ wichtig___ Termin.', gaps: [{ a: 'den', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'akk', g: 'm' }], note: 'verschieben + Akkusativ' },
  { t: 'Wir sprechen mit ___ neu___ Firma.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'f' }], note: 'mit + Dativ' },
  { t: 'Das Büro ___ klein___ Firma ist hell.', gaps: [{ a: 'der', k: 'art', c: 'gen', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'f' }], note: 'Genitiv: wessen Büro?' },
  { t: '___ groß___ Problem bleibt offen.', gaps: [{ a: 'das', k: 'art', c: 'nom', g: 'n' }, { a: 'e', k: 'adj', w: 'weak', c: 'nom', g: 'n' }], note: 'Problem ist das Subjekt → Nominativ' },
  { t: 'Wir lösen ___ schwierig___ Problem.', gaps: [{ a: 'ein', k: 'art', c: 'akk', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'akk', g: 'n' }], note: 'lösen + Akk.; ein ohne Signal → Adjektiv -es' },
  { t: 'Trotz ___ lang___ Prüfung bleibt sie ruhig.', gaps: [{ a: 'der', k: 'art', c: 'gen', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'f' }], note: 'trotz + Genitiv' },
  { t: 'Nach ___ kurz___ Pause beginnt der Kurs.', gaps: [{ a: 'einer', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'mixed', c: 'dat', g: 'f' }], note: 'nach + Dativ' },
  { t: 'Frisch___ Fisch liegt auf dem Teller.', gaps: [{ a: 'er', k: 'adj', w: 'strong', c: 'nom', g: 'm' }], note: 'ohne Artikel → stark: -er' },
  { t: 'Ich esse ___ frisch___ Fisch.', gaps: [{ a: 'den', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'akk', g: 'm' }], note: 'essen + Akkusativ' },
  { t: 'Mit ___ klein___ Messer schneide ich Brot.', gaps: [{ a: 'einem', k: 'art', c: 'dat', g: 'n' }, { a: 'en', k: 'adj', w: 'mixed', c: 'dat', g: 'n' }], note: 'mit + Dativ; nach ein/einem → gemischt' },
  { t: 'Ohne ___ scharf___ Messer geht es nicht.', gaps: [{ a: 'ein', k: 'art', c: 'akk', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'akk', g: 'n' }], note: 'ohne + Akk.; ein ohne Signal → Adjektiv -es' },
  { t: 'Neu___ Wörter sind schwer.', gaps: [{ a: 'e', k: 'adj', w: 'strong', c: 'nom', g: 'pl' }], note: 'Plural ohne Artikel → stark: -e' },
  { t: 'Ich lerne neu___ Wörter.', gaps: [{ a: 'e', k: 'adj', w: 'strong', c: 'akk', g: 'pl' }], note: 'Akkusativ Plural ohne Artikel → stark: -e' },
  { t: 'Die Bedeutung ___ deutsch___ Wortes ist klar.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'n' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'n' }], note: 'Genitiv Neutrum: des ... Wortes' },
  { t: 'Wir folgen ___ einfach___ Regel.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'f' }], note: 'folgen + Dativ' },
  { t: '___ einfach___ Regel hilft oft.', gaps: [{ a: 'eine', k: 'art', c: 'nom', g: 'f' }, { a: 'e', k: 'adj', w: 'mixed', c: 'nom', g: 'f' }], note: 'Regel ist das Subjekt → Nominativ' },
  { t: 'Sie schreibt ___ lang___ E-Mail.', gaps: [{ a: 'eine', k: 'art', c: 'akk', g: 'f' }, { a: 'e', k: 'adj', w: 'mixed', c: 'akk', g: 'f' }], note: 'schreiben + Akkusativ' },
  { t: 'Ich antworte ___ freundlich___ Nachricht.', gaps: [{ a: 'der', k: 'art', c: 'dat', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'f' }], note: 'antworten + Dativ' },
  { t: 'Während ___ kurz___ Reise lernt er viel.', gaps: [{ a: 'der', k: 'art', c: 'gen', g: 'f' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'f' }], note: 'während + Genitiv' },
  { t: 'Für ___ lang___ Urlaub braucht man Geld.', gaps: [{ a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'für + Akkusativ' },
  { t: 'Mit ___ schwer___ Koffer läuft er langsam.', gaps: [{ a: 'einem', k: 'art', c: 'dat', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'dat', g: 'm' }], note: 'mit + Dativ' },
  { t: '___ rot___ Karte liegt hier.', gaps: [{ a: 'die', k: 'art', c: 'nom', g: 'f' }, { a: 'e', k: 'adj', w: 'weak', c: 'nom', g: 'f' }], note: 'Karte ist das Subjekt → Nominativ' },
  { t: 'Er zeigt ___ rot___ Karte.', gaps: [{ a: 'die', k: 'art', c: 'akk', g: 'f' }, { a: 'e', k: 'adj', w: 'weak', c: 'akk', g: 'f' }], note: 'zeigen + Akkusativ' },
  { t: 'Wegen ___ verloren___ Passes bleibt er zu Hause.', gaps: [{ a: 'des', k: 'art', c: 'gen', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'gen', g: 'm' }], note: 'wegen + Genitiv' },
  { t: 'Ich suche ___ günstig___ Ticket.', gaps: [{ a: 'ein', k: 'art', c: 'akk', g: 'n' }, { a: 'es', k: 'adj', w: 'mixed', c: 'akk', g: 'n' }], note: 'suchen + Akk.; ein ohne Signal → Adjektiv -es' },
  { t: 'Im Kurs erklärt ___ gut___ Lehrer ___ schwierig___ Satz.', gaps: [{ a: 'der', k: 'art', c: 'nom', g: 'm' }, { a: 'e', k: 'adj', w: 'weak', c: 'nom', g: 'm' }, { a: 'einen', k: 'art', c: 'akk', g: 'm' }, { a: 'en', k: 'adj', w: 'mixed', c: 'akk', g: 'm' }], note: 'Subjekt im Nom.; erklären + Akkusativ (Sache)' },
  { t: 'Aus ___ klein___ Laden kommt Musik.', gaps: [{ a: 'dem', k: 'art', c: 'dat', g: 'm' }, { a: 'en', k: 'adj', w: 'weak', c: 'dat', g: 'm' }], note: 'aus + Dativ' },
];

/* ---------- Kasus-Detektiv (40 items) ----------
   why: subj | dobj | verb-dat | praep-dat | praep-akk | praep-gen | wechsel-wo | wechsel-wohin | gen-attr */
KK.REASONS = {
  subj: { de: 'Subjekt des Satzes (wer? was?)', ar: 'فاعل الجملة' },
  dobj: { de: 'Direktes Objekt (wen? was?)', ar: 'مفعول به مباشر' },
  'verb-dat': { de: 'Dativ-Verb / Dativ-Objekt (wem?)', ar: 'فعل يتطلب داتيف' },
  'praep-dat': { de: 'Präposition mit festem Dativ', ar: 'حرف جر يلزمه داتيف دائمًا' },
  'praep-akk': { de: 'Präposition mit festem Akkusativ', ar: 'حرف جر يلزمه أكوزاتيف دائمًا' },
  'praep-gen': { de: 'Präposition mit Genitiv', ar: 'حرف جر يلزمه غينيتيف' },
  'wechsel-wo': { de: 'Wechselpräposition: Position (wo?)', ar: 'حرف جر متغيّر: مكان ثابت (أين؟)' },
  'wechsel-wohin': { de: 'Wechselpräposition: Richtung (wohin?)', ar: 'حرف جر متغيّر: اتجاه وحركة (إلى أين؟)' },
  'gen-attr': { de: 'Besitz / Genitiv-Attribut (wessen?)', ar: 'إضافة وملكية (لمن؟)' },
};
KK.DETEKTIV = [
  { t: 'Der Hund beißt {den Briefträger}.', c: 'akk', why: 'dobj', trigger: 'beißen', expl: '„beißen“ nimmt ein direktes Objekt: wen beißt der Hund?' },
  { t: 'Ich helfe {meiner Schwester}.', c: 'dat', why: 'verb-dat', trigger: 'helfen', expl: '„helfen“ verlangt IMMER den Dativ — wem helfe ich?' },
  { t: 'Wir fahren mit {dem Zug}.', c: 'dat', why: 'praep-dat', trigger: 'mit', expl: '„mit“ steht immer mit Dativ.' },
  { t: 'Sie kauft das Brot für {ihren Vater}.', c: 'akk', why: 'praep-akk', trigger: 'für', expl: '„für“ steht immer mit Akkusativ.' },
  { t: 'Die Schuhe stehen vor {der Tür}.', c: 'dat', why: 'wechsel-wo', trigger: 'vor + stehen (wo?)', expl: 'Position, keine Bewegung → wo? → Dativ.' },
  { t: 'Er stellt die Schuhe vor {die Tür}.', c: 'akk', why: 'wechsel-wohin', trigger: 'vor + stellen (wohin?)', expl: 'Bewegung zu einem Ziel → wohin? → Akkusativ.' },
  { t: 'Das Fahrrad {meines Bruders} ist kaputt.', c: 'gen', why: 'gen-attr', trigger: 'wessen Fahrrad?', expl: 'Besitz: das Fahrrad gehört dem Bruder → Genitiv.' },
  { t: '{Der Lehrer} erklärt die Aufgabe.', c: 'nom', why: 'subj', trigger: 'wer erklärt?', expl: 'Der Lehrer ist das Subjekt — er tut etwas.' },
  { t: 'Das Essen schmeckt {dem Gast}.', c: 'dat', why: 'verb-dat', trigger: 'schmecken', expl: '„schmecken“ + Dativ: wem schmeckt es?' },
  { t: 'Wir gehen ohne {unsere Kinder} ins Kino.', c: 'akk', why: 'praep-akk', trigger: 'ohne', expl: '„ohne“ steht immer mit Akkusativ.' },
  { t: 'Die Katze springt auf {den Tisch}.', c: 'akk', why: 'wechsel-wohin', trigger: 'auf + springen (wohin?)', expl: 'Bewegung aufs Ziel → Akkusativ.' },
  { t: 'Die Katze sitzt auf {dem Tisch}.', c: 'dat', why: 'wechsel-wo', trigger: 'auf + sitzen (wo?)', expl: 'Position → Dativ.' },
  { t: 'Trotz {des Regens} spielen sie Fußball.', c: 'gen', why: 'praep-gen', trigger: 'trotz', expl: '„trotz“ verlangt den Genitiv.' },
  { t: 'Er dankt {den Helfern}.', c: 'dat', why: 'verb-dat', trigger: 'danken', expl: '„danken“ + Dativ; Plural-Dativ → Nomen-n (Helfern).' },
  { t: 'Ich besuche {meine Großmutter} am Sonntag.', c: 'akk', why: 'dobj', trigger: 'besuchen', expl: '„besuchen“ + Akkusativ: wen besuche ich?' },
  { t: 'Die Blumen gefallen {meiner Mutter}.', c: 'dat', why: 'verb-dat', trigger: 'gefallen', expl: '„gefallen“ + Dativ: wem gefallen die Blumen? Achtung: die Blumen sind das Subjekt!' },
  { t: 'Das Auto fährt durch {den Tunnel}.', c: 'akk', why: 'praep-akk', trigger: 'durch', expl: '„durch“ steht immer mit Akkusativ.' },
  { t: 'Seit {einem Monat} lerne ich Deutsch.', c: 'dat', why: 'praep-dat', trigger: 'seit', expl: '„seit“ steht immer mit Dativ.' },
  { t: 'Die Tür {des Hauses} ist blau.', c: 'gen', why: 'gen-attr', trigger: 'wessen Tür?', expl: 'Besitz/Zugehörigkeit → Genitiv.' },
  { t: '{Mein Bruder} kocht heute.', c: 'nom', why: 'subj', trigger: 'wer kocht?', expl: 'Subjekt im Nominativ.' },
  { t: 'Sie hängt die Uhr über {das Sofa}.', c: 'akk', why: 'wechsel-wohin', trigger: 'über + hängen (wohin?)', expl: 'Die Uhr bewegt sich an einen neuen Ort → Akkusativ.' },
  { t: 'Die Uhr hängt über {dem Sofa}.', c: 'dat', why: 'wechsel-wo', trigger: 'über + hängen (wo?)', expl: 'Die Uhr ist schon dort, keine Bewegung → Dativ.' },
  { t: 'Während {der Pause} trinken wir Kaffee.', c: 'gen', why: 'praep-gen', trigger: 'während', expl: '„während“ verlangt den Genitiv.' },
  { t: 'Der Kellner bringt {dem Mann} die Rechnung.', c: 'dat', why: 'verb-dat', trigger: 'bringen (wem?)', expl: 'bringen + Dativ (Person) + Akkusativ (Sache).' },
  { t: '{Die Prüfung} beginnt um acht.', c: 'nom', why: 'subj', trigger: 'wer/was beginnt?', expl: 'Die Prüfung ist das Subjekt und steht im Nominativ.' },
  { t: 'Ich bestehe {die Prüfung}.', c: 'akk', why: 'dobj', trigger: 'bestehen + direktes Objekt', expl: 'Was bestehe ich? Die Prüfung → Akkusativ.' },
  { t: 'Der Lehrer hilft {dem Schüler} mit der Aufgabe.', c: 'dat', why: 'verb-dat', trigger: 'helfen', expl: '„helfen“ verlangt den Dativ: wem hilft der Lehrer?' },
  { t: 'Das Geschenk ist für {die Lehrerin}.', c: 'akk', why: 'praep-akk', trigger: 'für', expl: '„für“ steht immer mit Akkusativ.' },
  { t: 'Ich komme aus {dem Büro}.', c: 'dat', why: 'praep-dat', trigger: 'aus', expl: '„aus“ steht immer mit Dativ.' },
  { t: 'Wegen {des Fehlers} wiederholen wir die Übung.', c: 'gen', why: 'praep-gen', trigger: 'wegen', expl: '„wegen“ verlangt im Standarddeutsch den Genitiv.' },
  { t: 'Sie legt den Pass in {den Koffer}.', c: 'akk', why: 'wechsel-wohin', trigger: 'in + legen (wohin?)', expl: 'Bewegung in ein Ziel → Akkusativ.' },
  { t: 'Der Pass liegt in {dem Koffer}.', c: 'dat', why: 'wechsel-wo', trigger: 'in + liegen (wo?)', expl: 'Position ohne Richtungswechsel → Dativ.' },
  { t: '{Die E-Mail} kommt zu spät.', c: 'nom', why: 'subj', trigger: 'wer/was kommt?', expl: 'Die E-Mail ist das Subjekt → Nominativ.' },
  { t: 'Er beantwortet {die Nachricht}.', c: 'akk', why: 'dobj', trigger: 'beantworten', expl: '„beantworten“ nimmt ein direktes Objekt: was beantwortet er?' },
  { t: 'Wir danken {der Firma}.', c: 'dat', why: 'verb-dat', trigger: 'danken', expl: '„danken“ verlangt den Dativ.' },
  { t: 'Trotz {des Problems} arbeiten wir weiter.', c: 'gen', why: 'praep-gen', trigger: 'trotz', expl: '„trotz“ verlangt den Genitiv.' },
  { t: 'Sie stellt die Flasche auf {den Tisch}.', c: 'akk', why: 'wechsel-wohin', trigger: 'auf + stellen (wohin?)', expl: 'Die Flasche bewegt sich auf ein Ziel → Akkusativ.' },
  { t: 'Die Flasche steht auf {dem Tisch}.', c: 'dat', why: 'wechsel-wo', trigger: 'auf + stehen (wo?)', expl: 'Die Flasche ist schon dort → Dativ.' },
  { t: 'Der Schüler folgt {der Regel}.', c: 'dat', why: 'verb-dat', trigger: 'folgen', expl: '„folgen“ verlangt den Dativ.' },
  { t: 'Die Farbe {des Tickets} ist rot.', c: 'gen', why: 'gen-attr', trigger: 'wessen Farbe?', expl: 'Besitz/Zugehörigkeit: die Farbe des Tickets → Genitiv.' },
];

/* ---------- Mnemonics ---------- */
KK.MNEMOS = [
  { de: 'Dativ-Zeile merken: de<b>m</b> — de<b>r</b> — de<b>m</b> — de<b>n</b> → <b>m·r·m·n</b>. Und Genitiv: <b>s·r·s·r</b>.', ar: 'صفّ الداتيف: dem–der–dem–den → احفظ الإيقاع m·r·m·n، وصفّ الغينيتيف: s·r·s·r.' },
  { de: 'Witz am Rande: <i>„Genitiv ins Wasser, weil’s dem Dativ passt!“</i> — Umgangssprachlich frisst der Dativ den Genitiv („Der Dativ ist dem Genitiv sein Tod“). Im Test bitte trotzdem Genitiv. 😉', ar: 'مزحة ألمانية على الهامش: «ارمِ الغينيتيف في الماء، لأن هذا يناسب الداتيف!» — في الكلام اليومي يبتلع الداتيف الغينيتيف، لكن في الامتحان استخدم الغينيتيف!' },
  { de: 'Das Signal erscheint genau EINMAL: trägt es der Artikel, ruht das Adjektiv (-e/-en). Trägt es niemand, springt es aufs Adjektiv.', ar: 'علامة الحالة تظهر مرة واحدة فقط: إذا حملها أداة التعريف، تستريح الصفة (-e/-en). وإذا لم يحملها أحد، تقفز إلى الصفة.' },
  { de: 'Dativ Plural = Doppel-n: de<b>n</b> Kinder<b>n</b>, de<b>n</b> Lehrer<b>n</b>.', ar: 'داتيف الجمع = حرفا n: den Kindern — النون على الأداة وعلى الاسم.' },
];

/* All tips take an optional lang ('ar' default, 'de' for German UI mode). */
KK.memoryTips = {
  caseTipp(c, lang) {
    const ar = {
      nom: 'Nominativ: من يفعل؟ الأزرق = الفاعل.',
      akk: 'Akkusativ: من/ماذا وقع عليه الفعل؟ الأصفر = المفعول المباشر.',
      dat: 'Dativ: لمن؟ مع من؟ إلى من؟ الأخضر = المستفيد أو المتلقي.',
      gen: 'Genitiv: ملك من؟ البنفسجي = الملكية أو الإضافة.',
    };
    const de = {
      nom: 'Nominativ: Wer handelt? Blau = das Subjekt.',
      akk: 'Akkusativ: Wen/was trifft die Handlung? Bernstein = das direkte Objekt.',
      dat: 'Dativ: Wem? Grün = Empfänger oder Nutznießer.',
      gen: 'Genitiv: Wessen? Lila = Besitz und Zugehörigkeit.',
    };
    return (lang === 'de' ? de : ar)[c] || '';
  },
  caseMerksatz(c, lang) {
    const ar = {
      nom: 'الأزرق يعني: هذا الاسم هو الفاعل أو مركز الجملة.',
      akk: 'Akkusativ غالباً يغيّر المذكر فقط: der → den, ein → einen, mein → meinen.',
      dat: 'Dativ إيقاعه: dem · der · dem · den = m r m n.',
      gen: 'Genitiv إيقاعه: des · der · des · der = s r s r.',
    };
    const de = {
      nom: 'Blau heißt: Dieses Nomen ist das Subjekt des Satzes.',
      akk: 'Akkusativ ändert meist nur Maskulin: der → den, ein → einen, mein → meinen.',
      dat: 'Dativ-Rhythmus: dem · der · dem · den = m r m n.',
      gen: 'Genitiv-Rhythmus: des · der · des · der = s r s r.',
    };
    return (lang === 'de' ? de : ar)[c] || '';
  },
  visual(c, lang) {
    const ar = {
      nom: 'الأزرق = الفاعل / Nominativ.',
      akk: 'الأصفر = المفعول / Akkusativ.',
      dat: 'الأخضر = المستفيد / Dativ.',
      gen: 'البنفسجي = الملكية / Genitiv.',
    };
    const de = {
      nom: 'Blau = Subjekt / Nominativ.',
      akk: 'Bernstein = Objekt / Akkusativ.',
      dat: 'Grün = Empfänger / Dativ.',
      gen: 'Lila = Besitz / Genitiv.',
    };
    return (lang === 'de' ? de : ar)[c] || '';
  },
  detektivTipp(lang) {
    return lang === 'de'
      ? 'Frag dich: Wer handelt? Wen trifft es? Wem? Wessen?'
      : 'اسأل: من يفعل؟ من وقع عليه الفعل؟ لمن؟ ملك من؟';
  },
  adjMerksatz(lang) {
    return lang === 'de'
      ? 'Das Kasus-Signal erscheint genau einmal: Trägt es der Artikel, ruht das Adjektiv — trägt es niemand, übernimmt das Adjektiv.'
      : 'علامة الحالة تظهر مرة واحدة فقط: إذا حملها المقال ترتاح الصفة، وإذا لم يحملها أحد تحملها الصفة.';
  },
  possessiveMerksatz(lang) {
    return lang === 'de'
      ? 'Der Possessivartikel richtet sich nach dem Besessenen, nicht nach dem Besitzer: mein Vater (maskulin), meine Mutter (feminin).'
      : 'البوزيسيف يتبع الشيء المملوك لا صاحبه: mein Vater لأن Vater مذكر، وmeine Mutter لأن Mutter مؤنث.';
  },
  pronounMerksatz(id, lang) {
    const ar = {
      ich: 'ich → mich → mir',
      du: 'du → dich → dir',
      er: 'er/es: Akkusativ = ihn، Dativ = ihm',
      es: 'er/es: Akkusativ = ihn/es، Dativ = ihm',
      sie_sg: 'sie: Akkusativ = sie، Dativ = ihr',
      wir: 'wir تختصر: uns / uns',
      ihr: 'ihr تختصر: euch / euch',
      sie_pl: 'sie Plural: sie / ihnen',
      Sie: 'Sie الرسمي: Sie / Ihnen، وانتبه للحرف الكبير.',
    };
    const de = {
      ich: 'ich → mich → mir',
      du: 'du → dich → dir',
      er: 'er/es: Akkusativ = ihn, Dativ = ihm',
      es: 'er/es: Akkusativ = ihn/es, Dativ = ihm',
      sie_sg: 'sie: Akkusativ = sie, Dativ = ihr',
      wir: 'wir: Akkusativ = Dativ = uns',
      ihr: 'ihr: Akkusativ = Dativ = euch',
      sie_pl: 'sie (Plural): sie / ihnen',
      Sie: 'Formelles Sie: Sie / Ihnen — immer groß.',
    };
    return (lang === 'de' ? de : ar)[id] || '';
  },
  gapMerksatz(gap, lang) {
    if (!gap) return '';
    if (gap.k === 'adj') return this.adjMerksatz(lang);
    return this.caseMerksatz(gap.c, lang);
  },
  prepMerksatz(item, lang) {
    if (!item) return '';
    if (item.type === 'map') {
      if (lang === 'de') {
        if (item.cls === 'dat') return `„${item.prep}“ gesehen? Dann sofort Dativ.`;
        if (item.cls === 'akk') return `„${item.prep}“ gesehen? Dann sofort Akkusativ.`;
        if (item.cls === 'gen') return `„${item.prep}“ gesehen? Standardsprachlich Genitiv.`;
        return 'Wechselpräposition: wo? = Dativ, wohin? = Akkusativ.';
      }
      if (item.cls === 'dat') return `رأيتَ ${item.prep}؟ إذن Dativ مباشرة.`;
      if (item.cls === 'akk') return `رأيتَ ${item.prep}؟ إذن Akkusativ مباشرة.`;
      if (item.cls === 'gen') return `رأيتَ ${item.prep}؟ إذن Genitiv في الألمانية القياسية.`;
      return 'Wechselpräposition: wo? = Dativ، wohin? = Akkusativ.';
    }
    if (lang === 'de') return item.dir ? 'Bewegung zu einem Ziel: wohin? = Akkusativ.' : 'Feste Position: wo? = Dativ.';
    return item.dir ? 'هناك حركة إلى هدف: wohin? = Akkusativ.' : 'المكان ثابت: wo? = Dativ.';
  },
};

/* ---------- Explanations DE/AR per module ---------- */
KK.EXPLAIN = {
  atlas: {
    de: `<p>Deutsch markiert die Rolle eines Nomens im Satz nicht durch Position, sondern durch <b>Endungen am Artikel</b>. Vier Rollen, vier Kasus: <span class="k-nom">Nominativ</span> (wer handelt?), <span class="k-akk">Akkusativ</span> (wen trifft die Handlung?), <span class="k-dat">Dativ</span> (wem geschieht etwas?), <span class="k-gen">Genitiv</span> (wessen?).</p>
<p>Der Trick: Es gibt nur eine Handvoll <b>Signal-Buchstaben</b> — r, e, s, n, m. Schalte oben „Signal-Endungen“ ein und du siehst: Alle vier Tabellen sind dieselbe Tabelle mit anderem Anfang.</p>`,
    ar: `<p>اللغة الألمانية لا تحدد وظيفة الاسم في الجملة بموقعه، بل <b>بنهاية أداة التعريف</b>. هذا يشبه الإعراب في العربية تمامًا: عندنا الفاعل مرفوع والمفعول منصوب — وعندهم الحالات الأربع: <span class="k-nom">Nominativ</span> للفاعل (مَن يقوم بالفعل؟)، <span class="k-akk">Akkusativ</span> للمفعول به (على مَن يقع الفعل؟)، <span class="k-dat">Dativ</span> للمفعول له أو المستفيد (لِمَن؟)، و<span class="k-gen">Genitiv</span> للإضافة والملكية (لمن هذا الشيء؟).</p>
<p>السرّ الذي يسهّل كل شيء: لا توجد إلا حروف قليلة تحمل معنى الحالة — r و e و s و n و m. فعّل خيار «Signal-Endungen» في الأعلى وستلاحظ أن الجداول الأربعة هي في الحقيقة جدول واحد يتكرر ببدايات مختلفة. احفظ جدولًا واحدًا، تحفظها كلها.</p>`,
  },
  adjektiv: {
    de: `<p>Adjektive richten sich nach einer einzigen Regel: <b>Das Kasus-Signal muss genau einmal erscheinen.</b></p>
<p>Trägt der Artikel das Signal (de<b>r</b>, de<b>m</b>, de<b>s</b>…), darf sich das Adjektiv ausruhen → <b>schwach</b>: nur -e oder -en. Trägt niemand das Signal (kein Artikel), muss das Adjektiv einspringen → <b>stark</b>: es übernimmt die der-Endungen. Bei ein/kein/mein gilt: meistens trägt der Artikel das Signal — außer in den drei Formen ohne Endung (ein&nbsp;Mann, ein&nbsp;Kind) → dort hilft das Adjektiv aus → <b>gemischt</b>.</p>
<p>Und das „-en-Meer“: 11 von 16 schwachen Zellen sind einfach <b>-en</b>. Wenn du zweifelst und ein Artikel da ist: -en ist statistisch fast immer richtig.</p>`,
    ar: `<p>تصريف الصفات يقوم على قاعدة واحدة فقط: <b>علامة الحالة يجب أن تظهر مرة واحدة بالضبط — لا أكثر ولا أقل.</b></p>
<p>إذا كانت أداة التعريف تحمل العلامة (مثل de<b>r</b> و de<b>m</b> و de<b>s</b>)، فالصفة «ترتاح» وتأخذ نهاية خفيفة فقط: ‑e أو ‑en — وهذا هو التصريف <b>الضعيف</b>. أما إذا لم تكن هناك أداة أصلًا، فلا أحد يحمل العلامة، فتضطر الصفة أن تحملها بنفسها وتأخذ نهايات der — وهذا التصريف <b>القوي</b>. ومع ein و kein و mein الوضع <b>مختلط</b>: الأداة تحمل العلامة غالبًا، إلا في ثلاث حالات تكون فيها الأداة بلا نهاية (ein Mann، ein Kind) — هناك تتدخل الصفة وتحمل العلامة.</p>
<p>وخذ هذه الهدية: «بحر الـ ‑en» — في الجدول الضعيف 11 خانة من 16 نهايتها ‑en. إذا شككت ووُجدت أداة معرّفة، فاختر ‑en وستصيب في أغلب الأحيان.</p>`,
  },
  pronomen: {
    de: `<p><b>Personalpronomen</b> ersetzen Nomen: ich, mich, mir. Die Form haengt davon ab, ob das Pronomen Subjekt, direktes Objekt oder Dativ-Ergaenzung ist.</p>
<p><b>Possessivartikel</b> verhalten sich wie kein-Woerter: mein Vater, meine Mutter, meinem Kind, meinen Freunden. Wichtig ist immer: Besitzer waehlen, dann Kasus und Genus des besessenen Nomens bestimmen.</p>`,
    ar: `<p><b>الضمائر الشخصية</b> تحل مكان الاسم: ich / mich / mir. شكل الضمير يتغير حسب وظيفته في الجملة: فاعل، مفعول مباشر، أو داتيف.</p>
<p><b>البوزيسيف</b> يعمل مثل kein: تختار صاحب الشيء أولاً، ثم تصرف الكلمة حسب حالة وجنس الشيء المملوك: mein Vater, meine Mutter, meinem Kind.</p>`,
  },
  drill: {
    de: `<p>Vier Modi, ein Ziel: Automatisieren. Nutze die <b>Zahlentasten 1–9</b> zum Antworten und <b>Enter</b> für weiter — keine Maus nötig. Der Trainer merkt sich jede Zelle und fragt deine Schwächen häufiger ab.</p>`,
    ar: `<p>أربعة أنماط تدريب وهدف واحد: أن تصبح الإجابة تلقائية بلا تفكير. استخدم <b>مفاتيح الأرقام 1–9</b> للإجابة و<b>Enter</b> للمتابعة — لا حاجة للفأرة. المدرّب يتذكر كل خانة في الجدول ويعيد سؤالك عن نقاط ضعفك أكثر من غيرها.</p>`,
  },
  stats: {
    de: `<p>Jede Zelle zeigt deine Fehlerquote: Je röter, desto öfter daneben. Der Drill-Modus zieht Fragen bevorzugt aus deinen schwächsten Zellen (Leitner-Prinzip). Exportiere deinen Fortschritt als JSON, bevor du den Browser wechselst.</p>`,
    ar: `<p>كل خانة تعرض نسبة أخطائك: كلما زاد الاحمرار، زادت أخطاؤك فيها. وضع التدريب يسحب الأسئلة من أضعف خاناتك أولًا (مبدأ لايتنر للتكرار المتباعد). صدّر تقدمك كملف JSON قبل تغيير المتصفح حتى لا تخسره.</p>`,
  },
};

/* ---------- Genus-Badges + Aussprache (shared UI helpers) ---------- */
KK.GENDER_META = {
  m:  { de: 'Maskulinum', ar: 'مذكّر', short: 'm' },
  f:  { de: 'Femininum',  ar: 'مؤنث',  short: 'f' },
  n:  { de: 'Neutrum',    ar: 'محايد', short: 'n' },
  pl: { de: 'Plural',     ar: 'جمع',   short: 'pl' },
};

/* Small color-coded pill: der → Maskulinum (m). mini=true → just "m", for inline use. */
KK.genderBadge = function (g, mini) {
  const meta = KK.GENDER_META[g];
  if (!meta) return '';
  const lbl = mini ? meta.short : `${meta.de} (${meta.short})`;
  return `<span class="g-badge g-${g}${mini ? ' mini' : ''}" title="${meta.de} — ${meta.ar}">${lbl}</span>`;
};

/* Speak German text via the Web Speech API; prefers a native de-DE voice. */
KK.speak = function (text) {
  if (!('speechSynthesis' in window) || !text) return;
  const t = String(text).replace(/\s+/g, ' ').trim();
  window.speechSynthesis.cancel();
  const u = new window.SpeechSynthesisUtterance(t);
  u.lang = 'de-DE';
  u.rate = 0.9; // slightly slow for learners
  const vs = window.speechSynthesis.getVoices();
  const v = vs.find(x => x.lang === 'de-DE' && x.localService) ||
            vs.find(x => x.lang === 'de-DE') ||
            vs.find(x => (x.lang || '').startsWith('de'));
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
};

/* 🔊 button markup; clicks are handled by one delegated listener in app.js. */
KK.speakBtn = function (text) {
  const attr = String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<button type="button" class="speak-btn" data-speak="${attr}" title="Anhören (Deutsch)" aria-label="Anhören: ${attr}">🔊</button>`;
};

/* ---------- Feedback sounds (Web Audio, no files) ---------- */
KK.sfx = (function () {
  const KEY = 'kasus-kompass-sfx-muted';
  let ctx = null, muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* private mode etc. */ }

  function audioCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /* one note with a quick attack and exponential fade-out */
  function note(freq, t0, dur, vol, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function play(ok) {
    if (muted || !audioCtx()) return;
    const t = ctx.currentTime;
    if (ok) {            // bright ascending chime: C5 → G5
      note(523.25, t, 0.16, 0.15, 'sine');
      note(783.99, t + 0.09, 0.22, 0.15, 'sine');
    } else {             // gentle low buzz, softer than the chime
      note(200, t, 0.28, 0.1, 'triangle');
    }
  }
  function tap() {
    if (muted || !audioCtx()) return;
    const t = ctx.currentTime;
    note(420, t, 0.055, 0.045, 'triangle');
  }
  function transition() {
    if (muted || !audioCtx()) return;
    const t = ctx.currentTime;
    note(330, t, 0.08, 0.055, 'sine');
    note(495, t + 0.055, 0.12, 0.06, 'sine');
  }
  function win() {            // celebratory arpeggio for a perfect run: C5–E5–G5–C6
    if (muted || !audioCtx()) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, t + i * 0.12, 0.3, 0.15, 'sine'));
  }
  return {
    play, tap, transition, win,
    muted: () => muted,
    toggle() {
      muted = !muted;
      try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
      return muted;
    },
  };
})();

/* ---------- Geschlecht-Hinweise: Genus an Endung/Kategorie erkennen ----------
   lbl: ending or category · rel: reliability % · ex: shown in reference ·
   quiz: extra words for the quiz pool · ar: short Arabic explanation ·
   trap/trapAr: warning about exceptions · abs: absolute rule · noQuiz: skip in quiz */
KK.GENUS = {
  m: {
    endings: [
      { lbl: '-er', rel: 80, ex: ['Computer', 'Lehrer', 'Drucker'], quiz: ['Wecker', 'Koffer', 'Teller'],
        ar: 'معظم ما ينتهي بـ -er مذكّر، خاصة الأجهزة والآلات.',
        trap: 'Aber: die Mutter, die Schwester, die Butter, das Fenster!',
        trapAr: 'انتبه: die Mutter و die Butter و das Fenster استثناءات شهيرة.' },
      { lbl: '-er (Berufe/Täter)', rel: 100, ex: ['Lehrer', 'Fahrer', 'Maler'], quiz: ['Bäcker', 'Spieler'],
        ar: 'مَن يقوم بالفعل (مدرّس، سائق، رسّام…) ينتهي بـ -er وهو مذكّر دائمًا.' },
      { lbl: '-or', rel: 98, ex: ['Motor', 'Rotor', 'Traktor'], quiz: ['Doktor', 'Faktor'],
        ar: 'الكلمات المنتهية بـ -or مذكّرة تقريبًا دائمًا.' },
      { lbl: '-ismus', rel: 100, ex: ['Tourismus', 'Kapitalismus'], quiz: ['Optimismus', 'Journalismus'],
        ar: 'كل المذاهب والمصطلحات بـ -ismus مذكّرة بلا استثناء.' },
      { lbl: '-ling', rel: 100, ex: ['Schmetterling', 'Frühling'], quiz: ['Lehrling', 'Zwilling'],
        ar: 'كل ما ينتهي بـ -ling مذكّر، بلا استثناء.' },
      { lbl: '-ant', rel: 95, ex: ['Demonstrant', 'Elefant'], quiz: ['Praktikant', 'Diamant'],
        ar: 'الأشخاص والأشياء بـ -ant مذكّرة غالبًا.' },
      { lbl: '-ent', rel: 90, ex: ['Student', 'Moment'], quiz: ['Präsident', 'Patient', 'Akzent'],
        ar: 'الأشخاص بـ -ent مذكّرون — لكن انتبه: ما ينتهي بـ -ment محايد!' },
      { lbl: '-ich', rel: 95, ex: ['Teppich', 'Pfirsich'],
        ar: 'الكلمات المنتهية بـ -ich مذكّرة غالبًا.' },
      { lbl: '-ig', rel: 95, ex: ['Honig', 'König'], quiz: ['Essig'],
        ar: 'الكلمات المنتهية بـ -ig مذكّرة غالبًا.' },
      { lbl: '-ast', rel: 90, ex: ['Palast', 'Kontrast'],
        ar: 'الكلمات المنتهية بـ -ast مذكّرة غالبًا.' },
      { lbl: '-us', rel: 90, ex: ['Rhythmus', 'Zirkus'], quiz: ['Kaktus', 'Globus'],
        ar: 'الكلمات اللاتينية بـ -us مذكّرة غالبًا.' },
    ],
    categories: [
      { lbl: 'Männliche Personen & Berufe', rel: 100, ex: ['Mann', 'Vater', 'Arzt'], quiz: ['Bruder', 'Sohn', 'Onkel'],
        ar: 'الذكور والمهن الذكورية مذكّرة بالطبع.' },
      { lbl: 'Wochentage', rel: 100, ex: ['Montag', 'Dienstag'], quiz: ['Freitag', 'Sonntag'],
        ar: 'كل أيام الأسبوع مذكّرة.' },
      { lbl: 'Monate', rel: 100, ex: ['Januar', 'März'], quiz: ['Juli', 'Dezember'],
        ar: 'كل الشهور مذكّرة.' },
      { lbl: 'Jahreszeiten', rel: 100, ex: ['Frühling', 'Sommer', 'Herbst'], quiz: ['Winter'],
        ar: 'الفصول الأربعة مذكّرة.' },
      { lbl: 'Himmelsrichtungen', rel: 100, ex: ['Norden', 'Süden', 'Osten'], quiz: ['Westen'],
        ar: 'الجهات الأربع مذكّرة.' },
      { lbl: 'Wetter (meist)', rel: 85, ex: ['Regen', 'Schnee', 'Wind'], quiz: ['Sturm', 'Nebel'],
        ar: 'معظم ظواهر الطقس مذكّرة.',
        trap: 'Aber: das Wetter, das Gewitter!',
        trapAr: 'الاستثناءان: das Wetter و das Gewitter محايدان.' },
      { lbl: 'Alkoholische Getränke', rel: 95, ex: ['Wein', 'Wodka', 'Whisky'], quiz: ['Sekt', 'Schnaps'],
        ar: 'المشروبات الكحولية مذكّرة.',
        trap: 'Die berühmte Ausnahme: das Bier!',
        trapAr: 'الاستثناء الأشهر: البيرة das Bier محايدة!' },
      { lbl: 'Automarken', rel: 100, ex: ['BMW', 'Mercedes'], quiz: ['Audi', 'Porsche'],
        ar: 'ماركات السيارات مذكّرة (لأن der Wagen مذكّر).' },
      { lbl: 'Steine & Mineralien', rel: 95, ex: ['Stein', 'Granit'], quiz: ['Marmor'],
        ar: 'الأحجار والمعادن الصخرية مذكّرة غالبًا.' },
      { lbl: 'Einsilbige Fremdwörter (Tendenz)', rel: 75, ex: ['Hit', 'Look', 'Trend'], quiz: ['Job', 'Chat'],
        ar: 'الكلمات الأجنبية القصيرة تميل إلى التذكير.' },
    ],
  },
  f: {
    endings: [
      { lbl: '-ung', rel: 100, ex: ['Zeitung', 'Übung'], quiz: ['Wohnung', 'Meinung', 'Lösung', 'Rechnung'],
        ar: 'كل ما ينتهي بـ -ung مؤنث — القاعدة الذهبية الأولى.' },
      { lbl: '-heit', rel: 100, ex: ['Freiheit', 'Krankheit'], quiz: ['Gesundheit', 'Schönheit', 'Wahrheit'],
        ar: 'كل ما ينتهي بـ -heit مؤنث بلا استثناء.' },
      { lbl: '-keit', rel: 100, ex: ['Möglichkeit', 'Freundlichkeit'], quiz: ['Schwierigkeit', 'Geschwindigkeit'],
        ar: 'كل ما ينتهي بـ -keit مؤنث بلا استثناء.' },
      { lbl: '-schaft', rel: 100, ex: ['Freundschaft', 'Wissenschaft'], quiz: ['Mannschaft', 'Landschaft'],
        ar: 'كل ما ينتهي بـ -schaft مؤنث بلا استثناء.' },
      { lbl: '-tät', rel: 100, ex: ['Universität', 'Qualität'], quiz: ['Realität', 'Aktivität'],
        ar: 'كل ما ينتهي بـ -tät مؤنث بلا استثناء.' },
      { lbl: '-tion', rel: 100, ex: ['Nation', 'Information'], quiz: ['Situation', 'Tradition'],
        ar: 'كل ما ينتهي بـ -tion مؤنث بلا استثناء.' },
      { lbl: '-sion', rel: 100, ex: ['Explosion', 'Diskussion'], quiz: ['Version', 'Pension'],
        ar: 'كل ما ينتهي بـ -sion مؤنث.' },
      { lbl: '-ie / -y', rel: 95, ex: ['Familie', 'Energie', 'Party'], quiz: ['Galerie', 'Industrie', 'Story'],
        ar: 'مؤنث غالبًا — وكذلك الكلمات الإنجليزية المنتهية بـ -y مثل die Party.' },
      { lbl: '-ik', rel: 90, ex: ['Musik', 'Politik'], quiz: ['Technik', 'Grammatik'],
        ar: 'الكلمات المنتهية بـ -ik مؤنثة غالبًا.' },
      { lbl: '-ur / -ür', rel: 93, ex: ['Natur', 'Tür'], quiz: ['Kultur', 'Temperatur', 'Figur'],
        ar: 'الكلمات المنتهية بـ -ur أو -ür مؤنثة في الغالب.' },
      { lbl: '-enz', rel: 100, ex: ['Konferenz', 'Tendenz'], quiz: ['Existenz', 'Konkurrenz'],
        ar: 'كل ما ينتهي بـ -enz مؤنث.' },
      { lbl: '-anz', rel: 100, ex: ['Distanz', 'Eleganz'], quiz: ['Toleranz', 'Bilanz'],
        ar: 'كل ما ينتهي بـ -anz مؤنث.' },
      { lbl: '-ei', rel: 90, ex: ['Bäckerei', 'Partei'], quiz: ['Polizei', 'Metzgerei'],
        ar: 'أماكن العمل والكلمات بـ -ei مؤنثة غالبًا.',
        trap: 'Aber: das Ei, der Brei!',
        trapAr: 'انتبه: البيضة das Ei محايدة.' },
      { lbl: '-e', rel: 90, ex: ['Tasche', 'Schule', 'Blume'], quiz: ['Lampe', 'Straße', 'Katze', 'Woche'],
        ar: 'نحو 90% من أسماء -e مؤنثة، وجمعها غالبًا بإضافة -n.',
        trap: 'Aber: der Junge, der Name, das Ende!',
        trapAr: 'الاستثناءات المهمة: der Junge (ولد) و der Name و das Ende.' },
      { lbl: '-in (weibliche Form)', rel: 100, ex: ['Lehrerin', 'Studentin'], quiz: ['Ärztin', 'Freundin'],
        ar: 'صيغة المؤنث للمهن (بإضافة -in) مؤنثة دائمًا.' },
    ],
    categories: [
      { lbl: 'Weibliche Personen', rel: 100, ex: ['Frau', 'Mutter', 'Schwester'], quiz: ['Tante', 'Tochter'],
        ar: 'الإناث مؤنثات — إلا صيغ التصغير: das Mädchen!',
        trap: 'Aber Diminutive gewinnen: das Mädchen, das Fräulein!',
        trapAr: 'لكن التصغير أقوى: das Mädchen محايدة رغم أنها بنت!' },
      { lbl: 'Bäume & Blumen (meist)', rel: 95, ex: ['Eiche', 'Rose', 'Tulpe'], quiz: ['Tanne', 'Lilie'],
        ar: 'معظم الأشجار والزهور مؤنثة.' },
      { lbl: 'Zahlen als Nomen', rel: 100, ex: ['Eins', 'Million'], quiz: ['Milliarde'],
        ar: 'الأرقام عندما تُستخدم كأسماء تكون مؤنثة.' },
    ],
  },
  n: {
    endings: [
      { lbl: '-chen', rel: 100, abs: true, ex: ['Mädchen', 'Häuschen'], quiz: ['Brötchen', 'Kätzchen', 'Hündchen'],
        ar: 'التصغير بـ -chen محايد دائمًا 100% — حتى «البنت» das Mädchen محايدة نحويًا!' },
      { lbl: '-lein', rel: 100, abs: true, ex: ['Fräulein', 'Büchlein'], quiz: ['Vöglein'],
        ar: 'التصغير بـ -lein محايد دائمًا 100%، بلا أي استثناء.' },
      { lbl: '-ment', rel: 95, ex: ['Dokument', 'Instrument'], quiz: ['Argument', 'Experiment', 'Medikament'],
        ar: 'الكلمات المنتهية بـ -ment محايدة غالبًا (وكذلك المستعارة مثل das Treatment).',
        trap: 'Aber: der Moment, der Zement!',
        trapAr: 'الاستثناءان: der Moment و der Zement مذكّران.' },
      { lbl: '-um', rel: 95, ex: ['Datum', 'Museum', 'Zentrum'], quiz: ['Studium', 'Gymnasium', 'Aquarium'],
        ar: 'الكلمات اللاتينية بـ -um محايدة غالبًا.' },
      { lbl: '-ma', rel: 90, ex: ['Thema', 'Klima', 'Drama'], quiz: ['Aroma'],
        ar: 'الكلمات اليونانية بـ -ma محايدة غالبًا.',
        trap: 'Aber: die Firma!',
        trapAr: 'الاستثناء: الشركة die Firma مؤنثة.' },
      { lbl: '-tum', rel: 90, ex: ['Eigentum', 'Wachstum'], quiz: ['Altertum'],
        ar: 'الكلمات المنتهية بـ -tum محايدة غالبًا.',
        trap: 'Aber: der Reichtum, der Irrtum!',
        trapAr: 'الاستثناءان الوحيدان: der Reichtum و der Irrtum مذكّران.' },
      { lbl: '-tel (Brüche)', rel: 100, ex: ['Viertel', 'Drittel'], quiz: ['Zehntel'],
        ar: 'الكسور بـ -tel محايدة.' },
      { lbl: '-ett / -et (Fremdwörter)', rel: 90, ex: ['Ticket', 'Ballett'], quiz: ['Tablett', 'Büfett'],
        ar: 'الكلمات الأجنبية بـ -ett أو -et محايدة غالبًا.' },
      { lbl: '-icht', rel: 90, ex: ['Licht', 'Gewicht'], quiz: ['Gericht', 'Gedicht'],
        ar: 'الكلمات المنتهية بـ -icht محايدة غالبًا.' },
      { lbl: '-il (Fremdwörter)', rel: 90, ex: ['Ventil', 'Profil'], quiz: ['Krokodil'],
        ar: 'الكلمات الأجنبية بـ -il محايدة غالبًا.' },
    ],
    categories: [
      { lbl: 'Nominalisierte Verben', rel: 100, ex: ['Essen', 'Lernen', 'Schwimmen'], quiz: ['Leben'],
        ar: 'أي مصدر فعل يُستخدم كاسم يصبح محايدًا: das Essen (الأكل)، das Lernen (التعلّم).' },
      { lbl: 'Farben als Nomen', rel: 100, ex: ['Rot', 'Blau'], quiz: ['Grün', 'Gelb'],
        ar: 'الألوان كأسماء محايدة: das Rot (اللون الأحمر).' },
      { lbl: 'Buchstaben', rel: 100, noQuiz: true, ex: ['A', 'B', 'C'],
        ar: 'حروف الأبجدية محايدة: das A، das B.' },
      { lbl: 'Metalle (meist)', rel: 90, ex: ['Gold', 'Silber', 'Eisen'], quiz: ['Kupfer'],
        ar: 'معظم المعادن محايدة.',
        trap: 'Aber: der Stahl, die Bronze!',
        trapAr: 'انتبه: der Stahl مذكّر و die Bronze مؤنثة.' },
      { lbl: 'Junge Lebewesen', rel: 90, ex: ['Baby', 'Kind', 'Kalb'], quiz: ['Küken', 'Lamm'],
        ar: 'صغار الكائنات الحية محايدة غالبًا.' },
    ],
  },
};

/* Trap words for the quiz: the obvious guess is wrong — each explains why. */
KK.GENUS_TRAPS = [
  { w: 'Mutter', g: 'f', de: '-er sieht maskulin aus, aber das natürliche Geschlecht gewinnt: <b>die Mutter</b>.', ar: 'تنتهي بـ -er لكنها أنثى — الجنس الطبيعي أقوى من النهاية: die Mutter.' },
  { w: 'Schwester', g: 'f', de: 'Wieder -er, wieder weiblich: <b>die Schwester</b>.', ar: 'تنتهي بـ -er لكنها أنثى: die Schwester.' },
  { w: 'Butter', g: 'f', de: 'Die klassische -er-Falle: <b>die Butter</b>.', ar: 'فخ -er الكلاسيكي: الزبدة die Butter مؤنثة.' },
  { w: 'Fenster', g: 'n', de: '-er, aber Neutrum: <b>das Fenster</b>.', ar: 'ينتهي بـ -er لكنه محايد: das Fenster.' },
  { w: 'Mädchen', g: 'n', de: '<b>-chen gewinnt IMMER</b> — sogar gegen das natürliche Geschlecht. Ein Mädchen ist weiblich, das Wort trotzdem <b>das Mädchen</b>.', ar: 'التصغير -chen يتغلب حتى على الجنس الطبيعي: «البنت» das Mädchen محايدة نحويًا — قاعدة مطلقة!' },
  { w: 'Fräulein', g: 'n', de: '<b>-lein gewinnt IMMER</b>: <b>das Fräulein</b>, obwohl weiblich.', ar: 'التصغير -lein قاعدة مطلقة: das Fräulein محايدة رغم أنها أنثى.' },
  { w: 'Bier', g: 'n', de: 'Alkohol ist maskulin — außer dem berühmtesten Getränk: <b>das Bier</b>.', ar: 'المشروبات الكحولية مذكّرة إلا الأشهر بينها: البيرة das Bier محايدة!' },
  { w: 'Wetter', g: 'n', de: 'Wetterphänomene sind maskulin, aber der Oberbegriff nicht: <b>das Wetter</b>.', ar: 'ظواهر الطقس مذكّرة، لكن كلمة «الطقس» نفسها محايدة: das Wetter.' },
  { w: 'Gewitter', g: 'n', de: 'Auch hier kein Maskulinum: <b>das Gewitter</b> (Ge- + -er ist oft Neutrum).', ar: 'العاصفة الرعدية das Gewitter محايدة — البادئة Ge- غالبًا محايدة.' },
  { w: 'Junge', g: 'm', de: 'Endet auf -e, ist aber ein männlicher Mensch: <b>der Junge</b>.', ar: 'تنتهي بـ -e لكنها تعني «ولد» — الجنس الطبيعي يفوز: der Junge.' },
  { w: 'Name', g: 'm', de: 'Eine der wenigen -e-Ausnahmen: <b>der Name</b>.', ar: 'من استثناءات -e القليلة: الاسم der Name مذكّر.' },
  { w: 'Ende', g: 'n', de: 'Noch eine -e-Ausnahme: <b>das Ende</b>.', ar: 'استثناء آخر لنهاية -e: النهاية das Ende محايدة.' },
  { w: 'Firma', g: 'f', de: '-ma ist meist Neutrum — aber: <b>die Firma</b>.', ar: 'عكس قاعدة -ma المحايدة: الشركة die Firma مؤنثة.' },
  { w: 'Reichtum', g: 'm', de: '-tum ist meist Neutrum, aber: <b>der Reichtum</b> (und der Irrtum).', ar: 'استثناء قاعدة -tum: الثراء der Reichtum مذكّر.' },
  { w: 'Irrtum', g: 'm', de: 'Die zweite -tum-Ausnahme: <b>der Irrtum</b>.', ar: 'الاستثناء الثاني لقاعدة -tum: الخطأ der Irrtum مذكّر.' },
];

KK.EXPLAIN.genus = {
  de: `<p>Du musst nicht jedes Genus auswendig lernen: <b>Endung und Kategorie verraten der/die/das</b> in den meisten Fällen. Die zuverlässigsten Regeln zuerst lernen (-chen, -lein, -ung, -heit …), dann die Tendenzen — und die wenigen Fallen gezielt merken. Das Quiz speist deine Ergebnisse in die Statistik ein.</p>`,
  ar: `<p>لست مضطرًا لحفظ جنس كل كلمة على حدة: <b>نهاية الكلمة وفئتها تكشفان der/die/das</b> في أغلب الحالات. ابدأ بالقواعد المضمونة (-chen و -lein و -ung و -heit…) ثم القواعد الغالبة، واحفظ الاستثناءات القليلة عن قصد. نتائج الاختبار تدخل في إحصائياتك مثل بقية التمارين.</p>`,
};
