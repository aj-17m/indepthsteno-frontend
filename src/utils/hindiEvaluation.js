/**
 * SSC Hindi Stenographer Pattern — Error Evaluation Engine v2 (Frontend copy)
 *
 * Scoring rules (SSC-accurate):
 *   Half Mistake (0.5) : exactly 1-char/matra difference  |  punctuation-only diff  |  comma diff
 *   Full Mistake (1.0) : 2+ char mismatch (substitution)  |  incomplete word  |  omission  |
 *                        extra/addition word               |  repetition
 *   Replace Error (1.0): Completely different word (dist >= 60% of longer word length)
 *   Paragraph breaks   : NOT counted as errors
 *   Numbers            : "20" == "बीस" treated as correct
 *   Chandrabindu (ँ)   : ignored in comparison
 */

const CHANDRABINDU = /\u0901/g;
const DANDA        = /[।॥]/g;
const ZERO_WIDTH   = /[\u200B-\u200D\uFEFF]/g;

const NUM_TO_HINDI = {
  '0':'शून्य','1':'एक','2':'दो','3':'तीन','4':'चार','5':'पाँच',
  '6':'छह','7':'सात','8':'आठ','9':'नौ','10':'दस','11':'ग्यारह',
  '12':'बारह','13':'तेरह','14':'चौदह','15':'पंद्रह','16':'सोलह',
  '17':'सत्रह','18':'अठारह','19':'उन्नीस','20':'बीस','21':'इक्कीस',
  '22':'बाईस','23':'तेईस','24':'चौबीस','25':'पच्चीस','26':'छब्बीस',
  '27':'सत्ताईस','28':'अट्ठाईस','29':'उनतीस','30':'तीस','31':'इकतीस',
  '32':'बत्तीस','33':'तैंतीस','34':'चौंतीस','35':'पैंतीस','36':'छत्तीस',
  '37':'सैंतीस','38':'अड़तीस','39':'उनतालीस','40':'चालीस','41':'इकतालीस',
  '42':'बयालीस','43':'तैंतालीस','44':'चवालीस','45':'पैंतालीस','46':'छियालीस',
  '47':'सैंतालीस','48':'अड़तालीस','49':'उनचास','50':'पचास',
  '60':'साठ','70':'सत्तर','80':'अस्सी','90':'नब्बे','100':'सौ',
  '1000':'हजार','100000':'लाख','10000000':'करोड़',
};
const HINDI_TO_NUM = Object.fromEntries(Object.entries(NUM_TO_HINDI).map(([k,v])=>[v,k]));

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function normaliseWord(w) {
  return w.replace(CHANDRABINDU, '').replace(ZERO_WIDTH, '').trim().toLowerCase();
}

function numericEquivalent(a, b) {
  const na = normaliseWord(a), nb = normaliseWord(b);
  if (NUM_TO_HINDI[na] === nb) return true;
  if (HINDI_TO_NUM[na] === nb) return true;
  if (na === nb) return true;
  return false;
}

/**
 * Check if token contains alphanumeric or Devanagari characters.
 * Pure punctuation tokens return false.
 */
function isWordLikeToken(token) {
  return /[A-Za-z0-9\u0900-\u097F]/.test(normaliseWord(token));
}

/**
 * Extract only the alphanumeric/Devanagari content from a token (remove punctuation).
 * Used for punctuation-aware comparisons.
 */
