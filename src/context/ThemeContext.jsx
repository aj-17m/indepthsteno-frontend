import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = {
  dark: {
    name: 'Dark',
    icon: '🌑',
    '--bg-base'    : '#0f0f1a',
    '--bg-mid'     : '#1a1a2e',
    '--bg-surface' : '#1c1c30',
    '--bg-card'    : '#181828',
    '--bg-input'   : '#1e1e35',
    '--bg-modal'   : 'rgba(20,20,40,0.97)',
    '--border'     : 'rgba(255,255,255,0.08)',
    '--border-hi'  : 'rgba(99,102,241,0.35)',
    '--text-1'     : 'rgba(255,255,255,0.90)',
    '--text-2'     : 'rgba(255,255,255,0.50)',
    '--text-3'     : 'rgba(255,255,255,0.25)',
    '--header-bg'  : 'rgba(15,15,26,0.80)',
    '--orb-1'      : 'rgba(99,102,241,0.20)',
    '--orb-2'      : 'rgba(139,92,246,0.15)',
    '--select-bg'  : '#1e1e35',
    '--select-text': 'rgba(255,255,255,0.80)',
    '--accent'     : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    '--accent-glow': 'rgba(99,102,241,0.40)',
    '--tip-bg'     : 'rgba(99,102,241,0.12)',
    '--tip-border' : 'rgba(99,102,241,0.20)',
    '--tip-text'   : 'rgba(165,180,252,0.90)',
    '--rule-bg'    : 'rgba(245,158,11,0.08)',
    '--rule-border': 'rgba(245,158,11,0.15)',
    '--rule-text'  : 'rgba(253,230,138,0.65)',
    '--rule-head'  : 'rgba(251,191,36,0.80)',
  },
  light: {
    name: 'Light',
    icon: '☀️',
    '--bg-base'    : '#f0f4ff',
    '--bg-mid'     : '#e8eeff',
    '--bg-surface' : '#ffffff',
    '--bg-card'    : '#ffffff',
    '--bg-input'   : '#f1f5f9',
    '--bg-modal'   : 'rgba(255,255,255,0.98)',
    '--border'     : 'rgba(99,102,241,0.12)',
    '--border-hi'  : 'rgba(99,102,241,0.40)',
    '--text-1'     : '#1e1b4b',
    '--text-2'     : '#475569',
    '--text-3'     : '#94a3b8',
    '--header-bg'  : 'rgba(255,255,255,0.90)',
    '--orb-1'      : 'rgba(99,102,241,0.08)',
    '--orb-2'      : 'rgba(139,92,246,0.06)',
    '--select-bg'  : '#f1f5f9',
    '--select-text': '#1e1b4b',
    '--accent'     : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    '--accent-glow': 'rgba(99,102,241,0.25)',
    '--tip-bg'     : 'rgba(99,102,241,0.08)',
    '--tip-border' : 'rgba(99,102,241,0.20)',
    '--tip-text'   : '#4338ca',
    '--rule-bg'    : 'rgba(245,158,11,0.08)',
    '--rule-border': 'rgba(245,158,11,0.25)',
    '--rule-text'  : '#92400e',
    '--rule-head'  : '#b45309',
  },
  ocean: {
    name: 'Ocean',
    icon: '🌊',
    '--bg-base'    : '#040d18',
    '--bg-mid'     : '#071628',
    '--bg-surface' : '#0b1e35',
    '--bg-card'    : '#091a2f',
    '--bg-input'   : '#0d2040',
    '--bg-modal'   : 'rgba(7,22,40,0.97)',
    '--border'     : 'rgba(6,182,212,0.12)',
    '--border-hi'  : 'rgba(6,182,212,0.40)',
    '--text-1'     : 'rgba(224,242,254,0.95)',
    '--text-2'     : 'rgba(125,211,252,0.65)',
    '--text-3'     : 'rgba(125,211,252,0.30)',
    '--header-bg'  : 'rgba(4,13,24,0.85)',
    '--orb-1'      : 'rgba(6,182,212,0.20)',
    '--orb-2'      : 'rgba(14,116,144,0.18)',
    '--select-bg'  : '#0d2040',
    '--select-text': 'rgba(224,242,254,0.90)',
    '--accent'     : 'linear-gradient(135deg,#0891b2,#06b6d4)',
    '--accent-glow': 'rgba(6,182,212,0.40)',
    '--tip-bg'     : 'rgba(6,182,212,0.10)',
    '--tip-border' : 'rgba(6,182,212,0.20)',
    '--tip-text'   : 'rgba(103,232,249,0.90)',
    '--rule-bg'    : 'rgba(14,116,144,0.10)',
    '--rule-border': 'rgba(14,116,144,0.20)',
    '--rule-text'  : 'rgba(103,232,249,0.65)',
    '--rule-head'  : 'rgba(103,232,249,0.85)',
  },
  sunset: {
    name: 'Sunset',
    icon: '🌅',
    '--bg-base'    : '#180a0a',
    '--bg-mid'     : '#2a1010',
    '--bg-surface' : '#231212',
    '--bg-card'    : '#1e1010',
    '--bg-input'   : '#2d1515',
    '--bg-modal'   : 'rgba(30,10,10,0.97)',
    '--border'     : 'rgba(251,113,133,0.12)',
    '--border-hi'  : 'rgba(251,113,133,0.40)',
    '--text-1'     : 'rgba(255,237,213,0.95)',
    '--text-2'     : 'rgba(253,186,116,0.70)',
    '--text-3'     : 'rgba(253,186,116,0.30)',
    '--header-bg'  : 'rgba(24,10,10,0.85)',
    '--orb-1'      : 'rgba(239,68,68,0.20)',
    '--orb-2'      : 'rgba(251,146,60,0.18)',
    '--select-bg'  : '#2d1515',
    '--select-text': 'rgba(255,237,213,0.90)',
    '--accent'     : 'linear-gradient(135deg,#dc2626,#f97316)',
    '--accent-glow': 'rgba(249,115,22,0.40)',
    '--tip-bg'     : 'rgba(249,115,22,0.10)',
    '--tip-border' : 'rgba(249,115,22,0.22)',
    '--tip-text'   : 'rgba(253,186,116,0.95)',
    '--rule-bg'    : 'rgba(239,68,68,0.08)',
    '--rule-border': 'rgba(239,68,68,0.18)',
    '--rule-text'  : 'rgba(252,165,165,0.65)',
    '--rule-head'  : 'rgba(252,165,165,0.85)',
  },
  forest: {
    name: 'Forest',
    icon: '🌿',
    '--bg-base'    : '#060f0a',
    '--bg-mid'     : '#0a1a10',
    '--bg-surface' : '#0d2015',
    '--bg-card'    : '#0b1c12',
    '--bg-input'   : '#0f2518',
    '--bg-modal'   : 'rgba(9,20,13,0.97)',
    '--border'     : 'rgba(34,197,94,0.10)',
    '--border-hi'  : 'rgba(34,197,94,0.35)',
    '--text-1'     : 'rgba(220,252,231,0.95)',
    '--text-2'     : 'rgba(134,239,172,0.65)',
    '--text-3'     : 'rgba(134,239,172,0.30)',
    '--header-bg'  : 'rgba(6,15,10,0.85)',
    '--orb-1'      : 'rgba(34,197,94,0.18)',
    '--orb-2'      : 'rgba(16,185,129,0.14)',
    '--select-bg'  : '#0f2518',
    '--select-text': 'rgba(220,252,231,0.90)',
    '--accent'     : 'linear-gradient(135deg,#059669,#10b981)',
    '--accent-glow': 'rgba(16,185,129,0.40)',
    '--tip-bg'     : 'rgba(34,197,94,0.10)',
    '--tip-border' : 'rgba(34,197,94,0.20)',
    '--tip-text'   : 'rgba(134,239,172,0.95)',
    '--rule-bg'    : 'rgba(16,185,129,0.08)',
    '--rule-border': 'rgba(16,185,129,0.18)',
    '--rule-text'  : 'rgba(110,231,183,0.65)',
    '--rule-head'  : 'rgba(110,231,183,0.85)',
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('steno-theme') || 'dark');

  useEffect(() => {
    const vars = THEMES[theme] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
    root.setAttribute('data-theme', theme);
    localStorage.setItem('steno-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
