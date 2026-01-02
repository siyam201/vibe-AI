import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PreviewApp = () => {
  const { appName } = useParams<{ appName: string }>();
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      if (!appName) {
        setLoading(false);
        return;
      }

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
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [appName]);

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
      padding: 2rem;
    }
    .container { text-align: center; max-width: 600px; }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p { color: #a0aec0; font-size: 1rem; margin-bottom: 1.5rem; }
    .badge {
      display: inline-block;
      background: rgba(102, 126, 234, 0.2);
      color: #667eea;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      border: 1px solid rgba(102, 126, 234, 0.3);
    }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-size: 1.2rem;
      color: #667eea;
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to IDE
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{appName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {loading ? 'Loading...' : previewCode ? 'Live Preview' : 'Not Published'}
          </span>
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : previewCode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>
      </header>

      {/* Preview iframe */}
      <div className="flex-1 bg-background">
        <iframe
          srcDoc={loading ? loadingHtml : (previewCode || fallbackHtml)}
          className="w-full h-full border-0"
          title={`${appName} Preview`}
          sandbox="allow-scripts allow-modals allow-forms"
        />
      </div>

      {/* Footer */}
      <footer className="h-8 bg-card border-t border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">
          Preview URL: vibe-nove-ai.lovable.app/preview/apps/{appName}
        </span>
      </footer>
    </div>
  );
};

export default PreviewApp;