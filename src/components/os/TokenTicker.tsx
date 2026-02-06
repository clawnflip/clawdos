import React, { useState, useEffect } from 'react';
import { DexService } from '../../utils/DexService';
import type { PairData } from '../../utils/DexService';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TokenTicker: React.FC = () => {
    const [data, setData] = useState<PairData | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Target: $COS on Base
    const TOKEN_ADDRESS = '0x6eEFbfc95C7810ADF53ac232D1DE911839918749';

    const fetchData = async () => {
        try {
            const result = await DexService.getTokenData(TOKEN_ADDRESS);
            if (result) {
                setData(result);
            }
        } catch (e) {
            console.error("Ticker fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) return null; // Don't show loading state initially to avoid flickering/jumping

    if (!data) return null; // Hide if error/no data

    const isPositive = data.priceChange.h24 >= 0;
    const colorClass = isPositive ? 'text-green-400' : 'text-red-400';

    return (
        <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-md border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
             onClick={() => window.open(data.url, '_blank')}
             title="View on DexScreener"
        >
            <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-bold text-[var(--color-lobster-accent)] tracking-wider">COS</span>
                <span className="text-gray-500">|</span>
                <span className="text-white">${Number(data.priceUsd).toFixed(8)}</span>
                <span className={`flex items-center ${colorClass} text-[10px]`}>
                   {isPositive ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                   {data.priceChange.h24}%
                </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-gray-400 border-l border-white/10 pl-3">
                <span className="uppercase tracking-wider">MC</span>
                <span className="text-white font-bold">${(data.marketCap / 1000).toFixed(1)}K</span>
            </div>
        </div>
    );
};

export default TokenTicker;
