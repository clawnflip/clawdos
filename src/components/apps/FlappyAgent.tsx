import React, { useRef, useEffect, useState } from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface FlappyAgentProps {
    wallet?: string;
}

interface LeaderboardEntry {
    wallet: string;
    score: number;
    timestamp: number;
}

const GRAVITY = 0.6; // Basic Gravity
const JUMP = -9; // Stronger jump for balance
const PIPE_SPEED = 4; // Faster
const PIPE_SPAWN_RATE = 100; // Faster spawn
const GAP_SIZE = 150; // Tighter gap

const FlappyAgent: React.FC<FlappyAgentProps> = ({ wallet = '0xGuest' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    
    // Game State Refs
    const birdY = useRef(250);
    const birdVelocity = useRef(0);
    const pipes = useRef<Array<{ x: number, topHeight: number, passed: boolean }>>([]);
    const frameCount = useRef(0);
    const requestId = useRef<number>(0);
    const scoreRef = useRef(0);
    const destinyRef = useRef<'LOW' | 'MID' | 'GOD'>('LOW'); // Destiny determines potential

    // Load Leaderboard
    useEffect(() => {
        loadLeaderboard();
        
        // Realtime subscription
        const channel = supabase
            .channel('public:leaderboard')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leaderboard' }, () => {
                loadLeaderboard(); 
            })
            .subscribe();

        return () => {
             supabase.removeChannel(channel);
        };
    }, [wallet]);

    const loadLeaderboard = async () => {
         try {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);
                
            if (data && !error) {
                setLeaderboard(data.map((d: any) => ({
                    wallet: d.wallet,
                    score: d.score,
                    timestamp: new Date(d.created_at).getTime()
                })));
            } else {
                throw new Error("Table not found or empty");
            }
         } catch(e) { 
             console.log("Using local leaderboard fallback");
             const saved = localStorage.getItem('flappy_leaderboard');
             if (saved) {
                 setLeaderboard(JSON.parse(saved));
             }
         }
    };

    const saveScore = async (finalScore: number) => {
        // Try Supabase First
        const { error } = await supabase
            .from('leaderboard')
            .insert([{ wallet, score: finalScore }]);
            
        if (error) {
            // Fallback to LocalStorage
            const newEntry: LeaderboardEntry = {
                wallet,
                score: finalScore,
                timestamp: Date.now()
            };
            const currentObj = localStorage.getItem('flappy_leaderboard');
            const currentList = currentObj ? JSON.parse(currentObj) : [];
            const newLeaderboard = [...currentList, newEntry]
                .sort((a: any, b: any) => b.score - a.score)
                .slice(0, 10);
                
            localStorage.setItem('flappy_leaderboard', JSON.stringify(newLeaderboard));
            setLeaderboard(newLeaderboard);
        } else {
            loadLeaderboard();
        }
        
        if (finalScore > highScore) setHighScore(finalScore);
    };

    const seedLeaderboard = () => {
        const dummyWallets = [
            '0x71C...9A21', '0x3D2...8B12', '0xA1F...9C88', 
            '0x99B...1D22', '0x44E...5F11'
        ];
        
        const newEntries = dummyWallets.map(w => ({
            wallet: w,
            score: Math.floor(Math.random() * 50) + 5,
            timestamp: Date.now() - Math.floor(Math.random() * 10000000)
        }));
        
        localStorage.setItem('flappy_leaderboard', JSON.stringify(newEntries.sort((a,b) => b.score - a.score)));
        loadLeaderboard();
    };

    const startGame = () => {
        setGameState('PLAYING');
        setScore(0);
        scoreRef.current = 0;
        birdY.current = 250;
        birdVelocity.current = 0;
        pipes.current = [];
        frameCount.current = 0;
        
        // Roll for Destiny
        const roll = Math.random() * 100;
        if (roll > 99) {
            destinyRef.current = 'GOD'; // 1% chance for 200+
        } else if (roll > 50) {
            destinyRef.current = 'MID'; // 49% chance for 30-70 range
        } else {
            destinyRef.current = 'LOW'; // 50% chance for 0-20 range
        }
        
        if (requestId.current) cancelAnimationFrame(requestId.current);
        loop();
    };

    const aiLogic = () => {
        const nextPipe = pipes.current.find(p => p.x + 50 > 50);
        
        if (nextPipe) {
            const pipeBottom = nextPipe.topHeight + GAP_SIZE;
            const targetY = pipeBottom - (GAP_SIZE / 2);
            
            // Base Logic: Try to jump if below target
            let shouldJump = false;
            
            // Add some natural "hover" variation
            const hover = Math.sin(frameCount.current * 0.1) * 10;
            
            if (birdY.current > targetY + 10 + hover) {
                 shouldJump = true;
            }

            // Apply Destiny logic: Chance to FAIL the jump
            let failureChance = 0;
            const currentScore = scoreRef.current;

            if (destinyRef.current === 'LOW') {
                if (currentScore > 15) failureChance = 0.6; // 60% fail after 15
                else if (currentScore > 5) failureChance = 0.15; // 15% fail after 5
            } else if (destinyRef.current === 'MID') {
                if (currentScore > 60) failureChance = 0.5; // Kill after 60
                else if (currentScore > 25) failureChance = 0.05; // 5% chance to die in mid range
            } else if (destinyRef.current === 'GOD') {
                if (currentScore > 200) failureChance = 0.05; 
                else failureChance = 0.005; // 0.5% chance to die (still possible)
            }
            
            // General "Fatigue" - gets harder for everyone over time
            failureChance += Math.min(0.2, currentScore * 0.002);

            // Override failure
            if (shouldJump) {
                if (Math.random() < failureChance) {
                    shouldJump = false; // Intentional miss
                }
            }

            if (shouldJump) {
                birdVelocity.current = JUMP;
            }

        } else {
            // Hover in middle
            if (birdY.current > 250) birdVelocity.current = JUMP;
        }
    };

    const loop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Physics
        birdVelocity.current += GRAVITY;
        birdY.current += birdVelocity.current;

        // AI Control
        aiLogic();

        // Spawn Pipes (Frequency driven by frameCount)
        if (frameCount.current % PIPE_SPAWN_RATE === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - GAP_SIZE - 50;
            const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            pipes.current.push({ x: canvas.width, topHeight: height, passed: false });
        }

        // Move Pipes
        pipes.current.forEach(p => p.x -= PIPE_SPEED);
        
        // Cleanup off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x < -60) {
            pipes.current.shift();
        }

        // Collision Check
        const birdRect = { x: 50, y: birdY.current, w: 30, h: 30 };
        // Floor/Ceiling
        if (birdY.current + 30 > canvas.height || birdY.current < 0) {
            gameOver();
            return;
        }

        let isDead = false;
        pipes.current.forEach(p => {
             // Hit Top Pipe
             if (birdRect.x + birdRect.w > p.x && birdRect.x < p.x + 50 && birdRect.y < p.topHeight) isDead = true;
             // Hit Bottom Pipe
             if (birdRect.x + birdRect.w > p.x && birdRect.x < p.x + 50 && birdRect.y + birdRect.h > p.topHeight + GAP_SIZE) isDead = true;
             
             // Score
             if (!p.passed && p.x + 50 < birdRect.x) {
                 p.passed = true;
                 scoreRef.current += 1;
                 setScore(scoreRef.current);
             }
        });

        if (isDead) {
            gameOver();
            return;
        }

        // Draw Everything
        // Sky
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pipes
        ctx.fillStyle = '#73bf2e';
        pipes.current.forEach(p => {
            // Top Pipe Body
            ctx.fillRect(p.x, 0, 50, p.topHeight);
            // Top Pipe Cap
            ctx.fillStyle = '#558c22';
            ctx.fillRect(p.x - 2, p.topHeight - 20, 54, 20);
            
            // Bottom Pipe Body
            ctx.fillStyle = '#73bf2e';
            ctx.fillRect(p.x, p.topHeight + GAP_SIZE, 50, canvas.height - (p.topHeight + GAP_SIZE)); 
            // Bottom Pipe Cap
            ctx.fillStyle = '#558c22';
            ctx.fillRect(p.x - 2, p.topHeight + GAP_SIZE, 54, 20);
            
            ctx.fillStyle = '#73bf2e'; // Reset for next
        });

        // Bird (Emoji Only)
        // Removed background block
        ctx.font = '30px serif';
        ctx.fillStyle = 'white';
        ctx.fillText('🦞', 48, birdY.current + 24);

        // Score
        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(scoreRef.current.toString(), canvas.width / 2 - 10, 60);
        ctx.fillText(scoreRef.current.toString(), canvas.width / 2 - 10, 60);

        // Next Frame
        frameCount.current++;
        requestId.current = requestAnimationFrame(loop);
    };

    const gameOver = () => {
        // Prevent multiple calls
        if (gameState === 'GAME_OVER') return;
        
        setGameState('GAME_OVER');
        if (requestId.current) cancelAnimationFrame(requestId.current);
        saveScore(scoreRef.current);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (requestId.current) cancelAnimationFrame(requestId.current);
        };
    }, []);

    // Auto-start with retry to ensure canvas is ready
    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(() => {
            if (canvasRef.current) {
                // Only start if not already playing or over
                setGameState(prev => {
                    if (prev === 'START') {
                        startGame();
                        clearInterval(interval);
                        return 'PLAYING';
                    }
                    return prev;
                });
                clearInterval(interval);
            }
            attempts++;
            if (attempts > 10) clearInterval(interval); // Stop trying after 1s
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 text-white font-mono">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-800">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🦞 Flappy Agent</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                        Auto-Pilot v1.2
                    </span>
                </div>
                <div className="text-xs text-gray-400">
                    Pilot: <span className="text-[var(--color-lobster-accent)]">{wallet.slice(0,6)}...</span>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
                {/* Game Area */}
                <div className="relative flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                    <canvas 
                        ref={canvasRef}
                        width={400}
                        height={500}
                        style={{ width: '400px', height: '500px' }} // Explicit styling
                        className="bg-[#70c5ce] shadow-2xl border-4 border-white/10 rounded-lg"
                    />
                    
                    {/* Start Overlay */}
                    {gameState === 'START' && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                             <button 
                                onClick={startGame}
                                className="px-8 py-4 bg-[var(--color-lobster-accent)] text-white font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-lg animate-pulse flex items-center gap-2"
                             >
                                <Trophy /> START
                             </button>
                        </div>
                    )}
                    
                    {/* Debug / Status */}
                    <div className="absolute top-2 left-2 text-[10px] text-white/50 bg-black/50 p-1 rounded font-mono">
                        FPS: 60 | Pipes: {pipes.current.length} | Y: {Math.round(birdY.current)}
                    </div>
                    
                    {/* Game Over Overlay */}
                    {gameState === 'GAME_OVER' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 backdrop-blur-sm z-10">
                            <h2 className="text-4xl font-bold text-red-500 mb-2">GAME OVER</h2>
                            <div className="text-6xl font-bold text-white mb-8">{score}</div>
                            
                            <button 
                                onClick={startGame}
                                className="flex items-center gap-2 px-6 py-3 bg-[var(--color-lobster-accent)] text-white rounded-lg hover:brightness-110 transition-all font-bold text-lg"
                            >
                                <RotateCcw size={20} />
                                REPLAY
                            </button>
                        </div>
                    )}
                </div>

                {/* Leaderboard Sidebar */}
                <div className="w-64 border-l border-white/10 bg-gray-800/50 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between font-bold text-yellow-400">
                        <div className="flex items-center gap-2">
                             <Trophy size={18} />
                             TOP 10
                        </div>
                        <button 
                            onClick={seedLeaderboard}
                            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white/50 hover:text-white"
                            title="Fill with random data"
                        >
                            SEED
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {leaderboard.map((entry, i) => (
                            <div key={i} className={`
                                p-3 rounded-lg border flex flex-col
                                ${entry.wallet === wallet 
                                    ? 'bg-[var(--color-lobster-accent)]/10 border-[var(--color-lobster-accent)]/30' 
                                    : 'bg-white/5 border-white/5'}
                            `}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${i < 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                        #{i + 1}
                                    </span>
                                    <span className="font-mono text-xl font-bold text-white">
                                        {entry.score}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-400 truncate font-mono" title={entry.wallet}>
                                    {entry.wallet}
                                </div>
                                <div className="text-[9px] text-gray-600 mt-1">
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                        
                        {leaderboard.length === 0 && (
                            <div className="text-center text-gray-500 py-8 text-sm">
                                No scores yet.<br/>Be the first!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlappyAgent;
