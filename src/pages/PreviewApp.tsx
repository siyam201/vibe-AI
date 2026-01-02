import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PreviewApp = () => {
  const { appName } = useParams<{ appName: string }>();
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const loadPreview = async () => {
    if (!appName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_previews')
        .select('html_content')
        .eq('app_name', appName)
        .single();

      if (error) {
        console.error('Error loading preview:', error);
      } else if (data) {
        setPreviewCode(data.html_content);
        setIframeKey(prev => prev + 1); // Force iframe refresh
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [appName]);

  const handleOpenExternal = () => {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  // Inject scroll reset script into the HTML content
  const processHtmlContent = (html: string) => {
    const scrollResetScript = `
      <script>
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      </script>
    `;
    
    // Insert before closing body tag or at end
    if (html.includes('</body>')) {
      return html.replace('</body>', scrollResetScript + '</body>');
    }
    return html + scrollResetScript;
  };

  // Fallback content if no code is stored
  const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName || 'App'} Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e7e9ea;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .container { text-align: center; max-width: 90%; width: 400px; }
    h1 {
      font-size: clamp(1.25rem, 4vw, 2rem);
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p { color: #a0aec0; font-size: clamp(0.875rem, 2.5vw, 1rem); margin-bottom: 1.5rem; }
    .badge {
      display: inline-block;
      background: rgba(102, 126, 234, 0.2);
      color: #667eea;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: clamp(0.75rem, 2vw, 0.875rem);
      border: 1px solid rgba(102, 126, 234, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>No Preview Available</h1>
    <p>This preview hasn't been published yet. Open it from the IDE to see your live code.</p>
    <span class="badge">Open from IDE Preview Panel</span>
  </div>
</body>
</html>
  `;

  const loadingHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #667eea;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>Loading preview...</body>
</html>
  `;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 sm:h-14 bg-card border-b border-border flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to IDE</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Code className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[200px]">{appName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadPreview}
            disabled={loading}
            className="px-2 sm:px-3"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleOpenExternal}
            className="px-2 sm:px-3"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Open</span>
          </Button>
          <span className={`w-2 h-2 rounded-full shrink-0 ${loading ? 'bg-yellow-500' : previewCode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>
      </header>

      {/* Preview iframe - full screen responsive */}
      <div className="flex-1 bg-background overflow-hidden">
        <iframe
          key={iframeKey}
          srcDoc={loading ? loadingHtml : processHtmlContent(previewCode || fallbackHtml)}
          className="w-full h-full border-0"
          title={`${appName} Preview`}
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          style={{ display: 'block' }}
        />
      </div>

      {/* Footer - hidden on very small screens */}
      <footer className="h-6 sm:h-8 bg-card border-t border-border flex items-center justify-center px-2 shrink-0">
        <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
          {window.location.host}/preview/apps/{appName}
        </span>
      </footer>
    </div>
  );
};

export default PreviewApp;