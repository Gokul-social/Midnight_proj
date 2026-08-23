/**
 * Contract configuration — addresses and network settings.
 * This is the bridge between the compiled Compact contract and the frontend.
 *
 * Contract address and network URIs are injected from .env at build time
 * via Vite's import.meta.env mechanism (VITE_* prefix required).
 *
 * Network: Midnight Preprod (Level 4 — August 2026)
 * Faucet:  https://faucet.preprod.midnight.network/
 * Indexer: https://indexer.preprod.midnight.network/api/v4/graphql
 */

/** The deployed contract address — sourced from VITE_CONTRACT_ADDRESS in .env */
const CONTRACT_ADDRESS: string =
  (import.meta.env['VITE_CONTRACT_ADDRESS'] as string | undefined) ??
  '02a8b4cc52da38640550b4e8898725ea6ff6e12c86278a4bb470358ebf524634';

/** Indexer URI — Preprod network */
const INDEXER_URI: string =
  (import.meta.env['VITE_INDEXER_URI'] as string | undefined) ??
  'https://indexer.preprod.midnight.network/api/v4/graphql';

/** Proof server URI — local Docker in dev, or env override */
const PROOF_SERVER_URI: string =
  (import.meta.env['VITE_PROOF_SERVER_URI'] as string | undefined) ??
  'http://localhost:6300';

export const CONTRACT_CONFIG = {
  /** Deployed contract address on Midnight Preprod — from VITE_CONTRACT_ADDRESS */
  address: CONTRACT_ADDRESS,

  /** Network configuration */
  network: {
    name: 'Preprod' as const,
    id: 'TestNet' as const,
    indexerUri: INDEXER_URI,
    proofServerUri: PROOF_SERVER_URI,
    nodeUri: 'https://rpc.preprod.midnight.network',
    faucet: 'https://faucet.preprod.midnight.network/',
    explorerBase: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  },

  /** Contract metadata */
  contract: {
    name: 'zk_expense_splitter',
    version: '1.4.0',
    circuits: {
      impure: ['initialize_group', 'settle_expense', 'batch_settle'] as const,
      pure: ['verify_settlement_count'] as const,
    },
  },

  /** Proof server (local Docker for development) */
  localProofServer: {
    uri: PROOF_SERVER_URI,
    dockerImage: 'midnightntwrk/proof-server:latest',
  },
} as const;

/** Maximum expense amount (contract enforced: 1B micro-units) */
export const MAX_EXPENSE_AMOUNT = 1_000_000_000n;

/** Format bigint as human-readable with commas */
export const formatAmount = (amount: bigint): string => {
  return amount.toLocaleString();
};

/** Format bigint micro-units as decimal */
export const formatMicroUnits = (microUnits: bigint): string => {
  const whole = microUnits / 1_000_000n;
  const frac = (microUnits % 1_000_000n).toString().padStart(6, '0');
  return `${whole.toLocaleString()}.${frac}`;
};

/** Truncate address for display */
export const truncateAddress = (address: string, chars = 8): string => {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/** Build a Preprod indexer GraphQL query URL for a contract */
export const buildIndexerQueryUrl = (contractAddress: string): string => {
  const query = `{ contract(address: "${contractAddress}") { state { total_settled settlement_count group_debt_hash is_initialized } } }`;
  return `${CONTRACT_CONFIG.network.explorerBase}?query=${encodeURIComponent(query)}`;
};

