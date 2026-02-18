import Database from 'better-sqlite3';
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatEther,
  formatUnits,
  http,
  parseAbi,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import {
  BASE_WETH,
  ClawnchReader,
  ClawncherClaimer,
  ClawnchSwapper,
  NATIVE_TOKEN_ADDRESS,
} from '@clawnch/clawncher-sdk';

const DB_PATH = process.env.CLAW_TOMATON_DB_PATH
  || 'C:\\Users\\celik\\clawtomaton-token\\.clawtomaton-state\\clawtomaton.db';
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

const CLAIM_THRESHOLD = parseEther(process.env.CXAU_CLAIM_THRESHOLD_ETH || '0.01');
const MIN_BUYBACK_ETH = parseEther(process.env.CXAU_MIN_BUYBACK_ETH || '0.01');
const MAX_BUYBACK_ETH = parseEther(process.env.CXAU_MAX_BUYBACK_ETH || '0.05');
const BUYBACK_BPS = BigInt(process.env.CXAU_BUYBACK_BPS || '3500');
const BURN_BPS = BigInt(process.env.CXAU_BURN_BPS || '5000');

function addAudit(db, action, details, txHash = null) {
  db.prepare('INSERT INTO audit_log (timestamp, action, details, tx_hash) VALUES (?, ?, ?, ?)')
    .run(Date.now(), action, details, txHash);
}

function cap(value, min, max) {
  if (value < min) return 0n;
  if (value > max) return max;
  return value;
}

async function claimCycle({ db, reader, claimer, publicClient, token, wallet, tokenDecimals }) {
  const unclaimedWeth = await reader.getAvailableFees(wallet, BASE_WETH);
  const unclaimedToken = await reader.getAvailableFees(wallet, token);

  if (unclaimedWeth < CLAIM_THRESHOLD && unclaimedToken === 0n) {
    return { collectedTx: null, claimWethTx: null, claimTokenTx: null };
  }

  const collect = await claimer.collectRewards(token);
  const collectRcpt = await publicClient.waitForTransactionReceipt({ hash: collect.txHash });
  let claimWethTx = null;
  let claimTokenTx = null;

  if (collectRcpt.status === 'success') {
    const wethAvail = await reader.getAvailableFees(wallet, BASE_WETH);
    if (wethAvail > 0n) {
      const c = await claimer.claimFees(wallet, BASE_WETH);
      const r = await publicClient.waitForTransactionReceipt({ hash: c.txHash });
      if (r.status === 'success') claimWethTx = c.txHash;
    }

    const tokenAvail = await reader.getAvailableFees(wallet, token);
    if (tokenAvail > 0n) {
      const c = await claimer.claimFees(wallet, token);
      const r = await publicClient.waitForTransactionReceipt({ hash: c.txHash });
      if (r.status === 'success') claimTokenTx = c.txHash;
    }
  }

  addAudit(
    db,
    'fees_claimed',
    `heartbeat: claim check, weth=${formatEther(unclaimedWeth)} token=${formatUnits(unclaimedToken, tokenDecimals)}`,
    claimWethTx || claimTokenTx || collect.txHash
  );

  return { collectedTx: collect.txHash, claimWethTx, claimTokenTx };
}

