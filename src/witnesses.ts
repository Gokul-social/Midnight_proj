/**
 * ZK Expense Splitter — Private Witness Implementations
 *
 * This module provides the TypeScript implementations for all witness functions
 * declared in the Compact contract. Witnesses are the "private data providers"
 * for the ZK circuits — they run locally on the user's machine and their outputs
 * are NEVER transmitted to the blockchain.
 *
 * Architecture:
 *   Compact declares:  witness get_expense_amount(): Uint<64>;
 *   TypeScript provides: the actual implementation below
 *   Midnight SDK:       wires them together via the provider pattern
 *
 * Security Note: In a production dApp, these values would come from:
 *   - Encrypted local storage (leveldb with user key)
 *   - User-facing input forms in the DApp UI
 *   - Hardware wallet signatures
 *   They are NEVER sent to any server or stored on-chain.
 */

/**
 * The shape of private state managed locally per user.
 * This is stored in the level-private-state-provider (encrypted leveldb).
 */
export interface ExpenseSplitterPrivateState {
  /** The user's current expense amount to settle (set before calling settle_expense) */
  expense_amount: bigint;
  /** A 32-byte secret that proves group membership without revealing identity */
  member_secret: Uint8Array;
  /** Four private expense contributions for the current batch round */
  group_expenses: [bigint, bigint, bigint, bigint];
}

/**
 * Default empty private state for contract initialization.
 */
export const createInitialPrivateState = (): ExpenseSplitterPrivateState => ({
  expense_amount: 0n,
  member_secret: new Uint8Array(32),
  group_expenses: [0n, 0n, 0n, 0n],
});

/**
 * Witness implementations keyed by their Compact function names.
 *
 * These are passed to the Midnight.js provider when creating a contract instance.
 * The SDK calls these functions when executing the ZK circuits that reference
 * the corresponding `witness` declarations in the Compact contract.
 */
export const createWitnesses = (privateState: ExpenseSplitterPrivateState) => ({
  /**
   * Maps to: `witness get_expense_amount(): Uint<64>;`
   *
   * Returns the private expense amount for a single settlement.
   * This value is used inside the settle_expense() circuit but
   * never appears in the resulting ZK proof or on-chain transaction.
   */
  get_expense_amount: (): bigint => {
    const amount = privateState.expense_amount;
    if (amount <= 0n) {
      throw new Error('[Witness] expense_amount must be positive');
    }
    if (amount > 1_000_000_000n) {
      throw new Error('[Witness] expense_amount exceeds maximum allowed (1,000,000,000)');
    }
    return amount;
  },

  /**
   * Maps to: `witness get_member_secret(): Bytes<32>;`
   *
   * Returns the 32-byte group membership secret.
   * This proves the caller is a valid group member without revealing their identity.
   * The secret is kept entirely in local encrypted storage — never disclosed.
   */
  get_member_secret: (): Uint8Array => {
    const secret = privateState.member_secret;
    if (secret.length !== 32) {
      throw new Error('[Witness] member_secret must be exactly 32 bytes');
    }
    return secret;
  },

  /**
   * Maps to: `witness get_group_expenses(): Vector<4, Uint<64>>;`
   *
   * Returns the 4-element array of private individual expense contributions.
   * Used in batch_settle() to prove the group collectively covered a minimum
   * threshold — without revealing any single member's contribution.
   */
  get_group_expenses: (): [bigint, bigint, bigint, bigint] => {
    const expenses = privateState.group_expenses;
    for (let i = 0; i < 4; i++) {
      const e = expenses[i];
      if (e === undefined) throw new Error(`[Witness] group_expenses[${i}] is undefined`);
      if (e < 0n) throw new Error(`[Witness] group_expenses[${i}] must be non-negative`);
    }
    return expenses;
  },
});

/**
 * Helper: derive a deterministic group debt hash from a group identifier string.
 * In production, this would use a cryptographic hash function (e.g., SHA-256).
 * Here we use a simple encoding for demonstration.
 */
export const deriveGroupDebtHash = (groupId: string): Uint8Array => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(groupId.padEnd(32, '\0').slice(0, 32));
  const hash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hash[i] = encoded[i] ?? 0;
  }
  return hash;
};
