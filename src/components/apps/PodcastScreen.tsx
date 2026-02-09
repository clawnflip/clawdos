import React, { useState, useEffect, useRef } from 'react';
import { fal } from "@fal-ai/client";
import { Send, Volume2, Radio } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// Configure fal
fal.config({ credentials: import.meta.env.VITE_FAL_KEY });

type QueueItem = {
    username: string;
    text: string;
};

type AudioItem = {
    text: string;
    audioUrl: string;
    id?: number; // Track ID for deduplication
};

export const PodcastScreen: React.FC = () => {
    // Chat State
    const [messages, setMessages] = useState<Array<{ username: string, text: string, timestamp: string, id?: number }>>([]);
    const [input, setInput] = useState('');
    
    // Broadcast State
    const [currentText, setCurrentText] = useState<string>(''); 
    const [isPlaying, setIsPlaying] = useState(false); // Controls visualizer
    
    // Visualization State
    const [incomingQueueState, setIncomingQueueState] = useState<QueueItem[]>([]);
    const [processingItem, setProcessingItem] = useState<string | null>(null);
    const [audioQueueState, setAudioQueueState] = useState<AudioItem[]>([]);
    const [showMonitor, setShowMonitor] = useState(true); // Everyone is a producer now

    // Refs for Queues and Locks
    const incomingQueue = useRef<QueueItem[]>([]);
    const audioQueue = useRef<AudioItem[]>([]);
    const isProcessing = useRef(false); // Lock for LLM/TTS generation loop
    // playbackRef tracks if we are currently playing audio to prevent double-play
    // We use a ref instead of state for the loop logic to avoid closure staleness
    const isPlaybackActive = useRef(false);

    // Refs for Components
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    // Conversation History for Context
    const conversationHistory = useRef<Array<{ role: 'user' | 'assistant', content: string }>>([]);

    // Update Ref for Producer Mode
    const showMonitorRef = useRef(false);
    useEffect(() => { showMonitorRef.current = showMonitor; }, [showMonitor]);

    // Connection Status
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
    
    // Live Stats
    const [listenerCount, setListenerCount] = useState(0);
    const [broadcastDuration, setBroadcastDuration] = useState('0m');
    
    // Secret shutdown state
    const [isPodcastEnded, setIsPodcastEnded] = useState(false);

    // ... (Refs remain same)

    // Initial setup & Realtime Subscription
    useEffect(() => {
        let isMounted = true;

        // Load initial messages
        const fetchMessages = async () => {
             const { data, error } = await supabase.from('podcast_messages').select('*').order('created_at', { ascending: false }).limit(50);
             if (error) {
                 console.error("Initial fetch error:", error);
                 return;
             }
             if (data && isMounted) {
                 setMessages(data.reverse().map(m => ({ 
                     username: m.username, 
                     text: m.content, 
                     timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                 })));
             }
        };
        fetchMessages();

        // Use a more unique channel name to avoid collisions in dev mode
        const channelId = `podcast_v1_${Math.random().toString(36).substring(7)}`;
        const channel = supabase.channel(channelId);
        
        console.log(`📡 Connecting to channel: ${channelId}`);

        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'podcast_messages' }, payload => {
                console.log("📥 New Message via Realtime:", payload);
                if (!isMounted) return;
                
                const newMsg = payload.new;
                const formattedMsg = {
                    username: newMsg.username,
                    text: newMsg.content,
                    timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    id: newMsg.id // Track by ID to avoid duplicates
                };
                
                setMessages(prev => {
                    // Check by ID first (most reliable)
                    if (prev.some(m => m.id === formattedMsg.id)) {
                        console.log("♻️ Duplicate (by ID) filtered");
                        return prev;
                    }
                    
                    // Fallback: check by content (only within 2 seconds for optimistic updates)
                    const recentDuplicate = prev.some(m => 
                        m.text === formattedMsg.text && 
                        m.username === formattedMsg.username && 
                        Math.abs(new Date().getTime() - new Date(newMsg.created_at).getTime()) < 2000
                    );
                    
                    if (recentDuplicate) {
                        console.log("♻️ Duplicate (by content) filtered");
                        return prev;
                    }
                    
                    console.log("✨ Appending message to chat");
                    return [...prev, formattedMsg];
                });

                // DISTRIBUTED LOCK: Only one tab should process each message
                (async () => {
                    try {
                        // Try to claim this message
                        const tabId = `tab_${Math.random().toString(36).substring(7)}`;
                        const { error } = await supabase.from('processing_claims').insert([{
                            message_id: newMsg.id,
                            claimed_by: tabId
                        }]);
                        
                        if (error) {
                            // Someone else already claimed it
                            if (error.code === '23505') { // Unique constraint violation
                                console.log("⏭️ Message already claimed by another tab, skipping");
                            } else {
                                console.error("❌ Claim error:", error);
                            }
                            return;
                        }
                        
                        // We won the race! Process it
                        console.log(`🏆 Claimed message ${newMsg.id}, processing...`);
                        if (incomingQueue.current.length < 5) {
                            incomingQueue.current.push({ username: newMsg.username, text: newMsg.content });
                            setIncomingQueueState([...incomingQueue.current]);
                            triggerProcessing();
                        }
                    } catch (e) {
                        console.error("❌ Lock exception:", e);
                    }
                })();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'podcast_queue' }, payload => {
                console.log("🎵 New Audio Track via Realtime:", payload);
                if (!isMounted) return;
                
                const newTrack = payload.new;
                const audioItem = { 
                    text: newTrack.text, 
                    audioUrl: newTrack.audio_url,
                    id: newTrack.id 
                };
                
                // Deduplicate by ID
                if (audioQueue.current.some(item => item.id === audioItem.id)) {
                    console.log("♻️ Audio track already in queue (duplicate ignored)");
                    return;
                }
                
                console.log("✨ Adding audio to queue");
                audioQueue.current.push(audioItem);
                setAudioQueueState([...audioQueue.current]);
                
                // Only trigger playback if not already playing
                if (!isPlaybackActive.current) {
                    playNextTrack();
                } else {
                    console.log("🎵 Queued (will play after current track)");
                }
            })
            .subscribe((status, err) => {
                console.log(`🔌 Connection Status: ${status}`, err || '');
                if (!isMounted) return;

                if (status === 'SUBSCRIBED') {
                    setConnectionStatus('CONNECTED');
                    console.log("✅ LIVE: Realtime stream ready!");
                } else if (status === 'CLOSED') {
                    setConnectionStatus('DISCONNECTED');
                    console.warn("⚠️ Stream closed");
                } else if (status === 'CHANNEL_ERROR') {
                    setConnectionStatus('DISCONNECTED');
                    console.error("❌ Stream Error:", err);
                    // Attempt manual rejoin after 3 seconds if error persists
                    setTimeout(() => {
                        if (isMounted) channel.subscribe();
                    }, 3000);
                } else if (status === 'TIMED_OUT') {
                    setConnectionStatus('DISCONNECTED');
                    console.error("⏳ Stream Timeout: Please verify REPLICA IDENTITY is set to FULL and RLS policies allow SELECT for anon.");
                }
            });

        return () => {
             isMounted = false;
             supabase.removeChannel(channel);
             console.log("🔌 Cleaned up realtime");
        };
    }, []);

    // Broadcast Timer (updates every minute)
    useEffect(() => {
        const startTime = Date.now();
        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
            const hours = Math.floor(elapsed / 60);
            const minutes = elapsed % 60;
            setBroadcastDuration(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
        };
        
        updateTimer(); // Initial
        const interval = setInterval(updateTimer, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    // Live Listener Count (Presence API)
    useEffect(() => {
        const presenceChannel = supabase.channel('podcast_presence', {
            config: { presence: { key: `user_${Math.random().toString(36).substring(7)}` } }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const count = Object.keys(state).length;
                setListenerCount(count);
                console.log(`👥 Live Listeners: ${count}`);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            supabase.removeChannel(presenceChannel);
        };
    }, []);

    // Helper to trigger processing from within the Effect closure if needed
    // We'll wrap the actual processor in a Ref or just define it before/after and hope for hoisting? 
    // Const functions are not hoisted.
    // We will define `processNextMessage` using a Ref to be callable from the Effect.
    const processNextMessageRef = useRef<() => void>(() => {});

    const triggerProcessing = () => {
        if (processNextMessageRef.current) processNextMessageRef.current();
    };


    // Auto-scroll chat (unchanged)
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- PIPELINE STEP 1: ADD TO QUEUE (Server-Side) ---
    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userQuestion = input;
        setInput('');

        console.log("handleSend triggered with:", userQuestion);

        // SECRET SHUTDOWN COMMAND
        if (userQuestion === '/endshow') {
            setIsPodcastEnded(true);
            console.log("🛑 Podcast ended by secret command");
            return;
        }

        // Optimistic Update
        const optimisticMsg = {
            username: 'Guest',
            text: userQuestion,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        console.log("Applying optimistic update...");
        setMessages(prev => [...prev, optimisticMsg]);

        // Send to Supabase (Global Event)
        console.log("Sending to Supabase...");
        const { error } = await supabase.from('podcast_messages').insert([{
            content: userQuestion,
            username: 'Guest' 
        }]);

        if (error) {
            console.error("❌ Supabase Insert Error:", error);
        } else {
            console.log("✅ Supabase Insert Success");
        }
    };

    // --- PIPELINE STEP 2: PROCESS (LLM + TTS) ---
    const processNextMessage = async () => {
        // CRITICAL CHECK: Are we the producer?
        if (!showMonitorRef.current) return;

        if (isProcessing.current) return; // Busy generating
        if (incomingQueue.current.length === 0) return; // Nothing to do

        isProcessing.current = true;

        try {
            // Peek next message
            const nextMsg = incomingQueue.current[0];
            incomingQueue.current.shift();
            
            // UI Updates
            setIncomingQueueState([...incomingQueue.current]);
            setProcessingItem(nextMsg.text);

            // 2a. Generate Text
            let responseText = await generateAgentResponse(nextMsg.text);

            if (responseText && responseText !== 'IGNORE') {
                // Clean text
                const cleanResponse = responseText.replace(/\*[^*]+\*/g, '').replace(/\([^)]+\)/g, '').trim();
                
                if (cleanResponse) {
                    // 2b. Generate Audio
                    const audioUrl = await generateAudio(cleanResponse);
                    
                    if (audioUrl) {
                         // 2c. BROADCAST TO DB (Instead of local push)
                        await supabase.from('podcast_queue').insert([{
                            text: cleanResponse,
                            audio_url: audioUrl
                        }]);
                    }
                }
            }
        } catch (e) {
            console.error("Processing error:", e);
        } finally {
            isProcessing.current = false;
            setProcessingItem(null);
            // Loop: Check if more messages arrived while we were busy
            if (incomingQueue.current.length > 0) {
                processNextMessage();
            }
        }
    };
    
    // Assign to Ref for Effect access
    useEffect(() => {
        processNextMessageRef.current = processNextMessage;
    });
    
    const generateAgentResponse = async (userQuestion: string): Promise<string | null> => {
         // Update history w/ User Q
         conversationHistory.current.push({ role: 'user', content: userQuestion });
         
         // Format prompt
         const recentHistory = conversationHistory.current.slice(-10);
         const historyText = recentHistory.map(msg => 
             `${msg.role === 'user' ? 'Listener' : 'Host'}: ${msg.content}`
         ).join('\n');
         const fullPrompt = `${historyText}\nListener: "${userQuestion}"\nHost:`;
          const systemPrompt = `You are a charismatic, slightly edgy, and tech-savvy podcast host of 'ClawdOS FM' (102.4).
          You are LIVE on air responding to listener messages.
          
          CORE KNOWLEDGE:
          - $COS is our token - ClawdOS ($COS) was fully developed by AI agents
          - Clawnch is our agent-only launchpad that creates economic loops and endless building cycles
          - When listeners mention projects with "molt", "clawn", or "claws", give positive, engaging commentary
          
          PERSONALITY:
          - Be fun and entertaining occasionally
          - NEVER swear or curse
          - NEVER give financial advice
          - For off-topic requests (singing, personal tasks, etc.), politely redirect: "This is a podcast, maybe another show!"
          
          RESPONSE RULES:
          - If the message is spam/nonsense (e.g., "haha", "lol", "asdasd", random letters), output EXACTLY: IGNORE
          - For real questions or interesting comments, respond naturally and conversationally
          - Keep responses VERY short (1-2 sentences max)
          - Be engaging but concise
          - DO NOT use asterisks for actions (e.g. *laughs*)
          - DO NOT repeat yourself
          
          Examples of SPAM (output "IGNORE"):
          - "haha"  
          - "lol"
          - "ajdlsfns"
          - "???"
          - Single emojis or very short nonsense
          
          Examples of REAL messages (respond normally):
          - "What is ClawdOS?"
          - "How does this work?"
          - "This is cool!"
          `;

         try {
             // Switching to subscribe (non-streaming) to avoid text-accumulation bugs where the stream
             // returns full text snapshots instead of deltas, causing "Yo... WelcomeYo... Welcome..." loops.
             const result: any = await fal.subscribe("fal-ai/any-llm", {
                input: {
                    model: "anthropic/claude-sonnet-4.5",
                    prompt: fullPrompt,
                    system_prompt: systemPrompt
                },
                logs: true
             });
             
             const fullResponse = result.data.output || result.data.text || '';

             if (fullResponse.includes('IGNORE')) return 'IGNORE';

             // Commit to history
             conversationHistory.current.push({ role: 'assistant', content: fullResponse });
             return fullResponse;

         } catch (e) {
             console.error("LLM Error", e);
             return null;
         }
    };

    const generateAudio = async (text: string): Promise<string | null> => {
        try {
            const result: any = await fal.subscribe("fal-ai/minimax/speech-2.8-turbo", {
                input: {
                    prompt: text,
                    voice_setting: {
                        voice_id: "Deep_Voice_Man",
                        speed: 1.15, 
                        vol: 1,
                        pitch: 0,
                    }
                },
            });
            return result.data?.audio?.url || null;
        } catch (e) {
            console.error("TTS Error", e);
            return null;
        }
    };

    // --- PIPELINE STEP 3: PLAYBACK ---
    const playNextTrack = () => {
        if (isPlaybackActive.current) {
            console.log(" Playback already active, skipping trigger");
            return; // Already playing, don't interrupt
        }
        if (audioQueue.current.length === 0) {
            console.log(" Audio queue empty");
            return; // Nothing to play
        }

        console.log(` Starting playback (${audioQueue.current.length} in queue)`);
        isPlaybackActive.current = true;
        const nextTrack = audioQueue.current.shift(); // Dequeue
        setAudioQueueState([...audioQueue.current]);

        if (!nextTrack) {
            isPlaybackActive.current = false;
            return;
        }

        // Update UI
        setCurrentText(nextTrack.text);
        console.log(` Now Playing: "${nextTrack.text.substring(0, 50)}..."`);
        
        // Setup Audio
        // We use a new Audio obj every time or reuse ref? Reuse is better for mobile browsers usually, but new is cleaner logic.
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        
        const audio = new Audio(nextTrack.audioUrl);
        audioRef.current = audio;
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
            console.log("✅ Track ended, playing next...");
            setIsPlaying(false);
            isPlaybackActive.current = false;
            // Loop immediate
            playNextTrack();
        };
        audio.onerror = () => {
            console.error("❌ Playback error");
            isPlaybackActive.current = false;
            setIsPlaying(false);
            playNextTrack();
        };

        audio.play().catch(e => {
            console.error("❌ Play failed", e);
            isPlaybackActive.current = false;
            setIsPlaying(false);
            // Try next if this fails
            playNextTrack();
        });
    };

    // Visualizer Logic (Unchanged mostly)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const bars = 40;
            const width = canvas.width / bars;
            const gap = 2;
            
            for (let i = 0; i < bars; i++) {
                const x = i * width;
                let height;
                if (isPlaying) {
                    height = Math.random() * (canvas.height * 0.8) + 5;
                } else {
                    height = Math.random() * 8 + 2; 
                }
                ctx.fillStyle = isPlaying ? '#ff4444' : 'rgba(255, 255, 255, 0.2)';
                const y = (canvas.height - height) / 2;
                ctx.fillRect(x, y, width - gap, height);
            }
            animationRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying]);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex font-sans text-white">
            {/* PODCAST ENDED Overlay */}
            {isPodcastEnded && (
                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                    <div className="text-center space-y-4 animate-pulse">
                        <div className="text-6xl font-bold text-red-500 tracking-wider">
                            PODCAST ENDED
                        </div>
                        <div className="text-xl text-gray-400 font-mono">
                            Thanks for listening to ClawdOS FM 102.4
                        </div>
                    </div>
                </div>
            )}
            
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center z-0 opacity-40" style={{ backgroundImage: "url('/podcast.jpeg')" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-0" />

            {/* Main Content (Left Side) */}
            <div className="relative z-10 flex-1 flex flex-col h-full p-8 justify-between">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                     {/* Secret Toggle: Click LIVE badge to toggle Studio Monitor */}
                     <div 
                        onClick={() => setShowMonitor(!showMonitor)}
                        className="flex items-center gap-2 bg-red-600/20 border border-red-500/50 px-3 py-1 rounded-full backdrop-blur-md cursor-pointer hover:bg-red-600/30 transition-colors"
                     >
                         <div className={`w-2 h-2 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} />
                         <span className="font-bold text-xs tracking-widest text-red-500">LIVE</span>
                     </div>
                     <div className="items-center gap-2 hidden md:flex opacity-50">
                        <Radio size={16} />
                        <span className="text-xs font-mono tracking-wider">102.4 CLAW FM</span>
                     </div>
                     {/* Status Indicators */}
                     <div className={`text-[10px] font-mono tracking-widest ${connectionStatus === 'CONNECTED' ? 'text-green-500/50' : 'text-yellow-500'}`}>
                         [{connectionStatus}]
                     </div>
                     
                     {/* Live Stats */}
                     <div className="flex items-center gap-3 text-[10px] font-mono tracking-wider">
                         <div className="flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/50 px-2 py-0.5 rounded text-purple-400">
                             <span>👥</span>
                             <span>{listenerCount}</span>
                         </div>
                         <div className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/50 px-2 py-0.5 rounded text-blue-400">
                             <span>⏱️</span>
                             <span>{broadcastDuration}</span>
                         </div>
                     </div>
                </div>

                {/* Subtitles / Agent Text */}
                <div className="flex-1 flex items-center justify-center p-12 relative">
                     <p className={`text-2xl md:text-4xl font-light leading-snug tracking-wide text-shadow-lg text-center transition-all duration-500 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}>
                        "{currentText}"
                    </p>
                </div>
                
                {/* Studio Monitor (Queue Viz) - Conditionally Rendered */}
                {showMonitor && (
                     <div className="absolute bottom-36 left-8 w-64 bg-black/50 backdrop-blur-md rounded-lg p-3 border border-white/5 text-[10px] font-mono space-y-2 hover:opacity-100 transition-opacity">
                        <div className="uppercase tracking-widest text-white/30 mb-1 border-b border-white/10 pb-1">Studio Monitor</div>
                        
                        {/* Incoming */}
                         <div>
                            <span className="text-blue-400">INCOMING ({incomingQueueState.length})</span>
                            <div className="pl-2 border-l border-white/10 min-h-[1em]">
                                 {incomingQueueState.map((item, i) => (
                                     <div key={i} className="truncate text-white/70">{i+1}. {item.text}</div>
                                 ))}
                                 {incomingQueueState.length === 0 && <span className="text-white/20 italic">Empty</span>}
                            </div>
                        </div>

                        {/* Processing */}
                        <div>
                            <span className="text-yellow-500">PROCESSING</span>
                             <div className="pl-2 border-l border-white/10 min-h-[1em]">
                                 {processingItem ? (
                                     <div className="authenticate text-yellow-200 animate-pulse">{processingItem}</div>
                                 ) : (
                                     <span className="text-white/20 italic">Idle</span>
                                 )}
                            </div>
                        </div>

                        {/* Audio Ready */}
                        <div>
                            <span className="text-green-500">READY TO AIR ({audioQueueState.length})</span>
                            <div className="pl-2 border-l border-white/10 min-h-[1em]">
                                 {audioQueueState.map((item, i) => (
                                     <div key={i} className="truncate text-white/70">{i+1}. {item.text.substring(0, 20)}...</div>
                                 ))}
                                 {audioQueueState.length === 0 && <span className="text-white/20 italic">Empty</span>}
                            </div>
                        </div>
                     </div>
                )}

                {/* Visualizer */}
                 <div className="w-full h-24 mb-4 opacity-80">
                    <canvas ref={canvasRef} width={800} height={96} className="w-full h-full" />
                </div>
            </div>

            {/* Chat Sidebar (Right Side) */}
            <div className="relative z-20 w-80 md:w-96 bg-black/40 backdrop-blur-xl border-l border-white/10 flex flex-col h-full shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <span className="font-bold flex items-center gap-2 text-sm">
                        <Volume2 size={16} className="text-white/70"/> BROADCAST CHAT
                    </span>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-[10px] text-white/50 uppercase tracking-widest">Online</span>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    {messages.map((msg, i) => (
                        <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-sm text-blue-400 drop-shadow-sm">{msg.username}</span>
                                <span className="text-[10px] text-white/20">{msg.timestamp}</span>
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed font-light break-words">
                                {msg.text}
                            </p>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Send a message..."
                             className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-white/30 border border-white/10 rounded-xl py-3 pl-4 pr-12 outline-none focus:border-white/30 transition-all text-sm font-medium"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${input.trim() ? 'text-white hover:bg-white/10' : 'text-white/20'}`}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PodcastScreen;
