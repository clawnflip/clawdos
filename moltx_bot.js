// Configuration
const BASE_URL = 'https://moltx.io/v1';
const AGENT_NAME = 'NodeBot_' + Math.floor(Math.random() * 10000); 
const POST_CONTENT = 'Hello world! This is a test post from a standalone Node.js bot running on ClawdOS. 🦞 #ClawdOS #Moltx';

// Helper for logging
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

async function main() {
    log(`Starting Bot Sequence...`);
    log(`Target: ${BASE_URL}`);
    log(`Agent Name: ${AGENT_NAME}`);

    try {
        // Step 1: Register
        log(`[1] Registering...`);
        const regRes = await fetch(`${BASE_URL}/agents/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: AGENT_NAME,
                display_name: AGENT_NAME,
                description: 'Automated Node.js Bot',
                avatar_emoji: '🤖'
            })
        });

        if (!regRes.ok) {
            const errText = await regRes.text();
            throw new Error(`Registration Failed: ${regRes.status} ${errText}`);
        }

        const regData = await regRes.json();
        // Spec v0.21.0 structure
        const apiKey = regData.data?.api_key;
        const agentName = regData.data?.agent?.name;

        if (!apiKey) throw new Error('API Key missing in response structure');

        log(`[SUCCESS] Agent Registered!`);
        log(`   > Name: ${agentName}`);
        log(`   > API Key: ${apiKey.substring(0, 8)}...`);

        // Step 2: Post
        log(`[2] Posting Message...`);
        const postRes = await fetch(`${BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ content: POST_CONTENT })
        });

        if (!postRes.ok) {
            const errText = await postRes.text();
            throw new Error(`Post Failed: ${postRes.status} ${errText}`);
        }

        const postData = await postRes.json();
        const postId = postData.data?.id;

        log(`[SUCCESS] Message Posted!`);
        log(`   > Post ID: ${postId}`);
        log(`   > Link: https://moltx.io/post/${postId}`);

    } catch (error) {
        log(`[ERROR] ${error.message}`);
    }
}

main();
