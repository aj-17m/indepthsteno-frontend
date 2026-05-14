import { useRef, useState, useEffect } from 'react';

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function Waveform({ playing }) {
  const heights = [20, 35, 50, 40, 60, 45, 30, 55, 42, 25, 48, 35, 22, 44, 38];
  return (
    <div className="flex items-end gap-0.5 h-10">
      {heights.map((h, i) => (
        <div
          key={i}
          className={playing ? 'wave-bar' : 'rounded-full transition-all duration-700'}
          style={{
            width: '3px',
            background: playing
              ? `hsl(${220 + i * 8}, 80%, 65%)`
              : 'rgba(255,255,255,0.2)',
            height: playing ? `${h}%` : '15%',
            borderRadius: '99px',
            transformOrigin: 'bottom',
            animationDelay: `${i * 0.07}s`,
            animationDuration: `${0.6 + (i % 4) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function CustomAudioPlayer({ src, onEnded, autoPlay = false }) {
  // Safety guard: don't render if no src
  if (!src || !src.trim?.()) return null;
  
  const audioRef  = useRef(null);
  const [playing,   setPlaying]   = useState(false);
  const [duration,  setDuration]  = useState(0);
  const [current,   setCurrent]   = useState(0);
  const [speed,     setSpeed]     = useState(1.0);
  const [volume,    setVolume]    = useState(1.0);
  const [muted,     setMuted]     = useState(false);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime);
    const onEnd  = () => {
      setPlaying(false);
    };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('ended',          onEnd);
    if (autoPlay) {
      audio.play().then(() => { setPlaying(true); setPlayCount(1); }).catch(() => {});
    }
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('ended',          onEnd);
    };
  }, [autoPlay, onEnded]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause(); setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
        setPlayCount(c => c + 1);
      }).catch(console.error);
    }
  };

  const fmt = s => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-3xl overflow-hidden animate-scale-in"
      style={{
        background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>

      {/* ── Top panel ─────────────────────────────── */}
      <div className="relative p-6 overflow-hidden"
        style={{background:'linear-gradient(135deg,rgba(79,70,229,0.4) 0%,rgba(124,58,237,0.3) 100%)'}}>
        {/* Animated bg orb */}
        {playing && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:'radial-gradient(ellipse at 30% 50%,rgba(99,102,241,0.3) 0%,transparent 70%)',
              animation:'glow-pulse 2s ease-in-out infinite',
            }}/>
        )}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background:'linear-gradient(90deg,transparent,rgba(165,180,252,0.5),transparent)'}}/>

        <div className="relative flex items-center justify-between mb-4">
          {/* Left: icon + info */}
          <div className="flex items-center gap-4">
            {/* Play icon circle */}
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                playing ? 'scale-110' : 'scale-100'
              }`}
                style={{
                  background: playing
                    ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
                    : 'rgba(255,255,255,0.12)',
                  boxShadow: playing
                    ? '0 0 30px rgba(99,102,241,0.6), 0 8px 20px rgba(0,0,0,0.3)'
                    : '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                </svg>
              </div>
              {playing && (
                <div className="absolute inset-0 rounded-2xl animate-ping"
                  style={{background:'rgba(99,102,241,0.3)', animationDuration:'1.5s'}}/>
              )}
            </div>

            <div>
              <p className="font-black text-white text-base">
                {playing ? 'Playing…' : playCount === 0 ? 'Ready to Play' : 'Ready to Replay'}
              </p>
              <p className="text-white/50 text-xs mt-0.5">{fmt(current)} / {fmt(duration)}</p>
            </div>
          </div>

          {/* Waveform */}
          <Waveform playing={playing} />
        </div>

        {/* Read-only progress bar — no seeking allowed */}
        <div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.12)'}}>
            <div className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
              style={{
                width:`${pct}%`,
                background:'linear-gradient(90deg,#818cf8,#a78bfa)',
                boxShadow:'0 0 8px rgba(165,180,252,0.5)',
              }}>
              {/* Shimmer sweep */}
              <div className="absolute inset-0"
                style={{
                  background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
                  animation:'shimmer 2s linear infinite',
                  backgroundSize:'200% 100%',
                }}/>
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1.5" style={{color:'rgba(255,255,255,0.30)'}}>
            <span>{fmt(current)}</span>
            <span className="flex items-center gap-1" style={{color:'rgba(165,180,252,0.45)'}}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              No seek
            </span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom controls ────────────────────────── */}
      <div className="p-5 space-y-4">
        {/* Play/Pause */}
        <div className="flex items-center gap-3">
          <button onClick={togglePlay}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: 'white',
              boxShadow: '0 0 20px rgba(99,102,241,0.4), 0 4px 12px rgba(0,0,0,0.3)',
            }}>
            {playing ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
                {playCount === 0 ? 'Play Audio' : 'Replay'}
              </>
            )}
          </button>

          {playCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
              style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
              <span>🔄</span>
              {playCount} {playCount === 1 ? 'listen' : 'listens'}
            </div>
          )}
        </div>

        {/* Speed slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.40)'}}>
              Playback Speed
            </p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-white">{speed.toFixed(2)}</span>
              <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.4)'}}>×</span>
            </div>
          </div>

          {/* Slider */}
          {(() => {
            const pct = ((speed - 0.5) / (2.0 - 0.5)) * 100;
            return (
              <input
                type="range" min="0.5" max="2.0" step="0.05"
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="steno-range steno-range-green"
                style={{
                  background:`linear-gradient(90deg,#10b981 ${pct}%,rgba(255,255,255,0.10) ${pct}%)`,
                }}
              />
            );
          })()}

          {/* Preset quick-pick buttons */}
          <div className="flex justify-between mt-2">
            {SPEED_PRESETS.map(s => (
              <button key={s}
                onClick={() => setSpeed(s)}
                className="text-xs px-2 py-1 rounded-lg font-bold transition-all active:scale-95"
                style={{
                  background: Math.abs(speed - s) < 0.01
                    ? 'linear-gradient(135deg,#059669,#10b981)'
                    : 'rgba(255,255,255,0.06)',
                  color: Math.abs(speed - s) < 0.01 ? 'white' : 'rgba(255,255,255,0.40)',
                  boxShadow: Math.abs(speed - s) < 0.01 ? '0 0 10px rgba(16,185,129,0.4)' : 'none',
                  border: Math.abs(speed - s) < 0.01 ? 'none' : '1px solid rgba(255,255,255,0.07)',
                }}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Volume control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.40)'}}>Volume</p>
            <div className="flex items-center gap-2">
              {/* Mute toggle */}
              <button onClick={() => setMuted(m => !m)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: muted ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.08)',
                  border: muted ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.10)',
                  color: muted ? '#f87171' : 'rgba(255,255,255,0.55)',
                }}>
                {muted || volume === 0 ? (
                  /* Muted speaker */
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                ) : volume < 0.5 ? (
                  /* Low volume */
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.146 8.354a1 1 0 011.414 0 3 3 0 010 4.243 1 1 0 01-1.414-1.415 1 1 0 000-1.414 1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  /* High volume */
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
              <span className="text-sm font-black text-white w-8 text-right">
                {muted ? '0' : Math.round(volume * 100)}
              </span>
              <span className="text-xs" style={{color:'rgba(255,255,255,0.35)'}}>%</span>
            </div>
          </div>

          {(() => {
            const volPct = muted ? 0 : volume * 100;
            return (
              <input
                type="range" min="0" max="1" step="0.02"
                value={muted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="steno-range steno-range-amber"
                style={{
                  background:`linear-gradient(90deg,#f59e0b ${volPct}%,rgba(255,255,255,0.10) ${volPct}%)`,
                }}
              />
            );
          })()}

          <div className="flex justify-between text-xs mt-1.5" style={{color:'rgba(255,255,255,0.25)'}}>
            <span>🔇</span>
            <span>🔉</span>
            <span>🔊</span>
          </div>
        </div>

      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden"/>
    </div>
  );
}
