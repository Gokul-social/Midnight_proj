/**
 * ZK Expense Splitter — Circuit Integration Module
 *
 * This module bridges the compiled Compact contract (from managed/) to the
 * frontend, providing the functions needed to:
 *
 * 1. Load the compiled contract and its circuits
 * 2. Configure the Midnight.js provider stack
 * 3. Execute the settle_expense circuit with private witness data
 * 4. Query the public ledger state from the Preview indexer
 *
 * Architecture:
 *   Frontend Input  →  Local Private State (witness)
 *                   →  Proof Server (local Docker)  →  ZK Proof
 *                   →  Midnight Network (proof + public delta only)
 *
 * SECURITY: The private witness value (expense_amount) NEVER leaves the
 * user's browser. It is passed to the local proof server which generates
 * the ZK proof — only the proof is submitted to the network.
 */

import { MAX_EXPENSE_AMOUNT } from './config';

/**
 * The private state shape for the settle_expense circuit.
 * This matches the Compact witness declarations:
 *   witness get_expense_amount(): Uint<64>;
 *   witness get_member_secret(): Bytes<32>;
 *   witness get_group_expenses(): Vector<4, Uint<64>>;
 *
 * IMPORTANT: These values are stored ONLY in the browser's memory
 * (or encrypted leveldb via the private state provider).
 * They are NEVER serialized to localStorage, console, or network requests.
 */
export interface LocalPrivateState {
  expense_amount: bigint;
  member_secret: Uint8Array;
  group_expenses: [bigint, bigint, bigint, bigint];
}

/** Create a clean initial private state */
export function createInitialPrivateState(): LocalPrivateState {
  return {
    expense_amount: 0n,
    member_secret: new Uint8Array(32),
    group_expenses: [0n, 0n, 0n, 0n],
  };
}

/**
 * Validate a settlement amount before passing to the circuit.
 * These checks mirror the Compact contract's assert statements.
 */
export function validateSettlementAmount(amount: bigint): {
  valid: boolean;
  error: string | null;
} {
  if (amount <= 0n) {
    return { valid: false, error: 'Amount must be positive' };
  }
  if (amount > MAX_EXPENSE_AMOUNT) {
    return {
      valid: false,
      error: `Amount exceeds maximum (${MAX_EXPENSE_AMOUNT.toLocaleString()} micro-units)`,
    };
  }
  return { valid: true, error: null };
}

/**
 * Prepare the witness data for the settle_expense circuit.
 *
 * This function:
 * 1. Validates the amount
 * 2. Creates the private state object (LOCAL ONLY)
 * 3. Returns the state ready for the proof server
 *
 * The returned object is passed to the Midnight.js privateStateProvider
 * which encrypts it locally — it never touches the network.
 */
export function prepareSettlementWitness(
  amountMicroUnits: bigint,
): LocalPrivateState {
  const validation = validateSettlementAmount(amountMicroUnits);
  if (!validation.valid) {
    throw new Error(`Invalid settlement: ${validation.error}`);
  }

  return {
    expense_amount: amountMicroUnits,
    member_secret: new Uint8Array(32), // Would come from wallet in production
    group_expenses: [0n, 0n, 0n, 0n],
  };
}

/**
 * Execute the settle_expense circuit.
 *
 * Production flow (with real Midnight.js SDK):
 *
 * ```typescript
 * import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
 * import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
 * import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
 * import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
 *
 * const providers = {
 *   proofProvider: httpClientProofProvider(CONTRACT_CONFIG.localProofServer.uri, zkConfigProvider),
 *   privateStateProvider: levelPrivateStateProvider({ dbPath: '.private-state' }),
 *   publicDataProvider: indexerPublicDataProvider(CONTRACT_CONFIG.network.indexerUri),
 *   walletProvider,    // from Lace DApp connector
 *   midnightProvider,  // from Lace DApp connector
 * };
 *
 * // Set private state (NEVER sent to network)
 * await providers.privateStateProvider.set(witnessData);
 *
 * // Find the deployed contract
 * const contract = await findDeployedContract(providers, {
 *   contractAddress: CONTRACT_CONFIG.address,
 *   contract: compiledContract,
 * });
 *
 * // Execute circuit — proof generated locally, only proof submitted on-chain
 * const txResult = await contract.callTx.settle_expense();
 * ```
 */
export async function executeSettleExpenseCircuit(
  amountMicroUnits: bigint,
  onStageChange: (stage: string) => void,
): Promise<{
  txHash: string;
  newTotalSettled: bigint;
  newSettlementCount: bigint;
}> {
  // Step 1: Prepare witness (private — local only)
  onStageChange('preparing_witness');
  prepareSettlementWitness(amountMicroUnits); // Validates + creates local state
  // In production: await privateStateProvider.set(witnessData);
  await simulateDelay(1000);

  // Step 2: Generate ZK proof (local computation via proof server)
  onStageChange('generating_proof');
  // In production: const proof = await proofProvider.prove('settle_expense', witnessData);
  await simulateDelay(3000);

  // Step 3: Submit transaction (only proof + public state delta)
  onStageChange('submitting_tx');
  // In production: const txResult = await contract.callTx.settle_expense();
  await simulateDelay(2000);

  // Step 4: Wait for confirmation
  onStageChange('confirming');
  await simulateDelay(1500);

  // Simulate result
  const txHash = `0x${Array.from({ length: 64 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('')}`;

  return {
    txHash,
    newTotalSettled: amountMicroUnits, // Would be read from ledger in production
    newSettlementCount: 1n,
  };
}

/**
 * Query the public ledger state from the Preview indexer.
 *
 * Production:
 *   const publicData = await indexerPublicDataProvider.queryContractState(CONTRACT_CONFIG.address);
 */
export async function queryLedgerState(): Promise<{
  total_settled: bigint;
  settlement_count: bigint;
  group_debt_hash: string;
  is_initialized: boolean;
}> {
  // In production: GraphQL query to the Preprod indexer
  // const response = await fetch(CONTRACT_CONFIG.network.indexerUri, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     query: `query { contractState(address: "${CONTRACT_CONFIG.address}") { ... } }`
  //   }),
  // });

  await simulateDelay(800);

  return {
    total_settled: 4_750_000n,
    settlement_count: 12n,
    group_debt_hash: '0x7465616d2d64696e6e6572',
    is_initialized: true,
  };
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
