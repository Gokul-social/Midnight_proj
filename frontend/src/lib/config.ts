/**
 * Contract configuration — addresses and network settings.
 * This is the bridge between the compiled Compact contract and the frontend.
 */

export const CONTRACT_CONFIG = {
  /** Deployed contract address on Midnight Preprod */
  address: 'pp1c7465616d2d64696e6e65e8a28ff4zk2025',

  /** Network configuration */
  network: {
    name: 'Preprod' as const,
    id: 'TestNet' as const,
    indexerUri: 'https://indexer.preprod-01.midnight.network/api/v1/graphql',
    proofServerUri: 'https://proof-server.preprod-01.midnight.network',
    nodeUri: 'https://rpc.preprod-01.midnight.network',
  },

  /** Contract metadata */
  contract: {
    name: 'zk_expense_splitter',
    version: '1.0.0',
    circuits: {
      impure: ['initialize_group', 'settle_expense', 'batch_settle'] as const,
      pure: ['verify_settlement_count'] as const,
    },
  },

  /** Proof server (local Docker for development) */
  localProofServer: {
    uri: 'http://localhost:6300',
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
