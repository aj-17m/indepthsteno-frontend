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
        <div className="mb-2">
          <img 
            src="/mainlogo.jpeg" 
            alt="Indepth Stenography Logo" 
            className="h-16 w-auto object-contain mx-auto"
            style={{ 
              filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.4))',
              maxWidth: '120px'
            }}
          />
        </div>
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-2xl border-2 animate-ping-slow"
          style={{ borderColor: 'rgba(99,102,241,0.3)' }}
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
          Indepth Stenography
        </p>
        <p className="text-xs mt-1 animate-pulse" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
