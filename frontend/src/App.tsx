import { Header } from './components/Header';
import { ExpenseDashboard } from './components/ExpenseDashboard';
import { SettleExpenseForm } from './components/SettleExpenseForm';
import { PrivacyLog } from './components/PrivacyLog';
import { useApp } from './context/AppContext';

function AppContent() {
  const { state } = useApp();
  const isConnected = state.wallet.status === 'connected';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero section when disconnected */}
        {!isConnected && (
          <section className="text-center py-16 sm:py-24 space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-public-400 via-zk-400 to-private-400 tracking-tight">
                Privacy-First Expense Splitting
              </h2>
              <p className="text-lg text-midnight-300 max-w-2xl mx-auto leading-relaxed">
                Settle group expenses with <strong className="text-white">zero-knowledge proofs</strong>. 
                Your amounts stay private. Only the proof goes on-chain.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-private-500/[0.08] border border-private-500/15 text-private-300">
                <span>🔒</span> Amounts stay local
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zk-500/[0.08] border border-zk-500/15 text-zk-300">
                <span>⚡</span> ZK proofs verify truth
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-public-500/[0.08] border border-public-500/15 text-public-300">
                <span>🌐</span> Only proofs go on-chain
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-midnight-500 max-w-lg mx-auto">
                Built on the <span className="text-midnight-300">Midnight Network</span> — privacy by default, selective disclosure by choice.
                Connect your Lace wallet on Preprod to begin.
              </p>
            </div>
          </section>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Dashboard (wider) */}
          <div className="lg:col-span-3 space-y-6">
            <ExpenseDashboard />
            <PrivacyLog />
          </div>

          {/* Right: Settlement form */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <SettleExpenseForm />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-midnight-500">
          <span>
            🌙 Powered by <span className="text-midnight-300">Midnight Network</span> — Zero-Knowledge Privacy
          </span>
          <span>
            Midnight Builder Program — Level 2 Submission
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
