import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PreviewApp = () => {
  const { appName } = useParams<{ appName: string }>();

  // Sample preview content - in a real app, this would load from database
  const sampleHtml = `
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
    .container {
      text-align: center;
      max-width: 600px;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      color: #a0aec0;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    .badge {
      display: inline-block;
      background: rgba(102, 126, 234, 0.2);
      color: #667eea;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      border: 1px solid rgba(102, 126, 234, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${appName || 'My App'}</h1>
    <p>This is a live preview of your application. Edit your code in the IDE to see changes here.</p>
    <span class="badge">✨ Powered by Vibe Code</span>
  </div>
</body>
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
          <span className="text-xs text-muted-foreground">Live Preview</span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </header>

      {/* Preview iframe */}
      <div className="flex-1 bg-[#1a1a2e]">
        <iframe
          srcDoc={sampleHtml}
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
