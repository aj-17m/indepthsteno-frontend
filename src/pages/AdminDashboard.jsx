import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Leaderboard from '../components/Leaderboard';
import ThemeToggle from '../components/ThemeToggle';

const TABS = ['Upload Steno Test', 'Upload Practice Test', 'Categories', 'Users', 'Assignments', 'Results', 'Reviews'];

/* ─── helpers ────────────────────────────────────────────── */
const makeMsg = (text) => ({
  ok: text.toLowerCase().includes('success') ||
      text.toLowerCase().includes('creat')   ||
      text.toLowerCase().includes('assign')  ||
      text.toLowerCase().includes('replac')  ||
      text.toLowerCase().includes('updat'),
  text,
});
function Msg({ m }) {
  if (!m) return null;
  return (
    <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl animate-scale-in"
      style={m.ok
        ? { background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)' }
        : { background:'rgba(239,68,68,0.12)',  color:'#fca5a5', border:'1px solid rgba(239,68,68,0.25)' }}>
      <span>{m.ok ? '✅' : '❌'}</span>
      <span>{m.text}</span>
    </div>
  );
}
const fmtTime = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';

/* ─── PDF Status Badge ───────────────────────────────────── */
function PdfStatusCard({ preview }) {
  if (!preview) return null;
  const { hasDevanagari, wordCount, pages, warning, charCount } = preview;
  return (
    <div className="rounded-xl p-4 border animate-scale-in"
      style={hasDevanagari
        ? { background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.25)' }
        : { background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.25)' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{hasDevanagari ? '✅' : '⚠️'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm"
            style={hasDevanagari ? { color:'#34d399' } : { color:'#fbbf24' }}>
            {hasDevanagari ? 'Hindi (Unicode) text detected' : 'No Hindi text detected'}
          </p>
          <div className="flex gap-4 mt-1 text-xs" style={{ color:'var(--text-3)' }}>
            <span>📄 {pages} page{pages!==1?'s':''}</span>
            <span>📝 {wordCount} words</span>
            <span>🔤 {charCount} chars</span>
          </div>
          {warning && <p className="text-xs mt-2 leading-relaxed" style={{ color:'#fbbf24' }}>{warning}</p>}
          {hasDevanagari && (
            <p className="text-xs mt-1" style={{ color:'#34d399' }}>
              Audio will be generated in Hindi. Review and edit the text below if needed.
            </p>
          )}
        </div>
      </div>

      {/* Compatibility table */}
      <div className="mt-3 pt-3 grid grid-cols-2 gap-1.5 text-xs"
        style={{ borderTop:'1px solid var(--border)' }}>
        {[
          { label: 'Unicode Hindi PDF (NirmalaUI/Mangal)', ok: hasDevanagari },
          { label: 'Scanned / Image PDF',                  ok: false, note: 'use OCR or paste text' },
          { label: 'KrutiDev / DevLys encoded PDF',        ok: false, note: 'paste Unicode text below' },
          { label: 'English / other language PDF',         ok: true  },
        ].map(({ label, ok, note }) => (
          <div key={label} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5"
            style={{ background:'var(--bg-card)' }}>
            <span>{ok ? '✅' : '❌'}</span>
            <div>
              <p className="font-medium" style={{ color:'var(--text-2)' }}>{label}</p>
              {note && <p style={{ color:'var(--text-3)' }}>{note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Reusable input style helpers ──────────────────────── */
const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
  borderRadius: '0.75rem',
  padding: '0.625rem 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
};
const labelStyle = {
  color: 'var(--text-2)',
  fontSize: '0.75rem',
  fontWeight: 700,
};

function ThemedInput({ style: extraStyle, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? { border: '1px solid var(--border-hi)', boxShadow: '0 0 0 3px var(--accent-glow)' } : {}),
        ...extraStyle,
      }}
      onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e); }}
      onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e); }}
    />
  );
}

function ThemedSelect({ children, style: extraStyle, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? { border: '1px solid var(--border-hi)', boxShadow: '0 0 0 3px var(--accent-glow)' } : {}),
        ...extraStyle,
      }}
      onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e); }}
      onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e); }}
    >
      {children}
    </select>
  );
}

function ThemedTextarea({ style: extraStyle, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize: 'vertical',
        ...(focused ? { border: '1px solid var(--border-hi)', boxShadow: '0 0 0 3px var(--accent-glow)' } : {}),
        ...extraStyle,
      }}
      onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e); }}
      onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e); }}
    />
  );
}

/* ─── Card style ─────────────────────────────────────────── */
const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

