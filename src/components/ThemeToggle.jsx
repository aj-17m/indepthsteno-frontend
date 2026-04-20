import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';

const SWATCHES = {
  dark   : ['#4f46e5','#7c3aed','#0f0f1a'],
  light  : ['#4f46e5','#7c3aed','#f0f4ff'],
  ocean  : ['#0891b2','#06b6d4','#040d18'],
  sunset : ['#dc2626','#f97316','#180a0a'],
  forest : ['#059669','#10b981','#060f0a'],
};

export default function ThemeToggle({ light = false }) {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = themes[theme];

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-bold"
        style={light ? {
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
        } : {
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-2)',
        }}>
        <span className="text-sm">{current.icon}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden animate-scale-in"
          style={{
            zIndex: 9999,
            background: 'var(--bg-modal)',
            border: '1px solid var(--border-hi)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
          {/* Header */}
          <div className="px-4 py-3" style={{borderBottom:'1px solid var(--border)'}}>
            <p className="text-xs font-black uppercase tracking-widest" style={{color:'var(--text-3)'}}>
              Choose Theme
            </p>
          </div>

          {/* Options */}
          <div className="p-2 space-y-1">
            {Object.entries(themes).map(([key, t]) => {
              const sw = SWATCHES[key];
              const active = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    background: active ? 'var(--border-hi)' : 'transparent',
                    border: active ? '1px solid var(--border-hi)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-surface)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>

                  {/* Color swatch */}
                  <div className="flex gap-0.5 shrink-0">
                    {sw.map((c, i) => (
                      <div key={i} className="w-3 h-5 rounded"
                        style={{background: c, borderRadius: i===0?'4px 0 0 4px':i===sw.length-1?'0 4px 4px 0':'0'}}/>
                    ))}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{color:'var(--text-1)'}}>
                      {t.icon} {t.name}
                    </p>
                  </div>

                  {active && (
                    <svg className="w-4 h-4 shrink-0" style={{color:'var(--text-2)'}}
                      fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
