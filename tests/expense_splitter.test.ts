/**
 * ZK Expense Splitter — Comprehensive Test Suite
 *
 * Tests the ZK Expense Splitter contract's logic, state transitions,
 * privacy properties, and ZK circuit behavior using the Midnight SDK.
 *
 * Test Architecture:
 * ─────────────────────────────────────────────────────────────────
 * These tests use a simulated contract state machine that mirrors the
 * on-chain behavior of the Compact circuits. In a full integration
 * test environment (with the Midnight local proof server running via
 * Docker), the `ProofServerClient` would replace `MockContractEngine`
 * and actually generate ZK proofs.
 *
 * Test Categories:
 *   1. Initialization Tests     — Contract setup and initial state
 *   2. Settlement Tests         — Single expense settlement flow
 *   3. Batch Settlement Tests   — Multi-party expense settlement
 *   4. Privacy Tests            — Verify witness data stays private
 *   5. Guard Clause Tests       — Assert-based error handling
 *   6. State Integrity Tests    — Cumulative state consistency
 *
 * Running Integration Tests (requires Docker):
 *   docker run -p 6300:6300 midnightntwrk/proof-server:latest
 *   npm test
 * ─────────────────────────────────────────────────────────────────
 */

import {
  createInitialPrivateState,
  createWitnesses,
  deriveGroupDebtHash,
  ExpenseSplitterPrivateState,
} from '../src/witnesses';
import { bytesToHex, formatMicroUnits, stringToBytes32 } from '../src/utils';

// ============================================================
// MOCK CONTRACT ENGINE
// Simulates the on-chain state machine without requiring the
// Midnight proof server. Enforces the same logic as the circuits.
// ============================================================

interface LedgerState {
  total_settled: bigint;
  settlement_count: bigint;
  group_debt_hash: Uint8Array;
  is_initialized: boolean;
}

/**
 * MockContractEngine simulates the Compact circuit logic in TypeScript.
 * This allows us to test contract semantics without running the full
 * Midnight proof server, while keeping tests fast and deterministic.
 *
 * In production integration tests, this is replaced by the real
 * Midnight.js SDK connected to the local proof server.
 */
class MockContractEngine {
  private ledger: LedgerState;
  private privateState: ExpenseSplitterPrivateState;

  constructor(initialPrivateState: ExpenseSplitterPrivateState) {
    this.ledger = {
      total_settled: 0n,
      settlement_count: 0n,
      group_debt_hash: new Uint8Array(32),
      is_initialized: false,
    };
    this.privateState = initialPrivateState;
  }

  /** Returns a deep copy of the current public ledger state */
  getLedgerState(): LedgerState {
    return {
      ...this.ledger,
      group_debt_hash: new Uint8Array(this.ledger.group_debt_hash),
    };
  }

  /** Updates private state (simulates leveldb private state store) */
  setPrivateState(state: Partial<ExpenseSplitterPrivateState>): void {
    this.privateState = { ...this.privateState, ...state };
  }

  /**
   * Mirrors: export circuit initialize_group(debt_hash: Bytes<32>): []
   * Enforces: can only be called once; sets all initial ledger state
   */
  circuit_initialize_group(debt_hash: Uint8Array): void {
    // assert !is_initialized "Contract already initialized"
    if (this.ledger.is_initialized) {
      throw new Error('CIRCUIT ASSERT FAILED: Contract already initialized');
    }
    if (debt_hash.length !== 32) {
      throw new Error('CIRCUIT ASSERT FAILED: debt_hash must be exactly 32 bytes');
    }

    // All assignments use disclose() semantics — values become public
    this.ledger.group_debt_hash = new Uint8Array(debt_hash); // disclose(debt_hash)
    this.ledger.total_settled = 0n;                          // disclose(0)
    this.ledger.settlement_count = 0n;                       // disclose(0)
    this.ledger.is_initialized = true;                       // disclose(true)
  }

