/**
 * DiffViewer — Side-by-side comparison
 * Left  : Original uploaded passage  (error positions highlighted)
 * Right : What the user typed        (half = underline, full/replace = strikethrough)
 */

import { useState } from 'react';

const HF = { fontFamily: '"Nirmala UI", Mangal, "Noto Sans Devanagari", serif' };

/* ── Score strip ─────────────────────────────────────────────── */
function ScoreStrip({ comparison }) {
  const total   = comparison.filter(w => w.master).length;
  const correct = comparison.filter(w => w.status === 'correct').length;
  const half    = comparison.filter(w => w.status === 'half').length;
  const full    = comparison.filter(w => w.status === 'full').length;
  const replace = comparison.filter(w => w.status === 'replace').length;
  const missing = comparison.filter(w => w.status === 'missing').length;
  const extra   = comparison.filter(w => w.status === 'extra').length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;

  const pills = [
    { label:'Correct',  count: correct, color:'#4ade80', bg:'rgba(16,185,129,0.12)',  bdr:'rgba(16,185,129,0.28)'  },
    { label:'Half',     count: half,    color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  bdr:'rgba(251,191,36,0.30)'  },
    { label:'Wrong',    count: full,    color:'#f87171', bg:'rgba(239,68,68,0.12)',   bdr:'rgba(239,68,68,0.28)'   },
    { label:'Replace',  count: replace, color:'#c084fc', bg:'rgba(168,85,247,0.12)', bdr:'rgba(168,85,247,0.28)'  },
    { label:'Missing',  count: missing, color:'#fb923c', bg:'rgba(251,146,60,0.12)', bdr:'rgba(251,146,60,0.28)'  },
    { label:'Extra',    count: extra,   color:'#38bdf8', bg:'rgba(56,189,248,0.12)', bdr:'rgba(56,189,248,0.28)'  },
  ].filter(p => p.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl"
      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-sm font-black" style={{ color:'#a5b4fc' }}>{pct}%</span>
      <span className="text-xs mr-1" style={{ color:'rgba(255,255,255,0.28)' }}>{correct}/{total} correct</span>
      {pills.map(p => (
        <span key={p.label}
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: p.bg, border:`1px solid ${p.bdr}`, color: p.color }}>
          {p.count} {p.label}
        </span>
      ))}
    </div>
  );
}

/* ── Legend ──────────────────────────────────────────────────── */
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 rounded-xl"
      style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-[10px] font-black uppercase tracking-widest"
        style={{ color:'rgba(255,255,255,0.20)' }}>Legend</span>

      {/* correct */}
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>
        <span style={{ ...HF, color:'#4ade80', fontSize:'13px' }}>शब्द</span> Correct
      </span>

      {/* half */}
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>
        <span style={{
          ...HF, color:'#fbbf24', fontSize:'13px',
          textDecoration:'underline', textDecorationStyle:'wavy',
          textDecorationColor:'#fbbf24', textUnderlineOffset:'3px',
        }}>शब्द</span> Half mistake
      </span>

      {/* full */}
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>
        <span style={{
          ...HF, color:'#f87171', fontSize:'13px',
          textDecoration:'line-through', textDecorationColor:'#f87171', textDecorationThickness:'2px',
        }}>शब्द</span> Full mistake
      </span>

      {/* replace */}
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>
        <span style={{
          ...HF, color:'#c084fc', fontSize:'13px',
          textDecoration:'line-through', textDecorationColor:'#c084fc', textDecorationThickness:'2px',
        }}>शब्द</span> Replace
      </span>

      {/* missing */}
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>
        <span style={{
          fontSize:'11px', color:'rgba(251,146,60,0.6)',
          border:'1.5px dashed rgba(251,146,60,0.5)', borderRadius:'4px', padding:'0 5px',
        }}>skip</span> Missing
      </span>

      {/* extra */}
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>
        <span style={{ ...HF, color:'#38bdf8', fontSize:'13px' }}>+शब्द</span> Extra
      </span>
    </div>
  );
}

