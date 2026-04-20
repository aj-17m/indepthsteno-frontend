import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DiffViewer from '../components/DiffViewer';
import Leaderboard from '../components/Leaderboard';
import ThemeToggle from '../components/ThemeToggle';

/* ── Grade config ─────────────────────────────────────── */
function getGrade(errPct) {
  if (errPct <= 2)  return { label:'Excellent',         emoji:'🏆', color:'#10b981', bg:'rgba(16,185,129,0.12)',  ring:'#10b981' };
  if (errPct <= 5)  return { label:'Very Good',         emoji:'🌟', color:'#3b82f6', bg:'rgba(59,130,246,0.12)',  ring:'#3b82f6' };
  if (errPct <= 8)  return { label:'Good',              emoji:'✨', color:'#6366f1', bg:'rgba(99,102,241,0.12)',  ring:'#6366f1' };
  if (errPct <= 12) return { label:'Average',           emoji:'📈', color:'#f59e0b', bg:'rgba(245,158,11,0.12)', ring:'#f59e0b' };
  return                   { label:'Keep Practicing',   emoji:'💪', color:'#ef4444', bg:'rgba(239,68,68,0.12)',   ring:'#ef4444' };
}

/* ── Circular Progress Ring ───────────────────────────── */
function ProgressRing({ value, max = 100, size = 120, stroke = 10, color, label, sublabel }) {
  const radius = (size - stroke) / 2;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{width:size, height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
          {/* Progress */}
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition:'stroke-dashoffset 1.2s ease-out',
              filter:`drop-shadow(0 0 6px ${color}80)`,
            }}/>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{label}</span>
          {sublabel && <span className="text-xs text-white/40">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Small word tag ───────────────────────────────────── */
function WordTag({ master, typed, color, bg, border }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 my-0.5 mx-0.5 text-sm"
      style={{ background: bg, border:`1px solid ${border}`, fontFamily:'Nirmala UI, Mangal, serif', color }}>
      {typed && typed !== master ? (
        <>
          <span style={{ opacity:0.55, textDecoration:'line-through' }}>{typed}</span>
          <span style={{ opacity:0.45, fontSize:'10px' }}>→</span>
          <span className="font-semibold">{master}</span>
        </>
      ) : (
        <span className="font-semibold">{master || typed}</span>
      )}
    </span>
  );
}

