import ThemeToggle from '../components/ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const QUOTES = [
  { hi: '"अभ्यास ही सफलता की कुंजी है।"',       en: 'Practice is the key to success.' },
  { hi: '"कठिन परिश्रम कभी व्यर्थ नहीं जाता।"', en: 'Hard work never goes to waste.' },
  { hi: '"हर शब्द एक कदम आगे है।"',               en: 'Every word is one step forward.' },
  { hi: '"निरंतर अभ्यास से निपुणता आती है।"',    en: 'Mastery comes from consistent practice.' },
  { hi: '"आज का अभ्यास कल की जीत है।"',           en: "Today's practice is tomorrow's victory." },
];
const quote = QUOTES[new Date().getDay() % QUOTES.length];

const FEATURES = [
  { icon: '🎧', label: 'Audio Dictation' },
  { icon: '⏱️', label: 'Live Timer'      },
  { icon: '📊', label: 'SSC Pattern'     },
  { icon: '🏆', label: 'Leaderboard'     },
];

/* ── Reviews ─────────────────────────────────────────────── */
const REVIEWS = [
  {
    name   : 'Rahul Sharma',
    role   : 'SSC Steno Grade-C Qualifier',
    avatar : 'RS',
    color  : '#6366f1',
    stars  : 5,
    hi     : 'इस प्लेटफ़ॉर्म ने मेरी speed 60 से 105 WPM तक पहुँचाई। SSC Steno परीक्षा में पास हो गया!',
    en     : 'This platform took my speed from 60 to 105 WPM. Cleared SSC Steno exam!',
  },
  {
    name   : 'Priya Singh',
    role   : 'Steno Aspirant, Delhi',
    avatar : 'PS',
    color  : '#ec4899',
    stars  : 5,
    hi     : 'हिंदी ऑडियो की quality बेहतरीन है। Error analysis इतना detailed है कि हर गलती समझ आती है।',
    en     : 'Excellent Hindi audio quality. The detailed error analysis helps me fix every mistake.',
  },
  {
    name   : 'Amit Verma',
    role   : 'Court Steno Aspirant',
    avatar : 'AV',
    color  : '#10b981',
    stars  : 4.5,
    hi     : 'Leaderboard feature मुझे हमेशा motivated रखता है। Daily practice के लिए best platform है।',
    en     : 'The leaderboard keeps me motivated every day. Best platform for daily steno practice.',
  },
  {
    name   : 'Kavita Gupta',
    role   : 'Government Steno, Lucknow',
    avatar : 'KG',
    color  : '#f59e0b',
    stars  : 5,
    hi     : 'SSC pattern पर based tests बिल्कुल असली exam जैसे लगते हैं। बहुत helpful platform!',
    en     : 'Tests feel exactly like the real SSC exam. Extremely helpful for final preparation.',
  },
  {
    name   : 'Suresh Yadav',
    role   : 'Steno Trainee, Jaipur',
    avatar : 'SY',
    color  : '#0ea5e9',
    stars  : 4.5,
    hi     : 'Timer और audio replay feature बहुत useful हैं। मेरी accuracy 85% से 97% हो गई।',
    en     : 'Timer and audio replay are very useful. My accuracy improved from 85% to 97%.',
  },
  {
    name   : 'Neha Mishra',
    role   : 'SSC Steno Grade-D Qualifier',
    avatar : 'NM',
    color  : '#8b5cf6',
    stars  : 5,
    hi     : 'इतना अच्छा Hindi steno practice platform पहले कभी नहीं देखा। हर student को use करना चाहिए!',
    en     : 'Never seen such a good Hindi steno practice platform. Every aspirant must use this!',
  },
];

