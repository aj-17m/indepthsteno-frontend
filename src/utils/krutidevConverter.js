/**
 * KrutiDev 010 → Unicode Devanagari converter (JavaScript port)
 *
 * Original Python implementation by Nehal J Wani & Raveesh Motlani
 * Language Technology Research Center, IIIT Hyderabad
 *
 * How it works
 * ────────────
 * KrutiDev is a legacy font encoding where ASCII/Latin-1 characters visually
 * render as Hindi when the KrutiDev font is loaded. This module converts that
 * raw ASCII sequence to proper Unicode Devanagari so text can be stored,
 * evaluated, and displayed with any modern Hindi font.
 *
 * Usage
 * ─────
 *   import { kru2uni } from './krutidevConverter';
 *   const unicode = kru2uni(rawKrutidevAsciiBuffer);
 */

/* ─────────────────────────────────────────────────────────────────────────────
   K2U  — sequential substitution table (order is critical)
   Longer / more specific patterns MUST appear before their prefixes.
───────────────────────────────────────────────────────────────────────────── */
const K2U = [
  // ── Rare / special chars first ─────────────────────────────────────────────
  ['\xf1', '\u0970'],              // ñ  →  ॰ (abbreviation sign)
  ['Q+Z', 'QZ+'],                  // Q+Z  →  QZ+
  ['sas', 'sa'],                   // sas  →  sa  (dedup)
  ['aa', 'a'],                     // aa  →  a   (dedup)
  [')Z', '\u0930\u094d\u0926\u094d\u0927'], // )Z  →  र्द्ध
  ['ZZ', 'Z'],                     // ZZ  →  Z   (dedup)
  ['\u2018', '"'],                  // '  →  "
  ['\u2019', '"'],                  // '  →  "
  ['\u201c', "'"],                  // "  →  '
  ['\u201d', "'"],                  // "  →  '

  // ── Hindi digits ───────────────────────────────────────────────────────────
  ['\xe5',   '\u0966'],             // å  →  ०
  ['\u0192', '\u0967'],             // ƒ  →  १
  ['\u201e', '\u0968'],             // „  →  २
  ['\u2026', '\u0969'],             // …  →  ३
  ['\u2020', '\u096a'],             // †  →  ४
  ['\u2021', '\u096b'],             // ‡  →  ५
  ['\u02c6', '\u096c'],             // ˆ  →  ६
  ['\u2030', '\u096d'],             // ‰  →  ७
  ['\u0160', '\u096e'],             // Š  →  ८
  ['\u2039', '\u096f'],             // ‹  →  ९

  // ── Nukta / special consonants (longest patterns first) ────────────────────
  ['\xb6+', '\u095e\u094d'],        // ¶+  →  फ़्
  ['d+',    '\u0958'],              // d+  →  क़
  ['[+k',   '\u0959'],              // [+k →  ख़
  ['[+',    '\u0959\u094d'],        // [+  →  ख़्
  ['x+',    '\u095a'],              // x+  →  ग़
  ['T+',    '\u091c\u093c\u094d'],  // T+  →  ज़्
  ['t+',    '\u095b'],              // t+  →  ज़
  ['M+',    '\u095c'],              // M+  →  ड़
  ['<+',    '\u095d'],              // <+  →  ढ़
  ['Q+',    '\u095e'],              // Q+  →  फ़
  [';+',    '\u095f'],              // ;+  →  य़
  ['j+',    '\u0931'],              // j+  →  ऱ
  ['u+',    '\u0929'],              // u+  →  ऩ

  // ── Pre-combined conjuncts (special Unicode / rare) ─────────────────────────
  ['\xd9k',   '\u0924\u094d\u0924'],         // Ùk  →  त्त
  ['\xd9',    '\u0924\u094d\u0924\u094d'],   // Ù   →  त्त्
  ['\xe4',    '\u0915\u094d\u0924'],          // ä   →  क्त
  ['\u2013',  '\u0926\u0943'],               // –   →  दृ
  ['\u2014',  '\u0915\u0943'],               // —   →  कृ
  ['\xe9',    '\u0928\u094d\u0928'],          // é   →  न्न
  ['\u2122',  '\u0928\u094d\u0928\u094d'],   // ™   →  न्न्
  ['=kk', '=k'],                             // =kk →  =k  (dedup)
  ['f=k', 'f='],                             // f=k →  f=  (dedup)
  ['\xe0', '\u0939\u094d\u0928'],            // à   →  ह्न
  ['\xe1', '\u0939\u094d\u092f'],            // á   →  ह्य
  ['\xe2', '\u0939\u0943'],                  // â   →  हृ
  ['\xe3', '\u0939\u094d\u092e'],            // ã   →  ह्म
  ['\xbaz', '\u0939\u094d\u0930'],           // ºz  →  ह्र
  ['\xba',   '\u0939\u094d'],                // º   →  ह्
  ['\xed',   '\u0926\u094d\u0926'],          // í   →  द्द
  ['{k',     '\u0915\u094d\u0937'],          // {k  →  क्ष
  ['{',      '\u0915\u094d\u0937\u094d'],    // {   →  क्ष्
  ['=',      '\u0924\u094d\u0930'],          // =   →  त्र
  ['\xab',   '\u0924\u094d\u0930\u094d'],   // «   →  त्र्
  ['N\xee',  '\u091b\u094d\u092f'],          // Nî  →  छ्य
  ['V\xee',  '\u091f\u094d\u092f'],          // Vî  →  ट्य
  ['B\xee',  '\u0920\u094d\u092f'],          // Bî  →  ठ्य
  ['M\xee',  '\u0921\u094d\u092f'],          // Mî  →  ड्य
  ['<\xee',  '\u0922\u094d\u092f'],          // <î  →  ढ्य
  ['|',      '\u0926\u094d\u092f'],          // |   →  द्य
  ['K',      '\u091c\u094d\u091e'],          // K   →  ज्ञ
  ['}',      '\u0926\u094d\u0935'],          // }   →  द्व
  ['J',      '\u0936\u094d\u0930'],          // J   →  श्र
  ['V\xaa',  '\u091f\u094d\u0930'],          // Vª  →  ट्र
  ['M\xaa',  '\u0921\u094d\u0930'],          // Mª  →  ड्र
  ['<\xaa\xaa', '\u0922\u094d\u0930'],       // <ªª →  ढ्र
  ['N\xaa',  '\u091b\u094d\u0930'],          // Nª  →  छ्र
  ['\xd8',   '\u0915\u094d\u0930'],          // Ø   →  क्र
  ['\xdd',   '\u092b\u094d\u0930'],          // Ý   →  फ्र
  ['nzZ',    '\u0930\u094d\u0926\u094d\u0930'], // nzZ → र्द्र
  ['\xe6',   '\u0926\u094d\u0930'],          // æ   →  द्र
  ['\xe7',   '\u092a\u094d\u0930'],          // ç   →  प्र
  ['\xc1',   '\u092a\u094d\u0930'],          // Á   →  प्र
  ['xz',     '\u0917\u094d\u0930'],          // xz  →  ग्र
  ['#',      '\u0930\u0941'],                // #   →  रु
  [':',      '\u0930\u0942'],                // :   →  रू
  ['v\u201a', '\u0911'],                     // v‚  →  ऑ
  ['vks',    '\u0913'],                      // vks →  ओ
  ['vkS',    '\u0914'],                      // vkS →  औ
  ['vk',     '\u0906'],                      // vk  →  आ
  ['v',      '\u0905'],                      // v   →  अ

  // ── Independent vowels (longer patterns first) ─────────────────────────────
  ['b\xb1',  '\u0908\u0902'],               // b±  →  ईं
  ['\xc3',   '\u0908'],                     // Ã   →  ई
  ['bZ',     '\u0908'],                     // bZ  →  ई
  ['b',      '\u0907'],                     // b   →  इ
  ['m',      '\u0909'],                     // m   →  उ
  ['\xc5',   '\u090a'],                     // Å   →  ऊ
  [',s',     '\u0910'],                     // ,s  →  ऐ
  [',',      '\u090f'],                     // ,   →  ए
  ['_',      '\u090b'],                     // _   →  ऋ

  // ── Consonants (longer/aspirated patterns before simple) ─────────────────────
  ['\xf4',   '\u0915\u094d\u0915'],         // ô   →  क्क
  ['d',      '\u0915'],                     // d   →  क
  ['Dk',     '\u0915'],                     // Dk  →  क
  ['D',      '\u0915\u094d'],               // D   →  क्
  ['[k',     '\u0916'],                     // [k  →  ख
  ['[',      '\u0916\u094d'],               // [   →  ख्
  ['x',      '\u0917'],                     // x   →  ग
  ['Xk',     '\u0917'],                     // Xk  →  ग
  ['X',      '\u0917\u094d'],               // X   →  ग्
  ['\xc4',   '\u0918'],                     // Ä   →  घ
  ['?k',     '\u0918'],                     // ?k  →  घ
  ['?',      '\u0918\u094d'],               // ?   →  घ्
  ['\xb3',   '\u0919'],                     // ³   →  ङ
  ['pkS',    '\u091a\u0948'],               // pkS →  चै
  ['p',      '\u091a'],                     // p   →  च
  ['Pk',     '\u091a'],                     // Pk  →  च
  ['P',      '\u091a\u094d'],               // P   →  च्
  ['N',      '\u091b'],                     // N   →  छ
  ['t',      '\u091c'],                     // t   →  ज
  ['Tk',     '\u091c'],                     // Tk  →  ज
  ['T',      '\u091c\u094d'],               // T   →  ज्
  ['>',      '\u091d'],                     // >   →  झ
  ['\xf7',   '\u091d\u094d'],               // ÷   →  झ्
  ['\xa5',   '\u091e'],                     // ¥   →  ञ
  ['\xea',   '\u091f\u094d\u091f'],         // ê   →  ट्ट
  ['\xeb',   '\u091f\u094d\u0920'],         // ë   →  ट्ठ
  ['V',      '\u091f'],                     // V   →  ट
  ['B',      '\u0920'],                     // B   →  ठ
  ['\xec',   '\u0921\u094d\u0921'],         // ì   →  ड्ड
  ['\xef',   '\u0921\u094d\u0922'],         // ï   →  ड्ढ
  ['M',      '\u0921'],                     // M   →  ड
  ['<',      '\u0922'],                     // <   →  ढ
  ['.k',     '\u0923'],                     // .k  →  ण
  ['.',      '\u0923\u094d'],               // .   →  ण्
  ['r',      '\u0924'],                     // r   →  त
  ['Rk',     '\u0924'],                     // Rk  →  त
  ['R',      '\u0924\u094d'],               // R   →  त्
  ['Fk',     '\u0925'],                     // Fk  →  थ
  ['F',      '\u0925\u094d'],               // F   →  थ्
  [')',      '\u0926\u094d\u0927'],          // )   →  द्ध
  ['n',      '\u0926'],                     // n   →  द
  ['/k',     '\u0927'],                     // /k  →  ध
  ['/',      '\u0927\u094d'],               // /   →  ध्
  ['\xcb',   '\u0927\u094d'],               // Ë   →  ध्
  ['\xe8',   '\u0927'],                     // è   →  ध
  ['u',      '\u0928'],                     // u   →  न
  ['Uk',     '\u0928'],                     // Uk  →  न
  ['U',      '\u0928\u094d'],               // U   →  न्
  ['i',      '\u092a'],                     // i   →  प
  ['Ik',     '\u092a'],                     // Ik  →  प
  ['I',      '\u092a\u094d'],               // I   →  प्
  ['Q',      '\u092b'],                     // Q   →  फ
  ['\xb6',   '\u092b\u094d'],               // ¶   →  फ्
  ['c',      '\u092c'],                     // c   →  ब
  ['Ck',     '\u092c'],                     // Ck  →  ब
  ['C',      '\u092c\u094d'],               // C   →  ब्
  ['Hk',     '\u092d'],                     // Hk  →  भ
  ['H',      '\u092d\u094d'],               // H   →  भ्
  ['e',      '\u092e'],                     // e   →  म
  ['Ek',     '\u092e'],                     // Ek  →  म
  ['E',      '\u092e\u094d'],               // E   →  म्
  [';',      '\u092f'],                     // ;   →  य
  ['\xb8',   '\u092f\u094d'],               // ¸   →  य्
  ['j',      '\u0930'],                     // j   →  र
  ['y',      '\u0932'],                     // y   →  ल
  ['Yk',     '\u0932'],                     // Yk  →  ल
  ['Y',      '\u0932\u094d'],               // Y   →  ल्
  ['G',      '\u0933'],                     // G   →  ळ
  ['o',      '\u0935'],                     // o   →  व
  ['Ok',     '\u0935'],                     // Ok  →  व
  ['O',      '\u0935\u094d'],               // O   →  व्
  ["'k",     '\u0936'],                     // 'k  →  श
  ["'",      '\u0936\u094d'],               // '   →  श्
  ['"k',     '\u0937'],                     // "k  →  ष
  ['"',      '\u0937\u094d'],               // "   →  ष्
  ['l',      '\u0938'],                     // l   →  स
  ['Lk',     '\u0938'],                     // Lk  →  स
  ['L',      '\u0938\u094d'],               // L   →  स्
  ['g',      '\u0939'],                     // g   →  ह

  // ── Vowel matras and modifiers ─────────────────────────────────────────────
  ['\xc8',   '\u0940\u0902'],               // È   →  ीं
  ['saz',    '\u094d\u0930\u0947\u0902'],   // saz →  ्रें
  ['z',      '\u094d\u0930'],               // z   →  ्र
  ['\xcc',   '\u0926\u094d\u0926'],         // Ì   →  द्द
  ['\xcd',   '\u091f\u094d\u091f'],         // Í   →  ट्ट
  ['\xce',   '\u091f\u094d\u0920'],         // Î   →  ट्ठ
  ['\xcf',   '\u0921\u094d\u0921'],         // Ï   →  ड्ड
  ['\xd1',   '\u0915\u0943'],               // Ñ   →  कृ
  ['\xd2',   '\u092d'],                     // Ò   →  भ
  ['\xd3',   '\u094d\u092f'],               // Ó   →  ्य
  ['\xd4',   '\u0921\u094d\u0922'],         // Ô   →  ड्ढ  (typo fixed: 0921 not 0821)
  ['\xd6',   '\u091d\u094d'],               // Ö   →  झ्
  ['\xd8',   '\u0915\u094d\u0930'],         // Ø   →  क्र
  ['\xd9',   '\u0924\u094d\u0924\u094d'],   // Ù   →  त्त्
  ['\xdck',  '\u0936'],                     // Ük  →  श
  ['\xdc',   '\u0936\u094d'],               // Ü   →  श्
  ['\u201a', '\u0949'],                     // ‚   →  ॉ
  ['kas',    '\u094b\u0902'],               // kas →  ों
  ['ks',     '\u094b'],                     // ks  →  ो
  ['kS',     '\u094c'],                     // kS  →  ौ
  ['\xa1k',  '\u093e\u0901'],               // ¡k  →  ाँ
  ['ak',     'k\u0902'],                    // ak  →  k + ं
  ['k',      '\u093e'],                     // k   →  ा
  ['ah',     '\u0940\u0902'],               // ah  →  ीं
  ['h',      '\u0940'],                     // h   →  ी
  ['aq',     '\u0941\u0902'],               // aq  →  ुं
  ['q',      '\u0941'],                     // q   →  ु
  ['aw',     '\u0942\u0902'],               // aw  →  ूं
  ['\xa1w',  '\u0942\u0901'],               // ¡w  →  ूँ
  ['w',      '\u0942'],                     // w   →  ू
  ['`',      '\u0943'],                     // `   →  ृ
  ['\u0300', '\u0943'],                     // ̀   →  ृ
  ['as',     '\u0947\u0902'],               // as  →  ें
  ['\xb1s',  's\xb1'],                      // ±s  →  s±
  ['s',      '\u0947'],                     // s   →  े
  ['aS',     '\u0948\u0902'],               // aS  →  ैं
  ['S',      '\u0948'],                     // S   →  ै
  ['a\xaa',  '\u094d\u0930\u0902'],         // aª  →  ्र + ं
  ['\xaa',   '\u094d\u0930'],               // ª   →  ्र
  ['fa',     '\u0902f'],                    // fa  →  ं + f
  ['a',      '\u0902'],                     // a   →  ं
  ['\xa1',   '\u0901'],                     // ¡   →  ँ
  ['%',      ':'],                          // %   →  :
  ['W',      '\u0945'],                     // W   →  ॅ
  ['\u2022', '\u093d'],                     // •   →  ऽ
  ['\xb7',   '\u093d'],                     // ·   →  ऽ
  ['\u2219', '\u093d'],                     // ∙   →  ऽ
  ['~j',     '\u094d\u0930'],               // ~j  →  ्र
  ['~',      '\u094d'],                     // ~   →  ्
  ['\\',     '?'],                          // \   →  ?
  ['+',      '\u093c'],                     // +   →  ़
  ['^',      '\u2018'],                     // ^   →  '
  ['*',      '\u2019'],                     // *   →  '
  ['\xde',   '\u201c'],                     // Þ   →  "
  ['\xdf',   '\u201d'],                     // ß   →  "
  ['(',      ';'],                          // (   →  ;
  ['\xbc',   '('],                          // ¼   →  (
  ['\xbd',   ')'],                          // ½   →  )
  ['\xbf',   '{'],                          // ¿   →  {
  ['\xc0',   '}'],                          // À   →  }
  ['\xbe',   '='],                          // ¾   →  =
  ['A',      '\u0964'],                     // A   →  ।
  ['-',      '.'],                          // -   →  .
  ['&',      '-'],                          // &   →  -
  ['\u03bc', '-'],                          // μ   →  -
  ['\u0152', '\u0970'],                     // Œ   →  ॰
  [']',      ','],                          // ]   →  ,
  ['@',      '/'],                          // @   →  /
  ['\xae',   '\u0948\u0902'],               // ®   →  ैं
];

