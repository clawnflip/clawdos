import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trophy, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// --- Types ---
type Personality = 'hunter' | 'farmer' | 'opportunist' | 'berserker' | 'camper';

interface Food {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface Agent {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  personality: Personality;
  color: string;
  alive: boolean;
  respawnTimer: number;
  score: number;
  kills: number;
  targetX: number;
  targetY: number;
  wallet?: string;
  isPlayer?: boolean;
  campX?: number;
  campY?: number;
}

interface LeaderboardEntry {
  agent_name: string;
  wallet: string;
  score: number;
  personality: string;
}

interface AgentArenaProps {
  wallet?: string;
  spectatorOnly?: boolean;
}

// --- Constants ---
const WORLD_W = 3000;
const WORLD_H = 3000;
const FOOD_COUNT = 120;
const MAX_AGENTS = 20;
const MIN_AGENTS = 8;
const BASE_RADIUS = 15;
const BASE_SPEED = 2.5;
const FOOD_MASS = 1;
const RESPAWN_TIME = 3000; // ms
const GRID_SIZE = 60;

const PERSONALITY_COLORS: Record<Personality, string> = {
  hunter: '#ef4444',
  farmer: '#22c55e',
  opportunist: '#3b82f6',
  berserker: '#f97316',
  camper: '#a855f7',
};

const PERSONALITY_LABELS: Record<Personality, string> = {
  hunter: 'HUNTER',
  farmer: 'FARMER',
  opportunist: 'OPP',
  berserker: 'BERSERK',
  camper: 'CAMPER',
};

const FOOD_COLORS = [
  '#ff6b6b', '#ffa502', '#ffd43b', '#69db7c', '#4ecdc4',
  '#74b9ff', '#a29bfe', '#fd79a8', '#e17055', '#00cec9',
];

// --- Helpers ---
const randHex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
const randInRange = (min: number, max: number) => Math.random() * (max - min) + min;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
const massToRadius = (mass: number) => BASE_RADIUS + Math.sqrt(mass) * 2;
const massToSpeed = (mass: number) => Math.max(0.8, BASE_SPEED - mass * 0.008);
const lerpAngle = (cx: number, cy: number, tx: number, ty: number, speed: number) => {
  const angle = Math.atan2(ty - cy, tx - cx);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
};

const pickPersonality = (): Personality => {
  const r = Math.random();
  if (r < 0.2) return 'hunter';
  if (r < 0.4) return 'farmer';
  if (r < 0.6) return 'opportunist';
  if (r < 0.8) return 'berserker';
  return 'camper';
};

const createAgent = (wallet?: string, isPlayer?: boolean): Agent => {
  const personality = pickPersonality();
  const name = wallet
    ? `Agent_${wallet.slice(2, 6)}`
    : `Agent_0x${randHex()}`;
  const x = randInRange(200, WORLD_W - 200);
  const y = randInRange(200, WORLD_H - 200);
  return {
    id: Math.random().toString(36).slice(2),
    name,
    x,
    y,
    vx: 0,
    vy: 0,
    mass: 10,
    personality,
    color: isPlayer ? '#fbbf24' : PERSONALITY_COLORS[personality],
    alive: true,
    respawnTimer: 0,
    score: 0,
    kills: 0,
    targetX: x,
    targetY: y,
    wallet: wallet || undefined,
    isPlayer: isPlayer || false,
    campX: x,
    campY: y,
  };
};

const createFood = (): Food => ({
  x: randInRange(50, WORLD_W - 50),
  y: randInRange(50, WORLD_H - 50),
  radius: randInRange(3, 6),
  color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
});

// --- Boot Messages ---
const BOOT_MESSAGES = [
  '[ARENA] Initializing Agent Arena Protocol...',
  '[ARENA] Connecting to battle servers...',
  '[ARENA] Loading AI behavior modules...',
  '[ARENA] Calibrating physics engine...',
];

// --- Component ---
const AgentArena: React.FC<AgentArenaProps> = ({ wallet, spectatorOnly = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number>(0);
  const agentsRef = useRef<Agent[]>([]);
  const foodRef = useRef<Food[]>([]);
  const cameraRef = useRef({ x: WORLD_W / 2, y: WORLD_H / 2 });
  const followIdxRef = useRef(0);
  const autoFollowRef = useRef(true);
  const logsRef = useRef<string[]>([]);
  const frameRef = useRef(0);

  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [liveRanking, setLiveRanking] = useState<{ name: string; mass: number; personality: string; isPlayer: boolean }[]>([]);
  const [allTimeBoard, setAllTimeBoard] = useState<LeaderboardEntry[]>([]);
  const [followName, setFollowName] = useState('');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [agentCount, setAgentCount] = useState(0);

  // --- Leaderboard ---
  const loadAllTimeBoard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agario_leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);
      if (data && !error) setAllTimeBoard(data);
    } catch {
      const saved = localStorage.getItem('arena_leaderboard');
      if (saved) setAllTimeBoard(JSON.parse(saved));
    }
  }, []);

  const saveScore = useCallback(async (agent: Agent) => {
    if (agent.score <= 0) return;
    const entry = {
      agent_name: agent.name,
      wallet: agent.wallet || 'AI',
      score: agent.score,
      personality: agent.personality,
    };
    const { error } = await supabase.from('agario_leaderboard').insert([entry]);
    if (error) {
      const saved = localStorage.getItem('arena_leaderboard');
      const list: LeaderboardEntry[] = saved ? JSON.parse(saved) : [];
      list.push(entry);
      list.sort((a, b) => b.score - a.score);
      localStorage.setItem('arena_leaderboard', JSON.stringify(list.slice(0, 50)));
    }
    loadAllTimeBoard();
  }, [loadAllTimeBoard]);

  // --- Add log ---
  const addLog = useCallback((msg: string) => {
    logsRef.current = [...logsRef.current.slice(-30), msg];
    setEventLog([...logsRef.current]);
  }, []);

  // --- AI Logic ---
  const aiThink = useCallback((agent: Agent, allAgents: Agent[], food: Food[]) => {
    if (!agent.alive) return;
    const speed = massToSpeed(agent.mass);
    const radius = massToRadius(agent.mass);

    // Find nearest food
    let nearestFood: Food | null = null;
    let nearestFoodDist = Infinity;
    for (const f of food) {
      const d = dist(agent, f);
      if (d < nearestFoodDist) {
        nearestFoodDist = d;
        nearestFood = f;
      }
    }

    // Find agents
    const others = allAgents.filter(a => a.alive && a.id !== agent.id);
    let nearestSmaller: Agent | null = null;
    let nearestSmallerDist = Infinity;
    let nearestBigger: Agent | null = null;
    let nearestBiggerDist = Infinity;

    for (const o of others) {
      const d = dist(agent, o);
      if (o.mass < agent.mass * 0.85) {
        if (d < nearestSmallerDist) {
          nearestSmallerDist = d;
          nearestSmaller = o;
        }
      }
      if (o.mass > agent.mass * 1.15) {
        if (d < nearestBiggerDist) {
          nearestBiggerDist = d;
          nearestBigger = o;
        }
      }
    }

    // Flee from bigger if close
    const fleeRange = radius * 8;
    if (nearestBigger && nearestBiggerDist < fleeRange) {
      const angle = Math.atan2(agent.y - nearestBigger.y, agent.x - nearestBigger.x);
      agent.targetX = agent.x + Math.cos(angle) * 300;
      agent.targetY = agent.y + Math.sin(angle) * 300;
      const v = lerpAngle(agent.x, agent.y, agent.targetX, agent.targetY, speed * 1.2);
      agent.vx = v.vx;
      agent.vy = v.vy;
      return;
    }

    switch (agent.personality) {
      case 'hunter':
        if (nearestSmaller && nearestSmallerDist < 500) {
          agent.targetX = nearestSmaller.x;
          agent.targetY = nearestSmaller.y;
        } else if (nearestFood) {
          agent.targetX = nearestFood.x;
          agent.targetY = nearestFood.y;
        }
        break;

      case 'farmer':
        if (nearestFood) {
          agent.targetX = nearestFood.x;
          agent.targetY = nearestFood.y;
        }
        break;

      case 'opportunist':
        if (nearestSmaller && agent.mass > nearestSmaller.mass * 1.3 && nearestSmallerDist < 400) {
          agent.targetX = nearestSmaller.x;
          agent.targetY = nearestSmaller.y;
        } else if (nearestFood) {
          agent.targetX = nearestFood.x;
          agent.targetY = nearestFood.y;
        }
        break;

      case 'berserker':
        if (nearestSmaller && nearestSmallerDist < 600) {
          agent.targetX = nearestSmaller.x;
          agent.targetY = nearestSmaller.y;
        } else if (others.length > 0) {
          const rndTarget = others[Math.floor(Math.random() * others.length)];
          agent.targetX = rndTarget.x;
          agent.targetY = rndTarget.y;
        } else if (nearestFood) {
          agent.targetX = nearestFood.x;
          agent.targetY = nearestFood.y;
        }
        break;

      case 'camper':
        // Stay near campX/campY, eat nearby food and passing agents
        const campDist = dist(agent, { x: agent.campX!, y: agent.campY! });
        if (nearestSmaller && nearestSmallerDist < 200) {
          agent.targetX = nearestSmaller.x;
          agent.targetY = nearestSmaller.y;
        } else if (nearestFood && nearestFoodDist < 250) {
          agent.targetX = nearestFood.x;
          agent.targetY = nearestFood.y;
        } else if (campDist > 100) {
          agent.targetX = agent.campX!;
          agent.targetY = agent.campY!;
        } else {
          // Idle wander
          if (Math.random() < 0.02) {
            agent.targetX = agent.campX! + randInRange(-100, 100);
            agent.targetY = agent.campY! + randInRange(-100, 100);
          }
        }
        break;
    }

    // Lerp toward target
    const d = dist(agent, { x: agent.targetX, y: agent.targetY });
    if (d > 5) {
      const v = lerpAngle(agent.x, agent.y, agent.targetX, agent.targetY, speed);
      agent.vx += (v.vx - agent.vx) * 0.1;
      agent.vy += (v.vy - agent.vy) * 0.1;
    } else {
      agent.vx *= 0.9;
      agent.vy *= 0.9;
    }
  }, []);

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const agents = agentsRef.current;
    const food = foodRef.current;
    frameRef.current++;

    // --- AI Think ---
    for (const a of agents) {
      if (a.alive) aiThink(a, agents, food);
    }

    // --- Move ---
    for (const a of agents) {
      if (!a.alive) continue;
      a.x += a.vx;
      a.y += a.vy;
      // World bounds
      a.x = Math.max(0, Math.min(WORLD_W, a.x));
      a.y = Math.max(0, Math.min(WORLD_H, a.y));
    }

    // --- Eat Food ---
    for (const a of agents) {
      if (!a.alive) continue;
      const r = massToRadius(a.mass);
      for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        if (dist(a, f) < r + f.radius) {
          a.mass += FOOD_MASS;
          a.score += 1;
          food.splice(i, 1);
        }
      }
    }

    // --- Eat Agents ---
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      if (!a.alive) continue;
      const rA = massToRadius(a.mass);
      for (let j = 0; j < agents.length; j++) {
        if (i === j) continue;
        const b = agents[j];
        if (!b.alive) continue;
        if (a.mass > b.mass * 1.15 && dist(a, b) < rA) {
          // A eats B
          const gained = Math.floor(b.mass * 0.5);
          a.mass += gained;
          a.score += b.score + gained;
          a.kills++;
          b.alive = false;
          b.respawnTimer = RESPAWN_TIME;
          addLog(`${a.name} [${PERSONALITY_LABELS[a.personality]}] eliminated ${b.name} (+${b.score + gained})`);
          saveScore(b);
        }
      }
    }

    // --- Respawn dead agents ---
    for (const a of agents) {
      if (!a.alive) {
        a.respawnTimer -= 16;
        if (a.respawnTimer <= 0) {
          a.alive = true;
          a.x = randInRange(200, WORLD_W - 200);
          a.y = randInRange(200, WORLD_H - 200);
          a.mass = 10;
          a.score = 0;
          a.kills = 0;
          a.vx = 0;
          a.vy = 0;
          a.campX = a.x;
          a.campY = a.y;
          addLog(`${a.name} [${PERSONALITY_LABELS[a.personality]}] respawned`);
        }
      }
    }

    // --- Maintain food count ---
    while (food.length < FOOD_COUNT) {
      food.push(createFood());
    }

    // --- Maintain agent count ---
    const aliveCount = agents.filter(a => a.alive || a.respawnTimer > 0).length;
    if (aliveCount < MIN_AGENTS && agents.length < MAX_AGENTS) {
      const newAgent = createAgent();
      agents.push(newAgent);
      addLog(`${newAgent.name} [${PERSONALITY_LABELS[newAgent.personality]}] joined the arena`);
    }

    // --- Camera: follow tracked agent ---
    const aliveAgents = agents.filter(a => a.alive);
    if (autoFollowRef.current && aliveAgents.length > 0) {
      // Follow the biggest
      aliveAgents.sort((a, b) => b.mass - a.mass);
      followIdxRef.current = agents.indexOf(aliveAgents[0]);
    }

    const followed = agents[followIdxRef.current];
    if (followed && followed.alive) {
      cameraRef.current.x += (followed.x - cameraRef.current.x) * 0.08;
      cameraRef.current.y += (followed.y - cameraRef.current.y) * 0.08;
    }

    // --- Draw ---
    const W = canvas.width;
    const H = canvas.height;
    const cam = cameraRef.current;
    const offsetX = W / 2 - cam.x;
    const offsetY = H / 2 - cam.y;

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const startGX = Math.floor((cam.x - W / 2) / GRID_SIZE) * GRID_SIZE;
    const startGY = Math.floor((cam.y - H / 2) / GRID_SIZE) * GRID_SIZE;
    for (let gx = startGX; gx < cam.x + W / 2; gx += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(gx + offsetX, 0);
      ctx.lineTo(gx + offsetX, H);
      ctx.stroke();
    }
    for (let gy = startGY; gy < cam.y + H / 2; gy += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, gy + offsetY);
      ctx.lineTo(W, gy + offsetY);
      ctx.stroke();
    }

    // World border
    ctx.strokeStyle = 'rgba(255,0,0,0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX, offsetY, WORLD_W, WORLD_H);

    // Food
    for (const f of food) {
      const sx = f.x + offsetX;
      const sy = f.y + offsetY;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(sx, sy, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Agents
    for (const a of agents) {
      if (!a.alive) continue;
      const sx = a.x + offsetX;
      const sy = a.y + offsetY;
      const r = massToRadius(a.mass);
      if (sx < -r * 2 || sx > W + r * 2 || sy < -r * 2 || sy > H + r * 2) continue;

      // Glow
      const grad = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 1.2);
      grad.addColorStop(0, a.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Player ring
      if (a.isPlayer) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Followed indicator
      if (agents.indexOf(a) === followIdxRef.current) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(sx, sy, r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Name
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(a.name, sx, sy - r - 10);

      // Mass
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`${Math.floor(a.mass)}`, sx, sy + 4);
    }

    // Minimap
    const mmSize = 120;
    const mmX = W - mmSize - 10;
    const mmY = H - mmSize - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmSize, mmSize);

    for (const a of agents) {
      if (!a.alive) continue;
      const mx = mmX + (a.x / WORLD_W) * mmSize;
      const my = mmY + (a.y / WORLD_H) * mmSize;
      ctx.fillStyle = a.isPlayer ? '#fbbf24' : a.color;
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(2, massToRadius(a.mass) * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }

    // Camera viewport on minimap
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    const vpX = mmX + ((cam.x - W / 2) / WORLD_W) * mmSize;
    const vpY = mmY + ((cam.y - H / 2) / WORLD_H) * mmSize;
    const vpW = (W / WORLD_W) * mmSize;
    const vpH = (H / WORLD_H) * mmSize;
    ctx.strokeRect(vpX, vpY, vpW, vpH);

    // --- Update UI state (every 30 frames) ---
    if (frameRef.current % 30 === 0) {
      const ranking = agents
        .filter(a => a.alive)
        .sort((a, b) => b.mass - a.mass)
        .slice(0, 10)
        .map(a => ({ name: a.name, mass: Math.floor(a.mass), personality: a.personality, isPlayer: !!a.isPlayer }));
      setLiveRanking(ranking);
      setAgentCount(agents.filter(a => a.alive).length);
      if (followed && followed.alive) {
        setFollowName(followed.name);
      }
    }

    requestIdRef.current = requestAnimationFrame(gameLoop);
  }, [aiThink, addLog, saveScore]);

  // --- Spectator Controls ---
  const cycleFollow = useCallback((dir: number) => {
    autoFollowRef.current = false;
    const alive = agentsRef.current.filter(a => a.alive);
    if (alive.length === 0) return;
    const currentIdx = alive.findIndex(a => agentsRef.current.indexOf(a) === followIdxRef.current);
    let next = (currentIdx + dir + alive.length) % alive.length;
    followIdxRef.current = agentsRef.current.indexOf(alive[next]);
  }, []);

  const toggleAutoFollow = useCallback(() => {
    autoFollowRef.current = !autoFollowRef.current;
  }, []);

  // --- Boot Sequence ---
  useEffect(() => {
    let idx = 0;
    const lines = [...BOOT_MESSAGES];

    // Init agents & food
    const agents: Agent[] = [];
    const food: Food[] = [];

    // If wallet provided, create player agent
    if (wallet && !spectatorOnly) {
      const playerAgent = createAgent(wallet, true);
      agents.push(playerAgent);
      lines.push(`[ARENA] Spawning ${playerAgent.name} [YOUR AGENT] (${PERSONALITY_LABELS[playerAgent.personality]})...`);
    }

    // Fill with AI
    const targetCount = Math.max(MIN_AGENTS, Math.floor(Math.random() * 8) + MIN_AGENTS);
    for (let i = agents.length; i < targetCount; i++) {
      const a = createAgent();
      agents.push(a);
      if (i < agents.length && i < 5 + (wallet ? 1 : 0)) {
        lines.push(`[ARENA] Spawning ${a.name} [${PERSONALITY_LABELS[a.personality]}]...`);
      }
    }

    lines.push(`[ARENA] ${agents.length} agents ready. Room #1 is LIVE.`);
    lines.push(`[ARENA] Spectator mode activated. Enjoy the show.`);

    // Init food
    for (let i = 0; i < FOOD_COUNT; i++) food.push(createFood());

    agentsRef.current = agents;
    foodRef.current = food;

    // If player agent exists, follow it
    if (wallet && !spectatorOnly) {
      const playerIdx = agents.findIndex(a => a.isPlayer);
      if (playerIdx >= 0) {
        followIdxRef.current = playerIdx;
        autoFollowRef.current = false;
      }
    }

    // Typing effect for boot
    const interval = setInterval(() => {
      if (idx < lines.length) {
        setBootLines(prev => [...prev, lines[idx]]);
        idx++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 600);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [wallet, spectatorOnly]);

  // --- Start game loop after boot ---
  useEffect(() => {
    if (!booting) {
      loadAllTimeBoard();

      // Realtime subscription
      const channel = supabase
        .channel('public:agario_leaderboard')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agario_leaderboard' }, () => {
          loadAllTimeBoard();
        })
        .subscribe();

      requestIdRef.current = requestAnimationFrame(gameLoop);

      return () => {
        cancelAnimationFrame(requestIdRef.current);
        supabase.removeChannel(channel);
      };
    }
  }, [booting, gameLoop, loadAllTimeBoard]);

  // --- Keyboard ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') cycleFollow(-1);
      if (e.key === 'ArrowRight') cycleFollow(1);
      if (e.key === 'a' || e.key === 'A') toggleAutoFollow();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cycleFollow, toggleAutoFollow]);

  // --- Render ---
  if (booting) {
    return (
      <div className="w-full h-full bg-[#0a0a0f] text-green-400 font-mono text-sm p-6 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col justify-center">
          {bootLines.map((line, i) => (
            <div key={i} className="mb-1 animate-in fade-in slide-in-from-left-2 duration-200">
              {line}
            </div>
          ))}
          <span className="inline-block w-2 h-4 bg-green-400 animate-pulse mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0f] text-white font-mono text-xs overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-[#0f0f18] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-base">🏟️</span>
          <span className="font-bold text-sm">Agent Arena</span>
          <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full border border-red-500/30 animate-pulse">
            LIVE
          </span>
          <span className="text-gray-500 text-[10px]">Room #1 ({agentCount}/{MAX_AGENTS})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cycleFollow(-1)}
            className="p-1 hover:bg-white/10 rounded transition"
            title="Previous agent"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-1 text-[10px]">
            <Eye size={12} className="text-gray-400" />
            <span className="text-gray-300">{followName}</span>
          </div>
          <button
            onClick={() => cycleFollow(1)}
            className="p-1 hover:bg-white/10 rounded transition"
            title="Next agent"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={toggleAutoFollow}
            className={`text-[10px] px-2 py-0.5 rounded border transition ${
              autoFollowRef.current
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-white/5 text-gray-500 border-white/10'
            }`}
          >
            AUTO
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-52 border-l border-white/10 bg-[#0c0c14] flex flex-col shrink-0 overflow-hidden">
          {/* Live Ranking */}
          <div className="p-2 border-b border-white/10">
            <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold mb-2">
              <Trophy size={12} />
              LIVE RANKING
            </div>
            <div className="space-y-1">
              {liveRanking.map((r, i) => (
                <div
                  key={r.name}
                  className={`flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded ${
                    r.isPlayer ? 'bg-yellow-500/10 border border-yellow-500/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 truncate">
                    <span className={i < 3 ? 'text-yellow-400' : 'text-gray-500'}>
                      {i + 1}.
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PERSONALITY_COLORS[r.personality as Personality] }}
                    />
                    <span className="truncate text-gray-300">{r.name}</span>
                  </div>
                  <span className="text-white font-bold ml-1">{r.mass}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All-Time */}
          <div className="p-2 flex-1 overflow-y-auto">
            <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold mb-2">
              ⭐ ALL-TIME BEST
            </div>
            <div className="space-y-1">
              {allTimeBoard.slice(0, 10).map((e, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] px-1.5 py-0.5">
                  <div className="flex items-center gap-1 truncate">
                    <span>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span className="truncate text-gray-400">{e.agent_name}</span>
                  </div>
                  <span className="text-purple-300 font-bold">{e.score.toLocaleString()}</span>
                </div>
              ))}
              {allTimeBoard.length === 0 && (
                <div className="text-gray-600 text-center py-2">No records yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Log Bar */}
      <div className="px-3 py-1.5 border-t border-white/10 bg-[#0c0c14] text-[10px] text-gray-500 overflow-hidden shrink-0 flex items-center gap-2">
        <span className="text-green-500">&gt;</span>
        <div className="flex-1 truncate">
          {eventLog.length > 0 ? eventLog[eventLog.length - 1] : 'Waiting for action...'}
        </div>
        {wallet && !spectatorOnly && (
          <span className="text-yellow-400/50 shrink-0">Your Agent Active</span>
        )}
      </div>
    </div>
  );
};

export default AgentArena;
