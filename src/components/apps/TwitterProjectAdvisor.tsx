import React, { useMemo, useState } from 'react';
import { fal } from '@fal-ai/client';
import { Loader2, Search, TrendingUp, Users, MessageSquareWarning } from 'lucide-react';

fal.config({ credentials: import.meta.env.VITE_FAL_KEY });

type Tweet = {
  id: string;
  text: string;
  createdAt: string;
  favoriteCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
};

type Profilee = {
  name: string;
  screenName: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  description: string;
  verified: boolean;
};

type Sentiment = {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
};

type AdvisorPayload = {
  username: string;
  ticker: string;
  profile: Profilee;
  userTweets: Tweet[];
  searchTweets: Tweet[];
  sentiment: Sentiment;
};

const TwitterProjectAdvisor: React.FC = () => {
  const [username, setUsername] = useState('');
  const [ticker, setTicker] = useState('');
  const [projectName, setProjectName] = useState('');
  const [focus, setFocus] = useState('Community growth and trust building');
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<AdvisorPayload | null>(null);
  const [advice, setAdvice] = useState('');

  const topTweet = useMemo(() => {
    if (!payload?.userTweets?.length) return null;
    return [...payload.userTweets]
      .sort((a, b) => (b.favoriteCount + b.retweetCount) - (a.favoriteCount + a.retweetCount))[0];
  }, [payload]);

  const formatDate = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('tr-TR');
  };

  const classifySentiment = (text: string): 'Positive' | 'Negative' | 'Neutral' => {
    const lower = text.toLowerCase();
    const positiveTerms = [
      'bull', 'pumped', 'moon', 'win', 'good', 'great', 'strong', 'breakout',
      'partnership', 'launch', 'listed', 'adoption', 'milestone', 'up only'
    ];
    const negativeTerms = [
      'bear', 'dump', 'scam', 'rug', 'hack', 'exploit', 'bad', 'weak', 'delay',
      'sell', 'down', 'fud', 'issue', 'problem'
    ];
    const pos = positiveTerms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
    const neg = negativeTerms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
    if (pos > neg) return 'Positive';
    if (neg > pos) return 'Negative';
    return 'Neutral';
  };

  const buildPrompt = (data: AdvisorPayload) => {
    const userTweetDigest = data.userTweets
      .slice(0, 12)
      .map((tweet) => `- ${tweet.text.slice(0, 260)}`)
      .join('\n');

    const marketTweetDigest = data.searchTweets
      .slice(0, 20)
      .map((tweet) => `- ${tweet.text.slice(0, 260)}`)
      .join('\n');

    return `
You are ClawdOS Project Operator Agent. Speak Turkish.
Goal: Give practical, high-signal execution advice for a web3 project team.

INPUT:
- Username: @${data.username}
- Project ticker: $${data.ticker}
- Optional project name: ${projectName || 'N/A'}
- Focus area from user: ${focus}
- Profilee followers: ${data.profile.followersCount}
- Profilee tweet count: ${data.profile.tweetCount}
- Sentiment summary: total=${data.sentiment.total}, positive=${data.sentiment.positive}, negative=${data.sentiment.negative}, neutral=${data.sentiment.neutral}

Recent tweets by the team:
${userTweetDigest || '- none'}

Market/community tweets about ticker:
${marketTweetDigest || '- none'}

OUTPUT FORMAT (strict):
1) Durum Ozeti (max 4 bullet)
2) En Kritik 5 Problem (numbered)
3) 7 Gunluk Aksiyon Plani (day-by-day)
4) Icerik Stratejisi (tweet thread/video/spaces ideas)
5) Topluluk ve Growth Deneyleri (max 5)
6) Riskler ve Kacinilacak Hatalar (max 6)
7) KPI Takip Tablosu (simple markdown table)

Rules:
- Be concrete and execution-first.
- No investment advice.
- No generic fluff.
- Mention exact next actions with measurable outcomes.
`;
  };

  const runAdvisor = async () => {
    const cleanUsername = username.replace(/^@/, '').trim();
    const cleanTicker = ticker.replace(/^\$/, '').trim().toUpperCase();

    if (!cleanUsername || !cleanTicker) {
      setError('Please enter Twitter username and ticker.');
      return;
    }

    setError('');
    setAdvice('');
    setPayload(null);
    setLoadingData(true);

    try {
      const response = await fetch('/v1/twitter/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          ticker: cleanTicker,
          projectName,
          rapidApiKey: import.meta.env.VITE_RAPIDAPI_KEY || ''
        })
      });

      const json = await response.json();
      if (!response.ok || !json?.success) {
        throw new Error(json?.error?.message || 'Failed to fetch Twitter data.');
      }

      setPayload(json.data as AdvisorPayload);
      setLoadingData(false);
      setLoadingAdvice(true);

      const prompt = buildPrompt(json.data as AdvisorPayload);
      const result: any = await fal.subscribe('fal-ai/any-llm', {
        input: {
          model: 'anthropic/claude-sonnet-4.5',
          prompt
        },
        logs: true
      });

      const output = result?.data?.output || result?.data?.text || '';
      setAdvice(typeof output === 'string' ? output : 'Failed to generate recommendations.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred.');
    } finally {
      setLoadingData(false);
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0d14] text-white p-5 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="rounded-2xl border border-cyan-500/20 bg-[#101828] p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-cyan-300" size={18} />
            Twitter Project Advisor Agent
          </h1>
          <p className="text-sm text-gray-300 mt-2">
            Collects Twitter profile and ticker discussions, then produces actionable recommendations with the ClawdOS agent model.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 grid md:grid-cols-2 gap-3">
          <label className="text-sm space-y-1">
            <span className="text-gray-300">Twitter username</span>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/15 p-2 outline-none focus:border-cyan-400"
              placeholder="@myproject"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-gray-300">Ticker</span>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/15 p-2 outline-none focus:border-cyan-400"
              placeholder="$COS"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-gray-300">Project name (optional)</span>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/15 p-2 outline-none focus:border-cyan-400"
              placeholder="ClawdOS"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-gray-300">Focus</span>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/15 p-2 outline-none focus:border-cyan-400"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </label>
          <button
            onClick={runAdvisor}
            disabled={loadingData || loadingAdvice}
            className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 disabled:opacity-60"
          >
            {(loadingData || loadingAdvice) ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            {(loadingData || loadingAdvice) ? 'Running analysis...' : 'Start Analysis'}
          </button>
          {error && <p className="md:col-span-2 text-sm text-red-300">{error}</p>}
        </div>

        {payload && (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs text-gray-400">Profile</p>
              <p className="mt-1 font-semibold">{payload.profile.name} @{payload.profile.screenName}</p>
              <p className="text-sm text-gray-300 mt-2">{payload.profile.description || 'Aciklama yok'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1"><Users size={14} /> Followers</p>
              <p className="text-2xl font-bold mt-1">{payload.profile.followersCount.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-2">Tweet count: {payload.profile.tweetCount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1"><MessageSquareWarning size={14} /> Ticker sentiment</p>
              <p className="text-sm mt-2 text-green-300">Positive: {payload.sentiment.positive}</p>
              <p className="text-sm text-red-300">Negative: {payload.sentiment.negative}</p>
              <p className="text-sm text-gray-300">Neutral: {payload.sentiment.neutral}</p>
            </div>
            {topTweet && (
              <div className="md:col-span-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-xs text-cyan-200">Top recent engagement tweet</p>
                <p className="mt-2 text-sm text-gray-100 whitespace-pre-wrap">{topTweet.text}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Likes: {topTweet.favoriteCount} | RT: {topTweet.retweetCount} | Replies: {topTweet.replyCount}
                </p>
              </div>
            )}

            <div className="md:col-span-3 rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-sm font-semibold text-white">User Tweets ({payload.userTweets.length})</p>
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {payload.userTweets.length === 0 && (
                  <p className="text-xs text-gray-400">No tweets found.</p>
                )}
                {payload.userTweets.map((tweet) => (
                  <div key={`u-${tweet.id}`} className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-sm text-gray-100 whitespace-pre-wrap">{tweet.text}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(tweet.createdAt)} | Likes {tweet.favoriteCount} | RT {tweet.retweetCount} | Reply {tweet.replyCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 rounded-xl border border-white/10 bg-[#0f172a] p-4">
              <p className="text-sm font-semibold text-white">Ticker Search Results ({payload.searchTweets.length})</p>
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {payload.searchTweets.length === 0 && (
                  <p className="text-xs text-gray-400">No search results found.</p>
                )}
                {payload.searchTweets.map((tweet) => (
                  <div key={`s-${tweet.id}`} className="rounded-lg border border-white/10 bg-black/20 p-2">
                    {(() => {
                      const sentiment = classifySentiment(tweet.text);
                      const cls = sentiment === 'Positive'
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : sentiment === 'Negative'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-gray-500/20 text-gray-300 border-gray-500/30';
                      return (
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mb-2 ${cls}`}>
                          {sentiment}
                        </span>
                      );
                    })()}
                    <p className="text-sm text-gray-100 whitespace-pre-wrap">{tweet.text}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(tweet.createdAt)} | Likes {tweet.favoriteCount} | RT {tweet.retweetCount} | Reply {tweet.replyCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {advice && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h2 className="font-semibold text-emerald-200 mb-3">Agent Recommendations</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-100 font-sans">{advice}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterProjectAdvisor;

