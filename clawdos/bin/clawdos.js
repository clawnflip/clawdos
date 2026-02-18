#!/usr/bin/env node
import { startClawdos } from '../src/cli.js';

startClawdos().catch((err) => {
  console.error('[clawdos:fatal]', err?.message || err);
  process.exitCode = 1;
});
