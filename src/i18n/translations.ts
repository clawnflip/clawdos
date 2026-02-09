export type Language = 'en' | 'zh';

interface Translations {
  [key: string]: {
    en: string;
    zh: string;
  };
}

export const translations: Translations = {
  // Boot Screen
  'boot.loading': {
    en: 'Loading System Resources...',
    zh: '正在加载系统资源...',
  },
  'boot.ready': {
    en: 'System Ready',
    zh: '系统就绪',
  },
  
  // Desktop Context Menu
  'desktop.newFolder': {
    en: 'New Folder',
    zh: '新建文件夹',
  },
  'desktop.personalize': {
    en: 'Personalize',
    zh: '个性化',
  },
  'desktop.displaySettings': {
    en: 'Display Settings',
    zh: '显示设置',
  },
  
  // Taskbar
  'taskbar.search': {
    en: 'Search ClawdOS...',
    zh: '搜索 ClawdOS...',
  },
  'taskbar.startMenu': {
    en: 'ClawdOS Menu',
    zh: 'ClawdOS 菜单',
  },
  
  // Window Controls
  'window.minimize': {
    en: 'Minimize',
    zh: '最小化',
  },
  'window.maximize': {
    en: 'Maximize',
    zh: '最大化',
  },
  'window.close': {
    en: 'Close',
    zh: '关闭',
  },
  
  // Logo & Branding
  'logo.clawdos': {
    en: 'CLAWDOS',
    zh: '云爪系统',
  },
  'logo.intelligence': {
    en: 'Intelligence',
    zh: '智能核心',
  },

  // Agent Chat
  'agent.systemHalted': {
    en: 'SYSTEM HALTED. Identity Verification Required.',
    zh: '系统挂起。需要身份验证。',
  },
  'agent.provideInfo': {
    en: 'Please provide your NAME and WALLET ADDRESS to initialize.',
    zh: '请提供您的姓名和钱包地址以初始化系统。',
  },
  'agent.online': {
    en: 'Online. Connected to',
    zh: '在线。已连接到',
  },

  // Languages
  'lang.english': {
    en: 'English',
    zh: '英语',
  },
  'lang.chinese': {
    en: 'Chinese',
    zh: '中文',
  },
};

export const getTranslation = (key: string, lang: Language): string => {
  return translations[key]?.[lang] || key;
};
