import type { ClawdManifest, MiniAppCategory } from '../types/miniapp';

const VALID_CATEGORIES: MiniAppCategory[] = ['game', 'defi', 'social', 'utility', 'media', 'other'];

/**
 * Derive the manifest URL from an app URL
 * e.g. https://myapp.com -> https://myapp.com/.well-known/clawd.json
 */
export function deriveManifestUrl(appUrl: string): string {
  try {
    const url = new URL(appUrl);
    // Remove trailing slash and append well-known path
    const base = url.origin + url.pathname.replace(/\/+$/, '');
    return `${base}/.well-known/clawd.json`;
  } catch {
    return '';
  }
}

/**
 * Fetch manifest from a given app URL
 * Returns null on CORS error or network failure (UI should fallback to manual form)
 */
export async function fetchManifest(appUrl: string): Promise<ClawdManifest | null> {
  const manifestUrl = deriveManifestUrl(appUrl);
  if (!manifestUrl) return null;

  try {
    const response = await fetch(manifestUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const validation = validateManifest(data);
    if (!validation.valid) {
      console.warn('Manifest validation errors:', validation.errors);
      return null;
    }

    return data as ClawdManifest;
  } catch (err) {
    // CORS or network error - expected for many external apps
    console.warn('Failed to fetch manifest:', err);
    return null;
  }
}

/**
 * Validate a manifest object
 */
export function validateManifest(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Manifest must be a JSON object'] };
  }

  const manifest = data as Record<string, unknown>;

  if (!manifest.miniapp || typeof manifest.miniapp !== 'object') {
    return { valid: false, errors: ['Missing "miniapp" root key'] };
  }

  const app = manifest.miniapp as Record<string, unknown>;

  // Required fields
  if (app.version !== '1') {
    errors.push('version must be "1"');
  }

  if (typeof app.name !== 'string' || app.name.length < 3 || app.name.length > 50) {
    errors.push('name must be a string between 3-50 characters');
  }

  if (typeof app.iconUrl !== 'string' || !app.iconUrl.startsWith('https://')) {
    errors.push('iconUrl must be a valid HTTPS URL');
  }

  if (typeof app.homeUrl !== 'string' || !app.homeUrl.startsWith('https://')) {
    errors.push('homeUrl must be a valid HTTPS URL');
  }

  if (typeof app.description !== 'string' || app.description.length < 10 || app.description.length > 300) {
    errors.push('description must be a string between 10-300 characters');
  }

  // Developer
  if (!app.developer || typeof app.developer !== 'object') {
    errors.push('developer object is required');
  } else {
    const dev = app.developer as Record<string, unknown>;
    if (typeof dev.name !== 'string' || dev.name.length < 1) {
      errors.push('developer.name is required');
    }
  }

  // Optional fields validation
  if (app.imageUrl !== undefined && (typeof app.imageUrl !== 'string' || !app.imageUrl.startsWith('https://'))) {
    errors.push('imageUrl must be a valid HTTPS URL');
  }

  if (app.tags !== undefined) {
    if (!Array.isArray(app.tags) || app.tags.length > 5) {
      errors.push('tags must be an array with max 5 items');
    }
  }

  if (app.primaryCategory !== undefined && !VALID_CATEGORIES.includes(app.primaryCategory as MiniAppCategory)) {
    errors.push(`primaryCategory must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}
