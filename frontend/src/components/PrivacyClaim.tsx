/**
 * PrivacyClaim — Visual demonstration of Midnight's privacy architecture.
 *
 * This component renders a side-by-side comparison showing exactly:
 *   LEFT:  What is PRIVATE (witness data — stays on user's device)
 *   RIGHT: What is PUBLIC (proof + ledger delta — goes on-chain)
 *
 * It updates in real-time during settlement to show the data flow.
 */

import { useApp } from '../context/AppContext';

export function PrivacyClaim() {
  const { state } = useApp();
  const { settlement, ledger, wallet } = state;
  const isConnected = wallet.status === 'connected';
  const isProcessing =
    settlement.proofStage !== 'idle' &&
    settlement.proofStage !== 'complete' &&
    settlement.proofStage !== 'error';

  if (!isConnected) return null;

  return (
    <div className="glass-card-elevated p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-private-500/20 to-public-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Privacy Claim</h2>
          <p className="text-xs text-midnight-400">What stays private vs. what goes on-chain — in real-time</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Private (Witness) */}
        <div className="rounded-xl border border-private-500/20 bg-private-500/[0.04] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge-private">
              <span className="w-1.5 h-1.5 rounded-full bg-private-400" />
              PRIVATE — Your Device Only
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-private-400 text-lg mt-0.5">🔒</span>
              <div>
                <p className="font-semibold text-private-300">Expense Amount</p>
                <p className="text-xs text-midnight-400 mt-0.5">
                  The exact amount you enter — stored only in local memory as a ZK witness.
                  {isProcessing && (
                    <span className="text-private-400 font-semibold"> Currently in local state...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-private-400 text-lg mt-0.5">🔑</span>
              <div>
                <p className="font-semibold text-private-300">Member Secret</p>
                <p className="text-xs text-midnight-400 mt-0.5">
                  Your 32-byte group membership key — proves you're a valid member without revealing identity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-private-400 text-lg mt-0.5">📋</span>
              <div>
                <p className="font-semibold text-private-300">Group Contributions</p>
                <p className="text-xs text-midnight-400 mt-0.5">
                  Individual expense splits (4-element vector) — used in batch settlement without revealing any single share.
                </p>
              </div>
            </div>
          </div>

          {/* Data flow indicator */}
          <div className="rounded-lg bg-private-500/[0.08] border border-private-500/10 p-3 text-center">
            <p className="text-[11px] text-private-300 font-medium">
              ⛔ NEVER transmitted to network, indexer, or blockchain
            </p>
          </div>
        </div>

        {/* RIGHT: Public (On-Chain) */}
        <div className="rounded-xl border border-public-500/20 bg-public-500/[0.04] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge-public">
              <span className="w-1.5 h-1.5 rounded-full bg-public-400" />
              PUBLIC — On-Chain State
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-public-400 text-lg mt-0.5">📊</span>
              <div>
                <p className="font-semibold text-public-300">total_settled</p>
                <p className="text-xs text-midnight-400 mt-0.5">
                  Aggregate sum of all verified settlements:{' '}
                  <span className="font-mono text-public-400">
                    {ledger.total_settled.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-public-400 text-lg mt-0.5">#️⃣</span>
              <div>
                <p className="font-semibold text-public-300">settlement_count</p>
                <p className="text-xs text-midnight-400 mt-0.5">
                  Number of verified settlements:{' '}
                  <span className="font-mono text-public-400">
                    {ledger.settlement_count.toString()}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-public-400 text-lg mt-0.5">🔗</span>
              <div>
                <p className="font-semibold text-public-300">group_debt_hash</p>
                <p className="text-xs text-midnight-400 mt-0.5">
                  Commitment to group terms:{' '}
                  <span className="font-mono text-public-400 text-[10px]">
                    {ledger.group_debt_hash || '—'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ZK Proof flow indicator */}
          <div className="rounded-lg bg-zk-500/[0.08] border border-zk-500/10 p-3 text-center">
            <p className="text-[11px] text-zk-300 font-medium">
              ✅ Only ZK proofs + computed aggregates reach the blockchain
            </p>
          </div>
        </div>
      </div>

      {/* Data flow diagram */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
        <p className="text-[11px] text-midnight-400 text-center leading-relaxed">
          <span className="text-private-400 font-semibold">Private Witness</span>
          <span className="mx-2 text-midnight-600">→</span>
          <span className="text-zk-400 font-semibold">ZK Proof (local)</span>
          <span className="mx-2 text-midnight-600">→</span>
          <span className="text-public-400 font-semibold">Public Ledger (on-chain)</span>
        </p>
        <p className="text-[10px] text-midnight-600 text-center mt-1">
          The <code className="text-private-400">disclose()</code> function in Compact enforces this boundary at compile time
        </p>
      </div>

      {/* Live stage indicator during settlement */}
      {isProcessing && (
        <div className="rounded-xl border-2 border-dashed border-zk-500/30 bg-zk-500/[0.04] p-4 animate-proof-pulse">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 animate-spin text-zk-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-zk-400">ZK Settlement in Progress</p>
              <p className="text-xs text-midnight-400 mt-0.5">
                {settlement.proofStage === 'preparing_witness' && 'Storing expense amount in local private state...'}
                {settlement.proofStage === 'generating_proof' && 'Proof server computing ZK proof — your amount is NOT sent anywhere...'}
                {settlement.proofStage === 'submitting_tx' && 'Submitting ONLY the proof to Midnight Preprod...'}
                {settlement.proofStage === 'confirming' && 'Waiting for network confirmation...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
