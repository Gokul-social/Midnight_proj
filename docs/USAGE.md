# Usage Guide — ZK Expense Splitter

> **Network:** Midnight Preprod · **Live App:** [midnight-proj-two.vercel.app](https://midnight-proj-two.vercel.app)

This guide explains how to use the ZK Expense Splitter as an end user — no technical background required.

---

## What Is ZK Expense Splitter?

ZK Expense Splitter lets a group of people settle shared expenses **without revealing individual amounts to anyone** — not even to the blockchain.

**Example scenario:**
- Alice, Bob, Carol, and Dave went on a trip and shared expenses
- Alice spent ₹5,000 · Bob ₹3,200 · Carol ₹4,100 · Dave ₹2,800
- Using ZK Expense Splitter, each person can prove they paid their share on-chain
- The blockchain only records: *"4 settlements occurred, total aggregate: 15,100"*
- No one — not the other members, not blockchain analysts — can see who paid what

---

## Quick Start (3 Steps)

### 1. Connect Your Wallet

Open [midnight-proj-two.vercel.app](https://midnight-proj-two.vercel.app) and click **"Connect Lace Wallet"**.

**Requirements:**
- [Midnight-enabled Lace](https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/) browser extension
- Wallet set to **Midnight Preprod** network
- Some tNIGHT from the [Preprod faucet](https://faucet.preprod-01.midnight.network/)

**No wallet?** Click **"Try Demo Mode"** — you can experience the full UI without a real wallet.

### 2. Enter Your Private Expense Amount

In the **Settle Expense** panel on the right:

1. Enter your expense amount in micro-units (e.g., `50000` = 0.05 units)
2. Use the quick-select buttons: **10K / 50K / 100K / 500K**
3. Click **"Generate ZK Proof & Settle"**

> 🔒 **Privacy guarantee:** Your amount is stored only in your browser's local memory and sent to the local Docker proof server. It never appears on the blockchain.

### 3. Confirm & Verify

After the proof is generated:
- Your Lace wallet will ask for transaction approval
- Confirm the transaction
- The **Public Ledger** panel updates:
  - `settlement_count` increments by 1
  - `total_settled` increases by your (private) amount
- Click **"Verify On-Chain"** to query the Preprod indexer directly

---

## Understanding the Interface

### Public Ledger Panel

Shows the **on-chain state** — visible to everyone:

| Field | Description |
|-------|-------------|
| `Total Settled` | Cumulative micro-units settled by all participants |
| `Settlements` | Number of verified settlement transactions |
| `Debt Hash` | SHA-256 commitment to the group's expense agreement |
| `Status` | `Active` = contract initialized and accepting settlements |

### Settle Expense Form

The **private side** of the app:

| Field | Description |
|-------|-------------|
| Amount input | Your private expense (stays in local memory) |
| Proof status | Tracks ZK proof generation progress |
| Transaction hash | On-chain confirmation (after settlement) |

### Privacy Claim Panel

A live visualization showing exactly **what is private** vs **what is public**:

- 🔒 **PRIVATE (never on-chain):** `expense_amount`, `member_secret`, raw transaction inputs
- 🌐 **PUBLIC (on-chain via disclose()):** `total_settled`, `settlement_count`, `group_debt_hash`

### Privacy Audit Log

A real-time log that records every action and its privacy classification — useful for verifying the privacy model is working correctly.

---

## Batch Settlement (Group Round)

For settling a complete round where 4 members' contributions must collectively meet a threshold:

1. Click **"Batch Settle"** in the form
2. Enter each member's private amount (4 values)
3. The ZK circuit proves the **sum exceeds the minimum threshold** without revealing individual amounts
4. One transaction represents the entire round

---

## Privacy Model — What You Need to Know

```
What you input        →  Stays in your browser memory only
  ↓
Proof server          →  Runs the ZK circuit locally (Docker on your machine)
  ↓                      Proves: "amount > 0 AND no overflow"
                          WITHOUT revealing the actual amount
ZK Proof generated    →  Only the proof + public state delta leave your device
  ↓
Midnight Preprod      →  Verifies the proof on-chain
  ↓                      Updates: total_settled, settlement_count
What the chain sees   →  "The total increased" — not by how much from whom
```

---

## Checking Your Transaction on the Explorer

After a successful settlement, a link appears in the **Transaction Scanner** panel:

```
→ Query Contract State  (opens Preprod GraphQL indexer)
→ Copy Tx: <your transaction hash>
```

You can independently verify:
```graphql
query {
  contract(address: "02a8b4cc52da38640550b4e8898725ea6ff6e12c86278a4bb470358ebf524634") {
    state {
      total_settled
      settlement_count
      is_initialized
    }
  }
}
```

---

## FAQ

**Q: Can the app operator see my expense amount?**  
A: No. The amount is consumed by the ZK proof circuit and never sent to any server. The Vercel-hosted frontend is purely a UI — it never receives your private input.

**Q: What if I close the browser mid-proof?**  
A: The proof generation is atomic. If interrupted, no transaction is submitted. Simply retry.

**Q: Why do I need Docker locally?**  
A: The proof server runs on your machine to ensure your private witnesses never leave your device. This is by design — the privacy guarantee depends on it.

**Q: What is a micro-unit?**  
A: Midnight uses micro-units (1 unit = 1,000,000 micro-units), similar to satoshis in Bitcoin. The contract cap is 1,000,000,000 micro-units (1,000 units) per settlement.

**Q: Is this production-ready?**  
A: This is an MVP deployed on the Midnight Preprod (testnet) network. It demonstrates the core privacy model. Mainnet deployment is a future roadmap item.
