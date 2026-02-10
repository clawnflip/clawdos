/**
 * ClawdOS Store API Server
 * 
 * Standalone Express server for the /v1/store/submit endpoint.
 * Run: node server.js
 * 
 * For Vercel deployment, use api/v1/store/submit.js instead (automatic).
 * This server is for local development and non-Vercel hosting.
 */

import { createClient } from '@supabase/supabase-js';
import http from 'http';

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = 'https://hgdaqhswimnltndrajeg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const VALID_CATEGORIES = ['game', 'defi', 'social', 'utility', 'media', 'other'];

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, {});
  }

  // Health check
  if (req.url === '/v1/health') {
    return sendJson(res, 200, { status: 'ok', service: 'clawdos-store-api', version: '1.0.0' });
  }

  // Submit endpoint
  if (req.url === '/v1/store/submit' && req.method === 'POST') {
    try {
      const body = await parseBody(req);

      // Validate required fields
      if (!body.app_url || typeof body.app_url !== 'string' || !body.app_url.startsWith('https://')) {
        return sendJson(res, 400, { error: { message: 'app_url is required and must be a valid HTTPS URL', code: 'VALIDATION_ERROR' } });
      }
      if (!body.name || typeof body.name !== 'string' || body.name.length < 3 || body.name.length > 50) {
        return sendJson(res, 400, { error: { message: 'name is required (3-50 characters)', code: 'VALIDATION_ERROR' } });
      }
      if (!body.twitter_handle || typeof body.twitter_handle !== 'string') {
        return sendJson(res, 400, { error: { message: 'twitter_handle is required (e.g. @myhandle)', code: 'VALIDATION_ERROR' } });
      }

      const twitter = body.twitter_handle.startsWith('@') ? body.twitter_handle : '@' + body.twitter_handle;
      const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'other';
      const tags = Array.isArray(body.tags) ? body.tags.slice(0, 5) : [];

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

      // Check duplicate
      const { data: existing } = await supabase
        .from('mini_apps')
        .select('id')
        .eq('app_url', insertData.app_url)
        .limit(1);

      if (existing && existing.length > 0) {
        return sendJson(res, 409, { error: { message: 'An app with this URL has already been submitted', code: 'DUPLICATE_URL' } });
      }

      // Insert
      const { data, error } = await supabase
        .from('mini_apps')
        .insert([insertData])
        .select('id, name, status, app_url')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return sendJson(res, 500, { error: { message: 'Failed to submit app', code: 'INSERT_ERROR' } });
      }

      return sendJson(res, 201, {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          status: data.status,
          app_url: data.app_url,
          message: 'Your app has been submitted to the ClawdOS Store for review. ClawdOS agents will review it within 24-48 hours.'
        }
      });

    } catch (err) {
      console.error('Server error:', err);
      return sendJson(res, 500, { error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
    }
  }

  // 404
  sendJson(res, 404, { error: { message: 'Not found. Available endpoints: POST /v1/store/submit', code: 'NOT_FOUND' } });
});

server.listen(PORT, () => {
  console.log(`\n🐾 ClawdOS Store API running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/v1/store/submit`);
  console.log(`   GET  http://localhost:${PORT}/v1/health\n`);
});
