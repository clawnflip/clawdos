import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const APP_NAME = 'ClawdOS Terminal';
const APP_VERSION = '0.1.0';
const CONFIG_DIR = path.join(os.homedir(), '.clawdos');
const DATA_FILE = path.join(CONFIG_DIR, 'state.json');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

const THEMES = {
  matrix: { prompt: COLORS.green, output: COLORS.gray, accent: COLORS.cyan },
  arctic: { prompt: COLORS.cyan, output: COLORS.gray, accent: COLORS.magenta },
  amber: { prompt: COLORS.yellow, output: COLORS.gray, accent: COLORS.green }
};

function ensureState() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      username: os.userInfo().username,
      cwd: process.cwd(),
      theme: 'matrix',
      aliases: {},
      notes: []
    }, null, 2));
  }
}

function loadState() {
  ensureState();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      username: os.userInfo().username,
      cwd: process.cwd(),
      theme: 'matrix',
      aliases: {},
      notes: []
    };
  }
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function parseInput(input) {
  const args = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if ((ch === '"' || ch === "'") && (!quote || quote === ch)) {
      quote = quote ? null : ch;
      continue;
    }
    if (!quote && /\s/.test(ch)) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }

  if (current) args.push(current);
  return args;
}

function promptFor(state) {
  const theme = THEMES[state.theme] || THEMES.matrix;
  const cwdName = path.basename(state.cwd) || state.cwd;
  return `${theme.prompt}${state.username}@clawdos${COLORS.reset}:${theme.accent}${cwdName}${COLORS.reset}$ `;
}

function banner(state) {
  const theme = THEMES[state.theme] || THEMES.matrix;
  return `${theme.accent}
╔══════════════════════════════════════════════════════╗
║                   CLAWDOS TERMINAL                  ║
║          Autonomous Shell for Builders v${APP_VERSION.padEnd(8)}║
╚══════════════════════════════════════════════════════╝
${COLORS.reset}Type 'help' for command index.`;
}

function resolvePath(cwd, inputPath = '.') {
  if (!inputPath || inputPath === '.') return cwd;
  if (path.isAbsolute(inputPath)) return path.normalize(inputPath);
  return path.normalize(path.join(cwd, inputPath));
}

function formatLs(items) {
  return items.map((item) => {
    const stat = fs.statSync(item.full);
    const type = stat.isDirectory() ? 'dir ' : 'file';
    const size = stat.isDirectory() ? '-' : `${stat.size}`;
    return `${type.padEnd(4)} ${size.padStart(8)}  ${item.name}`;
  }).join('\n');
}

