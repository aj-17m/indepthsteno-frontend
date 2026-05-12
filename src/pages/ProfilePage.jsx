import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

/* ── Helpers ───────────────────────────────────────────── */
function fmt(s) { return s ? `${Math.floor(s / 60)}m ${s % 60}s` : '—'; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
function errColor(p) {
  if (p <= 2)  return { text: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.25)',  label: 'Excellent' };
  if (p <= 5)  return { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.22)',  label: 'Very Good' };
  if (p <= 10) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.22)',  label: 'Good'      };
  return             { text: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.22)',   label: 'Practice'  };
}
function expiryInfo(d) {
  if (!d) return { label: 'No limit', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
  const days = Math.ceil((new Date(d) - Date.now()) / 86400000);
  if (days < 0)  return { label: 'Expired',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (days <= 7) return { label: `${days}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  return               { label: fmtDate(d),      color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
}

/* ── Animated Number ───────────────────────────────────── */
function Num({ value, suffix = '', decimals = 0 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    const n = parseFloat(value), dur = 900, start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(+(n * e).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{v}{suffix}</>;
}

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({ icon, label, value, suffix, decimals, grad, glow, delay }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-105 hover:-translate-y-1 shimmer-card animate-pop-in"
      style={{
        background: `linear-gradient(${grad})`,
        boxShadow: `0 8px 28px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.07)`,
        animationDelay: delay,
      }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{background:'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 55%)'}}/>
      <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{background: glow}}/>
      <div className="relative z-10">
        <span className="text-2xl">{icon}</span>
        <p className="text-2xl font-black text-white mt-2 tracking-tight">
          <Num value={value} suffix={suffix} decimals={decimals}/>
        </p>
        <p className="text-xs text-white/65 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Profile Page ──────────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('results'); // 'results' | 'tests'

  useEffect(() => {
    api.get('/user/profile')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{background:'linear-gradient(135deg,var(--bg-base),var(--bg-mid))'}}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"/>
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-500 animate-spin" style={{animationDirection:'reverse', animationDuration:'0.8s'}}/>
      </div>
      <p className="text-sm animate-pulse" style={{color:'var(--text-3)'}}>Loading your profile…</p>
    </div>
  );

  const { user, stats, tests, recentResults } = data;
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const expiry   = expiryInfo(user.accessExpiry);

  return (
    <div className="min-h-screen transition-colors duration-300"
      style={{background:'linear-gradient(135deg,var(--bg-base) 0%,var(--bg-mid) 50%,var(--bg-base) 100%)'}}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
        <div className="absolute inset-0 dot-grid opacity-35"/>
        <div className="scan-line"/>
        <div className="orb w-[480px] h-[480px] top-[-120px] left-[-120px]"
          style={{background:'radial-gradient(circle,var(--orb-1) 0%,transparent 70%)'}}/>
        <div className="orb w-80 h-80 bottom-[-80px] right-[-80px]"
          style={{background:'radial-gradient(circle,var(--orb-2) 0%,transparent 70%)', animationDelay:'3s'}}/>
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <header className="relative" style={{background:'var(--header-bg)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', zIndex:100}}>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,var(--border-hi),transparent)'}}/>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{background:'var(--bg-surface)', border:'1px solid var(--border)', color:'var(--text-2)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hi)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </button>
            <div>
              <h1 className="text-base font-black leading-tight" style={{color:'var(--text-1)'}}>My Profile</h1>
              <p className="text-xs" style={{color:'var(--text-3)'}}>Your progress & stats</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hi)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';}}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Profile Hero Card ────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-6 animate-tilt-in inner-glow shimmer-card"
          style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{background:'linear-gradient(90deg,transparent,var(--border-hi),transparent)'}}/>
          <div className="absolute top-0 right-0 w-64 h-48 pointer-events-none"
            style={{background:'radial-gradient(ellipse at top right,var(--orb-1) 0%,transparent 70%)'}}/>

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white animate-float-slow"
                style={{background:'var(--accent)', boxShadow:'0 0 40px var(--accent-glow), 0 12px 30px rgba(0,0,0,0.35)'}}>
                {initials}
              </div>
              {/* Orbiting ring dot */}
              <div className="absolute w-3 h-3 rounded-full"
                style={{
                  background:'#10b981', boxShadow:'0 0 10px #10b981',
                  top:'50%', left:'50%', marginTop:'-6px', marginLeft:'-6px',
                  transformOrigin:'-30px -30px',
                  animation:'orbit 5s linear infinite',
                }}/>
              {/* Online pulse */}
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{background:'#10b981', borderColor:'var(--bg-surface)'}}>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"/>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-black mb-0.5" style={{color:'var(--text-1)'}}>{user.name}</h2>
              <p className="text-sm mb-3" style={{color:'var(--text-3)'}}>{user.email}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {/* Role badge */}
                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{background:'rgba(99,102,241,0.15)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.25)'}}>
                  👤 {user.role === 'admin' ? 'Administrator' : 'Student'}
                </span>

                {/* Access expiry */}
                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{background: expiry.bg, color: expiry.color, border:`1px solid ${expiry.color}30`}}>
                  ⏳ Access: {expiry.label}
                </span>

                {/* Device lock */}
                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{
                    background: user.deviceLocked ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.1)',
                    color      : user.deviceLocked ? '#34d399' : '#9ca3af',
                    border     : `1px solid ${user.deviceLocked ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.2)'}`,
                  }}>
                  {user.deviceLocked ? '🔒 Device Locked' : '🔓 No Device Lock'}
                </span>

                {/* Member since */}
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:'var(--bg-card)', color:'var(--text-3)', border:'1px solid var(--border)'}}>
                  📅 Since {fmtDate(user.memberSince)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────── */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon="📋" label="Total Attempts"  value={stats.total}   suffix=""     decimals={0} grad="135deg,#4f46e5,#6366f1" glow="rgba(99,102,241,0.4)"  delay="0s"/>
            <StatCard icon="🎯" label="Avg Accuracy"    value={stats.avgAcc}  suffix="%"    decimals={1} grad="135deg,#059669,#10b981" glow="rgba(16,185,129,0.4)"  delay="0.06s"/>
            <StatCard icon="⭐" label="Lowest Error"    value={stats.bestErr} suffix="%"    decimals={2} grad="135deg,#d97706,#f59e0b" glow="rgba(245,158,11,0.4)"  delay="0.12s"/>
            <StatCard icon="⚡" label="Avg Speed"       value={stats.avgWpm}  suffix=" wpm" decimals={0} grad="135deg,#7c3aed,#8b5cf6" glow="rgba(139,92,246,0.4)"  delay="0.18s"/>
          </div>
        )}

        {stats.total === 0 && (
          <div className="rounded-3xl p-12 text-center animate-fade-in inner-glow"
            style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
            <div className="text-6xl mb-4 animate-float">🚀</div>
            <p className="font-black text-lg mb-1" style={{color:'var(--text-2)'}}>No attempts yet</p>
            <p className="text-sm mb-5" style={{color:'var(--text-3)'}}>Complete a test to see your stats here</p>
            <button onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
              style={{background:'var(--accent)', boxShadow:'0 0 20px var(--accent-glow)'}}>
              Go to Tests →
            </button>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────── */}
        {stats.total > 0 && (
          <div className="rounded-3xl overflow-hidden animate-fade-in-up inner-glow"
            style={{
              background:'var(--bg-card)',
              border:'1px solid var(--border)',
              animationDelay:'0.2s',
            }}>

            {/* Tab bar */}
            <div className="flex" style={{borderBottom:'1px solid var(--border)'}}>
              {[
                { key:'results', label:'Recent Results', icon:'📊' },
                { key:'tests',   label:'Test Summary',   icon:'📚' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 py-4 text-sm font-bold transition-all relative ${tab===t.key ? 'tab-active' : ''}`}
                  style={{color: tab===t.key ? 'var(--text-1)' : 'var(--text-3)'}}>
                  <span className="mr-1.5">{t.icon}</span>{t.label}
                  {tab === t.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                      style={{background:'var(--accent)', boxShadow:'0 0 8px var(--accent-glow)'}}/>
                  )}
                </button>
              ))}
            </div>

            {/* ── Recent Results tab ───────────── */}
            {tab === 'results' && (
              <div className="p-4 space-y-2">
                {recentResults.length === 0 ? (
                  <p className="text-center py-10 text-sm" style={{color:'var(--text-3)'}}>No results yet</p>
                ) : recentResults.map((r, i) => {
                  const ec = errColor(r.errorPercentage);
                  return (
                    <div key={r._id}
                      className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all animate-fade-in-up shimmer-card"
                      style={{
                        background:'var(--bg-surface)',
                        border:'1px solid var(--border)',
                        animationDelay:`${i*0.04}s`,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-hi)'; e.currentTarget.style.background='var(--bg-card)';}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-surface)';}}
                      onClick={() => navigate(`/result/${r._id}`)}>

                      {/* Rank/number */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{background: ec.bg, color: ec.text, border:`1px solid ${ec.border}`}}>
                        {i + 1}
                      </div>

                      {/* Test name + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{color:'var(--text-1)'}}>
                          {r.testId?.title || 'Unknown Test'}
                        </p>
                        <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>{timeAgo(r.createdAt)}</p>
                      </div>

                      {/* Mini metrics */}
                      <div className="hidden sm:flex items-center gap-3 text-xs" style={{color:'var(--text-3)'}}>
                        <span>⚡ {r.wpm} wpm</span>
                        <span>🎯 {r.accuracy?.toFixed(1)}%</span>
                        <span>⏱ {fmt(r.timeTaken)}</span>
                      </div>

                      {/* Error badge */}
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-black" style={{color: ec.text}}>
                          {r.errorPercentage?.toFixed(2)}%
                        </span>
                        <p className="text-xs" style={{color:'var(--text-3)'}}>error</p>
                      </div>

                      {/* Arrow */}
                      <svg className="w-4 h-4 shrink-0" style={{color:'var(--text-3)'}}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Test Summary tab ─────────────── */}
            {tab === 'tests' && (
              <div className="p-4 space-y-3">
                {tests.length === 0 ? (
                  <p className="text-center py-10 text-sm" style={{color:'var(--text-3)'}}>No test data yet</p>
                ) : tests.map((t, i) => {
                  const ec = t.best ? errColor(t.best.errorPercentage) : null;
                  const pct = t.best ? Math.max(5, 100 - t.best.errorPercentage) : 0;
                  return (
                    <div key={i}
                      className="rounded-2xl p-4 animate-fade-in-up shimmer-card"
                      style={{
                        background:'var(--bg-surface)',
                        border:'1px solid var(--border)',
                        animationDelay:`${i*0.06}s`,
                      }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{color:'var(--text-1)'}}>{t.title}</p>
                          <p className="text-xs mt-0.5" style={{color:'var(--text-3)'}}>
                            {t.attempts} attempt{t.attempts !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {ec && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{background: ec.bg, color: ec.text, border:`1px solid ${ec.border}`}}>
                            {ec.label}
                          </span>
                        )}
                      </div>

                      {t.best && (
                        <>
                          {/* Progress bar */}
                          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{background:'var(--border)'}}>
                            <div className="h-1.5 rounded-full transition-all"
                              style={{
                                width:`${pct}%`,
                                background:`linear-gradient(90deg,${ec.text},${ec.text}aa)`,
                                boxShadow:`0 0 8px ${ec.text}50`,
                                animation:'expand-width 1s ease-out both',
                              }}/>
                          </div>
                          {/* Best stats */}
                          <div className="grid grid-cols-4 gap-2 text-xs" style={{color:'var(--text-3)'}}>
                            <div>
                              <p className="font-black" style={{color: ec.text}}>{t.best.errorPercentage?.toFixed(2)}%</p>
                              <p>Lowest Error</p>
                            </div>
                            <div>
                              <p className="font-bold" style={{color:'var(--text-2)'}}>{t.best.accuracy?.toFixed(1)}%</p>
                              <p>Accuracy</p>
                            </div>
                            <div>
                              <p className="font-bold" style={{color:'var(--text-2)'}}>{t.best.wpm}</p>
                              <p>Best WPM</p>
                            </div>
                            <div>
                              <p className="font-bold" style={{color:'var(--text-2)'}}>{fmt(t.best.timeTaken)}</p>
                              <p>Time</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Navigate back ────────────────────────── */}
        <button onClick={() => navigate('/dashboard')}
          className="w-full font-black py-3.5 rounded-2xl transition-all active:scale-95 animate-fade-in-up hover:opacity-90"
          style={{
            background:'var(--accent)',
            color:'white',
            boxShadow:'0 0 24px var(--accent-glow)',
            animationDelay:'0.3s',
          }}>
          ← Back to Dashboard
        </button>
      </main>
    </div>
  );
}
