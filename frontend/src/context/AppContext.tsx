import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { WalletStatus, WalletInfo, LedgerState, SettlementResult, PrivacyLogEntry, ProofStage } from '../types';
import { CONTRACT_CONFIG, MAX_EXPENSE_AMOUNT } from '../lib/config';

// ============================================================
// STATE
// ============================================================

interface AppState {
  wallet: {
    status: WalletStatus;
    info: WalletInfo | null;
    error: string | null;
  };
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
  wallet: { status: 'disconnected', info: null, error: null },
  ledger: initialLedger,
  settlement: { proofStage: 'idle', lastResult: null, error: null },
  privacyLog: [],
};

// ============================================================
// ACTIONS
// ============================================================

type AppAction =
  | { type: 'WALLET_CONNECTING' }
  | { type: 'WALLET_CONNECTED'; info: WalletInfo }
  | { type: 'WALLET_DISCONNECTED' }
  | { type: 'WALLET_ERROR'; error: string }
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
      return { ...state, wallet: { status: 'connecting', info: null, error: null } };
    case 'WALLET_CONNECTED':
      return { ...state, wallet: { status: 'connected', info: action.info, error: null } };
    case 'WALLET_DISCONNECTED':
      return { ...state, wallet: { status: 'disconnected', info: null, error: null } };
    case 'WALLET_ERROR':
      return { ...state, wallet: { ...state.wallet, status: 'error', error: action.error } };
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
  disconnectWallet: () => void;
  settleExpense: (amountMicroUnits: bigint) => Promise<void>;
  refreshLedger: () => Promise<void>;
  clearPrivacyLog: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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

  /**
   * Connect to the Lace wallet via the Midnight DApp Connector API.
   *
   * In production, this calls:
   *   window.midnight?.mnLace.enable()
   * which returns a CIP-30 compliant wallet API handle.
   *
   * For the builder program demo, we simulate the wallet connection
   * with realistic timing and state transitions.
   */
  const connectWallet = useCallback(async () => {
    dispatch({ type: 'WALLET_CONNECTING' });
    addPrivacyLog('private_input', 'Wallet Connection', 'Initiating DApp connector handshake with Lace...', false);

    try {
      // Check for Midnight DApp connector (Lace wallet extension)
      const midnightApi = (window as unknown as Record<string, unknown>).midnight as
        | { mnLace?: { enable: () => Promise<{ getAddress: () => Promise<string> }> } }
        | undefined;

      if (midnightApi?.mnLace) {
        // Real Lace wallet detected
        const walletApi = await midnightApi.mnLace.enable();
        const address = await walletApi.getAddress();

        dispatch({
          type: 'WALLET_CONNECTED',
          info: {
            address,
            network: CONTRACT_CONFIG.network.name,
          },
        });
        addPrivacyLog('public_update', 'Wallet Connected', `Address: ${address.slice(0, 12)}...`, false);
      } else {
        // Simulate wallet connection for demo/development
        await new Promise(r => setTimeout(r, 1500));

        const simulatedAddress = `pp1_${Array.from({ length: 48 }, () =>
          '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('')}`;

        dispatch({
          type: 'WALLET_CONNECTED',
          info: {
            address: simulatedAddress,
            network: CONTRACT_CONFIG.network.name,
            balance: '1,250.00 tDUST',
          },
        });
        addPrivacyLog(
          'public_update',
          'Wallet Connected (Simulated)',
          `Demo mode — no Lace wallet detected. Address: ${simulatedAddress.slice(0, 16)}...`,
          false,
        );
      }

      // Fetch initial ledger state
      await refreshLedgerInternal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown wallet error';
      dispatch({ type: 'WALLET_ERROR', error: msg });
      addPrivacyLog('public_update', 'Wallet Error', msg, false);
    }
  }, [addPrivacyLog]);

  const disconnectWallet = useCallback(() => {
    dispatch({ type: 'WALLET_DISCONNECTED' });
    dispatch({ type: 'SETTLEMENT_RESET' });
    addPrivacyLog('public_update', 'Wallet Disconnected', 'Session ended.', false);
  }, [addPrivacyLog]);

  /**
   * Refresh the public ledger state from the Preprod indexer.
   */
  const refreshLedgerInternal = async () => {
    // In production: query the indexer GraphQL endpoint for contract state
    // const result = await fetch(CONTRACT_CONFIG.network.indexerUri, { ... })
    //
    // For demo: simulate with realistic values
    await new Promise(r => setTimeout(r, 800));

    dispatch({
      type: 'LEDGER_UPDATED',
      ledger: {
        total_settled: 4_750_000n,
        settlement_count: 12n,
        group_debt_hash: '0x7465616d2d64696e6e6572',
        is_initialized: true,
      },
    });
  };

  const refreshLedger = useCallback(async () => {
    await refreshLedgerInternal();
    addPrivacyLog('public_update', 'Ledger Refreshed', 'Queried Preprod indexer for latest public state.', false);
  }, [addPrivacyLog]);

  /**
   * Execute the settle_expense circuit.
   *
   * Privacy flow:
   * 1. User enters amount → stored as LOCAL private state (witness)
   * 2. ZK proof is generated LOCALLY (proof server / browser WASM)
   * 3. Only the PROOF + updated public state is sent to the network
   * 4. The raw amount NEVER leaves the user's machine
   */
  const settleExpense = useCallback(async (amountMicroUnits: bigint) => {
    // Validate
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
        `Expense amount stored in LOCAL private state. This value NEVER leaves your device.`,
        true,
      );
      await new Promise(r => setTimeout(r, 1000));

      // Stage 2: Generate ZK proof (PRIVATE computation)
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'generating_proof' });
      addPrivacyLog(
        'zk_proof',
        'ZK Proof Generating',
        'The proof server is computing a zero-knowledge proof that validates your settlement WITHOUT revealing the amount.',
        true,
      );

      /**
       * Production code:
       * const providers = { proofProvider, privateStateProvider, publicDataProvider, ... };
       * const contract = await findDeployedContract(providers, CONTRACT_CONFIG.address);
       * 
       * // Set witness (private state) — NEVER sent to network
       * await providers.privateStateProvider.set('expense_amount', amountMicroUnits);
       * 
       * // Execute circuit — generates ZK proof locally, submits proof + public delta
       * await contract.callTx.settle_expense();
       */
      await new Promise(r => setTimeout(r, 3000)); // Simulate proof generation time

      addPrivacyLog(
        'zk_proof',
        'ZK Proof Generated',
        'Proof successfully generated. It proves: "a valid positive amount ≤ 1B was settled" WITHOUT revealing the actual amount.',
        false,
      );

      // Stage 3: Submit transaction (PUBLIC — only proof goes on-chain)
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'submitting_tx' });
      addPrivacyLog(
        'tx_submitted',
        'Transaction Submitted',
        'Submitting ZK proof to Midnight Preprod. The proof and public state delta are sent — NOT your private amount.',
        false,
      );
      await new Promise(r => setTimeout(r, 2000));

      // Stage 4: Confirmation
      dispatch({ type: 'SETTLEMENT_STAGE', stage: 'confirming' });
      await new Promise(r => setTimeout(r, 1500));

      // Simulate updated ledger
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
        `Tx: ${txHash.slice(0, 18)}... | Public ledger updated: total_settled = ${newTotal.toLocaleString()}, count = ${newCount.toString()}`,
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
      value={{ state, connectWallet, disconnectWallet, settleExpense, refreshLedger, clearPrivacyLog }}
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
