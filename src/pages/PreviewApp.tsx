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
    
    if (html.includes('</body>')) {
      return html.replace('</body>', scrollResetScript + '</body>');
    }
    return html + scrollResetScript;
  };

  const fallbackHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f3f4f6; }
        .card { text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>No Preview Available</h2>
        <p>Please publish from the IDE.</p>
      </div>
    </body>
    </html>
  `;

  const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #ffffff; font-family: sans-serif; color: #666; }
      </style>
    </head>
    <body>Loading preview...</body>
    </html>
  `;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to IDE</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 min-w-0">
            <Code className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-sm truncate">{appName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadPreview}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleOpenExternal}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Open</span>
          </Button>
          <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : previewCode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>
      </header>

      {/* Main Preview Area - Fixed black screen issue */}
      <main className="flex-1 w-full bg-white relative">
        <iframe
          key={iframeKey}
          srcDoc={loading ? loadingHtml : processHtmlContent(previewCode || fallbackHtml)}
          className="absolute inset-0 w-full h-full border-0"
          title={`${appName} Preview`}
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
        />
      </main>

      {/* Footer */}
      <footer className="h-8 bg-card border-t border-border flex items-center justify-center px-4 shrink-0">
        <span className="text-xs text-muted-foreground truncate">
          {window.location.host}/preview/apps/{appName}
        </span>
      </footer>
    </div>
  );
};

export default PreviewApp;