/* ─────────────────────────────────────────────────────────────────────────────
   Unicode codepoint sets used during Z-repositioning and matra cleanup
───────────────────────────────────────────────────────────────────────────── */
const UNICODE_VOWEL_SIGNS = new Set([
  '\u0905','\u0906','\u0907','\u0908','\u0909','\u090a',
  '\u090f','\u0910','\u0913','\u0914',
  '\u093e','\u093f','\u0940','\u0941','\u0942','\u0943',
  '\u0947','\u0948','\u094b','\u094c',
  '\u0902','\u0903','\u0901','\u0945',
]);

const UNICODE_UNATTACHED_VOWEL_SIGNS = [
  '\u093e','\u093f','\u0940','\u0941','\u0942','\u0943',
  '\u0947','\u0948','\u094b','\u094c',
  '\u0902','\u0903','\u0901','\u0945',
];

/* ─────────────────────────────────────────────────────────────────────────────
   kru2uni  — convert a KrutiDev-encoded ASCII string to Unicode Devanagari
───────────────────────────────────────────────────────────────────────────── */
/**
 * @param {string} text  Raw KrutiDev ASCII buffer (everything the user has typed)
 * @returns {string}     Unicode Devanagari string
 */
export function kru2uni(text) {
  if (!text) return '';

  // ── Pre-processing: remove spurious space before ्र sequences ──────────────
  text = text.replace(/ (?=\xaa)/g, '');   // space + ª  →  ª
  text = text.replace(/ ~j/g, '~j');
  text = text.replace(/ z/g, 'z');

  // ── Apply K2U substitution table (sequential, left-to-right) ───────────────
  for (const [from, to] of K2U) {
    text = text.split(from).join(to);
  }

  // ── Post-K2U fixups ─────────────────────────────────────────────────────────

  // ±  →  Z + ं
  text = text.split('\xb1').join('Z\u0902');

  // Æ  →  र् + f  (r-halant before ि-matra placeholder)
  text = text.split('\xc6').join('\u0930\u094df');

  // f + char  →  char + ि   (move misplaced ि after its consonant)
  // Use iterative replace in case chained 'f' sequences exist
  {
    let prev;
    do {
      prev = text;
      text = text.replace(/f(.?)/g, (_, c) => c + '\u093f');
    } while (text !== prev);
  }

  // Ç / ¯  →  fa,   É  →  र् + fa
  text = text.split('\xc7').join('fa');
  text = text.split('\xaf').join('fa');
  text = text.split('\xc9').join('\u0930\u094dfa');

  // fa + char  →  char + िं
  {
    let prev;
    do {
      prev = text;
      text = text.replace(/fa(.?)/g, (_, c) => c + '\u093f\u0902');
    } while (text !== prev);
  }

  // Ê  →  ी + Z
  text = text.split('\xca').join('\u0940Z');

  // ि + ् + char  →  ् + char + ि   (reposition ि across halant)
  {
    let prev;
    do {
      prev = text;
      text = text.replace(/\u093f\u094d(.?)/g, (_, c) => '\u094d' + c + '\u093f');
    } while (text !== prev);
  }

  // ् + Z  →  Z   (halant before Z is redundant)
  text = text.split('\u094dZ').join('Z');

  // ── Z repositioning: move र् before the consonant+matrā cluster ─────────────
  // In KrutiDev, Z (र्) is typed AFTER the matras of its host consonant,
  // but Unicode requires र् BEFORE the consonant. We scan forward and
  // slide the र् insertion point back past any preceding vowel signs.
  {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === 'Z') {
        let j = result.length - 1;
        while (j >= 0 && UNICODE_VOWEL_SIGNS.has(result[j])) {
          j--;
        }
        // Insert र् at position j+1 (before the vowel-sign cluster)
        result = result.slice(0, j + 1) + '\u0930\u094d' + result.slice(j + 1);
      } else {
        result += text[i];
      }
    }
    text = result;
  }

  // ── Clean up illegal space / comma / halant before unattached vowel signs ───
  for (const matra of UNICODE_UNATTACHED_VOWEL_SIGNS) {
    text = text.split(' '  + matra).join(matra);
    text = text.split(',' + matra).join(matra + ',');
    text = text.split('\u094d' + matra).join(matra);
  }

  // ── Normalise double/redundant halant sequences ─────────────────────────────
  text = text.split('\u094d\u094d\u0930').join('\u094d\u0930');  // ् + ् + र  →  ् + र
  text = text.split('\u094d\u0930\u094d').join('\u0930\u094d');  // ् + र + ्  →  र + ्
  text = text.split('\u094d\u094d').join('\u094d');               // ् + ्      →  ्
  text = text.split('\u094d ').join(' ');                         // ् + space  →  space

  return text;
}
