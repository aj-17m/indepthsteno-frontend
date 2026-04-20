/**
 * Hindi utilities:
 *  - KrutiDev 010 ↔ Unicode conversion
 *  - Number ↔ Hindi word (for display)
 *  - Text normalisation helpers
 */

// ─── KrutiDev 010 → Unicode Devanagari ───────────────────────────────────────
const KRUTIDEV_TO_UNICODE = {
  'v':'ा','f':'ि','h':'ी','q':'ु','w':'ू',
  'k':'े','s':'ै','k':'ो','l':'ौ','^':'ं','Ö':'ँ',':':'ः','~':'ँ',
  'D':'क','[':'ख','x':'ग','N':'घ','P':'ङ',
  'p':'च','Q':'छ','t':'ज','t~':'झ','u':'ञ',
  'V':'ट','B':'ठ','M':'ड','M~':'ढ','m':'ण',
  'r':'त','_':'थ','n':'द','X':'ध','u':'न',
  'i':'प','Q':'फ','c':'ब','H':'भ','e':'म',
  'T':'य','j':'र','y':'ल','o':'व','W':'श','\"':'ष','l':'स','g':'ह',
  'k':'क्ष','=':'त्र','K':'ज्ञ',
  // Vowels (standalone)
  'v':'अ','vk':'आ','b':'इ','bZ':'ई','m':'उ','mW':'ऊ','_':'ऋ',
  'ds':'ए',',s':'ऐ','vks':'ओ','vkS':'औ','va':'अं','v%':'अः',
  // Digits (KrutiDev uses Devanagari digits)
  '0':'०','1':'१','2':'२','3':'३','4':'४',
  '5':'५','6':'६','7':'७','8':'८','9':'९',
  '|':'।','||':'॥','/':'/','\\':'\\',
};

/**
 * Convert KrutiDev 010 encoded string to Unicode Devanagari.
 * This is a simplified mapper — full conversion requires
 * handling matras + conjuncts in sequence, which is highly complex.
 * For a production app, use a dedicated library like `aksharamukha`.
 */
export function krutiDevToUnicode(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    // Try 2-char match first
    const two = KRUTIDEV_TO_UNICODE[text.slice(i, i+2)];
    if (two) { result += two; i += 2; continue; }
    const one = KRUTIDEV_TO_UNICODE[text[i]];
    result += one ?? text[i];
    i++;
  }
  return result;
}

// ─── Number → Hindi word ──────────────────────────────────────────────────────
const NUM_MAP = {
  0:'शून्य',1:'एक',2:'दो',3:'तीन',4:'चार',5:'पाँच',6:'छह',7:'सात',8:'आठ',9:'नौ',
  10:'दस',11:'ग्यारह',12:'बारह',13:'तेरह',14:'चौदह',15:'पंद्रह',16:'सोलह',
  17:'सत्रह',18:'अठारह',19:'उन्नीस',20:'बीस',21:'इक्कीस',22:'बाईस',
  23:'तेईस',24:'चौबीस',25:'पच्चीस',30:'तीस',40:'चालीस',50:'पचास',
  60:'साठ',70:'सत्तर',80:'अस्सी',90:'नब्बे',100:'सौ',1000:'हजार',
};

export function numberToHindi(n) { return NUM_MAP[n] ?? String(n); }

// ─── Normalise for display ────────────────────────────────────────────────────
export function stripChandrabindu(text) {
  return text.replace(/\u0901/g, '');
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
