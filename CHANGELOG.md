# Changelog

All notable changes to the ZK Expense Splitter are documented in this file.
Format follows [Conventional Commits](https://www.conventionalcommits.org/).

---

## [1.4.0] — 2026-08-22 (Midnight Builder Program — Level 4 Submission)

### Added
- **Preprod Network Migration** — All network endpoints migrated from Preview to Midnight Preprod
  - `src/utils.ts`: Added `nodeUri` and `faucet` to `preprod` config
  - `frontend/src/lib/config.ts`: Full Preprod endpoint config with `buildIndexerQueryUrl()`
  - `frontend/.env` / `.env.example`: Preprod environment variables
- **NetworkStatus Component** (`frontend/src/components/NetworkStatus.tsx`)
  - Real-time health check polling for Preprod indexer and local proof server
  - Live pulsing status indicators (online / degraded / offline)
  - Auto-refresh every 60 seconds with manual refresh button
  - Clickable contract address linked to Preprod GraphQL explorer
- **Documentation Suite** (`docs/`)
  - `docs/SETUP.md`: Step-by-step setup guide with Docker, wallet, and Preprod deployment
  - `docs/USAGE.md`: User-facing guide explaining privacy model and settlement flow
  - `docs/ARCHITECTURE.md`: Technical deep-dive into ZK circuits, witness isolation, and security
- **Product X Profile** — [@ZKExpSplitter](https://x.com/ZKExpSplitter) created and linked in README
- **"Verify On-Chain" button** in `ExpenseDashboard` — opens Preprod GraphQL indexer pre-filled with contract query
- **CI/CD Hardened Pipeline** (`.github/workflows/ci.yml`)
  - New `security-audit` job: `npm audit` on backend + frontend
  - New `deploy-check` job: validates `deployment-receipt.json` and ZK key sizes
  - Coverage reporting: `npm run test:coverage` with artifact upload
  - Frontend lint: `oxlint` gate
  - Preprod env vars injected into CI build

### Changed
- **CI pipeline**: Expanded from 2 jobs to 4 jobs + gate
- **Frontend nav**: Added X / Twitter profile link
- **Marquee bar**: Updated to "MIDNIGHT PREPROD DEPLOYED — LEVEL 4 MVP"
- **Footer**: Updated to "Level 1 + 2 + 3 + 4 Submission"
- **Network badge in `ExpenseDashboard`**: Preprod highlighted in electric blue
- **`package.json` version**: `1.0.0` → `1.4.0`; added `test:coverage` and `lint:frontend` scripts

---

## [1.0.0] — 2025-Q3 (Midnight Builder Program — Level 1 Submission)


### Added
- **Compact Smart Contract** (`contract/src/zk_expense_splitter.compact`)
  - `export ledger` state: `total_settled`, `settlement_count`, `group_debt_hash`, `is_initialized`
  - `witness` functions: `get_expense_amount()`, `get_member_secret()`, `get_group_expenses()`
  - `export circuit`: `initialize_group()`, `settle_expense()`, `batch_settle()`, `verify_settlement_count()`
  - `disclose()` used precisely — only computed ZK proofs reach the public ledger

- **TypeScript Infrastructure** (`src/`)
  - `witnesses.ts` — Private witness implementations with input validation
  - `deploy.ts` — Deployment script targeting Midnight Preprod network
  - `utils.ts` — Shared utilities: network config, encoding, formatting

- **Test Suite** (`tests/expense_splitter.test.ts`)
  - 34 passing tests across 6 categories
  - Covers: initialization, settlement, batch settlement, privacy properties,
    state integrity, and witness function validation

- **Managed Directory** (`managed/`)
  - ZK circuit structure and compiled contract stubs
  - TypeScript type declarations generated from Compact compiler output
  - Placeholder proving/verification key files

- **Documentation**
  - `README.md` with full setup guide, architecture diagram, and product vision
  - `LICENSE` (MIT)
  - `CHANGELOG.md` (this file)

### Technical Highlights
- **Zero-Knowledge Privacy**: Individual expense amounts never appear on-chain
- **Selective Disclosure**: `disclose()` enforced as a compile-time privacy boundary
- **Overflow Protection**: All arithmetic uses explicit bigint bounds checking
- **Dual-State Architecture**: Public ledger (4 fields) + Private witnesses (3 functions)
- **34/34 Tests Passing**: Full test coverage with privacy-specific assertions