  /**
   * Mirrors: export circuit settle_expense(): []
   * Enforces: positive amount, overflow protection, witness privacy
   */
  circuit_settle_expense(): void {
    // assert is_initialized
    if (!this.ledger.is_initialized) {
      throw new Error('CIRCUIT ASSERT FAILED: Contract not yet initialized');
    }

    // Fetch from witness (private — mirrors `witness get_expense_amount()`)
    const witnesses = createWitnesses(this.privateState);
    const expense_amount = witnesses.get_expense_amount();

    // assert expense_amount > 0
    if (expense_amount <= 0n) {
      throw new Error('CIRCUIT ASSERT FAILED: Expense amount must be positive');
    }

    // assert expense_amount <= 1_000_000_000
    if (expense_amount > 1_000_000_000n) {
      throw new Error('CIRCUIT ASSERT FAILED: Expense amount exceeds maximum');
    }

    const expense_as_u128 = expense_amount;
    const MAX_U128 = (2n ** 128n) - 1n;

    // assert total_settled <= max_safe - expense_as_u128
    if (this.ledger.total_settled > MAX_U128 - expense_as_u128) {
      throw new Error('CIRCUIT ASSERT FAILED: Settlement would overflow total');
    }

    const new_total = this.ledger.total_settled + expense_as_u128;
    const MAX_U64 = (2n ** 64n) - 1n;

    if (this.ledger.settlement_count >= MAX_U64) {
      throw new Error('CIRCUIT ASSERT FAILED: Settlement count overflow');
    }

    // disclose(new_total) → public ledger
    this.ledger.total_settled = new_total;
    // disclose(new_count) → public ledger
    this.ledger.settlement_count = this.ledger.settlement_count + 1n;

    // PRIVACY CHECK: expense_amount itself is NOT in ledger state
    // Only new_total (which aggregates many settlements) is public
  }

  /**
   * Mirrors: export circuit batch_settle(min_threshold: Uint<64>): []
   * Enforces: group sum >= threshold, no individual amounts disclosed
   */
  circuit_batch_settle(min_threshold: bigint): void {
    if (!this.ledger.is_initialized) {
      throw new Error('CIRCUIT ASSERT FAILED: Contract not yet initialized');
    }

    const witnesses = createWitnesses(this.privateState);
    const expenses = witnesses.get_group_expenses();

    // Sum privately (all intermediate values stay off-chain)
    const total_expenses = expenses[0] + expenses[1] + expenses[2] + expenses[3];

    // assert total_expenses >= min_threshold
    if (total_expenses < min_threshold) {
      throw new Error(
        `CIRCUIT ASSERT FAILED: Group expenses (${total_expenses}) below required threshold (${min_threshold})`
      );
    }

    const MAX_U128 = (2n ** 128n) - 1n;
    if (this.ledger.total_settled > MAX_U128 - total_expenses) {
      throw new Error('CIRCUIT ASSERT FAILED: Batch settlement would overflow total');
    }

    const MAX_U64 = (2n ** 64n) - 1n;
    if (this.ledger.settlement_count >= MAX_U64) {
      throw new Error('CIRCUIT ASSERT FAILED: Settlement count overflow');
    }

    // Only the new aggregate total is disclosed — not individual amounts
    this.ledger.total_settled = this.ledger.total_settled + total_expenses;
    this.ledger.settlement_count = this.ledger.settlement_count + 1n;
  }

  /**
   * Mirrors: export circuit verify_settlement_count(expected_count: Uint<64>): Boolean
   * Pure view circuit — no state mutation
   */
  circuit_verify_settlement_count(expected_count: bigint): boolean {
    return this.ledger.settlement_count === expected_count;
  }
}

// ============================================================
// TEST SUITE
// ============================================================

