import { spawn } from 'node:child_process';

const INTERVAL_MIN = Number(process.env.CXAU_HEARTBEAT_MINUTES || '15');
const INTERVAL_MS = Math.max(1, INTERVAL_MIN) * 60 * 1000;

function runStep(label, script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with code ${code}`));
    });
  });
}

async function tick() {
  const start = new Date().toISOString();
  console.log(`\n[CXAU] Tick start ${start}`);
  await runStep('heartbeat', 'scripts/cxau-heartbeat.mjs');
  await runStep('snapshot', 'scripts/export-cxau-feed.mjs');
  console.log(`[CXAU] Tick complete ${new Date().toISOString()}`);
}

async function main() {
  console.log(`[CXAU] Daemon started. Interval: ${INTERVAL_MIN} min`);
  await tick();
  setInterval(async () => {
    try {
      await tick();
    } catch (e) {
      console.error('[CXAU] Tick error:', e?.message || e);
    }
  }, INTERVAL_MS);
}

main().catch((e) => {
  console.error('[CXAU] Fatal:', e?.message || e);
  process.exit(1);
});
