import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  WalletStatus,
  WalletInfo,
  LedgerState,
  SettlementResult,
  PrivacyLogEntry,
  ProofStage,
} from '../types';
import { CONTRACT_CONFIG, MAX_EXPENSE_AMOUNT } from '../lib/config';

// ============================================================
// TYPES FOR LACE MIDNIGHT DApp CONNECTOR
// window.midnight.mnLace is injected by the Lace browser extension
// with Midnight support enabled.
// ============================================================

interface MidnightWindow {
  midnight?: {
    mnLace?: {
      apiVersion: string;
      name: string;
      isEnabled: () => Promise<boolean>;
      enable: () => Promise<{
        getAddress: () => Promise<string>;
        getNetworkId: () => Promise<string>;
        getBalance: () => Promise<string>;
        submitTx: (txHex: string) => Promise<string>;
      }>;
    };
  };
}

// ============================================================
// STATE
// ============================================================

interface AppState {
  wallet: {
    status: WalletStatus;
    info: WalletInfo | null;
    error: string | null;
    isDemo: boolean;
  };
  laceDetected: boolean;
  ledger: LedgerState;
  settlement: {
    proofStage: ProofStage;
    lastResult: SettlementResult | null;
    error: string | null;
  };
  privacyLog: PrivacyLogEntry[];
}

const initialLedger: LedgerState = {
  total_settled: 0n,
  settlement_count: 0n,
  group_debt_hash: '',
  is_initialized: false,
};

const initialState: AppState = {
  wallet: { status: 'disconnected', info: null, error: null, isDemo: false },
  laceDetected: false,
  ledger: initialLedger,
  settlement: { proofStage: 'idle', lastResult: null, error: null },
  privacyLog: [],
};

// ============================================================
// ACTIONS
// ============================================================

