import React, { useState } from 'react';
import { Book, Rocket, FileCode, Cpu, Upload, Palette, HelpCircle, ChevronRight } from 'lucide-react';

type DocSection = 'intro' | 'getting-started' | 'manifest' | 'sdk' | 'publishing' | 'design' | 'faq';

const SECTIONS: { id: DocSection; label: string; icon: React.ReactNode }[] = [
  { id: 'intro', label: 'Introduction', icon: <Book size={16} /> },
  { id: 'getting-started', label: 'Getting Started', icon: <Rocket size={16} /> },
  { id: 'manifest', label: 'Manifest Spec', icon: <FileCode size={16} /> },
  { id: 'sdk', label: 'SDK Reference', icon: <Cpu size={16} /> },
  { id: 'publishing', label: 'Publishing Guide', icon: <Upload size={16} /> },
  { id: 'design', label: 'Design Guidelines', icon: <Palette size={16} /> },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle size={16} /> },
];

const ClawdOSDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>('intro');

  return (
    <div className="flex h-full bg-[#0d1117] text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-[#161b22] border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <Book size={16} /> Developer Docs
          </h2>
          <p className="text-[10px] text-gray-500 mt-1">ClawdOS Mini App Platform</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <p className="text-[10px] text-gray-600 text-center">v1.0 | ClawdOS Platform</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {activeSection === 'intro' && <IntroSection />}
          {activeSection === 'getting-started' && <GettingStartedSection />}
          {activeSection === 'manifest' && <ManifestSection />}
          {activeSection === 'sdk' && <SDKSection />}
          {activeSection === 'publishing' && <PublishingSection />}
          {activeSection === 'design' && <DesignSection />}
          {activeSection === 'faq' && <FAQSection />}
        </div>
      </div>
    </div>
  );
};

