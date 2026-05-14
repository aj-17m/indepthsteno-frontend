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

  const errColor = p => p<=5?'#34d399':p<=10?'#fbbf24':'#f87171';
  const fmt = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';

  return (
    <ModalWrapper onClose={onClose}>
      {/* Header */}
      <div className="relative px-6 py-4 flex items-center justify-between shrink-0"
        style={{borderBottom:'1px solid var(--border)'}}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
        <div>
          <h3 className="font-black text-base" style={{color:'var(--text-1)'}}>📋 Attempt History</h3>
          <p className="text-xs mt-0.5 truncate max-w-[240px]" style={{color:'var(--text-3)'}}>{testTitle}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110"
          style={{background:'var(--bg-surface)', color:'var(--text-2)'}}>×</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {loading ? (
          [...Array(3)].map((_,i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{background:'var(--bg-surface)', animationDelay:`${i*0.08}s`}}/>
          ))
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-bold" style={{color:'var(--text-2)'}}>No attempts yet</p>
          </div>
        ) : history.map((r, i) => (
          <button key={r._id}
            className="w-full text-left rounded-2xl px-4 py-3.5 transition-all hover:scale-[1.01] animate-fade-in-up shimmer-card"
            style={{
              background:'var(--bg-surface)',
              border:`1px solid ${r.errorPercentage<=5?'rgba(16,185,129,0.2)':r.errorPercentage<=10?'rgba(245,158,11,0.2)':'var(--border)'}`,
              animationDelay:`${i*0.05}s`,
            }}
            onClick={() => navigate(`/result/${r._id}`)}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      background: r.errorPercentage<=5?'rgba(16,185,129,0.15)':r.errorPercentage<=10?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.12)',
                      color: errColor(r.errorPercentage),
                    }}>
                    {r.errorPercentage?.toFixed(2)}% error
                  </span>
                  <span className="text-xs font-semibold" style={{color:'var(--text-3)'}}>{r.wpm} wpm</span>
                </div>
                <p className="text-xs" style={{color:'var(--text-3)'}}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                  {' · '}{fmt(r.timeTaken)}
                </p>
              </div>
              <svg className="w-4 h-4 shrink-0" style={{color:'var(--text-3)'}}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
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

  const getRating = (e) => {
    if (e <= 2)  return { c:'#10b981', label:'Excellent', bg:'rgba(16,185,129,0.12)' };
    if (e <= 5)  return { c:'#3b82f6', label:'Very Good', bg:'rgba(59,130,246,0.12)' };
    if (e <= 10) return { c:'#f59e0b', label:'Good',      bg:'rgba(245,158,11,0.12)' };
    return              { c:'#ef4444', label:'Needs Work', bg:'rgba(239,68,68,0.10)' };
  };
  const rating = best ? getRating(best.errorPercentage) : null;

  const statusLabel = !attempts ? 'Not started' : attempts === 1 ? '1 attempt' : `${attempts} attempts`;
  const statusColor = !attempts ? 'var(--text-3)' : '#a5b4fc';

  return (
    <div
      className="relative overflow-hidden rounded-3xl transition-all duration-300"
      style={{
        background: inCooldown
          ? 'rgba(245,158,11,0.04)'
          : hovered ? 'var(--bg-surface)' : 'var(--bg-card)',
        border: inCooldown
          ? '1px solid rgba(245,158,11,0.25)'
          : `1px solid ${hovered ? 'var(--border-hi)' : 'var(--border)'}`,
        boxShadow: hovered && !inCooldown ? '0 16px 48px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.15)',
        transform: hovered && !inCooldown ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: hovered && !inCooldown ? 'linear-gradient(90deg,transparent,var(--accent),transparent)' : 'transparent',
          transition: 'all 0.3s',
        }}/>

      {/* Rating badge */}
      {rating && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{background: rating.bg, border:`1px solid ${rating.c}30`, color: rating.c}}>
          <div className="w-1.5 h-1.5 rounded-full" style={{background: rating.c}}/>
          {rating.label}
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: hovered ? 'var(--accent)' : 'var(--bg-surface)',
              boxShadow: hovered ? '0 0 20px var(--accent-glow)' : 'none',
            }}>
            <svg className="w-6 h-6 transition-colors" style={{color: hovered ? 'white' : 'var(--text-2)'}}
              fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-16">
            <h3 className="font-black text-sm sm:text-base leading-tight mb-1 truncate" style={{color:'var(--text-1)'}}>{test.title}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded-md font-semibold"
                style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
                ⏱ {test.timer ?? 30} min
              </span>
              {test.category && (
                <span className="px-2 py-0.5 rounded-md font-semibold"
                  style={{
                    background:`${test.category.color || '#6366f1'}15`,
                    color: test.category.color || '#a5b4fc',
                    border:`1px solid ${test.category.color || '#6366f1'}25`,
                  }}>
                  {test.category.icon} {test.category.name}
                </span>
              )}
              <span className="text-xs font-semibold" style={{color: statusColor}}>{statusLabel}</span>
            </div>

            {/* Best score bar */}
            {best && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{color: rating?.c}}>
                    Best: {best.errorPercentage?.toFixed(2)}% error
                  </span>
                  <span className="text-xs" style={{color:'var(--text-3)'}}>
                    {best.accuracy?.toFixed(0)}% acc · {best.wpm} wpm
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                  <div className="score-bar"
                    style={{
                      width:`${Math.max(5, 100 - (best.errorPercentage || 0))}%`,
                      background:`linear-gradient(90deg, ${rating?.c}, ${rating?.c}bb)`,
                      boxShadow:`0 0 6px ${rating?.c}50`,
                    }}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4 pt-3.5" style={{borderTop:'1px solid var(--border)'}}>
          {inCooldown ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)'}}>
              <span>⏳</span>
              <span className="text-xs font-black tabular-nums" style={{color:'#fbbf24'}}>{fmtCd(cooldownMs)}</span>
              <span className="text-xs" style={{color:'rgba(251,191,36,0.55)'}}>cooldown</span>
            </div>
          ) : (
            <button onClick={onStart}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-black text-sm text-white transition-all active:scale-95 relative overflow-hidden"
              style={{
                background:'var(--accent)',
                boxShadow: hovered ? '0 0 20px var(--accent-glow)' : '0 4px 12px rgba(0,0,0,0.2)',
              }}>
              <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all"/>
              <svg className="w-3.5 h-3.5 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
              <span className="relative z-10">{attempts ? 'Attempt Again' : 'Start Test'}</span>
            </button>
          )}

          <button onClick={onPractice}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            style={{background:'rgba(6,182,212,0.08)', color:'rgba(6,182,212,0.8)', border:'1px solid rgba(6,182,212,0.15)'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(6,182,212,0.18)';e.currentTarget.style.color='#22d3ee';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(6,182,212,0.08)';e.currentTarget.style.color='rgba(6,182,212,0.8)';}}>
            ✏️ Practice
          </button>

          <div className="flex items-center gap-1.5 ml-auto">
            {attempts > 0 && (
              <button onClick={onHistory}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--text-1)';e.currentTarget.style.borderColor='var(--border-hi)';}}
                onMouseLeave={e=>{e.currentTarget.style.color='var(--text-3)';e.currentTarget.style.borderColor='var(--border)';}}>
                📋 History
              </button>
            )}
            <button onClick={onLeaderboard}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{background:'rgba(245,158,11,0.1)', color:'rgba(251,191,36,0.85)', border:'1px solid rgba(245,158,11,0.18)'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(245,158,11,0.2)';e.currentTarget.style.color='#fbbf24';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(245,158,11,0.1)';e.currentTarget.style.color='rgba(251,191,36,0.85)';}}>
              🏆 Rank
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stats Bar ─────────────────────────────────────────── */
function StatsBar({ results }) {
  if (!results || !results.length) return null;

  const [flipped, setFlipped] = useState([false, false, false, false]);

  const sorted   = [...results].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const best     = [...results].sort((a,b) => a.errorPercentage - b.errorPercentage)[0];
  const bestAcc  = [...results].sort((a,b) => b.accuracy - a.accuracy)[0];
  const bestWpm  = [...results].sort((a,b) => b.wpm - a.wpm)[0];
  const recent5  = sorted.slice(0, 5);
  const weekAgo  = Date.now() - 7 * 86400000;
  const thisWeek = results.filter(r => new Date(r.createdAt).getTime() >= weekAgo).length;
  const goalErr  = 5;

  const avgErrRecent = recent5.length
    ? recent5.reduce((s,r) => s + (r.errorPercentage||0), 0) / recent5.length
    : null;
  const avgErrAll = results.reduce((s,r) => s + (r.errorPercentage||0), 0) / results.length;
  const errTrend  = avgErrRecent != null ? avgErrRecent - avgErrAll : null;

  const stats = {
    total  : results.length,
    avgAcc : (results.reduce((s,r) => s+(r.accuracy||0), 0)/results.length).toFixed(1),
    bestErr: best.errorPercentage?.toFixed(2),
    avgWpm : Math.round(results.reduce((s,r) => s+(r.wpm||0), 0)/results.length),
  };

  // Each card has a primary (front) and alt (back) face
  const cards = [
    {
      grad:'135deg,#4f46e5,#6366f1', glow:'rgba(99,102,241,0.35)',
      front:{ label:'Tests Done',   value: stats.total,               suffix:'',    icon:'📋', hint: null },
      back :{ label:'This Week',    value: thisWeek,                  suffix:'',    icon:'📅', hint: thisWeek === 0 ? 'No tests yet' : thisWeek === 1 ? '1 test this week' : null },
    },
    {
      grad:'135deg,#059669,#10b981', glow:'rgba(16,185,129,0.35)',
      front:{ label:'Avg Accuracy', value: parseFloat(stats.avgAcc),  suffix:'%',   icon:'🎯', hint: parseFloat(stats.avgAcc) >= 90 ? '✓ Target met' : null },
      back :{ label:'Best Accuracy',value: parseFloat((bestAcc.accuracy||0).toFixed(1)), suffix:'%', icon:'🏅', hint: '← all-time best' },
    },
    {
      grad:'135deg,#d97706,#f59e0b', glow:'rgba(245,158,11,0.35)',
      front:{ label:'Lowest Error', value: parseFloat(stats.bestErr), suffix:'%',   icon:'⭐', hint: parseFloat(stats.bestErr) <= goalErr ? '✓ Excellent' : `Goal: ≤${goalErr}%` },
      back :{ label:'Recent Avg Error', value: avgErrRecent != null ? +avgErrRecent.toFixed(2) : 0, suffix:'%', icon: errTrend != null && errTrend < 0 ? '📉' : '📈',
              hint: errTrend != null ? (errTrend < 0 ? `↓ ${Math.abs(errTrend).toFixed(1)}% vs overall` : `↑ ${errTrend.toFixed(1)}% vs overall`) : null },
    },
    {
      grad:'135deg,#7c3aed,#8b5cf6', glow:'rgba(139,92,246,0.35)',
      front:{ label:'Avg Speed',    value: stats.avgWpm,              suffix:' wpm',icon:'⚡', hint: null },
      back :{ label:'Peak Speed',   value: bestWpm.wpm || 0,          suffix:' wpm',icon:'🚀', hint: '← best ever' },
    },
  ];

  const toggle = (i) => setFlipped(f => f.map((v, idx) => idx === i ? !v : v));

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{animationDelay:'0.1s'}}>
        {cards.map((card, i) => {
          const face = flipped[i] ? card.back : card.front;
          return (
            <div key={i}
              onClick={() => toggle(i)}
              className="relative overflow-hidden rounded-2xl p-4 cursor-pointer select-none"
              style={{
                background:`linear-gradient(${card.grad})`,
                boxShadow:`0 8px 24px rgba(0,0,0,0.3)`,
                transition:'transform 0.18s ease, box-shadow 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04) translateY(-3px)'; e.currentTarget.style.boxShadow=`0 14px 32px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.12)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.3)`; }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{background:'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 55%)'}}/>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-xl pointer-events-none"
                style={{background: card.glow}}/>
              {/* flip indicator dot */}
              <div className="absolute top-2 right-2 flex gap-1 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full" style={{background: flipped[i] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)'}}/>
                <div className="w-1.5 h-1.5 rounded-full" style={{background: flipped[i] ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)'}}/>
              </div>
              <div className="relative z-10">
                <div className="text-2xl mb-2">{face.icon}</div>
                <p className="text-2xl font-black text-white tracking-tight">
                  <AnimatedNumber target={face.value} suffix={face.suffix}/>
                </p>
                <p className="text-xs text-white/70 font-semibold mt-0.5">{face.label}</p>
                {face.hint && (
                  <p className="text-[10px] text-white/55 mt-1 font-medium">{face.hint}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] mt-1.5 font-medium" style={{color:'var(--text-3)'}}>
        tap any card to see alternative stat
      </p>
    </div>
  );
}

/* ── Tab Navigation ────────────────────────────────────── */
const TABS = [
  { id: 'tests',       label: 'My Tests',    icon: '⌨️', shortLabel: 'Tests' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', shortLabel: 'Ranks' },
  { id: 'profile',     label: 'Profile',     icon: '👤', shortLabel: 'Profile' },
  { id: 'practice',    label: 'Practice',    icon: '✏️',  shortLabel: 'Practice' },
];

function NavTabs({ active, onChange, onPracticeClick, testCount }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl"
      style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        const isPractice = tab.id === 'practice';
        return (
          <button
            key={tab.id}
            onClick={() => isPractice ? onPracticeClick() : onChange(tab.id)}
            className="relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 select-none"
            style={{
              background: isActive
                ? isPractice ? 'rgba(6,182,212,0.22)' : 'var(--accent)'
                : 'transparent',
              color: isActive
                ? isPractice ? '#22d3ee' : 'white'
                : 'var(--text-3)',
              boxShadow: isActive
                ? `0 4px 12px ${isPractice ? 'rgba(6,182,212,0.35)' : 'var(--accent-glow)'}`
                : 'none',
              border: isActive && isPractice ? '1px solid rgba(6,182,212,0.35)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-3)'; }}>
            <span className="text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.shortLabel}</span>
            {tab.id === 'tests' && testCount > 0 && !isActive && (
              <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded-full font-black"
                style={{background:'rgba(99,102,241,0.2)', color:'#a5b4fc'}}>
                {testCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Leaderboard Tab ───────────────────────────────────── */
function LeaderboardTab({ tests }) {
  const [selectedTest, setSelectedTest] = useState(null);
  const [entries,      setEntries]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');

  const filteredTests = tests.filter(({ test }) =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="rounded-3xl overflow-hidden"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
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
                  <p className="text-xs" style={{color:'var(--text-3)'}}>{fmt(e.timeTaken)}</p>
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

      {/* Search bar */}
      {tests.length > 0 && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:'var(--text-3)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background:'var(--bg-surface)',
              color:'var(--text-1)',
              border:'1px solid var(--border)',
            }}
          />
        </div>
      )}

      {tests.length === 0 ? (
        <div className="rounded-3xl p-16 text-center"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="text-5xl mb-4 animate-float">🏆</div>
          <p className="font-black text-lg mb-1" style={{color:'var(--text-2)'}}>No tests yet</p>
          <p className="text-sm" style={{color:'var(--text-3)'}}>Tests will appear here once assigned</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="rounded-3xl p-12 text-center"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="text-5xl mb-3 animate-float">🔍</div>
          <p className="font-black mb-1" style={{color:'var(--text-2)'}}>No tests found</p>
          <p className="text-sm" style={{color:'var(--text-3)'}}>Try a different search term</p>
          <button onClick={() => setSearchQuery('')}
            className="text-sm font-bold mt-3 px-4 py-2 rounded-xl transition"
            style={{background:'var(--bg-card)', color:'var(--text-2)', border:'1px solid var(--border)'}}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTests.map(({ test }, i) => (
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
                    {test.category && (<><span>·</span><span>{test.category.icon} {test.category.name}</span></>)}
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

  const errColor = p => p<=5?'#34d399':p<=10?'#fbbf24':'#f87171';
  const fmt      = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';
  const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}) : '—';
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?';

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        {[1,2,3].map(i => (
          <div key={i} className="h-28 rounded-3xl animate-pulse"
            style={{background:'var(--bg-surface)', animationDelay:`${i*0.1}s`}}/>
        ))}
      </div>
    );
  }

  const stats  = profile?.stats;
  const tests  = profile?.tests || [];
  const recent = profile?.recentResults || [];

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── User card ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
        style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-25"
          style={{background:'radial-gradient(ellipse at top right,rgba(99,102,241,0.4) 0%,transparent 70%)'}}/>

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl text-white shrink-0"
            style={{background:'linear-gradient(135deg,var(--accent),#7c3aed)', boxShadow:'0 0 25px var(--accent-glow)'}}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-black truncate" style={{color:'var(--text-1)'}}>{user?.name}</h3>
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
                  📅 Member since {fmtDate(profile.user.memberSince)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overall stats ──────────────────────────────── */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'Total Attempts', value: stats.total,           suffix:'',    icon:'📋', grad:'135deg,#4f46e5,#6366f1' },
            { label:'Avg Accuracy',   value: stats.avgAcc,          suffix:'%',   icon:'🎯', grad:'135deg,#059669,#10b981' },
            { label:'Lowest Error',   value: stats.bestErr ?? '—',  suffix: stats.bestErr != null ? '%' : '', icon:'⭐', grad:'135deg,#d97706,#f59e0b' },
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
                  {typeof s.value === 'number' ? <AnimatedNumber target={s.value} suffix={s.suffix}/> : s.value}
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
            <span>📊</span>
            <h4 className="font-black text-sm" style={{color:'var(--text-1)'}}>Per-Test Performance</h4>
          </div>
          <div className="divide-y" style={{divideColor:'var(--border)'}}>
            {tests.map((t, i) => {
              const r = t.best
                ? t.best.errorPercentage <= 2  ? { c:'#10b981', label:'Excellent' }
                : t.best.errorPercentage <= 5  ? { c:'#3b82f6', label:'Very Good' }
                : t.best.errorPercentage <= 10 ? { c:'#f59e0b', label:'Good' }
                : { c:'#ef4444', label:'Practice more' }
                : null;
              const scoreWidth = t.best ? Math.max(5, 100 - t.best.errorPercentage) : 0;
              return (
                <div key={i} className="px-5 py-4 animate-fade-in-up" style={{animationDelay:`${i*0.05}s`}}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black truncate flex-1 mr-3" style={{color:'var(--text-1)'}}>{t.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {r && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{background:`${r.c}20`, color:r.c, border:`1px solid ${r.c}35`}}>
                          {r.label}
                        </span>
                      )}
                      <span className="text-xs" style={{color:'var(--text-3)'}}>{t.attempts} {t.attempts===1?'try':'tries'}</span>
                    </div>
                  </div>
                  {t.best ? (
                    <>
                      <div className="flex items-center gap-3 text-xs mb-2" style={{color:'var(--text-3)'}}>
                        <span>Error: <strong style={{color:r?.c}}>{t.best.errorPercentage?.toFixed(2)}%</strong></span>
                        <span>·</span>
                        <span>Acc: <strong style={{color:'var(--text-2)'}}>{t.best.accuracy?.toFixed(1)}%</strong></span>
                        <span>·</span>
                        <span>Speed: <strong style={{color:'var(--text-2)'}}>{t.best.wpm} wpm</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width:`${scoreWidth}%`,
                              background:`linear-gradient(90deg,${r?.c??'#6366f1'},${r?.c??'#6366f1'}bb)`,
                            }}/>
                        </div>
                        <span className="text-xs font-bold tabular-nums shrink-0" style={{color:r?.c}}>{scoreWidth.toFixed(0)}%</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs" style={{color:'var(--text-3)'}}>Not attempted yet</p>
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
              <span>🕐</span>
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
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{
                        background: r.errorPercentage<=5?'rgba(16,185,129,0.15)':r.errorPercentage<=10?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.12)',
                      }}>
                      {r.errorPercentage<=5?'🟢':r.errorPercentage<=10?'🟡':'🔴'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{color:'var(--text-1)'}}>
                        {r.testId?.title || 'Untitled Test'}
                      </p>
                      <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        {' · '}{fmt(r.timeTaken)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{
                        background: r.errorPercentage<=5?'rgba(16,185,129,0.14)':r.errorPercentage<=10?'rgba(245,158,11,0.14)':'rgba(239,68,68,0.14)',
                        color: errColor(r.errorPercentage),
                      }}>
                      {r.errorPercentage?.toFixed(2)}%
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
  const [activeCat, setActiveCat] = useState('__all__');

  const ALL_KEY = '__all__';

  const filteredTests = activeCat === ALL_KEY
    ? tests
    : activeCat === '__uncategorized__'
      ? tests.filter(t => !t.test?.category)
      : tests.filter(t => t.test?.category?._id === activeCat);

  const catCards = categories
    .map(cat => ({ ...cat, count: tests.filter(t => t.test?.category?._id === cat._id).length }))
    .filter(c => c.count > 0);

  const uncategorizedCount = tests.filter(t => !t.test?.category).length;

  const lastResult = results && results.length > 0
    ? [...results].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  const lastTest = lastResult
    ? tests.find(({ test }) => test._id === lastResult.testId?._id)
    : null;

  const errColor = p => p<=5?'#34d399':p<=10?'#fbbf24':'#f87171';

  return (
    <div className="space-y-5">

      {/* ── Compact welcome hero ─────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 animate-fade-in-up inner-glow"
        style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,var(--border-hi),transparent)'}}/>
        <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none opacity-30"
          style={{background:`radial-gradient(ellipse at top right,var(--orb-1) 0%,transparent 70%)`}}/>

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0 animate-float-slow"
            style={{background:'var(--accent)', boxShadow:'0 0 25px var(--accent-glow)'}}>
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold flex items-center gap-1 mb-0.5" style={{color: greeting.color}}>
              {greeting.emoji} {greeting.text}
            </p>
            <h2 className="text-xl sm:text-2xl font-black leading-tight truncate" style={{color:'var(--text-1)'}}>
              {user?.name}!
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{color:'var(--text-2)', fontFamily:'Nirmala UI, Mangal, serif'}}>
              {quote.hi}
            </p>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-medium"
          style={{background:'var(--tip-bg)', border:'1px solid var(--tip-border)', color:'var(--tip-text)'}}>
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{background:'var(--accent)'}}/>
          <span className="text-sm shrink-0">💡</span>
          <span>{tip}</span>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────── */}
      <StatsBar results={results} />

      {/* ── Quick Resume ──────────────────────────────── */}
      {lastResult && lastTest && (
        <div className="rounded-3xl p-4 sm:p-5 animate-fade-in-up"
          style={{
            background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.06))',
            border:'1px solid rgba(16,185,129,0.22)',
            animationDelay:'0.12s',
          }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{background:'rgba(16,185,129,0.18)', border:'1px solid rgba(16,185,129,0.30)'}}>
                ↩️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold mb-0.5" style={{color:'#34d399'}}>Continue where you left off</p>
                <p className="text-sm font-black truncate" style={{color:'var(--text-1)'}}>{lastTest.test.title}</p>
                <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>
                  Last score: <span style={{color:errColor(lastResult.errorPercentage), fontWeight:700}}>{lastResult.errorPercentage?.toFixed(2)}% error</span>
                  {' · '}{lastResult.wpm} wpm
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/test/${lastTest.test._id}`)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-sm text-white transition-all active:scale-95 hover:scale-105"
              style={{
                background:'linear-gradient(135deg,#059669,#10b981)',
                boxShadow:'0 4px 16px rgba(16,185,129,0.35)',
              }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
              Resume
            </button>
          </div>
        </div>
      )}

      {/* ── Test list with category pill filters ──────── */}
      <div className="animate-fade-in-up" style={{animationDelay:'0.18s'}}>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black flex items-center gap-2" style={{color:'var(--text-1)'}}>
            ⌨️ Your Tests
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
            {filteredTests.length} shown
          </span>
        </div>

         {/* Category card grid filter - More visible and attractive */}
         {!loading && !catsLoading && tests.length > 0 && (catCards.length > 0 || uncategorizedCount > 0) && (
           <div className="mb-5">
             <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{color:'var(--text-3)'}}>
               <span>📂 Filter by Category</span>
             </p>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
               {/* All tests card */}
               <button
                 onClick={() => setActiveCat(ALL_KEY)}
                 className="relative overflow-hidden rounded-2xl p-4 transition-all duration-200 group"
                 style={{
                   background: activeCat === ALL_KEY ? 'var(--accent)' : 'var(--bg-surface)',
                   border: activeCat === ALL_KEY ? 'none' : '1px solid var(--border)',
                   boxShadow: activeCat === ALL_KEY ? '0 8px 24px var(--accent-glow)' : 'none',
                   transform: activeCat === ALL_KEY ? 'scale(1.04)' : 'scale(1)',
                 }}
                 onMouseEnter={e => {
                   if (activeCat !== ALL_KEY) {
                     e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                     e.currentTarget.style.borderColor = 'var(--accent)';
                   }
                 }}
                 onMouseLeave={e => {
                   if (activeCat !== ALL_KEY) {
                     e.currentTarget.style.transform = 'scale(1)';
                     e.currentTarget.style.borderColor = 'var(--border)';
                   }
                 }}>
                 <div className="flex flex-col items-center text-center gap-2">
                   <span className="text-3xl">📋</span>
                   <div>
                     <p className="text-xs font-black" style={{color: activeCat === ALL_KEY ? 'white' : 'var(--text-1)'}}>
                       All Tests
                     </p>
                     <span className="text-xl font-black" style={{color: activeCat === ALL_KEY ? 'white' : 'var(--accent)'}}>
                       {tests.length}
                     </span>
                   </div>
                 </div>
               </button>

               {/* Category cards */}
               {catCards.map(cat => (
                 <button key={cat._id}
                   onClick={() => setActiveCat(cat._id)}
                   className="relative overflow-hidden rounded-2xl p-4 transition-all duration-200 group"
                   style={{
                     background: activeCat === cat._id ? cat.color : `${cat.color}12`,
                     border: activeCat === cat._id ? 'none' : `1px solid ${cat.color}35`,
                     boxShadow: activeCat === cat._id ? `0 8px 24px ${cat.color}50` : 'none',
                     transform: activeCat === cat._id ? 'scale(1.04)' : 'scale(1)',
                   }}
                   onMouseEnter={e => {
                     if (activeCat !== cat._id) {
                       e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                       e.currentTarget.style.borderColor = cat.color;
                     }
                   }}
                   onMouseLeave={e => {
                     if (activeCat !== cat._id) {
                       e.currentTarget.style.transform = 'scale(1)';
                       e.currentTarget.style.borderColor = `${cat.color}35`;
                     }
                   }}>
                   <div className="flex flex-col items-center text-center gap-2">
                     <span className="text-3xl">{cat.icon}</span>
                     <div>
                       <p className="text-xs font-black truncate" style={{color: activeCat === cat._id ? 'white' : cat.color}}>
                         {cat.name}
                       </p>
                       <span className="text-xl font-black" style={{color: activeCat === cat._id ? 'white' : cat.color}}>
                         {cat.count}
                       </span>
                     </div>
                   </div>
                 </button>
               ))}

               {/* Uncategorized card */}
               {uncategorizedCount > 0 && (
                 <button
                   onClick={() => setActiveCat('__uncategorized__')}
                   className="relative overflow-hidden rounded-2xl p-4 transition-all duration-200 group"
                   style={{
                     background: activeCat === '__uncategorized__' ? '#6b7280' : 'rgba(107,114,128,0.08)',
                     border: activeCat === '__uncategorized__' ? 'none' : '1px solid rgba(107,114,128,0.25)',
                     boxShadow: activeCat === '__uncategorized__' ? '0 8px 24px rgba(107,114,128,0.35)' : 'none',
                     transform: activeCat === '__uncategorized__' ? 'scale(1.04)' : 'scale(1)',
                   }}
                   onMouseEnter={e => {
                     if (activeCat !== '__uncategorized__') {
                       e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                       e.currentTarget.style.borderColor = '#6b7280';
                     }
                   }}
                   onMouseLeave={e => {
                     if (activeCat !== '__uncategorized__') {
                       e.currentTarget.style.transform = 'scale(1)';
                       e.currentTarget.style.borderColor = 'rgba(107,114,128,0.25)';
                     }
                   }}>
                   <div className="flex flex-col items-center text-center gap-2">
                     <span className="text-3xl">📂</span>
                     <div>
                       <p className="text-xs font-black" style={{color: activeCat === '__uncategorized__' ? 'white' : '#9ca3af'}}>
                         Other
                       </p>
                       <span className="text-xl font-black" style={{color: activeCat === '__uncategorized__' ? 'white' : '#9ca3af'}}>
                         {uncategorizedCount}
                       </span>
                     </div>
                   </div>
                 </button>
               )}
             </div>
           </div>
         )}

        {/* Test cards */}
        {loading || catsLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-36 rounded-3xl animate-pulse"
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
        ) : filteredTests.length === 0 ? (
          <div className="rounded-3xl p-12 text-center"
            style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
            <div className="text-5xl mb-3 animate-float">📭</div>
            <p className="font-black mb-1" style={{color:'var(--text-2)'}}>No tests in this category</p>
            <button onClick={() => setActiveCat(ALL_KEY)}
              className="text-sm font-bold mt-3 px-4 py-2 rounded-xl transition"
              style={{background:'var(--bg-card)', color:'var(--text-2)', border:'1px solid var(--border)'}}>
              Show all tests
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTests.map(({ assignmentId, test, cooldownUntil }, i) => {
              const meta = testMeta[test._id] || { attempts: null, best: null };
              return (
                <div key={assignmentId} className="animate-fade-in-up" style={{animationDelay:`${i*0.06}s`}}>
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
          <div className="flex items-center justify-between gap-3 py-3">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center relative z-10 overflow-hidden"
                  style={{
                    background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    boxShadow:'0 0 18px rgba(124,58,237,0.45)',
                  }}>
                  <svg className="w-4.5 h-4.5 text-white" style={{width:'18px',height:'18px'}} viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="3" width="20" height="4" rx="1.5"/>
                    <rect x="2" y="9" width="9" height="4" rx="1.5"/>
                    <rect x="13" y="9" width="9" height="4" rx="1.5"/>
                    <rect x="5" y="15" width="6" height="6" rx="3"/>
                    <rect x="13" y="15" width="6" height="6" rx="3"/>
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-xl border border-indigo-400/30 animate-ping-slow"/>
              </div>
              <div className="leading-tight">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-black tracking-tight"
                    style={{background:'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
                    InDepth
                  </span>
                </div>
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{color:'var(--text-3)'}}>Stenography</p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Practice quick-link */}
              <button onClick={() => navigate('/practice')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-105"
                style={{background:'rgba(6,182,212,0.1)', color:'#22d3ee', border:'1px solid rgba(6,182,212,0.22)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(6,182,212,0.2)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(6,182,212,0.1)';}}>
                ✏️ Practice
              </button>

              {/* User pill */}
              <button onClick={() => setActiveTab('profile')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
                <div className="relative">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] text-white"
                    style={{background:'var(--accent)'}}>
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2"
                    style={{background:'#10b981', borderColor:'var(--bg-surface)'}}/>
                </div>
                <span className="text-xs font-bold max-w-[70px] truncate" style={{color:'var(--text-1)'}}>
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              {/* Logout */}
              <button onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                style={{background:'rgba(239,68,68,0.08)', color:'#f87171', border:'1px solid rgba(239,68,68,0.18)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.16)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';}}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="pb-2 flex items-center gap-2">
            <NavTabs
              active={activeTab}
              onChange={setActiveTab}
              onPracticeClick={() => navigate('/practice')}
              testCount={tests.length}
            />
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-10">
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

      {/* ── Modals ──────────────────────────────────── */}
      {historyFor && (
        <HistoryModal testId={historyFor.testId} testTitle={historyFor.testTitle} onClose={() => setHistoryFor(null)}/>
      )}
      {leaderboardFor && (
        <ModalWrapper onClose={() => setLeaderboardFor(null)}>
          <div className="relative px-6 py-5 flex items-center justify-between shrink-0"
            style={{borderBottom:'1px solid var(--border)'}}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.6),transparent)'}}/>
            <div>
              <h3 className="font-black text-lg flex items-center gap-2" style={{color:'var(--text-1)'}}>🏆 Leaderboard</h3>
              <p className="text-xs mt-0.5 truncate max-w-xs" style={{color:'var(--text-3)'}}>{leaderboardFor.testTitle}</p>
            </div>
            <button onClick={() => setLeaderboardFor(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110"
              style={{background:'var(--bg-surface)', color:'var(--text-2)'}}>×</button>
          </div>
          <LeaderboardModalContent testId={leaderboardFor.testId} />
        </ModalWrapper>
      )}
    </div>
  );
}

/* ── Leaderboard modal content ──────────────────────────── */
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
              <span className="font-bold text-sm truncate" style={{color: e.isMe?'#34d399':'var(--text-1)'}}>
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
