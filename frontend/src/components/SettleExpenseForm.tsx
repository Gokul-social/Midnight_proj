import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { ProofStage } from '../types';

const PROOF_STAGE_CONFIG: Record<ProofStage, { label: string; color: string; icon: string }> = {
  idle: { label: '', color: '', icon: '' },
  preparing_witness: { label: 'Preparing Private Witness...', color: 'text-private-400', icon: '🔐' },
  generating_proof: { label: 'Generating ZK Proof...', color: 'text-zk-400', icon: '⚡' },
  submitting_tx: { label: 'Submitting Transaction...', color: 'text-public-400', icon: '📡' },
  confirming: { label: 'Awaiting Confirmation...', color: 'text-public-300', icon: '⏳' },
  complete: { label: 'Settlement Complete!', color: 'text-zk-400', icon: '✅' },
  error: { label: 'Settlement Failed', color: 'text-danger-400', icon: '❌' },
};

export function SettleExpenseForm() {
  const { state, settleExpense } = useApp();
  const { wallet, settlement } = state;
  const [amount, setAmount] = useState('');

  const isConnected = wallet.status === 'connected';
  const isProcessing = settlement.proofStage !== 'idle' && settlement.proofStage !== 'complete' && settlement.proofStage !== 'error';

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    await settleExpense(BigInt(parsed));
    setAmount('');
  }, [amount, settleExpense]);

  const stageConfig = PROOF_STAGE_CONFIG[settlement.proofStage];

  return (
    <div className="glass-card-elevated p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-private-500/15 flex items-center justify-center">
          <svg className="w-4 h-4 text-private-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Settle Expense</h2>
          <p className="text-xs text-midnight-400">Your amount stays private — only the proof goes on-chain</p>
        </div>
        <span className="badge-private">
          <span className="w-1.5 h-1.5 rounded-full bg-private-400" />
          PRIVATE INPUT
        </span>
      </div>

      {/* Privacy notice */}
      <div className="rounded-xl bg-private-500/[0.06] border border-private-500/15 p-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-private-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-xs text-private-300 leading-relaxed">
          <strong className="text-private-400">Privacy guarantee:</strong> The expense amount you enter below is stored <em>only</em> on your local device as a ZK witness. It is used to generate a cryptographic proof that validates your settlement — the actual amount is <strong>never transmitted</strong> to the blockchain or any server.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="expense-amount" className="block text-sm font-medium text-midnight-200 mb-2">
            Expense Amount <span className="text-midnight-500">(micro-units)</span>
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
              className="w-full px-4 py-3 rounded-xl bg-midnight-900/80 border border-white/[0.08] text-white font-mono text-lg placeholder:text-midnight-600 focus:outline-none focus:border-private-500/50 focus:ring-1 focus:ring-private-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="badge-private text-[10px] py-0.5 px-2">
                🔒 local only
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isConnected || isProcessing || !amount || parseInt(amount) <= 0}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed bg-gradient-to-r from-zk-600 to-zk-500 text-white hover:from-zk-500 hover:to-zk-400 shadow-lg shadow-zk-500/20 hover:shadow-zk-500/30 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {isProcessing ? 'Processing...' : 'Generate ZK Proof & Settle'}
        </button>
      </form>

      {/* Proof stage indicator */}
      {settlement.proofStage !== 'idle' && (
        <div className={`rounded-xl border p-4 space-y-3 ${
          settlement.proofStage === 'error' ? 'bg-danger-500/[0.06] border-danger-500/20' :
          settlement.proofStage === 'complete' ? 'bg-zk-500/[0.06] border-zk-500/20' :
          'bg-white/[0.02] border-white/[0.06]'
        }`}>
          {/* Stage label */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{stageConfig.icon}</span>
            <span className={`text-sm font-semibold ${stageConfig.color}`}>
              {stageConfig.label}
            </span>
            {isProcessing && (
              <svg className="w-4 h-4 animate-spin text-midnight-400 ml-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-private-500 via-zk-500 to-public-500 transition-all duration-1000 animate-shimmer"
                style={{
                  width: settlement.proofStage === 'preparing_witness' ? '20%'
                    : settlement.proofStage === 'generating_proof' ? '50%'
                    : settlement.proofStage === 'submitting_tx' ? '75%'
                    : settlement.proofStage === 'confirming' ? '90%'
                    : '0%',
                }}
              />
            </div>
          )}

          {/* Success result */}
          {settlement.proofStage === 'complete' && settlement.lastResult && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-midnight-300">
                <span className="text-midnight-500">Tx Hash:</span>
                <span className="font-mono text-zk-400 truncate">{settlement.lastResult.txHash}</span>
              </div>
              <div className="flex items-center gap-4 text-midnight-300">
                <span>
                  New Total: <span className="font-mono text-white">{settlement.lastResult.newTotalSettled.toLocaleString()}</span>
                </span>
                <span>
                  Count: <span className="font-mono text-white">{settlement.lastResult.newSettlementCount.toString()}</span>
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {settlement.proofStage === 'error' && settlement.error && (
            <p className="text-xs text-danger-400">{settlement.error}</p>
          )}
        </div>
      )}

      {/* Disabled overlay */}
      {!isConnected && (
        <p className="text-center text-xs text-midnight-500 pt-2">
          Connect your Lace wallet to settle expenses
        </p>
      )}
    </div>
  );
}
