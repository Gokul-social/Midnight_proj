import { useApp } from '../context/AppContext';
import { formatAmount, CONTRACT_CONFIG, truncateAddress } from '../lib/config';

export function ExpenseDashboard() {
  const { state, refreshLedger } = useApp();
  const { ledger, wallet } = state;
  const isConnected = wallet.status === 'connected';

  return (
    <div className="border border-white/10 bg-[#111111] hover:border-[#0000FF]/30 transition-colors duration-300">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-[#0000FF] flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white uppercase tracking-wide text-sm">Public Ledger</h2>
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">On-chain state — visible to all network nodes</p>
          </div>
          <span className="badge-public">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4040ff]" />
            PUBLIC
          </span>
        </div>
        {isConnected && (
          <button
            onClick={refreshLedger}
            className="w-8 h-8 flex items-center justify-center border border-white/10 text-white/30 hover:text-white hover:border-white/40 transition-all cursor-pointer"
            title="Refresh ledger"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        {!isConnected ? (
          <div className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest">Connect wallet to view on-chain state</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Settled */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Total Settled</span>
                <span className="badge-public text-[9px] py-0.5 px-1.5">on-chain</span>
              </div>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">{formatAmount(ledger.total_settled)}</p>
              <p className="font-mono text-[9px] text-white/20 uppercase mt-1 tracking-widest">micro-units</p>
            </div>

            {/* Settlement Count */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Settlements</span>
                <span className="badge-public text-[9px] py-0.5 px-1.5">on-chain</span>
              </div>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">{ledger.settlement_count.toString()}</p>
              <p className="font-mono text-[9px] text-white/20 uppercase mt-1 tracking-widest">verified transactions</p>
            </div>

            {/* Debt Hash */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Debt Hash</span>
                <span className="badge-public text-[9px] py-0.5 px-1.5">on-chain</span>
              </div>
              <p className="font-mono text-sm text-white/60 truncate" title={ledger.group_debt_hash}>
                {ledger.group_debt_hash ? truncateAddress(ledger.group_debt_hash, 8) : '—'}
              </p>
              <p className="font-mono text-[9px] text-white/20 uppercase mt-1 tracking-widest">group commitment</p>
            </div>

            {/* Status */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Status</span>
                <span className="badge-public text-[9px] py-0.5 px-1.5">on-chain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${ledger.is_initialized ? 'bg-[#10b981]' : 'bg-white/20'}`} />
                <p className="font-bold text-white text-lg uppercase tracking-wide">
                  {ledger.is_initialized ? 'Active' : 'Not Init'}
                </p>
              </div>
              <p className="font-mono text-[9px] text-white/20 uppercase mt-1 tracking-widest">contract lifecycle</p>
            </div>
          </div>
        )}

        {/* Contract footer */}
        {isConnected && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-x-6 gap-y-1">
            <span className="font-mono text-[10px] text-white/25">
              Contract: <span className="text-white/50">{truncateAddress(CONTRACT_CONFIG.address, 10)}</span>
            </span>
            <span className="font-mono text-[10px] text-white/25">
              Network: <span className="text-white/50">{CONTRACT_CONFIG.network.name}</span>
            </span>
            <span className="font-mono text-[10px] text-white/25">
              Circuits: <span className="text-white/50">{CONTRACT_CONFIG.contract.circuits.impure.length + CONTRACT_CONFIG.contract.circuits.pure.length}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