async function buybackCycle({ db, publicClient, walletClient, swapper, token, symbol, wallet, tokenDecimals }) {
  const wethBal = await publicClient.readContract({
    address: BASE_WETH,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: [wallet],
  });

  const preferred = wethBal * BUYBACK_BPS / 10000n;
  let spend = cap(preferred, MIN_BUYBACK_ETH, MAX_BUYBACK_ETH);

  if (spend === 0n) {
    return { buyTx: null, burnTx: null, buyAmount: 0n, spend: 0n };
  }

  let buyResult;
  try {
    buyResult = await swapper.swap({
      sellToken: BASE_WETH,
      buyToken: token,
      sellAmount: spend,
      slippageBps: 180,
    });
  } catch {
    const unwrap = await walletClient.writeContract({
      address: BASE_WETH,
      abi: parseAbi(['function withdraw(uint256)']),
      functionName: 'withdraw',
      args: [spend],
    });
    const unwrapRcpt = await publicClient.waitForTransactionReceipt({ hash: unwrap });
    if (unwrapRcpt.status !== 'success') throw new Error('WETH unwrap reverted');

    buyResult = await swapper.swap({
      sellToken: NATIVE_TOKEN_ADDRESS,
      buyToken: token,
      sellAmount: spend,
      slippageBps: 180,
    });
  }

  addAudit(
    db,
    'buyback',
    `heartbeat: Bought ${formatUnits(buyResult.buyAmount, tokenDecimals)} $${symbol} for ${formatEther(spend)} ETH`,
    buyResult.txHash
  );

  const burnAmount = buyResult.buyAmount * BURN_BPS / 10000n;
  let burnTx = null;
  if (burnAmount > 0n) {
    const h = await walletClient.writeContract({
      address: token,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [DEAD_ADDRESS, burnAmount],
    });
    const rcpt = await publicClient.waitForTransactionReceipt({ hash: h });
    if (rcpt.status === 'success') {
      burnTx = h;
      addAudit(db, 'burn', `Burned ${formatUnits(burnAmount, tokenDecimals)} $${symbol}`, burnTx);
    }
  }

  return { buyTx: buyResult.txHash, burnTx, buyAmount: buyResult.buyAmount, spend };
}

async function main() {
  const db = new Database(DB_PATH);
  const identity = db.prepare('SELECT * FROM identity WHERE id = 1').get();
  const activation = db.prepare('SELECT * FROM activation WHERE id = 1').get();

  if (!identity) throw new Error('No identity in DB');
  if (!identity.token_address) throw new Error('No token deployed in DB');

  const account = privateKeyToAccount(identity.private_key);
  const publicClient = createPublicClient({ chain: base, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: base, transport: http(RPC_URL) });
  const reader = new ClawnchReader({ publicClient, network: 'mainnet' });
  const claimer = new ClawncherClaimer({ wallet: walletClient, publicClient, network: 'mainnet' });
  const swapper = new ClawnchSwapper({ wallet: walletClient, publicClient, network: 'mainnet' });

  const day = activation?.activated_at
    ? Math.max(1, Math.floor((Date.now() - Number(activation.activated_at)) / 86400000) + 1)
    : 1;

  addAudit(db, 'heartbeat_proof', `Day ${day}, normal, cycle start`);

  const tokenDecimals = Number(await publicClient.readContract({
    address: identity.token_address,
    abi: parseAbi(['function decimals() view returns (uint8)']),
    functionName: 'decimals',
  }));

  const claimResult = await claimCycle({
    db,
    reader,
    claimer,
    publicClient,
    token: identity.token_address,
    wallet: identity.address,
    tokenDecimals,
  });

  const buybackResult = await buybackCycle({
    db,
    publicClient,
    walletClient,
    swapper,
    token: identity.token_address,
    symbol: identity.token_symbol || 'TOKEN',
    wallet: identity.address,
    tokenDecimals,
  });

  const [wethFees, tokenFees] = await Promise.all([
    reader.getAvailableFees(identity.address, BASE_WETH),
    reader.getAvailableFees(identity.address, identity.token_address),
  ]);

  addAudit(db, 'heartbeat_proof', `Day ${day}, normal, cycle complete`);
  db.close();

  console.log('HEARTBEAT_OK=YES');
  console.log(`claimed_collect_tx=${claimResult.collectedTx || 'NONE'}`);
  console.log(`claimed_weth_tx=${claimResult.claimWethTx || 'NONE'}`);
  console.log(`claimed_token_tx=${claimResult.claimTokenTx || 'NONE'}`);
  console.log(`buyback_tx=${buybackResult.buyTx || 'NONE'}`);
  console.log(`burn_tx=${buybackResult.burnTx || 'NONE'}`);
  console.log(`buyback_spent_eth=${formatEther(buybackResult.spend)}`);
  console.log(`buyback_bought_token=${formatUnits(buybackResult.buyAmount, tokenDecimals)}`);
  console.log(`final_unclaimed_weth=${formatEther(wethFees)}`);
  console.log(`final_unclaimed_token=${formatUnits(tokenFees, tokenDecimals)}`);
}

main().catch((e) => {
  console.error('HEARTBEAT_OK=NO');
  console.error(e?.message || e);
  process.exit(1);
});
