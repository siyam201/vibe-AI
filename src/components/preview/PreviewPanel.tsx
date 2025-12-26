import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Maximize2,
  Globe,
  Lock,
  X,
  Minus,
  Square,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileMap {
  [path: string]: string;
}

interface PreviewPanelProps {
  html: string;
  css: string;
  js: string;
  files?: FileMap; // All project files for resolving imports
  onConsoleLog?: (log: { type: 'log' | 'error' | 'warn' | 'info'; message: string }) => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const PreviewPanel = ({ html, css, js, files = {}, onConsoleLog }: PreviewPanelProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [url, setUrl] = useState('localhost:3000');

  // Resolve linked files from HTML (styles.css, main.js, etc.)
  const resolveLinkedFiles = useCallback((htmlContent: string): { resolvedCss: string; resolvedJs: string } => {
    let resolvedCss = css;
    let resolvedJs = js;

    // Find and resolve CSS links
    const cssLinkRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi;
    let match;
    while ((match = cssLinkRegex.exec(htmlContent)) !== null) {
      const cssPath = match[1];
      // Try to find the file in the files map
      const cssContent = files[cssPath] || files[`src/${cssPath}`] || files[cssPath.replace('./', '')];
      if (cssContent) {
        resolvedCss = cssContent;
      }
    }

    // Find and resolve JS scripts
    const jsScriptRegex = /<script[^>]+src=["']([^"']+\.js)["'][^>]*><\/script>/gi;
    while ((match = jsScriptRegex.exec(htmlContent)) !== null) {
      const jsPath = match[1];
      const jsContent = files[jsPath] || files[`src/${jsPath}`] || files[jsPath.replace('./', '')];
      if (jsContent) {
        resolvedJs = jsContent;
      }
    }

    return { resolvedCss, resolvedJs };
  }, [css, js, files]);

  const generateSandboxCode = useCallback(() => {
    // Resolve linked files
    const { resolvedCss, resolvedJs } = resolveLinkedFiles(html);

    // Extract body content from HTML if it has full document structure
    let bodyContent = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    }

    // Remove script and link tags since we'll inject them properly
    bodyContent = bodyContent
      .replace(/<script[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, '')
      .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '');

    // Extract head content for title/meta (excluding link/script tags)
    let headContent = '';
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      headContent = headMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    }

    // Escape any script closing tags in user code to prevent breaking
    const safeJs = resolvedJs.replace(/<\/script>/gi, '<\\/script>');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${headContent}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', system-ui, -apple-system, sans-serif; 
      background: #0f1419; 
      color: #e7e9ea; 
      min-height: 100vh;
    }
    ${resolvedCss}
  </style>
</head>
<body>
  ${bodyContent}
  
  <script>
    // Sandbox console capture
    (function() {
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      function sendToParent(type, args) {
        try {
          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); }
              catch { return String(arg); }
            }
            return String(arg);
          }).join(' ');
          
          window.parent.postMessage({
            type: 'sandbox-console',
            logType: type,
            message: message
          }, '*');
        } catch(e) {}
      }
      
      console.log = function(...args) {
        originalConsole.log.apply(console, args);
        sendToParent('log', args);
      };
      
      console.error = function(...args) {
        originalConsole.error.apply(console, args);
        sendToParent('error', args);
      };
      
      console.warn = function(...args) {
        originalConsole.warn.apply(console, args);
        sendToParent('warn', args);
      };
      
      console.info = function(...args) {
        originalConsole.info.apply(console, args);
        sendToParent('info', args);
      };
      
      // Capture unhandled errors
      window.onerror = function(msg, url, line, col, error) {
        sendToParent('error', ['Uncaught Error: ' + msg + ' (line ' + line + ')']);
        return false;
      };
      
      window.onunhandledrejection = function(event) {
        sendToParent('error', ['Unhandled Promise Rejection: ' + event.reason]);
      };
    })();
    
    // User code execution
    try {
      ${safeJs}
    } catch(e) {
      console.error('Runtime Error:', e.message);
    }
  </script>
</body>
</html>`;
  }, [html, css, js, resolveLinkedFiles]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateSandboxCode());
        doc.close();
      }
    }
    setTimeout(() => setIsRefreshing(false), 300);
  }, [generateSandboxCode]);

  // Listen for console messages from sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'sandbox-console' && onConsoleLog) {
        onConsoleLog({
          type: event.data.logType,
          message: event.data.message
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleLog]);

  // Initial render on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  // Auto-refresh when code changes (if live mode is on)
  useEffect(() => {
    if (isLive) {
      const timeout = setTimeout(handleRefresh, 500);
      return () => clearTimeout(timeout);
    }
  }, [html, css, js, isLive, handleRefresh]);

  const handleOpenExternal = () => {
    const blob = new Blob([generateSandboxCode()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen();
    }
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const deviceHeights = {
    desktop: '100%',
    tablet: '1024px',
    mobile: '667px',
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Sandbox Preview Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Sandbox Preview</span>
      </div>

      {/* Browser Chrome */}
      <div className="bg-secondary border-b border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-warning cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-success cursor-pointer" />
          </div>

          {/* URL Bar */}
          <div className="flex-1 flex items-center gap-2 bg-background rounded-md px-3 py-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-5 w-5 p-0"
            >
              <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3 text-success" />
              <Globe className="w-3 h-3" />
              <span>{url}</span>
            </div>
          </div>

          {/* Device Mode */}
          <div className="flex items-center gap-0.5">
            <Button
              variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setDeviceMode('desktop')}
              className="h-7 w-7"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setDeviceMode('tablet')}
              className="h-7 w-7"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setDeviceMode('mobile')}
              className="h-7 w-7"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              onClick={handleRefresh}
              className="h-7 w-7 bg-success text-white hover:bg-success/90"
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenExternal}
              className="h-7 w-7"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-background overflow-auto flex items-start justify-center p-4">
        <div
          className={cn(
            "bg-background rounded-lg overflow-hidden shadow-2xl transition-all duration-300",
            deviceMode !== 'desktop' && "border border-border"
          )}
          style={{
            width: deviceWidths[deviceMode],
            height: deviceMode === 'desktop' ? '100%' : deviceHeights[deviceMode],
            maxHeight: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0 bg-[#0f1419]"
            title="Sandbox Preview"
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
          />
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-7 bg-card border-t border-border flex items-center justify-between px-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", isLive ? "bg-success" : "bg-muted")} />
          <span>Live</span>
        </div>
        <span>{deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)} view</span>
      </div>
    </div>
  );
};