/* ── Mistake section block ────────────────────────────── */
function MistakeSection({ title, count, color, bg, border, glow, children }) {
  if (count === 0) return null;
  return (
    <div className="rounded-2xl overflow-hidden animate-fade-in-up"
      style={{ border:`1px solid ${border}`, boxShadow:`0 0 20px ${glow}` }}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: bg, borderBottom:`1px solid ${border}` }}>
        <span className="text-2xl font-black" style={{ color }}>{count}</span>
        <span className="font-black text-sm" style={{ color }}>{title}</span>
      </div>
      {/* Content */}
      <div className="px-4 py-3 space-y-3" style={{ background:'rgba(0,0,0,0.15)' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Sub-category row ────────────────────────────────── */
function SubRow({ label, items, color, bg, border }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-2"
        style={{ color:'rgba(255,255,255,0.35)' }}>
        {label}
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
          style={{ background: bg, color, border:`1px solid ${border}` }}>
          {items.length}
        </span>
      </p>
      <div className="flex flex-wrap">
        {items.map((w, i) => (
          <WordTag key={i} master={w.master} typed={w.typed} color={color} bg={bg} border={border}/>
        ))}
      </div>
    </div>
  );
}

/* ── Mistake Breakdown ────────────────────────────────── */
function MistakeBreakdown({ comparison }) {
  if (!comparison.length) {
    return <p className="text-white/30 text-sm text-center py-4">No data available.</p>;
  }

  // Categorise
  const missing      = comparison.filter(w => w.status === 'missing');
  const extra        = comparison.filter(w => w.status === 'extra');
  const replace      = comparison.filter(w => w.status === 'replace');
  const substitution = comparison.filter(w => w.status === 'full' && w.mistakeType === 'substitution');
  const incomplete   = comparison.filter(w => w.status === 'full' && w.mistakeType === 'incomplete');
  const repetition   = comparison.filter(w => w.status === 'full' && w.mistakeType === 'repetition');
  const spelling     = comparison.filter(w => w.status === 'half' && w.mistakeType === 'spelling');
  const punctuation  = comparison.filter(w => w.status === 'half' && (w.mistakeType === 'punctuation' || w.mistakeType === 'comma'));

  const totalFull = missing.length + extra.length + replace.length + substitution.length + incomplete.length + repetition.length;
  const totalHalf = spelling.length + punctuation.length;

  if (totalFull === 0 && totalHalf === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-bold text-emerald-400 text-lg">Perfect — No mistakes!</p>
        <p className="text-white/30 text-sm mt-1">Outstanding performance</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── FULL MISTAKES ──────────────────────────────── */}
      <MistakeSection
        title="Full Mistakes"
        count={totalFull}
        color="#f87171"
        bg="rgba(239,68,68,0.12)"
        border="rgba(239,68,68,0.28)"
        glow="rgba(239,68,68,0.06)">

        <SubRow label="Missing Words — typed nothing, word was skipped"
          items={missing}
          color="#f87171" bg="rgba(239,68,68,0.14)" border="rgba(239,68,68,0.30)"/>

        <SubRow label="Replace Errors — completely different word typed (बिल्कुल अलग शब्द)"
          items={replace}
          color="#d8b4fe" bg="rgba(168,85,247,0.16)" border="rgba(168,85,247,0.32)"/>

        <SubRow label="Wrong Words — close but 2+ character mismatch"
          items={substitution}
          color="#fca5a5" bg="rgba(239,68,68,0.12)" border="rgba(239,68,68,0.25)"/>

        <SubRow label="Extra Words — typed words that don't exist in passage"
          items={extra.map(w => ({ master: null, typed: w.typed }))}
          color="#93c5fd" bg="rgba(59,130,246,0.14)" border="rgba(59,130,246,0.28)"/>

        <SubRow label="Incomplete Words — word was typed but too short"
          items={incomplete}
          color="#fca5a5" bg="rgba(239,68,68,0.10)" border="rgba(239,68,68,0.22)"/>

        <SubRow label="Repetitions — same word typed twice in a row"
          items={repetition}
          color="#fca5a5" bg="rgba(239,68,68,0.10)" border="rgba(239,68,68,0.22)"/>
      </MistakeSection>

      {/* ── HALF MISTAKES ──────────────────────────────── */}
      <MistakeSection
        title="Half Mistakes"
        count={totalHalf}
        color="#fcd34d"
        bg="rgba(245,158,11,0.12)"
        border="rgba(245,158,11,0.28)"
        glow="rgba(245,158,11,0.06)">

        <SubRow label="Spelling Errors — minor spelling difference"
          items={spelling}
          color="#fcd34d" bg="rgba(245,158,11,0.14)" border="rgba(245,158,11,0.30)"/>

        <SubRow label="Punctuation / Comma — punctuation mismatch"
          items={punctuation}
          color="#fdba74" bg="rgba(249,115,22,0.14)" border="rgba(249,115,22,0.28)"/>
      </MistakeSection>

    </div>
  );
}

