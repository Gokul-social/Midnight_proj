/**
 * Midnight DApp Connector — Wallet Integration
 *
 * This module handles the integration with the Lace wallet's Midnight
 * DApp Connector API (CIP-30 compatible). It provides:
 *
 * 1. Detection of the Lace wallet extension
 * 2. Requesting wallet connection permissions
 * 3. Reading the connected address and network
 * 4. Handling connection lifecycle (connect/disconnect/reconnect)
 *
 * The DApp Connector follows the Midnight specification:
 *   window.midnight.mnLace.enable() → WalletAPI
 *
 * On Preprod, the wallet address prefix is typically "pp1_..."
 */

/** The shape of the Midnight DApp Connector injected by Lace */
export interface MidnightDAppConnector {
  mnLace: {
    enable: () => Promise<MidnightWalletAPI>;
    isEnabled: () => Promise<boolean>;
    apiVersion: string;
    name: string;
    icon: string;
  };
}

/** Wallet API handle returned after enable() */
export interface MidnightWalletAPI {
  getAddress: () => Promise<string>;
  getNetworkId: () => Promise<string>;
  getBalance: () => Promise<string>;
  submitTx: (txHex: string) => Promise<string>;
}

/**
 * Detect if the Lace wallet Midnight DApp connector is available.
 * The extension injects `window.midnight` when active.
 */
export function detectLaceWallet(): MidnightDAppConnector | null {
  if (typeof window === 'undefined') return null;
  const midnight = (window as unknown as Record<string, unknown>).midnight;
  if (midnight && typeof midnight === 'object' && 'mnLace' in midnight) {
    return midnight as unknown as MidnightDAppConnector;
  }
  return null;
}

/**
 * Request connection to the Lace wallet.
 * Returns a WalletAPI handle on success.
 */
export async function connectLaceWallet(): Promise<{
  api: MidnightWalletAPI;
  address: string;
  networkId: string;
} | null> {
  const connector = detectLaceWallet();
  if (!connector) return null;

  try {
    const api = await connector.mnLace.enable();
    const address = await api.getAddress();
    const networkId = await api.getNetworkId();
    return { api, address, networkId };
  } catch (err) {
    // User rejected the connection request, or extension error
    throw new Error(
      `Lace wallet connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if the Lace wallet is already connected (previously authorized).
 */
export async function isLaceConnected(): Promise<boolean> {
  const connector = detectLaceWallet();
  if (!connector) return false;
  try {
    return await connector.mnLace.isEnabled();
  } catch {
    return false;
  }
}

/**
 * Simulate a wallet connection for development/demo when Lace is not available.
 * Returns a deterministic address based on the current timestamp.
 */
export async function simulateWalletConnection(delayMs = 1500): Promise<{
  address: string;
  networkId: string;
  balance: string;
}> {
  await new Promise(r => setTimeout(r, delayMs));

  const address = `pp1_${Array.from({ length: 48 }, (_, i) =>
    '0123456789abcdef'[(i * 7 + Date.now()) % 16]
  ).join('')}`;

  return {
    address,
    networkId: 'TestNet',
    balance: '1,250.00 tDUST',
  };
}
