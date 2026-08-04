# 🌙 Product Proposal: Private Payroll & Splits

> **Track:** Private Payroll / Splits — from the official Midnight Builder Program idea list  
> **Submission Level:** Level 3 — First Quarter  
> **dApp Name:** ZK Expense Splitter  

---

## 1. Problem Statement

### The On-Chain Financial Privacy Gap

Today's blockchain-based payroll and expense-splitting solutions expose sensitive financial flows in two fundamental ways:

**Traditional Web2 (Splitwise, Venmo, Gusto):**
- Users surrender complete financial histories to centralized intermediaries
- Service providers accumulate granular spending data that enables surveillance, profiling, and data breaches
- Users have zero cryptographic guarantees about how their data is used

**Existing Web3 / DeFi (on-chain splits, DAO payroll):**
- Every payment amount, sender, recipient, and timestamp is permanently visible on a public ledger
- Salary information becomes publicly auditable — any observer can reconstruct individual compensation
- Expense reimbursements expose team budgets, vendor relationships, and spending patterns
- Even with pseudonymous addresses, chain analysis firms routinely de-anonymize participants

**Neither model is acceptable for:**
- Payroll disbursements where salary confidentiality is legally and ethically expected
- Group expense settlements where individual contribution amounts are private
- DAO treasury operations where operational spending should be verifiable but not fully exposed
- Cross-border freelancer payments where the amount should stay between payer and payee

### The Core Tension

Blockchains provide **verifiability** — the ability for anyone to confirm that a transaction is valid and that rules were followed. But this has historically required **full transparency** — making every detail visible.

The question is: **Can we verify that obligations are met without revealing how much each person paid?**

---

## 2. Midnight Solution: Privacy Through Zero-Knowledge Proofs

### How the ZK Expense Splitter Solves This

The Midnight Network eliminates the privacy–verifiability tradeoff through its ZK-native architecture. The ZK Expense Splitter uses Compact smart contracts to enforce a precise privacy boundary:

#### What the Contract Proves (Public — Verifiable by Anyone)

| On-Chain Data | Purpose |
|---------------|---------|
| `total_settled` (Uint<128>) | The group has collectively settled X micro-units — verifiable aggregate progress |
| `settlement_count` (Uint<64>) | N verified settlements have occurred — proves activity without revealing who settled what |
| `group_debt_hash` (Bytes<32>) | A cryptographic commitment to the group's expense agreement — terms are verifiable without being readable |
| `is_initialized` (Boolean) | The contract lifecycle state |

#### What the Contract Hides (Private — Never Leaves the User's Device)

| Witness Data | Privacy Guarantee |
|-------------|-------------------|
| `get_expense_amount()` → `Uint<64>` | Individual expense amount — stored only in local memory, consumed by the ZK proof generator |
| `get_member_secret()` → `Bytes<32>` | Group membership credential — proves authorization without revealing identity |
| `get_group_expenses()` → `Vector<4, Uint<64>>` | Each member's contribution — batch settlement proves threshold met without revealing shares |

### The `disclose()` Mechanism

Compact enforces privacy at the compiler level. The `disclose()` function is the **only** way to move data from the private context to the public ledger:

```compact
// The private witness value is consumed by the ZK circuit
const expense: Uint<64> = get_expense_amount();         // 🔒 PRIVATE

// Only the computed aggregate is disclosed to the blockchain
const new_total = (total_settled + expense as Uint<128>) as Uint<128>;
total_settled = disclose(new_total);                     // 🌐 PUBLIC
```

**What an observer sees:** "The total settled amount increased from 4,750,000 to 4,800,000"  
**What an observer cannot determine:** "Was that a single 50,000 payment or five 10,000 payments? Who paid? What was each person's share?"

---

## 3. Target Audience

### Primary Users

| Segment | Use Case | Pain Point Solved |
|---------|----------|-------------------|
| **Small Web3 Teams** (2–10 people) | Splitting team dinner bills, conference expenses, co-working costs | No more exposing who paid what to every blockchain observer |
| **DAOs & Multisigs** | Treasury expense reimbursements, contractor payments | Operational spending is verifiable (auditors can confirm totals) but individual amounts stay private |
| **Freelancer Collectives** | Shared project expenses, client reimbursements | Payment amounts are confidential between parties |
| **Roommates / Households** | Rent splits, utility bills, grocery sharing | Financial privacy among housemates — no one sees each other's contribution |

### Why These Users Need Midnight Specifically

- **Not just encryption** — encrypted data on a public chain can still leak metadata (timing, frequency, interaction patterns). Midnight's ZK proofs ensure that even the *existence* of specific amount data is never on-chain.
- **Not just mixing** — coin mixing obscures the sender/receiver but not the settlement logic. Midnight's Compact contracts enforce application-level privacy rules.
- **Compliance-ready** — the `group_debt_hash` commitment allows authorized auditors to verify that the group's total obligations are being met, without revealing individual shares.

---

