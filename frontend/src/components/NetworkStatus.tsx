import { useState, useEffect } from 'react';
import { CONTRACT_CONFIG } from '../lib/config';

type NetworkHealth = 'checking' | 'online' | 'degraded' | 'offline';

interface HealthState {
  indexer: NetworkHealth;
  proofServer: NetworkHealth;
  lastChecked: Date | null;
}

const DOT_COLOR: Record<NetworkHealth, string> = {
  checking: 'bg-white/30 animate-pulse',
  online:   'bg-[#10b981] animate-pulse',
  degraded: 'bg-[#fbbf24] animate-pulse',
  offline:  'bg-[#ef4444]',
};

const LABEL_COLOR: Record<NetworkHealth, string> = {
  checking: 'text-white/30',
  online:   'text-[#10b981]',
  degraded: 'text-[#fbbf24]',
  offline:  'text-[#ef4444]',
};

async function checkIndexer(uri: string): Promise<NetworkHealth> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok ? 'online' : 'degraded';
  } catch {
    return 'offline';
  }
}

async function checkProofServer(uri: string): Promise<NetworkHealth> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${uri}/api/v1/status`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.status < 500 ? 'online' : 'degraded';
  } catch {
    return 'offline';
  }
}

export function NetworkStatus() {
  const [health, setHealth] = useState<HealthState>({
    indexer: 'checking',
    proofServer: 'checking',
    lastChecked: null,
  });

  const runChecks = async () => {
    setHealth(h => ({ ...h, indexer: 'checking', proofServer: 'checking' }));
    const [indexer, proofServer] = await Promise.all([
      checkIndexer(CONTRACT_CONFIG.network.indexerUri),
      checkProofServer(CONTRACT_CONFIG.network.proofServerUri),
    ]);
    setHealth({ indexer, proofServer, lastChecked: new Date() });
  };

  useEffect(() => {
    runChecks();
    // Re-check every 60 seconds
    const interval = setInterval(runChecks, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date | null) => {
    if (!d) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="border border-white/10 bg-[#111111] hover:border-[#0000FF]/30 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#0000FF]/20 border border-[#0000FF]/40 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-[#0000FF]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white uppercase tracking-wide text-xs">Network Status</h3>
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-widest">Midnight Preprod</p>
          </div>
        </div>
        <button
          onClick={runChecks}
          className="w-6 h-6 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/40 transition-all"
          title="Refresh status"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      {/* Status rows */}
      <div className="px-6 py-4 space-y-3">
        {/* Indexer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${DOT_COLOR[health.indexer]}`} />
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-widest">Preprod Indexer</span>
          </div>
          <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${LABEL_COLOR[health.indexer]}`}>
            {health.indexer === 'checking' ? 'CHECKING...' : health.indexer.toUpperCase()}
          </span>
        </div>

        {/* Proof Server */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${DOT_COLOR[health.proofServer]}`} />
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-widest">Local Proof Server</span>
          </div>
          <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${LABEL_COLOR[health.proofServer]}`}>
            {health.proofServer === 'checking' ? 'CHECKING...' : health.proofServer.toUpperCase()}
          </span>
        </div>

        {/* Contract address */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">Contract</span>
          <a
            href={`${CONTRACT_CONFIG.network.explorerBase}?query=${encodeURIComponent(`{ contract(address: "${CONTRACT_CONFIG.address}") { state { total_settled settlement_count is_initialized } } }`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] text-[#0000FF] hover:text-white transition-colors truncate max-w-[180px]"
            title={CONTRACT_CONFIG.address}
          >
            {CONTRACT_CONFIG.address.slice(0, 14)}…{CONTRACT_CONFIG.address.slice(-8)} ↗
          </a>
        </div>

        {/* Last checked */}
        {health.lastChecked && (
          <p className="font-mono text-[9px] text-white/15 uppercase tracking-widest text-right">
            Last checked: {formatTime(health.lastChecked)}
          </p>
        )}
      </div>
    </div>
  );
}
