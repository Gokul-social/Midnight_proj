# 🌙 ZK Expense Splitter — Midnight Network

> **A production-grade, privacy-preserving group expense splitting dApp built on the Midnight Network using Compact smart contracts and zero-knowledge proofs.**

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

> **Midnight Builder Program — Level 1 Submission**

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

---

## 📁 Project Structure

```
zk-expense-splitter/
├── contract/
│   └── src/
│       └── zk_expense_splitter.compact   # Compact smart contract
├── managed/                               # Compiler-generated ZK circuits
│   ├── README.md
│   └── zk_expense_splitter/
│       ├── contract/
│       │   ├── index.cjs                  # Compiled contract module
│       │   └── index.d.ts                 # TypeScript type declarations
│       ├── keys/
│       │   ├── *.pk.placeholder           # ZK proving key locations
│       │   └── *.vk.placeholder           # ZK verification key locations
│       └── witnesses/
│           └── index.cjs                  # Witness interface module
├── src/
│   ├── witnesses.ts                       # Private witness implementations
│   ├── deploy.ts                          # Deployment script (Preprod)
│   └── utils.ts                           # Shared utilities
├── tests/
│   └── expense_splitter.test.ts           # Comprehensive test suite (28 tests)
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 🔑 Key Commands Reference

```bash
npm run compile    # Compile Compact contract → ZK circuits
npm test           # Run 28-test suite
npm run deploy     # Deploy to Midnight Preprod
npm run build      # Compile TypeScript to JavaScript
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

*Built with ❤️ for the Midnight Network Builder Program — New Moon to Full, Level 1 Submission.*
