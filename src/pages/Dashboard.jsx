import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';

/* ── Motivational content ──────────────────────────────── */
const QUOTES = [
  { hi: 'अभ्यास से ही निपुणता आती है।',              en: 'Practice makes perfect.' },
  { hi: 'हर शब्द एक नई शुरुआत है।',                   en: 'Every word is a new beginning.' },
  { hi: 'कठिन परिश्रम कभी व्यर्थ नहीं जाता।',        en: 'Hard work never goes to waste.' },
  { hi: 'आज का प्रयास कल की सफलता है।',               en: "Today's effort is tomorrow's success." },
  { hi: 'निरंतर अभ्यास से सफलता अवश्य मिलती है।',    en: 'Consistent practice leads to success.' },
  { hi: 'लक्ष्य निर्धारित करो और उसे प्राप्त करो।', en: 'Set your goal and achieve it.' },
  { hi: 'धैर्य और परिश्रम से सब कुछ संभव है।',       en: 'Patience and effort make anything possible.' },
];
const TIPS = [
  'Focus on accuracy first — speed follows naturally.',
  'Review mistakes in the comparison view after each test.',
  'Remington Gail layout is most common in SSC exams.',
  'Error % below 5% is considered excellent in SSC pattern.',
  'Take short breaks between sessions to retain better.',
  'Listen at normal speed once before trying faster playback.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning',   emoji: '🌅', color: '#f59e0b' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️', color: '#f97316' };
  if (h < 20) return { text: 'Good Evening',   emoji: '🌆', color: '#8b5cf6' };
  return              { text: 'Good Night',     emoji: '🌙', color: '#3b82f6' };
}

const quote    = QUOTES[new Date().getDay() % QUOTES.length];
const tip      = TIPS[new Date().getDate() % TIPS.length];
const greeting = getGreeting();

/* ── Animated counter ──────────────────────────────────── */
function AnimatedNumber({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target && target !== 0) return;
    const num = parseFloat(target);
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(+(num * eased).toFixed(typeof target === 'string' && target.includes('.') ? 2 : 0));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return <>{val}{suffix}</>;
}