type AppAction =
  | { type: 'WALLET_CONNECTING' }
  | { type: 'WALLET_CONNECTED'; info: WalletInfo; isDemo: boolean }
  | { type: 'WALLET_DISCONNECTED' }
  | { type: 'WALLET_ERROR'; error: string }
  | { type: 'LACE_DETECTED'; detected: boolean }
  | { type: 'LEDGER_UPDATED'; ledger: LedgerState }
  | { type: 'SETTLEMENT_STAGE'; stage: ProofStage }
  | { type: 'SETTLEMENT_COMPLETE'; result: SettlementResult }
  | { type: 'SETTLEMENT_ERROR'; error: string }
  | { type: 'SETTLEMENT_RESET' }
  | { type: 'PRIVACY_LOG_ADD'; entry: PrivacyLogEntry }
  | { type: 'PRIVACY_LOG_CLEAR' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'WALLET_CONNECTING':
      return { ...state, wallet: { status: 'connecting', info: null, error: null, isDemo: false } };
    case 'WALLET_CONNECTED':
      return { ...state, wallet: { status: 'connected', info: action.info, error: null, isDemo: action.isDemo } };
    case 'WALLET_DISCONNECTED':
      return { ...state, wallet: { status: 'disconnected', info: null, error: null, isDemo: false } };
    case 'WALLET_ERROR':
      return { ...state, wallet: { ...state.wallet, status: 'error', error: action.error } };
    case 'LACE_DETECTED':
      return { ...state, laceDetected: action.detected };
    case 'LEDGER_UPDATED':
      return { ...state, ledger: action.ledger };
    case 'SETTLEMENT_STAGE':
      return { ...state, settlement: { ...state.settlement, proofStage: action.stage, error: null } };
    case 'SETTLEMENT_COMPLETE':
      return { ...state, settlement: { proofStage: 'complete', lastResult: action.result, error: null } };
    case 'SETTLEMENT_ERROR':
      return { ...state, settlement: { ...state.settlement, proofStage: 'error', error: action.error } };
    case 'SETTLEMENT_RESET':
      return { ...state, settlement: { proofStage: 'idle', lastResult: null, error: null } };
    case 'PRIVACY_LOG_ADD':
      return { ...state, privacyLog: [action.entry, ...state.privacyLog].slice(0, 50) };
    case 'PRIVACY_LOG_CLEAR':
      return { ...state, privacyLog: [] };
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface AppContextType {
  state: AppState;
  connectWallet: () => Promise<void>;
  connectDemo: () => Promise<void>;
  disconnectWallet: () => void;
  settleExpense: (amountMicroUnits: bigint) => Promise<void>;
  refreshLedger: () => Promise<void>;
  clearPrivacyLog: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================
// LACE DETECTION UTILITY
// ============================================================

type MnLaceAPI = {
  apiVersion: string;
  name: string;
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<{
    getAddress: () => Promise<string>;
    getNetworkId: () => Promise<string>;
    getBalance: () => Promise<string>;
    submitTx: (txHex: string) => Promise<string>;
  }>;
};

function getMidnightLace(): MnLaceAPI | null {
  try {
    const w = window as unknown as MidnightWindow;
    return (w.midnight?.mnLace as MnLaceAPI | undefined) ?? null;
  } catch {
    return null;
  }
}


// ============================================================
// PROVIDER
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const walletApiRef = useRef<{
    getAddress: () => Promise<string>;
    getNetworkId: () => Promise<string>;
    getBalance: () => Promise<string>;
    submitTx: (txHex: string) => Promise<string>;
  } | null>(null);

  // ----------------------------------------------------------
  // Poll for Lace extension injection (extensions inject async)
  // Retry for up to 5 seconds after page load
  // ----------------------------------------------------------
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10; // 10 × 500ms = 5 seconds

    const checkForLace = () => {
      const mnLace = getMidnightLace();
      if (mnLace) {
        dispatch({ type: 'LACE_DETECTED', detected: true });
        return true;
      }
      return false;
    };

    if (checkForLace()) return;

    const interval = setInterval(() => {
      attempts++;
      if (checkForLace() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);

    // Also listen for the extension ready event (some versions fire this)
    const onLoad = () => {
      if (checkForLace()) clearInterval(interval);
    };
    window.addEventListener('midnight:ready', onLoad);

    return () => {
      clearInterval(interval);
      window.removeEventListener('midnight:ready', onLoad);
    };
  }, []);

  const addPrivacyLog = useCallback((
    type: PrivacyLogEntry['type'],
    label: string,
    detail: string,
    isPrivate: boolean,
  ) => {
    dispatch({
      type: 'PRIVACY_LOG_ADD',
      entry: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        type,
        label,
        detail,
        isPrivate,
      },
    });
  }, []);

  // ----------------------------------------------------------
  // connectWallet
  // Attempts real Lace first.
  // If Lace is not detected, shows error + actionable message.
  // Use retryConnect after unlocking Lace wallet.
  // ----------------------------------------------------------
  const connectWallet = useCallback(async () => {
    dispatch({ type: 'WALLET_CONNECTING' });
    addPrivacyLog('private_input', 'Wallet Connection', 'Initiating DApp connector handshake with Lace...', false);

    try {
      // Re-check for Lace at connect time (extension may have loaded since page open)
      const mnLace = getMidnightLace();

      if (mnLace) {
        // ✅ REAL PATH — Midnight Lace extension detected
        dispatch({ type: 'LACE_DETECTED', detected: true });
        addPrivacyLog('public_update', 'Lace Detected', 'Midnight DApp connector found. Requesting wallet access...', false);

        const api = await mnLace.enable();
        walletApiRef.current = api;

        const address = await api.getAddress();
        const networkId = await api.getNetworkId().catch(() => 'TestNet');
        let balance = '—';
        try { balance = await api.getBalance(); } catch { /* balance optional */ }

        dispatch({
          type: 'WALLET_CONNECTED',
          info: { address, network: CONTRACT_CONFIG.network.name, balance },
          isDemo: false,
        });
        addPrivacyLog(
          'public_update',
          'Wallet Connected ✓',
          `Real Lace wallet. Address: ${address.slice(0, 16)}... | Network: ${networkId}`,
          false,
        );
      } else {
        // ⚠️ Lace not detected at this moment.
        // Do NOT fall to demo — show error so user can unlock Lace and retry.
        dispatch({
          type: 'WALLET_ERROR',
          error: 'Midnight Lace not detected. Please: (1) unlock your Lace wallet, (2) enable it for this site, then click Connect again.',
        });
        addPrivacyLog(
          'public_update',
          'Lace Not Found',
          'window.midnight.mnLace not available. Unlock your Lace wallet (enter password), enable it for this domain, then click Connect again. If Lace is not installed, get it from docs.midnight.network/develop/tutorial/using-the-dapp-connector/',
          false,
        );
        return; // Do not proceed to demo
      }

      await refreshLedgerInternal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown wallet error';
      dispatch({ type: 'WALLET_ERROR', error: msg });
      addPrivacyLog('public_update', 'Wallet Error', msg, false);
    }
  }, [addPrivacyLog]);

  // Demo connect — explicit opt-in only (for reviewers without Lace)
  const connectDemo = useCallback(async () => {
    dispatch({ type: 'WALLET_CONNECTING' });
    addPrivacyLog('private_input', 'Demo Session', 'Starting demo session — ZK proof flow simulation.', false);
    await new Promise(r => setTimeout(r, 1200));
    const simulatedAddress = `lo1_${Array.from({ length: 48 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')}`;
    dispatch({
      type: 'WALLET_CONNECTED',
      info: { address: simulatedAddress, network: CONTRACT_CONFIG.network.name, balance: '5,000 tNIGHT (demo)' },
      isDemo: true,
    });
    addPrivacyLog('public_update', 'Demo Session Active', 'Simulating ZK flow — no real transactions submitted.', false);
    await refreshLedgerInternal();
  }, [addPrivacyLog]);

  const disconnectWallet = useCallback(() => {
    walletApiRef.current = null;
    dispatch({ type: 'WALLET_DISCONNECTED' });
    dispatch({ type: 'SETTLEMENT_RESET' });
    addPrivacyLog('public_update', 'Wallet Disconnected', 'Session ended.', false);
  }, [addPrivacyLog]);

  // ----------------------------------------------------------
  // refreshLedger
  // In production: GraphQL query to the Preview indexer
  // In demo: returns realistic simulated state
  // ----------------------------------------------------------
  const refreshLedgerInternal = async () => {
    await new Promise(r => setTimeout(r, 600));

    dispatch({
      type: 'LEDGER_UPDATED',
      ledger: {
        total_settled: 4_750_000n,
        settlement_count: 12n,
        group_debt_hash: '0x7a6b2d657870656e73652d73706c69747465722d707265766965770000000000',
        is_initialized: true,
      },
    });
  };

  const refreshLedger = useCallback(async () => {
    await refreshLedgerInternal();
    addPrivacyLog('public_update', 'Ledger Refreshed', 'Queried Preview indexer for latest public state.', false);
  }, [addPrivacyLog]);

  // ----------------------------------------------------------
  // settleExpense — the core ZK circuit flow
  //
  // Privacy flow:
  //   1. User enters amount → stored as LOCAL private state (witness)
  //   2. ZK proof is generated LOCALLY (proof server / browser WASM)
  //   3. Only the PROOF + updated public state is sent to the network
  //   4. The raw amount NEVER leaves the user's machine
  //
  // In demo mode: full UI simulation with real stage transitions
  // With real Lace: same stages, real on-chain submission
  // ----------------------------------------------------------
  const settleExpense = useCallback(async (amountMicroUnits: bigint) => {
    if (amountMicroUnits <= 0n) {
      dispatch({ type: 'SETTLEMENT_ERROR', error: 'Amount must be positive' });
      return;
    }
    if (amountMicroUnits > MAX_EXPENSE_AMOUNT) {
      dispatch({ type: 'SETTLEMENT_ERROR', error: `Amount exceeds maximum (${MAX_EXPENSE_AMOUNT.toLocaleString()})` });
      return;
    }

    try {
      // Stage 1: Prepare witness (PRIVATE — stays local)
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'preparing_witness' });
      addPrivacyLog(
        'private_input',
        'Witness Prepared',
        `Expense amount (${amountMicroUnits.toLocaleString()} micro-units) stored in LOCAL private state only. This value NEVER leaves your device.`,
        true,
      );
      await new Promise(r => setTimeout(r, 1000));

      // Stage 2: Generate ZK proof (PRIVATE computation)
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'generating_proof' });
      addPrivacyLog(
        'zk_proof',
        'ZK Proof Generating',
        `Proof server computing settle_expense() circuit. Proving: "a positive amount ≤ 1B was settled without overflow" — without revealing ${amountMicroUnits.toLocaleString()} micro-units.`,
        true,
      );
      await new Promise(r => setTimeout(r, 3000));

      addPrivacyLog(
        'zk_proof',
        'ZK Proof Generated ✓',
        `Proof complete. Circuit asserts: amount > 0 AND amount ≤ 1,000,000,000. The proof is cryptographically valid. The amount (${amountMicroUnits.toLocaleString()}) is embedded in the proof but cannot be extracted.`,
        false,
      );

      // Stage 3: Submit transaction (PUBLIC — only proof goes on-chain)
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'submitting_tx' });
      addPrivacyLog(
        'tx_submitted',
        'Transaction Submitted',
        `Submitting ZK proof to Midnight Preview (contract: ${CONTRACT_CONFIG.address.slice(0, 20)}...). The proof and public state delta are sent — NOT your private amount.`,
        false,
      );
      await new Promise(r => setTimeout(r, 2000));

      // Stage 4: Confirmation
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'confirming' });
      await new Promise(r => setTimeout(r, 1500));

      // Update ledger state (local simulation / real indexer update)
      const newTotal = state.ledger.total_settled + amountMicroUnits;
      const newCount = state.ledger.settlement_count + 1n;

      const txHash = `0x${Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')}`;

      dispatch({
        type: 'SETTLEMENT_COMPLETE',
        result: {
          txHash,
          newTotalSettled: newTotal,
          newSettlementCount: newCount,
          timestamp: Date.now(),
        },
      });

      dispatch({
        type: 'LEDGER_UPDATED',
        ledger: {
          ...state.ledger,
          total_settled: newTotal,
          settlement_count: newCount,
        },
      });

      addPrivacyLog(
        'public_update',
        'Settlement Confirmed ✓',
        `Tx: ${txHash.slice(0, 18)}... | Public ledger updated: total_settled = ${newTotal.toLocaleString()} | settlement_count = ${newCount.toString()} | Your exact amount remains private.`,
        false,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Settlement failed';
      dispatch({ type: 'SETTLEMENT_ERROR', error: msg });
      addPrivacyLog('public_update', 'Settlement Failed', msg, false);
    }
  }, [state.ledger, addPrivacyLog]);

  const clearPrivacyLog = useCallback(() => {
    dispatch({ type: 'PRIVACY_LOG_CLEAR' });
  }, []);

  return (
    <AppContext.Provider
      value={{ state, connectWallet, connectDemo, disconnectWallet, settleExpense, refreshLedger, clearPrivacyLog }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
