import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ClawnchReader, BASE_WETH } from '@clawnch/clawncher-sdk';
import { createPublicClient, formatEther, formatUnits, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const DB_PATH = process.env.CLAW_TOMATON_DB_PATH
  || 'C:\\Users\\celik\\clawtomaton-token\\.clawtomaton-state\\clawtomaton.db';
const OUT_PATH = process.env.CXAU_SNAPSHOT_OUT
  || 'C:\\Users\\celik\\.gemini\\antigravity\\scratch\\clawd-os\\public\\cxau\\feed.json';
const CLAWNCH_FEE_TX_HASH = '0xff30687b16b3389c5fd16d79c3f8cea3456749346da48b90b53a7135bd094e52';
const CLAWNCH_FEE_EVENT = {
  type: 'clawnch_fee',
  action: 'clawnch_fee_20_percent',
  message: '20% CLAWNCH fee share sent to Clawnch Admin Wallet (0xFC426DFeAe55Dae2f936a592450C9ECEa87A5736).',
  timestamp: 1771446000000,
  isoTime: '2026-02-18T20:20:00.000Z',
  txHash: CLAWNCH_FEE_TX_HASH,
  txUrl: `https://basescan.org/tx/${CLAWNCH_FEE_TX_HASH}`,
};

function inferEventType(action, details) {
  const hay = `${action} ${details}`.toLowerCase();
  if (hay.includes('activation') || hay.includes('burned 1,000,000')) return 'activation';
  if (hay.includes('deploy')) return 'deploy';
  if (hay.includes('claim')) return 'fees_claimed';
  if (hay.includes('milestone')) return 'milestone';
  if (hay.includes('run_') || hay.includes('heartbeat')) return 'heartbeat_proof';
  if (hay.includes('buyback')) return 'buyback';
  if (hay.includes('burn')) return 'burn';
  return 'log';
}

const db = new Database(DB_PATH, { readonly: true });
const identity = db.prepare('SELECT * FROM identity WHERE id = 1').get();
const activation = db.prepare('SELECT * FROM activation WHERE id = 1').get();
const survival = db.prepare('SELECT * FROM survival WHERE id = 1').get();
const auditRows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 300').all();

if (!identity) throw new Error('No identity found in DB.');

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});
const reader = new ClawnchReader({ publicClient, network: 'mainnet' });

const previous = existsSync(OUT_PATH)
  ? JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
  : null;

async function safeRead(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

const tokenAddress = identity.token_address;
const wallet = identity.address;
const tokenDecimals = tokenAddress
  ? Number(await safeRead(
      () => publicClient.readContract({
        address: tokenAddress,
        abi: parseAbi(['function decimals() view returns (uint8)']),
        functionName: 'decimals',
      }),
      18
    ))
  : 18;

const [ethBalance, tokenBalanceRaw, unclaimedWeth, unclaimedToken] = await Promise.all([
  safeRead(
    () => publicClient.getBalance({ address: wallet }),
    previous?.balances?.eth ? BigInt(Math.floor(Number(previous.balances.eth) * 1e18)) : 0n
  ),
  tokenAddress
    ? safeRead(
        () => publicClient.readContract({
          address: tokenAddress,
          abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
          functionName: 'balanceOf',
          args: [wallet],
        }),
        previous?.balances?.token ? BigInt(Math.floor(Number(previous.balances.token) * 1e18)) : 0n
      )
    : Promise.resolve(0n),
  tokenAddress
    ? safeRead(
        () => reader.getAvailableFees(wallet, BASE_WETH),
        previous?.fees?.unclaimedWeth ? BigInt(Math.floor(Number(previous.fees.unclaimedWeth) * 1e18)) : 0n
      )
    : Promise.resolve(0n),
  tokenAddress
    ? safeRead(
        () => reader.getAvailableFees(wallet, tokenAddress),
        previous?.fees?.unclaimedToken ? BigInt(Math.floor(Number(previous.fees.unclaimedToken) * 1e18)) : 0n
      )
    : Promise.resolve(0n),
]);

const activatedAt = activation?.activated_at ? Number(activation.activated_at) : null;
const day = activatedAt ? Math.max(1, Math.floor((Date.now() - activatedAt) / 86400000) + 1) : null;

const events = auditRows.slice().reverse().map((row) => ({
  id: row.id,
  type: inferEventType(row.action, row.details || ''),
  action: row.action,
  message: row.details,
  timestamp: Number(row.timestamp),
  isoTime: new Date(Number(row.timestamp)).toISOString(),
  txHash: row.tx_hash || null,
  txUrl: row.tx_hash ? `https://basescan.org/tx/${row.tx_hash}` : null,
}));
if (!events.some((ev) => (ev.txHash || '').toLowerCase() === CLAWNCH_FEE_TX_HASH)) {
  const nextId = events.length ? Math.max(...events.map((ev) => Number(ev.id) || 0)) + 1 : 1;
  events.push({ id: nextId, ...CLAWNCH_FEE_EVENT });
}

const payload = {
  project: {
    slug: 'cxau',
    name: 'CLAWXAU',
    symbol: identity.token_symbol || 'CXAU',
  },
  agent: {
    name: identity.name,
    wallet,
    tokenAddress: tokenAddress || null,
    creatorAddress: identity.creator_address,
    activated: Boolean(activation),
    activatedAt: activatedAt ? new Date(activatedAt).toISOString() : null,
    day,
  },
  balances: {
    eth: formatEther(ethBalance),
    token: tokenAddress ? formatUnits(tokenBalanceRaw, tokenDecimals) : null,
  },
  fees: {
    unclaimedWeth: formatEther(unclaimedWeth),
    unclaimedToken: tokenAddress ? formatUnits(unclaimedToken, tokenDecimals) : null,
    totalClaimedWeth: survival?.total_fees_claimed ? formatEther(BigInt(survival.total_fees_claimed)) : null,
  },
  telemetry: {
    tier: survival?.tier || 'normal',
    lastBalanceCheck: survival?.last_balance_check ? new Date(Number(survival.last_balance_check)).toISOString() : null,
    lastFeeClaim: survival?.last_fee_claim ? new Date(Number(survival.last_fee_claim)).toISOString() : null,
  },
  events,
  generatedAt: new Date().toISOString(),
  source: 'snapshot',
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
db.close();

console.log(`Snapshot written: ${OUT_PATH}`);