function tree(dir, depth, level = 0) {
  if (level > depth) return [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const lines = [];
  for (const entry of entries) {
    const prefix = `${'  '.repeat(level)}- `;
    lines.push(`${prefix}${entry.name}${entry.isDirectory() ? '/' : ''}`);
    if (entry.isDirectory()) {
      lines.push(...tree(path.join(dir, entry.name), depth, level + 1));
    }
  }
  return lines;
}

function safeCalc(expression) {
  if (!/^[0-9+\-*/%.()\s]+$/.test(expression)) {
    throw new Error('Only numeric expressions are allowed.');
  }
  const fn = new Function(`return (${expression})`);
  const result = fn();
  if (!Number.isFinite(result)) throw new Error('Invalid arithmetic result.');
  return result;
}

function helpText() {
  return [
    'Core:',
    '  help, clear, exit, version, about',
    'Identity:',
    '  whoami, setname <name>, theme [matrix|arctic|amber]',
    'Navigation:',
    '  pwd, cd <path>, ls [path], tree [path] [depth], cat <file>',
    'Filesystem:',
    '  mkdir <dir>, touch <file>, write <file> <text>, rm <path>',
    'Utilities:',
    '  echo <text>, date, now, history [n], calc <expr>, uuid',
    '  hash <text>, b64enc <text>, b64dec <base64>',
    'Productivity:',
    '  alias <name> <command>, unalias <name>, run <scriptfile>',
    'Notes:',
    '  note add <text>, note list, note rm <index>'
  ].join('\n');
}

function applyAlias(state, line) {
  const [cmd, ...rest] = parseInput(line);
  if (!cmd) return line;
  if (!state.aliases[cmd]) return line;
  return `${state.aliases[cmd]} ${rest.join(' ')}`.trim();
}

async function executeCommand(line, state, session) {
  const expanded = applyAlias(state, line.trim());
  const [command, ...args] = parseInput(expanded);
  if (!command) return '';

  switch (command) {
    case 'help': return helpText();
    case 'clear': process.stdout.write('\x1Bc'); return '';
    case 'exit':
    case 'quit': session.shouldExit = true; return 'Session closed.';
    case 'version': return `${APP_NAME} ${APP_VERSION}`;
    case 'about': return 'ClawdOS CLI provides a composable terminal with filesystem, utility, alias and scripting commands.';
    case 'whoami': return `${state.username} (${os.platform()} ${os.release()})`;
    case 'setname': {
      if (!args[0]) return 'Usage: setname <name>';
      state.username = args[0];
      saveState(state);
      return `Username updated: ${state.username}`;
    }
    case 'theme': {
      if (!args[0]) return `Current theme: ${state.theme}`;
      if (!THEMES[args[0]]) return `Unknown theme. Available: ${Object.keys(THEMES).join(', ')}`;
      state.theme = args[0];
      saveState(state);
      return `Theme switched to ${state.theme}`;
    }
    case 'pwd': return state.cwd;
    case 'cd': {
      const target = resolvePath(state.cwd, args[0] || os.homedir());
      if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return `Not a directory: ${target}`;
      state.cwd = target;
      saveState(state);
      return state.cwd;
    }
    case 'ls': {
      const target = resolvePath(state.cwd, args[0] || '.');
      if (!fs.existsSync(target)) return `Path not found: ${target}`;
      const entries = fs.readdirSync(target).map((name) => ({ name, full: path.join(target, name) }));
      return entries.length ? formatLs(entries) : '(empty)';
    }
    case 'tree': {
      const target = resolvePath(state.cwd, args[0] || '.');
      const depth = Math.max(0, Number.parseInt(args[1] || '2', 10));
      if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return `Not a directory: ${target}`;
      return tree(target, depth).join('\n') || '(empty)';
    }
    case 'cat': {
      const target = resolvePath(state.cwd, args[0]);
      if (!args[0]) return 'Usage: cat <file>';
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return `File not found: ${target}`;
      return fs.readFileSync(target, 'utf8');
    }
    case 'mkdir': {
      if (!args[0]) return 'Usage: mkdir <dir>';
      const target = resolvePath(state.cwd, args[0]);
      fs.mkdirSync(target, { recursive: true });
      return `Created directory: ${target}`;
    }
    case 'touch': {
      if (!args[0]) return 'Usage: touch <file>';
      const target = resolvePath(state.cwd, args[0]);
      fs.closeSync(fs.openSync(target, 'a'));
      return `Touched file: ${target}`;
    }
    case 'write': {
      if (args.length < 2) return 'Usage: write <file> <text>';
      const [file, ...contentParts] = args;
      const target = resolvePath(state.cwd, file);
      fs.writeFileSync(target, contentParts.join(' '), 'utf8');
      return `Wrote file: ${target}`;
    }
    case 'rm': {
      if (!args[0]) return 'Usage: rm <path>';
      const target = resolvePath(state.cwd, args[0]);
      if (!fs.existsSync(target)) return `Path not found: ${target}`;
      const stat = fs.statSync(target);
      if (stat.isDirectory()) fs.rmSync(target, { recursive: true, force: true });
      else fs.unlinkSync(target);
      return `Removed: ${target}`;
    }
    case 'echo': return args.join(' ');
    case 'date':
    case 'now': return new Date().toISOString();
    case 'history': {
      const n = Math.max(1, Number.parseInt(args[0] || '20', 10));
      return session.history.slice(-n).map((h, i) => `${i + 1}. ${h}`).join('\n');
    }
    case 'calc': {
      if (!args[0]) return 'Usage: calc <expression>';
      try { return String(safeCalc(args.join(' '))); }
      catch (err) { return `Calc error: ${err.message}`; }
    }
    case 'uuid': return crypto.randomUUID();
    case 'hash': {
      if (!args[0]) return 'Usage: hash <text>';
      return crypto.createHash('sha256').update(args.join(' ')).digest('hex');
    }
    case 'b64enc': {
      if (!args[0]) return 'Usage: b64enc <text>';
      return Buffer.from(args.join(' '), 'utf8').toString('base64');
    }
    case 'b64dec': {
      if (!args[0]) return 'Usage: b64dec <base64>';
      return Buffer.from(args[0], 'base64').toString('utf8');
    }
    case 'alias': {
      if (args.length < 2) return 'Usage: alias <name> <command>';
      const [name, ...cmd] = args;
      state.aliases[name] = cmd.join(' ');
      saveState(state);
      return `Alias set: ${name} -> ${state.aliases[name]}`;
    }
    case 'unalias': {
      if (!args[0]) return 'Usage: unalias <name>';
      delete state.aliases[args[0]];
      saveState(state);
      return `Alias removed: ${args[0]}`;
    }
    case 'run': {
      if (!args[0]) return 'Usage: run <scriptfile>';
      const target = resolvePath(state.cwd, args[0]);
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return `Script not found: ${target}`;
      const lines = fs.readFileSync(target, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      const out = [];
      for (const scriptLine of lines) {
        const result = await executeCommand(scriptLine, state, session);
        if (result) out.push(`> ${scriptLine}\n${result}`);
        if (session.shouldExit) break;
      }
      return out.join('\n');
    }
    case 'note': {
      const action = args[0];
      if (!action) return 'Usage: note <add|list|rm> ...';
      if (action === 'add') {
        const note = args.slice(1).join(' ');
        if (!note) return 'Usage: note add <text>';
        state.notes.push({ text: note, at: new Date().toISOString() });
        saveState(state);
        return `Note #${state.notes.length} added.`;
      }
      if (action === 'list') {
        if (!state.notes.length) return '(no notes)';
        return state.notes.map((n, i) => `${i + 1}. [${n.at}] ${n.text}`).join('\n');
      }
      if (action === 'rm') {
        const idx = Number.parseInt(args[1] || '', 10);
        if (!Number.isInteger(idx) || idx < 1 || idx > state.notes.length) return 'Usage: note rm <index>';
        state.notes.splice(idx - 1, 1);
        saveState(state);
        return `Note #${idx} removed.`;
      }
      return 'Unknown note action. Use add, list, rm.';
    }
    default:
      return `Command not found: ${command}. Try: help`;
  }
}

export async function startClawdos() {
  const state = loadState();
  const session = { history: [], shouldExit: false };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line) => {
      const commands = ['help', 'clear', 'exit', 'version', 'about', 'whoami', 'setname', 'theme', 'pwd', 'cd', 'ls', 'tree', 'cat', 'mkdir', 'touch', 'write', 'rm', 'echo', 'date', 'now', 'history', 'calc', 'uuid', 'hash', 'b64enc', 'b64dec', 'alias', 'unalias', 'run', 'note'];
      const hits = commands.filter((c) => c.startsWith(line));
      return [hits.length ? hits : commands, line];
    }
  });

  console.log(banner(state));

  while (!session.shouldExit) {
    const line = await new Promise((resolve) => rl.question(promptFor(state), resolve));
    const trimmed = String(line || '').trim();
    if (!trimmed) continue;

    session.history.push(trimmed);
    try {
      const output = await executeCommand(trimmed, state, session);
      if (output) {
        const theme = THEMES[state.theme] || THEMES.matrix;
        console.log(`${theme.output}${output}${COLORS.reset}`);
      }
    } catch (err) {
      console.log(`${COLORS.red}Error: ${err.message}${COLORS.reset}`);
    }
  }

  rl.close();
}

if (process.argv[1] === __filename) {
  startClawdos().catch((err) => {
    console.error('[clawdos:fatal]', err?.message || err);
    process.exitCode = 1;
  });
}
