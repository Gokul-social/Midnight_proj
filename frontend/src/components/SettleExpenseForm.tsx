import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { ProofStage } from '../types';

const STAGE_LABELS: Record<ProofStage, string> = {
  idle: '',
  preparing_witness: 'Preparing Private Witness...',
  generating_proof: 'Generating ZK Proof...',
  submitting_tx: 'Submitting to Midnight Preview...',
  confirming: 'Awaiting Confirmation...',
  complete: 'Settlement Complete',
  error: 'Settlement Failed',
};

const STAGE_PROGRESS: Record<ProofStage, number> = {
  idle: 0, preparing_witness: 20, generating_proof: 55,
  submitting_tx: 78, confirming: 92, complete: 100, error: 0,
};

const STAGE_COLOR: Record<ProofStage, string> = {
  idle: '', preparing_witness: '#fbbf24', generating_proof: '#34d399',
  submitting_tx: '#0000FF', confirming: '#6060ff', complete: '#10b981', error: '#ef4444',
};

export function SettleExpenseForm() {
  const { state, settleExpense } = useApp();
  const { wallet, settlement } = state;
  const [amount, setAmount] = useState('');

  const isConnected = wallet.status === 'connected';
  const isDemo = wallet.isDemo;
  const isProcessing = settlement.proofStage !== 'idle' && settlement.proofStage !== 'complete' && settlement.proofStage !== 'error';
  const parsedAmount = parseInt(amount, 10);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid) return;
    await settleExpense(BigInt(parsedAmount));
    setAmount('');
  }, [amount, settleExpense, isAmountValid, parsedAmount]);

  return (
    <div className="border border-white/10 bg-[#111111] hover:border-[#0000FF]/30 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white uppercase tracking-wide text-sm">Settle Expense</h2>
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Your amount stays private — only the proof goes on-chain</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="font-mono text-[9px] text-[#fbbf24]/60 border border-[#fbbf24]/20 px-2 py-1 uppercase tracking-widest">
              DEMO
            </span>
          )}
          <span className="badge-private">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
            PRIVATE INPUT
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Privacy notice */}
        <div className="border border-[#fbbf24]/15 bg-[#fbbf24]/[0.04] p-4 flex items-start gap-3">
          <svg className="w-4 h-4 text-[#fbbf24] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="font-mono text-[11px] text-[#fbbf24]/80 leading-relaxed">
            <span className="text-[#fbbf24] font-bold">Privacy guarantee:</span> The expense amount you enter below is stored <em>only</em> on your local device as a ZK witness. It is used to generate a cryptographic proof that validates your settlement — the actual amount is <span className="font-bold text-[#fbbf24]">never transmitted</span> to the blockchain or any server.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expense-amount" className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-widest">
                Expense Amount <span className="text-white/20">(micro-units)</span>
              </span>
              {isConnected && !isAmountValid && amount === '' && (
                <span className="font-mono text-[10px] text-[#0000FF] uppercase tracking-widest animate-pulse">
                  ← Enter an amount to continue
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="expense-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                disabled={!isConnected || isProcessing}
                min="1"
                max="1000000000"
                autoFocus={isConnected}
                className="input-dark pr-28 disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="badge-private text-[9px] py-0.5 px-2">🔒 local only</span>
              </div>
            </div>

            {/* Quick amounts */}
            {isConnected && !isProcessing && (
              <div className="flex gap-2 mt-2">
                {[10000, 50000, 100000, 500000].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className="font-mono text-[10px] text-white/30 border border-white/10 px-2 py-1 hover:border-[#0000FF]/40 hover:text-white/60 transition-all cursor-pointer uppercase tracking-widest"
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-3 border border-white/[0.06] bg-black">
              <p className="font-mono text-[11px] text-white/25 uppercase tracking-widest">
                Connect your Lace wallet first
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isProcessing || !isAmountValid}
              className="btn-primary w-full"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing ZK Proof...
                </span>
              ) : !isAmountValid ? (
                'Enter an amount above to generate proof'
              ) : (
                `Generate ZK Proof & Settle ${parsedAmount.toLocaleString()} micro-units`
              )}
            </button>
          )}
        </form>

        {/* Proof stage indicator */}
        {settlement.proofStage !== 'idle' && (
          <div
            className="border p-4 space-y-3"
            style={{
              borderColor: settlement.proofStage === 'error' ? 'rgba(239,68,68,0.3)'
                : settlement.proofStage === 'complete' ? 'rgba(16,185,129,0.3)'
                : 'rgba(255,255,255,0.1)',
              background: settlement.proofStage === 'error' ? 'rgba(239,68,68,0.04)'
                : settlement.proofStage === 'complete' ? 'rgba(16,185,129,0.04)'
                : 'rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: STAGE_COLOR[settlement.proofStage] }}>
                {settlement.proofStage === 'complete' ? '✓' : settlement.proofStage === 'error' ? '✕' : '◈'}
              </span>
              <span
                className="font-mono text-xs font-bold uppercase tracking-widest"
                style={{ color: STAGE_COLOR[settlement.proofStage] }}
              >
                {STAGE_LABELS[settlement.proofStage]}
              </span>
              {isProcessing && (
                <svg className="w-3 h-3 animate-spin text-white/30 ml-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>

            {/* Progress bar */}
            {settlement.proofStage !== 'error' && (
              <div className="w-full h-0.5 bg-white/[0.06]">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${STAGE_PROGRESS[settlement.proofStage]}%`,
                    background: STAGE_COLOR[settlement.proofStage],
                  }}
                />
              </div>
            )}

            {/* Success result */}
            {settlement.proofStage === 'complete' && settlement.lastResult && (
              <div className="space-y-1.5">
                <div className="font-mono text-[10px] text-white/40">
                  Tx: <span className="text-[#34d399] truncate">{settlement.lastResult.txHash.slice(0, 24)}...</span>
                </div>
                <div className="font-mono text-[10px] text-white/40 flex gap-4">
                  <span>Total: <span className="text-white/70">{settlement.lastResult.newTotalSettled.toLocaleString()}</span></span>
                  <span>Count: <span className="text-white/70">{settlement.lastResult.newSettlementCount.toString()}</span></span>
                </div>
                <div className="font-mono text-[10px] text-[#10b981]/60 uppercase tracking-widest">
                  ✓ Amount kept private — only proof submitted on-chain
                </div>

              </div>
            )}

            {settlement.proofStage === 'error' && settlement.error && (() => {
              const isProofServerError = settlement.error.includes('Proof server not running');
              if (isProofServerError) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[#f87171] text-lg leading-none mt-0.5">⚠</span>
                      <p className="font-mono text-[11px] text-[#f87171] leading-relaxed">
                        Proof server not running — required for real ZK transactions.
                      </p>
                    </div>
                    <div className="border border-white/[0.06] bg-[#0a0a0a] p-3 space-y-2">
                      <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">Step 1 — Start proof server (Docker):</p>
                      <code className="block font-mono text-[10px] text-[#34d399] bg-black/60 px-2 py-1.5 rounded">
                        docker run -d -p 6300:6300 midnightntwrk/proof-server:latest
                      </code>
                      <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mt-2">Step 2 — Run app locally:</p>
                      <code className="block font-mono text-[10px] text-[#60a5fa] bg-black/60 px-2 py-1.5 rounded">
                        cd frontend && npm run dev
                      </code>
                      <p className="font-mono text-[9px] text-white/20 mt-2 leading-relaxed">
                        The deployed Vercel version connects your wallet but cannot generate ZK proofs — this is a Midnight architectural requirement. Proofs are computed on your device, not the server.
                      </p>
                    </div>
                  </div>
                );
              }
              return <p className="font-mono text-[11px] text-[#f87171] leading-relaxed">{settlement.error}</p>;
            })()}

          </div>
        )}
      </div>
    </div>
  );
}
