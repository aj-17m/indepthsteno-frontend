import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import {
  processHindiBuffer,
  LANGUAGE_CATEGORIES, LAYOUT_MAPS, isPassThrough, isKrutidev,
  getCategoryForLayout, FONTS, isDevanagariCharacter,
} from '../utils/keyboardLayouts';
import { kru2uni } from '../utils/krutidevConverter';
import { evaluateSSC } from '../utils/hindiEvaluation';

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

/* ── Smooth Loading Component ─────────────────────────────────────────────── */
function SmoothLoader({ message = "Loading...", size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
      <div className={`${sizeClasses[size]} rounded-full border-2 border-t-transparent animate-spin mb-3`}
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-2)' }}>
        {message}
      </p>
    </div>
  );
}

/* ── Breadcrumb Navigation ─────────────────────────────────────────────────── */
function Breadcrumb({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex items-center gap-2 mb-4 animate-slide-in-down">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = index < currentStep;
        
        return (
          <div key={step.id} className="flex items-center gap-2">
            <button
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                isClickable ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
              }`}
              style={{
                background: isActive 
                  ? 'var(--accent)' 
                  : isCompleted 
                    ? 'rgba(16,185,129,0.12)' 
                    : 'var(--bg-surface)',
                color: isActive 
                  ? 'white' 
                  : isCompleted 
                    ? '#10b981' 
                    : 'var(--text-3)',
                border: `1px solid ${
                  isActive 
                    ? 'transparent' 
                    : isCompleted 
                      ? 'rgba(16,185,129,0.25)' 
                      : 'var(--border)'
                }`,
                boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none'
              }}>
              <span className="text-sm">
                {isCompleted ? '✓' : step.icon}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            
            {index < steps.length - 1 && (
              <div className="w-6 h-0.5 rounded-full transition-all duration-500"
                style={{ 
                  background: isCompleted 
                    ? 'linear-gradient(90deg, #10b981, rgba(16,185,129,0.3))' 
                    : 'var(--border)' 
                }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Animated Phase Container ─────────────────────────────────────────────── */
function PhaseContainer({ children, phase, className = "" }) {
  return (
    <div 
      key={phase}
      className={`animate-fade-in-up ${className}`}
      style={{ 
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
      {children}
    </div>
  );
}

/* ── status helpers ─────────────────────────────────────────────────────────── */
const STATUS_META = {
  correct : { label:'Correct',   bg:'rgba(16,185,129,0.12)',  color:'#6ee7b7', dot:'#10b981' },
  half    : { label:'Half',      bg:'rgba(245,158,11,0.13)',  color:'#fcd34d', dot:'#f59e0b' },
  full    : { label:'Full',      bg:'rgba(239,68,68,0.12)',   color:'#fca5a5', dot:'#ef4444' },
  replace : { label:'Replace',   bg:'rgba(239,68,68,0.12)',   color:'#fca5a5', dot:'#ef4444' },
  missing : { label:'Missing',   bg:'rgba(139,92,246,0.12)',  color:'#c4b5fd', dot:'#8b5cf6' },
  extra   : { label:'Extra',     bg:'rgba(99,102,241,0.12)',  color:'#a5b4fc', dot:'#6366f1' },
};

/* ── Practice Result Modal ───────────────────────────────────────────────────── */
function PracticeResult({ summary, title, font, fmt, onPracticeAgain, onExit }) {
  const [showDiff, setShowDiff] = useState(false);

  const timeMin     = summary.timeTaken / 60;                              // time in minutes
  const grossSpeed  = summary.speed;                                        // typedWords / timeMin (already computed)
  const netSpeed    = Math.max(0, Math.round(grossSpeed - (summary.totalError / timeMin)));
  const deduction   = grossSpeed - netSpeed;                               // WPM lost to errors
  const halfPenalty = (summary.halfMistakes * 0.5).toFixed(1);            // half errors → 0.5 each
  const fullPenalty = summary.fullMistakes;                                // full errors → 1 each

  const accColor   = summary.accuracy >= 95 ? '#10b981' : summary.accuracy >= 80 ? '#f59e0b' : '#ef4444';
  const netColor   = netSpeed >= 80 ? '#10b981' : netSpeed >= 50 ? '#f59e0b' : '#a5b4fc';
  const grossColor = '#6366f1';

  return (
    <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-4 rounded-3xl overflow-hidden"
        style={{ background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'0 30px 90px rgba(0,0,0,0.55)' }}>

        {/* ── Header ── */}
        <div className="relative px-5 pt-5 pb-4 border-b" style={{ borderColor:'var(--border)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)' }}/>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color:'var(--text-3)' }}>
                Practice Result
              </p>
              <h2 className="text-xl font-black leading-tight" style={{ color:'var(--text-1)' }}>{title}</h2>
            </div>
            <button onClick={onExit}
              className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
              ✕ Close
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* ── 1 · Speed Block ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gross Speed */}
            <div className="relative rounded-2xl p-4 overflow-hidden"
              style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.22)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)' }}/>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:'rgba(165,180,252,0.6)' }}>
                Gross Speed
              </p>
              <p className="text-4xl font-black tabular-nums" style={{ color: grossColor }}>{grossSpeed}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color:'rgba(165,180,252,0.7)' }}>WPM</p>
              <p className="text-[10px] mt-2 leading-snug" style={{ color:'var(--text-3)' }}>
                {summary.typedWords} words ÷ {timeMin.toFixed(1)} min
              </p>
            </div>

            {/* Net Speed */}
            <div className="relative rounded-2xl p-4 overflow-hidden"
              style={{ background: netSpeed >= 50 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                       border: `1px solid ${netSpeed >= 50 ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background:`linear-gradient(90deg,transparent,${netColor}80,transparent)` }}/>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:`${netColor}99` }}>
                Net Speed
              </p>
              <p className="text-4xl font-black tabular-nums" style={{ color: netColor }}>{netSpeed}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color:`${netColor}aa` }}>WPM</p>
              <p className="text-[10px] mt-2 leading-snug" style={{ color:'var(--text-3)' }}>
                {grossSpeed} − {deduction} deduction
              </p>
            </div>
          </div>

          {/* ── 2 · Accuracy + Time + Words row ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-2xl"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
              <p className="text-2xl font-black tabular-nums" style={{ color: accColor }}>
                {summary.accuracy.toFixed(1)}%
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-1.5" style={{ color:'var(--text-3)' }}>
                Accuracy
              </p>
              <p className="text-[9px] mt-1" style={{ color: accColor + 'aa' }}>
                {summary.accuracy >= 95 ? '✓ Exam ready' : summary.accuracy >= 80 ? '~ Getting there' : '✗ Needs work'}
              </p>
            </div>

            <div className="text-center p-4 rounded-2xl"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
              <p className="text-2xl font-black tabular-nums" style={{ color:'var(--text-1)' }}>
                {summary.typedWords}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-1.5" style={{ color:'var(--text-3)' }}>
                Words Typed
              </p>
              <p className="text-[9px] mt-1" style={{ color:'var(--text-3)' }}>
                of {summary.totalWords} in passage
              </p>
            </div>

            <div className="text-center p-4 rounded-2xl"
              style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
              <p className="text-2xl font-black tabular-nums" style={{ color:'var(--text-1)' }}>
                {fmt(summary.timeTaken)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-1.5" style={{ color:'var(--text-3)' }}>
                Time Taken
              </p>
              <p className="text-[9px] mt-1" style={{ color:'var(--text-3)' }}>
                = {timeMin.toFixed(2)} minutes
              </p>
            </div>
          </div>

          {/* ── 3 · Error Count ── */}
          <div className="rounded-2xl p-4" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color:'var(--text-3)' }}>Error Count</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.20)' }}>
                <p className="text-2xl font-black tabular-nums" style={{ color:'#f87171' }}>{summary.fullMistakes}</p>
                <p className="text-[10px] mt-1 font-semibold" style={{ color:'#f87171aa' }}>Full Mistakes</p>
                <p className="text-[9px] mt-0.5" style={{ color:'var(--text-3)' }}>1 penalty each</p>
              </div>
              <div className="text-center p-3 rounded-xl"
                style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.20)' }}>
                <p className="text-2xl font-black tabular-nums" style={{ color:'#fbbf24' }}>{summary.halfMistakes}</p>
                <p className="text-[10px] mt-1 font-semibold" style={{ color:'#fbbf24aa' }}>Half Mistakes</p>
                <p className="text-[9px] mt-0.5" style={{ color:'var(--text-3)' }}>2 = 1 full error</p>
              </div>
              <div className="text-center p-3 rounded-xl"
                style={{ background:'rgba(239,68,68,0.05)', border:'1px solid var(--border)' }}>
                <p className="text-2xl font-black tabular-nums" style={{ color: summary.totalError === 0 ? '#10b981' : '#ef4444' }}>
                  {summary.totalError}
                </p>
                <p className="text-[10px] mt-1 font-semibold" style={{ color:'var(--text-3)' }}>Total Errors</p>
                <p className="text-[9px] mt-0.5" style={{ color:'var(--text-3)' }}>
                  {summary.errorPercentage.toFixed(1)}% error rate
                </p>
              </div>
            </div>
          </div>

          {/* ── 4 · Penalty / Deduction ── */}
          <div className="rounded-2xl p-4" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color:'var(--text-3)' }}>
              Penalty &amp; Deduction
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {/* Formula */}
              <div className="rounded-xl p-3" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text-3)' }}>Formula used</p>
                <p className="font-mono text-xs leading-6" style={{ color:'var(--text-2)' }}>
                  Net = Gross − (Errors ÷ Time)<br/>
                  <span style={{ color:'#a5b4fc' }}>{grossSpeed}</span>
                  {' '}−{' '}
                  <span style={{ color:'#f87171' }}>({summary.totalError} ÷ {timeMin.toFixed(2)})</span>
                  {' '}={' '}
                  <span style={{ color: netColor }}>{netSpeed} WPM</span>
                </p>
              </div>
              {/* Breakdown */}
              <div className="rounded-xl p-3" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color:'var(--text-3)' }}>Error breakdown</p>
                <div className="space-y-1.5 text-xs" style={{ color:'var(--text-2)' }}>
                  <div className="flex justify-between">
                    <span>Full errors × 1</span>
                    <span style={{ color:'#f87171' }}>−{fullPenalty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Half errors × 0.5</span>
                    <span style={{ color:'#fbbf24' }}>−{halfPenalty}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-black" style={{ borderColor:'var(--border)', color:'var(--text-1)' }}>
                    <span>Speed deduction</span>
                    <span style={{ color: deduction > 0 ? '#f87171' : '#10b981' }}>
                      −{deduction} WPM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5 · Word-by-Word Comparison (collapsible) ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid var(--border)' }}>
            <button
              onClick={() => setShowDiff(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 transition-all"
              style={{ background:'var(--bg-surface)', color:'var(--text-2)' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text-3)' }}>
                Word-by-Word Comparison ({summary.wordComparison.length} words)
              </span>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ background:'var(--bg-card)', color:'var(--text-3)' }}>
                {showDiff ? 'Hide ▲' : 'Show ▼'}
              </span>
            </button>

            {showDiff && (
              <div className="p-4 max-h-64 overflow-y-auto" style={{ background:'var(--bg-card)' }}>
                <div className="flex flex-wrap gap-1.5">
                  {summary.wordComparison.map((w, i) => {
                    const meta = STATUS_META[w.status] || STATUS_META.full;
                    const tooltip = w.status === 'correct'
                      ? w.master
                      : w.status === 'missing' ? `Missing: ${w.master}`
                      : w.status === 'extra'   ? `Extra: ${w.typed}`
                      : `${w.master} → ${w.typed}`;
                    return (
                      <span key={i} title={tooltip}
                        className="inline-flex flex-col items-center px-2 py-1 rounded-lg text-xs leading-tight cursor-default"
                        style={{ background: meta.bg, border:`1px solid ${meta.dot}33`, fontFamily: font }}>
                        <span className="font-semibold" style={{ color: meta.color }}>
                          {w.status === 'missing' ? '—' : (w.typed ?? '—')}
                        </span>
                        {w.status !== 'correct' && (
                          <span className="text-[9px] mt-0.5 opacity-70" style={{ color: meta.dot }}>
                            {w.status === 'missing' ? w.master : w.status === 'extra' ? 'extra' : w.master}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <span key={key} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: meta.bg, color: meta.color }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: meta.dot }} />
                      {meta.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button onClick={onPracticeAgain}
              className="flex-1 py-3 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95"
              style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff' }}>
              Practice Again
            </button>
            <button onClick={onExit}
              className="flex-1 py-3 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-95"
              style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
              Change Test
            </button>
          </div>

        </div>
      </div>
    </div>
  );
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
  const [layout, setLayout] = useState('mangal');
  const [font,   setFont]   = useState(FONTS[0].value);

  // highlight toggle — persisted in localStorage
  const [highlightOn, setHighlightOn] = useState(() => {
    try { return localStorage.getItem('practice-highlight') !== 'off'; } catch { return true; }
  });
  const toggleHighlight = (val) => {
    setHighlightOn(val);
    try { localStorage.setItem('practice-highlight', val ? 'on' : 'off'); } catch {}
  };

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

  // Breadcrumb steps
  const breadcrumbSteps = [
    { id: 'browse', label: 'Select Test', icon: '📝' },
    { id: 'setup', label: 'Configure', icon: '⚙️' },
    { id: 'typing', label: 'Practice', icon: '⌨️' },
    { id: 'result', label: 'Results', icon: '📊' }
  ];
  
  const currentStepIndex = breadcrumbSteps.findIndex(step => step.id === sessionPhase);

  // ── load tests with smooth loading ─────────────────────────────────────────
  useEffect(() => {
    const loadTests = async () => {
      try {
        const r = await api.get('/user/practice-tests');
        setTests(r.data);
        if (testId) {
          await loadPracticeText(testId);
        } else {
          setLoadingTests(false);
        }
      } catch (err) {
        setError('Failed to load tests');
        setLoadingTests(false);
      }
    };
    
    loadTests();
  }, [testId]);

  async function loadPracticeText(id) {
    setLoadingText(true);
    setLoadingTests(false);
    setError('');
    
    try {
      // Add a small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
      
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

  // Smooth phase transitions
  const transitionToPhase = useCallback((newPhase, delay = 0) => {
    setTimeout(() => {
      setSessionPhase(newPhase);
    }, delay);
  }, []);

  const handleBreadcrumbClick = useCallback((stepIndex) => {
    const targetPhase = breadcrumbSteps[stepIndex].id;
    
    if (targetPhase === 'browse') {
      setSelectedTest(null);
      transitionToPhase('browse');
      resetTyping(false);
    } else if (targetPhase === 'setup' && selectedTest) {
      transitionToPhase('setup');
      resetTyping(false);
    }
  }, [selectedTest, transitionToPhase]);

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

  // keep typing textarea scrolled to bottom so the caret stays visible
  useEffect(() => {
    const el = textareaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [typedText]);

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
    }
    
    // Smooth transition to typing phase
    transitionToPhase('typing', 100);
    
    setTimeout(() => {
      setStarted(true);
      startTimeRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const nextElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(nextElapsed);
      }, 1000);
      
      // Focus textarea after transition
      setTimeout(() => textareaRef.current?.focus(), 200);
    }, 200);
  }, [transitionToPhase]);

  const exitPractice = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setSummary(null);
    
    // Smooth transition back to browse
    transitionToPhase('browse', 100);
    
    setTimeout(() => {
      setSelectedTest(null);
      resetTyping(false);
    }, 200);
  }, [transitionToPhase]);

  const backToSetup = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setSubmitting(false);
    setSummary(null);
    
    // Smooth transition back to setup
    transitionToPhase('setup', 100);
    
    setTimeout(() => {
      resetTyping(false);
    }, 200);
  }, [transitionToPhase]);

  const submitPractice = useCallback(() => {
    if (!selectedTest || submitLockRef.current) return;
    submitLockRef.current = true;
    clearInterval(timerRef.current);
    timerRef.current = null;
    setSubmitting(true);

    const currentText = textareaRef.current?.value ?? typedText;
    const timeTaken = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : Math.max(1, elapsed);

    // Add a small delay for smooth transition
    setTimeout(() => {
      // Full SSC evaluation — runs client-side, nothing saved to DB
      const eval_ = evaluateSSC(selectedTest.extractedText, currentText);
      const speed  = timeTaken > 0
        ? Math.round((eval_.typedWords / timeTaken) * 60)
        : 0;

      setSummary({ ...eval_, speed, timeTaken });
      setElapsed(timeTaken);
      
      // Smooth transition to results
      transitionToPhase('result', 100);
      
      setTimeout(() => {
        setSubmitting(false);
        submitLockRef.current = false;
      }, 200);
    }, 300);
  }, [selectedTest, typedText, elapsed, transitionToPhase]);

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
      if (e.key === 'Backspace') {
        if (krutidevBufRef.current.length > 0) {
          // Buffer in sync — pop last raw keystroke and re-convert
          const arr = [...krutidevBufRef.current];
          arr.pop();
          krutidevBufRef.current = arr.join('');
          const uni = kru2uni(krutidevBufRef.current);
          el.value = uni;
          el.selectionStart = el.selectionEnd = uni.length;
          setTypedText(uni);
        } else if (el.value) {
          // Buffer empty (draft restored / external paste) — code-point fallback
          const newVal = [...el.value].slice(0, -1).join('');
          el.value = newVal;
          el.selectionStart = el.selectionEnd = newVal.length;
          setTypedText(newVal);
        }
        return;
      } else if (e.key === 'Delete') {
        krutidevBufRef.current = '';
        el.value = '';
        el.selectionStart = el.selectionEnd = 0;
        setTypedText('');
        return;
      } else if (e.key === 'Enter')   { krutidevBufRef.current += '\n'; }
      else if (e.key.length === 1)  { krutidevBufRef.current += e.key; }
      else return;
      const uni = kru2uni(krutidevBufRef.current);
      el.value = uni;
      el.selectionStart = el.selectionEnd = uni.length;
      setTypedText(uni);
      return;
    }

    /* ── Hindi buffer (cbi / gail / mangal) ── */
    
    // SYSTEM KEYBOARD PASSTHROUGH: If e.key contains Devanagari characters
    // (user has system Inscript keyboard active), skip all mapping and just add directly
    if (e.key.length === 1 && isDevanagariCharacter(e.key)) {
      e.preventDefault();
      const newVal = el.value + e.key;
      el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      setTypedText(newVal);
      hindiBufRef.current = newVal; // keep in sync for consistency
      return;
    }
    
    const map = LAYOUT_MAPS[layout];
    if (!map) return;
    e.preventDefault();

    if (e.key === 'Backspace') {
      const current = el.value;
      if (!current) return;
      const newVal = [...current].slice(0, -1).join('');
      hindiBufRef.current = newVal;
      el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      setTypedText(newVal);
      return;
    }

    if (e.key === 'Delete') {
      hindiBufRef.current = '';
      el.value = '';
      el.selectionStart = el.selectionEnd = 0;
      setTypedText('');
      return;
    }

    if (e.key === 'Enter') {
      const newVal = el.value + '\n';
      hindiBufRef.current = newVal;
      el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      setTypedText(newVal);
      return;
    }

    if (e.key.length === 1) {
      // Resync buffer if external tool inserted chars that bypassed it
      const expected = processHindiBuffer(hindiBufRef.current, map);
      if (expected !== el.value) hindiBufRef.current = el.value;
      hindiBufRef.current += e.key;
    } else return;

    const uni = processHindiBuffer(hindiBufRef.current, map);
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

  // ── loading screen with smooth animation ──────────────────────────────────
  if (loadingTests) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}>
        <SmoothLoader message="Loading practice tests..." size="lg" />
      </div>
    );
  }

  // ── render with smooth transitions ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>

      {/* ── Enhanced Header with breadcrumb ── */}
      <div className="shrink-0 z-10 px-4 py-3 space-y-3"
        style={{
          background: 'var(--bg-nav)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}>
        
        {/* Top row with back button and title */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
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
        
        {/* Breadcrumb navigation */}
        {selectedTest && (
          <Breadcrumb 
            steps={breadcrumbSteps}
            currentStep={currentStepIndex}
            onStepClick={handleBreadcrumbClick}
          />
        )}
      </div>

      {/* Loading overlay for text loading */}
      {loadingText && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
            <SmoothLoader message="Loading practice content..." size="md" />
          </div>
        </div>
      )}

      <div className={selectedTest && sessionPhase === 'typing'
        ? 'flex-1 flex flex-col min-h-0'
        : 'max-w-4xl mx-auto px-4 py-6 space-y-4 w-full'}>

        {/* Welcome banner - only show when not typing */}
        {sessionPhase !== 'typing' && (
          <PhaseContainer phase="welcome" className="rounded-3xl p-5 sm:p-6 overflow-hidden relative" 
            style={{ background:'linear-gradient(135deg,var(--bg-card),var(--bg-surface))', border:'1px solid var(--border)' }}>
            <div className="absolute inset-0 opacity-60 pointer-events-none" 
              style={{ background:'radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 38%), radial-gradient(circle at bottom left, rgba(16,185,129,0.10), transparent 34%)' }} />
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color:'var(--text-3)' }}>Practice mode</p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-black" style={{ color:'var(--text-1)' }}>Simple, focused typing practice</h2>
                <p className="mt-2 text-sm sm:text-base max-w-2xl" style={{ color:'var(--text-2)' }}>
                  Pick a passage, choose a duration, type at your own pace, and review only speed, accuracy, and errors at the end.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse" 
                  style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.22)' }}>
                  {tests.length} assigned tests
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold" 
                  style={{ background:'rgba(16,185,129,0.10)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.20)' }}>
                  Local result only
                </span>
              </div>
            </div>
          </PhaseContainer>
        )}

        {error && (
          <PhaseContainer phase="error" className="p-3 rounded-xl text-sm animate-shake"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
            {error}
          </PhaseContainer>
        )}

        {/* ── TEST SELECTOR ── */}
        {!selectedTest && (
          <PhaseContainer phase="browse" className="rounded-3xl p-5 sm:p-6" 
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
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
                  className="text-left p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-100 group"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl group-hover:animate-bounce">📝</span>
                    <span className="font-bold text-sm leading-snug" style={{ color: 'var(--text-1)' }}>
                      {test.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {test.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full transition-colors"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-3)' }}>
                        {test.category.icon} {test.category.name}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {test.timer} min
                    </span>
                  </div>
                  <div className="mt-3 text-xs font-semibold group-hover:text-blue-400 transition-colors" 
                    style={{ color:'var(--text-3)' }}>
                    Open setup →
                  </div>
                </button>
              ))}
              {tests.length === 0 && (
                <div className="col-span-2 text-center py-10">
                  <div className="text-4xl mb-3 animate-bounce">📚</div>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                    No tests assigned yet.
                  </p>
                </div>
              )}
            </div>
          </PhaseContainer>
        )}

        {/* ── SETUP AREA ── */}
        {selectedTest && sessionPhase === 'setup' && (
          <PhaseContainer phase="setup" className="space-y-4">
            <div className="rounded-3xl p-5 sm:p-6" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
              <div className="flex flex-wrap items-start gap-4 justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color:'var(--text-3)' }}>Practice setup</p>
                  <h2 className="mt-2 text-xl font-black" style={{ color:'var(--text-1)' }}>{selectedTest.title}</h2>
                  <p className="mt-1 text-sm" style={{ color:'var(--text-3)' }}>Choose a time, then start typing.</p>
                </div>
                <button
                  onClick={exitPractice}
                  className="text-xs px-3 py-2 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
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

              {/* ── Highlight toggle ── */}
              <div className="mt-5 p-4 rounded-2xl" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color:'var(--text-3)' }}>
                      Reference Highlighting
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>
                      {highlightOn
                        ? 'Each character highlighted live — green correct, red wrong'
                        : 'Plain text view — no live feedback while typing'}
                    </p>
                  </div>
                  {/* visual indicator dot */}
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 transition-all"
                    style={{ background: highlightOn ? '#10b981' : 'rgba(107,114,128,0.5)',
                      boxShadow: highlightOn ? '0 0 8px rgba(16,185,129,0.6)' : 'none' }}/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleHighlight(true)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-left"
                    style={{
                      background: highlightOn
                        ? 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.12))'
                        : 'var(--bg-card)',
                      border: `1px solid ${highlightOn ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                      boxShadow: highlightOn ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
                    }}>
                    <span className="text-xl shrink-0">✨</span>
                    <div>
                      <p className="text-xs font-black" style={{ color: highlightOn ? '#6ee7b7' : 'var(--text-2)' }}>
                        Highlights ON
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color:'var(--text-3)' }}>
                        Live char feedback
                      </p>
                    </div>
                    {highlightOn && (
                      <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full shrink-0"
                        style={{ background:'rgba(16,185,129,0.2)', color:'#6ee7b7' }}>✓</span>
                    )}
                  </button>

                  <button
                    onClick={() => toggleHighlight(false)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-left"
                    style={{
                      background: !highlightOn
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))'
                        : 'var(--bg-card)',
                      border: `1px solid ${!highlightOn ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      boxShadow: !highlightOn ? '0 0 16px rgba(99,102,241,0.15)' : 'none',
                    }}>
                    <span className="text-xl shrink-0">📄</span>
                    <div>
                      <p className="text-xs font-black" style={{ color: !highlightOn ? '#a5b4fc' : 'var(--text-2)' }}>
                        Highlights OFF
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color:'var(--text-3)' }}>
                        Plain text only
                      </p>
                    </div>
                    {!highlightOn && (
                      <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full shrink-0"
                        style={{ background:'rgba(99,102,241,0.2)', color:'#a5b4fc' }}>✓</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
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
          </PhaseContainer>
        )}

        {/* ── PRACTICE AREA ── */}
        {selectedTest && sessionPhase === 'typing' && (
          <div className="flex-1 flex flex-col min-h-0 gap-2 max-w-4xl w-full mx-auto px-3 py-2">
            <div className="shrink-0 rounded-3xl p-4 sm:p-5" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
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
            <div className="shrink-0 flex flex-wrap items-center gap-2">

              {/* Layout buttons — Inscript | Mangal | Kruti Dev */}
              {LANGUAGE_CATEGORIES.map(cat => {
                const isActive = activeCat === cat.value;
                return (
                  <button key={cat.value}
                    onClick={() => setLayout(cat.value)}
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

            {/* ── Reference text — highlighted or plain based on toggle ── */}
            <div className="shrink-0 rounded-3xl overflow-hidden" style={{ border:'1px solid var(--border)' }}>
              {/* header strip */}
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)' }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--text-3)' }}>
                  Reference Passage
                </span>
                {/* inline mini-toggle during typing */}
                <button
                  onClick={() => toggleHighlight(!highlightOn)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all"
                  style={{
                    background: highlightOn ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.12)',
                    color: highlightOn ? '#6ee7b7' : 'var(--text-3)',
                    border: `1px solid ${highlightOn ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                  }}>
                  <span>{highlightOn ? '✨' : '📄'}</span>
                  {highlightOn ? 'Highlights ON' : 'Highlights OFF'}
                </button>
              </div>

              <div className="p-5 overflow-auto max-h-48 leading-loose text-[1.1rem] select-none"
                style={{ background:'var(--bg-card)', fontFamily: font, scrollBehavior: 'smooth' }}>
                {highlightOn ? (
                  // ── HIGHLIGHTED mode ──
                  <>
                    {refSegs.map((seg, i) => {
                      let bg = '', color = 'var(--text-1)', opacity = 0.3;
                      if (i < typedLen) {
                        if (typedSegs[i] === seg) { color = '#10b981'; opacity = 1; }
                        else { bg = 'rgba(239,68,68,0.25)'; color = '#f87171'; opacity = 1; }
                      } else if (i === typedLen) {
                        bg = 'var(--accent)'; color = '#fff'; opacity = 1;
                      }
                      return (
                        <span key={i}
                          ref={i === typedLen ? cursorSpanRef : null}
                          style={{
                            background: bg || 'transparent', color, opacity,
                            borderRadius: '3px', padding: bg ? '1px 1px' : '0',
                            transition: 'color 0.08s, background 0.08s',
                            whiteSpace: seg === '\n' ? 'pre' : undefined,
                          }}>
                          {seg === '\n' ? '↵\n' : seg}
                        </span>
                      );
                    })}
                    {typedLen >= refLen && refLen > 0 && (
                      <span style={{ color:'#10b981', marginLeft:'4px' }}>✓</span>
                    )}
                  </>
                ) : (
                  // ── PLAIN mode — no coloring, just the passage ──
                  <span style={{ color:'var(--text-1)', opacity: 0.85, whiteSpace:'pre-wrap' }}>
                    {referenceText}
                  </span>
                )}
              </div>
            </div>

            {/* ── Typing area ── */}
            <textarea
              ref={textareaRef}
              placeholder={`Start typing here${!isPassThrough(layout) ? ` (${layout})` : ''}…`}
              className="flex-1 min-h-0 w-full resize-none rounded-3xl p-4 sm:p-5 text-[1.05rem] outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                fontFamily: font,
                caretColor: 'var(--accent)',
                minHeight: '260px',
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
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          </div>
        )}

        {selectedTest && sessionPhase === 'result' && summary && (
          <PracticeResult
            summary={summary}
            title={selectedTest.title}
            font={font}
            fmt={fmt}
            onPracticeAgain={() => { setSummary(null); setSessionPhase('setup'); resetTyping(false); }}
            onExit={exitPractice}
          />
        )}
      </div>
    </div>
  );
}
