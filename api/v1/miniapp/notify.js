import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgdaqhswimnltndrajeg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';
const NOTIFY_SECRET = process.env.MINIAPP_NOTIFY_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple auth — protect from unauthorized sends
  const auth = req.headers['x-notify-secret'];
  if (!NOTIFY_SECRET || auth !== NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, targetUrl, fids } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    // Fetch active subscribers, optionally filter by fid list
    let query = supabase
      .from('miniapp_notifications')
      .select('fid, token, url')
      .eq('active', true);

    if (Array.isArray(fids) && fids.length > 0) {
      query = query.in('fid', fids);
    }

    const { data: subscribers, error } = await query;
    if (error) throw error;
    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'No active subscribers' });
    }

    // Group by notification URL (usually same for all, but just in case)
    const groups = {};
    for (const sub of subscribers) {
      if (!groups[sub.url]) groups[sub.url] = [];
      groups[sub.url].push(sub.token);
    }

    const notificationId = `notify-${Date.now()}`;
    const results = [];

    for (const [url, tokens] of Object.entries(groups)) {
      // Send in batches of 100 tokens
      for (let i = 0; i < tokens.length; i += 100) {
        const batch = tokens.slice(i, i + 100);
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId,
            title,
            body,
            targetUrl: targetUrl || 'https://clawdos.space',
            tokens: batch,
          }),
        });

        const result = await resp.json().catch(() => ({}));
        results.push({ url, batch: batch.length, status: resp.status, result });

        // Handle invalid tokens
        if (result.invalidTokens && result.invalidTokens.length > 0) {
          for (const invalidToken of result.invalidTokens) {
            await supabase
              .from('miniapp_notifications')
              .update({ active: false })
              .eq('token', invalidToken);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      sent: subscribers.length,
      notificationId,
      results,
    });
  } catch (err) {
    console.error('Notify error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
}
