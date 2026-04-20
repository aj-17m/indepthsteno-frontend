/**
 * DiffViewer — two-panel comparison
 *
 * Panel 1 — ORIGINAL PASSAGE: master text with problem positions highlighted
 * Panel 2 — YOUR TYPING:      what the user typed, each word annotated by error type
 *
 * Error visual language
 * ─────────────────────
 *  Correct      green text, faint check background
 *  Half         amber text + thick wavy underline (1-char diff)
 *  Full         red text + double strikethrough (2+ char diff)
 *  Replace      purple text + strikethrough (completely different word)
 *  Missing      dashed red slot "- - -"   (user skipped the word)
 *  Extra        sky-blue text + left "+" border (user added a word)
 */

const HF = { fontFamily: '"Nirmala UI", Mangal, "Noto Sans Devanagari", serif' };

/* ── colour palette ─────────────────────────────────────────── */
const C = {
  correct : { text:'#4ade80',  bg:'rgba(16,185,129,0.10)', bdr:'rgba(16,185,129,0.28)' },
  half    : { text:'#fbbf24',  bg:'rgba(251,191,36,0.14)', bdr:'rgba(251,191,36,0.50)' },
  full    : { text:'#f87171',  bg:'rgba(239,68,68,0.15)',  bdr:'rgba(239,68,68,0.50)'  },
  replace : { text:'#c084fc',  bg:'rgba(168,85,247,0.14)', bdr:'rgba(168,85,247,0.50)' },
  missing : { text:'#fb923c',  bg:'rgba(239,68,68,0.10)',  bdr:'rgba(239,68,68,0.40)'  },
  extra   : { text:'#38bdf8',  bg:'rgba(56,189,248,0.12)', bdr:'rgba(56,189,248,0.40)' },
};