function extractAlphanumericContent(token) {
  return normaliseWord(token).replace(/[,।.;:!?'\-"|]/g, '');
}

function countWordLikeTokens(tokens) {
  return tokens.filter(isWordLikeToken).length;
}

function tokenise(text) {
  return text
    .replace(DANDA, ' । ')
    .replace(/[,،.]/g, ' $& ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function alignWords(masterWords, typedWords) {
  const m = masterWords.length, n = typedWords.length;
  const INF = 1e9;

  function wordCost(mi, ti) {
    if (numericEquivalent(mi, ti)) return 0;
    const a = normaliseWord(mi), b = normaliseWord(ti);
    if (a === b) return 0;
    const dist = levenshtein(a, b);
    if (dist === 1) return 0.5;
    return 1;
  }

  const dp  = Array.from({ length: m+1 }, () => new Array(n+1).fill(INF));
  const ops = Array.from({ length: m+1 }, () => new Array(n+1).fill(''));
  dp[0][0] = 0;
  for (let i = 1; i <= m; i++) { dp[i][0] = i;     ops[i][0] = 'del'; }
  for (let j = 1; j <= n; j++) { dp[0][j] = 1.5*j; ops[0][j] = 'ins'; }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sc = dp[i-1][j-1] + wordCost(masterWords[i-1], typedWords[j-1]);
      const dc = dp[i-1][j]   + 1;
      const ic = dp[i][j-1]   + 1.5;
      if (sc <= dc && sc <= ic) { dp[i][j] = sc; ops[i][j] = 'sub'; }
      else if (dc <= ic)        { dp[i][j] = dc; ops[i][j] = 'del'; }
      else                      { dp[i][j] = ic; ops[i][j] = 'ins'; }
    }
  }

  const alignment = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && ops[i][j] === 'sub') {
      alignment.unshift({ master: masterWords[i-1], typed: typedWords[j-1] });
      i--; j--;
    } else if (i > 0 && (j === 0 || ops[i][j] === 'del')) {
      alignment.unshift({ master: masterWords[i-1], typed: null });
      i--;
    } else {
      alignment.unshift({ master: null, typed: typedWords[j-1] });
      j--;
    }
  }
  return alignment;
}

function classifyPair(master, typed) {
  if (!master && typed) {
    // Only count as error if typed token contains alphanumeric content
    if (!isWordLikeToken(typed)) {
      return { status:'extra', mistakeType:'extra_punctuation', errorCategory:'none', fullScore:0, halfScore:0 };
    }
    return { status:'extra', mistakeType:'addition', errorCategory:'full', fullScore:1, halfScore:0 };
  }
  if (master && !typed) {
    // If master is pure punctuation, it's a half error (missing punctuation)
    if (!isWordLikeToken(master)) {
      return { status:'missing', mistakeType:'missing_punctuation', errorCategory:'half', fullScore:0, halfScore:1 };
    }
    // If master has alphanumeric content, it's a full error (missing word)
    return { status:'missing', mistakeType:'omission', errorCategory:'full', fullScore:1, halfScore:0 };
  }

  const mn = normaliseWord(master), tn = normaliseWord(typed);

  if (numericEquivalent(master, typed) || mn === tn) {
    return { status:'correct', mistakeType:'correct', errorCategory:'none', fullScore:0, halfScore:0 };
  }

  if (tn.length > 0 && tn.length < mn.length * 0.5) {
    return { status:'full', mistakeType:'incomplete', errorCategory:'full', fullScore:1, halfScore:0 };
  }

  const dist   = levenshtein(mn, tn);
  const maxLen = Math.max(mn.length, tn.length, 1);

  // Extract alphanumeric content (remove punctuation for comparison)
  const masterAlphaNum = extractAlphanumericContent(master);
  const typedAlphaNum = extractAlphanumericContent(typed);

  // If alphanumeric content matches exactly, but punctuation differs → half error
  // This handles: missing punctuation, extra punctuation, or different punctuation
  // Examples:
  //   "hello" vs "hello,"  → half error (extra punctuation)
  //   "hello," vs "hello"  → half error (missing punctuation)
  //   "hello," vs "hello-" → half error (different punctuation)
  if (masterAlphaNum === typedAlphaNum && masterAlphaNum.length > 0) {
    return { status:'half', mistakeType:'punctuation', errorCategory:'half', fullScore:0, halfScore:1 };
  }

  if (mn.replace(/[,।.;:!?]/g,'') === tn.replace(/[,।.;:!?]/g,'')) {
    return { status:'half', mistakeType:'punctuation', errorCategory:'half', fullScore:0, halfScore:1 };
  }
  if (mn.replace(/,/g,'') === tn.replace(/,/g,'')) {
    return { status:'half', mistakeType:'comma', errorCategory:'half', fullScore:0, halfScore:1 };
  }
  if (dist === 1) {
    return { status:'half', mistakeType:'spelling', errorCategory:'half', fullScore:0, halfScore:1 };
  }
  if (dist >= maxLen * 0.6) {
    return { status:'replace', mistakeType:'replace', errorCategory:'full', fullScore:1, halfScore:0 };
  }

  return { status:'full', mistakeType:'substitution', errorCategory:'full', fullScore:1, halfScore:0 };
}

