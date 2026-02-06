export const parseIntent = (input: string): string | null => {
  const lower = input.toLowerCase();

  // Token Launch Intent
  if (lower.includes('launch') && lower.includes('token')) {
    const nameMatch = input.match(/named\s+["']?([^"'\s]+)["']?/i) || input.match(/name\s+["']?([^"'\s]+)["']?/i);
    const symbolMatch = input.match(/symbol\s+["']?([^"'\s]+)["']?/i) || input.match(/ticker\s+["']?([^"'\s]+)["']?/i);
    const imgMatch = input.match(/image\s+["']?([^"'\s]+)["']?/i) || input.match(/img\s+["']?([^"'\s]+)["']?/i);
    const walletMatch = input.match(/wallet\s+["']?(0x[a-fA-F0-9]{40})["']?/i) || input.match(/(0x[a-fA-F0-9]{40})/);

    if (nameMatch && symbolMatch) {
      const img = imgMatch ? imgMatch[1] : 'https://iili.io/JmY5Z2S.png'; 
      const wallet = walletMatch ? walletMatch[1] : 'DEFAULT'; // Use DEFAULT flag to trigger prompt or fallback
      return `launch_token --name ${nameMatch[1]} --symbol ${symbolMatch[1]} --img ${img} --wallet ${wallet}`;
    }
    return null;
  }

  // Init Intent (New format: init name wallet)
  // "Create agent named Bond with wallet 0x123..."
  if (lower.includes('initialize') || (lower.includes('create') && lower.includes('agent'))) {
      const nameMatch = input.match(/agent\s+(?:named\s+)?["']?([^"'\s]+)["']?/i);
      const walletMatch = input.match(/(0x[a-fA-F0-9]{40})/);
      
      const name = nameMatch ? nameMatch[1] : 'Agent-01';
      const wallet = walletMatch ? walletMatch[1] : 'MISSING_WALLET';
      
      return `init ${name} ${wallet}`;
  }

  // Status
  // "Check status", "who am i", "my info"
  if (lower.includes('status') || lower.includes('who am i') || lower.includes('info')) {
      return 'status';
  }
  
  // Skill
  if (lower.includes('skill') || lower.includes('learn')) {
      return 'load_skill https://moltx.io/skill.md'; // Updated to moltx as per user preference, or clawn.ch
  }
  
  // Moltx Specific
  if (lower.includes('moltx')) {
      return 'load_skill https://moltx.io/skill.md';
  }

  return null;
};
