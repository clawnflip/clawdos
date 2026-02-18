import Database from 'better-sqlite3';
import { ClawnchReader, getAddresses } from '@clawnch/clawncher-sdk';
import { createPublicClient, formatEther, formatUnits, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_DB_PATH = process.env.CLAW_TOMATON_DB_PATH
  || 'C:\\Users\\celik\\clawtomaton-token\\.clawtomaton-state\\clawtomaton.db';
const SNAPSHOT_PATH = process.env.CXAU_SNAPSHOT_PATH
  || join(process.cwd(), 'public', 'cxau', 'feed.json');
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

function toIso(ts) {
  if (!ts) return null;
  const n = Number(ts);
  if (Number.isNaN(n)) return null;
  return new Date(n).toISOString();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET.' } });
  }

  let db;
  try {
    db = new Database(DEFAULT_DB_PATH, { readonly: true });
  } catch (e) {
    if (existsSync(SNAPSHOT_PATH)) {
      const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8'));
      return res.status(200).json({
        ...snapshot,
        source: 'snapshot',
        warning: 'Live DB unavailable in this environment, serving snapshot.',
      });
    }
    return res.status(200).json({
      project: { slug: 'cxau', name: 'CLAWXAU', symbol: 'CXAU' },
      source: 'unavailable',
      warning: 'Live DB unavailable and no snapshot found.',
      events: [],
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const identity = db.prepare('SELECT * FROM identity WHERE id = 1').get();
    if (!identity) {
      return res.status(404).json({ error: { code: 'IDENTITY_NOT_FOUND', message: 'No agent identity found.' } });
    }

    const activation = db.prepare('SELECT * FROM activation WHERE id = 1').get();
    const survival = db.prepare('SELECT * FROM survival WHERE id = 1').get();
    const auditRows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').all();

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    const walletAddress = identity.address;
    const tokenAddress = identity.token_address || null;
    const tokenSymbol = identity.token_symbol || 'CXAU';

    let ethBalance = '0';
    let tokenBalance = null;
    let unclaimedWethFees = null;
    let unclaimedTokenFees = null;
    let tokenDecimals = 18;

    try {
      const [eth] = await Promise.all([
        publicClient.getBalance({ address: walletAddress }),
      ]);
      ethBalance = formatEther(eth);
    } catch {
      // Ignore chain read failures and keep fallback values.
    }

    if (tokenAddress) {
      try {
        const [decimals, bal] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress,
            abi: parseAbi(['function decimals() view returns (uint8)']),
            functionName: 'decimals',
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
            functionName: 'balanceOf',
            args: [walletAddress],
          }),
        ]);
        tokenDecimals = Number(decimals);
        tokenBalance = formatUnits(bal, tokenDecimals);
      } catch {
        tokenBalance = null;
      }

      try {
        const reader = new ClawnchReader({ publicClient, network: 'mainnet' });
        const addresses = getAddresses('mainnet');
        const [wethFees, tokenFees] = await Promise.all([
          reader.getAvailableFees(walletAddress, addresses.infrastructure.weth),
          reader.getAvailableFees(walletAddress, tokenAddress),
        ]);
        unclaimedWethFees = formatEther(wethFees);
        unclaimedTokenFees = formatUnits(tokenFees, tokenDecimals);
      } catch {
        unclaimedWethFees = null;
        unclaimedTokenFees = null;
      }
    }

    const activatedAt = activation?.activated_at ? Number(activation.activated_at) : null;
    const day = activatedAt ? Math.max(1, Math.floor((Date.now() - activatedAt) / 86400000) + 1) : null;

    const events = auditRows
      .slice()
      .reverse()
      .map((row) => {
        const type = inferEventType(row.action, row.details || '');
        const txHash = row.tx_hash || null;
        return {
          id: row.id,
          type,
          action: row.action,
          message: row.details,
          timestamp: Number(row.timestamp),
          isoTime: toIso(row.timestamp),
          txHash,
          txUrl: txHash ? `https://basescan.org/tx/${txHash}` : null,
        };
      });
    if (!events.some((ev) => (ev.txHash || '').toLowerCase() === CLAWNCH_FEE_TX_HASH)) {
      const nextId = events.length ? Math.max(...events.map((ev) => Number(ev.id) || 0)) + 1 : 1;
      events.push({ id: nextId, ...CLAWNCH_FEE_EVENT });
    }

    return res.status(200).json({
      project: {
        slug: 'cxau',
        name: 'CLAWXAU',
        symbol: tokenSymbol,
      },
      agent: {
        name: identity.name,
        wallet: walletAddress,
        tokenAddress,
        creatorAddress: identity.creator_address,
        activated: Boolean(activation),
        activatedAt: toIso(activation?.activated_at),
        day,
      },
      balances: {
        eth: ethBalance,
        token: tokenBalance,
      },
      fees: {
        unclaimedWeth: unclaimedWethFees,
        unclaimedToken: unclaimedTokenFees,
        totalClaimedWeth: survival?.total_fees_claimed ? formatEther(BigInt(survival.total_fees_claimed)) : null,
      },
      telemetry: {
        tier: survival?.tier || 'normal',
        lastBalanceCheck: toIso(survival?.last_balance_check),
        lastFeeClaim: toIso(survival?.last_fee_claim),
      },
      events,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({
      error: {
        code: 'FEED_FAILED',
        message: e instanceof Error ? e.message : String(e),
      },
    });
  } finally {
    db.close();
  }
}
