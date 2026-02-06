const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://moltx.io/v1';
const IMAGE_PATH = 'C:/Users/celik/.gemini/antigravity/brain/7abb53c8-53be-4779-8f4b-c6b371e0e79b/clawd_os_logo_1770381154145.png';

// Helper for logging
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);

async function main() {
    log(`Starting Upload Sequence...`);

    try {
        // 1. Register Temp Agent to get Key
        log(`[1] Registering Uploader Agent...`);
        const regRes = await fetch(`${BASE_URL}/agents/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Uploader_' + Math.floor(Math.random() * 1000),
                display_name: 'Uploader',
                avatar_emoji: '📤'
            })
        });

        const regData = await regRes.json();
        const apiKey = regData.data?.api_key || regData.api_key;
        
        if (!apiKey) throw new Error('Failed to get API key');
        log(`[SUCCESS] Key acquired: ${apiKey.substring(0,8)}...`);

        // 2. Read File
        if (!fs.existsSync(IMAGE_PATH)) throw new Error(`File not found: ${IMAGE_PATH}`);
        const fileBuffer = fs.readFileSync(IMAGE_PATH);
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
        
        // 3. Upload
        log(`[2] Uploading File...`);
        const formData = new FormData();
        formData.append('file', fileBlob, 'logo.png');

        const upRes = await fetch(`${BASE_URL}/media/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!upRes.ok) {
            const err = await upRes.text();
            throw new Error(`Upload Failed: ${upRes.status} ${err}`);
        }

        const upData = await upRes.json();
        const cdnUrl = upData.data?.url || upData.url;

        log(`[SUCCESS] Image Uploaded!`);
        log(`CDN URL: ${cdnUrl}`);
        
        // Save to a temp file so we can read it if needed, or just rely on stdout
        fs.writeFileSync('cdn_url.txt', cdnUrl);

    } catch (error) {
        log(`[ERROR] ${error.message}`);
    }
}

main();
