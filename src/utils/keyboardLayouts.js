/**
 * Keyboard layout mappings — QWERTY (US) → target language
 *
 * Every layout except English intercepts raw KeyboardEvents and inserts
 * the correct Unicode character directly. No OS keyboard layout install needed.
 *
 * Language Categories
 * ───────────────────
 *  English               – pass-through, browser handles everything
 *  Hindi (Unicode/Mangal)
 *    inscript – BIS IS 15988 standard Devanagari layout
 *    cbi      – Central Bureau of Investigation variant
 *    gail     – Remington Gail (standard SSC / UPSC steno)
 *  Kruti Dev
 *    krutidev – KrutiDev 010 key pattern → Unicode Devanagari (auto-converted)
 */

/* ─────────────────────────────────────────────────────────────────────────────
   GAIL  (Remington Gail — standard SSC / UPSC Hindi steno)
───────────────────────────────────────────────────────────────────────────── */
const GAIL = {
  // ── Normal ──────────────────────────────────────────────────────────────────
  '`':'`',
  '1':'१','2':'२','3':'३','4':'४','5':'५',
  '6':'६','7':'७','8':'८','9':'९','0':'०',
  '-':'-','=':'=','[':',',']':'़',
  'q':'ट','w':'ा','e':'म','r':'न','t':'ज','y':'ब','u':'ह','i':'प','o':'र','p':'च',
  'a':'ी','s':'े','d':'क','f':'ि','g':'व','h':'ल','j':'स','k':'त','l':'ग',
  ';':'्',"'":'ड',
  'z':'ख','x':'ग','c':'ब','v':'न','b':'व','n':'ल','m':'स',',':'य','.':'ु','/':'ू',
  ' ':' ',

  // ── Shift ────────────────────────────────────────────────────────────────────
  '~':'~',
  '!':'!','@':'@','#':'#','$':'$','%':'%','^':'^','&':'&','*':'*','(':' (',')':")",
  '_':'_','+':'+','{':';','}':'।',
  'Q':'ठ','W':'आ','E':'श','R':'ण','T':'झ','Y':'भ','U':'ङ','I':'फ','O':'ऱ','P':'छ',
  'A':'ई','S':'ऐ','D':'क्ष','F':'इ','G':'ॉ','H':'ळ','J':'श','K':'थ','L':'घ',
  ':':'ः','"':'ढ',
  'Z':'क्ष','X':'त्र','C':'व','V':'ञ','B':'ण','N':'ऌ','M':'ष','<':'ये','>':'ू','?':'?',
};

/* ─────────────────────────────────────────────────────────────────────────────
   CBI  (Central Bureau of Investigation variant of Remington Gail)
───────────────────────────────────────────────────────────────────────────── */
const CBI = {
  ...GAIL,
  // CBI-specific overrides
  'q':'ट','w':'ा','e':'म','r':'न','t':'ज',
  'Q':'ठ','W':'आ','E':'श','R':'ण','T':'झ',
  ';':'्','A':'ई',
};

/* ─────────────────────────────────────────────────────────────────────────────
   INSCRIPT  (context-sensitive — same key can produce consonant, matra, or
   independent vowel depending on what was typed before it)
───────────────────────────────────────────────────────────────────────────── */

/** Unshifted consonants */
export const INSCRIPT_BASE = {
  k:'क', g:'ग', c:'च', j:'ज', t:'ट', d:'ड', n:'ण',
  p:'प', b:'ब', m:'म', y:'य', r:'र', l:'ल', v:'व', s:'स', h:'ह',
};

/** Shifted consonants */
export const INSCRIPT_SHIFT = {
  K:'ख', G:'घ', C:'छ', J:'झ', T:'ठ', D:'ढ', N:'ण',
  P:'फ', B:'भ', S:'श', z:'ष',
};

/**
 * Dependent vowel signs (matras) — only valid after a consonant.
 * Note: 'k' here (ा) shadows INSCRIPT_BASE.k (क) in post-consonant context.
 *       'h' is NOT here — post-consonant 'h' goes to INSCRIPT_SPECIAL (halant).
 *       'e','o','O' shadow INSCRIPT_VOWELS in post-consonant context.
 */
export const INSCRIPT_MATRA = {
  f:'ि',  F:'ी',
  q:'ु',  Q:'ू',
  e:'े',  w:'ै',
  o:'ो',  O:'ौ',
  '`':'ृ',
  k:'ा',           // same key as क — resolved by context
};

/** Independent vowels — used when NOT directly after a consonant */
export const INSCRIPT_VOWELS = {
  a:'अ', A:'आ',
  i:'इ', I:'ई',
  u:'उ', U:'ऊ',
  e:'ए', E:'ऐ',   // same keys as matras े/ै — resolved by context
  o:'ओ', O:'औ',   // same keys as matras ो/ौ — resolved by context
};