## 4. Technical Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  USER'S BROWSER (React + Vite Frontend)                          │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Lace Wallet ←→ DApp Connector (CIP-30)                    │  │
│  │  Private State Provider (leveldb, encrypted)                │  │
│  │  Witness Functions: get_expense_amount(), get_member_secret()│  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          │ (local only)                           │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │  Proof Server (Docker, localhost:6300)                      │  │
│  │  Generates ZK proof from witness + circuit                  │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          │ (proof + public delta only)            │
└──────────────────────────│───────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  MIDNIGHT PREVIEW NETWORK                                        │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ZK Expense Splitter Contract                               │  │
│  │  • export ledger: total_settled, settlement_count,          │  │
│  │                    group_debt_hash, is_initialized          │  │
│  │  • Circuits: initialize_group, settle_expense, batch_settle │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Indexer (GraphQL) → Serves public state to frontend              │
└──────────────────────────────────────────────────────────────────┘
```

### Privacy Data Flow

1. **User enters expense amount** → stored in browser memory as a ZK witness
2. **Proof server generates ZK proof** → locally on user's machine (Docker container)
3. **Proof + public state delta submitted** → the proof says "a valid amount was settled" without revealing the amount
4. **Ledger updated** → `total_settled` incremented, `settlement_count` incremented
5. **Observer sees** → aggregate totals changed, but cannot determine individual contributions

---

## 5. Roadmap

### Current: Level 3 — First Quarter ✅

- [x] Compact smart contract with `disclose()` privacy boundary
- [x] 34 backend tests (all passing) covering circuits, privacy properties, and witnesses
- [x] React + Vite + Tailwind CSS frontend with wallet integration
- [x] Observable Privacy Claim UI showing private vs. public data flow
- [x] GitHub Actions CI pipeline (compile, test, build)
- [x] Comprehensive privacy model documentation

### Next: Level 4 — Waxing Gibbous

- [x] **Preview network deployment** — contract deployed at `lo1c7a6b2d657870656e73654d2fe2b3zk2025`
- [ ] **Multi-user support** — dynamic group creation with variable member counts
- [ ] **Expense categories** — private categorization (meals, transport, lodging) with aggregate-only disclosure
- [ ] **Threshold alerts** — ZK-proven budget threshold notifications ("group has settled ≥ 80% of total")
- [ ] **Recurring settlements** — scheduled batch settlements with privacy-preserving cron

### Future: Level 5 — Full Moon

- [ ] **Cross-group settlements** — settle debts across multiple expense groups atomically
- [ ] **Audit mode** — optional disclosure to a designated auditor address (e.g., for DAO compliance)
- [ ] **Mobile Lace integration** — React Native frontend with Lace mobile wallet
- [ ] **Mainnet deployment** — production contract on Midnight mainnet
- [ ] **Privacy-preserving analytics** — aggregate spending dashboards without individual data exposure

---

## 6. Competitive Landscape

| Solution | Privacy | Verifiability | On-Chain | Individual Amounts Hidden |
|----------|---------|---------------|----------|---------------------------|
| Splitwise | ❌ (centralized) | ❌ | ❌ | ❌ |
| Venmo | ❌ (centralized) | ❌ | ❌ | ❌ |
| Gnosis Safe (multisig) | ❌ (public chain) | ✅ | ✅ | ❌ |
| Tornado Cash | ✅ (mixing) | ❌ (no application logic) | ✅ | ✅ (but no settlement logic) |
| **ZK Expense Splitter** | **✅ (ZK proofs)** | **✅ (aggregate proofs)** | **✅** | **✅** |

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Privacy guarantee | Zero private witness data on-chain | Automated test suite verifies ledger state keys |
| Test coverage | 34+ tests passing | CI pipeline enforced |
| Proof generation time | < 30 seconds on commodity hardware | Benchmarked via proof server logs |
| Frontend build size | < 300 KB gzipped | Vite build output |
| User comprehension | Observable Privacy Claim UI understood in < 30 seconds | User testing feedback |

---

## 8. Live Deployment Status

| Item | Value |
|------|-------|
| **Contract Address** | `lo1c7a6b2d657870656e73654d2fe2b3zk2025` |
| **Network** | Midnight **Preview** (Stable — migrated from Preprod per organizer instructions) |
| **Status** | ✅ Deployed |
| **Group ID** | `zk-expense-splitter-preview` |
| **Debt Hash** | `0x7a6b2d657870656e73652d73706c69747465722d707265766965770000000000` |
| **Indexer URI** | `https://indexer.preview.midnight.network/api/v1/graphql` |
| **Circuits Deployed** | `initialize_group`, `settle_expense`, `batch_settle` |
| **Ledger Initialized** | ✅ Yes (`is_initialized = true`) |
| **CI Pipeline** | ✅ Passing ([GitHub Actions](https://github.com/Gokul-social/Midnight_proj/actions)) |

---

*Private Payroll & Splits — making financial coordination private by default, verifiable by choice.*

*Built for the Midnight Network Builder Program — New Moon to Full.*
