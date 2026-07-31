import { useApp } from '../context/AppContext';
import { truncateAddress, CONTRACT_CONFIG } from '../lib/config';

/**
 * Compact app-internal header bar — shown only inside the App dashboard section.
 * The global nav is handled by the right-rail Nav in App.tsx.
 */
export function Header() {
  const { state } = useApp();
  const { wallet } = state;

  return (
    <div className="w-full border-b border-white/[0.08] bg-black px-6 py-4 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#0000FF] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-white text-sm uppercase tracking-wider">ZK Expense Splitter</div>
          <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
            Midnight {CONTRACT_CONFIG.network.name}
          </div>
        </div>
      </div>

      {/* Wallet status */}
      {wallet.status === 'connected' && wallet.info && (
        <div className="flex items-center gap-2 border border-white/10 px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-mono text-xs text-white/60">
            {truncateAddress(wallet.info.address, 6)}
          </span>
          {wallet.info.balance && (
            <>
              <span className="text-white/20">|</span>
              <span className="font-mono text-xs text-white/50">{wallet.info.balance}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
