
export interface PairData {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    marketCap: number;
}

export interface DexResponse {
    schemaVersion: string;
    pairs: PairData[];
}

export const DexService = {
    async getTokenData(tokenAddress: string): Promise<PairData | null> {
        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            if (!response.ok) return null;
            
            const data: DexResponse = await response.json();
            if (!data.pairs || data.pairs.length === 0) return null;

            // Return the most liquid pair usually, or just the first one
            // DexScreener sorts by liquidity by default often, but let's take the first one
            return data.pairs[0];
        } catch (error) {
            console.error("DexService Error:", error);
            return null;
        }
    }
};
