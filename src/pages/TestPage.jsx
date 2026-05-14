import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CustomAudioPlayer from '../components/CustomAudioPlayer';
import { getMappedChar, processHindiBuffer, LANGUAGE_CATEGORIES, KEY_ROWS, LAYOUT_MAPS, isPassThrough, isKrutidev, getCategoryForLayout, isDevanagariCharacter } from '../utils/keyboardLayouts';
import { kru2uni } from '../utils/krutidevConverter';
import { formatTime } from '../utils/hindiUtils';
import ThemeToggle from '../components/ThemeToggle';

const PHASES = { SELECT:'select', AUDIO:'audio', TYPING:'typing', SUBMIT:'submitting' };

/**
 * Build the audio src URL.
 * - New tests: audioPath is a full Cloudinary HTTPS URL  → use as-is
 * - Old tests: audioPath is "uploads/audio/xxx.mp3"      → prefix with backend origin
 */
const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
function resolveAudioUrl(audioPath) {
  if (!audioPath) return '';
  // Cloudinary / any absolute URL — return as-is, never prefix
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) return audioPath;
  // Legacy path like "uploads/audio/xxx.mp3"
  return `${BACKEND_URL}/${audioPath}`;
}

/* ── Modal ─────────────────────────────────────────────── */
function Modal({ title, message, confirmLabel, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{background:'rgba(5,5,15,0.88)', backdropFilter:'blur(12px)'}}>
      <div className="w-80 rounded-3xl overflow-hidden animate-bounce-in"
        style={{
          background:'var(--bg-modal)',
          border:'1px solid var(--border)',
          boxShadow:'0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:`linear-gradient(90deg,transparent,${danger?'rgba(239,68,68,0.7)':'rgba(99,102,241,0.7)'},transparent)`}}/>

        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)'}}>
            {danger ? '⚠️' : '✅'}
          </div>
          <h3 className="text-lg font-black text-white mb-2">{title}</h3>
          <p className="text-sm text-white/50">{message}</p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
            style={{background:'var(--bg-surface)', color:'var(--text-2)'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-95"
            style={{
              background: danger
                ? 'linear-gradient(135deg,#dc2626,#ef4444)'
                : 'linear-gradient(135deg,#059669,#10b981)',
              boxShadow: danger
                ? '0 0 20px rgba(239,68,68,0.4)'
                : '0 0 20px rgba(16,185,129,0.4)',
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Timer Ring ─────────────────────────────────────────── */
function TimerRing({ timeLeft, total }) {
  const radius = 44;
  const circ   = 2 * Math.PI * radius;
  const pct    = total > 0 ? timeLeft / total : 1;
  const offset = circ * (1 - pct);
  const danger = timeLeft < 120;
  const warn   = timeLeft < 300;
  const color  = danger ? '#ef4444' : warn ? '#f59e0b' : '#6366f1';

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" style={{transform:'rotate(-90deg)'}}>
        <circle cx="56" cy="56" r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle cx="56" cy="56" r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{
            transition:'stroke-dashoffset 0.9s linear, stroke 0.5s ease',
            filter:`drop-shadow(0 0 6px ${color}80)`,
          }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-black ${danger ? 'text-red-400' : 'text-white'} ${danger ? 'animate-pulse' : ''}`}>
          {formatTime(timeLeft)}
        </span>
        <span className="text-xs" style={{color:'var(--text-3)'}}>left</span>
      </div>
    </div>
  );
}

/* ── Keyboard Reference Card Modal ─────────────────────── */
function KeyboardRefModal({ layout, onClose }) {
  const map = LAYOUT_MAPS[layout] || LAYOUT_MAPS.gail;
  const cat = LANGUAGE_CATEGORIES.find(c => c.value === getCategoryForLayout(layout));
  const sub = cat?.layouts?.find(l => l.value === layout);
  const layoutLabel = sub ? `${cat.label.split(' ')[0]} — ${sub.label}` : (cat?.label ?? layout);
  const layoutDesc  = sub?.desc ?? cat?.desc ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{background:'rgba(5,5,15,0.88)', backdropFilter:'blur(12px)'}}
      onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden animate-slide-in-bottom"
        style={{
          background:'var(--bg-modal)',
          border:'1px solid var(--border-hi)',
          boxShadow:'0 40px 100px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-5 py-4 flex items-center justify-between"
          style={{borderBottom:'1px solid var(--border)'}}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.7),transparent)'}}/>
          <div>
            <h3 className="font-black text-base" style={{color:'var(--text-1)'}}>
              ⌨️ {layoutLabel} — Key Reference
            </h3>
            <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>
              {layoutDesc || 'Normal keys · Shift keys shown above each key'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition hover:rotate-90 duration-300"
            style={{background:'var(--bg-surface)', color:'var(--text-2)'}}>×</button>
        </div>

        <div className="px-5 py-5 space-y-2 overflow-y-auto max-h-[70vh]">
          {KEY_ROWS.map((row, ri) => (
            <div key={ri}>
              {/* Normal row */}
              <div className="flex gap-1.5 justify-center flex-wrap">
                {row.map(k => {
                  const normal = map[k] || k;
                  const shifted = map[k.toUpperCase()] || k.toUpperCase();
                  return (
                    <div key={k}
                      className="flex flex-col items-center rounded-xl py-1.5 transition-all hover:scale-110 cursor-default"
                      style={{
                        background:'var(--bg-surface)',
                        border:'1px solid var(--border)',
                        minWidth:'48px',
                      }}>
                      {/* Shift char */}
                      <span className="text-xs font-semibold leading-none"
                        style={{color:'var(--text-3)', fontFamily:'Nirmala UI, Mangal, sans-serif'}}>
                        {shifted}
                      </span>
                      <div className="w-full my-0.5" style={{height:'1px', background:'var(--border)'}}/>
                      {/* Normal char */}
                      <span className="text-base font-black leading-none"
                        style={{color:'var(--text-1)', fontFamily:'Nirmala UI, Mangal, sans-serif'}}>
                        {normal}
                      </span>
                      {/* Key label */}
                      <span className="text-xs mt-1 font-mono"
                        style={{color:'var(--text-3)', fontSize:'10px'}}>
                        {k.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Space row */}
          <div className="flex justify-center mt-1">
            <div className="flex flex-col items-center px-10 py-1.5 rounded-xl"
              style={{background:'var(--bg-surface)', border:'1px solid var(--border)', minWidth:'160px'}}>
              <span className="text-xs font-semibold" style={{color:'var(--text-3)'}}>Space</span>
              <span className="text-xs mt-0.5 font-mono" style={{color:'var(--text-3)', fontSize:'10px'}}>SPACEBAR</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs"
            style={{color:'var(--text-3)'}}>
            <span>↑ Shift + key</span>
            <span>↓ Key alone</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function TestPage() {
  const { testId } = useParams();
  const navigate   = useNavigate();

  const [test,           setTest]           = useState(null);
  const [phase,          setPhase]          = useState(PHASES.SELECT);
  const [typedText,      setTypedText]      = useState('');
  const [timeLeft,       setTimeLeft]       = useState(0);
  const [totalTime,      setTotalTime]      = useState(0);
  const [startTime,      setStartTime]      = useState(null);
  const [error,          setError]          = useState('');
  const [pasteDetected,  setPasteDetected]  = useState(false);
  const [pasteWarning,   setPasteWarning]   = useState(false);
  const [layout,         setLayout]         = useState('mangal');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showBackConfirm,setShowBackConfirm]= useState(false);
  const [savedDraft,     setSavedDraft]     = useState(null);
  const [showKeyRef,     setShowKeyRef]     = useState(false); // draft text from localStorage
  const [isMaximized,    setIsMaximized]    = useState(false); // fullscreen mode for typing

  const timerRef           = useRef(null);
  const textareaRef        = useRef(null);
  const krutidevBufferRef  = useRef('');   // raw ASCII buffer for KrutiDev mode
  const hindiBufferRef     = useRef('');   // raw keystroke buffer for Hindi (Mangal) layouts
  const DRAFT_KEY          = `steno-draft-${testId}`;

  useEffect(() => {
    api.get(`/user/tests/${testId}`)
      .then(r => {
        console.log('[TestPage] Received test:', r.data);
        console.log('[TestPage] audioPath value:', r.data.audioPath, 'type:', typeof r.data.audioPath);
        setTest(r.data);
        // Check for a saved draft from a previous session
        const draft = localStorage.getItem(`steno-draft-${testId}`);
        if (draft && draft.trim()) setSavedDraft(draft);
      })
      .catch(err => {
        const data = err.response?.data;
        if (err.response?.status === 423 && data?.cooldownUntil) {
          const remaining = Math.ceil((new Date(data.cooldownUntil) - Date.now()) / 60000);
          setError(`Cooldown active — you can retry this test in about ${remaining} minute${remaining !== 1 ? 's' : ''}.`);
        } else {
          setError('Test not found or access denied.');
        }
      });
  }, [testId]);

  // Auto-save typed text every time it changes during typing phase
  useEffect(() => {
    if (phase === PHASES.TYPING && typedText) {
      localStorage.setItem(DRAFT_KEY, typedText);
    }
  }, [typedText, phase, DRAFT_KEY]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Reset raw keystroke buffers when layout changes (prevents stale raw input)
  useEffect(() => {
    krutidevBufferRef.current = '';
    hindiBufferRef.current = '';
  }, [layout]);

  // Keep textarea scrolled to bottom so the caret stays visible while typing
  useEffect(() => {
    const el = textareaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [typedText]);

  // Keyboard shortcuts for fullscreen (Alt+F) and ESC to exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+F for fullscreen toggle
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        if (phase === PHASES.TYPING) setIsMaximized(prev => !prev);
      }
      // ESC to exit fullscreen
      if (e.key === 'Escape' && isMaximized) {
        e.preventDefault();
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isMaximized]);

  const handleAudioEnded = useCallback(() => {
    const secs = (test?.timer ?? 30) * 60;
    setPhase(PHASES.TYPING);
    setTimeLeft(secs);
    setTotalTime(secs);
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); doSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [test]);

  const doSubmit = useCallback(async () => {
    clearInterval(timerRef.current);
    setPhase(PHASES.SUBMIT);
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : (test?.timer ?? 30) * 60;
    // Always read from DOM — avoids stale-closure issue with React state
    const currentText = textareaRef.current?.value ?? typedText;
    try {
      const res = await api.post(`/user/tests/${testId}/submit`, {
        typedText: currentText, timeTaken: elapsed, pasteDetected,
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/result/${res.data.resultId}`, {
        state: { result: res.data.result, testTitle: test?.title },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
      setPhase(PHASES.TYPING);
    }
  }, [typedText, startTime, test, testId, pasteDetected, navigate]);

  const handleKeyDown = useCallback((e) => {
    // English → full pass-through, browser handles everything
    if (isPassThrough(layout)) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const el = textareaRef.current;
    if (!el) return;

    /* ── KRUTIDEV MODE: buffer every raw keystroke, re-run kru2uni each time ── */
    if (isKrutidev(layout)) {
      const NAV = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
                   'Home','End','Tab','Escape','CapsLock','Shift',
                   'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
                   'Control','Alt','Meta','PageUp','PageDown','Insert','PrintScreen'];
      if (NAV.includes(e.key)) return; // let navigation work normally

      e.preventDefault();

      if (e.key === 'Backspace') {
        if (krutidevBufferRef.current.length > 0) {
          // Buffer in sync — pop last raw keystroke and re-convert
          const arr = [...krutidevBufferRef.current];
          arr.pop();
          krutidevBufferRef.current = arr.join('');
          const uni = kru2uni(krutidevBufferRef.current);
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
        krutidevBufferRef.current = '';
        el.value = '';
        el.selectionStart = el.selectionEnd = 0;
        setTypedText('');
        return;
      } else if (e.key === 'Enter') {
        krutidevBufferRef.current += '\n';
      } else if (e.key.length === 1) {
        // Printable key (including space): append raw char to buffer
        krutidevBufferRef.current += e.key;
      } else {
        return; // unknown multi-char key — ignore
      }

      const uni = kru2uni(krutidevBufferRef.current);
      el.value = uni;
      el.selectionStart = el.selectionEnd = uni.length;
      setTypedText(uni);
      return;
    }

    /* ── HINDI BUFFER MODE: cbi / gail / mangal ──────────────────────────── */
    // Same buffer+convert pattern as KrutiDev. processHindiBuffer applies the
    // layout map then fixes ि reordering for Remington-based layouts (GAIL/CBI).
    
    // SYSTEM KEYBOARD PASSTHROUGH: If e.key contains Devanagari characters
    // (user has system Inscript keyboard active), skip all mapping and just add directly
    if (e.key.length === 1 && isDevanagariCharacter(e.key)) {
      e.preventDefault();
      const newVal = el.value + e.key;
      el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      setTypedText(newVal);
      hindiBufferRef.current = newVal; // keep in sync for consistency
      return;
    }
    
    const map = LAYOUT_MAPS[layout];
    if (!map) return;

    const NAV = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
                 'Home','End','Tab','Escape','CapsLock','Shift',
                 'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
                 'Control','Alt','Meta','PageUp','PageDown','Insert','PrintScreen'];
    if (NAV.includes(e.key)) return;

    e.preventDefault();

    if (e.key === 'Backspace') {
      // ── Grapheme-aware delete on actual textarea content ────────────────
      // We read from el.value, NOT from hindiBufferRef, so this works
      // correctly even when an external typing tool (Gail/CBI IME, system
      // Hindi keyboard driver) inserted characters that bypassed our buffer.
      const current = el.value;
      if (!current) return;
      const newVal = [...current].slice(0, -1).join('');
      hindiBufferRef.current = newVal; // keep buffer in sync with real content
      el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      setTypedText(newVal);
      return;
    }

    if (e.key === 'Delete') {
      hindiBufferRef.current = '';
      el.value = '';
      el.selectionStart = el.selectionEnd = 0;
      setTypedText('');
      return;
    }

    if (e.key === 'Enter') {
      const newVal = el.value + '\n';
      hindiBufferRef.current = newVal;
      el.value = newVal;
      el.selectionStart = el.selectionEnd = newVal.length;
      setTypedText(newVal);
      return;
    }

    if (e.key.length === 1) {
      // If an external tool inserted chars that bypassed our buffer, resync
      // before appending the new key — prevents double-output glitches.
      const expectedFromBuf = processHindiBuffer(hindiBufferRef.current, map);
      if (expectedFromBuf !== el.value) {
        hindiBufferRef.current = el.value; // resync to actual content
      }
      hindiBufferRef.current += e.key;
    } else {
      return;
    }

    const uni = processHindiBuffer(hindiBufferRef.current, map);
    el.value = uni;
    el.selectionStart = el.selectionEnd = uni.length;
    setTypedText(uni);
  }, [layout]);

  const blockPaste = (e) => {
    e.preventDefault();
    setPasteDetected(true);
    setPasteWarning(true);
    setTimeout(() => setPasteWarning(false), 3000);
  };

  const wordCount = typedText.trim().split(/\s+/).filter(Boolean).length;

  /* ── Error / Loading states ─── */
  if (error) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{background:'linear-gradient(135deg,#0f0f1a,#1a1a2e)'}}>
      <div className="text-center p-10 rounded-3xl animate-scale-in"
        style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-bold text-red-400 mb-5">{error}</p>
        <button onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{background:'var(--accent)'}}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  if (!test) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{background:'linear-gradient(135deg,#0f0f1a,#1a1a2e)'}}>
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
      <p className="text-white/40 text-sm">Loading test…</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col"
      style={{background:'linear-gradient(135deg,var(--bg-base) 0%,var(--bg-mid) 50%,var(--bg-base) 100%)'}}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
        <div className="absolute inset-0 dot-grid opacity-30"/>
        <div className="scan-line"/>
        <div className="orb w-96 h-96 top-[-80px] left-[-80px]"
          style={{background:'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)'}}/>
        <div className="orb w-72 h-72 bottom-20 right-[-60px]"
          style={{background:'radial-gradient(circle,rgba(139,92,246,0.14) 0%,transparent 70%)',animationDelay:'2s'}}/>
      </div>

      {/* ── Header ────────────────────────────────────── */}
      <header className="relative frosted-header" style={{zIndex:100}}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-black text-white text-base truncate">{test.title}</h1>
            <p className="text-white/35 text-xs mt-0.5">Hindi Stenography Test</p>
          </div>

          {/* Phase badge or timer */}
          {phase === PHASES.TYPING && (() => {
            const urgent = timeLeft <= 60;
            return (
              <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm tabular-nums"
                style={{
                  background: urgent ? 'rgba(239,68,68,0.18)' : 'rgba(99,102,241,0.18)',
                  color: urgent ? '#f87171' : 'rgba(165,180,252,0.9)',
                  border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
                }}>
                {urgent ? '⚡' : '⏱'} {formatTime(timeLeft)}
              </div>
            );
          })()}
          {phase === PHASES.AUDIO && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{background:'rgba(99,102,241,0.2)', color:'rgba(165,180,252,0.9)',
                border:'1px solid rgba(99,102,241,0.3)'}}>
              🎧 Listen Mode
            </div>
          )}
          {phase === PHASES.SELECT && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {!isPassThrough(layout) && (
                <button
                  onClick={() => setShowKeyRef(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                  style={{background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)'}}
                  title="View keyboard layout reference">
                  ⌨️ <span className="hidden sm:inline">Key Map</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={`relative z-10 flex-1 flex flex-col mx-auto w-full ${phase === PHASES.TYPING ? 'max-w-6xl' : 'max-w-3xl px-4 py-6 space-y-4'}`}>

        {/* ── SELECT PHASE ──────────────────────────── */}
        {phase === PHASES.SELECT && (
          <div className="w-full space-y-4 animate-fade-in-up">
            {/* Settings card */}
            <div className="rounded-3xl p-6 relative overflow-hidden"
              style={{
                background:'var(--bg-card)',
                border:'1px solid var(--border)',
                boxShadow:'0 20px 60px rgba(0,0,0,0.4)',
              }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)'}}/>

              <h2 className="text-xl font-black mb-1" style={{color:'var(--text-1)'}}>Test Settings</h2>
              <p className="text-sm mb-4" style={{color:'var(--text-3)'}}>Configure before you begin</p>

              {/* Saved-draft restore banner */}
              {savedDraft && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl mb-5 animate-scale-in"
                  style={{background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.25)'}}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">💾</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{color:'#fbbf24'}}>Unsaved draft found</p>
                      <p className="text-xs truncate" style={{color:'var(--text-3)'}}>
                        {savedDraft.trim().split(/\s+/).length} words from your last session
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setTypedText(savedDraft);
                        if (textareaRef.current) {
                          textareaRef.current.value = savedDraft;
                          textareaRef.current.selectionStart =
                          textareaRef.current.selectionEnd   = savedDraft.length;
                        }
                        setSavedDraft(null);
                      }}
                      className="text-xs font-black px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                      style={{background:'rgba(245,158,11,0.25)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.35)'}}>
                      Restore
                    </button>
                    <button
                      onClick={() => { localStorage.removeItem(DRAFT_KEY); setSavedDraft(null); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                      style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Category instruction banner */}
              {test?.category?.instructions?.length > 0 && (
                <div className="rounded-2xl overflow-hidden mb-5 animate-fade-in-up"
                  style={{
                    border: `1px solid ${test.category.color}40`,
                    background: `${test.category.color}0d`,
                  }}>
                  {/* Header strip */}
                  <div className="flex items-center gap-2 px-4 py-2.5"
                    style={{ background:`${test.category.color}18`, borderBottom:`1px solid ${test.category.color}25` }}>
                    <span className="text-base">{test.category.icon}</span>
                    <span className="text-xs font-black" style={{ color: test.category.color }}>
                      {test.category.name} — Instructions
                    </span>
                  </div>
                  {/* Bullet list */}
                  <ul className="px-4 py-3 space-y-1.5">
                    {test.category.instructions.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"
                        style={{ color:'var(--text-1)', fontFamily:'Nirmala UI, Mangal, sans-serif' }}>
                        <span className="mt-0.5 shrink-0 text-xs font-black" style={{ color: test.category.color }}>▸</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fixed timer display */}
              <label className="block text-xs font-bold uppercase tracking-widest mb-3"
                style={{color:'rgba(255,255,255,0.35)'}}>
                Test Duration
              </label>
              <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl relative overflow-hidden shimmer-card"
                style={{
                  background:'linear-gradient(135deg,rgba(79,70,229,0.22),rgba(124,58,237,0.15))',
                  border:'1px solid rgba(99,102,241,0.35)',
                  boxShadow:'0 0 30px rgba(99,102,241,0.15)',
                }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{background:'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 55%)'}}/>
                {/* Clock icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
                  style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    boxShadow:'0 0 20px rgba(99,102,241,0.5)'}}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="relative z-10">
                  <p className="text-3xl font-black text-white leading-none">
                    {test.timer ?? 30}
                    <span className="text-lg font-semibold ml-1" style={{color:'rgba(165,180,252,0.75)'}}>min</span>
                  </p>
                  <p className="text-xs mt-1" style={{color:'rgba(165,180,252,0.60)'}}>
                    Set by your administrator · cannot be changed
                  </p>
                </div>
                {/* Ping dot */}
                <div className="ml-auto relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping-slow"/>
                </div>
              </div>

              {/* ── Language / Keyboard Selector ─────────────────── */}
              {(() => {
                const activeCat = getCategoryForLayout(layout);
                return (
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-widest mb-3"
                      style={{color:'rgba(255,255,255,0.35)'}}>
                      ⌨️ Keyboard Layout
                    </label>

                    {/* Layout selector — Mangal | Kruti Dev */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {LANGUAGE_CATEGORIES.map(cat => {
                        const active = activeCat === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setLayout(cat.value)}
                            className="relative px-3 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                            style={{
                              background: active
                                ? 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(124,58,237,0.25))'
                                : 'var(--bg-surface)',
                              border: active
                                ? '1px solid rgba(99,102,241,0.5)'
                                : '1px solid var(--border)',
                              boxShadow: active ? '0 0 16px rgba(99,102,241,0.2)' : 'none',
                            }}>
                            {active && (
                              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400"/>
                            )}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-base leading-none">{cat.icon}</span>
                              <p className="text-xs font-black leading-tight"
                                style={{color: active ? '#a5b4fc' : 'var(--text-1)'}}>
                                {cat.label}
                              </p>
                            </div>
                            <p className="text-[10px] leading-snug line-clamp-2"
                              style={{color:'var(--text-3)'}}>
                              {cat.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                );
              })()}

              {/* Rules */}
              <div className="rounded-2xl p-4 mb-6 space-y-2"
                style={{background:'var(--rule-bg)', border:'1px solid var(--rule-border)'}}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{color:'var(--rule-head)'}}>
                  📋 Test Rules
                </p>
                {(() => {
                  const cat = getCategoryForLayout(layout);
                  return [
                    '🔒 Master passage is hidden — type what you hear',
                    '🚫 Copy-paste is completely disabled',
                    '🔁 Audio can be replayed unlimited times',
                    '⏩ No forward seeking in audio',
                    cat === 'inscript'    && '⌨️ Inscript passthrough active — type what you hear directly',
                    cat === 'inscript'    && '📝 System keyboard input flows directly — no mapping applied',
                    cat === 'mangal'      && '⌨️ Mangal layout active — Unicode Devanagari output (no OS install needed)',
                    cat === 'mangal'      && '📝 All output is Unicode Devanagari — compatible with any Hindi font',
                    layout === 'krutidev' && '🔄 KrutiDev keys auto-convert to Unicode — evaluation works correctly',
                  ].filter(Boolean);
                })().map((r, i) => (
                  <p key={i} className="text-xs" style={{color:'var(--rule-text)'}}>{r}</p>
                ))}
              </div>

              {/* Start button */}
              <button
                onClick={() => setPhase(PHASES.AUDIO)}
                className="w-full font-black py-4 rounded-2xl text-lg transition-all active:scale-95 relative overflow-hidden"
                style={{
                  background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color:'white',
                  boxShadow:'0 0 30px rgba(99,102,241,0.4), 0 8px 20px rgba(0,0,0,0.3)',
                }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)'}}/>
                <span className="relative z-10">🚀 Start Test — {test.timer ?? 30} min</span>
              </button>
            </div>
          </div>
        )}

        {/* ── AUDIO PHASE ───────────────────────────── */}
        {phase === PHASES.AUDIO && (() => {
          console.log('[TestPage AUDIO Phase] test.audioPath:', test.audioPath, 'hasAudio:', !!(test.audioPath && test.audioPath.trim?.()));
          return (
          <div className="w-full space-y-4 animate-fade-in-up">

            {/* ── Test info card ─────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl"
              style={{
                background:'linear-gradient(135deg,rgba(79,70,229,0.22),rgba(124,58,237,0.14))',
                border:'1px solid rgba(99,102,241,0.28)',
                boxShadow:'0 20px 60px rgba(0,0,0,0.35)',
              }}>
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{background:'linear-gradient(90deg,transparent,rgba(165,180,252,0.6),transparent)'}}/>

              {/* Header row */}
              <div className="flex items-center gap-4 px-5 pt-5 pb-4"
                style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="relative shrink-0">
                  <div className="text-4xl animate-float-slow">{test.audioEnabled && test.audioPath && test.audioPath.trim() ? '🎧' : '⏭️'}</div>
                  <div className="absolute inset-0 blur-lg opacity-40 text-4xl pointer-events-none">{test.audioEnabled && test.audioPath && test.audioPath.trim() ? '🎧' : '⏭️'}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold mb-0.5 uppercase tracking-widest"
                    style={{color:'rgba(165,180,252,0.6)'}}>{test.audioEnabled && test.audioPath && test.audioPath.trim() ? 'Now Playing' : 'Audio Status'}</p>
                  <h2 className="font-black text-lg leading-tight text-white truncate">{test.title}</h2>
                  {test.category && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm">{test.category.icon}</span>
                      <span className="text-xs font-semibold"
                        style={{color: test.category.color || 'rgba(165,180,252,0.7)'}}>
                        {test.category.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x px-0"
                style={{borderBottom:'1px solid rgba(255,255,255,0.07)', divideColor:'rgba(255,255,255,0.07)'}}>
                {[
                  { icon:'⏱', label:'Duration',  value:`${test.timer ?? 30} min` },
                  { icon:'🔄', label:'Replays',   value:'Unlimited' },
                  { icon:'⌨️', label:'Layout',    value: (() => {
                    const cat = LANGUAGE_CATEGORIES.find(c => c.value === getCategoryForLayout(layout));
                    const sub = cat?.layouts?.find(l => l.value === layout);
                    return sub ? `${cat.label.split(' ')[0]} / ${sub.label}` : cat?.label ?? layout;
                  })() },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center py-3 px-2">
                    <span className="text-base mb-0.5">{icon}</span>
                    <span className="text-sm font-black text-white">{value}</span>
                    <span className="text-xs" style={{color:'rgba(255,255,255,0.35)'}}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Instructions list */}
              {(test.category?.instructions?.length > 0) && (
                <div className="px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-widest mb-3"
                    style={{color:'rgba(165,180,252,0.5)'}}>📋 Instructions</p>
                  <ul className="space-y-2">
                    {test.category.instructions.map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                          style={{
                            background: test.category.color
                              ? `${test.category.color}25`
                              : 'rgba(99,102,241,0.2)',
                            color: test.category.color || '#a5b4fc',
                          }}>{i + 1}</span>
                        <span className="text-sm leading-snug"
                          style={{
                            color:'rgba(255,255,255,0.80)',
                            fontFamily:'Nirmala UI, Mangal, sans-serif',
                          }}>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom hint */}
              <div className="flex items-center gap-2 px-5 py-3"
                style={{background:'rgba(0,0,0,0.15)'}}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" style={{animationDuration:'1.2s'}}/>
                <p className="text-xs" style={{color:'rgba(255,255,255,0.40)'}}>
                  {test.audioEnabled && test.audioPath && test.audioPath.trim() ? 'Listen as many times as needed, then click Start Typing below' : test.audioEnabled ? 'Audio will be uploaded soon. For more info, contact admin.' : 'Audio uploaded soon. For more information, contact admin.'}
                </p>
              </div>
            </div>

            {test.audioEnabled && test.audioPath && test.audioPath.trim() ? (
              <>
                <CustomAudioPlayer
                  src={resolveAudioUrl(test.audioPath)}
                />

                <button onClick={handleAudioEnded}
                  className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-95 relative overflow-hidden"
                  style={{
                    background:'linear-gradient(135deg,#059669,#10b981)',
                    boxShadow:'0 0 20px rgba(16,185,129,0.35), 0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)'}}/>
                  <span className="relative z-10">Done Listening — Start Typing →</span>
                </button>
              </>
            ) : (
              <div className="rounded-2xl p-6 text-center"
                style={{
                  background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.10))',
                  border:'1px solid rgba(99,102,241,0.25)',
                }}>
                <div className="text-5xl mb-3">⏰</div>
                <p className="text-lg font-black text-white mb-2">{test.audioEnabled ? 'Audio Coming Soon 🎵' : 'Audio Uploaded Soon 🎵'}</p>
                <p className="text-sm mb-4" style={{color:'rgba(255,255,255,0.60)'}}>
                  {test.audioEnabled ? 'The audio file will be uploaded soon. Please check back later or contact admin for updates.' : 'The audio has been uploaded. For more information or to enable audio, please contact your admin.'}
                </p>
                <p className="text-xs" style={{color:'rgba(255,255,255,0.45)'}}>
                  You can proceed with typing practice now and practice with audio when it's available.
                </p>
                <button onClick={handleAudioEnded}
                  className="w-full mt-5 py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-95 relative overflow-hidden"
                  style={{
                    background:'linear-gradient(135deg,#059669,#10b981)',
                    boxShadow:'0 0 20px rgba(16,185,129,0.35), 0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)'}}/>
                  <span className="relative z-10">Proceed to Typing →</span>
                </button>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── TYPING PHASE ──────────────────────────── */}
        {phase === PHASES.TYPING && (() => {
          const elapsed = totalTime - timeLeft;
          const liveWpm = elapsed >= 5 ? Math.round((wordCount / elapsed) * 60) : 0;
          const wpmColor = liveWpm >= 80 ? '#34d399' : liveWpm >= 50 ? '#fbbf24' : 'rgba(165,180,252,0.8)';
          return (
          <div className={isMaximized ? "fixed inset-0 z-50 flex flex-col" : "flex-1 flex flex-col gap-2 animate-fade-in-up px-3 py-2"}
            style={isMaximized ? {background:'var(--bg-base)', padding:'0.5rem'} : {}}>
            {/* Status bar */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl"
              style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
              {(() => {
                const cat    = getCategoryForLayout(layout);
                const catObj = LANGUAGE_CATEGORIES.find(c => c.value === cat);
                const subObj = catObj?.layouts?.find(l => l.value === layout);
                const badge  = subObj ? `${catObj.icon} Hindi / ${subObj.label}` : `${catObj?.icon ?? '⌨️'} ${catObj?.label ?? layout}`;
                return (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl"
                  style={{background:'rgba(99,102,241,0.2)', color:'rgba(165,180,252,0.9)'}}>
                  {badge}
                </span>
                {layout === 'krutidev' && (
                  <span className="text-xs px-2.5 py-1 rounded-xl"
                    style={{background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.20)'}}>
                    🔄 KrutiDev → Unicode live
                  </span>
                )}
                {cat === 'hindi' && (
                  <span className="text-xs px-2.5 py-1 rounded-xl"
                    style={{background:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.20)'}}>
                    🇮🇳 Unicode active
                  </span>
                )}
                {layout === 'english' && (
                  <span className="text-xs px-2.5 py-1 rounded-xl"
                    style={{background:'rgba(107,114,128,0.12)', color:'#9ca3af', border:'1px solid rgba(107,114,128,0.22)'}}>
                    🔤 English mode
                  </span>
                )}
                {/* Live WPM */}
                {liveWpm > 0 && (
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl animate-fade-in"
                    style={{background:`${wpmColor}18`, color:wpmColor, border:`1px solid ${wpmColor}35`}}>
                    ⚡ {liveWpm} WPM
                  </span>
                )}
              </div>
                );
              })()}
              {pasteWarning && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl animate-bounce-in"
                  style={{background:'rgba(239,68,68,0.2)', color:'#f87171'}}>
                  ❌ Paste blocked!
                </span>
              )}
              {pasteDetected && !pasteWarning && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                  style={{background:'rgba(239,68,68,0.1)', color:'rgba(248,113,113,0.7)'}}>
                  ⚠ Paste recorded
                </span>
              )}
            </div>

            {/* ── Focus-mode typing card ── */}
            <div className="flex-1 flex flex-col rounded-2xl relative overflow-hidden"
              style={{
                background:'var(--bg-card)',
                border:'1px solid var(--border)',
                boxShadow:'0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>

              {/* Card header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3"
                style={{borderBottom:'1px solid var(--border)'}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">✍️</span>
                  <span className="text-sm font-bold" style={{color:'var(--text-2)'}}>Type what you heard</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    title={isMaximized ? "Exit fullscreen (Esc)" : "Fullscreen (Alt+F)"}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-base"
                    style={{color:'var(--text-2)'}}
                  >
                    {isMaximized ? '⛶' : '⛶'}
                  </button>
                  <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
                    ⌨️ {(() => { const c = getCategoryForLayout(layout); const cat = LANGUAGE_CATEGORIES.find(x => x.value === c); const sub = cat?.layouts?.find(l => l.value === layout); return sub ? sub.label : cat?.label ?? layout; })()}
                  </span>
                  {wordCount > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                      style={{background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.2)'}}>
                      {wordCount} words
                    </span>
                  )}
                </div>
              </div>

              {/* The textarea itself — fills all remaining card space */}
              <textarea
                ref={textareaRef}
                onChange={e => setTypedText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={blockPaste}
                onCopy={blockPaste}
                onCut={blockPaste}
                onContextMenu={e => e.preventDefault()}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                placeholder="यहाँ टाइप करें…"
                className="w-full flex-1 resize-none"
                style={{
                  fontFamily: '"Nirmala UI", Mangal, "Noto Sans Devanagari", sans-serif',
                  fontSize: '18px',
                  lineHeight: '2',
                  letterSpacing: '0.01em',
                  minHeight: 'calc(100vh - 320px)',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-1)',
                  outline: 'none',
                  caretColor: '#818cf8',
                  display: 'block',
                }}
              />

              {/* Card footer — progress bar + phonetic hint */}
              <div className="px-5 pb-4 pt-3" style={{borderTop:'1px solid var(--border)'}}>
                {/* Progress bar */}
                <div className="h-1 rounded-full overflow-hidden mb-2" style={{background:'var(--bg-surface)'}}>
                  <div className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width:`${Math.min(100, (wordCount / 200) * 100)}%`,
                      background:'linear-gradient(90deg,#4f46e5,#7c3aed,#06b6d4)',
                      backgroundSize:'200%',
                      animation:'gradient-x 3s ease infinite',
                      boxShadow:'0 0 8px rgba(99,102,241,0.5)',
                    }}/>
                </div>

                <p className="text-xs" style={{color:'var(--text-3)'}}>
                  {wordCount} words typed · keep going!
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className={isMaximized ? "shrink-0 flex gap-3 px-3 pb-2" : "shrink-0 flex gap-3"}>
              <button onClick={() => setShowBackConfirm(true)}
                className="px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
                style={{background:'rgba(239,68,68,0.1)', color:'rgba(248,113,113,0.8)', border:'1px solid rgba(239,68,68,0.15)'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.18)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Exit
              </button>

              <button onClick={() => setShowEndConfirm(true)}
                className="ml-auto px-7 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95 flex items-center gap-2 relative overflow-hidden"
                style={{
                  background:'linear-gradient(135deg,#059669,#10b981)',
                  boxShadow:'0 0 24px rgba(16,185,129,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)'}}/>
                Submit Test
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          </div>
          );
        })()}

        {/* ── SUBMITTING ────────────────────────────── */}
        {phase === PHASES.SUBMIT && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
            {/* Animated score icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl relative"
                style={{
                  background:'var(--accent)',
                  boxShadow:'0 0 40px rgba(99,102,241,0.6), 0 16px 40px rgba(0,0,0,0.4)',
                  animation:'float 2s ease-in-out infinite',
                }}>
                <div className="absolute inset-0 rounded-3xl"
                  style={{
                    background:'linear-gradient(135deg,rgba(255,255,255,0.2) 0%,transparent 60%)',
                  }}/>
                📊
              </div>
              {/* Orbit dot */}
              <div className="absolute w-4 h-4 rounded-full"
                style={{
                  background:'#10b981',
                  boxShadow:'0 0 12px #10b981',
                  top:'50%', left:'50%',
                  transformOrigin:'-28px -28px',
                  animation:'orbit 2s linear infinite',
                  marginTop:'-8px', marginLeft:'-8px',
                }}/>
            </div>

            <div className="text-center">
              <p className="text-xl font-black text-white">Evaluating Your Test</p>
              <p className="text-sm mt-1" style={{color:'var(--text-2)'}}>
                Comparing with master passage using SSC pattern…
              </p>
            </div>

            {/* Bouncing dots */}
            <div className="flex gap-2">
              {[0,1,2,3,4].map(i => (
                <div key={i}
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{
                    background:`hsl(${240+i*20},70%,65%)`,
                    animationDelay:`${i*0.12}s`,
                    boxShadow:`0 0 8px hsl(${240+i*20},70%,65%)`,
                  }}/>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showEndConfirm && (
        <Modal
          title="Submit Test?"
          message="Are you sure you want to end and submit your answers?"
          confirmLabel="Yes, Submit ✓"
          onConfirm={() => { setShowEndConfirm(false); doSubmit(); }}
          onCancel={() => setShowEndConfirm(false)}
          danger={false}
        />
      )}
      {showBackConfirm && (
        <Modal
          title="Exit Without Submitting?"
          message="Your typed text will be lost permanently."
          confirmLabel="Exit"
          onConfirm={() => navigate('/dashboard')}
          onCancel={() => setShowBackConfirm(false)}
          danger={true}
        />
      )}
      {showKeyRef && !isPassThrough(layout) && (
        <KeyboardRefModal layout={layout} onClose={() => setShowKeyRef(false)} />
      )}
    </div>
  );
}
