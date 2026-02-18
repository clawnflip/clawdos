import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { processCommand } from '../../utils/terminalLogic';

type HistoryEntry = {
  type: 'input' | 'output' | 'signal';
  content: string;
};

const LIVE_FEED_LINES = [
  '[SCAN] Crawling X timeline shards for token sentiment spikes...',
  '[TWITTER] @onchainwizard: "Liquidity rotation to AI infra microcaps just started."',
  '[ALPHA] New pair detected: CLAWD/ETH, velocity +218% (5m)',
  '[OPPORTUNITY] Funding imbalance on perp books -> mean reversion setup forming',
  '[SOCIAL] 12 new whale-tagged accounts mentioned #clawdos in 90s',
  '[SIGNAL] Meme velocity crossed threshold (score: 91/100)',
  '[MARKET] Volatility compression detected, breakout probability rising',
  '[THREAD] Multi-post narrative detected: AI agents + launchpad crossover',
  '[WATCHLIST] Added 0xA1...F9 (new deployer cluster)',
  '[TRADER NOTE] Risk-on pocket open; watch for liquidity sweep and reclaim'
];

const pickFeedLine = () => {
  const ts = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/New_York'
  });
  const line = LIVE_FEED_LINES[Math.floor(Math.random() * LIVE_FEED_LINES.length)];
  return `[${ts} ET] ${line}`;
};

const toneForLine = (line: string) => {
  if (line.includes('[OPPORTUNITY]') || line.includes('velocity +')) return 'text-amber-300';
  if (line.includes('[TWITTER]') || line.includes('[THREAD]')) return 'text-sky-300';
  if (line.includes('[ALPHA]') || line.includes('[SIGNAL]')) return 'text-fuchsia-300';
  if (line.includes('[SCAN]') || line.includes('[WATCHLIST]')) return 'text-emerald-300';
  if (line.includes('[MARKET]') || line.includes('[TRADER NOTE]')) return 'text-cyan-300';
  return 'text-green-300/90';
};

const bannerText = [
  ' ██████╗██╗      █████╗ ██╗    ██╗██████╗  ██████╗ ███████╗',
  '██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔═══██╗██╔════╝',
  '██║     ██║     ███████║██║ █╗ ██║██║  ██║██║   ██║███████╗',
  '██║     ██║     ██╔══██║██║███╗██║██║  ██║██║   ██║╚════██║',
  '╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝╚██████╔╝███████║',
  ' ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝  ╚═════╝ ╚══════╝',
  '                     T E R M I N A L   O S'
].join('\n');

