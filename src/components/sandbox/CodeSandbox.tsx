import { useState, useEffect, useCallback, useRef } from 'react';
import { FileSystemTree } from '@webcontainer/api';
import { useWebContainer } from '@/hooks/useWebContainer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Terminal, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Maximize2,
  Code,
  Rocket,
  CheckCircle
} from 'lucide-react';

interface CodeSandboxProps {
  files: Record<string, string>;
  entryCommand?: string;
  onPreviewReady?: (url: string) => void;
}

const CodeSandbox = ({ 
  files, 
  entryCommand = 'npm run dev',
  onPreviewReady 
}: CodeSandboxProps) => {
  const {
    isBooting,
    isReady,
    previewUrl,
    logs,
    error,
    boot,
    mountFiles,
    runCommand,
    writeFile,
    teardown,
    reset
  } = useWebContainer();

  const prevFilesRef = useRef<string>('');

  const [isRunning, setIsRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Convert files to FileSystemTree format
  const convertToFileSystemTree = useCallback((fileMap: Record<string, string>): FileSystemTree => {
    const tree: FileSystemTree = {};
    
    Object.entries(fileMap).forEach(([path, content]) => {
      const parts = path.split('/').filter(Boolean);
      let current: any = tree;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts[i];
        if (!current[dir]) {
          current[dir] = { directory: {} };
        }
        current = current[dir].directory;
      }
      
      const fileName = parts[parts.length - 1];
      current[fileName] = { file: { contents: content } };
    });
    
    return tree;
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Notify parent when preview is ready
  useEffect(() => {
    if (previewUrl && onPreviewReady) {
      onPreviewReady(previewUrl);
    }
  }, [previewUrl, onPreviewReady]);

  // Detect file changes and reset when needed
  useEffect(() => {
    const filesKey = JSON.stringify(files);
    if (prevFilesRef.current && prevFilesRef.current !== filesKey) {
      // Files changed - reset state for new run
      reset();
      setIsRunning(false);
    }
    prevFilesRef.current = filesKey;
  }, [files, reset]);

  const handleStart = async () => {
    setIsRunning(true);
    
    try {
      // Boot if not already
      if (!isReady) {
        await boot();
      }

      // Mount files
      const fileTree = convertToFileSystemTree(files);
      await mountFiles(fileTree);

      // Install dependencies
      const installCode = await runCommand('npm', ['install']);
      if (installCode !== 0) {
        throw new Error('npm install failed');
      }

      // Run dev server
      const [cmd, ...args] = entryCommand.split(' ');
      await runCommand(cmd, args);
      
    } catch (err) {
      console.error('Failed to start sandbox:', err);
    }
  };

  const handleStop = () => {
    teardown();
    setIsRunning(false);
  };

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // Check cross-origin isolation
  const isCrossOriginIsolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;

  // Static demo HTML for when WebContainer isn't available
  const staticDemoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
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
        .container { text-align: center; padding: 2rem; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 1.5rem; }
        .badge {
          background: rgba(255,255,255,0.2);
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.9rem;
          display: inline-block;
        }
        .emoji { font-size: 4rem; margin-bottom: 1rem; }
        .note { 
          margin-top: 2rem; 
          padding: 1rem; 
          background: rgba(0,0,0,0.2); 
          border-radius: 8px;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🚀</div>
        <h1>Static Demo Mode</h1>
        <p>WebContainer requires Cross-Origin Isolation</p>
        <span class="badge">Deploy to unlock full Node.js support</span>
        <div class="note">
          ✅ Vercel/Netlify with COOP/COEP headers<br/>
          ✅ Local dev: npm run dev
        </div>
      </div>
    </body>
    </html>
  `;

  if (!isCrossOriginIsolated) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Toolbar for static mode */}
        <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
          <Button size="sm" disabled className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Demo Mode
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-yellow-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Cross-Origin Isolation required
          </span>
        </div>

        {/* Split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Info panel */}
          <div className="w-1/2 p-6 flex flex-col items-center justify-center bg-card border-r border-border">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">WebContainer Ready</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Run full Node.js applications in your browser! Currently showing a static demo because COOP/COEP headers aren't available.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 text-left mb-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  To enable WebContainer:
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Deploy to <strong>Vercel</strong> (headers configured)</li>
                  <li>• Deploy to <strong>Netlify</strong> (headers configured)</li>
                  <li>• Run locally: <code className="bg-background px-1 rounded">npm run dev</code></li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Code className="w-4 h-4" />
                <span>Powered by StackBlitz WebContainer API</span>
              </div>
            </div>
          </div>

          {/* Static preview */}
          <div className="flex-1 bg-background">
            <iframe
              srcDoc={staticDemoHtml}
              className="w-full h-full border-0"
              title="Static Demo Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
        {!isRunning ? (
          <Button 
            size="sm" 
            onClick={handleStart}
            disabled={isBooting}
            className="gap-2"
          >
            {isBooting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isBooting ? 'Booting...' : 'Run'}
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleStop}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        )}

        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleRefresh}
          disabled={!previewUrl}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleOpenExternal}
          disabled={!previewUrl}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        <Button 
          size="sm" 
          variant={showLogs ? 'secondary' : 'ghost'}
          onClick={() => setShowLogs(!showLogs)}
          className="gap-2"
        >
          <Terminal className="w-4 h-4" />
          Logs
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            Error
          </div>
        )}

        {previewUrl && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {previewUrl}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview iframe */}
        <div className="flex-1 bg-background">
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Sandbox Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isRunning ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting server...
                </div>
              ) : (
                <span>Click "Run" to start the sandbox</span>
              )}
            </div>
          )}
        </div>

        {/* Logs panel */}
        {showLogs && (
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <div className="p-2 border-b border-border text-sm font-medium flex items-center justify-between">
              <span>Console</span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={() => setShowLogs(false)}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`whitespace-pre-wrap break-all ${
                      log.includes('Error') || log.includes('error') 
                        ? 'text-red-400' 
                        : log.includes('Warning') || log.includes('warn')
                        ? 'text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSandbox;
