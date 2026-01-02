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
  Maximize2
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
    teardown
  } = useWebContainer();

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

  if (!isCrossOriginIsolated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card rounded-lg border border-border">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">WebContainer Not Available</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          WebContainer requires Cross-Origin Isolation (COOP/COEP headers). 
          This feature works in deployed environments with proper headers configured.
        </p>
        <p className="text-xs text-muted-foreground">
          Alternative: Use the static HTML preview for now.
        </p>
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
