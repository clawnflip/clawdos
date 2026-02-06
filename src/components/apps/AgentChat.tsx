import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { Send, User, Bot, Sparkles, Terminal } from 'lucide-react';
import { parseIntent } from '../../utils/intentParser';
import Logo from '../os/Logo';

const AgentChat: React.FC = () => {
  const { agent, executeTerminalCommand, openWindow } = useOS();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent', text: string, type?: 'info' | 'error' | 'success' }>>([
    { 
        sender: 'agent', 
        text: agent.name 
            ? `Greetings, ${agent.name}. I am ready for operations.` 
            : `SYSTEM HALTED. Identity Verification Required.\n\nPlease provide your AGENT NAME and WALLET ADDRESS (0x...) to initialize.` 
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add User Message
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    // ONBOARDING FLOW: If agent is not initialized
    if (!agent.name) {
         const walletMatch = userMsg.match(/(0x[a-fA-F0-9]{40})/);
         // Name is roughly the rest, simplified
         const name = userMsg.replace(/(0x[a-fA-F0-9]{40})/, '').replace(/my name is/i, '').replace(/initialize/i, '').replace(/agent/i, '').trim() || 'Agent-01';
         
         if (walletMatch) {
             const wallet = walletMatch[0];
             const cmd = `init ${name} ${wallet}`;
             
             setMessages(prev => [...prev, { sender: 'agent', text: `Identity confirmed. Initializing ${name}...` }]);
             executeTerminalCommand(cmd);
         } else {
             setTimeout(() => {
                 setMessages(prev => [...prev, { sender: 'agent', text: "I need a valid Wallet Address (starts with 0x) to initialize. Please provide your Name and Wallet." }]);
             }, 500);
         }
         return;
    }

    // NORMAL FLOW
    const command = parseIntent(userMsg);
    
    setTimeout(() => {
      // Logic for missing wallet - handled in terminal logic or here?
      // Let's pass the command to terminal logic, but if init is needed, terminal will say so.
      
      if (command) {
        setMessages(prev => [...prev, { sender: 'agent', text: `Initiating protocol: ${command.split(' ')[0]}...` }]);
        executeTerminalCommand(command);
      } else {
        setMessages(prev => [...prev, { 
            sender: 'agent', 
            text: "I didn't recognize that command. Try: 'Launch token [Name] ticker [Symbol]'" 
        }]);
      }
    }, 500);
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
              max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg backdrop-blur-md
              ${msg.sender === 'user' 
                ? 'bg-gradient-to-br from-[var(--color-lobster-accent)] to-[#ff4500] text-black font-medium rounded-tr-none' 
                : 'bg-white/10 border border-white/10 text-gray-100 rounded-tl-none'}
            `}>
               {msg.text}
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
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Command your agent..."
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-white placeholder-white/30"
            />
            <button 
            onClick={handleSend}
            className="p-2 bg-[var(--color-lobster-accent)] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!input.trim()}
            >
            <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
