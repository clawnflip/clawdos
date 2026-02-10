// ClawdOS Mini App Type Definitions

export type MiniAppCategory = 'game' | 'defi' | 'social' | 'utility' | 'media' | 'other';

// Manifest type (/.well-known/clawd.json)
export interface ClawdManifest {
  miniapp: {
    version: '1';
    name: string;
    iconUrl: string;
    homeUrl: string;
    description: string;
    imageUrl?: string;
    splashBackgroundColor?: string;
    developer: {
      name: string;
      wallet?: string;
      twitter?: string;
      url?: string;
    };
    tags?: string[];
    primaryCategory?: MiniAppCategory;
    permissions?: string[];
  };
}

// Supabase record type
export interface MiniAppRecord {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  code?: string;
  app_url?: string;
  app_type: 'code' | 'url';
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  image_url?: string;
  category?: MiniAppCategory;
  tags?: string[];
  developer_name?: string;
  owner_wallet?: string;
  twitter_handle?: string;
  manifest_url?: string;
  version?: number;
  created_at?: string;
}

// SDK context passed to mini apps via postMessage
export interface ClawdSDKContext {
  user: {
    wallet: string | null;
    name: string | null;
  };
  app: {
    id: string | null;
  };
  theme: 'dark';
  platform: 'clawdos';
}

// SDK message types
export type ClawdSDKMessageType =
  | 'clawd:ready'
  | 'clawd:get_context'
  | 'clawd:close'
  | 'clawd:set_title'
  | 'clawd:open_url'
  | 'clawd:show_toast'
  | 'clawd:context_response'
  | 'clawd:context_update';

export interface ClawdSDKMessage {
  type: ClawdSDKMessageType;
  payload?: Record<string, unknown>;
}
