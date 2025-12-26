import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe,
  Lock,
  Play,
  Copy,
  Check,
  Rocket,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileMap {
  [path: string]: string;
}

interface PreviewPanelProps {
  html: string;
  css: string;
  js: string;
  files?: FileMap;
  projectName?: string;
  onConsoleLog?: (log: { type: 'log' | 'error' | 'warn' | 'info'; message: string }) => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const PreviewPanel = ({ html, css, js, files = {}, projectName = 'my-app', onConsoleLog }: PreviewPanelProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Generate URL-safe project name
  const generateSafeUrl = (name: string): string => {
    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return cleanName || `app-${Date.now().toString(36)}`;
  };

  const safeName = generateSafeUrl(projectName);
  const previewUrl = `preview.lovable.dev/${safeName}`;
  const fullUrl = `https://${previewUrl}`;

  // Resolve linked files from HTML
  const resolveLinkedFiles = useCallback((htmlContent: string): { resolvedCss: string; resolvedJs: string } => {
    let resolvedCss = css;
    let resolvedJs = js;

    const cssLinkRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi;
    let match;
    while ((match = cssLinkRegex.exec(htmlContent)) !== null) {
      const cssPath = match[1];
      const cssContent = files[cssPath] || files[`src/${cssPath}`] || files[cssPath.replace('./', '')];
      if (cssContent) {
        resolvedCss = cssContent;
      }
    }

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
    const { resolvedCss, resolvedJs } = resolveLinkedFiles(html);

    let bodyContent = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    }

    bodyContent = bodyContent
      .replace(/<script[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, '')
      .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '');

    let headContent = '';
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      headContent = headMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    }

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
      
      window.onerror = function(msg, url, line, col, error) {
        sendToParent('error', ['Uncaught Error: ' + msg + ' (line ' + line + ')']);
        return false;
      };
      
      window.onunhandledrejection = function(event) {
        sendToParent('error', ['Unhandled Promise Rejection: ' + event.reason]);
      };
    })();
    
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

  useEffect(() => {
    handleRefresh();
  }, []);

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

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setIsDeployed(true);
      toast.success(`Deployed to ${fullUrl}`);
    }, 2000);
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
      {/* Sandbox Preview Header with URL */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Sandbox Preview</span>
          {isDeployed && (
            <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded">LIVE</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeploy}
            disabled={isDeploying}
            className="h-6 text-xs gap-1"
          >
            {isDeploying ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Rocket className="w-3 h-3" />
            )}
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </Button>
        </div>
      </div>

      {/* Browser Chrome with URL Bar */}
      <div className="bg-background border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6"
            >
              <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
            </Button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-md px-3 py-1.5 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={handleCopyUrl}>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Lock className="w-3 h-3 text-success flex-shrink-0" />
              <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{previewUrl}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleCopyUrl(); }}
              className="h-5 w-5 p-0 flex-shrink-0"
            >
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>

          {/* Device Mode */}
          <div className="flex items-center gap-0.5 border-l border-border pl-2">
            <Button
              variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setDeviceMode('desktop')}
              className="h-6 w-6"
            >
              <Monitor className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setDeviceMode('tablet')}
              className="h-6 w-6"
            >
              <Tablet className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setDeviceMode('mobile')}
              className="h-6 w-6"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 border-l border-border pl-2">
            <Button
              size="icon"
              onClick={handleRefresh}
              className="h-6 w-6 bg-success text-white hover:bg-success/90"
            >
              <Play className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenExternal}
              className="h-6 w-6"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-[#1a1a2e] overflow-auto flex items-start justify-center p-4">
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
      <div className="h-6 bg-card border-t border-border flex items-center justify-between px-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-success" : "bg-muted")} />
            <span>Live Preview</span>
          </div>
          <span className="text-muted-foreground/50">|</span>
          <span>{deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)}</span>
        </div>
        {isDeployed && (
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {previewUrl}
          </a>
        )}
      </div>
    </div>
  );
};
