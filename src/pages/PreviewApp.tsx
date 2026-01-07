import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, RefreshCw, Lock, ShieldCheck, Rocket, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileMap {
  [path: string]: string;
}

const PreviewApp = () => {
  const { appName } = useParams<{ appName: string }>();
  const location = useLocation();
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<FileMap>({});
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);

  const currentPath = location.pathname.includes(`/preview/apps/${appName}`) 
    ? location.pathname.split(`${appName}`)[1] || '/' 
    : '/';

  const loadPreview = async () => {
    if (!appName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_previews')
        .select('html_content, files')
        .eq('app_name', appName)
        .single();

      if (error) {
        console.error('Error loading preview:', error);
      } else if (data) {
        setPreviewCode(data.html_content);
        if (data.files && typeof data.files === 'object') {
          setProjectFiles(data.files as FileMap);
        } else {
          setProjectFiles({ 'index.html': data.html_content });
        }
        setIframeKey(prev => prev + 1);
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
    if (deployedUrl) {
      window.open(deployedUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeployToVercel = async () => {
    if (!appName) {
      toast.error('No app name specified');
      return;
    }

    setIsDeploying(true);
    try {
      // ১. ফাইলগুলো পাঠানোর আগে পাথ ক্লিন করা
      const filesToDeploy: FileMap = {};
      Object.entries(projectFiles).forEach(([path, content]) => {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        filesToDeploy[cleanPath] = content;
      });

      // ২. ইনডেক্স ফাইল চেক করা
      if (!filesToDeploy['index.html'] && previewCode) {
        filesToDeploy['index.html'] = previewCode;
      }

      // ৩. এজ ফাংশন কল করা
      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: {
          appName: appName,
          files: filesToDeploy,
        }
      });

      if (error) throw error;

      if (data?.success && data?.url) {
        setDeployedUrl(data.url);
        toast.success(`Deployed successfully!`, {
          description: data.url,
          action: {
            label: 'Open',
            onClick: () => window.open(data.url, '_blank')
          }
        });
      } else {
        throw new Error(data?.error || 'Deployment failed');
      }
    } catch (err: any) {
      console.error('Vercel deployment error:', err);
      toast.error('Deployment failed', {
        description: err.message || 'Please try again'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const processHtmlContent = (html: string) => {
    const routingFixScript = `
      <script>
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('/') || href.startsWith('#'))) {
              e.preventDefault();
              if (href.includes('register')) {
                document.body.innerHTML = '<h2>Redirecting to Register...</h2>';
              } else {
                window.location.reload();
              }
            }
          }
        }, true);
      </script>
    `;
    return html.includes('</body>') ? html.replace('</body>', routingFixScript + '</body>') : html + routingFixScript;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to IDE</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 bg-muted/80 px-3 py-1.5 rounded-full border border-border">
            <Lock className="w-3 h-3 text-green-500" />
            <span className="text-xs font-mono truncate max-w-[150px]">
              vibe-ai.app/{appName}<span className="text-primary font-bold">{currentPath}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleDeployToVercel} 
            disabled={isDeploying || !previewCode}
          >
            {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">{isDeploying ? 'Deploying...' : 'Deploy to Vercel'}</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full bg-white relative">
        <iframe
          key={iframeKey}
          srcDoc={loading ? "Loading..." : processHtmlContent(previewCode || "")}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      </main>
    </div>
  );
};

export default PreviewApp;
