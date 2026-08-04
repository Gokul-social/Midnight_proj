import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ExpenseDashboard } from './components/ExpenseDashboard';
import { SettleExpenseForm } from './components/SettleExpenseForm';
import { PrivacyLog } from './components/PrivacyLog';
import { PrivacyClaim } from './components/PrivacyClaim';

// ────────────────────────────────────────────────────────────
// Marquee bar
// ────────────────────────────────────────────────────────────
function MarqueeBar({ position }: { position: 'top' | 'bottom' }) {
  const text = 'ZK EXPENSE SPLITTER — 34 TESTS PASSING — MIDNIGHT PREVIEW DEPLOYED — PRIVACY BY DEFAULT — ';
  const repeated = Array(6).fill(text).join('');
  return (
    <div
      className={`fixed ${position}-0 left-0 w-full h-10 bg-pitch-black border-${position === 'top' ? 'b' : 't'} border-white/10 z-[100] flex items-center overflow-hidden`}
    >
      <div className="animate-marquee whitespace-nowrap flex">
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            className="text-[13px] font-mono font-medium text-white uppercase tracking-[0.12em] px-0"
          >
            {repeated}
          </span>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Right-rail navigation
// ────────────────────────────────────────────────────────────
function Nav({ activeSection, setActiveSection }: {
  activeSection: 'home' | 'app';
  setActiveSection: (s: 'home' | 'app') => void;
}) {
  const { state, connectWallet, disconnectWallet } = useApp();
  const isConnected = state.wallet.status === 'connected';
  const isDemo = state.wallet.isDemo;
  const laceDetected = state.laceDetected;

  return (
    <nav className="fixed right-0 top-0 h-full w-[240px] flex flex-col justify-center items-end pr-8 z-50">
      <div className="flex flex-col gap-6 items-end">
        <button
          onClick={() => setActiveSection('home')}
          className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
        >
          HOME
        </button>
        <button
          onClick={() => setActiveSection('app')}
          className={`nav-link ${activeSection === 'app' ? 'active' : ''}`}
        >
          APP
        </button>
        <a
          href="https://github.com/Gokul-social/Midnight_proj"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          GITHUB
        </a>
        <a
          href="https://docs.midnight.network"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link text-right"
        >
          DOCS
        </a>

        {/* Wallet status */}
        <div className="mt-8 flex flex-col items-end gap-2">
          {/* Lace detection indicator (only when not connected) */}
          {!isConnected && laceDetected && (
            <div className="flex items-center gap-1.5 border border-[#10b981]/30 bg-[#10b981]/5 px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="font-mono text-[9px] text-[#10b981] uppercase tracking-widest">Lace detected</span>
            </div>
          )}

          {isConnected && state.wallet.info && (
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-2 border px-3 py-1.5 ${
                isDemo ? 'border-[#fbbf24]/30 bg-[#fbbf24]/5' : 'border-[#10b981]/30 bg-[#10b981]/5'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isDemo ? 'bg-[#fbbf24]' : 'bg-[#10b981]'
                }`} />
                <span className="text-xs font-mono text-white/70">
                  {state.wallet.info.address.slice(0, 10)}...
                </span>
              </div>
              {state.wallet.info.balance && (
                <span className="text-[11px] font-mono text-white/40">{state.wallet.info.balance}</span>
              )}
              {isDemo && (
                <span className="font-mono text-[9px] text-[#fbbf24]/60 uppercase tracking-widest">Demo mode</span>
              )}
              <button
                onClick={disconnectWallet}
                className="text-[11px] font-mono uppercase text-white/30 hover:text-white/70 tracking-widest transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
          {state.wallet.status === 'connecting' && (
            <div className="text-[11px] font-mono uppercase text-white/40 tracking-widest animate-pulse">
              Connecting...
            </div>
          )}
          {(state.wallet.status === 'disconnected' || state.wallet.status === 'error') && (
            <button
              onClick={() => { setActiveSection('app'); connectWallet(); }}
              className="text-[11px] font-mono uppercase text-[#0000FF] hover:text-white tracking-widest transition-colors border border-[#0000FF]/40 hover:border-white px-3 py-1.5"
            >
              {laceDetected ? 'CONNECT LACE' : 'CONNECT'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────────────
// Landing page (HOME)
// ────────────────────────────────────────────────────────────
function LandingPage({ onLaunchApp }: { onLaunchApp: () => void }) {
  const { state, connectWallet } = useApp();
  const isConnected = state.wallet.status === 'connected';

  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative w-full h-[85vh] flex flex-col justify-center items-center px-6 mt-10 mb-24">
        {/* Floating badge */}
        <div className="absolute top-[8%] left-[6%] md:left-[15%] -rotate-12 border-2 border-white px-5 py-2 z-20 hover:bg-white hover:text-black transition-colors duration-300 cursor-default select-none">
          <span className="font-bold text-2xl md:text-4xl leading-none uppercase tracking-tighter mix-blend-difference">
            ZK_SPLITS
          </span>
        </div>

        {/* Massive background text */}
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none z-0 overflow-hidden select-none">
          <div className="hero-text text-center w-full whitespace-nowrap">SAY HELLO TO</div>
          <div className="hero-text text-center w-full mix-blend-exclusion">ZERO-KNOWLEDGE</div>
        </div>

        {/* Central blue card */}
        <div
          className="relative z-30 w-full max-w-[320px] aspect-[3/4] bg-[#0000FF] flex flex-col justify-between p-6 shadow-2xl mt-16 md:mt-28 cursor-pointer"
          style={{ transition: 'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onClick={() => { onLaunchApp(); if (!isConnected) connectWallet(); }}
        >
          <div className="flex justify-between items-start">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
            <span className="font-mono text-[11px] text-white/70 uppercase">v1.0.0-beta</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-sm mb-1">Connect to Midnight</p>
              <p className="font-mono text-[11px] text-white/60 uppercase">Preview Network Required</p>
            </div>
            <button
              className="w-full py-3 border-2 border-white font-bold text-sm text-white uppercase tracking-widest hover:bg-white hover:text-[#0000FF] transition-colors duration-300"
              onClick={e => { e.stopPropagation(); onLaunchApp(); if (!isConnected) connectWallet(); }}
            >
              Connect Lace Wallet
            </button>
            {state.wallet.status === 'connecting' && (
              <p className="text-center font-mono text-[11px] text-white/60 uppercase animate-pulse">Connecting...</p>
            )}
            {isConnected && (
              <p className="text-center font-mono text-[11px] text-[#34d399] uppercase">✓ Connected — Click to open app</p>
            )}
          </div>
        </div>
      </section>

      {/* Features cluster */}
      <section className="relative w-full py-32 px-4 md:px-12 flex flex-col items-center border-t border-white/10">
        <div className="w-full max-w-4xl relative h-[520px] md:h-[460px]">
          <div className="feature-circle absolute top-0 left-0 md:left-[8%] w-[200px] h-[200px] md:w-[240px] md:h-[240px] p-6">
            <span className="font-mono text-[13px] text-white uppercase leading-relaxed">Private<br />Witnesses</span>
          </div>
          <div className="feature-circle absolute top-[28%] right-0 md:right-[12%] w-[170px] h-[170px] md:w-[210px] md:h-[210px] p-5">
            <span className="font-mono text-[13px] text-white uppercase leading-relaxed">Public<br />Ledger<br />Anchors</span>
          </div>
          <div className="feature-circle absolute bottom-[8%] left-[18%] md:left-[32%] w-[220px] h-[220px] md:w-[280px] md:h-[280px] p-8">
            <span className="font-bold text-base text-white uppercase leading-relaxed text-center">Zero-Knowledge<br />Proofs</span>
          </div>
          <div className="feature-circle absolute bottom-[2%] right-[18%] md:right-[28%] w-[140px] h-[140px] p-4">
            <span className="font-mono text-[11px] text-white uppercase leading-relaxed">Encrypted<br />Splits</span>
          </div>
        </div>
      </section>

      {/* Powered by */}
      <section className="w-full py-24 px-4 md:px-12 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <h3 className="font-bold text-4xl text-white uppercase w-full md:w-1/3 tracking-tight">
            Powered By
          </h3>
          <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'Midnight Network', 'Compact Lang', 'Docker Proofs',
              'TypeScript', 'React / Vite', 'Lace DApp',
            ].map(tech => (
              <div
                key={tech}
                className="border border-white/10 p-4 font-mono text-sm text-white uppercase tracking-wide hover:border-[#0000FF] transition-colors cursor-crosshair"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy stats bar */}
      <section className="w-full py-16 border-t border-b border-white/10 bg-[#0000FF]">
        <div className="max-w-5xl mx-auto px-4 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Tests Passing', value: '34' },
            { label: 'ZK Circuits', value: '3' },
            { label: 'Private Witnesses', value: '3' },
            { label: 'Network', value: 'PREVIEW' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-bold text-5xl md:text-6xl text-white">{s.value}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/70 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-32 flex flex-col items-center justify-center text-center px-4">
        <button
          onClick={() => { onLaunchApp(); }}
          className="px-12 py-6 border-4 border-white font-bold text-4xl md:text-5xl text-white uppercase hover:bg-white hover:text-black transition-all duration-300 mb-12 tracking-tight"
        >
          LAUNCH APP
        </button>
        <p className="font-mono text-[12px] text-white/30 uppercase tracking-[0.25em]">
          MIDNIGHT BUILDER PROGRAM — LEVEL 1 + 2 + 3 SUBMISSION
        </p>
      </section>

    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Transaction Scanner Link
// ────────────────────────────────────────────────────────────
const EXPLORER_BASE = 'https://indexer.preview.midnight.network/api/v1/graphql';
const CONTRACT_ADDR = 'lo1c7a6b2d657870656e73654d2fe2b3zk2025';

function ExplorerLinks({ txHash }: { txHash?: string }) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border border-white/[0.06] bg-black p-4 space-y-3">
      <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">Transaction Scanner</p>
      <div className="space-y-2">
        <a
          href={EXPLORER_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-[11px] text-[#0000FF] hover:text-white transition-colors group"
        >
          <span className="text-white/20 group-hover:text-white transition-colors">→</span>
          Preview Indexer (GraphQL)
        </a>
        <a
          href={`${EXPLORER_BASE}?query=${encodeURIComponent(`{\n  contract(address:"${CONTRACT_ADDR}") {\n    state { total_settled settlement_count is_initialized }\n  }\n}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-[11px] text-[#0000FF] hover:text-white transition-colors group"
        >
          <span className="text-white/20 group-hover:text-white transition-colors">→</span>
          Query Contract State
        </a>
        {txHash && (
          <button
            onClick={copyHash}
            className="flex items-center gap-2 font-mono text-[11px] text-[#34d399] hover:text-white transition-colors cursor-pointer w-full text-left"
          >
            <span className="text-white/20">→</span>
            {copied ? '✓ Copied!' : `Copy Tx: ${txHash.slice(0, 18)}...`}
          </button>
        )}
        <p className="font-mono text-[9px] text-white/15 pt-1">
          Contract: {CONTRACT_ADDR.slice(0, 20)}...
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// App Dashboard (APP section)
// ────────────────────────────────────────────────────────────
function AppDashboard() {
  const { state, connectWallet, connectDemo } = useApp();
  const isConnected = state.wallet.status === 'connected';
  const isDemo = state.wallet.isDemo;
  const isError = state.wallet.status === 'error';
  const isConnecting = state.wallet.status === 'connecting';
  const lastTxHash = state.settlement.lastResult?.txHash;

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-80px)]">

      {/* Demo mode banner — only when explicitly in demo */}
      {isConnected && isDemo && (
        <div className="w-full border-b border-[#fbbf24]/20 bg-[#fbbf24]/[0.04] px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[#fbbf24] uppercase tracking-widest">⚠ Demo Mode</span>
            <span className="font-mono text-[10px] text-white/35">
              ZK proof flow is real — but transactions are local only. For on-chain: install Midnight Lace, disconnect, then reconnect.
            </span>
          </div>
          <a
            href="https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-[#0000FF] hover:text-white transition-colors whitespace-nowrap uppercase tracking-widest"
          >
            Get Lace →
          </a>
        </div>
      )}

      {/* Connect wall */}
      {!isConnected && (
        <section className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="max-w-md mx-auto space-y-8">
            <div className={`w-20 h-20 mx-auto flex items-center justify-center ${isError ? 'bg-[#ef4444]/20 border border-[#ef4444]/30' : 'bg-[#0000FF]'}`}>
              {isError ? (
                <svg className="w-10 h-10 text-[#f87171]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              )}
            </div>

            <div>
              <h2 className="font-bold text-3xl text-white uppercase tracking-tight mb-3">
                {isError ? 'Wallet Not Found' : 'Connect Your Wallet'}
              </h2>

              {isError ? (
                <div className="space-y-3">
                  <div className="border border-[#f87171]/20 bg-[#ef4444]/[0.04] p-4 text-left">
                    <p className="font-mono text-[11px] text-[#f87171] leading-relaxed">
                      {state.wallet.error}
                    </p>
                  </div>
                  <div className="border border-white/[0.06] bg-black p-4 text-left space-y-1.5">
                    <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">Steps to fix:</p>
                    {[
                      '1. Click the Lace extension icon in your browser toolbar',
                      '2. Enter your wallet password to unlock it',
                      '3. Make sure Midnight (Preview) is selected, not Cardano',
                      '4. Click "Enable" if the site asks for permission',
                      '5. Click Connect Lace below',
                    ].map(s => (
                      <p key={s} className="font-mono text-[11px] text-white/50">{s}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-sm text-white/40 leading-relaxed">
                    Connect your Midnight Lace wallet on the Preview network.
                  </p>
                  <div className="border border-white/[0.06] bg-black p-3 text-left space-y-1">
                    <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1">Before connecting:</p>
                    <p className="font-mono text-[11px] text-white/40">• Unlock your Lace wallet (enter password)</p>
                    <p className="font-mono text-[11px] text-white/40">• Switch to Midnight → Preview network</p>
                    <p className="font-mono text-[11px] text-white/40">• Enable Lace for this domain if prompted</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary w-full"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : isError ? 'Retry Connect' : 'Connect Lace Wallet'}
              </button>

              {/* Demo opt-in — clearly separated */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <button
                onClick={connectDemo}
                disabled={isConnecting}
                className="w-full border border-white/10 text-white/40 font-mono text-[11px] uppercase tracking-widest py-2.5 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/60 transition-all disabled:opacity-40"
              >
                Try Demo Mode (no wallet required)
              </button>

              <a
                href="https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/"
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-[10px] text-[#0000FF] hover:text-white transition-colors uppercase tracking-widest"
              >
                Install Midnight Lace Extension →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* App UI when connected */}
      {isConnected && (
        <div className="flex-1 px-4 md:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <ExpenseDashboard />
              <PrivacyClaim />
              <PrivacyLog />
              {/* Transaction Scanner */}
              <ExplorerLinks txHash={lastTxHash} />
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-20">
                <SettleExpenseForm />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ────────────────────────────────────────────────────────────
// Root layout
// ────────────────────────────────────────────────────────────
function AppShell() {
  const [activeSection, setActiveSection] = useState<'home' | 'app'>('home');

  return (
    <div className="bg-black min-h-screen">
      <MarqueeBar position="top" />
      <MarqueeBar position="bottom" />
      <Nav activeSection={activeSection} setActiveSection={setActiveSection} />

      <main className="w-full min-h-screen pt-10 pb-10 pr-[240px]">
        {activeSection === 'home' ? (
          <LandingPage onLaunchApp={() => setActiveSection('app')} />
        ) : (
          <AppDashboard />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