const TerminalApp: React.FC = () => {
  const { agent, setAgent, terminalCommand, setTerminalCommand, openWindow } = useOS();

  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      type: 'output',
      content: `
${bannerText}

Neural market scanner: ONLINE
Signal fabric: SYNCHRONIZED
Tweet intelligence engine: TRACKING
Type 'help' for core commands, 'scan_feed' for turbo stream, 'stop_feed' to pause.
Current User: ${agent.name || 'GUEST'}
      `.trim()
    },
    { type: 'signal', content: pickFeedLine() },
    { type: 'signal', content: pickFeedLine() }
  ]);

  const [inputObj, setInputObj] = useState('');
  const [streamEnabled, setStreamEnabled] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, inputObj]);

  useEffect(() => {
    if (!streamEnabled) return;

    const id = setInterval(() => {
      setHistory((prev) => [...prev, { type: 'signal' as const, content: pickFeedLine() }].slice(-140));
    }, 2800);

    return () => clearInterval(id);
  }, [streamEnabled]);

  // Autonomous Command Execution
  useEffect(() => {
    if (terminalCommand && !processingRef.current) {
      processingRef.current = true;
      let i = 0;
      const speed = 30;
      setInputObj('');

      const typeChar = () => {
        if (i < terminalCommand.length) {
          setInputObj((prev) => prev + terminalCommand.charAt(i));
          i++;
          setTimeout(typeChar, speed);
        } else {
          setTimeout(() => {
            handleExecute(terminalCommand);
            setTerminalCommand(null);
            processingRef.current = false;
          }, 500);
        }
      };
      typeChar();
    }
  }, [terminalCommand]);

  const handleExecute = async (command: string) => {
    const normalized = command.toLowerCase().trim();

    setHistory((prev) => [...prev, { type: 'input' as const, content: command }]);

    if (normalized === 'clear') {
      setHistory([{ type: 'output' as const, content: `${bannerText}\n\nDisplay buffer cleared. Live stream still active.` }]);
      setInputObj('');
      return;
    }

    if (normalized === 'scan_feed') {
      setStreamEnabled(true);
      setHistory((prev) => [...prev, { type: 'signal' as const, content: '[SYSTEM] Turbo feed enabled. Scanning X + onchain + orderflow.' }]);
      setInputObj('');
      return;
    }

    if (normalized === 'stop_feed') {
      setStreamEnabled(false);
      setHistory((prev) => [...prev, { type: 'signal' as const, content: '[SYSTEM] Live feed paused. Use scan_feed to resume.' }]);
      setInputObj('');
      return;
    }

    if (normalized === 'demo_ops') {
      const demoBurst = [
        '[SCAN] Pulling 25 trend clusters from social graph...',
        '[TWITTER] "AI agents launching tokens autonomously" momentum increasing',
        '[OPPORTUNITY] Market making gap detected on CLAWD/ETH ladder',
        '[SIGNAL] Entry confidence upgraded to 88/100'
      ];
      demoBurst.forEach((line, idx) => {
        setTimeout(() => {
          setHistory((prev) => [...prev, { type: 'signal' as const, content: `[DEMO] ${line}` }].slice(-140));
        }, idx * 350);
      });
      setInputObj('');
      return;
    }

    try {
      const result = await processCommand(command, agent);

      if (result.updatedAgent) {
        setAgent((prev) => ({ ...prev, ...result.updatedAgent }));
      }

      if (result.sideEffect && result.sideEffect.type === 'open_window') {
        let component: React.ReactNode;
        let icon: React.ReactNode = <span>🔗</span>;
        let size = { width: 800, height: 600 };

        if (result.sideEffect.title === 'Flappy Agent') {
          const walletArg = command.split(' ')[1] || agent.wallet || '0xGuest';
          const { default: FlappyAgent } = await import('./FlappyAgent');
          component = <FlappyAgent wallet={walletArg} />;
          icon = <span>🦞</span>;
          size = { width: 700, height: 500 };
        } else if (result.sideEffect.title === 'Agent Arena') {
          const { default: AgentArena } = await import('./AgentArena');
          component = <AgentArena spectatorOnly={true} />;
          icon = <span>🏟️</span>;
          size = { width: 1000, height: 700 };
        } else if (result.sideEffect.title === 'Agent Arena Play') {
          const arenaWallet = result.sideEffect.url || agent.wallet || '';
          const { default: AgentArena } = await import('./AgentArena');
          component = <AgentArena wallet={arenaWallet} spectatorOnly={false} />;
          icon = <span>🏟️</span>;
          size = { width: 1000, height: 700 };
        } else if (result.sideEffect.title === 'Moltx Post') {
          component = <iframe src={result.sideEffect.url} title={result.sideEffect.title} className="w-full h-full border-0" />;
        } else {
          component = <iframe src={result.sideEffect.url} title={result.sideEffect.title} className="w-full h-full border-0" />;
        }

        openWindow(result.sideEffect.title, component, icon, size);
      }

      setHistory((prev) => [...prev, { type: 'output' as const, content: result.output }].slice(-140));
    } catch (err) {
      setHistory((prev) => [...prev, { type: 'output' as const, content: `Runtime Error: ${err}` }].slice(-140));
    }

    setInputObj('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const command = inputObj.trim();
      if (!command) return;
      handleExecute(command);
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-md border border-emerald-500/30"
      onClick={() => inputRef.current?.focus()}
      onContextMenu={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(30,245,180,0.15),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.16),transparent_40%),linear-gradient(180deg,#060b10_0%,#070d12_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(56,189,248,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.14)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 w-full h-full text-sm font-mono text-green-200 p-4 overflow-auto flex flex-col">
        <div className="mb-3 rounded-md border border-cyan-500/30 bg-black/35 p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/90 mb-1">ClawdOS Command Deck</div>
          <div className="text-xl md:text-2xl font-black leading-tight bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
            ClawdOS Terminal
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">Market Scanner: Online</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/40">Tweet Intel: Live</span>
            <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40">Signal Engine: {streamEnabled ? 'Streaming' : 'Paused'}</span>
          </div>
        </div>

        <div className="flex-1">
          {history.map((entry, idx) => (
            <div key={idx} className="mb-1 whitespace-pre-wrap break-words leading-relaxed">
              {entry.type === 'input' ? (
                <span className="flex">
                  <span className="text-emerald-300 mr-2">{agent.name || 'guest'}@clawd:~$</span>
                  <span className="text-white">{entry.content}</span>
                </span>
              ) : (
                <div className={entry.type === 'signal' ? 'animate-pulse' : ''}>
                  {entry.content.split('\n').map((line, lineIdx) => (
                    <div key={lineIdx} className={toneForLine(line)}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex mt-2 items-center border-t border-emerald-500/20 pt-2">
          <span className="text-emerald-300 mr-2 shrink-0">{agent.name || 'guest'}@clawd:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputObj}
            onChange={(e) => setInputObj(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-white w-full caret-cyan-300"
            autoComplete="off"
            spellCheck="false"
            disabled={!!terminalCommand}
            placeholder="Try: help, scan_feed, demo_ops, init ..."
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalApp;
