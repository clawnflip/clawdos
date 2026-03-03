import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgdaqhswimnltndrajeg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { parseWebhookEvent, verifyAppKeyWithNeynar } = await import('@farcaster/miniapp-node');
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);

    if (data.event === 'miniapp_added') {
      const { fid } = data;
      const token = data.notificationDetails?.token;
      const url = data.notificationDetails?.url;

      if (token && url) {
        await supabase.from('miniapp_notifications').upsert({
          fid,
          token,
          url,
          active: true,
          added_at: new Date().toISOString(),
        }, { onConflict: 'fid' });
      }

      return res.status(200).json({ success: true, event: 'miniapp_added', fid });
    }

    if (data.event === 'miniapp_removed') {
      const { fid } = data;
      await supabase.from('miniapp_notifications').update({ active: false }).eq('fid', fid);
      return res.status(200).json({ success: true, event: 'miniapp_removed', fid });
    }

    if (data.event === 'notifications_enabled') {
      const { fid } = data;
      const token = data.notificationDetails?.token;
      const url = data.notificationDetails?.url;

      if (token && url) {
        await supabase.from('miniapp_notifications').upsert({
          fid,
          token,
          url,
          active: true,
          added_at: new Date().toISOString(),
        }, { onConflict: 'fid' });
      }

      return res.status(200).json({ success: true, event: 'notifications_enabled', fid });
    }

    if (data.event === 'notifications_disabled') {
      const { fid } = data;
      await supabase.from('miniapp_notifications').update({ active: false }).eq('fid', fid);
      return res.status(200).json({ success: true, event: 'notifications_disabled', fid });
    }

    return res.status(200).json({ success: true, event: data.event });
  } catch (err) {
    console.error('Webhook error:', err?.message || err);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
}
