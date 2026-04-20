export default function PageLoader({ message = 'Loading…' }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)' }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          top: '-80px', left: '-80px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          bottom: '-60px', right: '-60px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div className="relative animate-float-slow">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{
            background: 'linear-gradient(-45deg,#4f46e5,#7c3aed,#2563eb)',
            backgroundSize: '300%',
            animation: 'gradient-x 4s ease infinite, float-slow 5s ease-in-out infinite',
            boxShadow: '0 0 40px rgba(99,102,241,0.55), 0 16px 40px rgba(0,0,0,0.5)',
          }}
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-2xl border-2 animate-ping-slow"
          style={{ borderColor: 'rgba(99,102,241,0.5)' }}
        />
      </div>

      {/* Spinner */}
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'rgba(99,102,241,0.25)',
            borderTopColor: '#6366f1',
          }}
        />
        <div
          className="absolute inset-1.5 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'rgba(139,92,246,0.20)',
            borderBottomColor: '#8b5cf6',
            animationDirection: 'reverse',
            animationDuration: '0.8s',
          }}
        />
      </div>

      {/* App name */}
      <div className="text-center">
        <p
          className="text-base font-black tracking-wide"
          style={{
            background: 'linear-gradient(90deg, #818cf8, #c084fc, #38bdf8)',
            backgroundSize: '300%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'border-spin 4s linear infinite',
          }}
        >
          Steno Practice
        </p>
        <p className="text-xs mt-1 animate-pulse" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
