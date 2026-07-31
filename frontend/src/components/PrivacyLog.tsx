import { useApp } from '../context/AppContext';
import type { PrivacyLogEntry } from '../types';

const DOT_COLOR: Record<PrivacyLogEntry['type'], string> = {
  private_input: '#fbbf24',
  zk_proof: '#34d399',
  public_update: '#4040ff',
  tx_submitted: '#6060ff',
};

const LEFT_BORDER: Record<PrivacyLogEntry['type'], string> = {
  private_input: '#fbbf24',
  zk_proof: '#34d399',
  public_update: '#0000FF',
  tx_submitted: '#4040ff',
};

const TYPE_LABELS: Record<PrivacyLogEntry['type'], string> = {
  private_input: 'PRIVATE',
  zk_proof: 'ZK PROOF',
  public_update: 'PUBLIC',
  tx_submitted: 'TX',
};

const BADGE_STYLE: Record<PrivacyLogEntry['type'], string> = {
  private_input: 'badge-private',
  zk_proof: 'badge-zk',
  public_update: 'badge-public',
  tx_submitted: 'badge-public',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function PrivacyLog() {
  const { state, clearPrivacyLog } = useApp();
  const { privacyLog } = state;

  if (privacyLog.length === 0) return null;

  return (
    <div className="border border-white/10 bg-[#111111] hover:border-[#0000FF]/30 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#34d399]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white uppercase tracking-wide text-sm">Privacy Audit Log</h2>
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Real-time view of private vs. on-chain data</p>
          </div>
        </div>
        <button
          onClick={clearPrivacyLog}
          className="font-mono text-[10px] text-white/25 uppercase tracking-widest hover:text-white/60 transition-colors cursor-pointer border border-white/10 hover:border-white/30 px-3 py-1"
        >
          Clear
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {[
            { color: '#fbbf24', label: 'Private (local only)' },
            { color: '#34d399', label: 'ZK Proof (local computation)' },
            { color: '#4040ff', label: 'Public (on-chain / network)' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5" style={{ background: l.color }} />
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Log entries */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {privacyLog.map((entry) => (
            <div
              key={entry.id}
              className="bg-black border border-white/[0.06] flex items-start gap-3 p-3 transition-all"
              style={{ borderLeftWidth: '2px', borderLeftColor: LEFT_BORDER[entry.type] }}
            >
              <div
                className="w-1.5 h-1.5 mt-1.5 shrink-0 rounded-full"
                style={{ background: DOT_COLOR[entry.type] }}
              />

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-xs uppercase tracking-wide">{entry.label}</span>
                  <span className={`${BADGE_STYLE[entry.type]} text-[9px] py-0 px-1.5`}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                  {entry.isPrivate && (
                    <span className="font-mono text-[9px] text-[#fbbf24]/50 uppercase tracking-widest">
                      🔒 never broadcast
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-white/35 leading-relaxed break-all">
                  {entry.detail}
                </p>
              </div>

              <span className="font-mono text-[10px] text-white/20 shrink-0 tabular-nums">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