/**
 * Special combining marks.
 * 'h' (halant ्) shadows INSCRIPT_BASE.h (ह) in post-consonant context.
 */
export const INSCRIPT_SPECIAL = {
  h:'्',   // halant/virama — post-consonant 'h'; standalone 'h' → ह via BASE
  M:'ं',   // anusvara
  H:'ः',   // visarga
  '~':'ँ', // chandrabindu
};

/**
 * Flat display map for the reference card.
 * Shows primary/standalone meaning per key; context-sensitive keys
 * (k, h, e, o, O) show their consonant/vowel form here.
 */
const INSCRIPT_DISPLAY = {
  ...INSCRIPT_MATRA,    // matra keys as base
  ...INSCRIPT_BASE,     // consonants override (k=क over k=ा, h=ह)
  ...INSCRIPT_SHIFT,
  ...INSCRIPT_VOWELS,   // independent vowels (e=ए over e=े, o=ओ over o=ो, O=औ)
  // Specials that don't collide with consonants
  M: INSCRIPT_SPECIAL.M,    // ं
  H: INSCRIPT_SPECIAL.H,    // ः
  '~': INSCRIPT_SPECIAL['~'],
  ' ':' ', ',':',', '.':'.',
};

/* ─────────────────────────────────────────────────────────────────────────────
   MANGAL  (Hindi legacy font keyboard layout — direct Unicode output)
   Mangal is a standard Hindi font. This layout provides direct key-mapping
   from English QWERTY to Devanagari Unicode (works with any Devanagari font).
───────────────────────────────────────────────────────────────────────────── */
const MANGAL = {
  // ── Normal ──────────────────────────────────────────────────────────────────
  '`':'ँ',
  '1':'१','2':'२','3':'३','4':'४','5':'५',
  '6':'६','7':'७','8':'८','9':'९','0':'०',
  '-':'ः','=':'।','[':',',']':'।',
  'q':'ट','w':'ा','e':'म','r':'न','t':'ज','y':'ब','u':'ह','i':'प','o':'र','p':'च',
  'a':'ी','s':'े','d':'क','f':'ि','g':'व','h':'ल','j':'स','k':'त','l':'ग',
  ';':'्',"'":'ड',
  'z':'ख','x':'ग','c':'ब','v':'न','b':'व','n':'ल','m':'स',',':'य','.':'ु','/':'ू',
  ' ':' ',

  // ── Shift ────────────────────────────────────────────────────────────────────
  '~':'ऽ',
  '!':'!','@':'@','#':'#','$':'$','%':'%','^':'^','&':'&','*':'*','(':'(',')':")",
  '_':'ः','+':'।','{':';','}':';',
  'Q':'ठ','W':'आ','E':'श','R':'ण','T':'झ','Y':'भ','U':'ङ','I':'फ','O':'ऱ','P':'छ',
  'A':'ई','S':'ऐ','D':'क्ष','F':'इ','G':'ॉ','H':'ळ','J':'श','K':'थ','L':'घ',
  ':':'ॉ','"':'ढ',
  'Z':'क्ष','X':'त्र','C':'त्व','V':'ञ','B':'ण','N':'ऌ','M':'ष','<':'ज्ञ','>':'ः','?':'?',
};

/* ─────────────────────────────────────────────────────────────────────────────
   LAYOUT MAPS
   inscript uses INSCRIPT_DISPLAY (flat, for reference card only — actual typing
   goes through processInscriptBuffer which is context-sensitive).
   KrutiDev is NOT here — it uses kru2uni conversion.
───────────────────────────────────────────────────────────────────────────── */
export const LAYOUT_MAPS = {
  inscript : INSCRIPT_DISPLAY,
  cbi      : CBI,
  gail     : GAIL,
  mangal   : MANGAL,
};

