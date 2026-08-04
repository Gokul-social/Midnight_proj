/**
 * PrivacyClaim — Visual demonstration of Midnight's privacy architecture.
 * Shows exactly what's private (witness) vs. public (on-chain) in real-time.
 * Redesigned with Electric Blue × Black theme.
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
    <div className="border border-white/10 bg-[#111111] hover:border-[#0000FF]/30 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.08]">
        <div className="w-7 h-7 border border-white/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-white uppercase tracking-wide text-sm">Privacy Claim</h2>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">What stays private vs. what goes on-chain — in real-time</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* LEFT: Private */}
          <div className="border border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] p-4 space-y-4">
            <span className="badge-private">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
              PRIVATE — Your Device Only
            </span>

            <div className="space-y-4">
              {[
                {
                  icon: '🔒',
                  title: 'Expense Amount',
                  desc: 'The exact amount you enter — stored only in local memory as a ZK witness.',
                  extra: isProcessing ? ' Currently in local state...' : undefined,
                },
                {
                  icon: '🔑',
                  title: 'Member Secret',
                  desc: "Your 32-byte group membership key — proves you're a valid member without revealing identity.",
                },
                {
                  icon: '📋',
                  title: 'Group Contributions',
                  desc: 'Individual expense splits (4-element vector) — used in batch settlement without revealing any single share.',
                },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-bold text-[#fbbf24] text-xs uppercase tracking-wide">{item.title}</p>
                    <p className="font-mono text-[11px] text-white/40 mt-0.5 leading-relaxed">
                      {item.desc}
                      {item.extra && <span className="text-[#fbbf24]">{item.extra}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-[#fbbf24]/10 bg-[#fbbf24]/[0.04] p-2 text-center">
              <p className="font-mono text-[10px] text-[#fbbf24]/70 uppercase tracking-widest">
                ⛔ NEVER transmitted to network or blockchain
              </p>
            </div>
          </div>

          {/* RIGHT: Public */}
          <div className="border border-[#0000FF]/20 bg-[#0000FF]/[0.04] p-4 space-y-4">
            <span className="badge-public">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4040ff]" />
              PUBLIC — On-Chain State
            </span>

            <div className="space-y-4">
              {[
                {
                  icon: '📊',
                  title: 'total_settled',
                  value: ledger.total_settled.toLocaleString(),
                  desc: 'Aggregate sum of all verified settlements:',
                },
                {
                  icon: '#️⃣',
                  title: 'settlement_count',
                  value: ledger.settlement_count.toString(),
                  desc: 'Number of verified settlements:',
                },
                {
                  icon: '🔗',
                  title: 'group_debt_hash',
                  value: ledger.group_debt_hash || '—',
                  desc: 'Commitment to group terms:',
                  mono: true,
                },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-bold text-[#6060ff] text-xs uppercase tracking-wide">{item.title}</p>
                    <p className="font-mono text-[11px] text-white/40 mt-0.5">
                      {item.desc}{' '}
                      <span className={`text-[#6060ff] ${item.mono ? 'text-[9px] break-all' : ''}`}>{item.value}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-[#10b981]/10 bg-[#10b981]/[0.04] p-2 text-center">
              <p className="font-mono text-[10px] text-[#34d399]/70 uppercase tracking-widest">
                ✅ Only ZK proofs + computed aggregates reach the blockchain
              </p>
            </div>
          </div>
        </div>

        {/* Data flow bar */}
        <div className="border border-white/[0.06] bg-black p-3 flex items-center justify-center gap-3 flex-wrap">
          <span className="font-mono text-[11px] font-bold text-[#fbbf24] uppercase tracking-wider">Private Witness</span>
          <span className="text-white/20 text-xs">→</span>
          <span className="font-mono text-[11px] font-bold text-[#34d399] uppercase tracking-wider">ZK Proof (local)</span>
          <span className="text-white/20 text-xs">→</span>
          <span className="font-mono text-[11px] font-bold text-[#6060ff] uppercase tracking-wider">Public Ledger (on-chain)</span>
        </div>
        <p className="font-mono text-[10px] text-white/20 text-center">
          The <code className="text-[#fbbf24]/60">disclose()</code> function in Compact enforces this boundary at compile time
        </p>

        {/* Live processing indicator */}
        {isProcessing && (
          <div className="border-2 border-dashed border-[#34d399]/30 bg-[#10b981]/[0.04] p-4 animate-proof-pulse">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 animate-spin text-[#34d399]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="font-bold text-[#34d399] uppercase text-xs tracking-widest">ZK Settlement in Progress</p>
                <p className="font-mono text-[11px] text-white/40 mt-0.5">
                  {settlement.proofStage === 'preparing_witness' && 'Storing expense amount in local private state...'}
                  {settlement.proofStage === 'generating_proof' && 'Proof server computing ZK proof — your amount is NOT sent anywhere...'}
                  {settlement.proofStage === 'submitting_tx' && 'Submitting ONLY the proof to Midnight Preview...'}
                  {settlement.proofStage === 'confirming' && 'Waiting for network confirmation...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