/* ── SVG Sparkline chart ───────────────────────────────────── */
function TrendChart({ history, currentId }) {
  if (!history || history.length < 2) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3 animate-float">📈</div>
        <p className="font-bold" style={{color:'var(--text-2)'}}>Not enough attempts yet</p>
        <p className="text-sm mt-1" style={{color:'var(--text-3)'}}>
          Complete at least 2 attempts to see your progress trend.
        </p>
      </div>
    );
  }

  const W = 560, H = 180, PAD = { top:20, right:16, bottom:32, left:40 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top  - PAD.bottom;

  const sorted  = [...history].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  const errVals = sorted.map(r => r.errorPercentage ?? 0);
  const wpmVals = sorted.map(r => r.wpm ?? 0);
  const maxErr  = Math.max(...errVals, 5);
  const maxWpm  = Math.max(...wpmVals, 10);

  const xOf  = i => PAD.left + (sorted.length > 1 ? (i / (sorted.length - 1)) * cw : cw / 2);
  const yErr = v => PAD.top + ch - (v / maxErr) * ch;
  const yWpm = v => PAD.top + ch - (v / maxWpm) * ch;

  const errPath = errVals.map((v,i) => `${i===0?'M':'L'}${xOf(i).toFixed(1)},${yErr(v).toFixed(1)}`).join(' ');
  const wpmPath = wpmVals.map((v,i) => `${i===0?'M':'L'}${xOf(i).toFixed(1)},${yWpm(v).toFixed(1)}`).join(' ');
  const errTicks = [0,25,50,75,100].map(p => ({ val:+(p/100*maxErr).toFixed(1), y: PAD.top + ch*(1-p/100) }));

  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  const fmtTime = s => s ? `${Math.floor(s/60)}m${s%60?` ${s%60}s`:''}` : '—';

  return (
    <div className="space-y-5">
      {/* Chart */}
      <div className="rounded-2xl p-4 overflow-hidden"
        style={{background:'var(--bg-surface)', border:'1px solid var(--border)'}}>
        <div className="flex items-center gap-5 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full" style={{background:'#f87171'}}/>
            <span className="text-xs font-semibold" style={{color:'var(--text-3)'}}>Error %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full border-dashed" style={{background:'transparent', borderTop:'2px dashed #34d399'}}/>
            <span className="text-xs font-semibold" style={{color:'var(--text-3)'}}>WPM (scaled)</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height:'180px'}}>
          {errTicks.map(t => (
            <g key={t.val}>
              <line x1={PAD.left} y1={t.y} x2={W-PAD.right} y2={t.y}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              <text x={PAD.left-5} y={t.y+4} textAnchor="end" fontSize="9"
                fill="rgba(255,255,255,0.25)">{t.val}</text>
            </g>
          ))}
          {sorted.map((_,i) => i % Math.max(1, Math.floor(sorted.length/5)) === 0 && (
            <text key={i} x={xOf(i)} y={H-4} textAnchor="middle" fontSize="9"
              fill="rgba(255,255,255,0.22)">#{i+1}</text>
          ))}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H-PAD.bottom}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          <line x1={PAD.left} y1={H-PAD.bottom} x2={W-PAD.right} y2={H-PAD.bottom}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          <path d={wpmPath} fill="none" stroke="#34d399" strokeWidth="1.5"
            strokeDasharray="5 3" strokeLinecap="round" opacity="0.65"/>
          <path d={errPath} fill="none" stroke="#f87171" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
          {sorted.map((r,i) => {
            const cur = r._id === currentId;
            return (
              <g key={r._id}>
                <circle cx={xOf(i)} cy={yWpm(wpmVals[i])} r={cur?5:2.5}
                  fill={cur?'#10b981':'#34d399'} opacity="0.8"/>
                <circle cx={xOf(i)} cy={yErr(errVals[i])} r={cur?6:3}
                  fill={cur?'#ef4444':'#f87171'}
                  stroke={cur?'white':'none'} strokeWidth={cur?1.5:0}/>
                {cur && (
                  <text x={xOf(i)} y={yErr(errVals[i])-10} textAnchor="middle"
                    fontSize="9" fontWeight="700" fill="white">
                    {errVals[i].toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Attempt list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {[...sorted].reverse().map((r, revIdx) => {
          const rank = sorted.length - revIdx;
          const cur  = r._id === currentId;
          const ec   = r.errorPercentage ?? 0;
          const col  = ec<=2?'#34d399':ec<=5?'#60a5fa':ec<=10?'#fbbf24':'#f87171';
          return (
            <div key={r._id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{
                background: cur ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                border:     cur ? '1px solid rgba(99,102,241,0.35)' : '1px solid var(--border)',
              }}>
              <span className="text-xs font-bold w-6 text-center shrink-0"
                style={{color:'var(--text-3)'}}>#{rank}</span>
              <div className="flex-1 min-w-0">
                <div className="h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                  <div className="h-1.5 rounded-full"
                    style={{width:`${Math.max(2,100-ec)}%`,
                      background:`linear-gradient(90deg,${col},${col}aa)`}}/>
                </div>
              </div>
              <span className="text-sm font-black shrink-0" style={{color:col}}>{ec.toFixed(2)}%</span>
              <span className="text-xs shrink-0" style={{color:'var(--text-3)'}}>{r.wpm} wpm</span>
              <span className="text-xs shrink-0 hidden sm:inline" style={{color:'var(--text-3)'}}>
                {fmtTime(r.timeTaken)}
              </span>
              <span className="text-xs shrink-0" style={{color:'var(--text-3)'}}>{fmtDate(r.createdAt)}</span>
              {cur && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0"
                  style={{background:'rgba(99,102,241,0.2)', color:'#818cf8'}}>Now</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Result Page ──────────────────────────────────────── */
const TABS = ['Summary', 'Comparison', 'Progress', 'Leaderboard'];

export default function ResultPage() {
  const { resultId }  = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();

  const [result,      setResult]      = useState(state?.result || null);
  const [fullResult,  setFullResult]  = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('Summary');
  const [testTitle,   setTestTitle]   = useState(state?.testTitle || '');

  useEffect(() => {
    api.get(`/user/results/${resultId}`)
      .then(res => {
        setFullResult(res.data);
        setResult(prev => ({ ...prev, ...res.data }));
        setTestTitle(res.data.testId?.title || testTitle);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [resultId]);

  useEffect(() => {
    if (fullResult?.testId?._id) {
      const tid = fullResult.testId._id;
      api.get(`/user/tests/${tid}/leaderboard`)
        .then(res => setLeaderboard(res.data))
        .catch(console.error);
      api.get(`/user/tests/${tid}/history`)
        .then(res => setHistory(res.data))
        .catch(console.error);
    }
  }, [fullResult]);

  const fmt = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{background:'linear-gradient(135deg,#0f0f1a,#1a1a2e)'}}>
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
      <p className="text-white/40 text-sm">Loading your result…</p>
    </div>
  );

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{background:'var(--bg-base)'}}>
      <p className="text-red-400">Result not found</p>
    </div>
  );

  const grade   = getGrade(result.errorPercentage ?? 0);
  const errPct  = result.errorPercentage ?? 0;
  const acc     = result.accuracy ?? 0;

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,var(--bg-base) 0%,var(--bg-mid) 50%,var(--bg-base) 100%)'}}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:0}}>
        <div className="absolute inset-0 dot-grid opacity-35"/>
        <div className="scan-line"/>
        <div className="orb w-[500px] h-[500px] top-[-120px] left-[-120px]"
          style={{background:`radial-gradient(circle,${grade.ring}28 0%,transparent 70%)`}}/>
        <div className="orb w-80 h-80 bottom-[-60px] right-[-40px]"
          style={{background:'radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 70%)'}}/>
      </div>

      {/* ── Header ────────────────────────────────────────── */}
      <header className="relative frosted-header" style={{zIndex:100}}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-lg text-white">Result</h1>
            {testTitle && <p className="text-xs text-white/35 mt-0.5 truncate max-w-xs">{testTitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate('/dashboard')}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hi)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Grade hero ────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-6 animate-tilt-in shimmer-card"
          style={{
            background:grade.bg,
            border:`1px solid ${grade.ring}35`,
            boxShadow:`0 24px 70px rgba(0,0,0,0.45), 0 0 50px ${grade.ring}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}>
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
            style={{background:`linear-gradient(90deg,transparent,${grade.ring},transparent)`}}/>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Progress rings */}
            <div className="flex gap-6 shrink-0">
              <ProgressRing value={acc} max={100} size={110} stroke={9}
                color={grade.ring} label={`${acc.toFixed(0)}%`} sublabel="accuracy"/>
              <ProgressRing value={Math.max(0,100-errPct)} max={100} size={110} stroke={9}
                color={errPct<=5?'#10b981':errPct<=10?'#f59e0b':'#ef4444'}
                label={`${errPct.toFixed(1)}%`} sublabel="error"/>
            </div>

            {/* Grade info */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="text-3xl">{grade.emoji}</span>
                <span className="text-3xl font-black" style={{color:grade.color}}>{grade.label}</span>
              </div>
              <p className="text-white/50 text-sm">Time: <span className="text-white/70 font-semibold">{fmt(result.timeTaken)}</span></p>
              <p className="text-white/50 text-sm mt-0.5">
                Passage: <span className="text-white/70 font-semibold">{result.totalWords ?? 0} words</span>
                {result.typedWords != null && (
                  <> &nbsp;·&nbsp; Typed: <span className="text-white/70 font-semibold">{result.typedWords}</span></>
                )}
              </p>
              {result.pasteDetected && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:'rgba(239,68,68,0.2)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.3)'}}>
                  ⚠ Paste detected during test
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ────────────────────────────────────── */}
        {(() => {
          // Prefer server-stored counts; fall back to computing from wordComparison
          const cmp          = fullResult?.wordComparison || [];
          const missingCnt   = result.missingWords  ?? cmp.filter(w => w.status === 'missing').length;
          const extraCnt     = result.extraWords    ?? cmp.filter(w => w.status === 'extra').length;
          const replaceCnt   = result.replaceErrors ?? cmp.filter(w => w.status === 'replace').length;
          const correctCnt   = result.correctWords  ?? cmp.filter(w => w.status === 'correct').length;
          const stats = [
            { icon:'⚡',  label:'Speed',           value:`${result.wpm ?? 0} wpm`,    color:'rgba(99,102,241,0.15)',  border:'rgba(99,102,241,0.25)',  valColor:'#a5b4fc' },
            { icon:'✅',  label:'Correct Words',   value: correctCnt,                  color:'rgba(16,185,129,0.10)',  border:'rgba(16,185,129,0.22)',  valColor:'#6ee7b7' },
            { icon:'❌',  label:'Full Mistakes',   value: result.fullMistakes ?? 0,    color:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.22)',   valColor:'#f87171' },
            { icon:'⚠️', label:'Half Mistakes',   value: result.halfMistakes ?? 0,    color:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.22)',  valColor:'#fcd34d' },
            { icon:'🔀',  label:'Replace Errors',  value: replaceCnt,                  color:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.22)',  valColor:'#d8b4fe' },
            { icon:'👻',  label:'Missing Words',   value: missingCnt,                  color:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.18)',   valColor:'#fca5a5' },
            { icon:'➕',  label:'Extra Words',     value: extraCnt,                    color:'rgba(59,130,246,0.10)',  border:'rgba(59,130,246,0.20)',  valColor:'#93c5fd' },
            { icon:'📊',  label:'Total Error',     value:`${result.totalError ?? 0}`,  color:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.22)',  valColor:'#c4b5fd' },
          ];
          return (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 animate-fade-in-up" style={{animationDelay:'0.1s'}}>
              {stats.map((s, i) => (
                <div key={s.label}
                  className="flex flex-col items-center p-2.5 rounded-2xl transition-all hover:scale-105 shimmer-card animate-pop-in"
                  style={{ background: s.color, border:`1px solid ${s.border}`, animationDelay:`${0.1+i*0.05}s` }}>
                  <span className="text-lg mb-0.5">{s.icon}</span>
                  <span className="text-base font-black" style={{ color: s.valColor }}>{s.value}</span>
                  <span className="text-[9px] text-white/40 font-semibold mt-0.5 text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Analysis Summary ─────────────────────────────── */}
        {(result.analysisSummary || fullResult?.analysisSummary) && (
          <div className="rounded-2xl px-4 py-3 animate-fade-in-up text-xs leading-relaxed"
            style={{
              animationDelay:'0.13s',
              background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.07)',
              color:'rgba(255,255,255,0.38)',
              fontFamily:'Nirmala UI, Mangal, serif',
            }}>
            <span className="font-black text-white/25 uppercase tracking-widest text-[10px] mr-2">Analysis</span>
            {result.analysisSummary || fullResult?.analysisSummary}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden animate-fade-in-up"
          style={{
            animationDelay:'0.15s',
            background:'var(--bg-card)',
            border:'1px solid var(--border)',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
          }}>
          {/* Tab bar */}
          <div className="flex" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            {TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab===tab?'tab-active':''}`}
                style={{color: activeTab===tab ? 'white' : 'rgba(255,255,255,0.3)'}}>
                {tab}
                {activeTab===tab && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{background:'linear-gradient(90deg,#4f46e5,#7c3aed)', boxShadow:'0 0 8px rgba(99,102,241,0.6)'}}/>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Summary */}
            {activeTab==='Summary' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white/70 text-sm uppercase tracking-wide">Mistake Breakdown</h3>
                  {fullResult?.wordComparison?.length > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.35)' }}>
                      {fullResult.wordComparison.filter(w => w.status === 'correct').length} / {fullResult.wordComparison.filter(w => w.master).length} words correct
                    </span>
                  )}
                </div>
                <MistakeBreakdown comparison={fullResult?.wordComparison || []} />
              </div>
            )}

            {/* Comparison */}
            {activeTab==='Comparison' && (
              <div className="animate-fade-in">
                <DiffViewer comparison={fullResult?.wordComparison || []} />
              </div>
            )}

            {/* Progress */}
            {activeTab==='Progress' && (
              <div className="animate-fade-in">
                <h3 className="font-bold text-white/70 text-sm uppercase tracking-wide mb-4">
                  📈 Your Progress — {testTitle}
                </h3>
                <TrendChart history={history} currentId={resultId} />
              </div>
            )}

            {/* Leaderboard */}
            {activeTab==='Leaderboard' && (
              <div className="animate-fade-in">
                <h3 className="font-bold text-white/70 text-sm uppercase tracking-wide mb-4">
                  🏆 Leaderboard — {testTitle}
                </h3>
                <Leaderboard entries={leaderboard} />
              </div>
            )}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────── */}
        <button onClick={() => navigate('/dashboard')}
          className="w-full font-black py-4 rounded-2xl transition-all active:scale-95 animate-fade-in-up"
          style={{
            animationDelay:'0.25s',
            background:'var(--accent)',
            color:'var(--text-1)',
            boxShadow:'0 0 30px rgba(99,102,241,0.35)',
          }}>
          ← Back to Dashboard
        </button>
      </main>
    </div>
  );
}