/* ─── Upload / Create Test Form ──────────────────────────── */
function CreateTestForm({ tests, users, onCreated, categories }) {
  const MODE_PDF  = 'pdf';
  const MODE_TEXT = 'text'; // direct paste, no PDF

  const [mode,        setMode]        = useState(MODE_PDF);
  const [form,        setForm]        = useState({ title:'', timer:30, category:'' });
  const [pdfFile,     setPdfFile]     = useState(null);
  const [audioFile,   setAudioFile]   = useState(null);
  const [masterText,  setMasterText]  = useState('');
  const [preview,     setPreview]     = useState(null);
  const [previewing,  setPreviewing]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [msg,         setMsg]         = useState(null);
  const textRef = useRef(null);

  /* PDF selected → auto-extract */
  const handlePdfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    setPreview(null);
    setMasterText('');
    setPreviewing(true);
    setMsg(null);
    const fd = new FormData();
    fd.append('pdf', file);
    try {
      const r = await api.post('/admin/preview-pdf', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(r.data);
      setMasterText(r.data.text || '');
    } catch (err) {
      setMsg(makeMsg(err.response?.data?.message || 'Failed to extract PDF text'));
    } finally { setPreviewing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (mode === MODE_PDF && !pdfFile)   return;
    if (mode === MODE_TEXT && !masterText.trim()) return;
    setUploading(true); setMsg(null);

    const fd = new FormData();
    fd.append('title',  form.title.trim());
    fd.append('timer',  form.timer);
    fd.append('category',   form.category || '');
    fd.append('masterText', masterText.trim());
    if (mode === MODE_PDF && pdfFile)   fd.append('pdf',   pdfFile);
    else if (mode === MODE_TEXT)        fd.append('pdf',   new Blob([], {type:'application/pdf'}), 'empty.pdf');
    if (audioFile) fd.append('audio', audioFile);

    try {
      await api.post('/admin/upload-test', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(makeMsg('Test created successfully!'));
      setForm({ title:'', timer:30, category:'' });
      setPdfFile(null); setAudioFile(null);
      setMasterText(''); setPreview(null);
      onCreated();
    } catch (err) {
      setMsg(makeMsg(err.response?.data?.message || 'Upload failed'));
    } finally { setUploading(false); }
  };

  return (
    <div style={cardStyle}>
      <h2 className="text-lg mb-1" style={{ color:'var(--text-1)', fontWeight:800 }}>Create New Test</h2>
      <p className="text-sm mb-4" style={{ color:'var(--text-3)' }}>Upload a PDF or paste Hindi text directly</p>

      {/* Mode toggle */}
      <div className="flex rounded-xl p-1 mb-5"
        style={{ background:'var(--bg-card)' }}>
        {[
          { v: MODE_PDF,  label: '📄 Upload PDF',        sub: 'Auto-extract text' },
          { v: MODE_TEXT, label: '✍️ Paste Text',        sub: 'Type/paste Hindi directly' },
        ].map(opt => (
          <button key={opt.v} type="button"
            onClick={() => { setMode(opt.v); setMsg(null); }}
            className="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all"
            style={mode === opt.v
              ? { background:'var(--bg-surface)', color:'#6366f1', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }
              : { background:'transparent', color:'var(--text-2)' }}>
            <p>{opt.label}</p>
            <p className="text-xs font-normal opacity-70">{opt.sub}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block mb-1" style={labelStyle}>Test Title *</label>
          <ThemedInput type="text" required
            value={form.title}
            onChange={e => setForm({...form, title:e.target.value})}
            placeholder="e.g. SSC Steno Hindi Practice Set 1"
          />
        </div>

        {/* PDF mode */}
        {mode === MODE_PDF && (
          <div className="space-y-3">
            <div>
              <label className="block mb-1" style={labelStyle}>
                PDF File * <span style={{ fontWeight:400, color:'var(--text-3)' }}>(Unicode Hindi only — not scanned)</span>
              </label>
              <input type="file" accept="application/pdf"
                onChange={handlePdfChange}
                className="file-input-dark w-full text-sm"
                style={{ color:'var(--text-2)' }}
              />
              {previewing && (
                <div className="flex items-center gap-2 mt-2 text-xs animate-pulse" style={{ color:'#6366f1' }}>
                  <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:'#818cf8', borderTopColor:'transparent' }}/>
                  Extracting text from PDF…
                </div>
              )}
            </div>
            <PdfStatusCard preview={preview}/>
          </div>
        )}

        {/* Extracted / Manual text editor */}
        {(mode === MODE_TEXT || (mode === MODE_PDF && (preview || masterText))) && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label style={labelStyle}>
                {mode === MODE_PDF ? '📝 Extracted Text (review & edit if needed)' : '✍️ Hindi Text *'}
              </label>
              <div className="flex items-center gap-2">
                {masterText && (
                  <span className="text-xs" style={{ color:'var(--text-3)' }}>
                    {masterText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
                <button type="button" onClick={() => setMasterText('')}
                  className="text-xs" style={{ color:'#ef4444' }}>Clear</button>
              </div>
            </div>
            <ThemedTextarea
              ref={textRef}
              value={masterText}
              onChange={e => setMasterText(e.target.value)}
              rows={8}
              required={mode === MODE_TEXT}
              placeholder={mode === MODE_TEXT
                ? 'यहाँ हिंदी टेक्स्ट पेस्ट करें या टाइप करें…\n(Unicode Hindi only — works with Mangal, Nirmala UI, Kruti Dev converted to Unicode)'
                : 'PDF text will appear here after upload. Edit to fix any extraction errors…'}
              style={{ fontFamily:'Nirmala UI, Mangal, Arial Unicode MS, serif', fontSize:'15px', lineHeight:'2' }}
            />
            {mode === MODE_PDF && preview && !preview.hasDevanagari && (
              <div className="mt-2 rounded-xl p-4 space-y-2 text-sm"
                style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.20)' }}>
                <p className="font-bold" style={{ color:'#fbbf24' }}>⚠️ PDF doesn't contain Unicode Hindi</p>
                <p className="text-xs leading-relaxed" style={{ color:'var(--text-2)' }}>
                  This PDF uses <strong>KrutiDev, DevLys, or another non-Unicode font</strong> —
                  the extracted text will look like English garbage characters.<br/>
                  <strong>Solution:</strong> Paste the correct Unicode Hindi text in the box above.
                </p>
                <div className="rounded-lg p-3 text-xs space-y-1.5"
                  style={{ background:'var(--bg-card)', color:'var(--text-2)' }}>
                  <p className="font-semibold">How to get Unicode Hindi text:</p>
                  <p>1️⃣ Open the original Word/PDF file and copy text</p>
                  <p>2️⃣ Use <a href="https://www.ildc.in/Hindi/chtmls/Converter.aspx" target="_blank" rel="noreferrer" style={{ color:'#818cf8', textDecoration:'underline' }}>ILDC KrutiDev→Unicode converter</a></p>
                  <p>3️⃣ Use <a href="https://hindi-unicode-converter.com" target="_blank" rel="noreferrer" style={{ color:'#818cf8', textDecoration:'underline' }}>Hindi Unicode Converter</a></p>
                  <p>4️⃣ Or switch to "Paste Text" mode above and type directly</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Duration picker */}
        <div>
          <label className="block mb-3" style={labelStyle}>
            ⏱ Test Duration <span style={{ fontWeight:400, color:'var(--text-3)' }}>(fixed for all users)</span>
          </label>

          {/* Value display */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black" style={{ color:'var(--text-1)' }}>{form.timer}</span>
              <span className="text-sm font-semibold" style={{ color:'var(--text-3)' }}>min</span>
            </div>
            <div className="flex gap-1.5">
              {[5, 10, 15, 30, 45, 60].map(m => (
                <button key={m} type="button"
                  onClick={() => setForm({ ...form, timer: m })}
                  className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all hover:scale-105 active:scale-95"
                  style={form.timer === m ? {
                    background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    color:'white',
                    border:'1px solid rgba(99,102,241,0.4)',
                  } : {
                    background:'var(--bg-card)',
                    color:'var(--text-3)',
                    border:'1px solid var(--border)',
                  }}>
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Slider */}
          {(() => {
            const pct = ((form.timer - 3) / (120 - 3)) * 100;
            return (
              <input
                type="range" min="3" max="120" step="1"
                value={form.timer}
                onChange={e => setForm({ ...form, timer: Number(e.target.value) })}
                className="steno-range"
                style={{
                  background:`linear-gradient(90deg,#4f46e5 ${pct}%,var(--border) ${pct}%)`,
                }}
              />
            );
          })()}

          <div className="flex justify-between text-xs mt-1" style={{ color:'var(--text-3)' }}>
            <span>3 min</span>
            <span>30 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block mb-1" style={labelStyle}>Category</label>
          <ThemedSelect value={form.category || ''} onChange={e => setForm({...form, category:e.target.value})}>
            <option value="" style={{ background:'var(--bg-input)', color:'var(--text-1)' }}>No category (uncategorized)</option>
            {(categories||[]).map(c => (
              <option key={c._id} value={c._id} style={{ background:'var(--bg-input)', color:'var(--text-1)' }}>
                {c.icon} {c.name}
              </option>
            ))}
          </ThemedSelect>
        </div>

        {/* Audio */}
        <div>
          <label className="block mb-1" style={labelStyle}>
            Audio File <span style={{ fontWeight:400, color:'var(--text-3)' }}>(MP3/WAV — leave blank to auto-generate)</span>
          </label>
          <input type="file" accept="audio/*"
            onChange={e => setAudioFile(e.target.files[0])}
            className="file-input-green w-full text-sm"
            style={{ color:'var(--text-2)' }}
          />
        </div>

        {/* TTS info box */}
        {!audioFile && (
          <div className="rounded-xl p-3 text-xs flex items-start gap-2"
            style={{ background:'var(--tip-bg)', border:'1px solid var(--tip-border)', color:'var(--tip-text)' }}>
            <span className="text-base">🤖</span>
            <span>
              <strong>Auto audio generation:</strong> Hindi text (Devanagari) → Python gTTS (high quality Hindi voice).
              Other languages → English TTS. You can also upload your own MP3/WAV recording for best results.
            </span>
          </div>
        )}

        <Msg m={msg}/>

        <button type="submit" disabled={uploading ||
            (mode === MODE_PDF && !pdfFile) ||
            (mode === MODE_TEXT && !masterText.trim()) ||
            !form.title.trim()}
          className="w-full gradient-bg text-white font-bold py-3.5 rounded-xl transition hover:opacity-90 active:scale-95 disabled:opacity-40 shadow flex items-center justify-center gap-2">
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              Processing… (extracting + generating audio)
            </>
          ) : '🚀 Create Test'}
        </button>
      </form>
    </div>
  );
}

/* ─── Upload Practice-Only Content Form ─────────────────── */
function PracticeUploadForm({ categories, onCreated }) {
  const MODE_PDF  = 'pdf';
  const MODE_TEXT = 'text';
  const [mode,       setMode]       = useState(MODE_TEXT);
  const [form,       setForm]       = useState({ title:'', timer:30, category:'' });
  const [pdfFile,    setPdfFile]    = useState(null);
  const [audioFile,  setAudioFile]  = useState(null);
  const [masterText, setMasterText] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [msg,        setMsg]        = useState(null);

  const handlePdfChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setPdfFile(file); setMasterText(''); setPreviewing(true); setMsg(null);
    const fd = new FormData(); fd.append('pdf', file);
    try {
      const r = await api.post('/admin/preview-pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMasterText(r.data.text || '');
    } catch (err) { setMsg(makeMsg('Failed to extract PDF text')); }
    finally { setPreviewing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !masterText.trim()) return;
    setUploading(true); setMsg(null);
    const fd = new FormData();
    fd.append('title',      form.title.trim());
    fd.append('timer',      form.timer);
    fd.append('category',   form.category || '');
    fd.append('masterText', masterText.trim());
    if (mode === MODE_PDF && pdfFile) fd.append('pdf', pdfFile);
    if (audioFile) fd.append('audio', audioFile);
    try {
      await api.post('/admin/upload-practice', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg(makeMsg('Practice content created successfully!'));
      setForm({ title:'', timer:30, category:'' });
      setPdfFile(null); setAudioFile(null); setMasterText('');
      onCreated();
    } catch (err) { setMsg(makeMsg(err.response?.data?.message || 'Upload failed')); }
    finally { setUploading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-xl p-1" style={{ background:'var(--bg-card)' }}>
        {[{ v:MODE_TEXT, label:'✍️ Paste Text' }, { v:MODE_PDF, label:'📄 Upload PDF' }].map(opt => (
          <button key={opt.v} type="button" onClick={() => setMode(opt.v)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
            style={mode === opt.v
              ? { background:'var(--bg-surface)', color:'#6366f1' }
              : { background:'transparent', color:'var(--text-2)' }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <div>
        <label className="block mb-1 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Title *</label>
        <ThemedInput type="text" required value={form.title}
          onChange={e => setForm({...form, title:e.target.value})}
          placeholder="e.g. Hindi Practice Set 1" />
      </div>

      {/* PDF upload */}
      {mode === MODE_PDF && (
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>PDF File *</label>
          <input type="file" accept="application/pdf" onChange={handlePdfChange}
            className="file-input-dark w-full text-sm" style={{ color:'var(--text-2)' }} />
          {previewing && <p className="text-xs mt-1 animate-pulse" style={{ color:'#6366f1' }}>Extracting text…</p>}
        </div>
      )}

      {/* Text passage */}
      {(mode === MODE_TEXT || masterText) && (
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>
            Hindi Text * {mode === MODE_PDF && '(extracted — edit if needed)'}
          </label>
          <ThemedTextarea rows={6} required value={masterText}
            onChange={e => setMasterText(e.target.value)}
            placeholder="हिन्दी में अनुच्छेद यहाँ paste करें…"
            style={{ fontFamily:'Nirmala UI, Mangal, sans-serif', fontSize:'15px' }} />
        </div>
      )}

      {/* Timer */}
      <div>
        <label className="block mb-1 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Timer (minutes)</label>
        <ThemedInput type="number" min={1} max={120} value={form.timer}
          onChange={e => setForm({...form, timer:e.target.value})} />
      </div>

      {/* Category */}
      <div>
        <label className="block mb-1 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Category (optional)</label>
        <ThemedSelect value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
          <option value="">— No category —</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </ThemedSelect>
      </div>

      {/* Audio (optional) */}
      <div>
        <label className="block mb-1 text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>
          Audio File <span style={{ fontWeight:400, color:'var(--text-3)' }}>(optional — no audio needed for practice)</span>
        </label>
        <input type="file" accept="audio/*"
          onChange={e => setAudioFile(e.target.files[0] || null)}
          className="file-input-dark w-full text-sm" style={{ color:'var(--text-2)' }} />
      </div>

      <Msg m={msg} />
      <button type="submit" disabled={uploading || !form.title || !masterText}
        className="w-full py-3 rounded-xl text-sm font-black transition-all"
        style={{
          background: uploading ? 'var(--bg-surface)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
          color: uploading ? 'var(--text-3)' : 'white',
          opacity: (!form.title || !masterText) ? 0.5 : 1,
        }}>
        {uploading ? '⏳ Uploading…' : '✏️ Create Practice Content'}
      </button>
    </form>
  );
}

/* ─── Main AdminDashboard ────────────────────────────────── */
export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab] = useState('Upload Steno Test');

  const [tests,       setTests]       = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [users,       setUsers]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [results,     setResults]     = useState([]);

  const [leaderboardTestId, setLeaderboardTestId] = useState(null);
  const [leaderboardData,   setLeaderboardData]   = useState([]);

  const [userForm, setUserForm] = useState({ name:'', email:'', password:'', role:'user', accessExpiry:'' });
  const [userMsg,  setUserMsg]  = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null); // { name, email, password }
  const [extendUser,        setExtendUser]        = useState(null);
  const [extendExpiry,      setExtendExpiry]      = useState('');
  const [extendCooldown,    setExtendCooldown]    = useState(0);   // hours 0-5
  const [extendResetDevice, setExtendResetDevice] = useState(false);
  const [extendMsg,         setExtendMsg]         = useState(null);

  const [assignUserId,    setAssignUserId]    = useState('');
  const [assignSelected,  setAssignSelected]  = useState(new Set());
  const [assignSearch,    setAssignSearch]    = useState('');
  const [assignMsg,       setAssignMsg]       = useState(null);
  const [assignLoading,   setAssignLoading]   = useState(false);

  const [catForm,    setCatForm]    = useState({ name:'', description:'', icon:'📋', color:'#4f46e5', instructions:'' });
  const [catMsg,     setCatMsg]     = useState(null);
  const [editCat,    setEditCat]    = useState(null); // null = create mode, object = edit mode

  const [audioReplaceFor, setAudioReplaceFor] = useState(null);

  // ── Edit test modal state ───────────────────────────────────────────────────
  const [editTestModal,   setEditTestModal]   = useState(null);   // null | test object (with extractedText)
  const [editTestForm,    setEditTestForm]    = useState({});
  const [editTestLoading, setEditTestLoading] = useState(false);
  const [editTestSaving,  setEditTestSaving]  = useState(false);
  const [editTestMsg,     setEditTestMsg]     = useState(null);
  const [editRegenAudio,  setEditRegenAudio]  = useState(false);
  const [textChanged,     setTextChanged]     = useState(false);

  // ── Reviews state ─────────────────────────────────────────────────────────
  const REVIEW_COLOR_OPTIONS = ['#6366f1','#7c3aed','#ec4899','#10b981','#f59e0b','#ef4444','#0ea5e9','#06b6d4','#f97316'];
  const STAR_OPTIONS = [4, 4.5, 5];
  const blankReview = { name:'', role:'', avatarColor:'#6366f1', stars:5, reviewHi:'', reviewEn:'' };
  const [reviews,     setReviews]     = useState([]);
  const [reviewForm,  setReviewForm]  = useState(blankReview);
  const [editReview,  setEditReview]  = useState(null);   // null = create, obj = edit
  const [reviewMsg,   setReviewMsg]   = useState(null);

  // ── Results drill-down state ───────────────────────────────────────────────
  const [resultSearch,      setResultSearch]      = useState('');
  const [resultUser,        setResultUser]        = useState(null);   // selected user obj
  const [userResults,       setUserResults]       = useState([]);
  const [userResultsLoading,setUserResultsLoading]= useState(false);
  const [resultDetail,      setResultDetail]      = useState(null);   // full detail in modal
  const [resultDetailLoading,setResultDetailLoading] = useState(false);
  const [audioFile,       setAudioFile]       = useState(null);
  const [audioMsg,        setAudioMsg]        = useState(null);

  const EMOJI_OPTIONS = ['📋','📝','🎯','🏛️','⚖️','🚂','👮','📖','✍️','🎓','🏅','💼','🔖','📌','🗂️'];
  const COLOR_OPTIONS = ['#4f46e5','#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];

  const fetchAll = useCallback(() => {
    api.get('/admin/tests').then(r => setTests(r.data)).catch(()=>{});
    api.get('/admin/categories').then(r => setCategories(r.data)).catch(()=>{});
    api.get('/admin/users').then(r => setUsers(r.data)).catch(()=>{});
    api.get('/admin/assignments').then(r => setAssignments(r.data)).catch(()=>{});
    api.get('/admin/results').then(r => setResults(r.data)).catch(()=>{});
    api.get('/admin/reviews').then(r => setReviews(r.data)).catch(()=>{});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleActive = async (id, cur) => {
    await api.patch(`/admin/tests/${id}/status`, { isActive: !cur });
    fetchAll();
  };

  const togglePractice = async (id, cur) => {
    await api.put(`/admin/tests/${id}`, { practiceEnabled: !cur });
    fetchAll();
  };

  const deleteTest = async (id) => {
    if (!confirm('Delete this test and all assignments?')) return;
    await api.delete(`/admin/tests/${id}`); fetchAll();
  };

  const handleAudioReplace = async (e) => {
    e.preventDefault();
    if (!audioFile) return;
    setAudioMsg(null);
    const fd = new FormData(); fd.append('audio', audioFile);
    try {
      await api.put(`/admin/tests/${audioReplaceFor}/audio`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAudioMsg(makeMsg('Audio replaced successfully!')); fetchAll();
    } catch (err) { setAudioMsg(makeMsg(err.response?.data?.message || 'Failed')); }
  };

  const regenerateAudio = async (id) => {
    if (!confirm('Regenerate audio using Python gTTS (Hindi)?')) return;
    try {
      await api.post(`/admin/tests/${id}/regenerate-audio`);
      alert('Audio regenerated!'); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault(); setUserMsg(null); setCreatedCreds(null);
    const { name, email, password } = userForm;
    try {
      await api.post('/admin/users', userForm);
      setCreatedCreds({ name, email, password });
      setUserMsg(makeMsg('User created successfully!'));
      setUserForm({ name:'', email:'', password:'', role:'user', accessExpiry:'' }); fetchAll();
    } catch (err) { setUserMsg(makeMsg(err.response?.data?.message || 'Failed')); }
  };

  const handleExtendAccess = async (e) => {
    e.preventDefault(); setExtendMsg(null);
    try {
      await api.patch(`/admin/users/${extendUser._id}`, {
        accessExpiry      : extendExpiry || null,
        resetDevice       : extendResetDevice,
        reAttemptCooldown : extendCooldown,
      });
      setExtendMsg(makeMsg('Access updated successfully!'));
      fetchAll();
      setTimeout(() => { setExtendUser(null); setExtendExpiry(''); setExtendResetDevice(false); setExtendMsg(null); }, 1500);
    } catch (err) { setExtendMsg(makeMsg(err.response?.data?.message || 'Failed')); }
  };

  // Quick-pick: returns ISO date string N days from now
  const daysFromNow = (d) => {
    const dt = new Date(); dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };

  // Returns expiry status info
  const expiryInfo = (accessExpiry) => {
    if (!accessExpiry) return { label:'No limit', color:'#6b7280', bg:'rgba(107,114,128,0.12)' };
    const now = new Date();
    const exp = new Date(accessExpiry);
    const diffDays = Math.ceil((exp - now) / 86400000);
    if (diffDays < 0) return { label:'Expired', color:'#ef4444', bg:'rgba(239,68,68,0.15)' };
    if (diffDays <= 7) return { label:`${diffDays}d left`, color:'#f59e0b', bg:'rgba(245,158,11,0.15)' };
    if (diffDays <= 30) return { label:`${diffDays}d left`, color:'#3b82f6', bg:'rgba(59,130,246,0.12)' };
    return { label: exp.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }), color:'#10b981', bg:'rgba(16,185,129,0.12)' };
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault(); setCatMsg(null);
    const payload = {
      ...catForm,
      instructions: catForm.instructions.split('\n').map(s => s.trim()).filter(Boolean),
    };
    try {
      if (editCat) {
        await api.patch(`/admin/categories/${editCat._id}`, payload);
        setCatMsg(makeMsg('Category updated successfully!'));
      } else {
        await api.post('/admin/categories', payload);
        setCatMsg(makeMsg('Category created successfully!'));
      }
      setCatForm({ name:'', description:'', icon:'📋', color:'#4f46e5', instructions:'' });
      setEditCat(null); fetchAll();
    } catch (err) { setCatMsg(makeMsg(err.response?.data?.message || 'Failed')); }
  };

  const handleDeleteUser = async (u) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})?\n\nThis will immediately terminate their access and remove all their assignments and results. This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
  };

  const handleDeleteCat = async (id) => {
    if (!confirm('Delete this category? Tests in it will be uncategorized.')) return;
    await api.delete(`/admin/categories/${id}`); fetchAll();
  };

  const startEditCat = (cat) => {
    setEditCat(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '📋',
      color: cat.color || '#4f46e5',
      instructions: (cat.instructions || []).join('\n'),
    });
    setCatMsg(null);
  };

  // ── Edit test handlers ─────────────────────────────────────────────────────
  const openEditTest = async (testId) => {
    setEditTestMsg(null); setEditRegenAudio(false); setTextChanged(false);
    setEditTestLoading(true);
    setEditTestModal({ _id: testId });          // show modal with spinner first
    try {
      const { data } = await api.get(`/admin/tests/${testId}`);
      setEditTestModal(data);
      setEditTestForm({
        title        : data.title,
        timer        : data.timer ?? 30,
        category     : data.category?._id || data.category || '',
        extractedText: data.extractedText || '',
      });
    } catch (err) {
      setEditTestMsg(makeMsg('Failed to load test'));
    } finally { setEditTestLoading(false); }
  };

  const handleSaveEditTest = async (e) => {
    e.preventDefault(); setEditTestMsg(null); setEditTestSaving(true);
    try {
      await api.put(`/admin/tests/${editTestModal._id}`, {
        ...editTestForm,
        regenerateAudio: editRegenAudio && textChanged,
      });
      setEditTestMsg(makeMsg(editRegenAudio && textChanged ? 'Test saved & audio regenerated!' : 'Test updated successfully!'));
      setTextChanged(false); setEditRegenAudio(false);
      fetchAll();
    } catch (err) {
      setEditTestMsg(makeMsg(err.response?.data?.message || 'Save failed'));
    } finally { setEditTestSaving(false); }
  };

  // ── Review handlers ────────────────────────────────────────────────────────
  const handleSaveReview = async (e) => {
    e.preventDefault(); setReviewMsg(null);
    try {
      if (editReview) {
        await api.patch(`/admin/reviews/${editReview._id}`, reviewForm);
        setReviewMsg(makeMsg('Review updated successfully!'));
      } else {
        await api.post('/admin/reviews', reviewForm);
        setReviewMsg(makeMsg('Review added successfully!'));
      }
      setReviewForm(blankReview); setEditReview(null); fetchAll();
    } catch (err) { setReviewMsg(makeMsg(err.response?.data?.message || 'Failed')); }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/admin/reviews/${id}`); fetchAll();
  };

  const handleToggleReview = async (rev) => {
    await api.patch(`/admin/reviews/${rev._id}`, { isActive: !rev.isActive }); fetchAll();
  };

  const startEditReview = (rev) => {
    setEditReview(rev);
    setReviewForm({
      name: rev.name, role: rev.role, avatarColor: rev.avatarColor,
      stars: rev.stars, reviewHi: rev.reviewHi, reviewEn: rev.reviewEn,
    });
    setReviewMsg(null);
    // scroll form into view
    document.getElementById('review-form-card')?.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  const openUserResults = async (u) => {
    setResultUser(u); setUserResultsLoading(true); setUserResults([]);
    try {
      const { data } = await api.get(`/admin/users/${u._id}/results`);
      setUserResults(data);
    } catch (err) { console.error(err); }
    finally { setUserResultsLoading(false); }
  };

  const openResultDetail = async (resultId) => {
    setResultDetail({ loading: true });
    try {
      const { data } = await api.get(`/admin/results/${resultId}`);
      setResultDetail(data);
    } catch (err) { setResultDetail(null); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignUserId || assignSelected.size === 0) return;
    setAssignMsg(null); setAssignLoading(true);
    try {
      const { data } = await api.post('/admin/assign-bulk', {
        userId: assignUserId,
        testIds: [...assignSelected],
      });
      const msg = data.skipped > 0
        ? `Assigned ${data.assigned} test${data.assigned !== 1 ? 's' : ''}. ${data.skipped} already assigned.`
        : `${data.assigned} test${data.assigned !== 1 ? 's' : ''} assigned successfully!`;
      setAssignMsg(makeMsg(msg));
      setAssignSelected(new Set()); fetchAll();
    } catch (err) {
      setAssignMsg(makeMsg(err.response?.data?.message || 'Assignment failed', false));
    } finally { setAssignLoading(false); }
  };

  const loadLeaderboard = async (testId) => {
    setLeaderboardTestId(testId);
    const r = await api.get(`/admin/tests/${testId}/leaderboard`);
    setLeaderboardData(r.data);
  };

  return (
    <div className="min-h-screen"
      style={{ background:'linear-gradient(135deg, var(--bg-base), var(--bg-mid))' }}>
      {/* Header */}
      <header className="gradient-bg text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">⚙️</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Panel</h1>
              <p className="text-white/60 text-xs">Hindi SSC Stenography</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle light />
            <button onClick={() => { logout(); navigate('/login'); }}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky z-10"
        style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', top:'60px' }}>
        <div className="max-w-6xl mx-auto flex px-4">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-6 py-3.5 text-sm font-bold border-b-2 transition"
              style={tab===t
                ? { borderBottomColor:'#6366f1', color:'#6366f1', borderBottomWidth:'2px' }
                : { borderBottomColor:'transparent', color:'var(--text-2)', borderBottomWidth:'2px' }}>
              {t === 'Upload Steno Test'    && '📋 '}
              {t === 'Upload Practice Test' && '✏️ '}
              {t === 'Categories'           && '🗂️ '}
              {t === 'Users'                && '👥 '}
              {t === 'Assignments'          && '📌 '}
              {t === 'Results'              && '📊 '}
              {t === 'Reviews'              && '💬 '}
              {t}
              {t === 'Upload Steno Test'    && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{tests.filter(x=>!x.practiceOnly).length}</span>}
              {t === 'Upload Practice Test' && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{tests.filter(x=>x.practiceOnly).length}</span>}
              {t === 'Categories'           && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{categories.length}</span>}
              {t === 'Users'                && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{users.length}</span>}
              {t === 'Assignments'          && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{assignments.length}</span>}
              {t === 'Results'              && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{results.length}</span>}
              {t === 'Reviews'              && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{reviews.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ═══ TESTS ══════════════════════════════════════════ */}
        {tab === 'Upload Steno Test' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: create form */}
            <div>
              <CreateTestForm tests={tests} users={users} onCreated={fetchAll} categories={categories}/>
            </div>

            {/* Right: tests list */}
            <div className="space-y-4">
              <div style={cardStyle}>
                <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>All Tests ({tests.length})</h2>
                {tests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p style={{ color:'var(--text-3)' }}>No tests yet. Create one!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tests.map(t => (
                      <div key={t._id} className="rounded-xl p-4 transition"
                        style={{ border:'1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hi)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate" style={{ color:'var(--text-1)' }}>{t.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={t.isActive
                                  ? { background:'rgba(16,185,129,0.15)', color:'#34d399' }
                                  : { background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                                {t.isActive ? '● Active' : '○ Inactive'}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={t.practiceEnabled
                                  ? { background:'rgba(6,182,212,0.15)', color:'#22d3ee' }
                                  : { background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                                {t.practiceEnabled ? '✏️ Practice On' : '✏️ Practice Off'}
                              </span>
                              <span className="text-xs" style={{ color:'var(--text-3)' }}>
                                {t.audioType === 'uploaded' ? '🎵 Custom audio' : '🤖 Generated'}
                              </span>
                              <span className="text-xs" style={{ color:'var(--text-3)' }}>⏱ {t.timer ?? 30} min</span>
                              {t.category && <span className="text-xs" style={{ color:'var(--text-3)' }}>{t.category.icon} {t.category.name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => toggleActive(t._id, t.isActive)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={t.isActive
                              ? { background:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.20)' }
                              : { background:'rgba(16,185,129,0.12)',  color:'#34d399',  border:'1px solid rgba(16,185,129,0.22)' }}>
                            {t.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => togglePractice(t._id, t.practiceEnabled)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={t.practiceEnabled
                              ? { background:'rgba(6,182,212,0.15)', color:'#22d3ee', border:'1px solid rgba(6,182,212,0.25)' }
                              : { background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                            {t.practiceEnabled ? '✏️ Practice On' : '✏️ Practice Off'}
                          </button>
                          <button onClick={() => openEditTest(t._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.22)' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => setAudioReplaceFor(t._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={{ background:'rgba(99,102,241,0.12)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.20)' }}>
                            Replace Audio
                          </button>
                          <button onClick={() => regenerateAudio(t._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={{ background:'rgba(139,92,246,0.12)', color:'#c084fc', border:'1px solid rgba(139,92,246,0.20)' }}>
                            Regen Audio
                          </button>
                          <button onClick={() => loadLeaderboard(t._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={{ background:'rgba(245,158,11,0.10)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.18)' }}>
                            Leaderboard
                          </button>
                          <button onClick={() => deleteTest(t._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                            style={{ background:'rgba(239,68,68,0.12)', color:'#f87171', border:'1px solid rgba(239,68,68,0.22)' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              {leaderboardTestId && (
                <div style={cardStyle} className="animate-fade-in-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold" style={{ color:'var(--text-1)' }}>
                      🏆 {tests.find(t=>t._id===leaderboardTestId)?.title}
                    </h3>
                    <button onClick={() => setLeaderboardTestId(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition"
                      style={{ background:'var(--bg-card)', color:'var(--text-2)' }}>×</button>
                  </div>
                  <Leaderboard entries={leaderboardData}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PRACTICE ═══════════════════════════════════════ */}
        {tab === 'Upload Practice Test' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: upload form */}
            <div style={cardStyle}>
              <h2 className="text-lg mb-1" style={{ color:'var(--text-1)', fontWeight:800 }}>✏️ Upload Practice Content</h2>
              <p className="text-sm mb-4" style={{ color:'var(--text-3)' }}>
                Practice-only content — appears in users' Practice section only, not in Steno Tests. Audio is optional.
              </p>
              <PracticeUploadForm categories={categories} onCreated={fetchAll} />
            </div>

            {/* Right: practice-only tests list */}
            <div style={cardStyle}>
              <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>
                ✏️ Practice Content ({tests.filter(t => t.practiceOnly).length})
              </h2>
              {tests.filter(t => t.practiceOnly).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✏️</div>
                  <p style={{ color:'var(--text-3)' }}>No practice content yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.filter(t => t.practiceOnly).map(t => (
                    <div key={t._id} className="rounded-xl p-4 transition"
                      style={{ border:'1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hi)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate" style={{ color:'var(--text-1)' }}>{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={t.isActive
                                ? { background:'rgba(16,185,129,0.15)', color:'#34d399' }
                                : { background:'var(--bg-surface)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                              {t.isActive ? '● Active' : '○ Inactive'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background:'rgba(6,182,212,0.15)', color:'#22d3ee' }}>
                              ✏️ Practice Only
                            </span>
                            <span className="text-xs" style={{ color:'var(--text-3)' }}>⏱ {t.timer ?? 30} min</span>
                            {t.category && <span className="text-xs" style={{ color:'var(--text-3)' }}>{t.category.icon} {t.category.name}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => toggleActive(t._id, t.isActive)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                          style={t.isActive
                            ? { background:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.20)' }
                            : { background:'rgba(16,185,129,0.12)',  color:'#34d399',  border:'1px solid rgba(16,185,129,0.22)' }}>
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteTest(t._id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                          style={{ background:'rgba(239,68,68,0.12)', color:'#f87171', border:'1px solid rgba(239,68,68,0.22)' }}>
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ USERS ══════════════════════════════════════════ */}
        {tab === 'Users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div style={cardStyle}>
              <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>👤 Create User</h2>
              <form onSubmit={handleCreateUser} className="space-y-3">
                {[
                  { k:'name',     type:'text',     ph:'Full name'  },
                  { k:'email',    type:'email',     ph:'Email address' },
                  { k:'password', type:'password',  ph:'Password'   },
                ].map(f => (
                  <ThemedInput key={f.k} type={f.type} placeholder={f.ph} required
                    value={userForm[f.k]}
                    onChange={e => setUserForm({...userForm, [f.k]:e.target.value})}
                  />
                ))}
                <ThemedSelect value={userForm.role}
                  onChange={e => setUserForm({...userForm, role:e.target.value})}>
                  <option value="user" style={{ background:'var(--bg-input)', color:'var(--text-1)' }}>User</option>
                  <option value="admin" style={{ background:'var(--bg-input)', color:'var(--text-1)' }}>Admin</option>
                </ThemedSelect>

                {/* Access Duration */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color:'var(--text-2)' }}>Access Duration</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { label:'1 Month',  days:30  },
                      { label:'3 Months', days:90  },
                      { label:'6 Months', days:180 },
                      { label:'1 Year',   days:365 },
                      { label:'No Limit', days:0   },
                    ].map(opt => {
                      const val = opt.days ? daysFromNow(opt.days) : '';
                      const active = userForm.accessExpiry === val;
                      return (
                        <button key={opt.label} type="button"
                          onClick={() => setUserForm({...userForm, accessExpiry: val})}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                          style={{
                            background: active ? 'var(--accent)' : 'var(--bg-card)',
                            color: active ? '#fff' : 'var(--text-2)',
                            border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                          }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <ThemedInput type="date" placeholder="Or pick custom date"
                    value={userForm.accessExpiry}
                    onChange={e => setUserForm({...userForm, accessExpiry: e.target.value})}
                  />
                  {userForm.accessExpiry && (
                    <p className="text-xs mt-1" style={{ color:'#10b981' }}>
                      Access until: {new Date(userForm.accessExpiry).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                    </p>
                  )}
                </div>

                <Msg m={userMsg}/>
                <button type="submit"
                  className="w-full gradient-bg text-white font-bold py-2.5 rounded-xl transition hover:opacity-90 active:scale-95">
                  Create User
                </button>
              </form>

              {/* ── Credentials card — shown after user creation ── */}
              {createdCreds && (
                <div className="mt-4 rounded-2xl overflow-hidden"
                  style={{ border:'1px solid rgba(16,185,129,0.35)', background:'rgba(16,185,129,0.07)' }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom:'1px solid rgba(16,185,129,0.20)', background:'rgba(16,185,129,0.10)' }}>
                    <div className="flex items-center gap-2">
                      <span>🔐</span>
                      <span className="text-sm font-black" style={{ color:'#6ee7b7' }}>User Credentials</span>
                    </div>
                    <button onClick={() => setCreatedCreds(null)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ color:'var(--text-3)', background:'var(--bg-card)' }}>✕ Dismiss</button>
                  </div>
                  <div className="px-4 py-4 space-y-2">
                    <p className="text-xs mb-3" style={{ color:'rgba(110,231,183,0.70)' }}>
                      Save these credentials — the password cannot be recovered later.
                    </p>
                    {[
                      { label:'Name',     value: createdCreds.name     },
                      { label:'Email',    value: createdCreds.email    },
                      { label:'Password', value: createdCreds.password },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color:'var(--text-3)' }}>{row.label}</p>
                          <p className="text-sm font-mono font-semibold truncate" style={{ color:'var(--text-1)' }}>{row.value}</p>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(row.value)}
                          className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition hover:scale-105"
                          style={{ background:'rgba(99,102,241,0.15)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.25)' }}
                          title={`Copy ${row.label}`}>
                          Copy
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const text = `Name: ${createdCreds.name}\nEmail: ${createdCreds.email}\nPassword: ${createdCreds.password}`;
                        navigator.clipboard.writeText(text);
                      }}
                      className="w-full mt-1 text-xs py-2 rounded-xl font-bold transition hover:opacity-90"
                      style={{ background:'rgba(16,185,129,0.15)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.30)' }}>
                      📋 Copy All Credentials
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>All Users ({users.length})</h2>
              {users.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color:'var(--text-3)' }}>No users yet.</p>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {users.map(u => {
                    const ei = expiryInfo(u.accessExpiry);
                    const isExpired = u.accessExpiry && new Date() > new Date(u.accessExpiry);
                    return (
                      <div key={u._id} className="rounded-xl p-3 transition"
                        style={{ border:`1px solid ${isExpired ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`, background: isExpired ? 'rgba(239,68,68,0.05)' : 'transparent' }}
                        onMouseEnter={e => { if(!isExpired) e.currentTarget.style.background='var(--bg-card)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isExpired ? 'rgba(239,68,68,0.05)' : 'transparent'; }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm" style={{ color:'var(--text-1)' }}>{u.name}</p>
                              {isExpired && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background:'rgba(239,68,68,0.2)', color:'#f87171' }}>
                                  EXPIRED
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color:'var(--text-2)' }}>{u.email}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={u.role==='admin'
                                  ? { background:'rgba(139,92,246,0.15)', color:'#a78bfa' }
                                  : { background:'rgba(59,130,246,0.12)', color:'#60a5fa' }}>
                                {u.role}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: ei.bg, color: ei.color }}>
                                {ei.label}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={ u.deviceId
                                  ? { background:'rgba(16,185,129,0.12)', color:'#34d399' }
                                  : { background:'rgba(107,114,128,0.10)', color:'#9ca3af' }}>
                                {u.deviceId ? '🔒 Locked' : '🔓 No lock'}
                              </span>
                              {(u.reAttemptCooldown > 0) && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background:'rgba(245,158,11,0.13)', color:'#fbbf24' }}>
                                  ⏳ {u.reAttemptCooldown}h cooldown
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => { setExtendUser(u); setExtendExpiry(u.accessExpiry ? new Date(u.accessExpiry).toISOString().slice(0,10) : ''); setExtendCooldown(u.reAttemptCooldown || 0); setExtendResetDevice(false); setExtendMsg(null); }}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                              style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', color:'var(--text-2)' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hi)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                              {isExpired ? '🔓 Renew' : '✏️ Access'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                              style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.20)', color:'#f87171' }}
                              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.20)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.40)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.10)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.20)'; }}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CATEGORIES ═════════════════════════════════════ */}
        {tab === 'Categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left: Create / Edit form ───────────────────── */}
            <div style={cardStyle}>
              <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>
                {editCat ? '✏️ Edit Category' : '🗂️ Create Category'}
              </h2>
              <form onSubmit={handleSaveCategory} className="space-y-3">

                {/* Name */}
                <input required placeholder="Category name…" value={catForm.name}
                  onChange={e => setCatForm({...catForm, name:e.target.value})}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background:'var(--bg-input)', color:'var(--text-1)', border:'1px solid var(--border)' }}/>

                {/* Description */}
                <input placeholder="Short description (optional)…" value={catForm.description}
                  onChange={e => setCatForm({...catForm, description:e.target.value})}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background:'var(--bg-input)', color:'var(--text-1)', border:'1px solid var(--border)' }}/>

                {/* Icon picker */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{color:'var(--text-3)'}}>Icon</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map(em => (
                      <button key={em} type="button" onClick={() => setCatForm({...catForm, icon:em})}
                        className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: catForm.icon===em ? 'rgba(99,102,241,0.20)' : 'var(--bg-surface)',
                          border: catForm.icon===em ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                          boxShadow: catForm.icon===em ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                        }}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{color:'var(--text-3)'}}>Accent colour</p>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} type="button" onClick={() => setCatForm({...catForm, color:c})}
                        className="w-7 h-7 rounded-full transition-all hover:scale-110"
                        style={{
                          background: c,
                          border: catForm.color===c ? '2px solid white' : '2px solid transparent',
                          boxShadow: catForm.color===c ? `0 0 10px ${c}99` : 'none',
                          outline: catForm.color===c ? `2px solid ${c}` : 'none',
                          outlineOffset: '2px',
                        }}/>
                    ))}
                  </div>
                </div>

                {/* Instructions (one per line) */}
                <div>
                  <p className="text-xs font-semibold mb-1" style={{color:'var(--text-3)'}}>
                    Instructions (one per line — shown to users during audio)
                  </p>
                  <textarea rows={5} placeholder={"इस टेस्ट की गति 80 शब्द प्रति मिनट है।\nRemington Gail layout में टाइप करें।\nनेट कनेक्शन ऑन रखें।"}
                    value={catForm.instructions}
                    onChange={e => setCatForm({...catForm, instructions:e.target.value})}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background:'var(--bg-input)', color:'var(--text-1)', border:'1px solid var(--border)', fontFamily:'Nirmala UI, Mangal, sans-serif' }}/>
                </div>

                <Msg m={catMsg}/>

                <div className="flex gap-2">
                  {editCat && (
                    <button type="button"
                      onClick={() => { setEditCat(null); setCatForm({ name:'', description:'', icon:'📋', color:'#4f46e5', instructions:'' }); setCatMsg(null); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
                      style={{ background:'var(--bg-surface)', color:'var(--text-2)' }}>
                      Cancel
                    </button>
                  )}
                  <button type="submit"
                    className="flex-1 text-white font-bold py-2.5 rounded-xl transition active:scale-95"
                    style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 0 20px rgba(99,102,241,0.35)' }}>
                    {editCat ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>

              </form>
            </div>

            {/* ── Right: Category list ───────────────────────── */}
            <div style={cardStyle}>
              <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>
                All Categories ({categories.length})
              </h2>
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🗂️</div>
                  <p style={{ color:'var(--text-3)' }}>No categories yet. Create one!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[560px] overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat._id} className="rounded-2xl p-4 relative overflow-hidden"
                      style={{ border:`1px solid ${cat.color}30`, background:`${cat.color}08` }}>
                      <div className="absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ background: cat.color }}/>
                      <div className="flex items-start justify-between gap-3 pl-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{cat.icon}</span>
                            <span className="font-black text-sm" style={{color:'var(--text-1)'}}>{cat.name}</span>
                          </div>
                          {cat.description && (
                            <p className="text-xs mb-1.5" style={{color:'var(--text-3)'}}>{cat.description}</p>
                          )}
                          {cat.instructions?.length > 0 && (
                            <p className="text-xs" style={{color:'var(--text-3)'}}>
                              {cat.instructions.length} instruction{cat.instructions.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => startEditCat(cat)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                            style={{ background:'rgba(99,102,241,0.12)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.25)' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteCat(cat._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                            style={{ background:'rgba(239,68,68,0.10)', color:'#f87171', border:'1px solid rgba(239,68,68,0.20)' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══ ASSIGNMENTS ════════════════════════════════════ */}
        {tab === 'Assignments' && (() => {
          const filteredTests = tests.filter(t =>
            t.title.toLowerCase().includes(assignSearch.toLowerCase())
          );
          const allFiltered   = filteredTests.map(t => t._id);
          const allChecked    = allFiltered.length > 0 && allFiltered.every(id => assignSelected.has(id));

          const toggleTest = (id) => {
            setAssignSelected(prev => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            });
          };
          const toggleAll = () => {
            setAssignSelected(prev => {
              const next = new Set(prev);
              if (allChecked) { allFiltered.forEach(id => next.delete(id)); }
              else            { allFiltered.forEach(id => next.add(id));    }
              return next;
            });
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ── Left: Assign form ─────────────────────────────── */}
              <div style={cardStyle}>
                <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>📌 Assign Tests to User</h2>
                <form onSubmit={handleAssign} className="flex flex-col gap-3">

                  {/* User picker */}
                  <ThemedSelect required value={assignUserId}
                    onChange={e => { setAssignUserId(e.target.value); setAssignMsg(null); }}>
                    <option value="" style={{ background:'var(--bg-input)', color:'var(--text-1)' }}>Select user…</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id} style={{ background:'var(--bg-input)', color:'var(--text-1)' }}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </ThemedSelect>

                  {/* Search + select-all header */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:'var(--text-3)' }}>🔍</span>
                      <input
                        type="text"
                        placeholder={`Search ${tests.length} tests…`}
                        value={assignSearch}
                        onChange={e => setAssignSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                        style={{
                          background:'var(--bg-input)', color:'var(--text-1)',
                          border:'1px solid var(--border)',
                        }}
                      />
                    </div>
                    <button type="button" onClick={toggleAll}
                      className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                      style={{
                        background: allChecked ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                        color:      allChecked ? '#f87171'               : '#818cf8',
                        border:     allChecked ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(99,102,241,0.25)',
                      }}>
                      {allChecked ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Selected count */}
                  {assignSelected.size > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{ background:'rgba(99,102,241,0.10)', border:'1px solid rgba(99,102,241,0.20)', color:'#a5b4fc' }}>
                      <span>✅ {assignSelected.size} test{assignSelected.size !== 1 ? 's' : ''} selected</span>
                      <button type="button" onClick={() => setAssignSelected(new Set())}
                        className="font-bold transition hover:opacity-70" style={{ color:'#f87171' }}>
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Scrollable test list */}
                  <div className="overflow-y-auto rounded-xl"
                    style={{ maxHeight:'320px', border:'1px solid var(--border)' }}>
                    {filteredTests.length === 0 ? (
                      <p className="text-center py-6 text-sm" style={{ color:'var(--text-3)' }}>No tests match.</p>
                    ) : (
                      filteredTests.map(t => {
                        const checked = assignSelected.has(t._id);
                        return (
                          <label key={t._id}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all select-none"
                            style={{
                              borderBottom:'1px solid var(--border)',
                              background: checked ? 'rgba(99,102,241,0.08)' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!checked) e.currentTarget.style.background='var(--bg-surface)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = checked ? 'rgba(99,102,241,0.08)' : 'transparent'; }}>
                            {/* Custom checkbox */}
                            <div className="shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
                              style={{
                                background: checked ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'var(--bg-input)',
                                border: checked ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                              }}>
                              {checked && <span className="text-white text-xs leading-none">✓</span>}
                            </div>
                            <input type="checkbox" className="sr-only" checked={checked}
                              onChange={() => toggleTest(t._id)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate" style={{ color:'var(--text-1)' }}>{t.title}</p>
                              <p className="text-xs" style={{ color:'var(--text-3)' }}>
                                ⏱ {t.timer ?? 30} min
                                {!t.isActive && <span style={{ color:'#f87171' }}> · inactive</span>}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <Msg m={assignMsg}/>

                  <button type="submit"
                    disabled={!assignUserId || assignSelected.size === 0 || assignLoading}
                    className="w-full text-white font-bold py-2.5 rounded-xl transition active:scale-95"
                    style={{
                      background: (!assignUserId || assignSelected.size === 0)
                        ? 'rgba(99,102,241,0.25)'
                        : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                      opacity: assignLoading ? 0.7 : 1,
                      cursor: (!assignUserId || assignSelected.size === 0) ? 'not-allowed' : 'pointer',
                      boxShadow: (!assignUserId || assignSelected.size === 0) ? 'none' : '0 0 20px rgba(99,102,241,0.35)',
                    }}>
                    {assignLoading
                      ? 'Assigning…'
                      : assignSelected.size > 0
                        ? `Assign ${assignSelected.size} Test${assignSelected.size !== 1 ? 's' : ''}`
                        : 'Select tests to assign'}
                  </button>
                </form>
              </div>

              {/* ── Right: Current assignments ──────────────────────── */}
              <div style={cardStyle}>
                <h2 className="text-lg mb-4" style={{ color:'var(--text-1)', fontWeight:800 }}>Current Assignments ({assignments.length})</h2>
                {assignments.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color:'var(--text-3)' }}>No assignments yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {assignments.map(a => (
                      <div key={a._id} className="flex items-center justify-between rounded-xl p-3 transition"
                        style={{ border:'1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg-card)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color:'var(--text-1)' }}>
                            {a.userId?.name}
                            <span style={{ color:'var(--text-3)', fontWeight:400 }}> · {a.userId?.email}</span>
                          </p>
                          <p className="text-xs truncate" style={{ color:'var(--text-2)' }}>
                            {a.testId?.title}
                            {!a.testId?.isActive && <span style={{ color:'var(--text-3)' }}> (inactive)</span>}
                          </p>
                        </div>
                        <button onClick={() => api.delete(`/admin/assign/${a._id}`).then(fetchAll)}
                          className="text-xs font-semibold ml-2 shrink-0"
                          style={{ color:'#ef4444' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* ═══ RESULTS ════════════════════════════════════════ */}
        {tab === 'Results' && (() => {
          // Build unique user list from results
          const userMap = {};
          results.forEach(r => {
            if (!r.userId) return;
            const uid = r.userId._id;
            if (!userMap[uid]) userMap[uid] = { ...r.userId, attempts: 0, bestErr: null };
            userMap[uid].attempts++;
            const ep = r.errorPercentage ?? 100;
            if (userMap[uid].bestErr === null || ep < userMap[uid].bestErr) userMap[uid].bestErr = ep;
          });
          const userList = Object.values(userMap).filter(u =>
            u.name?.toLowerCase().includes(resultSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(resultSearch.toLowerCase())
          );
          const errColor = p => p <= 5 ? '#34d399' : p <= 10 ? '#fbbf24' : '#f87171';

          return !resultUser ? (
            /* ── Step 1: User list ──────────────────────── */
            <div style={cardStyle}>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 className="text-lg" style={{ color:'var(--text-1)', fontWeight:800 }}>
                  📊 Results — Select User
                </h2>
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ background:'var(--bg-card)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                  {Object.keys(userMap).length} users · {results.length} attempts
                </span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color:'var(--text-3)' }}>🔍</span>
                <input type="text" placeholder="Search user by name or email…"
                  value={resultSearch} onChange={e => setResultSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background:'var(--bg-input)', color:'var(--text-1)', border:'1px solid var(--border)' }}/>
                {resultSearch && (
                  <button onClick={() => setResultSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color:'var(--text-3)' }}>✕</button>
                )}
              </div>

              {results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">📊</div>
                  <p style={{ color:'var(--text-3)' }}>No results yet.</p>
                </div>
              ) : userList.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color:'var(--text-3)' }}>No users match "{resultSearch}"</p>
              ) : (
                <div className="space-y-2 max-h-[560px] overflow-y-auto">
                  {userList.map(u => (
                    <button key={u._id} onClick={() => openUserResults(u)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-95 group"
                      style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hi)'; e.currentTarget.style.background='var(--bg-surface)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';    e.currentTarget.style.background='var(--bg-card)'; }}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                        {u.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color:'var(--text-1)' }}>{u.name}</p>
                        <p className="text-xs truncate" style={{ color:'var(--text-3)' }}>{u.email}</p>
                      </div>
                      {/* Stats */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-center">
                          <p className="text-sm font-black" style={{ color:'var(--text-1)' }}>{u.attempts}</p>
                          <p className="text-xs" style={{ color:'var(--text-3)' }}>attempts</p>
                        </div>
                        {u.bestErr !== null && (
                          <div className="text-center">
                            <p className="text-sm font-black" style={{ color: errColor(u.bestErr) }}>{u.bestErr?.toFixed(1)}%</p>
                            <p className="text-xs" style={{ color:'var(--text-3)' }}>best err</p>
                          </div>
                        )}
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color:'var(--text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Step 2: User's attempt list ────────────── */
            <div style={cardStyle}>
              {/* Back + header */}
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => { setResultUser(null); setUserResults([]); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition hover:scale-105"
                  style={{ background:'var(--bg-card)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                  ← Back
                </button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                    style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                    {resultUser.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate" style={{ color:'var(--text-1)' }}>{resultUser.name}</p>
                    <p className="text-xs truncate" style={{ color:'var(--text-3)' }}>{resultUser.email}</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full shrink-0"
                  style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.25)' }}>
                  {userResults.length} attempt{userResults.length !== 1 ? 's' : ''}
                </span>
              </div>

              {userResultsLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background:'var(--bg-card)' }}/>)}
                </div>
              ) : userResults.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color:'var(--text-3)' }}>No attempts yet.</p>
              ) : (
                <div className="space-y-2 max-h-[560px] overflow-y-auto">
                  {userResults.map((r, i) => (
                    <div key={r._id} className="rounded-2xl p-4 transition-all animate-fade-in-up"
                      style={{ background:'var(--bg-card)', border:'1px solid var(--border)', animationDelay:`${i*0.04}s` }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color:'var(--text-1)' }}>
                            {r.testId?.title || 'Unknown Test'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>
                            {new Date(r.createdAt).toLocaleString('en-IN')} · ⏱ {fmtTime(r.timeTaken)}
                            {r.pasteDetected && <span className="ml-2 text-yellow-400">⚠ paste</span>}
                          </p>
                        </div>
                        {/* Stats chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black px-2.5 py-1 rounded-full"
                            style={{ background: errColor(r.errorPercentage)+'20', color: errColor(r.errorPercentage), border:`1px solid ${errColor(r.errorPercentage)}40` }}>
                            {r.errorPercentage?.toFixed(2)}% err
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.20)' }}>
                            {r.accuracy?.toFixed(1)}% acc
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background:'rgba(16,185,129,0.10)', color:'#34d399', border:'1px solid rgba(16,185,129,0.20)' }}>
                            {r.wpm} wpm
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full"
                            style={{ background:'rgba(239,68,68,0.10)', color:'#f87171' }}>
                            {r.fullMistakes}F / {r.halfMistakes}H
                          </span>
                        </div>
                        {/* View detail button */}
                        <button onClick={() => openResultDetail(r._id)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:scale-105 active:scale-95"
                          style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', boxShadow:'0 0 12px rgba(99,102,241,0.3)' }}>
                          🔍 View Detail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Result Detail Modal ──────────────────────────── */}
        {resultDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)' }}
            onClick={() => setResultDetail(null)}>
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden animate-scale-in"
              style={{ background:'var(--bg-modal)', border:'1px solid var(--border-hi)', boxShadow:'0 40px 100px rgba(0,0,0,0.7)' }}
              onClick={e => e.stopPropagation()}>

              {/* Top glow */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.7),transparent)' }}/>

              {resultDetail.loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-4xl animate-spin">⏳</div>
                </div>
              ) : (
                <>
                  {/* Modal header */}
                  <div className="flex items-start justify-between px-6 py-5 shrink-0"
                    style={{ borderBottom:'1px solid var(--border)' }}>
                    <div>
                      <h3 className="font-black text-base" style={{ color:'var(--text-1)' }}>
                        🔍 Result Detail
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>
                        {resultDetail.userId?.name} · {resultDetail.testId?.title}
                      </p>
                    </div>
                    <button onClick={() => setResultDetail(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:rotate-90 transition-all duration-300"
                      style={{ background:'var(--bg-surface)', color:'var(--text-2)' }}>×</button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Stats row */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        { label:'Error %',  value:`${resultDetail.errorPercentage?.toFixed(2)}%`, color: resultDetail.errorPercentage<=5?'#34d399':resultDetail.errorPercentage<=10?'#fbbf24':'#f87171' },
                        { label:'Accuracy', value:`${resultDetail.accuracy?.toFixed(1)}%`,        color:'#a5b4fc' },
                        { label:'WPM',      value: resultDetail.wpm,                              color:'#34d399' },
                        { label:'Full Err', value: resultDetail.fullMistakes,                     color:'#f87171' },
                        { label:'Half Err', value: resultDetail.halfMistakes,                     color:'#fbbf24' },
                        { label:'Time',     value: fmtTime(resultDetail.timeTaken),               color:'var(--text-2)' },
                        { label:'Date',     value: new Date(resultDetail.createdAt).toLocaleDateString('en-IN'), color:'var(--text-3)' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl py-2.5 px-3 text-center"
                          style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
                          <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
                          <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {resultDetail.pasteDetected && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                        style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', color:'#fbbf24' }}>
                        ⚠️ Paste detected during this attempt
                      </div>
                    )}

                    {/* Text comparison — side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* User's typed text */}
                      <div className="flex flex-col rounded-2xl overflow-hidden"
                        style={{ border:'1px solid rgba(239,68,68,0.25)' }}>
                        <div className="flex items-center gap-2 px-4 py-2.5"
                          style={{ background:'rgba(239,68,68,0.12)', borderBottom:'1px solid rgba(239,68,68,0.20)' }}>
                          <span className="text-sm">📝</span>
                          <span className="text-xs font-black" style={{ color:'#fca5a5' }}>User Typed</span>
                          <span className="ml-auto text-xs" style={{ color:'rgba(252,165,165,0.5)' }}>
                            {resultDetail.typedText?.trim().split(/\s+/).filter(Boolean).length || 0} words
                          </span>
                        </div>
                        <textarea readOnly value={resultDetail.typedText || ''}
                          className="flex-1 p-4 text-sm resize-none outline-none"
                          rows={10}
                          style={{
                            background:'rgba(239,68,68,0.05)',
                            color:'var(--text-1)',
                            fontFamily:'Nirmala UI, Mangal, sans-serif',
                            lineHeight:'1.8',
                          }}/>
                      </div>

                      {/* Master passage */}
                      <div className="flex flex-col rounded-2xl overflow-hidden"
                        style={{ border:'1px solid rgba(16,185,129,0.25)' }}>
                        <div className="flex items-center gap-2 px-4 py-2.5"
                          style={{ background:'rgba(16,185,129,0.12)', borderBottom:'1px solid rgba(16,185,129,0.20)' }}>
                          <span className="text-sm">📖</span>
                          <span className="text-xs font-black" style={{ color:'#6ee7b7' }}>Master Passage</span>
                          <span className="ml-auto text-xs" style={{ color:'rgba(110,231,183,0.5)' }}>
                            {resultDetail.testId?.extractedText?.trim().split(/\s+/).filter(Boolean).length || 0} words
                          </span>
                        </div>
                        <textarea readOnly value={resultDetail.testId?.extractedText || ''}
                          className="flex-1 p-4 text-sm resize-none outline-none"
                          rows={10}
                          style={{
                            background:'rgba(16,185,129,0.05)',
                            color:'var(--text-1)',
                            fontFamily:'Nirmala UI, Mangal, sans-serif',
                            lineHeight:'1.8',
                          }}/>
                      </div>
                    </div>

                    {/* Word-level diff */}
                    {resultDetail.wordComparison?.length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest mb-3"
                          style={{ color:'var(--text-3)' }}>Word-level Analysis</p>
                        <div className="flex flex-wrap gap-1.5 p-4 rounded-2xl max-h-52 overflow-y-auto"
                          style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
                          {resultDetail.wordComparison.map((w, i) => {
                            const bg = w.status==='correct'      ? 'rgba(16,185,129,0.15)'
                                     : w.status==='substitution' ? 'rgba(239,68,68,0.15)'
                                     : w.status==='omission'     ? 'rgba(245,158,11,0.12)'
                                     : 'rgba(99,102,241,0.12)';
                            const cl = w.status==='correct'      ? '#34d399'
                                     : w.status==='substitution' ? '#f87171'
                                     : w.status==='omission'     ? '#fbbf24'
                                     : '#a5b4fc';
                            return (
                              <span key={i} className="px-2 py-1 rounded-lg text-xs font-semibold"
                                style={{ background: bg, color: cl, border:`1px solid ${cl}30`,
                                  fontFamily:'Nirmala UI, Mangal, sans-serif' }}
                                title={w.status}>
                                {w.typedWord || w.word || '∅'}
                              </span>
                            );
                          })}
                        </div>
                        {/* Legend */}
                        <div className="flex gap-4 mt-2 text-xs flex-wrap">
                          {[['#34d399','Correct'],['#f87171','Substitution'],['#fbbf24','Omission'],['#a5b4fc','Other']].map(([c,l]) => (
                            <span key={l} className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background:c }}/>
                              <span style={{ color:'var(--text-3)' }}>{l}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* ═══ REVIEWS ════════════════════════════════════════ */}
        {tab === 'Reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left: Create / Edit form ───────────────────── */}
            <div id="review-form-card" style={cardStyle}>
              <h2 className="text-lg mb-1" style={{ color:'var(--text-1)', fontWeight:800 }}>
                {editReview ? '✏️ Edit Review' : '💬 Add Review'}
              </h2>
              <p className="text-xs mb-4" style={{ color:'var(--text-3)' }}>
                {editReview ? 'Update the review details below' : 'Add a user review that will appear on the login page'}
              </p>

              <form onSubmit={handleSaveReview} className="space-y-3">

                {/* Name */}
                <div>
                  <label style={labelStyle} className="block mb-1">Reviewer Name *</label>
                  <ThemedInput required placeholder="e.g. Rahul Sharma"
                    value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name:e.target.value})}/>
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle} className="block mb-1">Role / Description</label>
                  <ThemedInput placeholder="e.g. SSC Steno Grade-C Aspirant, Delhi"
                    value={reviewForm.role} onChange={e => setReviewForm({...reviewForm, role:e.target.value})}/>
                </div>

                {/* Stars */}
                <div>
                  <label style={labelStyle} className="block mb-1.5">Star Rating</label>
                  <div className="flex gap-2">
                    {STAR_OPTIONS.map(s => (
                      <button key={s} type="button"
                        onClick={() => setReviewForm({...reviewForm, stars:s})}
                        className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
                        style={reviewForm.stars === s
                          ? { background:'rgba(251,191,36,0.18)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.5)' }
                          : { background:'var(--bg-card)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                        {'⭐'.repeat(Math.floor(s))}{s % 1 ? '½' : ''} {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatar color */}
                <div>
                  <label style={labelStyle} className="block mb-1.5">Avatar Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {REVIEW_COLOR_OPTIONS.map(c => (
                      <button key={c} type="button"
                        onClick={() => setReviewForm({...reviewForm, avatarColor:c})}
                        className="w-8 h-8 rounded-full transition-all hover:scale-110"
                        style={{
                          background: c,
                          outline: reviewForm.avatarColor===c ? `3px solid ${c}` : 'none',
                          outlineOffset: '2px',
                          boxShadow: reviewForm.avatarColor===c ? `0 0 10px ${c}80` : 'none',
                        }}/>
                    ))}
                    {/* Preview avatar */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white ml-2"
                      style={{ background: reviewForm.avatarColor, boxShadow:`0 0 12px ${reviewForm.avatarColor}60` }}>
                      {reviewForm.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'AB'}
                    </div>
                  </div>
                </div>

                {/* Hindi review */}
                <div>
                  <label style={labelStyle} className="block mb-1">Hindi Review Text *</label>
                  <ThemedTextarea required rows={3}
                    placeholder="हिंदी में समीक्षा लिखें…"
                    value={reviewForm.reviewHi}
                    onChange={e => setReviewForm({...reviewForm, reviewHi:e.target.value})}
                    style={{ fontFamily:'Nirmala UI, Mangal, serif', fontSize:'0.9rem' }}/>
                </div>

                {/* English translation */}
                <div>
                  <label style={labelStyle} className="block mb-1">English Translation <span style={{color:'var(--text-3)', fontWeight:400}}>(optional)</span></label>
                  <ThemedTextarea rows={2}
                    placeholder="English translation of the review…"
                    value={reviewForm.reviewEn}
                    onChange={e => setReviewForm({...reviewForm, reviewEn:e.target.value})}/>
                </div>

                <Msg m={reviewMsg}/>

                <div className="flex gap-2 pt-1">
                  {editReview && (
                    <button type="button"
                      onClick={() => { setEditReview(null); setReviewForm(blankReview); setReviewMsg(null); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                      style={{ border:'1px solid var(--border)', color:'var(--text-2)', background:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-card)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      Cancel
                    </button>
                  )}
                  <button type="submit"
                    className="flex-1 gradient-bg text-white font-bold py-2.5 rounded-xl text-sm transition hover:opacity-90 active:scale-95">
                    {editReview ? '💾 Save Changes' : '➕ Add Review'}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Right: Review list ─────────────────────────── */}
            <div style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg" style={{ color:'var(--text-1)', fontWeight:800 }}>
                  All Reviews ({reviews.length})
                </h2>
                <div className="flex items-center gap-2 text-xs" style={{ color:'var(--text-3)' }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background:'#10b981' }}/>
                  {reviews.filter(r=>r.isActive).length} visible
                  <span className="w-2 h-2 rounded-full inline-block ml-1" style={{ background:'#6b7280' }}/>
                  {reviews.filter(r=>!r.isActive).length} hidden
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3 opacity-30">💬</div>
                  <p className="text-sm font-semibold" style={{ color:'var(--text-3)' }}>No reviews yet</p>
                  <p className="text-xs mt-1" style={{ color:'var(--text-3)' }}>Add the first review using the form</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {reviews.map(rev => (
                    <div key={rev._id}
                      className="rounded-2xl p-4 transition-all"
                      style={{
                        border: rev.isActive ? '1px solid var(--border)' : '1px solid rgba(107,114,128,0.2)',
                        background: rev.isActive ? 'var(--bg-card)' : 'rgba(107,114,128,0.04)',
                        opacity: rev.isActive ? 1 : 0.65,
                      }}>

                      {/* Top row */}
                      <div className="flex items-center gap-3 mb-2">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                          style={{ background: rev.avatarColor, boxShadow:`0 0 10px ${rev.avatarColor}40` }}>
                          {rev.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color:'var(--text-1)' }}>{rev.name}</p>
                          {rev.role && <p className="text-xs truncate" style={{ color:'var(--text-3)' }}>{rev.role}</p>}
                        </div>
                        {/* Stars */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1,2,3,4,5].map(i => (
                            <svg key={i} className="w-3 h-3" viewBox="0 0 20 20">
                              <path fill={i <= rev.stars ? '#fbbf24' : 'rgba(251,191,36,0.2)'}
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                          <span className="text-xs font-bold ml-0.5" style={{ color:'#fbbf24' }}>{rev.stars}</span>
                        </div>
                      </div>

                      {/* Hindi text */}
                      <p className="text-xs leading-relaxed mb-1 line-clamp-2"
                        style={{ fontFamily:'Nirmala UI, Mangal, serif', color:'var(--text-2)' }}>
                        "{rev.reviewHi}"
                      </p>
                      {rev.reviewEn && (
                        <p className="text-[11px] italic mb-2" style={{ color:'var(--text-3)' }}>{rev.reviewEn}</p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2.5 pt-2.5"
                        style={{ borderTop:'1px solid var(--border)' }}>
                        {/* Visibility toggle */}
                        <button onClick={() => handleToggleReview(rev)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                          style={rev.isActive
                            ? { background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)' }
                            : { background:'rgba(107,114,128,0.10)', color:'#9ca3af', border:'1px solid var(--border)' }}>
                          {rev.isActive ? '👁 Visible' : '🙈 Hidden'}
                        </button>
                        <button onClick={() => startEditReview(rev)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                          style={{ background:'var(--bg-surface)', color:'var(--text-2)', border:'1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hi)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDeleteReview(rev._id)}
                          className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition"
                          style={{ background:'rgba(239,68,68,0.08)', color:'#f87171', border:'1px solid rgba(239,68,68,0.15)' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.16)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; }}>
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── Audio replace modal ──────────────────────────────── */}
      {audioReplaceFor && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
          style={{ background:'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl shadow-xl p-6 w-96 space-y-4 animate-scale-in"
            style={{ background:'var(--bg-modal)', border:'1px solid var(--border-hi)' }}>
            <h3 className="font-bold" style={{ color:'var(--text-1)' }}>🎵 Replace Audio</h3>
            <form onSubmit={handleAudioReplace} className="space-y-3">
              <input type="file" accept="audio/*" required
                onChange={e => setAudioFile(e.target.files[0])}
                className="file-input-green w-full text-sm"
                style={{ color:'var(--text-2)' }}
              />
              <Msg m={audioMsg}/>
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setAudioReplaceFor(null); setAudioMsg(null); setAudioFile(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                  style={{ border:'1px solid var(--border)', color:'var(--text-2)', background:'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm transition"
                  style={{ background:'#22c55e' }}
                  onMouseEnter={e => e.currentTarget.style.background='#16a34a'}
                  onMouseLeave={e => e.currentTarget.style.background='#22c55e'}>
                  Replace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Test Modal ─────────────────────────────────────── */}
      {editTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(10px)' }}
          onClick={() => { if (!editTestSaving) setEditTestModal(null); }}>
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden animate-scale-in"
            style={{ background:'var(--bg-modal)', border:'1px solid var(--border-hi)', boxShadow:'0 40px 100px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}>

            {/* Top glow */}
            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none rounded-t-3xl"
              style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.8),transparent)' }}/>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom:'1px solid var(--border)' }}>
              <div>
                <h3 className="font-black text-base flex items-center gap-2" style={{ color:'var(--text-1)' }}>
                  ✏️ Edit Test
                </h3>
                <p className="text-xs mt-0.5 truncate max-w-sm" style={{ color:'var(--text-3)' }}>
                  {editTestLoading ? 'Loading…' : editTestModal.title}
                </p>
              </div>
              <button onClick={() => setEditTestModal(null)} disabled={editTestSaving}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition hover:rotate-90 duration-300"
                style={{ background:'var(--bg-surface)', color:'var(--text-2)' }}>×</button>
            </div>

            {editTestLoading ? (
              <div className="flex-1 flex items-center justify-center py-24">
                <div className="text-4xl animate-spin">⏳</div>
              </div>
            ) : (
              <form onSubmit={handleSaveEditTest} className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">

                    {/* ── Left column: settings ── */}
                    <div className="p-6 space-y-5" style={{ borderRight:'1px solid var(--border)' }}>

                      {/* Title */}
                      <div>
                        <label style={labelStyle} className="block mb-1.5">Test Title *</label>
                        <ThemedInput required
                          value={editTestForm.title || ''}
                          onChange={e => setEditTestForm({...editTestForm, title: e.target.value})}
                          placeholder="Enter test title…"/>
                      </div>

                      {/* Category */}
                      <div>
                        <label style={labelStyle} className="block mb-1.5">Category</label>
                        <ThemedSelect
                          value={editTestForm.category || ''}
                          onChange={e => setEditTestForm({...editTestForm, category: e.target.value})}>
                          <option value=''>— No Category —</option>
                          {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                          ))}
                        </ThemedSelect>
                      </div>

                      {/* Timer */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label style={labelStyle}>Timer Duration</label>
                          <span className="text-2xl font-black" style={{ color:'#6366f1' }}>
                            {editTestForm.timer ?? 30}<span className="text-base font-semibold ml-0.5" style={{ color:'var(--text-3)' }}>min</span>
                          </span>
                        </div>
                        <input type="range" min={3} max={120} step={1}
                          value={editTestForm.timer ?? 30}
                          onChange={e => setEditTestForm({...editTestForm, timer: Number(e.target.value)})}
                          className="steno-range w-full"
                          style={{ '--pct': `${((editTestForm.timer ?? 30) - 3) / 117 * 100}%` }}/>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {[5,10,15,20,25,30,45,60,90,120].map(v => (
                            <button key={v} type="button"
                              onClick={() => setEditTestForm({...editTestForm, timer:v})}
                              className="text-xs px-2 py-1 rounded-lg font-semibold transition"
                              style={(editTestForm.timer??30)===v
                                ? { background:'rgba(99,102,241,0.20)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.4)' }
                                : { background:'var(--bg-card)', color:'var(--text-3)', border:'1px solid var(--border)' }}>
                              {v}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Audio regen notice */}
                      {textChanged && (
                        <label className="flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer animate-scale-in"
                          style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)' }}>
                          <input type="checkbox" checked={editRegenAudio}
                            onChange={e => setEditRegenAudio(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-amber-400 shrink-0"/>
                          <div>
                            <p className="text-sm font-bold" style={{ color:'#fbbf24' }}>
                              🔄 Regenerate audio
                            </p>
                            <p className="text-xs mt-0.5" style={{ color:'rgba(251,191,36,0.7)' }}>
                              Passage text was changed — regenerate Hindi audio to match the new content.
                            </p>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* ── Right column: master passage ── */}
                    <div className="p-6 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label style={labelStyle}>Master Passage Text</label>
                        <div className="flex items-center gap-2">
                          {textChanged && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-scale-in"
                              style={{ background:'rgba(245,158,11,0.15)', color:'#fbbf24' }}>
                              ● Modified
                            </span>
                          )}
                          <span className="text-xs" style={{ color:'var(--text-3)' }}>
                            {(editTestForm.extractedText || '').trim().split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>
                      </div>

                      <textarea
                        value={editTestForm.extractedText || ''}
                        onChange={e => {
                          setEditTestForm({...editTestForm, extractedText: e.target.value});
                          setTextChanged(e.target.value !== editTestModal.extractedText);
                        }}
                        placeholder="Master passage text will appear here…"
                        className="flex-1 w-full rounded-2xl p-4 text-sm outline-none resize-none transition-all"
                        rows={16}
                        style={{
                          fontFamily:'Nirmala UI, Mangal, serif',
                          lineHeight:'1.9',
                          fontSize:'0.95rem',
                          background: textChanged ? 'rgba(245,158,11,0.04)' : 'var(--bg-input)',
                          border: textChanged ? '1px solid rgba(245,158,11,0.35)' : '1px solid var(--border)',
                          color:'var(--text-1)',
                        }}
                        onFocus={e => { if (!textChanged) { e.target.style.border='1px solid var(--border-hi)'; e.target.style.boxShadow='0 0 0 3px var(--accent-glow)'; }}}
                        onBlur={e =>  { if (!textChanged) { e.target.style.border='1px solid var(--border)';    e.target.style.boxShadow='none'; }}}
                      />
                      <p className="text-xs" style={{ color:'var(--text-3)' }}>
                        💡 Edit the passage text directly. If you changed the text, check "Regenerate audio" on the left to update the audio file as well.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-3"
                  style={{ borderTop:'1px solid var(--border)' }}>
                  <Msg m={editTestMsg}/>
                  <div className="flex gap-3 shrink-0 ml-auto">
                    <button type="button" onClick={() => setEditTestModal(null)} disabled={editTestSaving}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                      style={{ border:'1px solid var(--border)', color:'var(--text-2)', background:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-card)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      Cancel
                    </button>
                    <button type="submit" disabled={editTestSaving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 0 20px rgba(99,102,241,0.35)' }}>
                      {editTestSaving ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          {editRegenAudio && textChanged ? 'Saving & Regenerating…' : 'Saving…'}
                        </>
                      ) : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Access Modal ──────────────────────────────────── */}
      {extendUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
          style={{ background:'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl shadow-2xl p-6 w-96 space-y-4 animate-scale-in"
            style={{ background:'var(--bg-modal)', border:'1px solid var(--border-hi)' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base" style={{ color:'var(--text-1)' }}>
                  {new Date() > new Date(extendUser.accessExpiry || '9999') ? '🔓 Renew Access' : '✏️ Edit Access'}
                </h3>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>{extendUser.name} · {extendUser.email}</p>
              </div>
              <button onClick={() => { setExtendUser(null); setExtendMsg(null); }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-lg transition"
                style={{ background:'var(--bg-card)', color:'var(--text-2)' }}>×</button>
            </div>

            {/* Current status */}
            {(() => {
              const ei = expiryInfo(extendUser.accessExpiry);
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ background: ei.bg, color: ei.color }}>
                  <span>⏱</span>
                  <span>Current: {extendUser.accessExpiry
                    ? `Expires ${new Date(extendUser.accessExpiry).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}`
                    : 'No expiry set'}</span>
                </div>
              );
            })()}

            <form onSubmit={handleExtendAccess} className="space-y-3">
              {/* Quick picks */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color:'var(--text-2)' }}>Set new expiry</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label:'1 Month',  days:30  },
                    { label:'3 Months', days:90  },
                    { label:'6 Months', days:180 },
                    { label:'1 Year',   days:365 },
                    { label:'2 Years',  days:730 },
                    { label:'No Limit', days:0   },
                  ].map(opt => {
                    const val = opt.days ? daysFromNow(opt.days) : '';
                    const active = extendExpiry === val;
                    return (
                      <button key={opt.label} type="button"
                        onClick={() => setExtendExpiry(val)}
                        className="text-xs py-2 px-2 rounded-lg font-semibold transition"
                        style={{
                          background: active ? 'var(--accent)' : 'var(--bg-card)',
                          color: active ? '#fff' : 'var(--text-2)',
                          border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                        }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <ThemedInput type="date"
                  value={extendExpiry}
                  onChange={e => setExtendExpiry(e.target.value)}
                />
                {extendExpiry ? (
                  <p className="text-xs mt-1" style={{ color:'#10b981' }}>
                    Access until: {new Date(extendExpiry).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                  </p>
                ) : (
                  <p className="text-xs mt-1" style={{ color:'#6b7280' }}>No expiry — user has permanent access</p>
                )}
              </div>

              {/* ── Re-attempt cooldown slider ── */}
              <div className="rounded-xl px-3 py-3 space-y-2"
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'var(--text-1)' }}>Re-attempt cooldown</p>
                    <p className="text-xs" style={{ color:'var(--text-3)' }}>Wait time before user can retry any test</p>
                  </div>
                  <span className="text-base font-black px-3 py-1 rounded-xl shrink-0"
                    style={extendCooldown > 0
                      ? { background:'rgba(245,158,11,0.15)', color:'#fbbf24' }
                      : { background:'var(--bg-surface)', color:'var(--text-3)' }}>
                    {extendCooldown === 0 ? 'No limit' : `${extendCooldown}h`}
                  </span>
                </div>
                <input type="range" min={0} max={5} step={1}
                  value={extendCooldown}
                  onChange={e => setExtendCooldown(Number(e.target.value))}
                  className="steno-range-amber w-full"
                  style={{ '--pct': `${(extendCooldown / 5) * 100}%` }}/>
                <div className="flex justify-between text-xs">
                  {['Off','1h','2h','3h','4h','5h'].map((l,i) => (
                    <button key={l} type="button"
                      onClick={() => setExtendCooldown(i)}
                      className="px-1.5 py-0.5 rounded-lg transition font-semibold"
                      style={extendCooldown === i
                        ? { background:'rgba(245,158,11,0.18)', color:'#fbbf24' }
                        : { color:'var(--text-3)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset device binding */}
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition"
                style={{ border:'1px solid var(--border)', background: extendResetDevice ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                <input type="checkbox" checked={extendResetDevice}
                  onChange={e => setExtendResetDevice(e.target.checked)}
                  className="w-4 h-4 accent-red-500"/>
                <div>
                  <p className="text-sm font-semibold" style={{ color:'var(--text-1)' }}>Reset device lock</p>
                  <p className="text-xs" style={{ color:'var(--text-3)' }}>
                    {extendUser?.deviceId ? 'Allows user to log in from a new device' : 'No device lock set'}
                  </p>
                </div>
              </label>

              <Msg m={extendMsg}/>
              <div className="flex gap-3 pt-1">
                <button type="button"
                  onClick={() => { setExtendUser(null); setExtendMsg(null); setExtendResetDevice(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                  style={{ border:'1px solid var(--border)', color:'var(--text-2)', background:'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 gradient-bg text-white font-bold py-2.5 rounded-xl text-sm transition hover:opacity-90 active:scale-95">
                  Save Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
