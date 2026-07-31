/**
 * Shared types for the ZK Expense Splitter frontend.
 */

/** Wallet connection states */
export type WalletStatus =
  | 'checking'
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error';

/** Public ledger state from the contract */
export interface LedgerState {
  total_settled: bigint;
  settlement_count: bigint;
  group_debt_hash: string;
  is_initialized: boolean;
}

/** Connected wallet info */
export interface WalletInfo {
  address: string;
  network: string;
  balance?: string;
}

/** Settlement transaction result */
export interface SettlementResult {
  txHash: string;
  newTotalSettled: bigint;
  newSettlementCount: bigint;
  timestamp: number;
}

/** Privacy log entry — tracks what's private vs public */
export interface PrivacyLogEntry {
  id: string;
  timestamp: number;
  type: 'private_input' | 'zk_proof' | 'public_update' | 'tx_submitted';
  label: string;
  detail: string;
  isPrivate: boolean;
}

/** Settlement form state */
export interface SettlementFormState {
  amount: string;
  isSubmitting: boolean;
  proofStage: ProofStage;
  error: string | null;
}

export type ProofStage =
  | 'idle'
  | 'preparing_witness'
  | 'generating_proof'
  | 'submitting_tx'
  | 'confirming'
  | 'complete'
  | 'error';