/* ── LEFT panel word (original passage) ────────────────────────
   Shows the master word. Error positions get a coloured highlight
   so the user can spot "what should have been here".
──────────────────────────────────────────────────────────────── */
function OriginalWord({ master, status }) {
  if (!master) {
    /* extra word position — no master word, just a thin placeholder */
    return (
      <span style={{
        display:'inline-block', verticalAlign:'middle',
        width:'28px', height:'4px', margin:'0 5px 2px',
        borderRadius:'2px',
        background:'rgba(56,189,248,0.18)',
      }} title="No original word here — extra word typed" />
    );
  }

  const base = {
    ...HF,
    display:'inline-block',
    margin:'3px 3px',
    padding:'4px 9px',
    borderRadius:'8px',
    fontSize:'16px',
    lineHeight:'1.65',
    verticalAlign:'middle',
  };

  if (status === 'correct') {
    return (
      <span style={{ ...base, color:'rgba(255,255,255,0.70)' }}>
        {master}
      </span>
    );
  }

  const highlight = {
    half    : { color:'#fef08a', bg:'rgba(251,191,36,0.15)',  bdr:'rgba(251,191,36,0.35)'  },
    full    : { color:'#fca5a5', bg:'rgba(239,68,68,0.15)',   bdr:'rgba(239,68,68,0.35)'   },
    replace : { color:'#d8b4fe', bg:'rgba(168,85,247,0.15)', bdr:'rgba(168,85,247,0.35)'  },
    missing : { color:'#fdba74', bg:'rgba(251,146,60,0.15)', bdr:'rgba(251,146,60,0.40)'  },
    extra   : { color:'#7dd3fc', bg:'rgba(56,189,248,0.12)', bdr:'rgba(56,189,248,0.30)'  },
  };
  const h = highlight[status] || highlight.full;

  return (
    <span style={{ ...base, color: h.color, background: h.bg, border:`1.5px solid ${h.bdr}`, fontWeight:700 }}
      title={`Expected: "${master}"`}>
      {master}
    </span>
  );
}

/* ── RIGHT panel word (user's typing) ──────────────────────────
   Shows what the user typed.
   correct  → green, no decoration
   half     → amber + wavy underline
   full     → red + line-through
   replace  → purple + line-through
   missing  → dashed "—" slot (nothing was typed here)
   extra    → sky-blue (typed something extra)
──────────────────────────────────────────────────────────────── */
function TypedWord({ master, typed, status }) {
  const base = {
    ...HF,
    display:'inline-block',
    margin:'3px 3px',
    padding:'4px 9px',
    borderRadius:'8px',
    fontSize:'16px',
    lineHeight:'1.65',
    verticalAlign:'middle',
  };

  if (status === 'correct') {
    return (
      <span style={{ ...base, color:'#4ade80' }} title="Correct">
        {typed}
      </span>
    );
  }

  if (status === 'missing') {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center',
        margin:'3px 3px', padding:'4px 12px',
        borderRadius:'8px', verticalAlign:'middle',
        background:'rgba(251,146,60,0.08)',
        border:'1.5px dashed rgba(251,146,60,0.50)',
        color:'rgba(251,146,60,0.55)',
        fontSize:'13px', fontStyle:'italic', letterSpacing:'0.06em',
      }} title={`Should be: "${master}"`}>
        — skipped —
      </span>
    );
  }

  if (status === 'extra') {
    return (
      <span style={{ ...base, color:'#38bdf8', background:'rgba(56,189,248,0.10)', border:'1px solid rgba(56,189,248,0.28)' }}
        title={`Extra word: "${typed}" not in original`}>
        <span style={{ fontSize:'10px', fontWeight:900, marginRight:'3px', opacity:0.6 }}>+</span>
        {typed}
      </span>
    );
  }

  if (status === 'half') {
    return (
      <span style={{
        ...base,
        color:'#fbbf24',
        background:'rgba(251,191,36,0.10)',
        border:'1.5px solid rgba(251,191,36,0.35)',
        textDecoration:'underline',
        textDecorationStyle:'wavy',
        textDecorationColor:'#fbbf24',
        textDecorationThickness:'2px',
        textUnderlineOffset:'4px',
      }} title={`Half mistake — typed "${typed}", should be "${master}"`}>
        {typed}
      </span>
    );
  }

  if (status === 'full') {
    return (
      <span style={{
        ...base,
        color:'#f87171',
        background:'rgba(239,68,68,0.12)',
        border:'1.5px solid rgba(239,68,68,0.35)',
        textDecoration:'line-through',
        textDecorationColor:'#f87171',
        textDecorationThickness:'2.5px',
      }} title={`Full mistake — typed "${typed}", should be "${master}"`}>
        {typed}
      </span>
    );
  }

  if (status === 'replace') {
    return (
      <span style={{
        ...base,
        color:'#c084fc',
        background:'rgba(168,85,247,0.12)',
        border:'1.5px solid rgba(168,85,247,0.35)',
        textDecoration:'line-through',
        textDecorationColor:'#c084fc',
        textDecorationThickness:'2px',
      }} title={`Replace error — completely different word — typed "${typed}", should be "${master}"`}>
        {typed}
      </span>
    );
  }

  return <span style={{ ...base, color:'rgba(255,255,255,0.35)' }}>{typed ?? master}</span>;
}

