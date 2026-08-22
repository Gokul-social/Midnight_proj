# Setup Guide — ZK Expense Splitter

> **Network:** Midnight Preprod · **Level 4 MVP**

This guide walks you through running the ZK Expense Splitter locally, from zero to a working proof-generating expense settlement.

---

## Prerequisites

| Component | Required Version | Link |
|-----------|-----------------|------|
| **Node.js** | v22.0.0 or higher | [nodejs.org](https://nodejs.org) |
| **npm** | v10+ (bundled with Node 22) | — |
| **Docker Desktop** | Latest stable | [docker.com](https://www.docker.com) |
| **Compact Toolchain** | v0.31.1 (`compactc`) | [docs.midnight.network](https://docs.midnight.network) |
| **Lace Wallet** | Midnight-enabled version | [DApp Connector Guide](https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/) |
| **Git** | Any recent version | — |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/Gokul-social/Midnight_proj.git
cd Midnight_proj
```

---

## Step 2 — Install Dependencies

```bash
# Install backend/contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

The `postinstall` script (`scripts/patch-cjs.js`) automatically patches the `@midnight-ntwrk` CommonJS bundles for Node.js compatibility.

---

## Step 3 — Configure Environment

```bash
# Copy template to .env
cp .env.example .env
```

Open `.env` and fill in your values:

```env
MIDNIGHT_NETWORK=preprod
MIDNIGHT_INDEXER_URI=https://indexer.preprod-01.midnight.network/api/v1/graphql
MIDNIGHT_NODE_URI=https://rpc.preprod-01.midnight.network
MIDNIGHT_PROOF_SERVER_URI=http://localhost:6300

# Your 24-word BIP-39 mnemonic (required for deployment only)
MIDNIGHT_WALLET_SEED="word1 word2 word3 ... word24"
```

> **Get tDUST (Preprod testnet tokens):** [https://faucet.preprod-01.midnight.network/](https://faucet.preprod-01.midnight.network/)

---

## Step 4 — Start the Midnight Proof Server

The proof server is a Docker container that generates ZK proofs locally on your machine. Private witness data **never leaves this container**.

```bash
docker run -d \
  --name midnight-proof-server \
  -p 6300:6300 \
  midnightntwrk/proof-server:latest
```

Verify it's running:

```bash
curl http://localhost:6300/api/v1/status
# Expected: {"status":"ok"} or similar
```

---

## Step 5 — Run the Test Suite

```bash
npm test
```

Expected output:
```
PASS tests/expense_splitter.test.ts (12.4s)
Tests: 34 passing, 34 total
```

Run with coverage report:

```bash
npm run test:coverage
```

---

## Step 6 — Launch the Frontend

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Step 7 — Connect Your Lace Wallet

1. Install the [Midnight-enabled Lace browser extension](https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/)
2. Open Lace → Settings → **Switch to Midnight Preprod**
3. Fund your wallet from the [Preprod faucet](https://faucet.preprod-01.midnight.network/)
4. Click **"Connect Lace Wallet"** in the app

> **No wallet?** Click **"Try Demo Mode"** — the ZK proof flow is fully simulated, but transactions are local only.

---

## Deploying to Preprod

> Only needed if you want to redeploy the contract with a new address.

```bash
# Prerequisites:
# 1. Docker proof server running (Step 4)
# 2. MIDNIGHT_WALLET_SEED set in .env with tDUST balance
# 3. MIDNIGHT_NETWORK=preprod in .env

npm run deploy
```

On success, `deployment-receipt.json` is updated with the real Preprod contract address. Update `frontend/.env` with the new `VITE_CONTRACT_ADDRESS`.

---

## Troubleshooting

### Lace wallet not detected
- Make sure you installed the **Midnight-enabled** Lace, not the standard Cardano Lace
- Open the extension → click **Enable** for `localhost:5173`
- Check that the network is set to **Preprod** (not Preview or Mainnet)

### Proof server not responding
```bash
# Check if container is running
docker ps | grep midnight-proof-server

# View container logs
docker logs midnight-proof-server

# Restart if needed
docker restart midnight-proof-server
```

### `npm install` fails on Apple Silicon (M1/M2/M3/M4)
```bash
# Install Rosetta if needed for compactc binary
softwareupdate --install-rosetta

# Or use nvm to ensure Node 22
nvm install 22 && nvm use 22
```

### TypeScript build errors
```bash
# Clean and rebuild
rm -rf node_modules frontend/node_modules
npm install && cd frontend && npm install
```

---

## Verifying the Live Preprod Contract

Query the contract state directly via the Preprod GraphQL indexer:

```graphql
# Endpoint: https://indexer.preprod-01.midnight.network/api/v1/graphql
query GetContractState {
  contract(address: "02a8b4cc52da38640550b4e8898725ea6ff6e12c86278a4bb470358ebf524634") {
    state {
      total_settled
      settlement_count
      group_debt_hash
      is_initialized
    }
  }
}
```

Expected (after initialization):
```json
{
  "data": {
    "contract": {
      "state": {
        "total_settled": "0",
        "settlement_count": "0",
        "is_initialized": true
      }
    }
  }
}
```