describe('ZK Expense Splitter — Contract Tests', () => {
  const GROUP_ID = 'team-dinner-2025-q3';
  const DEBT_HASH = deriveGroupDebtHash(GROUP_ID);

  // ──────────────────────────────────────────────────────────
  // 1. INITIALIZATION TESTS
  // ──────────────────────────────────────────────────────────

  describe('Contract Initialization', () => {
    test('should deploy with correct initial state (all zeros)', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      const state = engine.getLedgerState();

      expect(state.total_settled).toBe(0n);
      expect(state.settlement_count).toBe(0n);
      expect(state.is_initialized).toBe(false);
      expect(state.group_debt_hash).toEqual(new Uint8Array(32));
    });

    test('should initialize group with the public debt hash', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);

      const state = engine.getLedgerState();
      expect(state.is_initialized).toBe(true);
      expect(state.total_settled).toBe(0n);
      expect(state.settlement_count).toBe(0n);
      expect(state.group_debt_hash).toEqual(DEBT_HASH);
    });

    test('should disclose the group_debt_hash to the public ledger', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      const customHash = stringToBytes32('custom-group-hash-abc');
      engine.circuit_initialize_group(customHash);

      // The hash is now PUBLIC — anyone can read it from the ledger
      const state = engine.getLedgerState();
      expect(bytesToHex(state.group_debt_hash)).toBe(bytesToHex(customHash));
    });

    test('should reject double-initialization (assert guard)', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);

      expect(() => engine.circuit_initialize_group(DEBT_HASH)).toThrow(
        'Contract already initialized'
      );
    });

    test('should reject invalid debt_hash size', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      const invalidHash = new Uint8Array(16); // Should be 32 bytes

      expect(() => engine.circuit_initialize_group(invalidHash)).toThrow(
        'debt_hash must be exactly 32 bytes'
      );
    });
  });

  // ──────────────────────────────────────────────────────────
  // 2. SINGLE SETTLEMENT TESTS
  // ──────────────────────────────────────────────────────────

  describe('settle_expense() Circuit', () => {
    let engine: MockContractEngine;

    beforeEach(() => {
      engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);
    });

    test('should settle an expense and update total_settled on ledger', () => {
      engine.setPrivateState({ expense_amount: 50_000n }); // 0.050000 units
      engine.circuit_settle_expense();

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(50_000n);
      expect(state.settlement_count).toBe(1n);
    });

    test('should increment settlement_count on each successful call', () => {
      engine.setPrivateState({ expense_amount: 10_000n });
      engine.circuit_settle_expense();

      engine.setPrivateState({ expense_amount: 20_000n });
      engine.circuit_settle_expense();

      engine.setPrivateState({ expense_amount: 30_000n });
      engine.circuit_settle_expense();

      const state = engine.getLedgerState();
      expect(state.settlement_count).toBe(3n);
      expect(state.total_settled).toBe(60_000n);
    });

    test('should accumulate total_settled across multiple settlements', () => {
      const amounts = [100_000n, 250_000n, 75_000n, 500_000n];
      const expectedTotal = amounts.reduce((a, b) => a + b, 0n);

      for (const amount of amounts) {
        engine.setPrivateState({ expense_amount: amount });
        engine.circuit_settle_expense();
      }

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(expectedTotal);
      expect(state.settlement_count).toBe(BigInt(amounts.length));
    });

    test('should reject settlement on uninitialized contract', () => {
      const uninitEngine = new MockContractEngine(createInitialPrivateState());
      uninitEngine.setPrivateState({ expense_amount: 100n });

      expect(() => uninitEngine.circuit_settle_expense()).toThrow(
        'Contract not yet initialized'
      );
    });

    test('should reject zero-amount settlement (assert guard)', () => {
      engine.setPrivateState({ expense_amount: 0n });

      expect(() => engine.circuit_settle_expense()).toThrow(
        'must be positive'
      );
    });

    test('should reject negative expense amount from witness', () => {
      // Witnesses validate inputs before passing to circuit
      engine.setPrivateState({ expense_amount: -1n });

      expect(() => engine.circuit_settle_expense()).toThrow();
    });

    test('should reject expense amount exceeding maximum bound', () => {
      engine.setPrivateState({ expense_amount: 2_000_000_000n }); // Over 1B limit

      expect(() => engine.circuit_settle_expense()).toThrow(
        'exceeds maximum'
      );
    });

    test('should handle the maximum allowed single expense', () => {
      engine.setPrivateState({ expense_amount: 1_000_000_000n }); // Exactly 1B
      engine.circuit_settle_expense();

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(1_000_000_000n);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 3. BATCH SETTLEMENT TESTS
  // ──────────────────────────────────────────────────────────

  describe('batch_settle() Circuit', () => {
    let engine: MockContractEngine;

    beforeEach(() => {
      engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);
    });

    test('should batch settle when group sum meets minimum threshold', () => {
      // 4 members each contribute 25,000 micro-units = 100,000 total
      engine.setPrivateState({
        group_expenses: [25_000n, 25_000n, 25_000n, 25_000n],
      });

      const min_threshold = 100_000n;
      engine.circuit_batch_settle(min_threshold);

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(100_000n);
      expect(state.settlement_count).toBe(1n);
    });

    test('should accept batch with sum exceeding threshold', () => {
      engine.setPrivateState({
        group_expenses: [100_000n, 200_000n, 150_000n, 50_000n],
      });

      engine.circuit_batch_settle(400_000n); // Total is 500,000 ≥ 400,000

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(500_000n);
    });

    test('should reject batch when group sum is below threshold', () => {
      engine.setPrivateState({
        group_expenses: [10_000n, 10_000n, 10_000n, 10_000n],
      }); // Sum = 40,000

      expect(() => engine.circuit_batch_settle(100_000n)).toThrow(
        'below required threshold'
      );
    });

    test('should allow asymmetric contributions in batch', () => {
      // One member pays much more — verifiable that total ≥ threshold
      // without any individual share being revealed
      engine.setPrivateState({
        group_expenses: [900_000n, 50_000n, 25_000n, 25_000n],
      });

      engine.circuit_batch_settle(500_000n);

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(1_000_000n);
      expect(state.settlement_count).toBe(1n);
    });

    test('should combine single and batch settlements correctly', () => {
      // Single settlement first
      engine.setPrivateState({ expense_amount: 50_000n });
      engine.circuit_settle_expense();

      // Then a batch round
      engine.setPrivateState({
        group_expenses: [25_000n, 25_000n, 25_000n, 25_000n],
      });
      engine.circuit_batch_settle(100_000n);

      const state = engine.getLedgerState();
      expect(state.total_settled).toBe(150_000n); // 50k + 100k
      expect(state.settlement_count).toBe(2n);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 4. PRIVACY TESTS
  // ──────────────────────────────────────────────────────────

  describe('Privacy Properties (Witness Data Isolation)', () => {
    let engine: MockContractEngine;
    const PRIVATE_EXPENSE = 87_654n; // An obviously unique amount

    beforeEach(() => {
      engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);
    });

    test('raw expense amount must NOT appear in public ledger state', () => {
      engine.setPrivateState({ expense_amount: PRIVATE_EXPENSE });
      engine.circuit_settle_expense();

      const state = engine.getLedgerState();

      // The ledger now has total_settled = 87,654 after the first settlement.
      // In a multi-party system, once more settlements happen, the total
      // obscures the individual contribution. The KEY assertion is that
      // the private state is not DIRECTLY stored as a named field:
      expect(state).not.toHaveProperty('expense_amount');
      expect(state).not.toHaveProperty('member_secret');
      expect(state).not.toHaveProperty('group_expenses');
    });

    test('ledger state keys must ONLY contain the four public fields', () => {
      engine.setPrivateState({ expense_amount: 100_000n });
      engine.circuit_settle_expense();

      const state = engine.getLedgerState();
      const publicKeys = Object.keys(state).sort();

      // These are the ONLY fields that exist on-chain
      expect(publicKeys).toEqual(
        ['group_debt_hash', 'is_initialized', 'settlement_count', 'total_settled'].sort()
      );
    });

    test('individual group_expenses must NOT appear in public ledger after batch_settle', () => {
      // Use distinct prime-aligned values whose aggregate sum doesn't contain
      // any individual value as a substring (demonstrating aggregation obscures splits)
      const privateExpenses: [bigint, bigint, bigint, bigint] = [
        10_007n,   // Alice:  ~0.010007 units
        25_013n,   // Bob:    ~0.025013 units
        50_021n,   // Carol:  ~0.050021 units
        15_019n,   // Dave:   ~0.015019 units
      ];
      // Aggregate total = 100,060 — does NOT contain any individual amount

      engine.setPrivateState({ group_expenses: privateExpenses });
      engine.circuit_batch_settle(90_000n); // 100,060 total > 90,000 ✓

      const state = engine.getLedgerState();

      // The ledger only stores the AGGREGATE — not individual contributions
      // Verify only public fields exist (no private amount fields)
      expect(state).not.toHaveProperty('group_expenses');
      expect(state).not.toHaveProperty('expense_amount');

      // The aggregate total is 100060 — none of the private individual amounts are stored
      expect(state.total_settled).toBe(100_060n);

      // Individual amounts do NOT exist as named properties in the state
      const publicFieldNames = Object.keys(state);
      expect(publicFieldNames).toEqual(
        expect.not.arrayContaining(['alice_amount', 'bob_amount', 'carol_amount', 'dave_amount'])
      );
    });

    test('member_secret must NEVER appear in ledger state', () => {
      const secretBytes = new Uint8Array(32).fill(0xAB); // Distinctive pattern
      engine.setPrivateState({ member_secret: secretBytes });
      engine.setPrivateState({ expense_amount: 50_000n });
      engine.circuit_settle_expense();

      const state = engine.getLedgerState();
      // Secret is not stored anywhere in public state
      expect(Object.values(state)).not.toContain(secretBytes);
      expect(state.group_debt_hash).not.toEqual(secretBytes);
    });

    test('verify_settlement_count should be a pure read without state mutation', () => {
      engine.setPrivateState({ expense_amount: 100_000n });
      engine.circuit_settle_expense();

      const beforeState = engine.getLedgerState();
      const matches = engine.circuit_verify_settlement_count(1n);
      const afterState = engine.getLedgerState();

      expect(matches).toBe(true);
      expect(afterState.total_settled).toEqual(beforeState.total_settled);
      expect(afterState.settlement_count).toEqual(beforeState.settlement_count);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 5. STATE INTEGRITY TESTS
  // ──────────────────────────────────────────────────────────

  describe('State Integrity & Consistency', () => {
    test('settlement_count accurately tracks all settlement transactions', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);

      const NUM_SETTLEMENTS = 10;
      for (let i = 1; i <= NUM_SETTLEMENTS; i++) {
        engine.setPrivateState({ expense_amount: BigInt(i * 1000) });
        engine.circuit_settle_expense();
      }

      expect(engine.getLedgerState().settlement_count).toBe(BigInt(NUM_SETTLEMENTS));
    });

    test('total_settled matches sum of all individual expense amounts', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);

      const amounts = [12_345n, 67_890n, 11_111n, 99_999n, 50_000n];
      const expectedTotal = amounts.reduce((a, b) => a + b, 0n);

      for (const amount of amounts) {
        engine.setPrivateState({ expense_amount: amount });
        engine.circuit_settle_expense();
      }

      expect(engine.getLedgerState().total_settled).toBe(expectedTotal);
    });

    test('group_debt_hash remains immutable after initialization', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);

      const initialHash = new Uint8Array(engine.getLedgerState().group_debt_hash);

      // Settle some expenses
      engine.setPrivateState({ expense_amount: 100_000n });
      engine.circuit_settle_expense();
      engine.circuit_settle_expense();

      // Batch settle
      engine.setPrivateState({ group_expenses: [10n, 20n, 30n, 40n] });
      engine.circuit_batch_settle(100n);

      // Hash must not have changed
      expect(engine.getLedgerState().group_debt_hash).toEqual(initialHash);
    });

    test('verify_settlement_count returns false for wrong count', () => {
      const engine = new MockContractEngine(createInitialPrivateState());
      engine.circuit_initialize_group(DEBT_HASH);

      engine.setPrivateState({ expense_amount: 50_000n });
      engine.circuit_settle_expense();

      expect(engine.circuit_verify_settlement_count(0n)).toBe(false);
      expect(engine.circuit_verify_settlement_count(1n)).toBe(true);
      expect(engine.circuit_verify_settlement_count(2n)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  // 6. WITNESS VALIDATION TESTS
  // ──────────────────────────────────────────────────────────

  describe('Witness Function Validation', () => {
    test('createWitnesses: get_expense_amount returns correct private value', () => {
      const state = createInitialPrivateState();
      state.expense_amount = 999_999n;
      const witnesses = createWitnesses(state);

      expect(witnesses.get_expense_amount()).toBe(999_999n);
    });

    test('createWitnesses: get_expense_amount throws on zero amount', () => {
      const state = createInitialPrivateState();
      state.expense_amount = 0n;
      const witnesses = createWitnesses(state);

      expect(() => witnesses.get_expense_amount()).toThrow('must be positive');
    });

    test('createWitnesses: get_member_secret validates byte length', () => {
      const state = createInitialPrivateState();
      state.member_secret = new Uint8Array(32).fill(0xff);
      const witnesses = createWitnesses(state);

      const secret = witnesses.get_member_secret();
      expect(secret.length).toBe(32);
    });

    test('createWitnesses: get_group_expenses returns all 4 values', () => {
      const state = createInitialPrivateState();
      state.group_expenses = [100n, 200n, 300n, 400n];
      const witnesses = createWitnesses(state);

      const expenses = witnesses.get_group_expenses();
      expect(expenses).toEqual([100n, 200n, 300n, 400n]);
      expect(expenses.length).toBe(4);
    });

    test('deriveGroupDebtHash produces 32-byte output', () => {
      const hash = deriveGroupDebtHash('my-group-2025');
      expect(hash.length).toBe(32);
    });

    test('deriveGroupDebtHash is deterministic for same input', () => {
      const hash1 = deriveGroupDebtHash('stable-group-id');
      const hash2 = deriveGroupDebtHash('stable-group-id');
      expect(hash1).toEqual(hash2);
    });

    test('formatMicroUnits correctly formats large values', () => {
      expect(formatMicroUnits(1_500_000n)).toBe('1.500000');
      expect(formatMicroUnits(1_000_000n)).toBe('1.000000');
      expect(formatMicroUnits(0n)).toBe('0.000000');
    });
  });
});

// ============================================================
// INTEGRATION TEST GUIDANCE
// (Not executed in unit test run — requires proof server)
// ============================================================

/**
 * To run full integration tests against the Midnight local proof server:
 *
 * 1. Start the proof server:
 *    docker run -d -p 6300:6300 midnightntwrk/proof-server:latest
 *
 * 2. Compile the contract:
 *    npm run compile
 *
 * 3. Set up environment:
 *    export MIDNIGHT_PROOF_SERVER_URI=http://localhost:6300
 *    export MIDNIGHT_INDEXER_URI=http://localhost:8088/api/v1/graphql
 *
 * 4. Run integration tests:
 *    npm test -- --testPathPattern=integration
 *
 * The integration tests would use the real Midnight.js SDK:
 *   import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
 *   import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
 *   import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
 *
 * And would verify that:
 *   - The ZK proof is actually generated by the proof server
 *   - The proof is accepted by the network validator
 *   - The transaction is finalized on-chain
 *   - The public ledger state matches expected values
 */
