/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.88)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%':       { transform: 'scaleY(1.0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':       { transform: 'translateY(-14px) rotate(3deg)' },
          '66%':       { transform: 'translateY(-6px) rotate(-2deg)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'bounce-in': {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '50%':  { transform: 'scale(1.08)' },
          '70%':  { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
          '50%':       { boxShadow: '0 0 40px rgba(99,102,241,0.8), 0 0 60px rgba(139,92,246,0.4)' },
        },
        'morph': {
          '0%,100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':     { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'orbit': {
          '0%':   { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ring-fill': {
          '0%':   { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--dash)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
        'shimmer-x': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.5)' },
          '60%':  { transform: 'scale(1.12)' },
          '80%':  { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.8)',  opacity: '0' },
        },
        'tilt-in': {
          '0%':   { opacity: '0', transform: 'perspective(800px) rotateX(18deg) translateY(40px)' },
          '100%': { opacity: '1', transform: 'perspective(800px) rotateX(0deg)  translateY(0)' },
        },
        'slide-in-bottom': {
          '0%':   { opacity: '0', transform: 'translateY(60px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'wiggle': {
          '0%,100%': { transform: 'rotate(-6deg)' },
          '50%':     { transform: 'rotate(6deg)' },
        },
        'float-x': {
          '0%,100%': { transform: 'translateX(0px)' },
          '50%':     { transform: 'translateX(8px)' },
        },
        'border-spin': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'rise': {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'flicker': {
          '0%,100%': { opacity: '1' },
          '33%':     { opacity: '0.85' },
          '66%':     { opacity: '0.95' },
        },
        'sweep-right': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'expand-width': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        'drop-in': {
          '0%':   { opacity: '0', transform: 'translateY(-30px) scale(0.9)' },
          '60%':  { transform: 'translateY(6px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'heartbeat': {
          '0%,100%': { transform: 'scale(1)' },
          '14%':     { transform: 'scale(1.15)' },
          '28%':     { transform: 'scale(1)' },
          '42%':     { transform: 'scale(1.1)' },
          '70%':     { transform: 'scale(1)' },
        },
        'ping-slow': {
          '0%':   { transform: 'scale(1)',   opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0'   },
        },
        'slide-right': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-in-up'     : 'fade-in-up 0.55s ease-out both',
        'fade-in'        : 'fade-in 0.4s ease-out both',
        'slide-in-right' : 'slide-in-right 0.45s ease-out both',
        'slide-in-left'  : 'slide-in-left 0.45s ease-out both',
        'scale-in'       : 'scale-in 0.35s ease-out both',
        'wave'           : 'wave 1s ease-in-out infinite',
        'float'          : 'float 3s ease-in-out infinite',
        'float-slow'     : 'float-slow 5s ease-in-out infinite',
        'shimmer'        : 'shimmer 2s linear infinite',
        'bounce-in'      : 'bounce-in 0.65s ease-out both',
        'gradient-x'     : 'gradient-x 6s ease infinite',
        'pulse-glow'     : 'pulse-glow 2.5s ease-in-out infinite',
        'morph'          : 'morph 8s ease-in-out infinite',
        'orbit'          : 'orbit 6s linear infinite',
        'spin-slow'      : 'spin-slow 12s linear infinite',
        'count-up'       : 'count-up 0.5s ease-out both',
        'ring-fill'      : 'ring-fill 1.2s ease-out forwards',
        'slide-up'       : 'slide-up 0.6s ease-out both',
        'glow-pulse'     : 'glow-pulse 2s ease-in-out infinite',
        'shimmer-x'      : 'shimmer-x 0.7s ease-in-out',
        'pop-in'         : 'pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-ring'     : 'pulse-ring 1.6s ease-out infinite',
        'tilt-in'        : 'tilt-in 0.6s ease-out both',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out both',
        'wiggle'         : 'wiggle 0.5s ease-in-out',
        'float-x'        : 'float-x 4s ease-in-out infinite',
        'border-spin'    : 'border-spin 4s linear infinite',
        'rise'         : 'rise 0.45s ease-out both',
        'flicker'      : 'flicker 3s ease-in-out infinite',
        'sweep-right'  : 'sweep-right 0.5s ease-out both',
        'expand-width' : 'expand-width 0.8s ease-out both',
        'drop-in'      : 'drop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
        'heartbeat'    : 'heartbeat 1.4s ease-in-out infinite',
        'ping-slow'    : 'ping-slow 2s ease-out infinite',
        'slide-right'  : 'slide-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