/* ── Main export ─────────────────────────────────────────────── */
export default function DiffViewer({ comparison = [] }) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  if (!comparison.length) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4 opacity-25">🔍</div>
        <p className="text-sm" style={{ color:'rgba(255,255,255,0.25)' }}>No comparison data available.</p>
      </div>
    );
  }

  const allCorrect = comparison.every(w => w.status === 'correct');
  if (allCorrect) {
    return (
      <div className="text-center py-14">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-black text-emerald-400 text-xl">Perfect — every word correct!</p>
        <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.30)' }}>Outstanding performance</p>
      </div>
    );
  }

  const visible = showOnlyErrors
    ? comparison.filter(w => w.status !== 'correct')
    : comparison;

  const errorCount = comparison.filter(w => w.status !== 'correct').length;

  return (
    <div className="space-y-4">

      {/* Score */}
      <ScoreStrip comparison={comparison} />

      {/* Legend + toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1">
          <Legend />
        </div>
        <button
          onClick={() => setShowOnlyErrors(v => !v)}
          className="shrink-0 text-xs px-3 py-2 rounded-xl font-semibold transition-all"
          style={{
            background: showOnlyErrors ? 'rgba(99,102,241,0.20)' : 'rgba(255,255,255,0.05)',
            border: showOnlyErrors ? '1px solid rgba(99,102,241,0.40)' : '1px solid rgba(255,255,255,0.10)',
            color: showOnlyErrors ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
            whiteSpace:'nowrap',
          }}>
          {showOnlyErrors ? `${errorCount} errors shown` : 'Errors only'}
        </button>
      </div>

      {/* ── Side-by-side panels ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* LEFT — Original passage */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border:'1px solid rgba(110,231,183,0.20)', background:'rgba(16,185,129,0.04)' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom:'1px solid rgba(110,231,183,0.15)', background:'rgba(16,185,129,0.08)' }}>
            <span style={{ fontSize:'15px' }}>📄</span>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color:'#6ee7b7' }}>
              Original Passage
            </span>
          </div>
          {/* Words */}
          <div className="px-4 py-4" style={{ lineHeight:'2.8', ...HF }}>
            {visible.map((item, i) => (
              <OriginalWord key={i} master={item.master} status={item.status} />
            ))}
            {showOnlyErrors && visible.length === 0 && (
              <p className="text-sm py-4" style={{ color:'rgba(255,255,255,0.25)' }}>No errors to show.</p>
            )}
          </div>
          <p className="px-4 pb-3 text-[11px]" style={{ color:'rgba(255,255,255,0.18)' }}>
            Highlighted words show where an error occurred
          </p>
        </div>

        {/* RIGHT — User's typing */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border:'1px solid rgba(165,180,252,0.20)', background:'rgba(99,102,241,0.04)' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom:'1px solid rgba(165,180,252,0.15)', background:'rgba(99,102,241,0.08)' }}>
            <span style={{ fontSize:'15px' }}>✍️</span>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color:'#a5b4fc' }}>
              Your Typing
            </span>
          </div>
          {/* Words */}
          <div className="px-4 py-4" style={{ lineHeight:'2.8', ...HF }}>
            {visible.map((item, i) => (
              <TypedWord key={i} master={item.master} typed={item.typed} status={item.status} />
            ))}
            {showOnlyErrors && visible.length === 0 && (
              <p className="text-sm py-4" style={{ color:'rgba(255,255,255,0.25)' }}>No errors to show.</p>
            )}
          </div>
          <p className="px-4 pb-3 text-[11px]" style={{ color:'rgba(255,255,255,0.18)' }}>
            Wavy underline = half mistake · Strikethrough = full / replace
          </p>
        </div>

      </div>
    </div>
  );
}
