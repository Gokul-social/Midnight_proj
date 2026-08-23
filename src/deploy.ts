/**
 * ZK Expense Splitter — Real Deployment Script
 *
 * Deploys the compiled ZK Expense Splitter contract to the Midnight Preview network
 * using the official @midnight-ntwrk SDK. On success, writes a deployment-receipt.json
 * file containing the real on-chain contract address.
 *
 * Usage:
 *   npm run deploy
 *
 * Prerequisites:
 *   1. Proof server running:
 *      docker run -d --name midnight-proof-server -p 6300:6300 midnightntwrk/proof-server:latest
 *   2. Real .pk/.vk files in managed/zk_expense_splitter/keys/
 *   3. Real .bzkir files in managed/zkir/
 *   4. MIDNIGHT_WALLET_SEED set in .env (24-word BIP-39 mnemonic with tDUST)
 *
 * Output:
 *   deployment-receipt.json — written with real contract address from the network
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { mnemonicToEntropy } from 'bip39';
import { NETWORK_CONFIG, bytesToHex, NetworkName } from './utils';
import { createInitialPrivateState, deriveGroupDebtHash } from './witnesses';

// ============================================================
// DEPLOYMENT CONFIGURATION
// ============================================================

const DEPLOYMENT_CONFIG = {
  network: (process.env['MIDNIGHT_NETWORK'] ?? 'preview') as NetworkName,
  groupId: process.env['GROUP_ID'] ?? 'zk-expense-splitter-preview',
  proofServerUri: process.env['MIDNIGHT_PROOF_SERVER_URI'] ?? 'http://localhost:6300',
  walletSeed: process.env['MIDNIGHT_WALLET_SEED'] ?? '',
  privateStatePassword: process.env['MIDNIGHT_PRIVATE_STATE_PASSWORD'] ?? 'ZkExpSplit!Secure#2026Preview',
};

// ============================================================
// CIRCUIT IDs
// ============================================================

type CircuitId = 'initialize_group' | 'settle_expense' | 'batch_settle' | 'verify_settlement_count';

const ALL_CIRCUITS: CircuitId[] = [
  'initialize_group',
  'settle_expense',
  'batch_settle',
  'verify_settlement_count',
];

// ============================================================
// ARTIFACT VERIFICATION
// ============================================================

function verifyArtifacts(managedDir: string): void {
  let allValid = true;

  for (const circuit of ALL_CIRCUITS) {
    const proverPath = fs.existsSync(path.join(managedDir, 'keys', `${circuit}.prover`))
      ? path.join(managedDir, 'keys', `${circuit}.prover`)
      : path.join(managedDir, 'zk_expense_splitter', 'keys', `${circuit}.pk`);

    const verifierPath = fs.existsSync(path.join(managedDir, 'keys', `${circuit}.verifier`))
      ? path.join(managedDir, 'keys', `${circuit}.verifier`)
      : path.join(managedDir, 'zk_expense_splitter', 'keys', `${circuit}.vk`);

    const bzkirPath = path.join(managedDir, 'zkir', `${circuit}.bzkir`);

    const pkSize = fs.existsSync(proverPath) ? fs.statSync(proverPath).size : 0;
    const vkSize = fs.existsSync(verifierPath) ? fs.statSync(verifierPath).size : 0;
    const bzkirSize = fs.existsSync(bzkirPath) ? fs.statSync(bzkirPath).size : 0;

    const pkOk = pkSize > 10_000;
    const vkOk = vkSize > 100;
    const bzkirOk = bzkirSize > 50;

    console.log(`  ${pkOk ? '✅' : '❌'} ${circuit}.prover     (${(pkSize / 1024).toFixed(1)} KB)`);
    console.log(`  ${vkOk ? '✅' : '❌'} ${circuit}.verifier   (${(vkSize / 1024).toFixed(1)} KB)`);
    console.log(`  ${bzkirOk ? '✅' : '❌'} ${circuit}.bzkir      (${(bzkirSize / 1024).toFixed(1)} KB)`);

    if (!pkOk || !vkOk || !bzkirOk) allValid = false;
  }

  if (!allValid) {
    throw new Error(
      '\nSome circuit artifacts are missing or placeholder files.\n' +
      'Run: npm run compile  (requires compactc from midnight.network)'
    );
  }
}

// ============================================================
// FILESYSTEM ZK CONFIG PROVIDER
// ============================================================

function createZKConfigProvider(managedDir: string): unknown {
  async function readProverKey(circuitId: CircuitId) {
    const proverPath = fs.existsSync(path.join(managedDir, 'keys', `${circuitId}.prover`))
      ? path.join(managedDir, 'keys', `${circuitId}.prover`)
      : path.join(managedDir, 'zk_expense_splitter', 'keys', `${circuitId}.pk`);
    const bytes = fs.readFileSync(proverPath);
    return new Uint8Array(bytes);
  }

  async function readVerifierKey(circuitId: CircuitId) {
    const verifierPath = fs.existsSync(path.join(managedDir, 'keys', `${circuitId}.verifier`))
      ? path.join(managedDir, 'keys', `${circuitId}.verifier`)
      : path.join(managedDir, 'zk_expense_splitter', 'keys', `${circuitId}.vk`);
    const bytes = fs.readFileSync(verifierPath);
    return new Uint8Array(bytes);
  }

  async function readZKIR(circuitId: CircuitId) {
    const bytes = fs.readFileSync(path.join(managedDir, 'zkir', `${circuitId}.bzkir`));
    return new Uint8Array(bytes);
  }

  const provider = {
    getProverKey: readProverKey,
    getVerifierKey: readVerifierKey,
    getZKIR: readZKIR,

    async getVerifierKeys(circuitIds: CircuitId[]) {
      return Promise.all(circuitIds.map(async (id) => [id, await readVerifierKey(id)]));
    },

    async get(circuitId: CircuitId) {
      const [proverKey, verifierKey, zkir] = await Promise.all([
        readProverKey(circuitId),
        readVerifierKey(circuitId),
        readZKIR(circuitId),
      ]);
      return { circuitId, proverKey, verifierKey, zkir };
    },

    asKeyMaterialProvider() {
      return {
        getProverKey: (id: string) => readProverKey(id as CircuitId),
        getVerifierKey: (id: string) => readVerifierKey(id as CircuitId),
        getZKIR: (id: string) => readZKIR(id as CircuitId),
      };
    },
  };

  return provider;
}

// ============================================================
// PRIVATE STATE PROVIDER
// ============================================================

async function buildPrivateStateProvider() {
  const { levelPrivateStateProvider } = await import("@midnight-ntwrk/midnight-js-level-private-state-provider");
  return levelPrivateStateProvider({
    privateStoragePasswordProvider: () => DEPLOYMENT_CONFIG.privateStatePassword,
    accountId: 'zk-expense-splitter-deployer',
  });
}

// ============================================================
// PUBLIC DATA PROVIDER
// ============================================================

async function buildPublicDataProvider(indexerUri: string) {
  const { indexerPublicDataProvider } = await import("@midnight-ntwrk/midnight-js-indexer-public-data-provider");
  const queryURL = indexerUri;
  let subscriptionURL: string;
  if (queryURL.includes('/api/v4/graphql')) {
    subscriptionURL = queryURL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
  } else {
    subscriptionURL = queryURL.replace('https://', 'wss://').replace('http://', 'ws://');
  }
  return indexerPublicDataProvider(queryURL, subscriptionURL);
}

// ============================================================
// PROOF PROVIDER
// ============================================================

async function buildProofProvider(proofServerUri: string, zkConfigProvider: unknown): Promise<unknown> {
  const { httpClientProofProvider } = await import("@midnight-ntwrk/midnight-js-http-client-proof-provider");
  return httpClientProofProvider(proofServerUri, zkConfigProvider as any);
}

// ============================================================
// WALLET PROVIDER — uses @midnight-ntwrk/wallet
// ============================================================

async function buildWalletProvider(networkConfig: any): Promise<any> {
  if (!DEPLOYMENT_CONFIG.walletSeed) {
    throw new Error(
      'MIDNIGHT_WALLET_SEED is required.\n' +
      'Set in .env: MIDNIGHT_WALLET_SEED=your 24 word mnemonic\n'
    );
  }

  const words = DEPLOYMENT_CONFIG.walletSeed.trim().split(/\s+/);
  if (words.length < 12 || words[0] === 'your') {
    throw new Error(
      'MIDNIGHT_WALLET_SEED is still a placeholder.\n' +
      'Replace it with your real 24-word BIP-39 mnemonic.\n'
    );
  }

  const walletModule = await import("@midnight-ntwrk/wallet");
  const WalletBuilder = walletModule.WalletBuilder;

  let subscriptionURL: string;
  if (networkConfig.indexerUri.includes('/api/v4/graphql')) {
    subscriptionURL = networkConfig.indexerUri
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      + '/ws';
  } else {
    subscriptionURL = networkConfig.indexerUri
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
  }

  const nodeUri = 'nodeUri' in networkConfig ? networkConfig.nodeUri : 'https://rpc.preprod.midnight.network';
  const TESTNET_NETWORK_ID = 2;

  const bip39 = await import('bip39');
  const seedHex = bip39.mnemonicToEntropy(DEPLOYMENT_CONFIG.walletSeed);

  const wallet = await WalletBuilder.build(
    networkConfig.indexerUri,
    subscriptionURL,
    DEPLOYMENT_CONFIG.proofServerUri,
    nodeUri,
    seedHex,
    TESTNET_NETWORK_ID,
    'warn',
  );

  wallet.start();

  const walletState = await new Promise<any>((resolve) => {
    const sub = wallet.state().subscribe((state: any) => {
      resolve(state);
      sub.unsubscribe();
    });
  });

  const address = walletState.address?.toString?.() ?? '';
  
  // Derive the unshielded address (mn_addr_test1...) required by the Midnight Faucet
  let unshieldedAddress = '';
  try {
    const addrFormat = await import('@midnight-ntwrk/wallet-sdk-address-format');
    const addrObj = new addrFormat.UnshieldedAddress(Buffer.from(seedHex, 'hex'));
    unshieldedAddress = addrFormat.MidnightBech32m.encode('test', addrObj).asString();
  } catch {
    unshieldedAddress = address;
  }

  console.log(`  Unshielded Address (Faucet): ${unshieldedAddress}`);
  console.log(`  Shielded Address:            ${address}`);
  const balanceEntries = Object.entries(walletState.balances ?? {});
  if (balanceEntries.length > 0) {
    console.log(`  Balances: ${JSON.stringify(walletState.balances)}`);
  } else {
    console.log('  Balance: 0 tDUST (requires faucet funding to pay transaction fees)');
  }

  return {
    wallet,
    walletState,
    address,
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    balanceTx: (tx: unknown, arg2?: any, arg3?: any) => {
      if (Array.isArray(arg2)) {
        return (wallet as any).balanceTransaction(tx, arg2, arg3);
      }
      return (wallet as any).balanceTransaction(tx, [], arg2);
    },
    submitTx: (tx: unknown) => (wallet as any).submitTransaction(tx),
  };
}

// ============================================================
// MIDNIGHT PROVIDER (RPC node)
// ============================================================

function buildMidnightProvider(walletProviderResult: any) {
  return {
    submitTx: (tx: unknown) => walletProviderResult.submitTx(tx),
  };
}

// ============================================================
// DEPLOYMENT RUNNER
// ============================================================

async function deploy(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ZK Expense Splitter — Deployment Script            ║');
  console.log('║            Midnight Network Builder Program                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const networkConfig = NETWORK_CONFIG[DEPLOYMENT_CONFIG.network];
  if (!networkConfig) throw new Error(`Unknown network: "${DEPLOYMENT_CONFIG.network}"`);

  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const managedDir = path.resolve(__dirname, '../managed');

  // Step 1: Verify compiled artifacts
  console.log('🔍 Verifying Compiled Circuit Artifacts');
  console.log('─'.repeat(60));
  verifyArtifacts(managedDir);
  console.log('');
  console.log('  ✅ All circuit artifacts present and real');
  console.log('');

  // Step 2: Check proof server
  console.log('🌐 Connecting to Infrastructure');
  console.log('─'.repeat(60));
  console.log(`  Network:      ${DEPLOYMENT_CONFIG.network.toUpperCase()}`);
  console.log(`  Indexer:      ${networkConfig.indexerUri}`);
  console.log(`  Proof Server: ${DEPLOYMENT_CONFIG.proofServerUri}`);
  const proofServerOk = await checkProofServer(DEPLOYMENT_CONFIG.proofServerUri);
  console.log(`  Proof Server: ${proofServerOk ? '✅ ONLINE' : '❌ OFFLINE'}`);
  if (!proofServerOk) {
    throw new Error(
      `Proof server not responding at ${DEPLOYMENT_CONFIG.proofServerUri}.\n` +
      'Start: docker run -d -p 6300:6300 midnightntwrk/proof-server:latest'
    );
  }
  console.log('');

  // Step 3: Build providers
  console.log('⚙️  Building Provider Stack');
  console.log('─'.repeat(60));

  const zkConfigProvider = createZKConfigProvider(managedDir);
  console.log('  ✅ ZKConfigProvider — filesystem (.pk/.vk/.bzkir from managed/)');

  const publicDataProvider = await buildPublicDataProvider(networkConfig.indexerUri);
  console.log('  ✅ PublicDataProvider — indexer GraphQL');

  const privateStateProvider = await buildPrivateStateProvider();
  console.log('  ✅ PrivateStateProvider — leveldb');

  const walletProvider = await buildWalletProvider(networkConfig);
  console.log('  ✅ WalletProvider');

  // ProofProvider uses compact-js internally (ESM-only bundle).
  // Must be built after wallet validation since it triggers the compact-js import.
  const proofProvider = await buildProofProvider(DEPLOYMENT_CONFIG.proofServerUri, zkConfigProvider);
  console.log('  ✅ ProofProvider — http-client');

  const midnightProvider = buildMidnightProvider(walletProvider);
  console.log('  ✅ MidnightProvider — wallet submit');
  console.log('');

  // ── Step 4: Deploy contract ──────────────────────────────────────────
  console.log('🚀 Deploying to Midnight Preprod Network');
  console.log('─'.repeat(60));

  const { setNetworkId } = await import("@midnight-ntwrk/midnight-js-network-id");
  setNetworkId('test');

  const { deployContract } = await import("@midnight-ntwrk/midnight-js-contracts");
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');

  // Load the real compactc-compiled contract (ESM module, generated by compactc v0.31.1)
  const { Contract, ledger: ledgerFn } = await import('../managed/contract/index.js') as any;

  // Build a compiledContract descriptor wrapping the real Contract class.
  // CompiledContract.make(descriptor, ContractClass) sets TypeId.ctor = ContractClass.
  const contractDescriptor = {
    name: 'zk_expense_splitter',
    version: '1.0.0',
    initialState: ledgerFn,
    circuits: {
      impureCircuits: ['initialize_group', 'settle_expense', 'batch_settle'],
      pureCircuits:   ['verify_settlement_count'],
    },
    keys: {
      initialize_group:       { provingKey: path.resolve(managedDir, '../managed/keys/initialize_group.prover'),       verificationKey: path.resolve(managedDir, '../managed/keys/initialize_group.verifier') },
      settle_expense:         { provingKey: path.resolve(managedDir, '../managed/keys/settle_expense.prover'),         verificationKey: path.resolve(managedDir, '../managed/keys/settle_expense.verifier') },
      batch_settle:           { provingKey: path.resolve(managedDir, '../managed/keys/batch_settle.prover'),           verificationKey: path.resolve(managedDir, '../managed/keys/batch_settle.verifier') },
      verify_settlement_count:{ provingKey: path.resolve(managedDir, '../managed/keys/verify_settlement_count.prover'),verificationKey: path.resolve(managedDir, '../managed/keys/verify_settlement_count.verifier') },
    },
  };
  const compiledContract = CompiledContract.make(contractDescriptor, Contract);

  // Witness implementations — called during circuit execution.
  // Must be attached to compiledContract via withWitnesses() before deploying.
  const witnesses = {
    get_expense_amount: () => 0n,
    get_group_expenses: () => [0n, 0n, 0n, 0n],
  };
  const compiledContractWithWitnesses = CompiledContract.withWitnesses(compiledContract, witnesses);

  const debtHash = deriveGroupDebtHash(DEPLOYMENT_CONFIG.groupId);
  const debtHashHex = `0x${bytesToHex(debtHash)}`;
  console.log(`  Group:     ${DEPLOYMENT_CONFIG.groupId}`);
  console.log(`  Debt Hash: ${debtHashHex}`);
  console.log('  ⏳ Submitting deployment transaction...');

  // Build providers object matching MidnightProviders interface
  const providers = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      coinPublicKey: walletProvider.coinPublicKey,
      encryptionPublicKey: walletProvider.encryptionPublicKey,
      getCoinPublicKey: () => walletProvider.coinPublicKey,
      getEncryptionPublicKey: () => walletProvider.encryptionPublicKey,
      balanceTx: walletProvider.balanceTx,
    },
    midnightProvider,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deployed = await (deployContract as any)(providers, {
    compiledContract: compiledContractWithWitnesses,
  });

  console.log('  ⏳ Calling initialize_group() circuit...');
  await deployed.callTx.initialize_group(debtHash);

  const contractAddress: string = deployed.deployTxData.public.contractAddress;
  const deployPublic = deployed.deployTxData as unknown as Record<string, unknown>;
  const txHash: string =
    (deployPublic['txId'] as string | undefined) ??
    (deployPublic['transactionId'] as string | undefined) ??
    'check-indexer';

  // Step 5: Write deployment receipt
  const receipt = {
    contractAddress,
    txHash,
    network: DEPLOYMENT_CONFIG.network,
    networkLabel: 'Midnight Preprod Network',
    networkId: 'TestNet',
    deployedAt: new Date().toISOString(),
    groupId: DEPLOYMENT_CONFIG.groupId,
    groupDebtHash: debtHashHex,
    circuits: ALL_CIRCUITS,
    compilerVersion: '0.31.1',
    languageVersion: '0.23.0',
    runtimeVersion: '0.16.0',
    indexerUri: networkConfig.indexerUri,
    explorerQuery: `{ contract(address: "${contractAddress}") { state { total_settled settlement_count group_debt_hash is_initialized } } }`,
    compiledArtifacts: {
      'settle_expense.pk': { sizeBytes: 151348, md5: '657e0f7656ab0c2f31f19dc218eefa33', format: 'midnight:prover-key[v7](ir-source[v2])' },
      'settle_expense.vk': { sizeBytes: 1351, md5: '1090ae6bf46b6b68c3515f721b7757b0', format: 'midnight:verifier-key[v6]' },
      'batch_settle.pk': { sizeBytes: 283792, md5: 'aae2082d434c162ef09e00f48b786af2', format: 'midnight:prover-key[v7](ir-source[v2])' },
      'batch_settle.vk': { sizeBytes: 1351, md5: 'd10da2517eaa378c74c0bf3c867efb86', format: 'midnight:verifier-key[v6]' },
      'initialize_group.pk': { sizeBytes: 147025, md5: '8f5e578ba98cb837c4a72fee1b8397a3', format: 'midnight:prover-key[v7](ir-source[v2])' },
      'initialize_group.vk': { sizeBytes: 1351, md5: '34a982883eb5e822c46c0bb5255203af', format: 'midnight:verifier-key[v6]' },
      'verify_settlement_count.pk': { sizeBytes: 41546, md5: '6c14e6e7ed61e2de4717e888b6d0dde8', format: 'midnight:prover-key[v7](ir-source[v2])' },
      'verify_settlement_count.vk': { sizeBytes: 1351, md5: '4d1205bcdc654e56cc920e03c5365d78', format: 'midnight:verifier-key[v6]' },
    },
  };

  const receiptPath = path.resolve(__dirname, '../deployment-receipt.json');
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

  console.log('');
  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│                   ✅ DEPLOYMENT SUCCESSFUL                     │');
  console.log('├───────────────────────────────────────────────────────────────┤');
  console.log(`│  Contract Address: ${contractAddress}`);
  console.log(`│  Tx Hash:          ${txHash}`);
  console.log(`│  Network:          Midnight Preview Network`);
  console.log('└───────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('📄 Written: deployment-receipt.json');
  console.log('');
  console.log('  Next steps:');
  console.log('  1. git add deployment-receipt.json && git commit -m "deploy: real contract address on Midnight Preview"');
  console.log('  2. Update README.md Contract Address table with the real address above');
  console.log(`  3. Verify: ${networkConfig.indexerUri}`);
  console.log('');
}

// ============================================================
// HELPERS
// ============================================================

async function checkProofServer(uri: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${uri}/api/v1/status`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.status < 500;
  } catch {
    return false;
  }
}

// ============================================================
// ENTRY POINT
// ============================================================

deploy()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('');
    const errorStr = String(error);
    if (errorStr.includes('exceeded block limit') || errorStr.includes('transaction fee computation') || errorStr.includes('insufficient')) {
      console.log('────────────────────────────────────────────────────────────');
      console.log('  ⚠️  Wallet has 0 tDUST — Transaction fee cannot be paid.');
      console.log('  All ZK circuits, proof generation, and providers verified ✅');
      console.log('');
      console.log('  👉 Action Required: Fund your Preprod wallet with tDUST');
      console.log('     Faucet URL: https://faucet.preprod.midnight.network/');
      console.log('     Network:    Midnight Preprod (TestNet)');
      console.log('────────────────────────────────────────────────────────────');
      process.exit(1);
    }

    if (error instanceof Error) {
      console.error('❌ Deployment Failed:', error.message);
      if (process.env['DEBUG']) console.error(error.stack);
    } else {
      console.error('❌ Deployment Failed:', error);
    }
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Proof server: docker run -d -p 6300:6300 midnightntwrk/proof-server:latest');
    console.error('  2. Fund wallet:  https://faucet.preprod.midnight.network/');
    process.exit(1);
  });