/* ─────────────────────────────────────────────────────────────
   MASTER word chip  (shown in Original Passage panel)
───────────────────────────────────────────────────────────── */
function MasterWord({ master, status }) {
  if (status === 'extra') {
    /* no master word at this position — show thin placeholder */
    return (
      <span style={{
        display:'inline-block', verticalAlign:'middle',
        width:'32px', height:'6px', margin:'0 6px 4px',
        borderRadius:'3px', background:'rgba(56,189,248,0.20)',
        border:'1px solid rgba(56,189,248,0.30)',
      }} title="No master word here — extra word inserted by user"/>
    );
  }

  const base = {
    ...HF,
    display:'inline-block',
    margin:'3px 4px',
    padding:'3px 8px',
    borderRadius:'8px',
    fontSize:'16px',
    lineHeight:'1.6',
    verticalAlign:'middle',
  };

  if (status === 'correct') {
    return (
      <span style={{ ...base, color:'rgba(255,255,255,0.80)', background:'transparent' }}>
        {master}
      </span>
    );
  }

  /* highlighted = had an error at this position */
  const c = C[status] || C.full;
  return (
    <span style={{
      ...base,
      color: c.text,
      background: c.bg,
      border: `1.5px solid ${c.bdr}`,
      fontWeight: 700,
    }}
      title={`${status} — correct word: "${master}"`}>
      {master}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   TYPED word chip  (shown in Your Typing panel)
───────────────────────────────────────────────────────────── */
function TypedWord({ master, typed, status, mistakeType }) {
  const base = {
    ...HF,
    display:'inline-block',
    margin:'3px 4px',
    padding:'3px 8px',
    borderRadius:'8px',
    fontSize:'16px',
    lineHeight:'1.6',
    verticalAlign:'middle',
  };

  /* ── correct ─────────────────────────────────────────── */
  if (status === 'correct') {
    return (
      <span style={{
        ...base,
        color: C.correct.text,
        background: C.correct.bg,
      }} title="Correct">
        {typed}
      </span>
    );
  }

  /* ── missing — user skipped this word ───────────────── */
  if (status === 'missing') {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:'4px',
        margin:'3px 4px', padding:'3px 10px',
        borderRadius:'8px', verticalAlign:'middle',
        background:'rgba(239,68,68,0.08)',
        border:'2px dashed rgba(239,68,68,0.50)',
      }} title={`Missing — should be "${master}"`}>
        <span style={{ fontSize:'9px', color:'#f87171', fontWeight:900 }}>✕</span>
        <span style={{ ...HF, fontSize:'13px', color:'rgba(248,113,113,0.55)',
          letterSpacing:'0.12em', fontStyle:'italic' }}>skipped</span>
      </span>
    );
  }

  /* ── extra — user typed a word not in passage ────────── */
  if (status === 'extra') {
    return (
      <span style={{
        ...base,
        color: C.extra.text,
        background: C.extra.bg,
        borderLeft: `4px solid ${C.extra.bdr}`,
        paddingLeft:'10px',
      }} title={`Extra word — "${typed}" not in passage`}>
        <span style={{ fontSize:'10px', fontWeight:900, marginRight:'4px', opacity:0.7 }}>+</span>
        {typed}
      </span>
    );
  }

  /* ── half mistake — wavy underline (1-char diff) ─────── */
  if (status === 'half') {
    return (
      <span style={{
        ...base,
        color: C.half.text,
        background: C.half.bg,
        border: `1.5px solid ${C.half.bdr}`,
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

  /* ── full mistake — double strikethrough ─────────────── */
  if (status === 'full') {
    return (
      <span style={{
        ...base,
        color: C.full.text,
        background: C.full.bg,
        border: `1.5px solid ${C.full.bdr}`,
        textDecoration:'line-through',
        textDecorationColor:'#f87171',
        textDecorationThickness:'2.5px',
        /* double line via box-shadow trick */
        boxShadow:`inset 0 -1px 0 0 rgba(248,113,113,0.55)`,
      }} title={`Full mistake — typed "${typed}", should be "${master}"`}>
        {typed}
      </span>
    );
  }

  /* ── replace error — completely different word ───────── */
  if (status === 'replace') {
    return (
      <span style={{
        ...base,
        color: C.replace.text,
        background: C.replace.bg,
        border: `1.5px solid ${C.replace.bdr}`,
        textDecoration:'line-through',
        textDecorationColor:'#c084fc',
        textDecorationThickness:'2px',
        /* diagonal stripe overlay via repeating-linear-gradient */
        backgroundImage:'repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(168,85,247,0.07) 4px,rgba(168,85,247,0.07) 8px)',
      }} title={`Replace error — completely different word — typed "${typed}", should be "${master}"`}>
        {typed}
      </span>
    );
  }

  /* fallback */
  return <span style={{ ...base, color:'rgba(255,255,255,0.40)' }}>{typed || master}</span>;
}

/* ─────────────────────────────────────────────────────────────
   Legend strip
───────────────────────────────────────────────────────────── */
function Legend() {
  const items = [
    {
      label: 'Correct',
      chip: (
        <span style={{ ...HF, fontSize:'13px', padding:'2px 8px', borderRadius:'6px',
          color: C.correct.text, background: C.correct.bg }}>शब्द</span>
      ),
    },
    {
      label: 'Half mistake (1 char off)',
      chip: (
        <span style={{ ...HF, fontSize:'13px', padding:'2px 8px', borderRadius:'6px',
          color: C.half.text, background: C.half.bg, border:`1.5px solid ${C.half.bdr}`,
          textDecoration:'underline', textDecorationStyle:'wavy',
          textDecorationColor:'#fbbf24', textUnderlineOffset:'3px' }}>शब्द</span>
      ),
    },
    {
      label: 'Full mistake (2+ chars)',
      chip: (
        <span style={{ ...HF, fontSize:'13px', padding:'2px 8px', borderRadius:'6px',
          color: C.full.text, background: C.full.bg, border:`1.5px solid ${C.full.bdr}`,
          textDecoration:'line-through', textDecorationThickness:'2.5px' }}>शब्द</span>
      ),
    },
    {
      label: 'Replace (wrong word)',
      chip: (
        <span style={{ ...HF, fontSize:'13px', padding:'2px 8px', borderRadius:'6px',
          color: C.replace.text, background: C.replace.bg, border:`1.5px solid ${C.replace.bdr}`,
          textDecoration:'line-through',
          backgroundImage:'repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(168,85,247,0.10) 4px,rgba(168,85,247,0.10) 8px)',
        }}>शब्द</span>
      ),
    },
    {
      label: 'Skipped',
      chip: (
        <span style={{ fontSize:'13px', padding:'2px 10px', borderRadius:'6px',
          color:'rgba(248,113,113,0.55)', background:'rgba(239,68,68,0.08)',
          border:'2px dashed rgba(239,68,68,0.45)', fontStyle:'italic' }}>skipped</span>
      ),
    },
    {
      label: 'Extra word',
      chip: (
        <span style={{ ...HF, fontSize:'13px', padding:'2px 8px', borderRadius:'6px',
          color: C.extra.text, background: C.extra.bg,
          borderLeft:`4px solid ${C.extra.bdr}`, paddingLeft:'10px' }}>
          <span style={{ fontSize:'9px', marginRight:'3px', opacity:0.7 }}>+</span>शब्द
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 rounded-2xl"
      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
        style={{ color:'rgba(255,255,255,0.25)' }}>Legend</span>
      {items.map(({ label, chip }) => (
        <div key={label} className="flex items-center gap-2">
          {chip}
          <span className="text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Score summary bar
───────────────────────────────────────────────────────────── */
function ScoreBar({ comparison }) {
  const counts = {
    correct : comparison.filter(w => w.status === 'correct').length,
    half    : comparison.filter(w => w.status === 'half').length,
    full    : comparison.filter(w => w.status === 'full').length,
    replace : comparison.filter(w => w.status === 'replace').length,
    missing : comparison.filter(w => w.status === 'missing').length,
    extra   : comparison.filter(w => w.status === 'extra').length,
  };
  const total = comparison.filter(w => w.master).length;

  const badges = [
    { key:'correct', icon:'✓', label:'Correct',  ...C.correct },
    { key:'half',    icon:'〰', label:'Half',     ...C.half    },
    { key:'full',    icon:'✂', label:'Full',     ...C.full    },
    { key:'replace', icon:'↔', label:'Replace',  ...C.replace },
    { key:'missing', icon:'✕', label:'Missing',  ...C.missing },
    { key:'extra',   icon:'+', label:'Extra',    ...C.extra   },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl"
      style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border:'1px solid rgba(99,102,241,0.18)' }}>
      {badges.map(b => counts[b.key] > 0 && (
        <span key={b.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
          style={{ background:b.bg, border:`1.5px solid ${b.bdr}`, color:b.text }}>
          <span>{b.icon}</span>
          <span>{counts[b.key]}</span>
          <span className="font-normal opacity-60">{b.label}</span>
        </span>
      ))}
      <span className="ml-auto text-[11px]" style={{ color:'rgba(255,255,255,0.20)' }}>
        {total} passage words
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Panel wrapper
───────────────────────────────────────────────────────────── */
function Panel({ title, icon, accentColor, children }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border:`1px solid rgba(255,255,255,0.09)`, background:'rgba(255,255,255,0.025)' }}>
      {/* header */}
      <div className="flex items-center gap-2.5 px-5 py-3"
        style={{
          background:`${accentColor}12`,
          borderBottom:`1px solid ${accentColor}25`,
        }}>
        <span style={{ fontSize:'16px' }}>{icon}</span>
        <span className="text-xs font-black uppercase tracking-widest"
          style={{ color:`${accentColor}` }}>{title}</span>
      </div>
      {/* content */}
      <div className="px-5 py-5" style={{ lineHeight:'2.6', ...HF }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────── */
export default function DiffViewer({ comparison = [] }) {
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

  return (
    <div className="space-y-4">

      {/* Score summary */}
      <ScoreBar comparison={comparison} />

      {/* Legend */}
      <Legend />

      {/* ── Panel 1: Original Passage ─────────────────────────── */}
      <Panel title="Original Passage" icon="📄" accentColor="#6ee7b7">
        <div>
          {comparison.map((item, i) => (
            <MasterWord
              key={i}
              master={item.master}
              status={item.status}
            />
          ))}
        </div>
        <p className="text-[11px] mt-3 pt-3" style={{ color:'rgba(255,255,255,0.22)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          Highlighted words show positions where an error occurred — this is what you should have typed.
        </p>
      </Panel>

      {/* ── Panel 2: Your Typing ──────────────────────────────── */}
      <Panel title="Your Typing" icon="✍️" accentColor="#a5b4fc">
        <div>
          {comparison.map((item, i) => (
            <TypedWord
              key={i}
              master={item.master}
              typed={item.typed}
              status={item.status}
              mistakeType={item.mistakeType}
            />
          ))}
        </div>
        <p className="text-[11px] mt-3 pt-3" style={{ color:'rgba(255,255,255,0.22)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          Each word shows exactly how you typed it — hover any word for details.
        </p>
      </Panel>

    </div>
  );
}
