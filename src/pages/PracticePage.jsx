import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import {
  processHindiBuffer, processInscriptBuffer,
  LANGUAGE_CATEGORIES, LAYOUT_MAPS, isPassThrough, isKrutidev,
  getCategoryForLayout, FONTS,
} from '../utils/keyboardLayouts';
import { kru2uni } from '../utils/krutidevConverter';

const PRACTICE_DURATIONS = [3, 5, 10, 15, 20, 30, 45, 60];

function getSegments(text) {
  if (!text) return [];
  try {
    return [...new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(text)]
      .map(s => s.segment);
  } catch {
    return [...text];
  }
}

function fmt(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── main component ─────────────────────────────────────────────────────────── */

export default function PracticePage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // data
  const [tests,        setTests]        = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingText,  setLoadingText]  = useState(false);
  const [error,        setError]        = useState('');

  // setup / session
  const [practiceMinutes, setPracticeMinutes] = useState(30);
  const [sessionPhase,   setSessionPhase]   = useState('browse');
  const [submitting,     setSubmitting]     = useState(false);
  const [summary,        setSummary]        = useState(null);

  // typing
  const [typedText, setTypedText] = useState('');
  const [elapsed,   setElapsed]   = useState(0);
  const [started,   setStarted]   = useState(false);

  // layout / font
  const [layout, setLayout] = useState('gail');
  const [font,   setFont]   = useState(FONTS[0].value);

  // refs
  const textareaRef       = useRef(null);
  const timerRef          = useRef(null);
  const startTimeRef      = useRef(null);
  const submitLockRef     = useRef(false);
  const krutidevBufRef    = useRef('');
  const hindiBufRef       = useRef('');
  const cursorSpanRef     = useRef(null);
  const submitPracticeRef = useRef(null);

  const referenceText = selectedTest?.extractedText ?? '';
  const refSegs       = useMemo(() => getSegments(referenceText), [referenceText]);
  const typedSegs     = useMemo(() => getSegments(typedText),     [typedText]);
  const typedLen      = typedSegs.length;
  const refLen        = refSegs.length;
  const refWords      = useMemo(() => referenceText.trim().split(/\s+/).filter(Boolean), [referenceText]);
  const typedWords    = useMemo(() => typedText.trim().split(/\s+/).filter(Boolean), [typedText]);
  const practiceSeconds = Math.max(1, Number(practiceMinutes) || 30) * 60;
  const timeLeft = Math.max(0, practiceSeconds - elapsed);
  const durationPills = [3, 5, 10, 15, 20, 30, 45, 60];

  // ── load tests ─────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/user/practice-tests')
      .then(r => {
        setTests(r.data);
        if (testId) loadPracticeText(testId);
        else setLoadingTests(false);
      })
      .catch(() => { setError('Failed to load tests'); setLoadingTests(false); });
  }, [testId]);

  async function loadPracticeText(id) {
    setLoadingText(true);
    setLoadingTests(false);
    setError('');
    try {
      const r = await api.get(`/user/tests/${id}/practice`);
      setSelectedTest(r.data);
      setPracticeMinutes(r.data.timer ?? 30);
      setSessionPhase('setup');
      setSummary(null);
      resetTyping(false);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load practice text');
    } finally {
      setLoadingText(false);
    }
  }

  function resetTyping(focus = true) {
    clearInterval(timerRef.current);
    timerRef.current = null;
    startTimeRef.current = null;
    submitLockRef.current = false;
    setTypedText('');
    setElapsed(0);
    setStarted(false);
    krutidevBufRef.current = '';
    hindiBufRef.current    = '';
    if (textareaRef.current) {
      textareaRef.current.value = '';
      if (focus) setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    krutidevBufRef.current = '';
    hindiBufRef.current    = '';
  }, [layout]);

  useEffect(() => {
    if (sessionPhase !== 'typing') return;
    if (refLen > 0 && typedLen >= refLen) {
      submitPracticeRef.current?.();
    }
  }, [typedLen, refLen, sessionPhase]);

  useEffect(() => {
    if (sessionPhase !== 'typing' || !started) return;
    if (elapsed >= practiceSeconds) {
      submitPracticeRef.current?.();
    }
  }, [elapsed, practiceSeconds, sessionPhase, started]);

  // auto-scroll reference text to keep cursor visible
  useEffect(() => {
    cursorSpanRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [typedLen]);

  const startPractice = useCallback(() => {
    setError('');
    setSummary(null);
    clearInterval(timerRef.current);
    timerRef.current = null;
    startTimeRef.current = null;
    submitLockRef.current = false;
    krutidevBufRef.current = '';
    hindiBufRef.current    = '';
    setTypedText('');
    setElapsed(0);
    setStarted(false);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    setSessionPhase('typing');
    setStarted(true);
    startTimeRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const nextElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(nextElapsed);
    }, 1000);
  }, []);

  const exitPractice = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setSummary(null);
    setSessionPhase('browse');
    setSelectedTest(null);
    resetTyping(false);
  }, []);

  const backToSetup = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setSubmitting(false);
    setSummary(null);
    setSessionPhase('setup');
    resetTyping(false);
  }, []);

  const submitPractice = useCallback(async () => {
    if (!selectedTest || submitLockRef.current) return;
    submitLockRef.current = true;
    clearInterval(timerRef.current);
    timerRef.current = null;
    setSubmitting(true);
    const currentText = textareaRef.current?.value ?? typedText;
    const timeTaken = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : Math.max(1, elapsed);

    const currentWords = currentText.trim().split(/\s+/).filter(Boolean);
    const compareCount = Math.min(refWords.length, currentWords.length);
    let correctWords = 0;
    for (let i = 0; i < compareCount; i++) {
      if (refWords[i] === currentWords[i]) correctWords++;
    }

    const errors = Math.max(refWords.length, currentWords.length) - correctWords;
    const accuracy = refWords.length > 0
      ? Math.round((correctWords / refWords.length) * 100)
      : 100;
    const speed = timeTaken > 0
      ? Math.round((currentWords.length / timeTaken) * 60)
      : 0;

    setSummary({
      speed,
      accuracy,
      errors,
      timeTaken,
      typedWords: currentWords.length,
      correctWords,
    });
    setElapsed(timeTaken);
    setSessionPhase('result');
    setSubmitting(false);
    submitLockRef.current = false;
  }, [selectedTest, typedText, elapsed, refWords]);

  // keep ref in sync so auto-submit effects always call the latest version
  useEffect(() => { submitPracticeRef.current = submitPractice; }, [submitPractice]);

  // ── keyboard handler ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (sessionPhase !== 'typing' || submitting) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (isPassThrough(layout)) return; // handled by onChange

    const el = textareaRef.current;
    if (!el) return;

    const NAV = [
      'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Tab',
      'Escape','CapsLock','Shift','F1','F2','F3','F4','F5','F6','F7',
      'F8','F9','F10','F11','F12','Control','Alt','Meta',
      'PageUp','PageDown','Insert','PrintScreen',
    ];
    if (NAV.includes(e.key)) return;

    /* ── KrutiDev ── */
    if (isKrutidev(layout)) {
      e.preventDefault();
      if (e.key === 'Backspace')    { const a = [...krutidevBufRef.current]; a.pop(); krutidevBufRef.current = a.join(''); }
      else if (e.key === 'Delete')  { krutidevBufRef.current = ''; }
      else if (e.key === 'Enter')   { krutidevBufRef.current += '\n'; }
      else if (e.key.length === 1)  { krutidevBufRef.current += e.key; }
      else return;
      const uni = kru2uni(krutidevBufRef.current);
      el.value = uni;
      el.selectionStart = el.selectionEnd = uni.length;
      setTypedText(uni);
      return;
    }

    /* ── Hindi buffer (inscript / cbi / gail) ── */
    const map = LAYOUT_MAPS[layout];
    if (!map) return;
    e.preventDefault();
    if (e.key === 'Backspace')    { const a = [...hindiBufRef.current]; a.pop(); hindiBufRef.current = a.join(''); }
    else if (e.key === 'Delete')  { hindiBufRef.current = ''; }
    else if (e.key === 'Enter')   { hindiBufRef.current += '\n'; }
    else if (e.key.length === 1)  { hindiBufRef.current += e.key; }
    else return;
    const uni = layout === 'inscript'
      ? processInscriptBuffer(hindiBufRef.current)
      : processHindiBuffer(hindiBufRef.current, map);
    el.value = uni;
    el.selectionStart = el.selectionEnd = uni.length;
    setTypedText(uni);
  }, [layout, sessionPhase, submitting]);

  const handleChange = useCallback((e) => {
    if (sessionPhase !== 'typing' || !isPassThrough(layout) || submitting) return;
    const val = e.target.value;
    setTypedText(val);
  }, [layout, sessionPhase, submitting]);

  // ── layout helpers ─────────────────────────────────────────────────────────
  const activeCat = getCategoryForLayout(layout);
  const catObj    = LANGUAGE_CATEGORIES.find(c => c.value === activeCat);

  // ── loading screen ─────────────────────────────────────────────────────────
  if (loadingTests || loadingText) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)' }} />
      </div>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'var(--bg-nav)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}>
        <button type="button" onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-2)' }}
          aria-label="Go to dashboard">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black" style={{ color: 'var(--text-1)' }}>Typing Practice</h1>
          {selectedTest && (
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{selectedTest.title}</p>
          )}
        </div>
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        <div className="rounded-3xl p-5 sm:p-6 overflow-hidden relative" style={{ background:'linear-gradient(135deg,var(--bg-card),var(--bg-surface))', border:'1px solid var(--border)' }}>
          <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ background:'radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 38%), radial-gradient(circle at bottom left, rgba(16,185,129,0.10), transparent 34%)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color:'var(--text-3)' }}>Practice mode</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black" style={{ color:'var(--text-1)' }}>Simple, focused typing practice</h2>
              <p className="mt-2 text-sm sm:text-base max-w-2xl" style={{ color:'var(--text-2)' }}>
                Pick a passage, choose a duration, type at your own pace, and review only speed, accuracy, and errors at the end.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.22)' }}>
                {tests.length} assigned tests
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background:'rgba(16,185,129,0.10)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.20)' }}>
                Local result only
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </div>
        )}

        {/* ── TEST SELECTOR ── */}
        {!selectedTest && (
          <div className="rounded-3xl p-5 sm:p-6" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
              Select a test to practice
                </p>
                <p className="text-xs mt-1" style={{ color:'var(--text-3)' }}>Tap one passage to open the setup screen.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tests.map(({ test, assignmentId }) => (
                <button key={assignmentId}
                  onClick={() => loadPracticeText(test._id)}
                  className="text-left p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-100"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">📝</span>
                    <span className="font-bold text-sm leading-snug" style={{ color: 'var(--text-1)' }}>
                      {test.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {test.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-3)' }}>
                        {test.category.icon} {test.category.name}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {test.timer} min
                    </span>
                  </div>
                  <div className="mt-3 text-xs font-semibold" style={{ color:'var(--text-3)' }}>Open setup →</div>
                </button>
              ))}
              {tests.length === 0 && (
                <p className="text-sm col-span-2 text-center py-10" style={{ color: 'var(--text-3)' }}>
                  No tests assigned yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── SETUP AREA ── */}
        {selectedTest && sessionPhase !== 'typing' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-5 sm:p-6" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
              <div className="flex flex-wrap items-start gap-4 justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color:'var(--text-3)' }}>Practice setup</p>
                  <h2 className="mt-2 text-xl font-black" style={{ color:'var(--text-1)' }}>{selectedTest.title}</h2>
                  <p className="mt-1 text-sm" style={{ color:'var(--text-3)' }}>Choose a time, then start typing.</p>
                </div>
                <button
                  onClick={exitPractice}
                  className="text-xs px-3 py-2 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  Change Test
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="p-4 rounded-2xl" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--text-3)' }}>Selected content</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📝</span>
                    <span className="font-bold" style={{ color:'var(--text-1)' }}>{selectedTest.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTest.category && (
                      <span className="inline-flex text-xs px-2 py-1 rounded-full" style={{ background:'var(--bg-card)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                        {selectedTest.category.icon} {selectedTest.category.name}
                      </span>
                    )}
                    <span className="inline-flex text-xs px-2 py-1 rounded-full" style={{ background:'rgba(99,102,241,0.10)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.20)' }}>
                      {selectedTest.timer ?? 30} min default
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 max-h-28 overflow-auto" style={{ color:'var(--text-2)' }}>
                    {referenceText || 'The passage will appear here after loading.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text-3)' }}>Practice time</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {durationPills.slice(0, 4).map(minutes => (
                      <button key={minutes}
                        onClick={() => setPracticeMinutes(minutes)}
                        className="px-2 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: practiceMinutes === minutes ? 'var(--accent)' : 'var(--bg-card)',
                          color: practiceMinutes === minutes ? '#fff' : 'var(--text-2)',
                          border: `1px solid ${practiceMinutes === minutes ? 'transparent' : 'var(--border)'}`,
                        }}>
                        {minutes}m
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {durationPills.slice(4).map(minutes => (
                      <button key={minutes}
                        onClick={() => setPracticeMinutes(minutes)}
                        className="px-2 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: practiceMinutes === minutes ? 'var(--accent)' : 'var(--bg-card)',
                          color: practiceMinutes === minutes ? '#fff' : 'var(--text-2)',
                          border: `1px solid ${practiceMinutes === minutes ? 'transparent' : 'var(--border)'}`,
                        }}>
                        {minutes}m
                      </button>
                    ))}
                  </div>
                  <select
                    value={practiceMinutes}
                    onChange={e => setPracticeMinutes(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                    style={{ background:'var(--bg-card)', color:'var(--text-1)', border:'1px solid var(--border)' }}>
                    {PRACTICE_DURATIONS.map(minutes => (
                      <option key={minutes} value={minutes}>{minutes} minutes</option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs" style={{ color:'var(--text-3)' }}>
                    The timer stops automatically. You can also submit manually any time.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={startPractice}
                  className="px-5 py-3 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', boxShadow:'0 16px 40px rgba(99,102,241,0.28)' }}>
                  Start Practice
                </button>
                <button
                  onClick={() => loadPracticeText(selectedTest._id)}
                  className="px-5 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                  Reload Content
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PRACTICE AREA ── */}
        {selectedTest && sessionPhase === 'typing' && (
          <>
            <div className="rounded-3xl p-4 sm:p-5" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={exitPractice}
                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all hover:scale-105"
                    style={{ background:'rgba(239,68,68,0.12)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.24)' }}>
                    Exit
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color:'var(--text-3)' }}>Typing session</p>
                    <h3 className="mt-1 text-lg font-black truncate" style={{ color:'var(--text-1)' }}>{selectedTest.title}</h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums" style={{ background:'rgba(99,102,241,0.10)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.20)' }}>
                    {fmt(timeLeft)} left
                  </div>
                  <div className="px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums" style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                    {typedWords.length} words typed
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm" style={{ color:'var(--text-3)' }}>
                Choose a keyboard layout if needed, then type the passage. Use Submit Practice when you finish.
              </p>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Category buttons */}
              {LANGUAGE_CATEGORIES.map(cat => {
                const isActive = activeCat === cat.value;
                return (
                  <button key={cat.value}
                    onClick={() => {
                      if (cat.layouts) setLayout(cat.layouts[0].value);
                      else setLayout(cat.value);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                    style={{
                      background: isActive ? 'var(--accent)' : 'var(--bg-surface)',
                      color: isActive ? '#fff' : 'var(--text-2)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                    }}>
                    {cat.icon} {cat.label}
                  </button>
                );
              })}

              {/* Sub-layouts (Hindi only) */}
              {catObj?.layouts && (
                <div className="flex gap-1">
                  {catObj.layouts.map(sub => (
                    <button key={sub.value}
                      onClick={() => setLayout(sub.value)}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                      style={{
                        background: layout === sub.value ? 'rgba(99,102,241,0.2)' : 'var(--bg-surface)',
                        color: layout === sub.value ? '#818cf8' : 'var(--text-3)',
                        border: `1px solid ${layout === sub.value ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      }}>
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Font */}
                <select value={font} onChange={e => setFont(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-xl outline-none"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>

                {/* Change test */}
                <button
                  onClick={() => { setSelectedTest(null); setSessionPhase('browse'); resetTyping(false); }}
                  className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  Change Test
                </button>
              </div>
            </div>

            {/* ── Reference text with live highlighting ── */}
            <div className="p-5 rounded-3xl overflow-auto max-h-64 leading-loose text-[1.1rem] select-none shadow-sm"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                fontFamily: font,
                scrollBehavior: 'smooth',
              }}>
              {refSegs.map((seg, i) => {
                /* determine appearance */
                let bg = '', color = 'var(--text-1)', opacity = 0.3;
                if (i < typedLen) {
                  if (typedSegs[i] === seg) {
                    color = '#10b981'; opacity = 1;  // correct → green
                  } else {
                    bg = 'rgba(239,68,68,0.25)'; color = '#f87171'; opacity = 1; // wrong → red
                  }
                } else if (i === typedLen) {
                  bg = 'var(--accent)'; color = '#fff'; opacity = 1; // cursor
                }

                return (
                  <span key={i}
                    ref={i === typedLen ? cursorSpanRef : null}
                    style={{
                      background: bg || 'transparent',
                      color,
                      opacity,
                      borderRadius: '3px',
                      padding: bg ? '1px 1px' : '0',
                      transition: 'color 0.08s, background 0.08s',
                      whiteSpace: seg === '\n' ? 'pre' : undefined,
                    }}>
                    {seg === '\n' ? '↵\n' : seg}
                  </span>
                );
              })}
              {typedLen >= refLen && refLen > 0 && (
                <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>
              )}
            </div>

            {/* ── Typing area ── */}
            <textarea
              ref={textareaRef}
              rows={6}
              placeholder={`Start typing here${!isPassThrough(layout) ? ` (${layout})` : ''}…`}
              className="w-full resize-none rounded-3xl p-4 sm:p-5 text-[1.05rem] outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                fontFamily: font,
                caretColor: 'var(--accent)',
              }}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.18)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow   = 'none';
              }}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button onClick={() => resetTyping(true)}
                className="text-xs px-3 py-2 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                ↺ Reset
              </button>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs tabular-nums px-3 py-2 rounded-xl" style={{ color: 'var(--text-3)', background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  {typedLen} chars typed
                </span>
                <button
                  onClick={submitPractice}
                  disabled={submitting}
                  className="text-xs px-4 py-2 rounded-xl font-black transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color:'#fff' }}>
                  Submit Practice
                </button>
              </div>
            </div>
          </>
        )}

        {selectedTest && sessionPhase === 'result' && summary && (
          <div className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-3xl overflow-hidden" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'0 30px 90px rgba(0,0,0,0.55)' }}>
              <div className="p-5 sm:p-6 border-b" style={{ borderColor:'var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color:'var(--text-3)' }}>Practice complete</p>
                    <h2 className="text-2xl font-black" style={{ color:'var(--text-1)' }}>{selectedTest.title}</h2>
                    <p className="text-sm mt-2" style={{ color:'var(--text-3)' }}>Local-only result. Nothing is saved to the database.</p>
                  </div>
                  <button
                    onClick={exitPractice}
                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                    Exit
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Speed', value: `${summary.speed} WPM`, color: '#6366f1' },
                { label: 'Accuracy', value: `${summary.accuracy}%`, color: summary.accuracy >= 90 ? '#10b981' : summary.accuracy >= 70 ? '#f59e0b' : '#ef4444' },
                { label: 'Errors', value: summary.errors, color: summary.errors === 0 ? '#10b981' : '#ef4444' },
              ].map(item => (
                <div key={item.label} className="text-center p-5 rounded-2xl" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <div className="text-3xl font-black tabular-nums" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide mt-2" style={{ color:'var(--text-3)' }}>{item.label}</div>
                </div>
              ))}
                </div>

                <div className="rounded-2xl p-4" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text-3)' }}>Session details</p>
                      <p className="text-sm mt-1" style={{ color:'var(--text-2)' }}>
                        {summary.correctWords} correct out of {summary.typedWords} typed words · {fmt(summary.timeTaken)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => { setSummary(null); setSessionPhase('setup'); resetTyping(false); }}
                        className="px-5 py-3 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95"
                        style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff' }}>
                        Practice Again
                      </button>
                      <button
                        onClick={exitPractice}
                        className="px-5 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-95"
                        style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                        Change Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