/* ─────────────────────────────────────────────────────────────────────────────
   LANGUAGE CATEGORIES  (hierarchical structure for the UI)
───────────────────────────────────────────────────────────────────────────── */
export const LANGUAGE_CATEGORIES = [
  {
    value   : 'mangal',
    label   : 'Mangal',
    icon    : '🇮🇳',
    desc    : 'Mangal font layout — Unicode Devanagari',
    layouts : null,
  },
  {
    value   : 'krutidev',
    label   : 'Kruti Dev',
    icon    : '🖋',
    desc    : 'KrutiDev 010 keys — auto-converts to Unicode',
    layouts : null,
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

/** Returns true if the layout is pure pass-through (no interception). */
export function isPassThrough(layout) {
  return layout === 'english';
}

/**
 * Returns true for KrutiDev — uses buffer+kru2uni conversion instead of
 * direct key-map. Handled separately in TestPage.
 */
export function isKrutidev(layout) {
  return layout === 'krutidev';
}

/** Derive the parent language-category value from an active layout key. */
export function getCategoryForLayout(layout) {
  if (layout === 'krutidev') return 'krutidev';
  return 'mangal';   // mangal (and any legacy: inscript | cbi | gail)
}

/**
 * Resolve a raw keyboard key to the mapped character for the given layout.
 * Returns null for pass-through layouts or unrecognised keys (let browser handle).
 *
 * @param {string} layout  – 'inscript' | 'cbi' | 'gail' | 'krutidev' | 'english'
 * @param {string} key     – e.key value from KeyboardEvent
 */
export function getMappedChar(layout, key) {
  if (isPassThrough(layout) || isKrutidev(layout)) return null;
  const map = LAYOUT_MAPS[layout];
  if (!map) return null;
  const ch = map[key];
  return ch !== undefined ? ch : null;
}

/**
 * Convert a raw keystroke buffer to Unicode for Hindi (Mangal) layouts.
 *
 * Each key is looked up in layoutMap. After conversion, ि (U+093F) that
 * appears immediately before a Devanagari consonant is moved after it —
 * this corrects Remington-based typing (GAIL/CBI) where ि is typed before
 * its consonant. For INSCRIPT users who type consonant-then-matra the
 * pattern never matches, so this is a transparent no-op.
 *
 * @param {string} rawBuffer  – accumulated raw keystroke characters
 * @param {Object} layoutMap  – key→character map from LAYOUT_MAPS
 * @returns {string} Unicode Devanagari string
 */
export function processHindiBuffer(rawBuffer, layoutMap) {
  let result = '';
  for (const ch of rawBuffer) {
    const mapped = layoutMap[ch];
    result += (mapped !== undefined) ? mapped : ch;
  }
  // ि reorder: swap ि+consonant → consonant+ि
  // Devanagari consonant range: U+0915–U+0939, U+0958–U+095F, U+0978–U+097F
  return result.replace(/\u093F([\u0915-\u0939\u0958-\u095F\u0978-\u097F])/g, '$1\u093F');
}

/**
 * Returns true if the Unicode codepoint is a Devanagari consonant.
 * Covers ka-ha (U+0915–U+0939) and nukta variants (U+0958–U+095F).
 */
function isDevanagariConsonant(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return (cp >= 0x0915 && cp <= 0x0939) || (cp >= 0x0958 && cp <= 0x095F);
}

/**
 * Convert a raw keystroke buffer to Unicode for the INSCRIPT layout.
 *
 * Resolution priority per key, based on the last output character:
 *
 *   After halant (्)    → consonant priority  (conjunct formation)
 *                          SHIFT > BASE > MATRA > SPECIAL > VOWEL
 *
 *   After consonant     → matra/special priority
 *                          MATRA > SPECIAL > BASE > SHIFT > VOWEL
 *                          (e.g. 'k' → ा, 'h' → ्, 'e' → े)
 *
 *   Otherwise           → independent vowel / new consonant
 *                          VOWEL > BASE > SHIFT > SPECIAL > MATRA
 *                          (e.g. 'k' → क, 'h' → ह, 'e' → ए)
 */
export function processInscriptBuffer(rawBuffer) {
  let result = '';

  for (const key of rawBuffer) {
    if (key === '\n' || key === ' ') { result += key; continue; }

    const chars    = [...result];
    const lastChar = chars[chars.length - 1] ?? '';
    const afterHalant    = lastChar === '\u094D';
    const afterConsonant = !afterHalant && isDevanagariConsonant(lastChar);

    let ch;
    if (afterHalant) {
      ch = INSCRIPT_SHIFT[key]
        ?? INSCRIPT_BASE[key]
        ?? INSCRIPT_MATRA[key]
        ?? INSCRIPT_SPECIAL[key]
        ?? INSCRIPT_VOWELS[key]
        ?? null;
    } else if (afterConsonant) {
      ch = INSCRIPT_MATRA[key]
        ?? INSCRIPT_SPECIAL[key]
        ?? INSCRIPT_BASE[key]
        ?? INSCRIPT_SHIFT[key]
        ?? INSCRIPT_VOWELS[key]
        ?? null;
    } else {
      ch = INSCRIPT_VOWELS[key]
        ?? INSCRIPT_BASE[key]
        ?? INSCRIPT_SHIFT[key]
        ?? INSCRIPT_SPECIAL[key]
        ?? INSCRIPT_MATRA[key]
        ?? null;
    }

    result += ch !== null ? ch : key;
  }

  return result;
}

/** Keys to show in the on-screen reference card (three rows). */
export const KEY_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
];

/** All selectable display fonts. */
export const FONTS = [
  { value: 'Mangal, "Nirmala UI", serif',                label: 'Mangal'        },
  { value: '"Nirmala UI", "Segoe UI", sans-serif',       label: 'Nirmala UI'    },
  { value: '"Arial Unicode MS", Arial, sans-serif',      label: 'Arial Unicode' },
  { value: '"Kokila", "Nirmala UI", serif',              label: 'Kokila'        },
];
