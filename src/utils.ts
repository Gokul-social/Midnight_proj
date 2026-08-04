/**
 * ZK Expense Splitter — Utility Functions
 *
 * Shared helper utilities for encoding/decoding Midnight data types,
 * formatting bigint values, and creating provider configurations.
 */

/**
 * Network configuration presets for different Midnight environments.
 */
export const NETWORK_CONFIG = {
  local: {
    indexerUri: 'http://localhost:8088/api/v1/graphql',
    proofServerUri: 'http://localhost:6300',
    networkId: 'undeployed' as const,
  },
  preview: {
    indexerUri: 'https://indexer.preview.midnight.network/api/v1/graphql',
    proofServerUri: 'https://proof-server.preview.midnight.network',
    nodeUri: 'https://rpc.preview.midnight.network',
    networkId: 'TestNet' as const,
    faucet: 'https://faucet.preview.midnight.network/',
  },
  preprod: {
    indexerUri: 'https://indexer.preprod-01.midnight.network/api/v1/graphql',
    proofServerUri: 'https://proof-server.preprod-01.midnight.network',
    networkId: 'TestNet' as const,
  },
  mainnet: {
    indexerUri: 'https://indexer.midnight.network/api/v1/graphql',
    proofServerUri: 'https://proof-server.midnight.network',
    networkId: 'MainNet' as const,
  },
} as const;

export type NetworkName = keyof typeof NETWORK_CONFIG;

/**
 * Format a bigint micro-unit value as a human-readable decimal string.
 * Midnight amounts are in micro-units (1 unit = 1,000,000 micro-units).
 *
 * @example
 * formatMicroUnits(1500000n) // "1.500000"
 */
export const formatMicroUnits = (microUnits: bigint, symbol = ''): string => {
  const wholePart = microUnits / 1_000_000n;
  const fracPart = microUnits % 1_000_000n;
  const fracStr = fracPart.toString().padStart(6, '0');
  return `${wholePart}.${fracStr}${symbol ? ' ' + symbol : ''}`;
};

/**
 * Convert a hex string to a Uint8Array (for group debt hashes).
 */
export const hexToBytes = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = hex.slice(i * 2, i * 2 + 2);
    bytes[i] = parseInt(byte, 16);
  }
  return bytes;
};

/**
 * Convert a Uint8Array to a hex string representation.
 */
export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Pad a 32-byte Uint8Array from a string (used for group IDs).
 */
export const stringToBytes32 = (str: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  bytes.set(encoded.slice(0, 32));
  return bytes;
};

/**
 * Sleep utility for async operations (e.g., waiting for proof generation).
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates that an address string looks like a valid Midnight contract address.
 * Real validation is done by the SDK — this is a basic sanity check.
 */
export const isValidContractAddress = (address: string): boolean => {
  return typeof address === 'string' && address.length >= 32 && address.length <= 128;
};
