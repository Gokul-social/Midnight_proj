/**
 * Midnight DApp Connector — Wallet Integration
 *
 * This module handles integration with the Lace wallet's Midnight
 * DApp Connector API. It provides:
 *
 * 1. Detection of the Lace wallet extension (window.midnight.mnLace)
 * 2. Detection of the standard Lace extension (window.cardano.lace)
 * 3. Requesting wallet connection permissions
 * 4. Reading the connected address and network
 * 5. Handling connection lifecycle (connect/disconnect/reconnect)
 *
 * The DApp Connector follows the Midnight specification:
 *   window.midnight.mnLace.enable() → WalletAPI
 *
 * On Preview network, the wallet address prefix is "lo1_..."
 * On Preprod, the wallet address prefix is "pp1_..."
 *
 * REQUIREMENTS FOR REAL INTEGRATION:
 *   - Lace wallet with Midnight support installed as a browser extension
 *   - Extension enabled on this domain (click the extension → enable)
 *   - Wallet set to "Preview" network (not Preprod)
 *   - tNIGHT tokens in the wallet (from https://faucet.preview.midnight.network/)
 *   - Docker proof server running locally: docker run -p 6300:6300 midnightntwrk/proof-server:latest
 *
 * Install guide: https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/
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
 * Full diagnostic of what wallet APIs are available in the current browser.
 * Useful for debugging why Lace isn't being detected.
 */
export function diagnoseLaceAvailability(): {
  hasMidnightNamespace: boolean;
  hasMnLace: boolean;
  hasCardanoNamespace: boolean;
  hasCardanoLace: boolean;
  recommendation: string;
} {
  if (typeof window === 'undefined') {
    return {
      hasMidnightNamespace: false, hasMnLace: false,
      hasCardanoNamespace: false, hasCardanoLace: false,
      recommendation: 'Running in non-browser environment.',
    };
  }

  const w = window as unknown as Record<string, unknown>;
  const hasMidnightNamespace = typeof w['midnight'] === 'object' && w['midnight'] !== null;
  const hasMnLace = hasMidnightNamespace && 'mnLace' in (w['midnight'] as object);
  const hasCardanoNamespace = typeof w['cardano'] === 'object' && w['cardano'] !== null;
  const hasCardanoLace = hasCardanoNamespace && 'lace' in (w['cardano'] as object);

  let recommendation: string;
  if (hasMnLace) {
    recommendation = 'Midnight Lace detected. Ready to connect.';
  } else if (hasCardanoLace && !hasMnLace) {
    recommendation = 'Standard Lace (Cardano) detected but Midnight API not found. ' +
      'Make sure you have the Midnight-enabled version of Lace installed, ' +
      'and that it is enabled for this domain.';
  } else if (!hasCardanoLace && !hasMnLace) {
    recommendation = 'No Lace wallet detected. Install the Midnight-enabled Lace extension ' +
      'from https://docs.midnight.network/develop/tutorial/using-the-dapp-connector/';
  } else {
    recommendation = 'Unknown wallet state. Try refreshing the page.';
  }

  return { hasMidnightNamespace, hasMnLace, hasCardanoNamespace, hasCardanoLace, recommendation };
}

/**
 * Detect if the Lace wallet Midnight DApp connector is available.
 * The Midnight-enabled Lace extension injects `window.midnight` when active.
 */
export function detectLaceWallet(): MidnightDAppConnector | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  const midnight = w['midnight'];
  if (midnight && typeof midnight === 'object' && 'mnLace' in midnight) {
    return midnight as unknown as MidnightDAppConnector;
  }
  return null;
}

/**
 * Request connection to the Lace wallet.
 * Returns a WalletAPI handle on success, or null if Lace is not available.
 *
 * If this returns null, call diagnoseLaceAvailability() for details on why.
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
 * Returns a Preview-style address (lo1_ prefix) to reflect the correct network.
 *
 * NOTE: This is ONLY for UI demonstration when the real Lace extension is absent.
 * Real transactions require the actual Lace extension + local Docker proof server.
 */
export async function simulateWalletConnection(delayMs = 1500): Promise<{
  address: string;
  networkId: string;
  balance: string;
}> {
  await new Promise(r => setTimeout(r, delayMs));

  // Preview network addresses use "lo1_" prefix
  const address = `lo1_${Array.from({ length: 48 }, (_, i) =>
    '0123456789abcdef'[(i * 7 + Date.now()) % 16]
  ).join('')}`;

  return {
    address,
    networkId: 'TestNet',
    balance: '5,000 tNIGHT',
  };
}
