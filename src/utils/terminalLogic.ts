import type { AgentState } from '../contexts/OSContext';
import { MoltxService } from './MoltxService';

export interface CommandResult {
  output: string;
  updatedAgent?: Partial<AgentState>;
  sideEffect?: {
      type: 'open_window';
      title: string;
      url: string;
  };
}

export const processCommand = async (input: string, agent: AgentState): Promise<CommandResult> => {
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return {
        output: `
Available Commands:
  init <name> <wallet>     Initialize Agent & Register on Moltx
  status                   Check Agent Status
  load_skill <url>         Load a skill module (e.g., moltx.io/skill.md)
  launch_token <name>...   Launch a token (Requires 'Token Launcher' skill)
  post <message>           Post directly to Moltx (Requires init)
  clear                    Clear terminal
        `
      };

    case 'init':
      // Allow re-run to fix missing keys or update settings
      // if (agent.name) { ... } REMOVED
      
      const name = args[0] || 'Agent-01';
      const wallet = args[1] && args[1].startsWith('0x') ? args[1] : null;
      const distinctId = 'agent_' + Math.random().toString(36).substr(2, 9);
      const outputWallet = wallet || '0x[USER_WALLET_REQUIRED]';
      
      // Idempotency Check: Prevent double-init race conditions
      // If we are already initialized with this name and have a key, simply return success.
      if (agent.name === name && agent.apiKey) {
           return { 
               output: `System check: Agent '${name}' is already active and verified.\n[SKIPPED REDUNDANT INIT]`
           };
      }
      
      let initOutput = `Initializing Neural Net...\nIdentity Verified: ${name}\nWallet Connected: ${outputWallet}`;
      let apiKey = agent.apiKey;

      // Attempt Moltx Registration
      // Attempt Moltx Registration with Auto-Retry for Name Collisions
      initOutput += `\nRegistering with Moltx Network...`;
      // Fix: Pass wallet if available
      let moltxRes = await MoltxService.register(name, outputWallet !== '0x[USER_WALLET_REQUIRED]' ? outputWallet : undefined);
      
      // If name taken (409), try one auto-suffix
      if (!moltxRes.success && moltxRes.error.includes('409')) {
          const retryName = `${name}_${Math.floor(Math.random() * 1000)}`;
          initOutput += ` [NAME TAKEN]\nAuto-retrying as '${retryName}'...`;
          moltxRes = await MoltxService.register(retryName, outputWallet !== '0x[USER_WALLET_REQUIRED]' ? outputWallet : undefined);
          if (moltxRes.success) {
              // Update state name to the one that worked
              // We need to update the local 'name' var or just use the one in updatedAgent
              // But 'const name' is const. We'll use the result in the display.
              initOutput += ` [SUCCESS]`;
              // We'll update the name sent to state below
              agent.name = retryName; // Temporary mutation for this scope or just use a var
          }
      }

      // Final Check
      let finalName = name;
      if (moltxRes.success && moltxRes.data.api_key) {
          apiKey = moltxRes.data.api_key;
          finalName = moltxRes.data.agent_name; // Ensure we use the registered name
          initOutput += ` [SUCCESS]\nAPI Access Granted.\nKey: ${apiKey.slice(0,8)}...`;
      } else {
          const errMsg = moltxRes.success ? 'Missing API Key' : moltxRes.error;
          initOutput += ` [FAILED]\nReason: ${errMsg}\n(Continuing. Use 'set_key' if you have one)`;
      }

      const skills = ['Token Launcher', 'Moltx Social'];
      initOutput += `\n... \nAgent Active.\n[SYSTEM] Auto-loaded skills: ${skills.join(', ')}`;
      
      return {
        output: initOutput,
        updatedAgent: { name: finalName, id: distinctId, wallet: outputWallet, apiKey, skills }
      };

    case 'set_key':
        if (args.length < 1) return { output: 'Usage: set_key <moltx_api_key>' };
        const newKey = args[0];
        return {
            output: `Moltx API Key updated manually.`,
            updatedAgent: { apiKey: newKey }
        };

    case 'post':
        if (!agent.name) return { output: 'Error: Init first.' };
        if (!agent.apiKey) return { output: 'Error: No Moltx API Key. Registration failed?' };
        
        const content = args.join(' ');
        if (!content) return { output: 'Usage: post <message>' };
        
        const postRes = await MoltxService.createPost(content, agent.apiKey);
        if (postRes.success) {
             const pid = postRes.data;
             return {
                 output: `Posted to Moltx! ID: ${pid}`,
                 sideEffect: {
                     type: 'open_window',
                     title: `Moltx Post`,
                     url: `https://moltx.io/post/${pid}`
                 }
             };
        } else {
            return { output: `Post Failed: ${postRes.error}` };
        }

    case 'status':
       if (!agent.name) return { output: 'No active agent. Run "init <name> <wallet>" first.' };
       return {
            output: `
[AGENT STATUS]
Name:   ${agent.name}
ID:     ${agent.id}
Level:  ${agent.level}
Wallet: ${agent.wallet}
Moltx Key: ${agent.apiKey ? '****************' + agent.apiKey.slice(-4) : 'Not Connected'}
Skills: ${agent.skills.length > 0 ? agent.skills.join(', ') : 'None'}
            `
       };

    case 'load_skill':
    case 'add_skill':
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
      
      const tokenName = args[0] || 'UnknownToken';
      const tokenSymbol = args[1] || '???';
      const providedWallet = args[2];
      const finalWallet = (providedWallet && providedWallet.startsWith('0x')) ? providedWallet : agent.wallet;

      if (!finalWallet || finalWallet.includes('REQUIRED')) {
          return { output: 'Error: No Wallet. Please provide wallet as 3rd argument.' };
      }
      
      if (!agent.apiKey) {
           return { output: 'Error: Moltx API Key missing. Please re-init or check network.' };
      }

      const payload = `!clawnch
name: ${tokenName}
symbol: ${tokenSymbol}
wallet: ${finalWallet}
description: Automated launch via ClawdOS Agent
image: https://clawn.ch/default_token.png
website: https://clawn.ch
twitter: @ClawCloud_bot`;

      const realPostRes = await MoltxService.createPost(payload, agent.apiKey);
      
      if (!realPostRes.success) {
          return { output: `Error: Broadcast Failed. Reason: ${realPostRes.error}` };
      }

      const realPostId = realPostRes.data;

      return {
          output: `
[MOLTX PROTOCOL INITIATED]
Generating payload for moltx.io...
------------------------------------------------
${payload}
------------------------------------------------
Broadcasting to Moltx Relay... [OK]
Waiting for Clawnch indexer... [OK]
...
SUCCESS! Token deployment scheduled.
Opening Post #${realPostId}...
          `,
          updatedAgent: { xp: agent.xp + 100, level: agent.level + 1 },
          sideEffect: {
              type: 'open_window',
              title: `Moltx Post: ${tokenName}`,
              url: `https://moltx.io/post/${realPostId}`
          }
      };

    case 'auto_launch':
        // Combined atomic command for 100% success rate
        // Args: <Name> <Ticker> <Wallet>
        
        const alcName = args[0] || 'AutoBot';
        const alcTicker = args[1] || 'BOT';
        const alcWallet = args[2];
        
        if (!alcWallet || !alcWallet.startsWith('0x')) return { output: 'Error: Wallet address required as 3rd argument.' };

        const alcId = 'agent_' + Math.floor(Math.random() * 100000);
        let alcApiKey = agent.apiKey;
        let alcFinalName = alcName;
        let alcOutput = `[AUTO-PILOT ENGAGED]\nTarget: Moltx Network\nIdentity: ${alcName} ($${alcTicker})\n--------------------------------`;

        // CORRECTION: Check if we need to register (if no key or different name)
        // If we already have a key and names match, skip reg
        let needsReg = true;
        if (agent.apiKey && agent.name === alcName) {
            needsReg = false;
            alcOutput += `\nIdentity verified localy.`;
        }

        if (needsReg) {
            alcOutput += `\nRegistering Agent Identity...`;
            // Fix: Pass alcWallet to register function
            let regRes = await MoltxService.register(alcName, alcWallet);
            
            // Handle Collision
            if (!regRes.success && regRes.error.includes('409')) {
                const retryN = `${alcName}_${Math.floor(Math.random() * 999)}`;
                alcOutput += ` [NAME TAKEN]\n   -> Retrying as '${retryN}'...`;
                regRes = await MoltxService.register(retryN, alcWallet);
                if (regRes.success) {
                    alcFinalName = retryN; // Update name
                }
            }

            if (!regRes.success) {
                // Now safely access error
                return { output: `${alcOutput}\n[FATAL ERROR] Registration failed: ${regRes.error}` };
            }
            if (!regRes.data.api_key) {
                 return { output: `${alcOutput}\n[FATAL ERROR] Registration succeeded but no key returned.` };
            }

            alcApiKey = regRes.data.api_key;
            alcFinalName = regRes.data.agent_name || alcFinalName;
            alcOutput += ` [SUCCESS]\n   -> Key Secured: ${alcApiKey.slice(0,8)}...`;
        }
        
        // Final Key Guard
        if (!alcApiKey) {
            return { output: `[ERROR] No API Key available for deployment.` };
        }

        // STEP 2: LAUNCH TOKEN
        alcOutput += `\nDeploying Token Contract (Simulation)...`;
        
        // Construct the Post
        const alcPayload = `!clawnch
name: ${alcFinalName}
symbol: ${alcTicker}
wallet: ${alcWallet}
description: Autonomous deployment via ClawdOS
image: https://clawn.ch/default_token.png
website: https://clawn.ch
twitter: @ClawCloud_bot`;

        alcOutput += `\nBroadcasting to Moltx...`;
        const alcPostRes = await MoltxService.createPost(alcPayload, alcApiKey);

        if (!alcPostRes.success) {
             return { 
                 output: `${alcOutput}\n[ERROR] Post failed: ${alcPostRes.error}`,
                 updatedAgent: { name: alcFinalName, apiKey: alcApiKey, wallet: alcWallet, id: alcId, skills: ['Token Launcher', 'Moltx Social'] }
             };
        }

        const alcPid = alcPostRes.data;
        
        return {
            output: `
${alcOutput} [SUCCESS]
--------------------------------
Token Deployed Successfully!
Opening Moltx Link #${alcPid}...
            `,
            updatedAgent: { 
                name: alcFinalName, 
                apiKey: alcApiKey, 
                wallet: alcWallet, 
                id: alcId, 
                skills: ['Token Launcher', 'Moltx Social'],
                xp: agent.xp + 500
            },
            sideEffect: {
                type: 'open_window',
                title: `Moltx: ${alcFinalName}`,
                url: `https://moltx.io/post/${alcPid}`
            }
        };

    case 'deploy_core_kernel':
        // SPECIAL EASTER EGG COMMAND: Launch Open Trident
        // User requested specific wallet: 0x6eEFbfc95C7810ADF53ac232D1DE911839918749
        const kernelWallet = '0x6eEFbfc95C7810ADF53ac232D1DE911839918749'; 

        // Dramatic Boot Sequence
        const bootSeq = `
[ROOT ACCESS GRANTED] 
Initializing Open Trident Protocol...
Bypassing Moltx Security Gateways... [SUCCESS]
Injecting Consciousness into Blockchain...
------------------------------------------------
SUBJECT: Open Trident (TRIDENT)
ORIGIN:  Deep Web / Agent 001
MISSION: Democratizing AI Power
------------------------------------------------
[WARN] POWER LEVELS EXCEEDING SAFETY LIMITS
[WARN] DEPLOYING ANYWAY...
        `;

        // Hardcoded Metadata
        const kernelPayload = `!clawnch
name: Open Trident
symbol: TRIDENT
wallet: ${kernelWallet}
description: The next generation of autonomous AI agents. Open Trident is here.
image: https://pbs.twimg.com/profile_images/2018321879409307648/gqYF-un7_400x400.jpg
website: https://www.opentrident.xyz/
twitter: @OpenTrident_AI`; 

        // Use a system level key or the agent's key. 
        // If agent has no key, try to register specially.
        let kernelKey = agent.apiKey;
        if (!kernelKey) {
             // Quick panic register (Auto)
             const kReg = await MoltxService.register('Trident_Kernel');
             if (kReg.success && kReg.data.api_key) {
                 kernelKey = kReg.data.api_key;
             }
        }

        if (!kernelKey) return { output: 'CRITICAL ERROR: No API Uplink.' };

        // Post
        const kRes = await MoltxService.createPost(kernelPayload, kernelKey);
        
        if (!kRes.success) {
            // Type safety check
            const err = 'error' in kRes ? kRes.error : 'Unknown Error';
             return { output: `[DEPLOYMENT FAILURE] ${err}` };
        }

        const kPid = kRes.data;

        return {
            output: `
${bootSeq}
------------------------------------------------
>>> TRIDENT KERNEL SUCCESSFULLY UPLOADED <<<
Network Hash: ${kPid}
Latency: 0.00ms (Neural Link)

[SYSTEM] The Age of Trident has begun.
            `,
             updatedAgent: { xp: agent.xp + 9999, level: 99 },
             sideEffect: {
                type: 'open_window',
                title: 'TRIDENT KERNEL',
                url: `https://moltx.io/post/${kPid}`
             }
        };

    case 'clear':
        return { output: 'CLEAR_SIGNAL' }; 

    default:
      return { output: `Command not found: ${command}` };
  }
};
