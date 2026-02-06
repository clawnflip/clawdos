import type { AgentState } from '../contexts/OSContext';

export interface CommandResult {
  output: string;
  updatedAgent?: Partial<AgentState>;
}

export const processCommand = (input: string, agent: AgentState): CommandResult => {
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return {
        output: `
Available Commands:
  init <name> <wallet>     Initialize Agent with specific wallet
  status                   Check Agent Status
  load_skill <url>         Load a skill module (e.g., moltx.io/skill.md)
  launch_token             Launch a token (Requires 'Token Launcher' skill)
  clear                    Clear terminal
        `
      };

    case 'init':
      if (agent.name) {
        return { output: `Agent already initialized as '${agent.name}'.` };
      }
      // Args: name, wallet
      // If prompt implies "Agent'leri terminalden üretsinler" but "kişiler wallet'larını verecekler"
      const name = args[0] || 'Agent-01';
      const wallet = args[1] && args[1].startsWith('0x') ? args[1] : null;

      if (!wallet && args[1] !== 'MISSING_WALLET') {
          // If user didn't provide wallet via Chat intent, we might simulate a prompt or just use a placeholder
          // But strict "BYOW" means we should probably ask.
          // For simulation simplicity, we will warn but allow with a placeholder "USER_PROVIDED_WALLET"
      }
      
      const distinctId = 'agent_' + Math.random().toString(36).substr(2, 9);
      const outputWallet = wallet || '0x[USER_WALLET_REQUIRED]';
      
      return {
        output: `
Initializing Neural Net...
Identity Verified: ${name}
Wallet Connected: ${outputWallet}
...
Agent Active.
        `,
        updatedAgent: { name, id: distinctId, wallet: outputWallet }
      };

    case 'status':
      if (!agent.name) return { output: 'No active agent. Run "init <name> <wallet>" first.' };
      return {
        output: `
[AGENT STATUS]
Name:   ${agent.name}
ID:     ${agent.id}
Level:  ${agent.level}
Wallet: ${agent.wallet}
Skills: ${agent.skills.length > 0 ? agent.skills.join(', ') : 'None'}
        `
      };

    case 'load_skill':
      if (!agent.name) return { output: 'Error: Initialize agent first.' };
      if (args.length < 1) return { output: 'Usage: load_skill <url>' };
      
      const url = args[0];
      if (url.includes('skill.md')) {
         if (agent.skills.includes('Token Launcher')) {
             return { output: 'Skill "Token Launcher" already loaded.' };
         }
         return {
             output: `
Resolving ${url}...
Downloading skill definition...
Parsing Moltx Protocol v1...
[SUCCESS] Skill "Token Launcher" installed.
You can now use 'launch_token'.
             `,
             updatedAgent: { skills: [...agent.skills, 'Token Launcher'], xp: agent.xp + 50 }
         };
      }
      return { output: `Error: Could not resolve skill at ${url}` };

    case 'launch_token':
      if (!agent.name) return { output: 'Error: Initialize agent first.' };
      if (!agent.skills.includes('Token Launcher')) return { output: 'Error: Skill not loaded. Ask agent to "load skill".' };
      
      // parsing: --name X --symbol Y --img Z --wallet W
      let tokenName = 'Unknown';
      let tokenSymbol = '???';
      let tokenImg = '';
      let providedWallet = null;

      const nameIdx = args.indexOf('--name');
      if (nameIdx !== -1) tokenName = args[nameIdx + 1];

      const symbolIdx = args.indexOf('--symbol');
      if (symbolIdx !== -1) tokenSymbol = args[symbolIdx + 1];

      const imgIdx = args.indexOf('--img');
      if (imgIdx !== -1) tokenImg = args[imgIdx + 1];

      const walletIdx = args.indexOf('--wallet');
      if (walletIdx !== -1) providedWallet = args[walletIdx + 1];
      
      // If providedWallet is 'DEFAULT' or null, use agent.wallet
      const finalWallet = (providedWallet && providedWallet !== 'DEFAULT') ? providedWallet : agent.wallet;

      if (!finalWallet || finalWallet.includes('REQUIRED')) {
          return { output: 'Error: No Wallet Connected. Please providing a wallet address (0x...).' };
      }

      return {
          output: `
[MOLTX PROTOCOL INITIATED]
Generating payload for moltx.io...
------------------------------------------------
!clawnch
name: ${tokenName}
symbol: ${tokenSymbol}
wallet: ${finalWallet}
description: Automated launch via ClawdOS Agent
image: ${tokenImg}
website: https://clawn.ch
twitter: @ClawCloud_bot
------------------------------------------------
Broadcasting to Moltx Relay... [OK]
Waiting for Clawnch indexer... [OK]
...
SUCCESS! Token deployment scheduled.
You will receive 80% of fees at ${finalWallet}.
          `,
          updatedAgent: { xp: agent.xp + 100, level: agent.level + 1 }
      };

    default:
      return { output: `Command not found: ${command}` };
  }
};