/* ── Modal wrapper ─────────────────────────────────────── */
function ModalWrapper({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)'}}>
      <div className="w-full max-w-lg max-h-[82vh] flex flex-col rounded-3xl overflow-hidden animate-drop-in"
        style={{
          background:'var(--bg-modal)',
          border:'1px solid var(--border-hi)',
          boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
        {children}
      </div>
    </div>
  );
}

/* ── History Modal ─────────────────────────────────────── */
function HistoryModal({ testId, testTitle, onClose }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/user/tests/${testId}/history`)
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [testId]);

  const fmt = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';
  const errColor = p => p<=5 ? '#34d399' : p<=10 ? '#fbbf24' : '#f87171';

  return (
    <ModalWrapper onClose={onClose}>
      <div className="relative px-6 py-5 flex items-center justify-between shrink-0"
        style={{borderBottom:'1px solid var(--border)'}}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
        <div>
          <h3 className="font-black text-lg" style={{color:'var(--text-1)'}}>📋 Attempt History</h3>
          <p className="text-xs mt-0.5 truncate max-w-xs" style={{color:'var(--text-3)'}}>{testTitle}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition"
          style={{background:'var(--bg-surface)', color:'var(--text-2)', transition:'all 0.3s'}}>×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_,i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{background:'var(--bg-surface)'}}/>
          ))
        ) : history.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-5xl mb-3 animate-float">📋</div>
            <p className="font-bold" style={{color:'var(--text-2)'}}>No attempts yet</p>
            <p className="text-sm mt-1" style={{color:'var(--text-3)'}}>Start your first test!</p>
          </div>
        ) : history.map((r, i) => (
          <div key={r._id}
            className="cursor-pointer rounded-2xl p-4 transition-all animate-fade-in-up shimmer-card card-tilt"
            style={{
              animationDelay:`${i*0.05}s`,
              background:'var(--bg-surface)',
              border:'1px solid var(--border)',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hi)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}
            onClick={() => { navigate(`/result/${r._id}`); onClose(); }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{color:'var(--text-1)'}}>
                Attempt #{history.length - i}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: r.errorPercentage<=5 ? 'rgba(16,185,129,0.15)' : r.errorPercentage<=10 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    color: errColor(r.errorPercentage),
                  }}>
                  {r.errorPercentage?.toFixed(2)}% error
                </span>
                <svg className="w-4 h-4" style={{color:'var(--text-3)'}}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            <div className="h-1 rounded-full mb-3 overflow-hidden" style={{background:'var(--border)'}}>
              <div className="h-1 rounded-full animate-expand-width"
                style={{
                  width:`${Math.max(0, 100 - r.errorPercentage)}%`,
                  background:`linear-gradient(90deg, ${errColor(r.errorPercentage)}, ${errColor(r.errorPercentage)}aa)`,
                  boxShadow:`0 0 6px ${errColor(r.errorPercentage)}60`,
                }}/>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs" style={{color:'var(--text-3)'}}>
              <span>Accuracy <strong style={{color:'var(--text-2)'}}>{r.accuracy?.toFixed(1)}%</strong></span>
              <span>WPM <strong style={{color:'var(--text-2)'}}>{r.wpm}</strong></span>
              <span>Time <strong style={{color:'var(--text-2)'}}>{fmt(r.timeTaken)}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
}

/* ── Test Card ─────────────────────────────────────────── */
function TestCard({ test, onStart, onHistory, onLeaderboard, onPractice, index, attempts, best, cooldownUntil }) {
  const [hovered, setHovered] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const cooldownMs = cooldownUntil ? Math.max(0, new Date(cooldownUntil).getTime() - now) : 0;
  const inCooldown = cooldownMs > 0;

  const fmtCd = (ms) => {
    const s = Math.ceil(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const diffColor = () => {
    if (!best) return null;
    const e = best.errorPercentage;
    if (e <= 2)  return { c:'#10b981', label:'Excellent' };
    if (e <= 5)  return { c:'#3b82f6', label:'Very Good' };
    if (e <= 10) return { c:'#f59e0b', label:'Good' };
    return              { c:'#ef4444', label:'Practice' };
  };
  const rating = diffColor();

  return (
    <div
      className="relative overflow-hidden rounded-3xl transition-all duration-350 shimmer-card glow-border"
      style={{
        background: inCooldown
          ? 'rgba(245,158,11,0.04)'
          : hovered ? 'var(--bg-surface)' : 'var(--bg-card)',
        border: inCooldown
          ? '1px solid rgba(245,158,11,0.25)'
          : `1px solid ${hovered ? 'var(--border-hi)' : 'var(--border)'}`,
        boxShadow: inCooldown
          ? '0 4px 20px rgba(245,158,11,0.08)'
          : hovered
            ? '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--border-hi)'
            : '0 4px 20px rgba(0,0,0,0.2)',
        transform: hovered && !inCooldown ? 'translateY(-4px)' : 'translateY(0)',
        animationDelay: `${index * 0.08}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl overflow-hidden">
        <div className="h-full transition-all duration-500"
          style={{
            background: hovered ? 'var(--accent)' : 'transparent',
            boxShadow: hovered ? '0 0 12px var(--accent-glow)' : 'none',
          }}/>
      </div>

      {rating && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold animate-pop-in"
          style={{
            background: `${rating.c}20`,
            border: `1px solid ${rating.c}40`,
            color: rating.c,
          }}>
          <div className="w-1.5 h-1.5 rounded-full animate-ping-slow" style={{background: rating.c}}/>
          {rating.label}
        </div>
      )}

      <div className="p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: hovered ? 'var(--accent)' : 'var(--bg-surface)',
              boxShadow: hovered ? '0 0 24px var(--accent-glow)' : 'none',
              transform: hovered ? 'rotate(-6deg) scale(1.08)' : 'rotate(0) scale(1)',
            }}>
            <svg className="w-7 h-7 transition-colors" style={{color: hovered ? 'white' : 'var(--text-2)'}}
              fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
          </div>
          {hovered && (
            <div className="absolute inset-0 rounded-2xl border-2 animate-ping-slow"
              style={{borderColor:'var(--border-hi)'}}/>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-base truncate mb-1" style={{color:'var(--text-1)'}}>{test.title}</h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
              style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
              ⏱ {test.timer ?? 30} min
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
              style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
              🔄 {test.maxReplays ?? 2} replays
            </span>
          </div>

          {best && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{color: rating?.c}}>
                  🏆 Best: {best.errorPercentage?.toFixed(2)}% error
                </span>
                <span className="text-xs" style={{color:'var(--text-3)'}}>
                  {best.accuracy?.toFixed(0)}% acc
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                <div className="score-bar" style={{
                  width: `${Math.max(5, 100 - (best.errorPercentage || 0))}%`,
                  background: `linear-gradient(90deg, ${rating?.c}, ${rating?.c}cc)`,
                  boxShadow: `0 0 8px ${rating?.c}50`,
                }}/>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {inCooldown ? (
            <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl text-center"
              style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.28)' }}>
              <span className="text-base leading-none">⏳</span>
              <span className="text-xs font-black tabular-nums" style={{ color:'#fbbf24' }}>{fmtCd(cooldownMs)}</span>
              <span className="text-[10px] font-semibold" style={{ color:'rgba(251,191,36,0.55)' }}>cooldown</span>
            </div>
          ) : (
            <button onClick={onStart}
              className="font-black px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95 flex items-center gap-1.5 text-white relative overflow-hidden"
              style={{
                background:'var(--accent)',
                boxShadow: hovered ? '0 0 24px var(--accent-glow)' : '0 4px 12px rgba(0,0,0,0.25)',
              }}>
              <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all"/>
              <svg className="w-3.5 h-3.5 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
              <span className="relative z-10">Start</span>
            </button>
          )}
          <div className="flex gap-1.5">
            {attempts > 0 && (
              <button onClick={onHistory}
                className="flex-1 text-xs py-1.5 px-2 rounded-xl transition-all text-center font-semibold hover:scale-105"
                style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--text-1)'; e.currentTarget.style.borderColor='var(--border-hi)';}}
                onMouseLeave={e=>{e.currentTarget.style.color='var(--text-3)'; e.currentTarget.style.borderColor='var(--border)';}}>
                {attempts} {attempts === 1 ? 'try' : 'tries'}
              </button>
            )}
            <button onClick={onLeaderboard}
              className="flex-1 text-xs py-1.5 px-2 rounded-xl transition-all text-center font-bold hover:scale-105"
              style={{background:'rgba(245,158,11,0.1)', color:'rgba(251,191,36,0.75)', border:'1px solid rgba(245,158,11,0.15)'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(245,158,11,0.22)'; e.currentTarget.style.color='#fbbf24';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(245,158,11,0.1)'; e.currentTarget.style.color='rgba(251,191,36,0.75)';}}>
              🏆 Rank
            </button>
          </div>
          <button onClick={onPractice}
            className="w-full text-xs py-1.5 px-2 rounded-xl transition-all text-center font-semibold hover:scale-105"
            style={{background:'rgba(6,182,212,0.08)', color:'rgba(6,182,212,0.75)', border:'1px solid rgba(6,182,212,0.15)'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(6,182,212,0.18)'; e.currentTarget.style.color='#22d3ee';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(6,182,212,0.08)'; e.currentTarget.style.color='rgba(6,182,212,0.75)';}}>
            ✏️ Practice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Bar ─────────────────────────────────────────── */
function StatsBar({ results }) {
  if (!results || !results.length) return null;

  const best = [...results].sort((a,b) => a.errorPercentage - b.errorPercentage)[0];
  const stats = {
    total  : results.length,
    avgAcc : (results.reduce((s,r) => s+(r.accuracy||0), 0)/results.length).toFixed(1),
    bestErr: best.errorPercentage?.toFixed(2),
    avgWpm : Math.round(results.reduce((s,r) => s+(r.wpm||0), 0)/results.length),
  };

  const cards = [
    { label:'Tests Done',   value: stats.total,           suffix:'',    icon:'📋', grad:'135deg,#4f46e5,#6366f1', glow:'rgba(99,102,241,0.35)' },
    { label:'Avg Accuracy', value: parseFloat(stats.avgAcc), suffix:'%', icon:'🎯', grad:'135deg,#059669,#10b981', glow:'rgba(16,185,129,0.35)' },
    { label:'Best Error',   value: parseFloat(stats.bestErr),suffix:'%', icon:'⭐', grad:'135deg,#d97706,#f59e0b', glow:'rgba(245,158,11,0.35)' },
    { label:'Avg Speed',    value: stats.avgWpm,           suffix:' wpm',icon:'⚡', grad:'135deg,#7c3aed,#8b5cf6', glow:'rgba(139,92,246,0.35)' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{animationDelay:'0.15s'}}>
      {cards.map((s, i) => (
        <div key={s.label}
          className="relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-105 hover:-translate-y-1 shimmer-card"
          style={{
            animationDelay:`${i*0.07}s`,
            background:`linear-gradient(${s.grad})`,
            boxShadow:`0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)`,
            cursor:'default',
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{background:'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%)'}}/>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-xl pointer-events-none"
            style={{background: s.glow}}/>
          <div className="relative z-10">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-black text-white tracking-tight">
              <AnimatedNumber target={s.value} suffix={s.suffix}/>
            </p>
            <p className="text-xs text-white/70 font-semibold mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tab Navigation ────────────────────────────────────── */
const TABS = [
  { id: 'tests',       label: 'Steno Test',  icon: '⌨️', shortLabel: 'Steno' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', shortLabel: 'Ranks' },
  { id: 'profile',     label: 'Profile',     icon: '👤', shortLabel: 'Profile' },
  { id: 'practice',    label: 'Practice',    icon: '✏️',  shortLabel: 'Practice' },
];

function NavTabs({ active, onChange, onPracticeClick }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl"
      style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => {
            if (tab.id === 'practice') {
              onPracticeClick();
            } else {
              onChange(tab.id);
            }
          }}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 select-none"
          style={{
            background: active === tab.id ? (tab.id === 'practice' ? 'rgba(6,182,212,0.22)' : 'var(--accent)') : 'transparent',
            color: active === tab.id ? (tab.id === 'practice' ? '#22d3ee' : 'white') : 'var(--text-3)',
            boxShadow: active === tab.id ? `0 4px 12px ${tab.id === 'practice' ? 'rgba(6,182,212,0.4)' : 'var(--accent-glow)'}` : 'none',
            border: active === tab.id && tab.id === 'practice' ? '1px solid rgba(6,182,212,0.35)' : 'none',
          }}
          onMouseEnter={e => { if (active !== tab.id) e.currentTarget.style.color = 'var(--text-1)'; }}
          onMouseLeave={e => { if (active !== tab.id) e.currentTarget.style.color = 'var(--text-3)'; }}>
          <span>{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Leaderboard Tab ───────────────────────────────────── */
function LeaderboardTab({ tests }) {
  const [selectedTest, setSelectedTest] = useState(null);
  const [entries,      setEntries]      = useState([]);
  const [loading,      setLoading]      = useState(false);

  const medal    = r => r===1?'🥇':r===2?'🥈':r===3?'🥉':r;
  const errColor = p => p<=5?'#34d399':p<=10?'#fbbf24':'#f87171';
  const fmt      = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';

  const openLeaderboard = (test) => {
    setSelectedTest(test);
    setLoading(true);
    api.get(`/user/tests/${test._id}/leaderboard`)
      .then(r => setEntries(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  if (selectedTest) {
    return (
      <div className="animate-fade-in-up space-y-4">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTest(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)'}}>
            ← Back
          </button>
          <div className="flex-1 px-4 py-2 rounded-xl"
            style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
            <p className="text-xs font-bold truncate" style={{color:'var(--text-1)'}}>🏆 {selectedTest.title}</p>
          </div>
        </div>

        {/* Leaderboard list */}
        <div className="rounded-3xl overflow-hidden"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          {/* Header row */}
          <div className="px-5 py-3 flex items-center gap-3 text-xs font-bold"
            style={{borderBottom:'1px solid var(--border)', color:'var(--text-3)', background:'var(--bg-card)'}}>
            <span className="w-8 text-center">#</span>
            <span className="flex-1">Student</span>
            <span className="w-16 text-right">Error %</span>
            <span className="w-16 text-right hidden sm:block">WPM</span>
            <span className="w-16 text-right hidden sm:block">Accuracy</span>
          </div>

          <div className="divide-y" style={{divideColor:'var(--border)'}}>
            {loading ? (
              [...Array(5)].map((_,i) => (
                <div key={i} className="h-14 animate-pulse mx-4 my-2 rounded-xl"
                  style={{background:'var(--bg-card)', animationDelay:`${i*0.07}s`}}/>
              ))
            ) : entries.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-3">📊</div>
                <p className="font-bold" style={{color:'var(--text-2)'}}>No attempts yet</p>
                <p className="text-sm mt-1" style={{color:'var(--text-3)'}}>Be the first to complete this test!</p>
              </div>
            ) : entries.map((e, i) => (
              <div key={i}
                className="flex items-center gap-3 px-5 py-3.5 transition-all animate-fade-in-up"
                style={{
                  animationDelay:`${i*0.04}s`,
                  background: e.isMe ? 'rgba(16,185,129,0.08)' : 'transparent',
                  borderLeft: e.isMe ? '3px solid #10b981' : '3px solid transparent',
                }}>
                <div className="w-8 text-center text-xl shrink-0">{medal(e.rank)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate"
                      style={{color: e.isMe ? '#34d399' : 'var(--text-1)'}}>
                      {e.name}
                    </span>
                    {e.isMe && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0"
                        style={{background:'rgba(16,185,129,0.2)', color:'#34d399'}}>You</span>
                    )}
                  </div>
                  <p className="text-xs" style={{color:'var(--text-3)'}}>
                    {fmt(e.timeTaken)}
                  </p>
                </div>
                <span className="w-16 text-right text-base font-black" style={{color:errColor(e.errorPercentage)}}>
                  {e.errorPercentage?.toFixed(2)}%
                </span>
                <span className="w-16 text-right text-sm font-semibold hidden sm:block" style={{color:'var(--text-2)'}}>
                  {e.wpm} wpm
                </span>
                <span className="w-16 text-right text-sm font-semibold hidden sm:block" style={{color:'var(--text-2)'}}>
                  {e.accuracy?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {entries.length > 0 && (
            <div className="px-5 py-3 text-xs text-center"
              style={{borderTop:'1px solid var(--border)', color:'var(--text-3)'}}>
              Ranked by lowest error % · SSC pattern scoring
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black flex items-center gap-2" style={{color:'var(--text-1)'}}>
          <span>🏆</span> Leaderboard
        </h3>
        <span className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
          {tests.length} tests
        </span>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-3xl p-16 text-center"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="text-5xl mb-4 animate-float">🏆</div>
          <p className="font-black text-lg mb-1" style={{color:'var(--text-2)'}}>No tests yet</p>
          <p className="text-sm" style={{color:'var(--text-3)'}}>Tests will appear here once assigned</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(({ test }, i) => (
            <button key={test._id}
              className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] animate-fade-in-up shimmer-card"
              style={{
                background:'var(--bg-surface)',
                border:'1px solid var(--border)',
                animationDelay:`${i*0.06}s`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hi)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}
              onClick={() => openLeaderboard(test)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.22)'}}>
                  🏆
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate" style={{color:'var(--text-1)'}}>{test.title}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{color:'var(--text-3)'}}>
                    <span>⏱ {test.timer ?? 30} min</span>
                    <span>·</span>
                    <span>🔄 {test.maxReplays ?? 2} replays</span>
                    {test.category && (
                      <>
                        <span>·</span>
                        <span>{test.category.icon} {test.category.name}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl"
                  style={{background:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.22)'}}>
                  View Ranks
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Profile Tab ───────────────────────────────────────── */
function ProfileTab({ user }) {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/user/profile')
      .then(r => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const errColor  = p => p<=5 ? '#34d399' : p<=10 ? '#fbbf24' : '#f87171';
  const fmt       = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';
  const fmtDate   = d => d ? new Date(d).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) : '—';
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        {[1,2,3].map(i => (
          <div key={i} className="h-28 rounded-3xl animate-pulse" style={{background:'var(--bg-surface)', animationDelay:`${i*0.1}s`}}/>
        ))}
      </div>
    );
  }

  const stats = profile?.stats;
  const tests = profile?.tests || [];
  const recent = profile?.recentResults || [];

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── User info card ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6"
        style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-30"
          style={{background:'radial-gradient(ellipse at top right,rgba(99,102,241,0.35) 0%,transparent 70%)'}}/>

        <div className="relative flex items-center gap-5">
          {/* Big avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl text-white shrink-0"
            style={{background:'linear-gradient(135deg,var(--accent),#7c3aed)', boxShadow:'0 0 30px var(--accent-glow)'}}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black truncate" style={{color:'var(--text-1)'}}>{user?.name}</h3>
            <p className="text-sm mt-0.5 truncate" style={{color:'var(--text-3)'}}>{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold capitalize"
                style={{background:'rgba(99,102,241,0.15)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.25)'}}>
                👤 {user?.role}
              </span>
              {profile?.user?.accessExpiry && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.22)'}}>
                  ✅ Valid till {fmtDate(profile.user.accessExpiry)}
                </span>
              )}
              {profile?.user?.memberSince && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{background:'var(--bg-card)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
                  📅 Since {fmtDate(profile.user.memberSince)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overall stats ─────────────────────────────── */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'Total Attempts', value: stats.total,           suffix:'',    icon:'📋', grad:'135deg,#4f46e5,#6366f1' },
            { label:'Avg Accuracy',   value: stats.avgAcc,          suffix:'%',   icon:'🎯', grad:'135deg,#059669,#10b981' },
            { label:'Best Error',     value: stats.bestErr ?? '—',  suffix: stats.bestErr != null ? '%' : '', icon:'⭐', grad:'135deg,#d97706,#f59e0b' },
            { label:'Avg Speed',      value: stats.avgWpm,          suffix:' wpm',icon:'⚡', grad:'135deg,#7c3aed,#8b5cf6' },
          ].map((s, i) => (
            <div key={s.label}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{background:`linear-gradient(${s.grad})`, boxShadow:'0 6px 20px rgba(0,0,0,0.25)'}}>
              <div className="absolute inset-0 pointer-events-none"
                style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 55%)'}}/>
              <div className="relative z-10">
                <div className="text-xl mb-1.5">{s.icon}</div>
                <p className="text-xl font-black text-white">
                  {typeof s.value === 'number'
                    ? <AnimatedNumber target={s.value} suffix={s.suffix}/>
                    : s.value}
                </p>
                <p className="text-xs text-white/70 font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Per-test best scores ───────────────────────── */}
      {tests.length > 0 && (
        <div className="rounded-3xl overflow-hidden"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="px-5 py-3.5 flex items-center gap-2"
            style={{borderBottom:'1px solid var(--border)', background:'var(--bg-card)'}}>
            <span className="text-base">📊</span>
            <h4 className="font-black text-sm" style={{color:'var(--text-1)'}}>Per-Test Performance</h4>
          </div>
          <div className="divide-y" style={{divideColor:'var(--border)'}}>
            {tests.map((t, i) => {
              const rating = t.best
                ? t.best.errorPercentage <= 2  ? { c:'#10b981', label:'Excellent' }
                : t.best.errorPercentage <= 5  ? { c:'#3b82f6', label:'Very Good' }
                : t.best.errorPercentage <= 10 ? { c:'#f59e0b', label:'Good' }
                : { c:'#ef4444', label:'Practice' }
                : null;
              return (
                <div key={i} className="px-5 py-4 animate-fade-in-up" style={{animationDelay:`${i*0.05}s`}}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black truncate flex-1 mr-3" style={{color:'var(--text-1)'}}>{t.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {rating && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{background:`${rating.c}20`, color:rating.c, border:`1px solid ${rating.c}35`}}>
                          {rating.label}
                        </span>
                      )}
                      <span className="text-xs" style={{color:'var(--text-3)'}}>{t.attempts} tries</span>
                    </div>
                  </div>
                  {t.best && (
                    <>
                      <div className="flex items-center gap-3 text-xs mb-1.5" style={{color:'var(--text-3)'}}>
                        <span>Best Error: <strong style={{color: rating?.c}}>{t.best.errorPercentage?.toFixed(2)}%</strong></span>
                        <span>·</span>
                        <span>Acc: <strong style={{color:'var(--text-2)'}}>{t.best.accuracy?.toFixed(1)}%</strong></span>
                        <span>·</span>
                        <span>WPM: <strong style={{color:'var(--text-2)'}}>{t.best.wpm}</strong></span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width:`${Math.max(5, 100 - t.best.errorPercentage)}%`,
                            background:`linear-gradient(90deg, ${rating?.c ?? '#6366f1'}, ${rating?.c ?? '#6366f1'}cc)`,
                          }}/>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent attempts ────────────────────────────── */}
      {recent.length > 0 && (
        <div className="rounded-3xl overflow-hidden"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{borderBottom:'1px solid var(--border)', background:'var(--bg-card)'}}>
            <div className="flex items-center gap-2">
              <span className="text-base">🕐</span>
              <h4 className="font-black text-sm" style={{color:'var(--text-1)'}}>Recent Attempts</h4>
            </div>
            <span className="text-xs" style={{color:'var(--text-3)'}}>{recent.length} shown</span>
          </div>
          <div className="divide-y" style={{divideColor:'var(--border)'}}>
            {recent.map((r, i) => (
              <button key={r._id}
                className="w-full text-left px-5 py-4 transition-all hover:bg-white/[0.02] animate-fade-in-up"
                style={{animationDelay:`${i*0.04}s`}}
                onClick={() => navigate(`/result/${r._id}`)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{color:'var(--text-1)'}}>
                      {r.testId?.title || 'Untitled Test'}
                    </p>
                    <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                      {' · '}{fmt(r.timeTaken)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{
                        background: r.errorPercentage<=5 ? 'rgba(16,185,129,0.14)' : r.errorPercentage<=10 ? 'rgba(245,158,11,0.14)' : 'rgba(239,68,68,0.14)',
                        color: errColor(r.errorPercentage),
                      }}>
                      {r.errorPercentage?.toFixed(2)}% err
                    </span>
                    <span className="text-xs font-semibold" style={{color:'var(--text-3)'}}>{r.wpm} wpm</span>
                    <svg className="w-4 h-4" style={{color:'var(--text-3)'}}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {stats?.total === 0 && (
        <div className="rounded-3xl p-14 text-center"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="text-5xl mb-4 animate-float">🎯</div>
          <p className="font-black text-lg mb-1" style={{color:'var(--text-2)'}}>No attempts yet</p>
          <p className="text-sm" style={{color:'var(--text-3)'}}>Complete tests to see your performance here</p>
        </div>
      )}
    </div>
  );
}

/* ── Tests Tab ─────────────────────────────────────────── */
function TestsTab({ tests, testMeta, loading, catsLoading, categories, results, user, onHistoryFor, onLeaderboardFor }) {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState(null);

  const ALL_KEY = '__all__';

  const filteredTests = !activeCat || activeCat === ALL_KEY
    ? tests
    : activeCat === '__uncategorized__'
      ? tests.filter(t => !t.test?.category)
      : tests.filter(t => t.test?.category?._id === activeCat);

  const catCards = categories
    .map(cat => ({
      ...cat,
      count: tests.filter(t => t.test?.category?._id === cat._id).length,
    }))
    .filter(c => c.count > 0);

  const uncategorizedCount = tests.filter(t => !t.test?.category).length;

  const selectedCat = activeCat === ALL_KEY
    ? { name:'All Tests', icon:'📋', color:'#4f46e5' }
    : activeCat === '__uncategorized__'
      ? { name:'Uncategorized', icon:'📂', color:'#6b7280' }
      : catCards.find(c => c._id === activeCat) || null;

  return (
    <div className="space-y-6">
      {/* ── Welcome hero ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 animate-tilt-in inner-glow"
        style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,var(--border-hi),transparent)'}}/>
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{background:`radial-gradient(ellipse at top right,var(--orb-1) 0%,transparent 70%)`}}/>
        <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
          style={{background:`radial-gradient(ellipse at bottom left,var(--orb-2) 0%,transparent 80%)`}}/>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white animate-float-slow"
              style={{background:'var(--accent)', boxShadow:'0 0 30px var(--accent-glow), 0 10px 30px rgba(0,0,0,0.3)'}}>
              🎯
            </div>
            <div className="absolute w-3 h-3 rounded-full"
              style={{
                background:'#10b981', boxShadow:'0 0 8px #10b981',
                top:'50%', left:'50%',
                transformOrigin:'-22px -22px',
                animation:'orbit 4s linear infinite',
                marginTop:'-6px', marginLeft:'-6px',
              }}/>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"
              style={{color: greeting.color}}>
              <span>{greeting.emoji}</span>
              <span>{greeting.text}</span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{color:'var(--text-1)'}}>
              {user?.name}
              <span style={{color:'var(--text-3)'}}> !</span>
            </h2>
            <p className="text-sm leading-relaxed mb-0.5" style={{color:'var(--text-2)', fontFamily:'Nirmala UI, Mangal, serif'}}>
              {quote.hi}
            </p>
            <p className="text-xs italic" style={{color:'var(--text-3)'}}>{quote.en}</p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-medium overflow-hidden"
          style={{background:'var(--tip-bg)', border:'1px solid var(--tip-border)', color:'var(--tip-text)'}}>
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
            style={{background:'var(--accent)'}}/>
          <span className="text-base shrink-0 animate-wiggle" style={{animationDuration:'2s', animationIterationCount:'infinite'}}>💡</span>
          <span>{tip}</span>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────── */}
      <StatsBar results={results} />

      {/* ══ FEATURED STENO TEST ══ */}
      {!activeCat && tests.length > 0 && !loading && (
        <div className="relative overflow-hidden rounded-3xl p-6 animate-tilt-in inner-glow mb-8"
          style={{
            background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.10))',
            border:'2px solid rgba(99,102,241,0.30)',
            boxShadow:'0 20px 60px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
          <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none -translate-y-1/2 translate-x-1/3"
            style={{background:'radial-gradient(ellipse,rgba(99,102,241,0.25) 0%,transparent 70%)',blur:'40px'}}/>

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black mb-3"
                  style={{background:'rgba(99,102,241,0.25)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.40)'}}>
                  ⭐ FEATURED STENO TEST
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{color:'var(--text-1)'}}>
                  {tests[0].test?.title}
                </h3>
              </div>
              <svg className="w-8 h-8 text-6xl opacity-20" style={{color:'var(--accent)'}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
            </div>

            <p className="text-sm mb-5" style={{color:'var(--text-2)'}}>
              {tests[0].test?.category?.description || 'Master your stenography skills with this comprehensive test'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="px-4 py-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(99,102,241,0.20)'}}>
                <p className="text-xs mb-1" style={{color:'var(--text-3)'}}>Duration</p>
                <p className="font-black text-lg" style={{color:'var(--text-1)'}}>{tests[0].test?.timer || 30}m</p>
              </div>
              <div className="px-4 py-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(99,102,241,0.20)'}}>
                <p className="text-xs mb-1" style={{color:'var(--text-3)'}}>Replays</p>
                <p className="font-black text-lg" style={{color:'var(--text-1)'}}>{tests[0].test?.maxReplays || 2}</p>
              </div>
              <div className="px-4 py-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(99,102,241,0.20)'}}>
                <p className="text-xs mb-1" style={{color:'var(--text-3)'}}>Attempts</p>
                <p className="font-black text-lg" style={{color:'var(--text-1)'}}>{testMeta[tests[0].test?._id]?.attempts || 0}</p>
              </div>
              <div className="px-4 py-3 rounded-xl"
                style={{
                  background: testMeta[tests[0].test?._id]?.best
                    ? testMeta[tests[0].test?._id].best.errorPercentage <= 5
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(245,158,11,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: testMeta[tests[0].test?._id]?.best
                    ? testMeta[tests[0].test?._id].best.errorPercentage <= 5
                      ? '1px solid rgba(16,185,129,0.30)'
                      : '1px solid rgba(245,158,11,0.30)'
                    : '1px solid rgba(99,102,241,0.20)',
                }}>
                <p className="text-xs mb-1" style={{color:'var(--text-3)'}}>Best</p>
                <p className="font-black text-lg"
                  style={{
                    color: testMeta[tests[0].test?._id]?.best
                      ? testMeta[tests[0].test?._id].best.errorPercentage <= 5
                        ? '#34d399'
                        : '#fbbf24'
                      : 'var(--text-3)',
                  }}>
                  {testMeta[tests[0].test?._id]?.best ? `${testMeta[tests[0].test?._id].best.errorPercentage.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigate(`/test/${tests[0].test?._id}`)}
                className="relative overflow-hidden flex-1 font-black px-6 py-3 rounded-2xl text-base transition-all active:scale-95 flex items-center justify-center gap-2 text-white group"
                style={{
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  boxShadow:'0 0 30px rgba(99,102,241,0.4)',
                }}>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"/>
                <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
                <span className="relative z-10">Start Steno Test</span>
              </button>
              <button onClick={() => navigate(`/test/${tests[0].test?._id}`)}
                className="font-black px-6 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                style={{
                  background:'rgba(99,102,241,0.15)',
                  color:'rgba(165,180,252,0.9)',
                  border:'1px solid rgba(99,102,241,0.30)',
                }}>
                📊 View Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────── */}
      {!activeCat && (
        <div className="animate-fade-in-up" style={{animationDelay:'0.2s'}}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black flex items-center gap-2" style={{color:'var(--text-1)'}}>
              <span className="text-xl">🗂️</span> Select a Category
            </h3>
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
              {tests.length} test{tests.length !== 1 ? 's' : ''} total
            </span>
          </div>

          {loading || catsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 rounded-3xl animate-pulse"
                  style={{background:'var(--bg-surface)', animationDelay:`${i*0.08}s`}}/>
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="rounded-3xl p-16 text-center inner-glow"
              style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
              <div className="text-6xl mb-4 animate-float">📋</div>
              <p className="font-black text-lg mb-1" style={{color:'var(--text-2)'}}>No tests assigned yet</p>
              <p className="text-sm" style={{color:'var(--text-3)'}}>Contact your administrator for test access</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* All Tests card */}
              <button onClick={() => setActiveCat(ALL_KEY)}
                className="relative overflow-hidden rounded-3xl p-5 text-left transition-all hover:-translate-y-1 hover:scale-[1.02] active:scale-95 group"
                style={{
                  background:'linear-gradient(135deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))',
                  border:'1px solid rgba(99,102,241,0.30)',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{background:'linear-gradient(135deg,rgba(79,70,229,0.10),rgba(124,58,237,0.08))'}}/>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)'}}/>
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                    style={{background:'rgba(99,102,241,0.18)', border:'1px solid rgba(99,102,241,0.30)'}}>
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-base mb-0.5" style={{color:'var(--text-1)'}}>All Tests</h4>
                    <p className="text-xs mb-3" style={{color:'var(--text-3)'}}>Browse your full test library</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{background:'rgba(99,102,241,0.15)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.25)'}}>
                        {tests.length} tests
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Category cards */}
              {catCards.map((cat, i) => (
                <button key={cat._id} onClick={() => setActiveCat(cat._id)}
                  className="relative overflow-hidden rounded-3xl p-5 text-left transition-all hover:-translate-y-1 hover:scale-[1.02] active:scale-95 group animate-fade-in-up"
                  style={{
                    background:`linear-gradient(135deg,${cat.color}18,${cat.color}0a)`,
                    border:`1px solid ${cat.color}35`,
                    boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
                    animationDelay:`${(i+1)*0.07}s`,
                  }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{background:`linear-gradient(135deg,${cat.color}12,${cat.color}06)`}}/>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{background:`linear-gradient(90deg,transparent,${cat.color}70,transparent)`}}/>
                  <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                    style={{background:`linear-gradient(180deg,${cat.color},${cat.color}60)`}}/>
                  <div className="relative flex items-start gap-4 pl-2">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                      style={{background:`${cat.color}1a`, border:`1px solid ${cat.color}30`}}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-base mb-0.5 truncate" style={{color:'var(--text-1)'}}>{cat.name}</h4>
                      {cat.description && (
                        <p className="text-xs mb-2 truncate" style={{color:'var(--text-3)'}}>{cat.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{background:`${cat.color}20`, color:cat.color, border:`1px solid ${cat.color}35`}}>
                          {cat.count} test{cat.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center self-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                      style={{background:`${cat.color}20`, color:cat.color}}>
                      →
                    </div>
                  </div>
                </button>
              ))}

              {uncategorizedCount > 0 && (
                <button onClick={() => setActiveCat('__uncategorized__')}
                  className="relative overflow-hidden rounded-3xl p-5 text-left transition-all hover:-translate-y-1 hover:scale-[1.02] active:scale-95 group"
                  style={{background:'rgba(107,114,128,0.08)', border:'1px solid rgba(107,114,128,0.22)'}}>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{background:'linear-gradient(90deg,transparent,rgba(107,114,128,0.4),transparent)'}}/>
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{background:'rgba(107,114,128,0.12)', border:'1px solid rgba(107,114,128,0.22)'}}>
                      📂
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-base mb-0.5" style={{color:'var(--text-1)'}}>Other Tests</h4>
                      <p className="text-xs mb-2" style={{color:'var(--text-3)'}}>Tests without a category</p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{background:'rgba(107,114,128,0.15)', color:'#9ca3af', border:'1px solid rgba(107,114,128,0.25)'}}>
                        {uncategorizedCount} test{uncategorizedCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ Test list ══ */}
      {activeCat && (
        <div className="animate-fade-in-up" style={{animationDelay:'0.05s'}}>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setActiveCat(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)'}}>
              ← Back
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl flex-1 min-w-0"
              style={{
                background: selectedCat ? `${selectedCat.color}12` : 'var(--bg-surface)',
                border: selectedCat ? `1px solid ${selectedCat.color}30` : '1px solid var(--border)',
              }}>
              <span className="text-base shrink-0">{selectedCat?.icon}</span>
              <span className="font-black text-sm truncate" style={{color:'var(--text-1)'}}>{selectedCat?.name}</span>
              <span className="text-xs font-semibold ml-auto shrink-0 px-2 py-0.5 rounded-full"
                style={{
                  background: selectedCat ? `${selectedCat.color}18` : 'var(--bg-surface)',
                  color: selectedCat?.color || 'var(--text-3)',
                }}>
                {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
              style={{background:'rgba(16,185,129,0.10)', color:'#34d399', border:'1px solid rgba(16,185,129,0.20)'}}>
              <div className="relative w-1.5 h-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"/>
              </div>
              Live
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="rounded-3xl p-16 text-center inner-glow"
              style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
              <div className="text-6xl mb-4 animate-float">📭</div>
              <p className="font-black text-lg mb-1" style={{color:'var(--text-2)'}}>No tests in this category</p>
              <p className="text-sm mb-4" style={{color:'var(--text-3)'}}>You have no assigned tests here yet.</p>
              <button onClick={() => setActiveCat(null)}
                className="text-sm font-bold px-4 py-2 rounded-xl transition"
                style={{background:'var(--bg-card)', color:'var(--text-2)', border:'1px solid var(--border)'}}>
                ← Back to categories
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTests.map(({ assignmentId, test, cooldownUntil }, i) => {
                const meta = testMeta[test._id] || { attempts: null, best: null };
                return (
                  <div key={assignmentId} className="animate-fade-in-up" style={{animationDelay:`${i*0.07}s`}}>
                    <TestCard
                      test={test}
                      index={i}
                      attempts={meta.attempts}
                      best={meta.best}
                      cooldownUntil={cooldownUntil}
                      onStart={() => navigate(`/test/${test._id}`)}
                      onHistory={() => onHistoryFor({ testId: test._id, testTitle: test.title })}
                      onLeaderboard={() => onLeaderboardFor({ testId: test._id, testTitle: test.title })}
                      onPractice={() => navigate(`/practice/${test._id}`)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab,      setActiveTab]      = useState('tests');
  const [tests,          setTests]          = useState([]);
  const [testMeta,       setTestMeta]       = useState({});
  const [results,        setResults]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [historyFor,     setHistoryFor]     = useState(null);
  const [leaderboardFor, setLeaderboardFor] = useState(null);
  const [categories,     setCategories]     = useState([]);
  const [catsLoading,    setCatsLoading]    = useState(true);

  useEffect(() => {
    api.get('/user/tests')
      .then(r => {
        setTests(r.data);
        r.data.forEach(({ test }) => {
          api.get(`/user/tests/${test._id}/history`).then(h => {
            const arr = h.data;
            const best = arr.length ? [...arr].sort((a,b) => a.errorPercentage - b.errorPercentage)[0] : null;
            setTestMeta(prev => ({ ...prev, [test._id]: { attempts: arr.length, best } }));
          }).catch(() => {});
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/user/categories').then(r => setCategories(r.data)).catch(()=>{}).finally(() => setCatsLoading(false));

    api.get('/user/results').then(r => setResults(r.data)).catch(() => {});
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{background:`linear-gradient(135deg, var(--bg-base) 0%, var(--bg-mid) 50%, var(--bg-base) 100%)`}}>

      {/* ── Ambient background ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
        <div className="absolute inset-0 dot-grid opacity-40"/>
        <div className="orb w-[500px] h-[500px] top-[-150px] left-[-150px]"
          style={{background:`radial-gradient(circle,var(--orb-1) 0%,transparent 70%)`}}/>
        <div className="orb w-96 h-96 bottom-[-100px] right-[-100px]"
          style={{background:`radial-gradient(circle,var(--orb-2) 0%,transparent 70%)`, animationDelay:'3s'}}/>
        <div className="orb w-64 h-64 top-1/2 right-1/4"
          style={{background:'radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)', animationDelay:'5s'}}/>
        <div className="scan-line"/>
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <header className="sticky top-0 z-40"
        style={{background:'var(--header-bg)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)'}}>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,var(--border-hi),transparent)'}}/>

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Top row: logo + actions */}
          <div className="flex items-center justify-between gap-3 py-3">

            {/* ── InDepth Stenography Logo ─────────── */}
            <div className="flex items-center gap-3">
              {/* Logo mark */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10 overflow-hidden"
                  style={{
                    background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    boxShadow:'0 0 20px rgba(124,58,237,0.45)',
                  }}>
                  {/* Steno keyboard icon */}
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="3" width="20" height="4" rx="1.5"/>
                    <rect x="2" y="9" width="9" height="4" rx="1.5"/>
                    <rect x="13" y="9" width="9" height="4" rx="1.5"/>
                    <rect x="5" y="15" width="6" height="6" rx="3"/>
                    <rect x="13" y="15" width="6" height="6" rx="3"/>
                  </svg>
                </div>
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-xl border border-indigo-400/30 animate-ping-slow"/>
              </div>

              {/* Brand text */}
              <div className="leading-tight">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black tracking-tight"
                    style={{
                      background:'linear-gradient(135deg,#818cf8,#a78bfa)',
                      WebkitBackgroundClip:'text',
                      WebkitTextFillColor:'transparent',
                    }}>
                    InDepth
                  </span>
                </div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase"
                  style={{color:'var(--text-3)'}}>
                  Stenography
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* User avatar pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                    style={{background:'var(--accent)', boxShadow:'0 0 8px var(--accent-glow)'}}>
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                    style={{background:'#10b981', borderColor:'var(--bg-surface)'}}/>
                </div>
                <span className="text-xs font-bold max-w-[80px] truncate" style={{color:'var(--text-1)'}}>
                  {user?.name}
                </span>
              </div>

              {/* Logout */}
              <button onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{background:'rgba(239,68,68,0.08)', color:'#f87171', border:'1px solid rgba(239,68,68,0.18)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.16)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.35)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.18)';}}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* ── Tab bar ───────────────────────────────── */}
          <div className="pb-2 flex items-center gap-2">
            <NavTabs active={activeTab} onChange={setActiveTab} onPracticeClick={() => navigate('/practice')} />
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'tests' && (
          <TestsTab
            tests={tests}
            testMeta={testMeta}
            loading={loading}
            catsLoading={catsLoading}
            categories={categories}
            results={results}
            user={user}
            onHistoryFor={setHistoryFor}
            onLeaderboardFor={setLeaderboardFor}
          />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab tests={tests} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab user={user} />
        )}
      </main>

      {/* ── Modals (still used from TestCard buttons) ── */}
      {historyFor && (
        <HistoryModal testId={historyFor.testId} testTitle={historyFor.testTitle} onClose={() => setHistoryFor(null)}/>
      )}
      {leaderboardFor && (
        <ModalWrapper onClose={() => setLeaderboardFor(null)}>
          {/* Inline leaderboard inside modal */}
          <div className="relative px-6 py-5 flex items-center justify-between shrink-0"
            style={{borderBottom:'1px solid var(--border)'}}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.6),transparent)'}}/>
            <div>
              <h3 className="font-black text-lg flex items-center gap-2" style={{color:'var(--text-1)'}}>
                🏆 Leaderboard
              </h3>
              <p className="text-xs mt-0.5 truncate max-w-xs" style={{color:'var(--text-3)'}}>{leaderboardFor.testTitle}</p>
            </div>
            <button onClick={() => setLeaderboardFor(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{background:'var(--bg-surface)', color:'var(--text-2)', transition:'all 0.3s'}}>×</button>
          </div>
          <LeaderboardModalContent testId={leaderboardFor.testId} />
        </ModalWrapper>
      )}
    </div>
  );
}

/* ── Leaderboard modal content (for TestCard's Rank button) */
function LeaderboardModalContent({ testId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/user/tests/${testId}/leaderboard`)
      .then(r => setEntries(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [testId]);

  const medal    = r => r===1?'🥇':r===2?'🥈':r===3?'🥉':r;
  const errColor = p => p<=5?'#34d399':p<=10?'#fbbf24':'#f87171';
  const fmt      = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
      {loading ? (
        [...Array(4)].map((_,i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{background:'var(--bg-surface)', animationDelay:`${i*0.08}s`}}/>
        ))
      ) : entries.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-5xl mb-3 animate-float">📊</div>
          <p className="font-bold" style={{color:'var(--text-2)'}}>No attempts yet</p>
          <p className="text-sm mt-1" style={{color:'var(--text-3)'}}>Be the first to complete this test!</p>
        </div>
      ) : entries.map((e, i) => (
        <div key={i}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all animate-fade-in-up shimmer-card"
          style={{
            animationDelay:`${i*0.05}s`,
            background: e.isMe ? 'rgba(16,185,129,0.12)' : i<3 ? 'var(--bg-surface)' : 'var(--bg-card)',
            border: e.isMe ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border)',
            boxShadow: e.isMe ? '0 0 20px rgba(16,185,129,0.15)' : 'none',
          }}>
          <div className="w-8 text-center text-xl shrink-0">{medal(e.rank)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate"
                style={{color: e.isMe ? '#34d399' : 'var(--text-1)'}}>
                {e.name}
              </span>
              {e.isMe && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0"
                  style={{background:'rgba(16,185,129,0.2)', color:'#34d399'}}>You</span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>
              {e.accuracy?.toFixed(1)}% acc · {e.wpm} wpm · {fmt(e.timeTaken)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-black" style={{color:errColor(e.errorPercentage)}}>
              {e.errorPercentage?.toFixed(2)}%
            </span>
            <p className="text-xs" style={{color:'var(--text-3)'}}>error</p>
          </div>
        </div>
      ))}
    </div>
  );
}
