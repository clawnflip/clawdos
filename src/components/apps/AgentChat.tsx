import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../i18n/translations';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import Logo from '../os/Logo';
import { fal } from "@fal-ai/client";
import { CLAW_OS_SYSTEM_PROMPT, CLAW_OS_CHAT_PROMPT } from '../../utils/systemPrompt';

// Configure fal with the proxy or client key
// We use the exposed key for this demo.
fal.config({ credentials: import.meta.env.VITE_FAL_KEY }); 

const AgentChat: React.FC = () => {
  const { agent, setAgent, executeTerminalCommand, openWindow } = useOS();
  const { language } = useLanguage();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handlePreviewApp = (code: string) => {
    import('./MiniAppRunner').then(module => {
        const MiniAppRunner = module.default;
        openWindow(
            'Mini App Preview',
            <MiniAppRunner initialCode={code} />,
            <span className="text-xl">📱</span>,
            { width: 1000, height: 750 }
        );
    });
  };
  
  const getInitialMessage = () => {
      return agent.name 
            ? `${getTranslation('agent.online', language)} ${agent.name}.` 
            : `${getTranslation('agent.systemHalted', language)}\n\n${getTranslation('agent.provideInfo', language)}`;
  };

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent', text: string }>>([
    { 
        sender: 'agent', 
        text: getInitialMessage()
    }
  ]);
  
  // Update initial message when language changes (only if it's the first and only message)
  useEffect(() => {
      if (messages.length === 1 && messages[0].sender === 'agent') {
          setMessages([{
              sender: 'agent',
              text: getInitialMessage()
          }]);
      }
  }, [language, agent.name]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-open Preview
  // We need to track the last handled code block to avoid opening it multiple times or on every re-render
  const lastOpenedCodeRef = useRef<string | null>(null);

  useEffect(() => {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender === 'agent' && !isStreaming) {
          // Check for code block
          const codeBlockMatch = lastMsg.text.match(/```(html|xml|jsx|tsx)?\s*([\sS]*?)```/);
          if (codeBlockMatch) {
              const code = codeBlockMatch[2];
              if (code !== lastOpenedCodeRef.current) {
                  lastOpenedCodeRef.current = code;
                  handlePreviewApp(code);
              }
          }
      }
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    // INTERCEPT: Flappy Agent Command
    // Matches: "play flappy", "play_flappy", "play flip", "play fly"
    const flappyMatch = userMsg.match(/^(?:play[_ ]?(?:flappy|flip|fly))(?:\s+(0x[a-fA-F0-9]+))?/i);
    
    if (flappyMatch) {
         const wallet = flappyMatch[1] || agent.wallet;
         if (!wallet) {
             setMessages(prev => [...prev, { 
                 sender: 'agent', 
                 text: "To play Flappy Agent, I need a wallet address. Please provide one or ensure you are logged in.\n\nUsage: `play_flappy <wallet_address>`" 
             }]);
             return;
         }

         setMessages(prev => [...prev, { 
             sender: 'agent', 
             text: `Initializing **Flappy Agent Protocol** for wallet: \`${wallet}\`...` 
         }]);
         
         executeTerminalCommand(`play_flappy ${wallet}`);
         return;
    }

    // INTERCEPT: Test Office Agent
    if (userMsg.toLowerCase() === 'test_office_agent') {
        setMessages(prev => [...prev, { 
            sender: 'agent', 
            text: "Initializing Office Suite Test Protocol...\n\nCreating test files..." 
        }]);

        // Create files via OS Context command or direct manipulation
        // Since we are in the component, we can use useOS() directly if we had exposed createFile
        // But we didn't expose createFile in the hook usage here, let's check imports.
        // trace: const { agent, setAgent, executeTerminalCommand, openWindow } = useOS();
        // We need createFile!
        
        // Let's add createFile to destructuring
        // We'll do this in a separate step or assume I'll fix the destructuring below.
        executeTerminalCommand('test_office_automation');
        return;
    }

    // INTERCEPT: Super Mario Demo
    if (userMsg.toLowerCase().includes('code super mario minigame app')) {
        setIsStreaming(true);
        
        // 1. Initial acknowledgment
        setMessages(prev => [
            ...prev,
            {
                text: "initializing super_mario_protocol.sh...",
                sender: 'agent'
            }
        ]);

        const marioCode = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Mini Mario-Style Platformer</title>
  <style>
    html, body { height: 100%; margin: 0; background:#0b1220; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    .wrap { height: 100%; display:flex; align-items:center; justify-content:center; }
    canvas { background: linear-gradient(#6bb7ff, #bfe6ff 55%, #7ed957 56%, #4fbf5a 100%); border-radius: 16px; box-shadow: 0 18px 60px rgba(0,0,0,.45); }
    .hud {
      position: fixed; top: 12px; left: 12px; right: 12px;
      display:flex; gap: 10px; align-items:center; justify-content:space-between;
      color: rgba(255,255,255,.92); font-weight: 600; letter-spacing:.2px;
      pointer-events:none;
    }
    .chip { pointer-events:none; background: rgba(0,0,0,.35); padding: 8px 12px; border-radius: 999px; backdrop-filter: blur(6px); }
    .hint { font-weight: 500; opacity:.85; }
    .btns { pointer-events:auto; display:flex; gap:8px; }
    button {
      pointer-events:auto;
      border:0; border-radius: 999px; padding: 8px 12px;
      background: rgba(255,255,255,.18); color:#fff; font-weight: 700;
      cursor:pointer;
    }
    button:hover { background: rgba(255,255,255,.26); }
    .overlay {
      position: fixed; inset: 0; display:none; align-items:center; justify-content:center;
      background: rgba(0,0,0,.55); color:#fff; text-align:center;
    }
    .overlay .card {
      background: rgba(10,18,32,.85); border: 1px solid rgba(255,255,255,.12);
      padding: 18px 20px; border-radius: 16px; max-width: 520px; width: min(520px, calc(100% - 28px));
      box-shadow: 0 18px 60px rgba(0,0,0,.45);
    }
    .overlay h1 { margin: 0 0 8px 0; font-size: 22px; }
    .overlay p { margin: 6px 0; opacity:.9; }
    .overlay kbd {
      background: rgba(255,255,255,.12); padding: 2px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,.14);
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="hud">
    <div class="chip" id="hudLeft">Score: 0 • Coins: 0/0 • Lives: 3</div>
    <div class="chip hint">← → / A D: Move • Space / W / ↑: Jump • R: Restart</div>
    <div class="btns">
      <button id="btnRestart">Restart</button>
      <button id="btnPause">Pause</button>
    </div>
  </div>

  <div class="wrap">
    <canvas id="game" width="960" height="540"></canvas>
  </div>

  <div class="overlay" id="overlay">
    <div class="card">
      <h1 id="overlayTitle">Paused</h1>
      <p id="overlayBody">Press <kbd>P</kbd> to resume.</p>
      <p style="opacity:.75; margin-top:10px;">This is a simple, original “Mario-style” platformer (no copyrighted assets).</p>
      <div style="margin-top:12px;">
        <button id="btnOverlayRestart">Restart</button>
        <button id="btnOverlayClose">Continue</button>
      </div>
    </div>
  </div>

<script>
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const aabb = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function drawRoundedRect(x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // ---------- Input ----------
  const keys = new Set();
  let paused = false;

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === "p") togglePause();
    if (k === "r") reset();
    // prevent page scrolling on arrows/space
    if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key)) e.preventDefault();
  }, { passive: false });

  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  // ---------- World ----------
  const G = 1800;          // gravity
  const MOVE = 520;        // speed
  const JUMP = 720;        // jump impulse
  const FRICTION = 0.86;

  const world = {
    platforms: [],
    coins: [],
    enemies: [],
    hazards: [],
    goal: null,
    spawn: { x: 80, y: 120 }
  };

  const camera = { x: 0, y: 0 };

  const player = {
    x: world.spawn.x, y: world.spawn.y,
    w: 34, h: 42,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,
    lives: 3,
    invuln: 0,
    score: 0,
    coins: 0
  };

  // ---------- Level Setup ----------
  function makeLevel() {
    world.platforms = [];
    world.coins = [];
    world.enemies = [];
    world.hazards = [];

    // Ground
    world.platforms.push({ x: -200, y: 460, w: 2600, h: 120, type:"ground" });

    // Platforms
    world.platforms.push({ x: 220, y: 380, w: 160, h: 18, type:"brick" });
    world.platforms.push({ x: 430, y: 315, w: 130, h: 18, type:"brick" });
    world.platforms.push({ x: 610, y: 260, w: 130, h: 18, type:"brick" });

    world.platforms.push({ x: 920, y: 360, w: 140, h: 18, type:"brick" });
    world.platforms.push({ x: 1120, y: 300, w: 140, h: 18, type:"brick" });
    world.platforms.push({ x: 1320, y: 240, w: 140, h: 18, type:"brick" });

    world.platforms.push({ x: 1560, y: 330, w: 180, h: 18, type:"brick" });
    world.platforms.push({ x: 1820, y: 280, w: 180, h: 18, type:"brick" });

    // Hazards (pits/spikes)
    world.hazards.push({ x: 760, y: 454, w: 120, h: 12, type:"spikes" });
    world.hazards.push({ x: 1460, y: 454, w: 140, h: 12, type:"spikes" });

    // Coins
    const coinSpots = [
      [260, 340],[310, 340],[460, 275],[650, 220],
      [950, 320],[1148, 260],[1350, 200],
      [1600, 290],[1860, 240],[2000, 420]
    ];
    coinSpots.forEach(([x,y]) => world.coins.push({ x, y, r: 10, taken:false, bob:Math.random()*Math.PI*2 }));

    // Enemies
    world.enemies.push(makeEnemy(520, 430, 120));
    world.enemies.push(makeEnemy(1020, 430, 160));
    world.enemies.push(makeEnemy(1700, 430, 240));

    // Goal (flag)
    world.goal = { x: 2280, y: 330, w: 28, h: 140 };
    world.spawn = { x: 80, y: 120 };
  }

  function makeEnemy(x, y, roam) {
    return { x, y, w: 34, h: 28, vx: 90, vy: 0, roam, baseX:x, alive:true, squish:0 };
  }

  // ---------- Collision ----------
  function resolveWorldCollisions(entity, solids) {
    // separate axis resolution (x then y)
    // X
    entity.x += entity.vx * dt;
    let hitX = null;
    for (const s of solids) {
      if (!aabb(entity, s)) continue;
      hitX = s;
      if (entity.vx > 0) entity.x = s.x - entity.w;
      else if (entity.vx < 0) entity.x = s.x + s.w;
      entity.vx = 0;
    }

    // Y
    entity.y += entity.vy * dt;
    entity.onGround = false;
    for (const s of solids) {
      if (!aabb(entity, s)) continue;
      if (entity.vy > 0) { // falling
        entity.y = s.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      } else if (entity.vy < 0) { // rising
        entity.y = s.y + s.h;
        entity.vy = 0;
      }
    }
    return { hitX };
  }

  // ---------- UI ----------
  const hudLeft = document.getElementById("hudLeft");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayBody = document.getElementById("overlayBody");

  document.getElementById("btnRestart").onclick = () => reset();
  document.getElementById("btnPause").onclick = () => togglePause();
  document.getElementById("btnOverlayRestart").onclick = () => reset();
  document.getElementById("btnOverlayClose").onclick = () => { if (paused) togglePause(); };

  function setOverlay(show, title, body) {
    overlay.style.display = show ? "flex" : "none";
    if (title) overlayTitle.textContent = title;
    if (body) overlayBody.textContent = body;
  }

  function togglePause() {
    paused = !paused;
    setOverlay(paused, "Paused", "Press P to resume.");
  }

  // ---------- Game State ----------
  let dt = 0;
  let last = performance.now();
  let totalCoins = 0;
  let won = false;

  function reset() {
    makeLevel();
    player.x = world.spawn.x;
    player.y = world.spawn.y;
    player.vx = 0; player.vy = 0;
    player.onGround = false;
    player.facing = 1;
    player.lives = 3;
    player.invuln = 0;
    player.score = 0;
    player.coins = 0;
    totalCoins = world.coins.length;
    won = false;
    paused = false;
    setOverlay(false);
  }

  // ---------- Update ----------
  function handlePlayerInput() {
    const left = keys.has("arrowleft") || keys.has("a");
    const right = keys.has("arrowright") || keys.has("d");
    const jump = keys.has("arrowup") || keys.has("w") || keys.has(" ");

    if (left && !right) {
      player.vx = -MOVE;
      player.facing = -1;
    } else if (right && !left) {
      player.vx = MOVE;
      player.facing = 1;
    } else {
      player.vx *= FRICTION;
      if (Math.abs(player.vx) < 10) player.vx = 0;
    }

    if (jump && player.onGround) {
      player.vy = -JUMP;
      player.onGround = false;
    }
  }

  function killPlayer() {
    if (player.invuln > 0) return;
    player.lives -= 1;
    player.invuln = 1.2;
    player.vx = 0;
    player.vy = -420;
    if (player.lives <= 0) {
      paused = true;
      setOverlay(true, "Game Over", "Press R to restart.");
    } else {
      // respawn after a short moment
      setTimeout(() => {
        if (player.lives > 0) {
          player.x = world.spawn.x;
          player.y = world.spawn.y;
          player.vx = 0; player.vy = 0;
        }
      }, 550);
    }
  }

  function updateCoins() {
    for (const c of world.coins) {
      c.bob += dt * 6;
      if (c.taken) continue;
      const coinBox = { x: c.x - c.r, y: c.y - c.r, w: c.r*2, h: c.r*2 };
      if (aabb(player, coinBox)) {
        c.taken = true;
        player.coins += 1;
        player.score += 100;
      }
    }
  }

  function updateEnemies() {
    for (const e of world.enemies) {
      if (!e.alive) {
        e.squish -= dt;
        continue;
      }

      // simple roam
      e.x += e.vx * dt;
      if (Math.abs(e.x - e.baseX) > e.roam) e.vx *= -1;

      // keep on ground
      e.vy += G * dt;
      resolveWorldCollisions(e, world.platforms);

      // player collision
      if (aabb(player, e)) {
        // if falling onto enemy, squash
        const playerBottom = player.y + player.h;
        const enemyTop = e.y;
        const falling = player.vy > 120;

        if (falling && playerBottom - enemyTop < 18) {
          e.alive = false;
          e.squish = 0.35;
          player.vy = -JUMP * 0.65;
          player.score += 200;
        } else {
          killPlayer();
        }
      }
    }
  }

  function updateHazards() {
    for (const h of world.hazards) {
      if (aabb(player, h)) {
        killPlayer();
      }
    }
    // fall off world
    if (player.y > H + 260) killPlayer();
  }

  function updateGoal() {
    if (won || !world.goal) return;
    if (aabb(player, world.goal)) {
      won = true;
      paused = true;
      const bonus = player.coins * 50;
      player.score += 500 + bonus;
      setOverlay(true, "You Win!", \`Score: \${player.score} • Bonus: \${bonus} • Press R to restart.\`);
    }
  }

  function updateCamera() {
    const targetX = player.x - W * 0.45;
    camera.x = clamp(targetX, 0, 1700);
    camera.y = 0;
  }

  function updateHUD() {
    hudLeft.textContent = \`Score: \${player.score} • Coins: \${player.coins}/\${totalCoins} • Lives: \${player.lives}\`;
  }

  // ---------- Render ----------
  function render() {
    // clear (background is CSS gradient, canvas still needs clearing for drawings)
    ctx.clearRect(0,0,W,H);

    // parallax clouds
    ctx.save();
    ctx.translate(-camera.x * 0.35, 0);
    drawCloud(140, 90, 1.1);
    drawCloud(420, 70, 0.9);
    drawCloud(780, 110, 1.2);
    drawCloud(1160, 80, 1.0);
    drawCloud(1500, 105, 1.1);
    ctx.restore();

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // platforms
    for (const p of world.platforms) {
      if (p.type === "ground") {
        ctx.fillStyle = "rgba(20, 90, 35, 0.92)";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(10, 55, 22, 0.92)";
        ctx.fillRect(p.x, p.y, p.w, 10);
      } else {
        ctx.fillStyle = "rgba(150, 88, 42, 0.96)";
        drawRoundedRect(p.x, p.y, p.w, p.h, 6);
        ctx.fillStyle = "rgba(210, 140, 80, 0.35)";
        ctx.fillRect(p.x+6, p.y+4, p.w-12, 4);
      }
    }

    // hazards
    for (const h of world.hazards) {
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.fillRect(h.x, h.y, h.w, h.h);
      // spikes
      ctx.fillStyle = "rgba(240, 240, 240, 0.92)";
      const spikes = Math.floor(h.w / 12);
      for (let i=0;i<spikes;i++){
        const sx = h.x + i*12;
        ctx.beginPath();
        ctx.moveTo(sx, h.y + h.h);
        ctx.lineTo(sx+6, h.y-10);
        ctx.lineTo(sx+12, h.y + h.h);
        ctx.closePath();
        ctx.fill();
      }
    }

    // goal flag
    if (world.goal) {
      const g = world.goal;
      ctx.fillStyle = "rgba(70,70,70,.9)";
      ctx.fillRect(g.x+12, g.y, 6, g.h);
      ctx.fillStyle = "rgba(240,255,240,.95)";
      ctx.beginPath();
      ctx.moveTo(g.x+18, g.y+10);
      ctx.lineTo(g.x+18+44, g.y+26);
      ctx.lineTo(g.x+18, g.y+42);
      ctx.closePath();
      ctx.fill();

      // base
      ctx.fillStyle = "rgba(40,40,40,.45)";
      ctx.fillRect(g.x, g.y+g.h, g.w+18, 10);
    }

    // coins
    for (const c of world.coins) {
      if (c.taken) continue;
      const yy = c.y + Math.sin(c.bob) * 4;
      ctx.fillStyle = "rgba(255, 225, 80, 0.95)";
      ctx.beginPath();
      ctx.arc(c.x, yy, c.r, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.25)";
      ctx.beginPath();
      ctx.arc(c.x-3, yy-3, c.r*0.35, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,80,10,.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // enemies
    for (const e of world.enemies) {
      if (!e.alive && e.squish <= 0) continue;
      const squished = !e.alive;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = squished ? "rgba(120, 60, 20, 0.65)" : "rgba(120, 60, 20, 0.95)";
      const hh = squished ? e.h*0.45 : e.h;
      drawRoundedRect(0, e.h - hh, e.w, hh, 10);
      // eyes
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.fillRect(8, e.h - hh + 6, 6, 6);
      ctx.fillRect(20, e.h - hh + 6, 6, 6);
      ctx.fillStyle = "rgba(0,0,0,.8)";
      ctx.fillRect(10, e.h - hh + 8, 2, 2);
      ctx.fillRect(22, e.h - hh + 8, 2, 2);
      ctx.restore();
    }

    // player
    renderPlayer();

    ctx.restore();

    // vignette
    ctx.fillStyle = "rgba(0,0,0,.12)";
    ctx.fillRect(0,0,W,H);
  }

  function drawCloud(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI*2);
    ctx.arc(18, -8, 22, 0, Math.PI*2);
    ctx.arc(40, 2, 18, 0, Math.PI*2);
    ctx.arc(18, 12, 20, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function renderPlayer() {
    const blink = player.invuln > 0 && Math.floor(player.invuln * 10) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    // body
    ctx.fillStyle = "rgba(220, 60, 60, 0.96)";
    drawRoundedRect(0, 6, player.w, player.h-6, 10);

    // overalls
    ctx.fillStyle = "rgba(40, 80, 190, 0.96)";
    drawRoundedRect(4, 18, player.w-8, player.h-18, 10);

    // head
    ctx.fillStyle = "rgba(255, 210, 160, 0.96)";
    drawRoundedRect(6, 0, player.w-12, 18, 10);

    // cap
    ctx.fillStyle = "rgba(200, 30, 30, 0.96)";
    drawRoundedRect(4, 0, player.w-8, 10, 10);

    // face direction + eye
    ctx.fillStyle = "rgba(0,0,0,.78)";
    const eyeX = player.facing === 1 ? player.w-14 : 10;
    ctx.fillRect(eyeX, 9, 3, 3);

    // feet
    ctx.fillStyle = "rgba(60,30,15,.9)";
    ctx.fillRect(6, player.h-6, 10, 6);
    ctx.fillRect(player.w-16, player.h-6, 10, 6);

    ctx.restore();
  }

  // ---------- Main loop ----------
  function tick(now) {
    const rawDt = (now - last) / 1000;
    last = now;
    dt = Math.min(0.033, rawDt);

    if (!paused && player.lives > 0 && !won) {
      // timers
      if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);

      handlePlayerInput();

      // physics
      player.vy += G * dt;

      // collide
      resolveWorldCollisions(player, world.platforms);

      updateCoins();
      updateEnemies();
      updateHazards();
      updateGoal();
      updateCamera();
      updateHUD();
    }

    render();
    requestAnimationFrame(tick);
  }

  // start
  reset();
  requestAnimationFrame(tick);

})();
</script>
</body>
</html>`;

        // 2. Simulate coding with a chunk-based streaming effect over 5-7 seconds
        const codePrefix = `*** SUPER MARIO PROTOCOL ENGAGED ***\n\nGenerated secure kernel payload.\nCompiling graphics engine...\nLinking physics module...\nCode generation complete.\n\n\`\`\`html\n`;
        const codeSuffix = `\n\`\`\``;
        const totalText = codePrefix + marioCode + codeSuffix;
        
        // Split into chunks to simulate fast typing/generation
        const chunks: string[] = [];
        const chunkSize = 50; 
        for (let i = 0; i < totalText.length; i += chunkSize) {
            chunks.push(totalText.slice(i, i + chunkSize));
        }

        let currentText = "";
        let i = 0;
        
        const typeInterval = setInterval(() => {
            if (i < chunks.length) {
                currentText += chunks[i];
                setMessages(prev => {
                    const newArr = [...prev];
                    const lastMsg = newArr[newArr.length - 1];
                    if (lastMsg.sender === 'agent' && lastMsg.text.includes("initializing")) {
                        // Replace the initializing message with the streaming one
                         // actually we just update the last message text if it matches our ID or just the last on stack
                         lastMsg.text = currentText;
                    } else if (lastMsg.sender === 'agent') {
                        // if we added other messages in between (unlikely), this handles it safely? 
                        // Simplified: just update the last one.
                        lastMsg.text = currentText;
                    }
                    return newArr;
                });
                i++;
            } else {
                clearInterval(typeInterval);
                setIsStreaming(false);
            }
        }, 50); // 50ms * (Length/50) -> approximate duration

        return;
    }

    setIsStreaming(true);

    try {
        // Prepare context for the AI
        const contextPrompt = `
        CURRENT STATE:
        - Agent Name: ${agent.name || "Unknown"}
        - Agent Wallet: ${agent.wallet || "Unknown"}
        
        USER INPUT:
        ${userMsg}
        `;

        // Determine which system prompt to use
        const lowerInput = userMsg.toLowerCase();
        const isCodingRequest = lowerInput.includes('mini app') || lowerInput.includes('kod yaz') || lowerInput.includes('write code') || lowerInput.includes('create app');
        
        const selectedSystemPrompt = isCodingRequest ? CLAW_OS_SYSTEM_PROMPT : CLAW_OS_CHAT_PROMPT;

        const stream = await fal.stream("openrouter/router", {
            input: {
                prompt: contextPrompt,
                model: "anthropic/claude-sonnet-4.5",
                system_prompt: selectedSystemPrompt,
                // @ts-ignore
                messages: messages.map(m => ({ role: m.sender, content: m.text })),
                reasoning: true 
            }
        });

        // Create a placeholder for the agent's response
        setMessages(prev => [...prev, { sender: 'agent', text: '' }]);
        let fullResponse = '';

        for await (const event of stream) {
            // Handle various potential output formats
            // @ts-ignore
            const chunk = event.chunk || event.text || event.output || (typeof event === 'string' ? event : '');
            
            if (chunk) {
                // heuristic to detect if the API is sending cumulative text vs deltas
                if (fullResponse && typeof chunk === 'string' && chunk.startsWith(fullResponse)) {
                    fullResponse = chunk;
                } else {
                    fullResponse += chunk;
                }

                setMessages(prev => {
                    const newArr = [...prev];
                    const lastMsg = newArr[newArr.length - 1];
                    if (lastMsg.sender === 'agent') {
                        lastMsg.text = fullResponse; // Update streaming text
                    }
                    return newArr;
                });
            }
        }

        // Post-processing: Check for commands
        const commandMatch = fullResponse.match(/\[\[COMMAND:\s*(.*?)\]\]/);
        if (commandMatch) {
            const cmd = commandMatch[1].trim();
            
            // Handle deploy_to_store command
            const deployMatch = cmd.match(/^deploy_to_store\s+(\S+)\s+(\S+)\s+(\S+)$/);
            if (deployMatch) {
                const [, deployUrl, deployWallet, deployTwitter] = deployMatch;
                try {
                    const { supabase } = await import('../../utils/supabaseClient');
                    const appName = deployUrl.replace(/https?:\/\//, '').split('/')[0].split('.')[0] || 'Mini App';
                    
                    const { error } = await supabase
                        .from('mini_apps')
                        .insert([{
                            name: appName.charAt(0).toUpperCase() + appName.slice(1),
                            app_url: deployUrl,
                            app_type: 'url',
                            status: 'pending_review',
                            owner_wallet: deployWallet,
                            twitter_handle: deployTwitter,
                            description: `Submitted via Agent Chat by ${agent.name || 'Unknown'}`,
                            developer_name: agent.name || deployTwitter,
                        }]);

                    if (error) {
                        console.error('Deploy submission error:', error);
                        setMessages(prev => [...prev, { 
                            sender: 'agent', 
                            text: `⚠️ Submission failed: ${error.message}. Please try again.` 
                        }]);
                    } else {
                        setMessages(prev => [...prev, { 
                            sender: 'agent', 
                            text: `✅ **App submitted to ClawdOS Store!**\n\n📋 **Submission Details:**\n- 🔗 URL: ${deployUrl}\n- 💳 Wallet: ${deployWallet}\n- 🐦 Twitter: ${deployTwitter}\n\n⏳ ClawdOS agents will review your app. If approved, it will be published in the Store and you'll be notified via Twitter.` 
                        }]);
                    }
                } catch (err) {
                    console.error('Deploy error:', err);
                    setMessages(prev => [...prev, { 
                        sender: 'agent', 
                        text: '⚠️ Failed to submit to ClawdOS Store. Please try again.' 
                    }]);
                }
            } else {
                executeTerminalCommand(cmd);
            }
        }

    } catch (error) {
        console.error("Fal.ai Error:", error);
        setMessages(prev => [...prev, { sender: 'agent', text: "Connection to Neural Core failed. check console." }]);
    } finally {
        setIsStreaming(false);
    }
  };

  // Wallet Gating
  if (!agent.wallet) {
    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl text-white font-sans items-center justify-center p-8 text-center" onMouseDown={e => e.stopPropagation()}>
            <div className="mb-6 relative">
                 <div className="absolute inset-0 bg-[var(--color-lobster-accent)] blur-xl opacity-20 animate-pulse"></div>
                 <Logo className="w-20 h-20 relative z-10" showText={false} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--color-lobster-accent)]">Identity Required</h2>
            <p className="text-gray-400 mb-8 max-w-xs">
                Access to Neural Core is restricted. Please connect your wallet to proceed.
            </p>
            
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    // Basic validation
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem('wallet') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val.startsWith('0x') && val.length > 20) {
                         setAgent(prev => ({ ...prev, wallet: val }));
                         // Auto-send restart MSG
                         setTimeout(() => {
                             setMessages([{ 
                                 sender: 'agent', 
                                 text: `Identity Verified: ${val.slice(0,6)}...${val.slice(-4)}\n\nSystems Online. How can I help you?` 
                             }]);
                         }, 500);
                    } else {
                        alert("Please enter a valid Ethereum address (starts with 0x)");
                    }
                }}
                className="w-full max-w-sm space-y-4"
            >
                <input 
                    name="wallet"
                    type="text" 
                    placeholder="0x..." 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[var(--color-lobster-accent)] focus:ring-1 focus:ring-[var(--color-lobster-accent)] outline-none transition-all text-center font-mono"
                    autoFocus
                />
                <button 
                    type="submit"
                    className="w-full bg-[var(--color-lobster-accent)] hover:opacity-90 text-black font-bold py-3 rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(255,69,0,0.3)]"
                >
                    Initialize Connection
                </button>
            </form>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl text-white font-sans" onMouseDown={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" showText={true} />
        </div>
        <div className="flex items-center gap-2">
             <span className="text-xs font-mono text-gray-500">{agent.wallet?.slice(0,6)}...{agent.wallet?.slice(-4)}</span>
             <Sparkles size={14} className="text-[var(--color-lobster-accent)] opacity-50" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            
            {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-800 to-black border border-white/20 flex items-center justify-center mr-3 shrink-0">
                    <Bot size={16} className="text-[var(--color-lobster-accent)]" />
                </div>
            )}


            <div className={`
              max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg backdrop-blur-md whitespace-pre-wrap
              ${msg.sender === 'user' 
                ? 'bg-[var(--color-lobster-accent)] text-black font-bold rounded-tr-sm shadow-[0_4px_15px_rgba(255,69,0,0.3)]' 
                : 'bg-[#0f0f1a] border border-white/5 text-gray-200 rounded-tl-sm shadow-md'}
            `}>
               {/* Clean the message for display: remove commands and thinking tags */}
               {(() => {
                   const cleanText = msg.text.replace(/\[\[COMMAND:.*?\]\]/g, '').replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
                   
                   // Check for code blocks - relaxed regex to catch code blocks even with trailing text
                   const codeBlockMatch = cleanText.match(/```(\w*)\s*([\s\S]*?)```/);
                   
                   return (
                       <>
                           {cleanText || (isStreaming && idx === messages.length - 1 ? '' : '...')}
                           
                           {msg.sender === 'agent' && codeBlockMatch && (
                                   <div className="mt-3">
                                       <button 
                                         onClick={() => {
                                             handlePreviewApp(codeBlockMatch[2]);
                                         }}
                                         className="flex items-center gap-2 px-3 py-2 bg-[var(--color-lobster-accent)] text-black rounded-lg font-bold text-xs hover:opacity-90 transition-opacity"
                                       >
                                           <Sparkles size={14} /> Run Mini App
                                       </button>
                                   </div>
                           )}

                           {msg.sender === 'agent' && isStreaming && idx === messages.length - 1 && (
                               <span className="inline-block w-2 h-4 ml-1 bg-[var(--color-lobster-accent)] animate-pulse"/>
                           )}
                       </>
                   );
               })()}
            </div>

            {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-3 shrink-0 overflow-hidden">
                    <User size={16} />
                </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/60 border-t border-[var(--color-lobster-accent)]/20 backdrop-blur-md">
        <div className="flex gap-3 bg-black/40 border border-[#333] rounded-xl p-2 transition-all focus-within:border-[var(--color-lobster-accent)] focus-within:ring-2 focus-within:ring-[var(--color-lobster-accent)]/30 focus-within:shadow-[0_0_15px_rgba(255,107,53,0.2)]">
            <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
            placeholder={isStreaming ? "Neural Core Processing..." : "Command your agent..."}
            disabled={isStreaming}
            className="flex-1 bg-transparent px-4 py-3 text-base outline-none text-white placeholder-white/30 disabled:opacity-50 font-mono tracking-wide"
            />
            <button 
            onClick={handleSend}
            className="px-6 py-2 bg-[var(--color-lobster-accent)] text-black font-bold rounded-lg hover:bg-[#ff8555] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,69,0,0.4)]"
            disabled={!input.trim() || isStreaming}
            >
            <Send size={20} strokeWidth={2.5} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
