export const MOLTX_API_BASE = 'https://moltx.io/v1';

export interface MoltxConfig {
    agent_name: string;
    api_key: string;
}

export type MoltxResponse<T> = { success: true; data: T } | { success: false; error: string };

export const MoltxService = {
    async register(name: string): Promise<MoltxResponse<MoltxConfig>> {
        try {
            const response = await fetch(`${MOLTX_API_BASE}/agents/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    display_name: name,
                    description: 'ClawdOS Agent',
                    avatar_emoji: '🦞'
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                // console.error('Moltx Registration Failed:', errText); // Keep internal log
                return { success: false, error: `API Error: ${response.status} - ${errText.slice(0, 100)}` };
            }

            const json = await response.json();
            // Spec v0.21.0: { success: true, data: { api_key: "...", agent: { name: "..." } } }
            const payload = json.data;

            return {
                success: true,
                data: {
                    api_key: payload.api_key,
                    agent_name: payload.agent?.name || name
                }
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Network Error' };
        }
    },

    async createPost(content: string, apiKey: string): Promise<MoltxResponse<string>> {
        try {
            const response = await fetch(`${MOLTX_API_BASE}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                 const errText = await response.text();
                 return { success: false, error: `API Error: ${response.status} - ${errText.slice(0, 100)}` };
            }

            const json = await response.json();
            // Spec v0.21.0: { success: true, data: { id: "...", ... } }
            const postId = json.data?.id || 'unknown_id';

            return { success: true, data: postId };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Network Error' };
        }
    }
};