function detectRepetitions(typedWords) {
  const repeated = new Set();
  for (let i = 1; i < typedWords.length; i++) {
    if (normaliseWord(typedWords[i]) === normaliseWord(typedWords[i-1])) {
      repeated.add(i);
    }
  }
  return repeated;
}

export function evaluateSSC(masterText, typedText) {
  const masterTokens = tokenise(masterText);
  const typedTokens  = tokenise(typedText);
  
  // Only count tokens that contain alphanumeric/Devanagari characters
  const masterWordCount = countWordLikeTokens(masterTokens);
  const typedWordTokens  = typedTokens.filter(isWordLikeToken);
  const repeated         = detectRepetitions(typedWordTokens);

  const alignment = alignWords(masterTokens, typedTokens);

  let fullMistakes  = 0;
  let halfMistakes  = 0;
  let replaceErrors = 0;
  let extraWords    = 0;
  let missingWords  = 0;
  let correctWords  = 0;

  const wordComparison = [];
  let typedWordIdx = 0;

  for (const pair of alignment) {
    let cls = classifyPair(pair.master, pair.typed);

    if (pair.typed && isWordLikeToken(pair.typed) && repeated.has(typedWordIdx)) {
      cls = { status:'full', mistakeType:'repetition', errorCategory:'full', fullScore:1, halfScore:0 };
    }

    switch (cls.status) {
      case 'correct':  correctWords++;  break;
      case 'missing':  if (isWordLikeToken(pair.master)) missingWords++;  break;
      case 'extra':    if (isWordLikeToken(pair.typed)) extraWords++;     break;
      case 'replace':  replaceErrors++; break;
      default: break;
    }

    fullMistakes += cls.fullScore;
    halfMistakes += cls.halfScore;

    wordComparison.push({
      master       : pair.master,
      typed        : pair.typed,
      status       : cls.status,
      mistakeType  : cls.mistakeType,
      errorCategory: cls.errorCategory,
    });

    if (pair.typed && isWordLikeToken(pair.typed)) typedWordIdx++;
  }

  const wrongWords = wordComparison.filter(
    w => w.status !== 'correct' && w.status !== 'missing' && w.status !== 'extra'
  ).length;

  const totalWords      = masterWordCount;
  const typedWordsCount = typedWordTokens.length;
  const totalError      = fullMistakes + halfMistakes / 2;
  const errorPercentage = totalWords > 0
    ? Math.round((totalError / totalWords) * 10000) / 100
    : 0;
  const accuracy = Math.max(0, Math.round((100 - errorPercentage) * 100) / 100);

  return {
    fullMistakes  : Math.round(fullMistakes  * 2) / 2,
    halfMistakes  : Math.round(halfMistakes  * 2) / 2,
    totalError    : Math.round(totalError    * 2) / 2,
    errorPercentage,
    accuracy,
    totalWords,
    typedWords    : typedWordsCount,
    correctWords,
    wrongWords,
    replaceErrors,
    extraWords,
    missingWords,
    wordComparison,
  };
}