/* ── Star renderer ───────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const full = i <= Math.floor(rating);
        const half = !full && i === Math.ceil(rating) && rating % 1 !== 0;
        return (
          <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${i}-${rating}`}>
                <stop offset="50%" stopColor="#fbbf24"/>
                <stop offset="50%" stopColor="rgba(251,191,36,0.2)"/>
              </linearGradient>
            </defs>
            <path
              fill={full ? '#fbbf24' : half ? `url(#half-${i}-${rating})` : 'rgba(251,191,36,0.2)'}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      })}
      <span className="text-xs font-bold ml-1" style={{ color: '#fbbf24' }}>{rating.toFixed(1)}</span>
    </div>
  );
}

/* ── Reviews carousel ────────────────────────────────────── */
function ReviewsCarousel() {
  const [active,   setActive]   = useState(0);
  const [fading,   setFading]   = useState(false);
  const [pool,     setPool]     = useState(REVIEWS);   // starts with hardcoded, replaced by API
  const [apiDone,  setApiDone]  = useState(false);
  const timerRef                = useRef(null);

  // Fetch live reviews from public endpoint; fall back to hardcoded on error
  useEffect(() => {
    axios.get('/api/reviews')
      .then(res => {
        if (res.data?.length > 0) {
          // normalise DB shape → same shape as hardcoded REVIEWS
          setPool(res.data.map(r => ({
            name   : r.name,
            role   : r.role || '',
            avatar : r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            color  : r.avatarColor || '#6366f1',
            stars  : r.stars,
            hi     : r.reviewHi,
            en     : r.reviewEn || '',
          })));
        }
      })
      .catch(() => { /* silently keep hardcoded */ })
      .finally(() => setApiDone(true));
  }, []);

  const advance = (next) => {
    setFading(true);
    setTimeout(() => { setActive(next); setFading(false); }, 280);
  };

  useEffect(() => {
    if (!apiDone) return;   // wait for API before starting timer
    setActive(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % pool.length;
        setFading(true);
        setTimeout(() => setFading(false), 280);
        return next;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [pool, apiDone]);

  const r = pool[active] || pool[0];

  return (
    <div className="mt-6 animate-rise" style={{ animationDelay: '0.45s' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: 'var(--text-3)' }}>
          <span>💬</span> What our users say
        </p>
        <div className="flex items-center gap-1">
          {pool.map((_, i) => (
            <button key={i} type="button"
              onClick={() => { clearInterval(timerRef.current); advance(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width:  active === i ? '18px' : '6px',
                height: '6px',
                background: active === i ? 'var(--border-hi)' : 'var(--border)',
              }}/>
          ))}
        </div>
      </div>

      {/* Review card */}
      <div className="rounded-2xl p-4 transition-all duration-280"
        style={{
          background : 'var(--bg-surface)',
          border     : '1px solid var(--border)',
          opacity    : fading ? 0 : 1,
          transform  : fading ? 'translateY(6px)' : 'translateY(0)',
          transition : 'opacity 0.28s ease, transform 0.28s ease',
        }}>

        {/* Top row: avatar + name + stars */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: r.color, boxShadow: `0 0 14px ${r.color}50` }}>
            {r.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate" style={{ color: 'var(--text-1)' }}>{r.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{r.role}</p>
          </div>
          <Stars rating={r.stars} />
        </div>

        {/* Hindi text */}
        <p className="text-xs leading-relaxed mb-1"
          style={{ fontFamily: 'Nirmala UI, Mangal, serif', color: 'var(--text-2)', lineHeight: '1.6' }}>
          "{r.hi}"
        </p>
        {/* English translation */}
        <p className="text-[11px] italic" style={{ color: 'var(--text-3)' }}>{r.en}</p>
      </div>

      {/* Aggregate rating */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <Stars rating={4.8}/>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          4.8 / 5 · {pool.length} user reviews
        </span>
      </div>
    </div>
  );
}

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState(() => {
    const msg = localStorage.getItem('expiredMsg');
    if (msg) { localStorage.removeItem('expiredMsg'); return msg; }
    return '';
  });
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex transition-colors duration-500"
      style={{ background: `linear-gradient(135deg, var(--bg-base) 0%, var(--bg-mid) 60%, var(--bg-base) 100%)` }}>

      {/* ── Ambient background (whole page) ──────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="scan-line" />
        <div className="orb w-[500px] h-[500px] top-[-150px] left-[-100px]"
          style={{ background: `radial-gradient(circle, var(--orb-1) 0%, transparent 70%)` }} />
        <div className="orb w-96 h-96 bottom-[-80px] right-[-80px]"
          style={{ background: `radial-gradient(circle, var(--orb-2) 0%, transparent 70%)`, animationDelay: '2.5s' }} />
        <div className="orb w-64 h-64 top-1/2 left-1/3"
          style={{ background: `radial-gradient(circle, var(--orb-1) 0%, transparent 70%)`, animationDelay: '1.2s', opacity: 0.5 }} />
      </div>

      {/* ── Theme toggle — top right always ──────────────── */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* ── Left visual panel ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col items-center justify-center p-14 relative overflow-hidden" style={{ zIndex: 1 }}>

        {/* Floating particles */}
        {[...Array(18)].map((_, i) => (
          <div key={i} className="particle"
            style={{
              left: `${6 + (i * 5.8) % 88}%`,
              top:  `${8 + (i * 9.7) % 84}%`,
              '--dur':   `${2.5 + i % 4}s`,
              '--delay': `${(i * 0.35).toFixed(1)}s`,
              width:  i % 4 === 0 ? '7px' : i % 3 === 0 ? '5px' : '3px',
              height: i % 4 === 0 ? '7px' : i % 3 === 0 ? '5px' : '3px',
              opacity: 0.15 + i % 5 * 0.07,
              background: i % 3 === 0
                ? 'var(--tip-text)'
                : i % 3 === 1 ? 'var(--border-hi)' : 'var(--text-2)',
            }} />
        ))}

        {/* Main content */}
        <div className="relative z-10 text-center max-w-md animate-tilt-in">

          {/* Logo */}
          <div className="mb-6 animate-scale-in">
            <img 
              src="/mainlogo.jpeg" 
              alt="Indepth Stenography Logo" 
              className="mx-auto h-20 w-auto object-contain"
              style={{ maxWidth: '200px' }}
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-black mb-3 tracking-tight text-gradient-animate"
            style={{ color: 'var(--text-1)' }}>
            Indepth Stenography
          </h1>
          <p className="text-base mb-8 font-medium tracking-wide" style={{ color: 'var(--text-3)' }}>
            Hindi SSC Stenography Platform
          </p>

          {/* Quote card */}
          <div className="rounded-2xl p-6 mb-6 animate-scale-in shimmer-card"
            style={{
              animationDelay: '0.2s',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hi)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}>
            <div className="text-3xl mb-3 animate-heartbeat">💭</div>
            <p className="text-sm font-semibold leading-relaxed mb-2"
              style={{ fontFamily: 'Nirmala UI, Mangal, serif', color: 'var(--text-1)' }}>
              {quote.hi}
            </p>
            <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>{quote.en}</p>
          </div>

          {/* Feature chips */}
          <div className="grid grid-cols-4 gap-2.5">
            {FEATURES.map((f, i) => (
              <div key={f.label}
                className="rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 animate-rise hover:scale-105 transition-transform cursor-default"
                style={{
                  animationDelay: `${0.3 + i * 0.07}s`,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                <span className="text-2xl">{f.icon}</span>
                <span className="text-xs font-semibold text-center leading-tight"
                  style={{ color: 'var(--text-2)' }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Reviews carousel */}
          <ReviewsCarousel />
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative" style={{ zIndex: 1 }}>

        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 animate-fade-in-up">
            <div className="mb-4">
              <img 
                src="/mainlogo.jpeg" 
                alt="Indepth Stenography Logo" 
                className="mx-auto h-16 w-auto object-contain"
                style={{ maxWidth: '150px' }}
              />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-1)' }}>Indepth Stenography</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Hindi SSC Stenography Platform</p>
          </div>

          {/* Card */}
          <div className="animate-slide-in-bottom" style={{ animationDelay: '0.1s' }}>
            <div className="rounded-3xl p-8 relative overflow-hidden"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-hi)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px var(--border)',
              }}>

              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--border-hi), transparent)' }} />
              {/* Corner accent orbs */}
              <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top right, var(--orb-1) 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 left-0 w-28 h-28 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at bottom left, var(--orb-2) 0%, transparent 70%)' }} />

              {/* Heading */}
              <div className="mb-7 relative">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-sm"
                    style={{ boxShadow: '0 0 14px var(--accent-glow)' }}>
                    👋
                  </div>
                  <h2 className="text-2xl font-black" style={{ color: 'var(--text-1)' }}>Welcome back</h2>
                </div>
                <p className="text-sm ml-11" style={{ color: 'var(--text-3)' }}>
                  Sign in to continue your practice
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-3)' }}>Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </span>
                    <input type="email" required autoComplete="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-1)',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid var(--border-hi)'; e.target.style.boxShadow = '0 0 0 3px var(--tip-bg)'; }}
                      onBlur={e =>  { e.target.style.border = '1px solid var(--border)';    e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-3)' }}>Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input type={showPw ? 'text' : 'password'} required
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm transition-all"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-1)',
                        outline: 'none',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid var(--border-hi)'; e.target.style.boxShadow = '0 0 0 3px var(--tip-bg)'; }}
                      onBlur={e =>  { e.target.style.border = '1px solid var(--border)';    e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                      {showPw
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl animate-scale-in"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden group mt-2"
                  style={{
                    background: 'linear-gradient(-45deg,#4f46e5,#7c3aed,#2563eb)',
                    backgroundSize: '300%',
                    animation: 'gradient-x 4s ease infinite',
                    boxShadow: loading ? 'none' : '0 0 24px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.3)',
                    color: 'white',
                  }}>
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all rounded-xl" />
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Footer note */}
              <div className="mt-6 flex items-center gap-2 justify-center">
                <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                <p className="text-xs px-3" style={{ color: 'var(--text-3)' }}>
                  Contact admin for account access
                </p>
                <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-4 mt-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {['🔒 Secure', '📋 SSC Pattern', '🎧 Hindi Audio'].map(s => (
              <span key={s} className="text-xs" style={{ color: 'var(--text-3)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
