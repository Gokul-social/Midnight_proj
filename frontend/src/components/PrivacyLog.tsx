import { useApp } from '../context/AppContext';
import type { PrivacyLogEntry } from '../types';

const TYPE_STYLES: Record<PrivacyLogEntry['type'], { badge: string; dotColor: string; borderAccent: string }> = {
  private_input: {
    badge: 'badge-private',
    dotColor: 'bg-private-400',
    borderAccent: 'border-l-private-500/40',
  },
  zk_proof: {
    badge: 'badge-zk',
    dotColor: 'bg-zk-400',
    borderAccent: 'border-l-zk-500/40',
  },
  public_update: {
    badge: 'badge-public',
    dotColor: 'bg-public-400',
    borderAccent: 'border-l-public-500/40',
  },
  tx_submitted: {
    badge: 'badge-public',
    dotColor: 'bg-public-300',
    borderAccent: 'border-l-public-400/40',
  },
};

const TYPE_LABELS: Record<PrivacyLogEntry['type'], string> = {
  private_input: 'PRIVATE',
  zk_proof: 'ZK PROOF',
  public_update: 'PUBLIC',
  tx_submitted: 'TX',
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function PrivacyLog() {
  const { state, clearPrivacyLog } = useApp();
  const { privacyLog } = state;

  if (privacyLog.length === 0) return null;

  return (
    <div className="glass-card-elevated p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zk-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-zk-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Privacy Audit Log</h2>
            <p className="text-xs text-midnight-400">Real-time view of what stays private vs. what goes on-chain</p>
          </div>
        </div>
        <button
          onClick={clearPrivacyLog}
          className="text-xs text-midnight-500 hover:text-midnight-300 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-private-400" />
          <span className="text-[10px] text-midnight-400">Private (local only)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zk-400" />
          <span className="text-[10px] text-midnight-400">ZK Proof (local computation)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-public-400" />
          <span className="text-[10px] text-midnight-400">Public (on-chain / network)</span>
        </div>
      </div>

      {/* Log entries */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {privacyLog.map((entry) => {
          const style = TYPE_STYLES[entry.type];
          return (
            <div
              key={entry.id}
              className={`rounded-lg bg-white/[0.02] border border-white/[0.04] border-l-2 ${style.borderAccent} p-3 flex items-start gap-3 transition-all duration-300`}
            >
              {/* Dot */}
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dotColor}`} />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white">{entry.label}</span>
                  <span className={`${style.badge} text-[10px] py-0 px-1.5`}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                  {entry.isPrivate && (
                    <span className="text-[10px] text-private-500 flex items-center gap-1">
                      🔒 never broadcast
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-midnight-400 leading-relaxed break-all">
                  {entry.detail}
                </p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-midnight-600 font-mono shrink-0 tabular-nums">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