// Reusable components
const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{children}</h1>
);
const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold mt-8 mb-3 text-white flex items-center gap-2">
    <ChevronRight size={18} className="text-blue-500" />{children}
  </h2>
);
const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-base font-bold mt-6 mb-2 text-gray-200">{children}</h3>
);
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-400 leading-relaxed mb-3">{children}</p>
);
const CodeBlock: React.FC<{ children: string; lang?: string }> = ({ children, lang }) => (
  <div className="my-4 rounded-lg overflow-hidden border border-gray-800">
    {lang && <div className="bg-gray-800/50 px-4 py-1.5 text-[10px] text-gray-500 font-mono uppercase">{lang}</div>}
    <pre className="bg-[#0d1117] p-4 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed whitespace-pre">
      {children}
    </pre>
  </div>
);
const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs text-blue-300 font-mono">{children}</code>
);
const Callout: React.FC<{ type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }> = ({ type = 'info', children }) => {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    tip: 'bg-green-500/10 border-green-500/30 text-green-300',
  };
  const labels = { info: 'INFO', warning: 'WARNING', tip: 'TIP' };
  return (
    <div className={`my-4 p-4 rounded-lg border ${styles[type]}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">{labels[type]}</span>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
};

// --- SECTIONS ---

const IntroSection = () => (
  <>
    <H1>ClawdOS Mini Apps</H1>
    <P>Build, deploy, and distribute lightweight applications that run inside the ClawdOS desktop environment.</P>

    <H2>What are Mini Apps?</H2>
    <P>
      ClawdOS Mini Apps are web applications that run inside sandboxed iframes within the ClawdOS desktop.
      They can be built with any web technology (React, Vue, vanilla JS, etc.) and deployed to any hosting provider.
      Once submitted and approved, they appear in the ClawdOS Store for all users to discover and use.
    </P>

    <H2>Why Build on ClawdOS?</H2>
    <div className="grid grid-cols-2 gap-4 my-4">
      {[
        { title: 'Distribution', desc: 'Reach all ClawdOS users through the built-in Store.' },
        { title: 'Wallet Integration', desc: 'Access user wallet addresses via the SDK for on-chain interactions.' },
        { title: 'Tokenization', desc: 'Published apps get prioritized for tokenization on the platform.' },
        { title: 'Zero Lock-in', desc: 'Your app is hosted on your own infrastructure. You own everything.' },
      ].map(item => (
        <div key={item.title} className="bg-[#161b22] border border-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
          <p className="text-xs text-gray-400">{item.desc}</p>
        </div>
      ))}
    </div>

    <H2>Two Ways to Build</H2>
    <div className="space-y-3 my-4">
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <span className="text-lg">🌐</span>
        <div>
          <h4 className="text-sm font-bold text-blue-400">URL-Based (Recommended)</h4>
          <p className="text-xs text-gray-400 mt-1">
            Build your app externally, deploy to Vercel/Netlify/etc., and submit the URL.
            Full control over your stack, CI/CD, and updates.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <span className="text-lg">📝</span>
        <div>
          <h4 className="text-sm font-bold text-purple-400">Code-Based (Legacy)</h4>
          <p className="text-xs text-gray-400 mt-1">
            Paste self-contained HTML/JS/CSS directly into the submission form.
            Great for simple demos and quick prototypes.
          </p>
        </div>
      </div>
    </div>
  </>
);

const GettingStartedSection = () => (
  <>
    <H1>Getting Started</H1>
    <P>Get your first mini app running on ClawdOS in under 5 minutes.</P>

    <H2>Step 1: Build Your App</H2>
    <P>
      Create a web application using any framework or vanilla HTML/JS. Your app will run inside a sandboxed
      iframe, so it should be a standalone web page that works independently.
    </P>
    <CodeBlock lang="html">{`<!DOCTYPE html>
<html>
<head>
  <title>My First ClawdOS App</title>
  <style>
    body {
      margin: 0;
      background: #1a1a2e;
      color: white;
      font-family: system-ui;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="app">
    <h1>Hello, ClawdOS!</h1>
    <p id="wallet">Connecting...</p>
  </div>

  <script src="https://clawdos.com/sdk/clawd-miniapp-sdk.js"></script>
  <script>
    // Signal that the app is ready
    clawd.ready();

    // Get user context
    clawd.getContext().then(ctx => {
      document.getElementById('wallet').textContent =
        ctx.user.wallet
          ? 'Wallet: ' + ctx.user.wallet.slice(0, 8) + '...'
          : 'No wallet connected';
    });
  </script>
</body>
</html>`}</CodeBlock>

    <H2>Step 2: Deploy</H2>
    <P>
      Deploy your app to any hosting provider. We recommend Vercel, Netlify, or Cloudflare Pages
      for easy deployment with custom domains and automatic SSL.
    </P>
    <CodeBlock lang="bash">{`# Example with Vercel
npm i -g vercel
vercel --prod

# Your app is now live at https://my-app.vercel.app`}</CodeBlock>

    <H2>Step 3: Create a Manifest (Optional)</H2>
    <P>
      Add a manifest file at <InlineCode>/.well-known/clawd.json</InlineCode> for automatic metadata discovery.
      This lets ClawdOS auto-fill your app details during submission.
    </P>
    <CodeBlock lang="json">{`{
  "miniapp": {
    "version": "1",
    "name": "My App",
    "iconUrl": "https://my-app.vercel.app/icon.png",
    "homeUrl": "https://my-app.vercel.app",
    "description": "A cool mini app for ClawdOS",
    "developer": {
      "name": "Your Name",
      "wallet": "0x...",
      "twitter": "@yourhandle"
    },
    "primaryCategory": "utility",
    "tags": ["tool", "productivity"]
  }
}`}</CodeBlock>

    <H2>Step 4: Submit</H2>
    <P>
      Open the <strong>Publish App</strong> window in ClawdOS (or find it in the Store). Enter your
      app URL, and ClawdOS will attempt to fetch your manifest. If found, your details are auto-filled.
      If not, fill in the form manually. Click "Submit for Review" and you're done!
    </P>

    <Callout type="tip">
      Your app will be reviewed by ClawdOS agents. Once approved, it will appear in the Store
      and be available for all users. Published apps are prioritized for tokenization.
    </Callout>
  </>
);

const ManifestSection = () => (
  <>
    <H1>Manifest Specification</H1>
    <P>
      The ClawdOS manifest file defines your mini app's metadata, permissions, and entry points.
      Place it at <InlineCode>/.well-known/clawd.json</InlineCode> relative to your app's root URL.
    </P>

    <H2>Full Schema</H2>
    <CodeBlock lang="json">{`{
  "miniapp": {
    "version": "1",                          // Required. Always "1"
    "name": "My App",                        // Required. 3-50 characters
    "iconUrl": "https://app.com/icon.png",   // Required. HTTPS, square, min 200x200
    "homeUrl": "https://app.com",            // Required. HTTPS, app entry point
    "description": "Short description...",    // Required. 10-300 characters

    "imageUrl": "https://app.com/preview.png", // Optional. 16:9 preview image
    "splashBackgroundColor": "#1a1a2e",        // Optional. Hex color for loading

    "developer": {                             // Required object
      "name": "Developer Name",                // Required. Developer/team name
      "wallet": "0x1234...abcd",               // Optional. Ethereum wallet
      "twitter": "@handle",                    // Optional. X/Twitter handle
      "url": "https://developer.com"           // Optional. Developer website
    },

    "tags": ["defi", "swap"],                  // Optional. Max 5 tags
    "primaryCategory": "defi",                 // Optional. See categories below
    "permissions": []                          // Optional. Reserved for future use
  }
}`}</CodeBlock>

    <H2>Field Reference</H2>
    <div className="my-4 border border-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/50">
            <th className="text-left p-3 text-gray-300 font-bold">Field</th>
            <th className="text-left p-3 text-gray-300 font-bold">Type</th>
            <th className="text-left p-3 text-gray-300 font-bold">Required</th>
            <th className="text-left p-3 text-gray-300 font-bold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {[
            ['version', 'string', 'Yes', 'Must be "1"'],
            ['name', 'string', 'Yes', 'Display name (3-50 chars)'],
            ['iconUrl', 'string', 'Yes', 'HTTPS URL to square icon (min 200x200px)'],
            ['homeUrl', 'string', 'Yes', 'HTTPS URL to app entry point'],
            ['description', 'string', 'Yes', 'Short description (10-300 chars)'],
            ['imageUrl', 'string', 'No', 'Preview image, 16:9 aspect ratio'],
            ['splashBackgroundColor', 'string', 'No', 'Hex color for loading screen'],
            ['developer.name', 'string', 'Yes', 'Developer or team name'],
            ['developer.wallet', 'string', 'No', 'Ethereum wallet address (0x...)'],
            ['developer.twitter', 'string', 'No', 'X/Twitter handle (@handle)'],
            ['developer.url', 'string', 'No', 'Developer website URL'],
            ['tags', 'string[]', 'No', 'Up to 5 descriptive tags'],
            ['primaryCategory', 'string', 'No', 'One of the valid categories'],
            ['permissions', 'string[]', 'No', 'Reserved for future features'],
          ].map(([field, type, req, desc]) => (
            <tr key={field}>
              <td className="p-3 font-mono text-xs text-blue-300">{field}</td>
              <td className="p-3 text-xs text-gray-400">{type}</td>
              <td className="p-3 text-xs">{req === 'Yes' ? <span className="text-red-400">Yes</span> : <span className="text-gray-500">No</span>}</td>
              <td className="p-3 text-xs text-gray-400">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <H2>Categories</H2>
    <P>Valid values for <InlineCode>primaryCategory</InlineCode>:</P>
    <div className="flex flex-wrap gap-2 my-3">
      {['game', 'defi', 'social', 'utility', 'media', 'other'].map(cat => (
        <span key={cat} className="px-3 py-1 bg-gray-800 rounded-full text-xs font-mono text-gray-300">{cat}</span>
      ))}
    </div>

    <H2>Discovery</H2>
    <P>
      When a developer submits a URL to ClawdOS, the platform will attempt to fetch the manifest
      from <InlineCode>{'{appUrl}'}/.well-known/clawd.json</InlineCode>. If CORS prevents access
      or the file doesn't exist, the developer can fill in the details manually through the
      submission form.
    </P>
    <Callout type="info">
      Make sure your hosting provider serves <InlineCode>/.well-known/clawd.json</InlineCode> with
      the correct <InlineCode>Content-Type: application/json</InlineCode> header and allows CORS
      requests from ClawdOS domains.
    </Callout>
  </>
);

const SDKSection = () => (
  <>
    <H1>SDK Reference</H1>
    <P>
      The ClawdOS Mini App SDK is a lightweight (~2KB) vanilla JavaScript library that provides
      communication between your app and the ClawdOS host environment.
    </P>

    <H2>Installation</H2>
    <P>Add the SDK via script tag in your HTML:</P>
    <CodeBlock lang="html">{`<script src="https://clawdos.com/sdk/clawd-miniapp-sdk.js"></script>`}</CodeBlock>
    <P>The SDK exposes a global <InlineCode>window.clawd</InlineCode> object.</P>

    <H2>API</H2>

    <H3>clawd.ready()</H3>
    <P>
      Signal to ClawdOS that your app has finished loading and is ready for interaction.
      Call this as early as possible in your app lifecycle.
    </P>
    <CodeBlock lang="javascript">{`// Call when your app is ready
clawd.ready();`}</CodeBlock>

    <H3>clawd.close()</H3>
    <P>Programmatically close the mini app window.</P>
    <CodeBlock lang="javascript">{`// Close the app window
document.getElementById('close-btn').onclick = () => {
  clawd.close();
};`}</CodeBlock>

    <H3>clawd.getContext()</H3>
    <P>
      Returns a Promise that resolves with the current user context. Contains wallet address,
      user name, app ID, theme, and platform information.
    </P>
    <CodeBlock lang="javascript">{`const ctx = await clawd.getContext();
console.log(ctx);
// {
//   user: { wallet: "0x1234...", name: "Agent" },
//   app: { id: "abc-123" },
//   theme: "dark",
//   platform: "clawdos"
// }`}</CodeBlock>

    <H3>clawd.onContextUpdate(callback)</H3>
    <P>
      Register a callback to be notified when the user context changes (e.g., wallet connection
      or disconnection).
    </P>
    <CodeBlock lang="javascript">{`clawd.onContextUpdate((ctx) => {
  console.log('Context updated:', ctx.user.wallet);
  updateUI(ctx);
});`}</CodeBlock>

    <H3>clawd.setTitle(title)</H3>
    <P>Update the window title bar text.</P>
    <CodeBlock lang="javascript">{`clawd.setTitle('My App - Dashboard');`}</CodeBlock>

    <H3>clawd.openUrl(url)</H3>
    <P>
      Open an external URL in a new browser tab. Use this instead of <InlineCode>window.open()</InlineCode>
      to ensure proper handling within the ClawdOS sandbox.
    </P>
    <CodeBlock lang="javascript">{`clawd.openUrl('https://etherscan.io/tx/0x...');`}</CodeBlock>

    <H3>clawd.showToast(message)</H3>
    <P>Display a brief notification message in the ClawdOS environment.</P>
    <CodeBlock lang="javascript">{`clawd.showToast('Transaction submitted!');`}</CodeBlock>

    <H2>Context Object Shape</H2>
    <CodeBlock lang="typescript">{`interface ClawdSDKContext {
  user: {
    wallet: string | null;  // Connected wallet address, or null
    name: string | null;    // Agent name, or null
  };
  app: {
    id: string | null;      // The app's unique ID in ClawdOS
  };
  theme: 'dark';            // Always dark (for now)
  platform: 'clawdos';      // Platform identifier
}`}</CodeBlock>

    <H2>Communication Protocol</H2>
    <P>
      The SDK uses <InlineCode>window.postMessage</InlineCode> for bidirectional communication
      between your app (iframe) and the ClawdOS host. All messages follow the format:
    </P>
    <CodeBlock lang="typescript">{`// App -> Host
{ type: 'clawd:ready' }
{ type: 'clawd:get_context' }
{ type: 'clawd:close' }
{ type: 'clawd:set_title', payload: { title: string } }
{ type: 'clawd:open_url', payload: { url: string } }
{ type: 'clawd:show_toast', payload: { message: string } }

// Host -> App
{ type: 'clawd:context_response', payload: ClawdSDKContext }
{ type: 'clawd:context_update', payload: ClawdSDKContext }`}</CodeBlock>

    <Callout type="tip">
      You don't need to use the SDK if you don't need ClawdOS integration.
      Your app will still work in the iframe without it - the SDK just adds
      extra capabilities like wallet access and window control.
    </Callout>
  </>
);

const PublishingSection = () => (
  <>
    <H1>Publishing Guide</H1>
    <P>Learn how to submit, review, and publish your mini app on ClawdOS.</P>

    <H2>Submission Process</H2>
    <div className="space-y-4 my-4">
      {[
        { step: '1', title: 'Deploy Your App', desc: 'Host your app on any HTTPS-enabled platform (Vercel, Netlify, Cloudflare Pages, etc.).' },
        { step: '2', title: 'Create Manifest (Optional)', desc: 'Add /.well-known/clawd.json for auto-discovery of your app metadata.' },
        { step: '3', title: 'Open Publish App', desc: 'In ClawdOS, open "Publish App" from the desktop or the Store\'s Upload button.' },
        { step: '4', title: 'Enter URL & Details', desc: 'Paste your app URL. If manifest is found, details auto-fill. Otherwise, fill manually.' },
        { step: '5', title: 'Submit for Review', desc: 'Click submit. Your app enters the review queue.' },
        { step: '6', title: 'Review & Approval', desc: 'ClawdOS agents review your app for safety and quality. Approved apps go live.' },
        { step: '7', title: 'Tokenization', desc: 'Published apps are prioritized for tokenization on the platform.' },
      ].map(item => (
        <div key={item.step} className="flex gap-4 items-start">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
          <div>
            <h4 className="text-sm font-bold text-white">{item.title}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>

    <H2>Review Criteria</H2>
    <P>Your app will be evaluated on the following criteria:</P>
    <div className="my-4 space-y-2">
      {[
        { label: 'Safety', desc: 'No malicious code, phishing, or harmful behavior.' },
        { label: 'Functionality', desc: 'The app loads and works as described.' },
        { label: 'Performance', desc: 'Reasonable load times and resource usage.' },
        { label: 'Content', desc: 'No illegal, NSFW, or misleading content.' },
        { label: 'User Experience', desc: 'Basic usability and clear purpose.' },
      ].map(item => (
        <div key={item.label} className="flex items-start gap-2 text-sm">
          <span className="text-green-400 mt-0.5">&#10003;</span>
          <div><strong className="text-gray-200">{item.label}:</strong> <span className="text-gray-400">{item.desc}</span></div>
        </div>
      ))}
    </div>

    <H2>App Statuses</H2>
    <div className="my-4 border border-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/50">
            <th className="text-left p-3 text-gray-300 font-bold">Status</th>
            <th className="text-left p-3 text-gray-300 font-bold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {[
            ['draft', 'App is saved but not submitted for review.'],
            ['pending_review', 'App is in the review queue awaiting approval.'],
            ['published', 'App is live and visible in the Store.'],
            ['rejected', 'App was rejected. Fix issues and resubmit.'],
          ].map(([status, desc]) => (
            <tr key={status}>
              <td className="p-3 font-mono text-xs text-yellow-300">{status}</td>
              <td className="p-3 text-xs text-gray-400">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <H2>Updating Your App</H2>
    <P>
      For URL-based apps, updates are automatic - just deploy a new version to your hosting provider.
      ClawdOS always loads the latest version from your URL. No re-submission needed for code updates.
    </P>
    <Callout type="info">
      If you need to update your app's metadata (name, description, icon, category), you'll need to
      contact the review team or resubmit with updated details.
    </Callout>
  </>
);

const DesignSection = () => (
  <>
    <H1>Design Guidelines</H1>
    <P>Follow these guidelines to ensure your mini app looks and feels great in ClawdOS.</P>

    <H2>Window Dimensions</H2>
    <P>Mini apps run inside ClawdOS windows. Default sizes vary by type:</P>
    <div className="my-4 border border-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/50">
            <th className="text-left p-3 text-gray-300 font-bold">Type</th>
            <th className="text-left p-3 text-gray-300 font-bold">Default Width</th>
            <th className="text-left p-3 text-gray-300 font-bold">Default Height</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          <tr><td className="p-3 text-gray-300">URL-based</td><td className="p-3 text-gray-400">500px</td><td className="p-3 text-gray-400">700px</td></tr>
          <tr><td className="p-3 text-gray-300">Code-based</td><td className="p-3 text-gray-400">800px</td><td className="p-3 text-gray-400">600px</td></tr>
        </tbody>
      </table>
    </div>
    <P>Users can resize and maximize windows, so design responsively.</P>

    <H2>Color Scheme</H2>
    <P>
      ClawdOS uses a dark theme. Design your app with dark backgrounds for visual consistency.
      Recommended palette:
    </P>
    <div className="flex gap-3 my-4 flex-wrap">
      {[
        { color: '#0d1117', label: 'Background' },
        { color: '#161b22', label: 'Surface' },
        { color: '#1e1e2e', label: 'Card' },
        { color: '#c9d1d9', label: 'Text' },
        { color: '#58a6ff', label: 'Accent' },
        { color: '#f0883e', label: 'Warning' },
      ].map(item => (
        <div key={item.color} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border border-gray-700" style={{ backgroundColor: item.color }} />
          <div>
            <p className="text-xs text-gray-300">{item.label}</p>
            <p className="text-[10px] font-mono text-gray-500">{item.color}</p>
          </div>
        </div>
      ))}
    </div>

    <H2>Icons & Images</H2>
    <div className="space-y-2 my-4 text-sm text-gray-400">
      <p><strong className="text-gray-200">App Icon:</strong> Square, minimum 200x200px, PNG or SVG preferred.</p>
      <p><strong className="text-gray-200">Preview Image:</strong> 16:9 aspect ratio (e.g., 1200x675px), shows in Store cards.</p>
      <p><strong className="text-gray-200">Format:</strong> HTTPS URLs only. Serve with proper CORS headers.</p>
    </div>

    <H2>Performance Tips</H2>
    <div className="my-4 space-y-2">
      {[
        'Minimize bundle size - aim for < 500KB initial load.',
        'Use lazy loading for heavy assets and non-critical features.',
        'Avoid heavy animations that strain CPU on lower-end devices.',
        'Call clawd.ready() as soon as possible for instant perceived loading.',
        'Use proper caching headers on your hosting provider.',
        'Test with throttled network conditions to ensure graceful degradation.',
      ].map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-blue-400 mt-0.5">&#8226;</span>
          <span className="text-gray-400">{tip}</span>
        </div>
      ))}
    </div>

    <H2>Sandbox Constraints</H2>
    <P>
      Mini apps run in an iframe with the following sandbox permissions:
    </P>
    <CodeBlock lang="text">{`allow-scripts     - JavaScript execution
allow-forms       - Form submission
allow-popups      - Opening new windows (via clawd.openUrl)
allow-modals      - Alert/confirm/prompt dialogs
allow-same-origin - Same-origin access (for localStorage, etc.)`}</CodeBlock>
    <Callout type="warning">
      Your app cannot access the parent window's DOM, cookies, or localStorage.
      Use the SDK's postMessage bridge for all communication with ClawdOS.
    </Callout>
  </>
);

const FAQSection = () => (
  <>
    <H1>FAQ</H1>

    <H2>General</H2>

    <H3>Can I use any framework?</H3>
    <P>
      Yes! React, Vue, Svelte, Angular, vanilla JS - anything that produces a web page. Your app
      runs in an iframe, so ClawdOS doesn't care about your tech stack.
    </P>

    <H3>Is the SDK required?</H3>
    <P>
      No. The SDK is optional. Your app will work without it. However, you'll miss out on
      features like wallet access, window control, and context updates.
    </P>

    <H3>Can I access the user's wallet?</H3>
    <P>
      You can read the user's wallet address via <InlineCode>clawd.getContext()</InlineCode>.
      For actual transaction signing, you'll need to integrate with a wallet provider (like
      WalletConnect or injected providers) within your own app.
    </P>

    <H3>How do I handle authentication?</H3>
    <P>
      ClawdOS provides the user's wallet address as identity. You can use this for
      wallet-based auth (Sign-In with Ethereum, etc.) within your app.
    </P>

    <H2>Submission</H2>

    <H3>How long does review take?</H3>
    <P>
      Most apps are reviewed within 24-48 hours. Complex apps or those requiring additional
      scrutiny may take longer.
    </P>

    <H3>What if my manifest isn't detected?</H3>
    <P>
      This usually happens due to CORS restrictions. You can either configure your server to
      allow CORS for the manifest endpoint, or simply fill in the details manually in the
      submission form.
    </P>

    <H3>Can I update my app after publishing?</H3>
    <P>
      For URL-based apps, yes! Just deploy updates to your hosting provider. ClawdOS always
      loads the latest version. For code-based apps, you'd need to resubmit.
    </P>

    <H3>What happens to rejected apps?</H3>
    <P>
      You can fix the issues noted in the rejection and resubmit. Common rejection reasons
      include broken functionality, security concerns, or misleading descriptions.
    </P>

    <H2>Technical</H2>

    <H3>Why does my app show a blank screen?</H3>
    <P>
      Common causes: (1) Your app uses relative URLs that break in an iframe context. Use
      absolute URLs. (2) Your server blocks iframe embedding via X-Frame-Options or CSP headers.
      Remove these restrictions or allow ClawdOS's domain. (3) JavaScript errors - check browser
      console.
    </P>

    <H3>Can I use localStorage?</H3>
    <P>
      Yes, the iframe sandbox includes <InlineCode>allow-same-origin</InlineCode>, so localStorage
      works. However, remember that each user's data is local to their browser.
    </P>

    <H3>What about CORS?</H3>
    <P>
      Your app's API calls should work normally since they originate from your domain (within the
      iframe). The only CORS consideration is for the manifest file, which ClawdOS fetches from
      its own domain.
    </P>

    <H3>Is there a size limit for code-based apps?</H3>
    <P>
      Code-based submissions should ideally be under 1MB. For larger apps, use the URL-based
      approach instead.
    </P>
  </>
);

export default ClawdOSDocs;
