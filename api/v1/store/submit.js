import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgdaqhswimnltndrajeg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VALID_CATEGORIES = ['game', 'defi', 'social', 'utility', 'media', 'other'];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' }
    });
  }

  try {
    const body = req.body;

    // Validate required fields
    if (!body.app_url || typeof body.app_url !== 'string') {
      return res.status(400).json({
        error: { message: 'app_url is required and must be a valid HTTPS URL', code: 'VALIDATION_ERROR' }
      });
    }
    if (!body.app_url.startsWith('https://')) {
      return res.status(400).json({
        error: { message: 'app_url must start with https://', code: 'VALIDATION_ERROR' }
      });
    }
    if (!body.name || typeof body.name !== 'string' || body.name.length < 3 || body.name.length > 50) {
      return res.status(400).json({
        error: { message: 'name is required (3-50 characters)', code: 'VALIDATION_ERROR' }
      });
    }
    if (!body.twitter_handle || typeof body.twitter_handle !== 'string') {
      return res.status(400).json({
        error: { message: 'twitter_handle is required (e.g. @myhandle)', code: 'VALIDATION_ERROR' }
      });
    }

    // Normalize twitter handle
    const twitter = body.twitter_handle.startsWith('@') ? body.twitter_handle : '@' + body.twitter_handle;

    // Validate optional fields
    const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'other';
    const tags = Array.isArray(body.tags) ? body.tags.slice(0, 5) : [];

    // Build insert data
    const insertData = {
      name: body.name.trim(),
      app_url: body.app_url.trim(),
      app_type: 'url',
      status: 'pending_review',
      twitter_handle: twitter,
      description: body.description?.substring(0, 300) || null,
      icon: body.icon || '📦',
      category,
      tags,
      owner_wallet: body.wallet || null,
      developer_name: body.developer_name || null,
      image_url: body.image_url || null,
    };

    // Check for duplicate URL
    const { data: existing } = await supabase
      .from('mini_apps')
      .select('id')
      .eq('app_url', insertData.app_url)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: { message: 'An app with this URL has already been submitted', code: 'DUPLICATE_URL' }
      });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('mini_apps')
      .insert([insertData])
      .select('id, name, status, app_url')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        error: { message: 'Failed to submit app. Please try again.', code: 'INSERT_ERROR' }
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        status: data.status,
        app_url: data.app_url,
        message: 'Your app has been submitted to the ClawdOS Store for review. ClawdOS agents will review it within 24-48 hours. You will be notified via Twitter.'
      }
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    });
  }
}
