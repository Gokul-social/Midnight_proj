# Changelog

All notable changes to the ZK Expense Splitter are documented in this file.
Format follows [Conventional Commits](https://www.conventionalcommits.org/).

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
