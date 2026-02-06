import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import Logo from '../os/Logo';
import { fal } from "@fal-ai/client";
import { CLAW_OS_SYSTEM_PROMPT } from '../../utils/systemPrompt';

// Configure fal with the proxy or client key
// We use the exposed key for this demo.
fal.config({ credentials: import.meta.env.VITE_FAL_KEY }); 

const AgentChat: React.FC = () => {
  const { agent, executeTerminalCommand } = useOS();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent', text: string }>>([
    { 
        sender: 'agent', 
        text: agent.name 
            ? `Online. Connected to ${agent.name}.` 
            : `SYSTEM HALTED. Identity Verification Required.\n\nPlease provide your NAME and WALLET ADDRESS to initialize.` 
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
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

        const stream = await fal.stream("openrouter/router", {
            input: {
                prompt: contextPrompt,
                model: "anthropic/claude-sonnet-4.5",
                system_prompt: CLAW_OS_SYSTEM_PROMPT,
                // @ts-ignore
                messages: messages.map(m => ({ role: m.sender, content: m.text })) 
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
            executeTerminalCommand(cmd);
        }

    } catch (error) {
        console.error("Fal.ai Error:", error);
        setMessages(prev => [...prev, { sender: 'agent', text: "Connection to Neural Core failed. check console." }]);
    } finally {
        setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl text-white font-sans" onMouseDown={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" showText={true} />
        </div>
        <Sparkles size={14} className="text-[var(--color-lobster-accent)] opacity-50" />
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
                ? 'bg-gradient-to-br from-[var(--color-lobster-accent)] to-[#ff4500] text-black font-medium rounded-tr-none' 
                : 'bg-white/10 border border-white/10 text-gray-100 rounded-tl-none'}
            `}>
               {/* Clean the message for display: remove commands and thinking tags */}
               {msg.text.replace(/\[\[COMMAND:.*?\]\]/g, '').replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || (isStreaming && idx === messages.length - 1 ? '' : '...')}
               
               {msg.sender === 'agent' && isStreaming && idx === messages.length - 1 && (
                   <span className="inline-block w-2 h-4 ml-1 bg-[var(--color-lobster-accent)] animate-pulse"/>
               )}
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
      <div className="p-4 bg-black/40 border-t border-white/10">
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 pr-2 transition-all focus-within:border-[var(--color-lobster-accent)] focus-within:ring-1 focus-within:ring-[var(--color-lobster-accent)]/50">
            <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
            placeholder={isStreaming ? "Neural Core Processing..." : "Command your agent..."}
            disabled={isStreaming}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-white placeholder-white/30 disabled:opacity-50"
            />
            <button 
            onClick={handleSend}
            className="p-2 bg-[var(--color-lobster-accent)] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!input.trim() || isStreaming}
            >
            <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
