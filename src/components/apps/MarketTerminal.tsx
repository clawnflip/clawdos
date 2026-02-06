import React, { useState, useEffect } from 'react';
import { DexService } from '../../utils/DexService';
import type { PairData } from '../../utils/DexService';
import { Droplets, RefreshCw, Zap } from 'lucide-react';

const MarketTerminal: React.FC = () => {
  const [data, setData] = useState<PairData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Target: Open Trident
  const TOKEN_ADDRESS = '0x6eEFbfc95C7810ADF53ac232D1DE911839918749';

  const fetchData = async () => {
    // Keep loading false on subsequent updates for smooth UI
    if (!data) setLoading(true);
    const result = await DexService.getTokenData(TOKEN_ADDRESS);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Faster updates (15s)
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
        <div className="w-full h-full bg-[#050505] text-cyan-400 font-mono flex flex-col items-center justify-center p-4">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                <RefreshCw className="animate-spin relative z-10" size={48} />
            </div>
            <div className="text-2xl mt-6 tracking-widest font-bold">INITIALIZING DATALINK</div>
            <div className="text-xs text-cyan-700 mt-2 animate-pulse">ENCRYPTING CONNECTION...</div>
        </div>
    );
  }

  if (!data) return <div className="p-10 text-red-500 font-mono">CONNECTION FAILURE</div>;

  const isPositive = data.priceChange.h24 >= 0;
  const changeColor = isPositive ? 'text-[#00ff9d]' : 'text-[#ff3864]';

  return (
    <div className="w-full h-full bg-[#050505] text-[#e0e0e0] font-mono flex flex-col overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* Top Ticker Bar */}
      <div className="h-14 bg-[#0a0a0a] border-b border-gray-800 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded bg-opacity-10 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}>
                  <Zap size={18} className={changeColor} />
              </div>
              <div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-white tracking-wide">{data.baseToken.symbol}</span>
                      <span className="text-xs text-gray-500">/ {data.quoteToken.symbol}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 tracking-wider">PAIR: {data.pairAddress.slice(0,6)}...</div>
              </div>
          </div>

          <div className="text-right">
              <div className="text-2xl font-bold text-white tracking-widest font-sans">
                  ${Number(data.priceUsd).toFixed(8)}
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Live Chart (Embed) */}
          <div className="flex-1 bg-black relative border-r border-gray-800">
               <iframe 
                src={`https://dexscreener.com/base/${data.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                className="w-full h-full border-0 absolute inset-0"
                title="Chart"
               />
          </div>

          {/* RIGHT: Data Panel */}
          <div className="w-80 bg-[#080808] border-l border-gray-900 flex flex-col overflow-y-auto shrink-0">
              
              {/* Market Status */}
              <div className="p-4 border-b border-gray-800">
                  <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Market Performance</div>
                  <div className={`flex items-center justify-between text-sm mb-1 ${changeColor}`}>
                      <span>24h Change</span>
                      <span className="font-bold">{data.priceChange.h24}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1 text-gray-400">
                      <span>6h Change</span>
                      <span>{data.priceChange.h6}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>1h Change</span>
                      <span>{data.priceChange.h1}%</span>
                  </div>
              </div>

              {/* Liquidity Block */}
              <div className="p-4 border-b border-gray-800 bg-[#0c0c0c]">
                 <div className="flex items-center gap-2 mb-3">
                     <Droplets size={14} className="text-blue-400" />
                     <span className="text-xs font-bold text-blue-400 uppercase">Liquidity Pool</span>
                 </div>
                 <div className="text-xl font-bold text-white mb-1">
                     ${data.liquidity.usd.toLocaleString()}
                 </div>
                 <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                     <div className="bg-blue-500 h-full w-3/4 animate-pulse"></div>
                 </div>
                 <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                     <span>{data.baseToken.symbol}: {Number(data.liquidity.base).toFixed(0)}</span>
                     <span>{data.quoteToken.symbol}: {Number(data.liquidity.quote).toFixed(0)}</span>
                 </div>
              </div>

              {/* Stats Block */}
              <div className="p-4 border-b border-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <div className="text-[10px] text-gray-500 uppercase">Market Cap</div>
                          <div className="text-sm font-bold text-white">${(data.marketCap/1000).toFixed(1)}K</div>
                      </div>
                      <div>
                          <div className="text-[10px] text-gray-500 uppercase">FDV</div>
                          <div className="text-sm font-bold text-white">${(data.fdv/1000).toFixed(1)}K</div>
                      </div>
                  </div>
              </div>

             {/* Volume Block */}
             <div className="p-4 flex-1">
                 <div className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Volume (24h)</div>
                 <div className="text-2xl font-bold text-white mb-2">${data.volume.h24.toLocaleString()}</div>
                 
                 <div className="space-y-2 mt-4">
                     <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Buys (24h)</span>
                         <span className="text-green-400 font-mono">{data.txns.h24.buys}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Sells (24h)</span>
                         <span className="text-red-400 font-mono">{data.txns.h24.sells}</span>
                     </div>
                     <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden flex mt-1">
                         <div 
                            style={{ width: `${(data.txns.h24.buys / (data.txns.h24.buys + data.txns.h24.sells)) * 100}%` }}
                            className="bg-green-500 h-full"
                         />
                         <div className="flex-1 bg-red-500 h-full" />
                     </div>
                 </div>
             </div>

             {/* Footer Status */}
             <div className="p-2 bg-[#050505] border-t border-gray-800 text-[9px] text-gray-600 font-mono text-center">
                 DEX ID: {data.dexId.toUpperCase()} // CHAIN: {data.chainId.toUpperCase()}
                 <div className="text-green-900 mt-1">SOCKET_ESTABLISHED_SECURE_V2</div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default MarketTerminal;
