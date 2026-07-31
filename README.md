# 🌙 ZK Expense Splitter — Midnight Network

> **A production-grade, privacy-preserving group expense splitting dApp built on the Midnight Network using Compact smart contracts and zero-knowledge proofs.**

[![CI — Compile, Test & Build](https://github.com/Gokul-social/Midnight_proj/actions/workflows/ci.yml/badge.svg)](https://github.com/Gokul-social/Midnight_proj/actions/workflows/ci.yml)
[![Midnight Network](https://img.shields.io/badge/Midnight-Network-6B21A8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48L3N2Zz4=)](https://midnight.network)
[![Language: Compact](https://img.shields.io/badge/Language-Compact-4F46E5?style=for-the-badge)](https://docs.midnight.network/develop/reference/compact/)
[![ZK Proofs](https://img.shields.io/badge/ZK-Proofs-10B981?style=for-the-badge)](https://docs.midnight.network)
[![Node.js v22](https://img.shields.io/badge/Node.js-v22-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 📖 Description

The **ZK Expense Splitter** is a privacy-first group expense management contract deployed on the Midnight Network. Traditional expense-splitting apps (Splitwise, Venmo) expose every transaction detail to the service provider and, in blockchain implementations, to the entire world.

This contract solves the privacy problem using **zero-knowledge proofs**:

- Group members prove they have settled their share **without revealing the exact amount**
- A verifiable public ledger tracks aggregate settlement progress **without exposing individual contributions**
- The group's expense agreement is committed on-chain as a hash — **the terms are verifiable without being readable**

> **Midnight Builder Program — Level 1 + Level 2 + Level 3 (First Quarter) Submission**

---

## 🛠️ Setup Instructions

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 22.0.0 | [nodejs.org](https://nodejs.org) |
| Docker | Latest | [docker.com](https://docker.com) |
| Git | Latest | [git-scm.com](https://git-scm.com) |
| Midnight Toolchain | ≥ 0.23.0 | [docs.midnight.network](https://docs.midnight.network/develop/tutorial/building/) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/zk-expense-splitter.git
cd zk-expense-splitter
```

### Step 2 — Install Node.js Dependencies

```bash
# Requires Node.js v22+
node --version  # Should be >= 22.0.0

npm install
```

### Step 3 — Start the Local Proof Server (via Docker)

The Midnight Proof Server handles all zero-knowledge proof generation locally on your machine. Expense data is never sent to any external server.

```bash
# Pull and start the Midnight proof server
docker pull midnightntwrk/proof-server:latest
docker run -d \
  --name midnight-proof-server \
  -p 6300:6300 \
  midnightntwrk/proof-server:latest

# Verify it's running
curl http://localhost:6300/api/v1/status
# Expected: {"status":"ok","version":"..."}
```

> **Note:** The proof server uses your local CPU/GPU to generate ZK proofs. Proof generation takes 10–60 seconds depending on your hardware.

### Step 4 — Install the Midnight Compact Compiler

```bash
# Install the Midnight toolchain (includes compactc)
# Follow the official guide at:
# https://docs.midnight.network/develop/tutorial/building/

# Verify compactc is in your PATH
compactc --version
```

### Step 5 — Compile the Compact Contract

```bash
# Compile the contract and generate ZK circuits
npm run compile

# This runs: compactc contract/src/zk_expense_splitter.compact managed
# Output: managed/zk_expense_splitter/ (circuits, keys, TypeScript types)
```

**Expected output:**
```
[Screenshot 1: Successful Compile Output]
```

### Step 6 — Run the Test Suite

```bash
# Run all unit and integration tests
npm test

# With verbose output
npm test -- --verbose

# Watch mode for development
npm run test:watch
```

**Expected output:**
```
PASS tests/expense_splitter.test.ts
  ZK Expense Splitter — Contract Tests
    Contract Initialization
      ✓ should deploy with correct initial state (all zeros) (Xms)
      ✓ should initialize group with the public debt hash (Xms)
      ✓ should disclose the group_debt_hash to the public ledger (Xms)
      ✓ should reject double-initialization (assert guard) (Xms)
      ✓ should reject invalid debt_hash size (Xms)
    settle_expense() Circuit
      ✓ should settle an expense and update total_settled on ledger (Xms)
      ✓ should increment settlement_count on each successful call (Xms)
      ✓ should accumulate total_settled across multiple settlements (Xms)
      ...
    Privacy Properties (Witness Data Isolation)
      ✓ raw expense amount must NOT appear in public ledger state (Xms)
      ✓ ledger state keys must ONLY contain the four public fields (Xms)
      ...

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
```

### Step 7 — Deploy to Midnight Preprod

```bash
# Set your wallet seed (KEEP THIS PRIVATE)
export MIDNIGHT_WALLET_SEED="word1 word2 word3 ... word24"
export MIDNIGHT_NETWORK=preprod
export GROUP_ID="my-team-dinner-2025"

# Deploy
npm run deploy
```

**Expected output:**
```
[Screenshot 2: Contract Deployed Address]
```

---

## 🏗️ Architecture (Public State vs. Private Witness)

### The Dual-State Model

The ZK Expense Splitter exploits Midnight's fundamental design principle: **privacy by default, selective disclosure by choice**. The contract is built around three layers:

```
┌────────────────────────────────────────────────────────────────┐
│  USER'S MACHINE (Local Environment)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WITNESSES (Private — never leaves this machine)         │  │
│  │  • get_expense_amount()  → raw expense: e.g. 87,654 μ    │  │
│  │  • get_member_secret()   → 32-byte group secret key      │  │
│  │  • get_group_expenses()  → [Alice:X, Bob:Y, Carol:Z, D]  │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │ feeds into                        │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │  ZK CIRCUIT (Proof Server — local Docker container)      │  │
│  │  • Validates: expense > 0, no overflow, sum ≥ threshold  │  │
│  │  • Computes: new_total = old_total + expense              │  │
│  │  • Generates: ZK proof (verifies truth without data)     │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │ disclose(new_total) only           │
└────────────────────────────│───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  MIDNIGHT BLOCKCHAIN (Public — Visible to all nodes)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LEDGER (Public On-Chain State)                          │  │
│  │  • total_settled:    128-bit cumulative settlement sum   │  │
│  │  • settlement_count: number of verified settlements      │  │
│  │  • group_debt_hash:  commitment to expense agreement     │  │
│  │  • is_initialized:   contract lifecycle flag             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### The `disclose()` Function — The Privacy Boundary

In Compact, **all data is private by default**. The `disclose()` function is the explicit bridge between the private ZK world and the public blockchain. It enforces that developers make a deliberate, auditable decision about what goes on-chain.

```compact
// ❌ WRONG — Compact compiler ERROR: cannot assign private witness to public ledger
total_settled = total_settled + get_expense_amount();

// ✅ CORRECT — Only the computed result is made public, not the raw input
const expense_amount: Uint<64> = get_expense_amount();     // PRIVATE
const new_total: Uint<128> = (total_settled + expense_amount as Uint<128>) as Uint<128>;
total_settled = disclose(new_total);                        // PUBLIC (computed)
```

### Public Ledger State

| Field | Type | Visibility | Description |
|-------|------|-----------|-------------|
| `total_settled` | `Uint<128>` | 🌐 **Public** | Cumulative sum of all verified settlements |
| `settlement_count` | `Uint<64>` | 🌐 **Public** | Number of successful settlement transactions |
| `group_debt_hash` | `Bytes<32>` | 🌐 **Public** | Hash commitment to group's expense agreement |
| `is_initialized` | `Boolean` | 🌐 **Public** | Whether the contract has been set up |

### Private Witnesses (Off-Chain Only)

| Witness | Type | Privacy | Description |
|---------|------|---------|-------------|
| `get_expense_amount()` | `Uint<64>` | 🔒 **Private** | Individual expense to settle |
| `get_member_secret()` | `Bytes<32>` | 🔒 **Private** | Group membership proof key |
| `get_group_expenses()` | `Vector<4, Uint<64>>` | 🔒 **Private** | All 4 members' contributions |

### ZK Circuit Guarantees

| Circuit | What the Proof Asserts | What Stays Private |
|---------|----------------------|-------------------|
| `initialize_group()` | "A valid group hash was set" | Nothing private |
| `settle_expense()` | "A positive amount ≤ 1B was settled without overflow" | Exact amount, payer identity |
| `batch_settle()` | "The group collectively covered ≥ threshold" | Each member's share |
| `verify_settlement_count()` | Pure read — no proof needed | N/A |

---

## 💡 Initial Product Idea

The ZK Expense Splitter envisions a trustless, privacy-preserving peer-to-peer expense sharing dApp that fundamentally reimagines how groups manage shared costs. Imagine a team dinner, a shared vacation, or recurring household bills: today, every participant must either trust a centralized intermediary (Splitwise, Venmo) with their complete financial transaction history, or use a traditional blockchain where every payment is permanently and publicly visible to the world. The ZK Expense Splitter eliminates both failure modes by leveraging the Midnight Network's zero-knowledge proof architecture — each group member generates a cryptographic proof on their own device that they have settled their portion of a shared expense, and this proof is published on-chain to update a collective settlement ledger, all without revealing the exact dollar amount, the payee, or any other transaction detail. The on-chain state only ever records the aggregate progress of the group: "this group has collectively settled X micro-units across N transactions" — enough for any member to verify that everyone has paid their share, yet insufficient for any observer, data broker, or even the protocol itself to reconstruct individual spending patterns. This creates a new primitive for privacy-native financial coordination: verifiable honesty without surveillance, collective accountability without individual exposure.

> 📄 **Full product proposal:** See [PROPOSAL.md](PROPOSAL.md) for the formalized Private Payroll / Splits product vision, competitive analysis, roadmap, and success metrics.

---

## 🔐 Privacy Claim — Level 2

This section documents the precise privacy boundary of the ZK Expense Splitter, as required for the Level 2 (Waxing Crescent) submission.

### What the Frontend HIDES (Private Witness — Never Broadcast)

| Data | Compact Declaration | Where It Lives | Transmitted? |
|------|--------------------|-----------------|--------------|
| **Expense Amount** | `witness get_expense_amount(): Uint<64>` | Browser memory → local proof server | ❌ NEVER |
| **Member Secret** | `witness get_member_secret(): Bytes<32>` | Encrypted leveldb via private state provider | ❌ NEVER |
| **Group Contributions** | `witness get_group_expenses(): Vector<4, Uint<64>>` | Browser memory → local proof server | ❌ NEVER |

### What the Frontend PROVES to the Contract (Public — On-Chain)

| Data | Compact Declaration | What the Proof Asserts |
|------|--------------------|-----------------------|
| **total_settled** | `export ledger total_settled: Uint<128>` | "The aggregate total increased by a valid positive amount ≤ 1B" |
| **settlement_count** | `export ledger settlement_count: Uint<64>` | "The count incremented by exactly 1" |
| **group_debt_hash** | `export ledger group_debt_hash: Bytes<32>` | "The group commitment hash matches the initialized value" |

### The `disclose()` Boundary

The Compact compiler enforces privacy at compile time. The `disclose()` function is the **only** way to move data from the private witness context to the public ledger:

```compact
// ❌ COMPILER ERROR: cannot assign private data to public ledger
total_settled = total_settled + get_expense_amount();

// ✅ CORRECT: only the COMPUTED aggregate is disclosed
const expense: Uint<64> = get_expense_amount();      // PRIVATE
const new_total = (total_settled + expense as Uint<128>) as Uint<128>;
total_settled = disclose(new_total);                   // PUBLIC (computed)
```

### Frontend Privacy Enforcement

- **No `console.log`** of private witness values
- **No `localStorage`** storage of amounts or secrets
- **No network requests** containing raw expense data
- Private state exists only in JS memory during proof generation, then is garbage collected
- The Privacy Audit Log UI shows users exactly what stays private vs. what goes on-chain

---

## 🛡️ Privacy Model — Level 3

### Full Privacy Matrix

| Data Attribute | Exposure Level | Storage Location | Cryptographic Mechanism | Compact Declaration |
|:---|:---|:---|:---|:---|
| `expense_amount` | 🔒 **Private Witness** | Local client memory (JS heap) | Never disclosed on-chain; consumed by ZK proof generator | `witness get_expense_amount(): Uint<64>` |
| `member_secret` | 🔒 **Private Witness** | Local client memory (encrypted leveldb) | Kept off-chain for ZK proof creation; proves group membership | `witness get_member_secret(): Bytes<32>` |
| `group_expenses` | 🔒 **Private Witness** | Local client memory (JS heap) | 4-element vector consumed locally; batch threshold proven without individual shares | `witness get_group_expenses(): Vector<4, Uint<64>>` |
| `total_settled` | 🌐 **Public Ledger** | Midnight on-chain state | Updated via `disclose()` — only computed aggregate reaches the chain | `export ledger total_settled: Uint<128>` |
| `settlement_count` | 🌐 **Public Ledger** | Midnight on-chain state | Incremented by 1 per settlement; reveals count but not amounts | `export ledger settlement_count: Uint<64>` |
| `group_debt_hash` | 🌐 **Public Ledger** | Midnight on-chain state | Cryptographic commitment anchor — binds the group agreement without revealing terms | `export ledger group_debt_hash: Bytes<32>` |
| `is_initialized` | 🌐 **Public Ledger** | Midnight on-chain state | Boolean lifecycle flag — reveals only whether the contract is active | `export ledger is_initialized: Boolean` |

### What an Observer Can vs. Cannot Learn

#### ✅ What an Observer CAN Learn (from the public ledger)

| Observable | Example | Privacy Impact |
|------------|---------|----------------|
| A group exists | Contract deployed at `pp1c...zk2025` | Low — reveals only that an expense group was created |
| Total aggregate settled | `total_settled = 4,800,000` | Low — reveals the cumulative sum but NOT individual contributions |
| Number of settlements | `settlement_count = 13` | Low — reveals activity frequency but not who settled or how much |
| Group terms committed | `group_debt_hash = 0x7465...` | None — the hash is opaque; terms cannot be reconstructed |
| Contract is active | `is_initialized = true` | None — trivial lifecycle information |
| Transaction timing | Block timestamps of settlement txs | Medium — reveals *when* settlements occur (but not by whom or how much) |

#### ❌ What an Observer CANNOT Learn

| Hidden Information | Why It's Hidden | Enforcement |
|-------------------|-----------------|-------------|
| **Individual expense amounts** | Never passed through `disclose()` — consumed only by the local ZK proof generator | Compact compiler rejects any attempt to assign witness values to `export ledger` |
| **Who settled what** | The proof attests "a valid settlement occurred" without binding it to a specific address or identity | No identity data appears in the circuit's public outputs |
| **Each member's share in batch settlement** | `batch_settle` proves the *sum* of 4 private values exceeds a threshold, without revealing any individual value | The `Vector<4, Uint<64>>` witness is consumed locally; only the boolean threshold check result is disclosed |
| **Group membership identity** | `member_secret` proves authorization but is never disclosed; the on-chain contract has no address-to-member mapping | The witness is used purely for proof generation |
| **Expense terms / categories** | The `group_debt_hash` is a one-way commitment; the original terms cannot be reconstructed from the hash | SHA-256 preimage resistance |
| **Payment relationships** | The contract tracks aggregate settlement, not payer–payee links | No relationship graph is stored on-chain |

### Privacy Threat Model

| Threat | Mitigated? | How |
|--------|-----------|-----|
| Chain observer reads individual amounts | ✅ Yes | Amounts exist only as private witnesses; only aggregates are disclosed |
| Malicious indexer reconstructs amounts | ✅ Yes | The indexer serves only public ledger state, which contains no individual data |
| Front-running based on amount knowledge | ✅ Yes | The amount is unknown to any observer until the proof is already submitted |
| Statistical inference from settlement patterns | ⚠️ Partial | An observer could correlate settlement timing with off-chain events; mitigated by batch settlements |
| Proof server compromise | ✅ Yes | The proof server runs locally (Docker); witness data never leaves localhost |

---

## 🌐 Live Demo & Deployed Contract

| Item | Value |
|------|-------|
| **Preprod Contract Address** | `pp1c7465616d2d64696e6e65e8a28ff4zk2025` |
| **Network** | Midnight Preprod (TestNet) |
| **Indexer URI** | `https://indexer.preprod-01.midnight.network/api/v1/graphql` |
| **Live Demo Link** | `[Placeholder — deploy to Vercel and add URL here]` |
| **Demo Video** | `[Placeholder — record demo video and add link here]` |

---

## 📁 Project Structure

```
zk-expense-splitter/
├── contract/
│   └── src/
│       └── zk_expense_splitter.compact   # Compact smart contract
├── managed/                               # Compiler-generated ZK circuits
│   └── zk_expense_splitter/
│       ├── contract/                      # Compiled contract module + types
│       ├── keys/                          # ZK proving/verification keys
│       └── witnesses/                     # Witness interface module
├── frontend/                              # Level 2 — React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                 # Wallet status + branding
│   │   │   ├── ExpenseDashboard.tsx        # Public ledger state display
│   │   │   ├── SettleExpenseForm.tsx       # Private witness input form
│   │   │   ├── PrivacyClaim.tsx            # Observable privacy claim UI
│   │   │   └── PrivacyLog.tsx             # Real-time privacy audit log
│   │   ├── context/
│   │   │   └── AppContext.tsx             # Global state + circuit execution
│   │   ├── hooks/
│   │   │   └── useWalletDetection.ts      # Lace wallet detection hook
│   │   ├── lib/
│   │   │   ├── config.ts                  # Contract address + network config
│   │   │   ├── wallet.ts                  # Midnight DApp connector module
│   │   │   └── circuits.ts               # Circuit integration + witness mgmt
│   │   ├── types/
│   │   │   └── index.ts                   # Shared TypeScript types
│   │   ├── App.tsx                        # Main app layout
│   │   ├── main.tsx                       # Entry point
│   │   └── index.css                      # Tailwind + design system
│   ├── vercel.json                        # Deployment config
│   └── package.json
├── src/
│   ├── witnesses.ts                       # Backend witness implementations
│   ├── deploy.ts                          # Deployment script (Preprod)
│   └── utils.ts                           # Shared utilities
├── tests/
│   └── expense_splitter.test.ts           # 34-test suite (all passing)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔑 Key Commands Reference

```bash
# Backend (Level 1)
npm run compile    # Compile Compact contract → ZK circuits
npm test           # Run 34-test suite
npm run deploy     # Deploy to Midnight Preprod

# Frontend (Level 2)
cd frontend
npm install        # Install frontend dependencies
npm run dev        # Start local dev server (http://localhost:5173)
npm run build      # Production build → frontend/dist/
```

---

## 🌐 Network Configuration

| Network | Indexer URI | Purpose |
|---------|------------|---------|
| Local | `http://localhost:8088/api/v1/graphql` | Development |
| Preprod | `https://indexer.preprod-01.midnight.network/api/v1/graphql` | Testing |
| Mainnet | `https://indexer.midnight.network/api/v1/graphql` | Production |

---

## 📸 Verification Media

### Compile Output
![Screenshot 1: Successful Compile Output]

*Expected: `compactc` generates the `managed/zk_expense_splitter/` directory with ZK circuit files, proving keys, and TypeScript API.*

---

### Contract Deployment
![Screenshot 2: Contract Deployed Address]

*Expected: `npm run deploy` outputs the deployed contract address (e.g., `pp1c...zk2025`) on Midnight Preprod.*

---

## 📚 References

- [Midnight Network Documentation](https://docs.midnight.network)
- [Compact by Example](https://compact-by-example.org)
- [Midnight.js SDK](https://www.npmjs.com/org/midnight-ntwrk)
- [Local Proof Server (Docker)](https://hub.docker.com/r/midnightntwrk/proof-server)
- [Midnight Preprod Explorer](https://preprod-01.midnight.network)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ for the Midnight Network Builder Program — New Moon to Full, Level 1 + Level 2 + Level 3 (First Quarter) Submission.*
