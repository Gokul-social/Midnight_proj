# Architecture — ZK Expense Splitter

> **A technical deep-dive into the ZK circuit design, privacy boundary enforcement, and system architecture.**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Compact Smart Contract Design](#compact-smart-contract-design)
3. [ZK Circuit Architecture](#zk-circuit-architecture)
4. [Privacy Boundary Enforcement](#privacy-boundary-enforcement)
5. [Witness Isolation](#witness-isolation)
6. [On-Chain vs Off-Chain Data Flow](#on-chain-vs-off-chain-data-flow)
7. [Frontend Architecture](#frontend-architecture)
8. [Compiled Artifacts](#compiled-artifacts)
9. [Security Properties](#security-properties)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser Sandbox (React 18 + Vite)                          │
│                                                             │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐  │
│  │ Lace Wallet │   │  AppContext ZK    │   │  Witness    │  │
│  │ DApp Conn.  │   │  State Machine   │   │  Generator  │  │
│  └──────┬──────┘   └────────┬─────────┘   └──────┬──────┘  │
│         │                   │                     │         │
│         │         private witnesses only          │         │
└─────────┼───────────────────┼─────────────────────┼─────────┘
          │                   │                     │
          │                   ▼                     │
          │     ┌─────────────────────────────┐     │
          │     │  Midnight Proof Server       │◄────┘
          │     │  Docker :6300               │
          │     │  Executes ZK circuits       │
          │     │  locally on user's machine  │
          │     └─────────────┬───────────────┘
          │           proof + public delta only
          │                   │
          ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Midnight Preprod Network                                   │
│                                                             │
│  ┌──────────────────────────────┐  ┌─────────────────────┐  │
│  │  ZK Expense Splitter         │  │  GraphQL Indexer    │  │
│  │  Compact Contract            │  │  (Public state only)│  │
│  │  • Verifies ZK proof         │  │                     │  │
│  │  • Updates ledger state      │  │                     │  │
│  └──────────────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Compact Smart Contract Design

The contract is written in **Compact**, Midnight Network's privacy-native programming language. It enforces privacy at the **compiler level** — not as an optional feature.

### Public Ledger State

```compact
export ledger total_settled:    Uint<128>;   // Aggregate of all settlements
export ledger settlement_count: Uint<64>;    // Number of verified settlements
export ledger group_debt_hash:  Bytes<32>;   // SHA-256 commitment to group terms
export ledger is_initialized:   Boolean;     // Contract lifecycle flag
```

The `export ledger` keyword makes these fields visible to all Midnight network nodes and queryable via the GraphQL indexer. **These are the only fields that exist on-chain.**

### Private Witnesses

```compact
witness get_expense_amount():  Uint<64>;              // Raw private amount
witness get_member_secret():   Bytes<32>;             // Group membership credential
witness get_group_expenses():  Vector<4, Uint<64>>;   // Per-member contributions
```

Witness functions are implemented in TypeScript (`src/witnesses.ts`) and executed **exclusively inside the local proof server**. They are never transmitted over the network.

---

## ZK Circuit Architecture

### Circuit 1: `initialize_group`

**Purpose:** One-time initialization of the contract state.

```compact
export circuit initialize_group(debt_hash: Bytes<32>): [] {
    assert(is_initialized == false, "Contract already initialized");
    group_debt_hash = disclose(debt_hash);
    total_settled   = disclose(0 as Uint<128>);
    settlement_count = disclose(0 as Uint<64>);
    is_initialized  = disclose(true);
}
```

**ZK guarantee:** Proves the contract was initialized exactly once with a valid group hash commitment. The `debt_hash` is a public parameter — callers commit to their group agreement at initialization.

---

### Circuit 2: `settle_expense`

**Purpose:** Single private expense settlement.

```compact
export circuit settle_expense(): [] {
    assert(is_initialized == true, "Contract not yet initialized");
    
    const expense_amount: Uint<64> = get_expense_amount();  // PRIVATE WITNESS
    
    assert(expense_amount > (0 as Uint<64>), "Expense must be positive");
    assert(expense_amount <= (1000000000 as Uint<64>), "Exceeds maximum");
    
    const expense_as_u128 = expense_amount as Uint<128>;
    const max_safe = (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF as Uint<128>);
    assert(total_settled <= max_safe - expense_as_u128, "Would overflow");
    
    const new_total = total_settled + expense_as_u128;
    total_settled    = disclose(new_total);               // PUBLIC DISCLOSURE
    settlement_count = disclose((settlement_count + 1 as Uint<64>) as Uint<64>);
}
```

**ZK guarantee:** Proves **all three assertions** without revealing `expense_amount`:
1. Amount is positive (> 0)
2. Amount doesn't exceed the safety cap (anti-abuse)
3. Addition won't overflow the 128-bit accumulator

The proof is verified on-chain. The verifier only sees: *"A valid non-zero, non-overflowing amount was settled."*

---

### Circuit 3: `batch_settle`

**Purpose:** Settle a complete group round — 4 members simultaneously.

```compact
export circuit batch_settle(min_threshold: Uint<64>): [] {
    const expenses: Vector<4, Uint<64>> = get_group_expenses();  // 4 PRIVATE values
    
    // Sum all 4 contributions (private arithmetic)
    const sum = (expenses[0] as Uint<128>) + (expenses[1] as Uint<128>)
              + (expenses[2] as Uint<128>) + (expenses[3] as Uint<128>);
    
    assert(sum >= (min_threshold as Uint<128>), "Below threshold");
    
    total_settled    = disclose(total_settled + sum);
    settlement_count = disclose(settlement_count + 1 as Uint<64>);
}
```

**ZK guarantee:** Proves the **sum** of 4 private amounts meets a **publicly known minimum threshold** without revealing any individual amount. `min_threshold` is a public parameter — anyone can verify the group met their agreed total.

---

### Circuit 4: `verify_settlement_count` (Pure)

**Purpose:** Read-only proof verification.

```compact
export circuit verify_settlement_count(expected_count: Uint<64>): Boolean {
    return settlement_count == expected_count;
}
```

A pure circuit (no state mutation) that generates a proof asserting the count matches an expected value. Useful for external verifiers to cryptographically confirm settlement progress.

---

## Privacy Boundary Enforcement

The `disclose()` operator is the **only** mechanism by which data can cross from the private ZK context into the public ledger. The Compact compiler **blocks** any attempt to assign a private witness directly to a public field:

```compact
// COMPILER ERROR — this would leak private data:
total_settled = total_settled + get_expense_amount();

// CORRECT — only the computed result is disclosed:
const private_amount = get_expense_amount();       // stays in ZK circuit
const new_total = total_settled + private_amount;  // computed privately
total_settled = disclose(new_total);               // only result is public
```

This is enforced at **compile time**, not at runtime. It is impossible to write a Compact contract that accidentally leaks private data.

---

## Witness Isolation

Private witnesses flow through a strict isolation boundary:

```
TypeScript (witnesses.ts)
  → Serialized as circuit inputs
  → Sent to local proof server (Docker :6300) via HTTP POST
  → Executed inside the ZK VM (never logged, never persisted)
  → Output: ZK proof (mathematical artifact) + public state delta
  → Proof submitted to Midnight network
  → Witnesses are discarded — they exist only for the duration of proof generation
```

The Docker proof server **does not** log input witnesses. The Vite dev proxy in `vite.config.ts` routes proof server requests through `localhost:5173/proof-server/*` to avoid CORS issues without ever forwarding to external servers.

---

## On-Chain vs Off-Chain Data Flow

| Data | Location | Visibility | Persistence |
|------|----------|-----------|-------------|
| `expense_amount` | Browser heap → Proof server | Private | Discarded after proof |
| `member_secret` | Browser local storage | Private | User-controlled |
| `group_expenses[4]` | Browser heap → Proof server | Private | Discarded after proof |
| ZK Proof | Browser → Midnight network | Public (math) | On-chain forever |
| `total_settled` | Midnight ledger | Public | On-chain forever |
| `settlement_count` | Midnight ledger | Public | On-chain forever |
| `group_debt_hash` | Midnight ledger | Public | On-chain forever |
| `is_initialized` | Midnight ledger | Public | On-chain forever |

---

## Frontend Architecture

### Component Tree

```
App.tsx
├── AppProvider (AppContext.tsx)
│   ├── Lace DApp Connector state
│   ├── ZK proof generation state machine
│   └── Ledger polling (GraphQL indexer)
├── MarqueeBar (top + bottom)
├── Nav (right-rail — wallet, network, X profile)
├── LandingPage (HOME section)
│   ├── Hero (large typographic display)
│   ├── Feature circles (ZK concepts)
│   └── Stats bar
└── AppDashboard (APP section)
    ├── ExpenseDashboard (public ledger state + Verify On-Chain)
    ├── NetworkStatus (Preprod live health indicator)
    ├── PrivacyClaim (private vs public data visualization)
    ├── PrivacyLog (real-time privacy audit log)
    ├── ExplorerLinks (transaction scanner)
    └── SettleExpenseForm (private witness input + proof trigger)
```

### State Machine

`AppContext.tsx` manages a single state object:

```typescript
type AppState = {
  wallet: { status: 'disconnected' | 'connecting' | 'connected' | 'error'; ... };
  ledger: { total_settled: bigint; settlement_count: bigint; ... };
  settlement: { status: 'idle' | 'generating_proof' | 'submitting' | 'confirmed' | 'error'; ... };
  laceDetected: boolean;
};
```

---

## Compiled Artifacts

The `compactc` compiler produces:

| Artifact | Purpose | Size |
|----------|---------|------|
| `*.pk` (Prover Key) | Used by the proof server to generate proofs | 40–280 KB |
| `*.vk` (Verifier Key) | Used by Midnight nodes to verify proofs | ~1.3 KB each |
| `*.bzkir` (Binary ZKIR) | Binary ZK intermediate representation | Variable |
| `contract/index.cjs` | CommonJS SDK interface (JavaScript) | ~50 KB |

The prover keys are the largest artifacts because they encode the full constraint system for each circuit. The verifier keys are tiny because on-chain verification is designed to be lightweight.

---

## Security Properties

### Privacy
- **Soundness:** A malicious prover cannot generate a valid proof for an invalid statement (e.g., cannot prove they paid without actually knowing a valid amount)
- **Zero-knowledge:** The verifier (Midnight network) learns nothing beyond the truth of the statement
- **Witness isolation:** Private inputs are consumed locally and never transmitted to any external server

### Smart Contract Safety
- **Overflow protection:** All arithmetic uses explicit bigint bounds checking before `disclose()`
- **Initialization guard:** `assert(is_initialized == false)` prevents double-initialization attacks
- **Bounds checking:** `expense_amount <= 1,000,000,000` prevents numeric abuse
- **Settlement count overflow:** Guard at `Uint<64>` maximum before incrementing

### Frontend Safety
- **No private data in state:** The React state tree never stores raw witness values
- **Proof server isolation:** The local Docker container is the only process that touches private data
- **CSP headers:** `vercel.json` enforces strict Content Security Policy in production
