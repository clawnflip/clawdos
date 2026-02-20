import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { processCommand } from '../../utils/terminalLogic';
import { fal } from '@fal-ai/client';

type HistoryEntry = {
  type: 'input' | 'output' | 'signal';
  content: string;
};
type XAdvisorStep = 'idle' | 'await_username' | 'await_ticker' | 'await_focus' | 'running';

type XAdvisorSession = {
  step: XAdvisorStep;
  username: string;
  ticker: string;
  focus: string;
};

fal.config({ credentials: import.meta.env.VITE_FAL_KEY });


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
  if (line.startsWith('[POSITIVE]')) return 'text-emerald-300';
  if (line.startsWith('[NEGATIVE]')) return 'text-red-300';
  if (line.startsWith('[NEUTRAL]')) return 'text-gray-300';
  if (line.startsWith('[SECTION]')) return 'text-cyan-200 font-semibold';
  if (line.startsWith('[METRIC]')) return 'text-amber-200';
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
  const { agent, setAgent, terminalCommand, setTerminalCommand, openWindow, createFile } = useOS();

  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      type: 'output' as const,
      content: `
${bannerText}

Neural market scanner: ONLINE
Signal fabric: SYNCHRONIZED
Tweet intelligence engine: TRACKING
Type 'help' for core commands, 'scan_feed' for turbo stream, 'stop_feed' to pause.
Current User: ${agent.name || 'GUEST'}
      `.trim()
    }
  ]);

  const [inputObj, setInputObj] = useState('');
  const [streamEnabled, setStreamEnabled] = useState(false);
  const [xAdvisor, setXAdvisor] = useState<XAdvisorSession>({
    step: 'idle',
    username: '',
    ticker: '',
    focus: ''
  });
  const [lastAdvisorReport, setLastAdvisorReport] = useState('');

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

  const classifyTweet = (text: string): 'positive' | 'negative' | 'neutral' => {
    const lower = text.toLowerCase();
    const positiveTerms = ['bull', 'pumped', 'moon', 'win', 'great', 'strong', 'breakout', 'partnership', 'launch', 'listed', 'adoption'];
    const negativeTerms = ['bear', 'dump', 'scam', 'rug', 'hack', 'exploit', 'bad', 'weak', 'delay', 'sell', 'down', 'fud', 'issue', 'problem'];
    const pos = positiveTerms.reduce((acc, term) => acc + (lower.includes(term) ? 1 : 0), 0);
    const neg = negativeTerms.reduce((acc, term) => acc + (lower.includes(term) ? 1 : 0), 0);
    if (pos > neg) return 'positive';
    if (neg > pos) return 'negative';
    return 'neutral';
  };

  const buildStyleSummary = (tweets: Array<{ text: string }>) => {
    if (!tweets.length) {
      return 'Insufficient tweet history. Use concise, consistent updates and one clear CTA in each post.';
    }
    const lengths = tweets.map((t) => t.text.length);
    const avgLen = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    const hashtagRate = Math.round((tweets.filter((t) => t.text.includes('#')).length / tweets.length) * 100);
    const questionRate = Math.round((tweets.filter((t) => t.text.includes('?')).length / tweets.length) * 100);
    return `Average length: ${avgLen} chars | Hashtag usage: ${hashtagRate}% | Questions: ${questionRate}%`;
  };

  const runXAdvisor = async (username: string, ticker: string, focus: string) => {
    setHistory((prev) => [...prev, { type: 'signal' as const, content: '[X-ADVISOR] Collecting profile and tweet data...' }].slice(-140));

    const response = await fetch('/v1/twitter/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        ticker,
        projectName: '',
        rapidApiKey: import.meta.env.VITE_RAPIDAPI_KEY || ''
      })
    });
    const json = await response.json();
    if (!response.ok || !json?.success) {
      throw new Error(json?.error?.message || 'Failed to fetch X data.');
    }

    const data = json.data;
    const userTweets = Array.isArray(data.userTweets) ? data.userTweets : [];
    const searchTweets = Array.isArray(data.searchTweets) ? data.searchTweets : [];
    const mentionTweets = Array.isArray(data.mentionTweets) ? data.mentionTweets : [];
    const sentimentPool = mentionTweets.length > 0 ? mentionTweets : searchTweets;

    const positive = sentimentPool.filter((t: { text: string }) => classifyTweet(t.text) === 'positive').length;
    const negative = sentimentPool.filter((t: { text: string }) => classifyTweet(t.text) === 'negative').length;
    const neutral = Math.max(sentimentPool.length - positive - negative, 0);
    const styleSummary = buildStyleSummary(userTweets);
    const positiveExamples = sentimentPool.filter((t: { text: string }) => classifyTweet(t.text) === 'positive').slice(0, 3);
    const negativeExamples = sentimentPool.filter((t: { text: string }) => classifyTweet(t.text) === 'negative').slice(0, 3);
    const neutralExamples = sentimentPool.filter((t: { text: string }) => classifyTweet(t.text) === 'neutral').slice(0, 3);

    const analysisReport = [
      '-------------------- X ADVISOR REPORT --------------------',
      '[SECTION] PROFILE',
      `[METRIC] Name: ${data.profile?.name || '-'} (@${data.profile?.screenName || username})`,
      `[METRIC] Followers: ${(data.profile?.followersCount || 0).toLocaleString()}`,
      `[METRIC] Tweets: ${(data.profile?.tweetCount || 0).toLocaleString()}`,
      `[METRIC] Bio: ${data.profile?.description || '-'}`,
      '',
      `[SECTION] MARKET SENTIMENT ($${ticker.toUpperCase()})`,
      `[METRIC] Positive: ${positive} | Negative: ${negative} | Neutral: ${neutral}`,
      '',
      '[SECTION] WRITING STYLE',
      `[METRIC] ${styleSummary}`,
      '',
          `[SECTION] HANDLE MENTION EXAMPLES (@${username})`,
          `[METRIC] Source: ${mentionTweets.length > 0 ? 'handle mention search' : 'fallback to ticker search'}`,
          ...positiveExamples.map((t: { text: string }) => `[POSITIVE] ${t.text}`),
          ...negativeExamples.map((t: { text: string }) => `[NEGATIVE] ${t.text}`),
          ...neutralExamples.map((t: { text: string }) => `[NEUTRAL] ${t.text}`),
      '----------------------------------------------------------'
    ].join('\n');

    setHistory((prev) => [
      ...prev,
      {
        type: 'output' as const,
        content: analysisReport
      }
    ].slice(-140));

    const recentUserTweets = userTweets.slice(0, 15).map((t: { text: string }) => `- ${t.text}`).join('\n');
    const recentMarketTweets = sentimentPool.slice(0, 20).map((t: { text: string }) => `- ${t.text}`).join('\n');

    let recommendations = '';
    try {
      const prompt = `You are an expert X/Twitter growth strategist for web3 founders.
Write only in English.
Given this account and market context, produce:
1) concise style analysis (3 bullets),
2) 10 ready-to-post tweets matching the account style and focus,
3) 5 replies to common community comments,
4) 1 seven-day posting plan.

Username: @${username}
Ticker: $${ticker.toUpperCase()}
Focus: ${focus}
Style stats: ${styleSummary}

Recent user tweets:
${recentUserTweets || '- none'}

Recent ticker-related tweets:
${recentMarketTweets || '- none'}
`;

      const llmResult: any = await fal.subscribe('fal-ai/any-llm', {
        input: {
          model: 'anthropic/claude-sonnet-4.5',
          prompt
        },
        logs: true
      });
      recommendations = llmResult?.data?.output || llmResult?.data?.text || '';
    } catch {
      recommendations = `Fallback content pack:
- Post one short progress update daily with a single CTA.
- Publish two educational threads per week.
- Reply to first 20 comments within 15 minutes.

Sample tweets:
1) Shipping update: we improved onboarding speed by 28%. What should we optimize next?
2) Building in public: this week we fixed 3 bottlenecks in our agent pipeline.
3) We are testing a new autonomous workflow. Reply \"early\" for beta access.`;
    }

    const contentPack = [
      '----------------- RECOMMENDED CONTENT PACK -----------------',
      '[SECTION] COPY THIS OUTPUT DIRECTLY TO YOUR WORKFLOW',
      recommendations,
      '------------------------------------------------------------'
    ].join('\n\n');

    const fullReport = `${analysisReport}\n\n${contentPack}`;
    setLastAdvisorReport(fullReport);

    setHistory((prev) => [
      ...prev,
      {
        type: 'output' as const,
        content: contentPack
      },
      {
        type: 'signal' as const,
        content: '[X-ADVISOR] Session complete. Use copy_report to copy or save_report to store it on desktop.'
      }
    ].slice(-140));
  };

  const handleExecute = async (command: string) => {
    const normalized = command.toLowerCase().trim();

    setHistory((prev) => [...prev, { type: 'input' as const, content: command }]);

    if (normalized === 'x_advisor' || normalized === 'twitter_advisor' || normalized === 'xadvisor') {
      setXAdvisor({ step: 'await_username', username: '', ticker: '', focus: '' });
      setHistory((prev) => [
        ...prev,
        {
          type: 'output' as const,
          content: [
            '[X-ADVISOR] Interactive mode started.',
            'Step 1/3: Enter Twitter username (without @).',
            'Type "cancel" to exit wizard.'
          ].join('\n')
        }
      ].slice(-140));
      setInputObj('');
      return;
    }

    if (xAdvisor.step !== 'idle' && xAdvisor.step !== 'running') {
      if (normalized === 'cancel') {
        setXAdvisor({ step: 'idle', username: '', ticker: '', focus: '' });
        setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] Wizard cancelled.' }].slice(-140));
        setInputObj('');
        return;
      }

      if (xAdvisor.step === 'await_username') {
        const username = command.replace(/^@/, '').trim();
        if (!username) {
          setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] Username cannot be empty. Try again.' }].slice(-140));
          setInputObj('');
          return;
        }
        setXAdvisor((prev) => ({ ...prev, step: 'await_ticker', username }));
        setHistory((prev) => [...prev, { type: 'output' as const, content: `Step 2/3: Enter ticker for @${username} (example: COS).` }].slice(-140));
        setInputObj('');
        return;
      }

      if (xAdvisor.step === 'await_ticker') {
        const ticker = command.replace(/^\$/, '').trim().toUpperCase();
        if (!ticker) {
          setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] Ticker cannot be empty. Try again.' }].slice(-140));
          setInputObj('');
          return;
        }
        setXAdvisor((prev) => ({ ...prev, step: 'await_focus', ticker }));
        setHistory((prev) => [...prev, { type: 'output' as const, content: `Step 3/3: Enter focus area (growth, awareness, engagement, conversion, etc.).` }].slice(-140));
        setInputObj('');
        return;
      }

      if (xAdvisor.step === 'await_focus') {
        const focus = command.trim() || 'growth';
        const username = xAdvisor.username;
        const ticker = xAdvisor.ticker;
        setXAdvisor((prev) => ({ ...prev, step: 'running', focus }));
        setInputObj('');

        try {
          await runXAdvisor(username, ticker, focus);
        } catch (err) {
          setHistory((prev) => [...prev, { type: 'output' as const, content: `[X-ADVISOR] Error: ${err instanceof Error ? err.message : String(err)}` }].slice(-140));
        } finally {
          setXAdvisor({ step: 'idle', username: '', ticker: '', focus: '' });
        }
        return;
      }
    }

    if (normalized === 'clear') {
      setHistory([{ type: 'output' as const, content: `${bannerText}\n\nDisplay buffer cleared.` }]);
      setInputObj('');
      return;
    }

    if (normalized === 'copy_report') {
      if (!lastAdvisorReport) {
        setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] No report available yet. Run x_advisor first.' }].slice(-140));
        setInputObj('');
        return;
      }
      try {
        await navigator.clipboard.writeText(lastAdvisorReport);
        setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] Report copied to clipboard.' }].slice(-140));
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = lastAdvisorReport;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] Report copied to clipboard (fallback).' }].slice(-140));
      }
      setInputObj('');
      return;
    }

    if (normalized.startsWith('save_report')) {
      if (!lastAdvisorReport) {
        setHistory((prev) => [...prev, { type: 'output' as const, content: '[X-ADVISOR] No report available yet. Run x_advisor first.' }].slice(-140));
        setInputObj('');
        return;
      }
      const customName = command.split(' ').slice(1).join(' ').trim();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseName = customName || `x-advisor-report-${timestamp}`;
      const fileName = baseName.endsWith('.txt') ? baseName : `${baseName}.txt`;
      createFile(fileName, 'file', 'desktop', lastAdvisorReport);
      setHistory((prev) => [...prev, { type: 'output' as const, content: `[X-ADVISOR] Saved to desktop as ${fileName}` }].slice(-140));
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
        let icon: React.ReactNode = <span>??</span>;
        let size = { width: 800, height: 600 };

        if (result.sideEffect.title === 'Flappy Agent') {
          const walletArg = command.split(' ')[1] || agent.wallet || '0xGuest';
          const { default: FlappyAgent } = await import('./FlappyAgent');
          component = <FlappyAgent wallet={walletArg} />;
          icon = <span>??</span>;
          size = { width: 700, height: 500 };
        } else if (result.sideEffect.title === 'Agent Arena') {
          const { default: AgentArena } = await import('./AgentArena');
          component = <AgentArena spectatorOnly={true} />;
          icon = <span>???</span>;
          size = { width: 1000, height: 700 };
        } else if (result.sideEffect.title === 'Agent Arena Play') {
          const arenaWallet = result.sideEffect.url || agent.wallet || '';
          const { default: AgentArena } = await import('./AgentArena');
          component = <AgentArena wallet={arenaWallet} spectatorOnly={false} />;
          icon = <span>???</span>;
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
                <div className={entry.type === 'signal' ? 'animate-pulse' : ''} style={{ userSelect: 'text' }}>
                  {entry.content.split('\n').map((line, lineIdx) => (
                    <div key={lineIdx} className={toneForLine(line)} style={{ userSelect: 'text' }}>
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
            disabled={!!terminalCommand || xAdvisor.step === 'running'}
            placeholder="Try: x_advisor, help, scan_feed, demo_ops, init ..."
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalApp;


