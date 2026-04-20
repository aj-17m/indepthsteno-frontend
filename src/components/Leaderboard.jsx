export default function Leaderboard({ entries = [] }) {
  if (!entries.length) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm" style={{color:'rgba(255,255,255,0.3)'}}>No results yet</p>
      </div>
    );
  }

  const medal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="text-xs font-bold" style={{color:'rgba(255,255,255,0.3)'}}>{rank}</span>;
  };

  const errColor = (pct) => {
    if (pct <= 5)  return '#34d399';
    if (pct <= 10) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => {
        const isMe = entry.isMe;
        const fmt  = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';
        return (
          <div key={idx}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
            style={{
              background: isMe
                ? 'rgba(16,185,129,0.12)'
                : idx < 3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
              border: isMe
                ? '1px solid rgba(16,185,129,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isMe ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
            }}>
            {/* Rank */}
            <div className="w-8 text-center text-lg shrink-0">
              {medal(entry.rank)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate"
                  style={{color: isMe ? '#34d399' : 'rgba(255,255,255,0.8)'}}>
                  {entry.name}
                </span>
                {isMe && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{background:'rgba(16,185,129,0.2)', color:'#34d399'}}>
                    You
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.3)'}}>
                {entry.accuracy?.toFixed(1)}% acc · {entry.wpm} wpm · {fmt(entry.timeTaken)}
              </p>
            </div>

            {/* Error % */}
            <div className="text-right shrink-0">
              <span className="text-base font-black" style={{color:errColor(entry.errorPercentage)}}>
                {entry.errorPercentage?.toFixed(2)}%
              </span>
              <p className="text-xs" style={{color:'rgba(255,255,255,0.25)'}}>error</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
