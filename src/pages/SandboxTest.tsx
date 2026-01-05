import { useState } from 'react';
import { Link } from 'react-router-dom';
import CodeSandbox from '@/components/sandbox/CodeSandbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Basic Express server example
const expressExample = {
  'package.json': JSON.stringify({
    name: 'webcontainer-test',
    type: 'module',
    scripts: {
      dev: 'node index.js'
    },
    dependencies: {
      express: 'latest'
    }
  }, null, 2),
  'index.js': `import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WebContainer Test</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem; }
        .badge {
          background: rgba(255,255,255,0.2);
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.9rem;
        }
        .emoji { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🚀</div>
        <h1>WebContainer Works!</h1>
        <p>Node.js is running in your browser</p>
        <span class="badge">Express Server on Port \${port}</span>
      </div>
    </body>
    </html>
  \`);
});

app.listen(port, () => {
  console.log(\`🚀 Server running at http://localhost:\${port}\`);
});
`
};

// Simple Node.js example (no dependencies)
const simpleExample = {
  'package.json': JSON.stringify({
    name: 'simple-test',
    type: 'module',
    scripts: {
      dev: 'node index.js'
    }
  }, null, 2),
  'index.js': `import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(\`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: system-ui;
          background: #1a1a2e;
          color: #e7e9ea;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        h1 { color: #667eea; }
      </style>
    </head>
    <body>
      <div>
        <h1>✅ Node.js HTTP Server</h1>
        <p>Running in WebContainer!</p>
        <p>Time: \${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  \`);
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
`
};

const SandboxTest = () => {
  const [selectedExample, setSelectedExample] = useState<'express' | 'simple'>('simple');
  const [previewReady, setPreviewReady] = useState(false);

  const examples = {
    express: expressExample,
    simple: simpleExample
  };

  // Check cross-origin isolation
  const isCrossOriginIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to IDE
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            <span className="font-semibold">WebContainer Test</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isCrossOriginIsolated ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-500">COOP/COEP Enabled</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-500">Headers Missing</span>
              </>
            )}
          </div>

          {/* Example selector */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectedExample === 'simple' ? 'default' : 'outline'}
              onClick={() => setSelectedExample('simple')}
            >
              Simple HTTP
            </Button>
            <Button
              size="sm"
              variant={selectedExample === 'express' ? 'default' : 'outline'}
              onClick={() => setSelectedExample('express')}
            >
              Express.js
            </Button>
          </div>
        </div>
      </header>

      {/* Info banner */}
      {!isCrossOriginIsolated && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-yellow-500">Cross-Origin Isolation not detected. </span>
            <span className="text-muted-foreground">
              Deploy to Vercel/Netlify with proper headers, or run locally with `npm run dev`.
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Code preview */}
        <div className="w-1/3 border-r border-border bg-card overflow-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {selectedExample === 'express' ? 'Express.js Server' : 'Node.js HTTP Server'}
            </h3>
            
            <div className="space-y-4">
              {Object.entries(examples[selectedExample]).map(([filename, content]) => (
                <div key={filename} className="rounded-lg bg-background border border-border overflow-hidden">
                  <div className="px-3 py-2 bg-muted/50 border-b border-border text-xs font-mono text-muted-foreground">
                    {filename}
                  </div>
                  <pre className="p-3 text-xs font-mono overflow-auto max-h-[300px]">
                    <code>{content}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sandbox */}
        <div className="flex-1">
          <CodeSandbox 
            files={examples[selectedExample]}
            entryCommand="npm run dev"
            onPreviewReady={() => setPreviewReady(true)}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="h-10 bg-card border-t border-border flex items-center justify-center px-4 shrink-0">
        <span className="text-xs text-muted-foreground">
          Powered by StackBlitz WebContainer API • Node.js running in your browser
        </span>
      </footer>
    </div>
  );
};

export default SandboxTest;
