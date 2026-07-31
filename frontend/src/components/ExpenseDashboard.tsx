import { useApp } from '../context/AppContext';
import { formatAmount, CONTRACT_CONFIG, truncateAddress } from '../lib/config';

export function ExpenseDashboard() {
  const { state, refreshLedger } = useApp();
  const { ledger, wallet } = state;
  const isConnected = wallet.status === 'connected';

  return (
    <div className="glass-card-elevated p-6 space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-public-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-public-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Public Ledger</h2>
            <p className="text-xs text-midnight-400">On-chain state — visible to all network nodes</p>
          </div>
          <span className="badge-public">
            <span className="w-1.5 h-1.5 rounded-full bg-public-400" />
            PUBLIC
          </span>
        </div>
        {isConnected && (
          <button
            onClick={refreshLedger}
            className="p-2 rounded-lg text-midnight-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Refresh ledger state"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
        )}
      </div>

      {/* State cards */}
      {!isConnected ? (
        <div className="text-center py-8 text-midnight-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="text-sm">Connect your wallet to view the public ledger state</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Settled */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-midnight-400 uppercase tracking-wider">Total Settled</span>
              <span className="badge-public text-[10px] py-0.5 px-2">on-chain</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono tabular-nums">
              {formatAmount(ledger.total_settled)}
            </p>
            <p className="text-[10px] text-midnight-500">micro-units</p>
          </div>

          {/* Settlement Count */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-midnight-400 uppercase tracking-wider">Settlements</span>
              <span className="badge-public text-[10px] py-0.5 px-2">on-chain</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono tabular-nums">
              {ledger.settlement_count.toString()}
            </p>
            <p className="text-[10px] text-midnight-500">verified transactions</p>
          </div>

          {/* Group Debt Hash */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-midnight-400 uppercase tracking-wider">Debt Hash</span>
              <span className="badge-public text-[10px] py-0.5 px-2">on-chain</span>
            </div>
            <p className="text-sm font-mono text-midnight-200 truncate" title={ledger.group_debt_hash}>
              {ledger.group_debt_hash ? truncateAddress(ledger.group_debt_hash, 10) : '—'}
            </p>
            <p className="text-[10px] text-midnight-500">group commitment</p>
          </div>

          {/* Initialization Status */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-midnight-400 uppercase tracking-wider">Status</span>
              <span className="badge-public text-[10px] py-0.5 px-2">on-chain</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${ledger.is_initialized ? 'bg-zk-500' : 'bg-midnight-600'}`} />
              <p className="text-lg font-semibold text-white">
                {ledger.is_initialized ? 'Active' : 'Not Init'}
              </p>
            </div>
            <p className="text-[10px] text-midnight-500">contract lifecycle</p>
          </div>
        </div>
      )}

      {/* Contract info bar */}
      {isConnected && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-white/[0.04] text-[11px] text-midnight-500">
          <span>
            Contract: <span className="text-midnight-300 font-mono">{truncateAddress(CONTRACT_CONFIG.address, 12)}</span>
          </span>
          <span>
            Network: <span className="text-midnight-300">{CONTRACT_CONFIG.network.name}</span>
          </span>
          <span>
            Circuits: <span className="text-midnight-300">{CONTRACT_CONFIG.contract.circuits.impure.length + CONTRACT_CONFIG.contract.circuits.pure.length}</span>
          </span>
        </div>
      )}
    </div>
  );
}
