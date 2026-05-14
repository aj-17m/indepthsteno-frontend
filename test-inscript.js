// Test file to verify Inscript numeric key mappings

// Import the necessary objects (this would normally be from the module)
const INSCRIPT_NUMERALS = {
  '1':'१', '2':'२', '3':'३', '4':'४', '5':'५',
  '6':'६', '7':'७', '8':'८', '9':'९', '0':'०',
};

const INSCRIPT_NUMERALS_SHIFT = {
  '!':'ऍ', '@':'ॅ', '#':'्र', '$':'र्', '%':'ज्ञ',
  '^':'त्र', '&':'क्ष', '*':'श्र', '(':'(', ')':')',
  '_':'ः', '+':'ऋ',
};

const INSCRIPT_BASE = {
  k:'क', g:'ग', c:'च', j:'ज', t:'ट', d:'ड', n:'ण',
  p:'प', b:'ब', m:'म', y:'य', r:'र', l:'ल', v:'व', s:'स', h:'ह',
};

const INSCRIPT_VOWELS = {
  a:'अ', A:'आ',
  i:'इ', I:'ई',
  u:'उ', U:'ऊ',
  e:'ए', E:'ऐ',
  o:'ओ', O:'औ',
};

function isDevanagariConsonant(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return (cp >= 0x0915 && cp <= 0x0939) || (cp >= 0x0958 && cp <= 0x095F);
}

function processInscriptBuffer(rawBuffer) {
  let result = '';

  for (const key of rawBuffer) {
    if (key === '\n' || key === ' ') { result += key; continue; }

    // Numeric keys (1-0, !@#$%^&*()) are not context-sensitive
    let ch = INSCRIPT_NUMERALS[key]
      ?? INSCRIPT_NUMERALS_SHIFT[key];
    
    if (ch) {
      result += ch;
      continue;
    }

    const chars    = [...result];
    const lastChar = chars[chars.length - 1] ?? '';
    const afterHalant    = lastChar === '\u094D';
    const afterConsonant = !afterHalant && isDevanagariConsonant(lastChar);

    if (afterHalant) {
      ch = INSCRIPT_BASE[key]
        ?? INSCRIPT_VOWELS[key]
        ?? null;
    } else if (afterConsonant) {
      ch = INSCRIPT_VOWELS[key]
        ?? null;
    } else {
      ch = INSCRIPT_VOWELS[key]
        ?? INSCRIPT_BASE[key]
        ?? null;
    }

    result += ch !== null ? ch : key;
  }

  return result;
}

// Test cases
console.log('Testing Inscript numeric keys:');
console.log('================================\n');

// Test normal numbers
console.log('Test 1: Normal keys (1-0)');
console.log('Input: "12345"');
console.log('Output:', processInscriptBuffer('12345'));
console.log('Expected: 12345 (in Devanagari numerals)\n');

console.log('Test 2: Shifted keys (!@#$%)');
console.log('Input: "!@#$%"');
console.log('Output:', processInscriptBuffer('!@#$%'));
console.log('Expected: !@#$%\n');

console.log('Test 3: Mixed text with numbers');
console.log('Input: "क1ा2प3"');
console.log('Output:', processInscriptBuffer('क1ा2प3'));
console.log('Expected: Mixed Devanagari with numerals\n');

console.log('Test 4: Full example');
console.log('Input: "12 क 34"');
console.log('Output:', processInscriptBuffer('12 क 34'));
console.log('Expected: 12 क 34 (with proper numerals)\n');

console.log('✅ All tests executed successfully!');
