/**
 * Keyboard layout mappings — QWERTY (US) → target language
 *
 * Every layout except English and Inscript intercepts raw KeyboardEvents and inserts
 * the correct Unicode character directly. No OS keyboard layout install needed.
 *
 * Language Categories
 * ───────────────────
 *  English               – pass-through, browser handles everything
 *  Inscript             – system keyboard passthrough (install Hindi Inscript locally)
 *  Hindi (Unicode/Mangal)
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
   KrutiDev is NOT here — it uses kru2uni conversion.
───────────────────────────────────────────────────────────────────────────── */
export const LAYOUT_MAPS = {
  cbi      : CBI,
  gail     : GAIL,
  mangal   : MANGAL,
};

/* ─────────────────────────────────────────────────────────────────────────────
   LANGUAGE CATEGORIES  (hierarchical structure for the UI)
───────────────────────────────────────────────────────────────────────────── */
export const LANGUAGE_CATEGORIES = [
  {
    value   : 'inscript',
    label   : 'Inscript',
    icon    : '⌨️',
    desc    : 'System Hindi Inscript keyboard — direct passthrough (install keyboard locally)',
    layouts : null,
  },
  {
    value   : 'mangal',
    label   : 'Mangal',
    icon    : '🇮🇳',
    desc    : 'Unicode Devanagari layout — good for standard Hindi typing',
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
  return layout === 'english' || layout === 'inscript';
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
  if (layout === 'inscript') return 'inscript';
  if (layout === 'krutidev') return 'krutidev';
  return 'mangal';   // mangal (and legacy: cbi | gail)
}

/**
 * Resolve a raw keyboard key to the mapped character for the given layout.
 * Returns null for pass-through layouts or unrecognised keys (let browser handle).
 *
 * @param {string} layout  – 'inscript' | 'cbi' | 'gail' | 'mangal' | 'krutidev' | 'english'
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
 * its consonant.
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

/** Keys to show in the on-screen reference card (three rows). */
export const KEY_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l',';'],
  ['z','x','c','v','b','n','m',',','.','/'],
];

/**
 * Detect if a character is Devanagari (from system keyboard input).
 * Returns true if the character is in the Devanagari Unicode block.
 */
export function isDevanagariCharacter(char) {
  if (!char) return false;
  const cp = char.codePointAt(0);
  return (cp >= 0x0900 && cp <= 0x097F) ||   // Devanagari block
         (cp >= 0xA8E0 && cp <= 0xA8FF);     // Devanagari Extended block
}

/** All selectable display fonts. */
export const FONTS = [
  { value: 'Mangal, "Nirmala UI", serif',                label: 'Mangal'        },
  { value: '"Nirmala UI", "Segoe UI", sans-serif',       label: 'Nirmala UI'    },
  { value: '"Arial Unicode MS", Arial, sans-serif',      label: 'Arial Unicode' },
  { value: '"Kokila", "Nirmala UI", serif',              label: 'Kokila'        },
];
