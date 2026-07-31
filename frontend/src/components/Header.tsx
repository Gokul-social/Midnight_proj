import { useApp } from '../context/AppContext';
import { truncateAddress, CONTRACT_CONFIG } from '../lib/config';

export function Header() {
  const { state, connectWallet, disconnectWallet } = useApp();
  const { wallet } = state;

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/[0.06] rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-public-500 to-zk-500 flex items-center justify-center shadow-lg shadow-public-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-zk-500 border-2 border-midnight-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                ZK Expense Splitter
              </h1>
              <p className="text-[10px] text-midnight-400 font-medium tracking-wide uppercase">
                Midnight {CONTRACT_CONFIG.network.name}
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {wallet.status === 'connected' && wallet.info && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-zk-500 animate-pulse" />
                <span className="text-xs font-mono text-midnight-200">
                  {truncateAddress(wallet.info.address, 6)}
                </span>
                {wallet.info.balance && (
                  <>
                    <span className="text-midnight-500">|</span>
                    <span className="text-xs text-midnight-300">{wallet.info.balance}</span>
                  </>
                )}
              </div>
            )}

            {wallet.status === 'disconnected' && (
              <button
                onClick={connectWallet}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-public-600 to-public-500 text-white hover:from-public-500 hover:to-public-400 transition-all duration-200 shadow-lg shadow-public-500/20 hover:shadow-public-500/30 active:scale-[0.97] cursor-pointer"
              >
                Connect Lace
              </button>
            )}

            {wallet.status === 'connecting' && (
              <button
                disabled
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-public-600/50 text-white/70 flex items-center gap-2"
              >
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </button>
            )}

            {wallet.status === 'connected' && (
              <button
                onClick={disconnectWallet}
                className="px-3 py-2 text-xs font-medium rounded-lg text-midnight-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
              >
                Disconnect
              </button>
            )}

            {wallet.status === 'error' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger-400">{wallet.error}</span>
                <button
                  onClick={connectWallet}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger-500/20 text-danger-400 hover:bg-danger-500/30 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
