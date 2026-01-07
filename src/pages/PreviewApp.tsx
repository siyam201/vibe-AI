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
        // Load files if available
        if (data.files && typeof data.files === 'object') {
          setProjectFiles(data.files as FileMap);
        } else {
          // Create files from html_content
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

    const hasFiles = Object.keys(projectFiles).length > 0;
    const hasHtml = !!previewCode;

    if (!hasFiles && !hasHtml) {
      toast.error('No content to deploy');
      return;
    }

    setIsDeploying(true);
    try {
      // ১. ফাইলগুলো পাঠানোর আগে সঠিকভাবে ম্যাপ করে নেওয়া (Path Fix)
      const filesToDeploy: FileMap = {};
      
      Object.entries(projectFiles).forEach(([path, content]) => {
        // পাথের শুরুতে স্লাশ থাকলে তা বাদ দেওয়া (Vercel requirements)
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        filesToDeploy[cleanPath] = content;
      });

      // ২. যদি index.html না থাকে তবে previewCode থেকে নিয়ে ফাইল হিসেবে অ্যাড করা
      if (!filesToDeploy['index.html'] && previewCode) {
        filesToDeploy['index.html'] = previewCode;
      }

      // ৩. Supabase Function Invoke (এখানেই ফাইল পাঠানো হচ্ছে)
      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: {
          appName: appName,
          files: filesToDeploy, // সঠিক অবজেক্ট ফরম্যাট
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

   

      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: {
          appName: appName,
          files: filesToDeploy,
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.url) {
        setDeployedUrl(data.url);
        toast.success(`Deployed ${data.filesCount || 1} files to Vercel!`, {
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

  // এই ফাংশনটি ৪MD এরর চিরতরে বন্ধ করবে
  const processHtmlContent = (html: string) => {
    const routingFixScript = `
      <script>
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            const href = link.getAttribute('href');
            
            // যদি লিঙ্কটি ইন্টারনাল হয় (যেমন: /register বা #)
            if (href && (href.startsWith('/') || href.startsWith('#'))) {
              e.preventDefault(); // ব্রাউজারকে ৪০৪ পেজে যেতে বাধা দেওয়া হলো
              
              console.log('Intercepted path:', href);
              
              // কন্টেন্ট বদলানোর ডামি লজিক (যাতে স্ক্রিন কালো না হয়)
              if (href.includes('register')) {
                const formCard = document.querySelector('.bg-white') || document.body;
                formCard.innerHTML = \`
                  <div style="text-align:center; font-family:sans-serif; padding:20px;">
                    <h2 style="margin-bottom:20px; color:#1f2937;">Create Account</h2>
                    <input type="text" placeholder="Full Name" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
                    <input type="email" placeholder="Email Address" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
                    <input type="password" placeholder="Password" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:4px;">
                    <button style="width:100%; padding:12px; background:#3b82f6; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Sign Up</button>
                    <p style="margin-top:15px; font-size:14px; color:#6b7280;">Already have an account? <a href="/" style="color:#3b82f6; text-decoration:none;">Login here</a></p>
                  </div>
                \`;
              } else if (href === '/' || href === '#') {
                // পেজ রিফ্রেশ করে আবার আগের জায়গায় নিয়ে আসবে
                window.location.reload();
              }
            }
          }
        }, true);
      </script>
    `;
    
    if (html.includes('</body>')) {
      return html.replace('</body>', routingFixScript + '</body>');
    }
    return html + routingFixScript;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      {/* Header */}
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
            <span className="text-xs font-mono truncate max-w-[150px] sm:max-w-xs">
              vibe-ai.app/{appName}<span className="text-primary font-bold">{currentPath}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={loadPreview} disabled={loading} className="h-9 w-9">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* Deploy to Vercel Button */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleDeployToVercel} 
            disabled={isDeploying || !previewCode}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Deploying...</span>
              </>
            ) : deployedUrl ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Deployed</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Deploy to Vercel</span>
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleOpenExternal} className="hidden sm:flex border-primary/20">
            <ExternalLink className="w-4 h-4 mr-2" />
            {deployedUrl ? 'Open Live' : 'Launch'}
          </Button>
          <div className={`w-2.5 h-2.5 rounded-full ${deployedUrl ? 'bg-blue-500' : previewCode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>
      </header>

      {/* Main Preview - কালো স্ক্রিন দূর করার সমাধান */}
      <main className="flex-1 w-full bg-white relative">
        <iframe
          key={iframeKey}
          srcDoc={loading ? "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;color:#6366f1;'>Loading Secure Environment...</body></html>" : processHtmlContent(previewCode || "")}
          className="absolute inset-0 w-full h-full border-0 m-0 p-0"
          title="Secure App Preview"
          sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
          style={{ display: 'block', background: 'white' }}
        />
      </main>

      {/* Status Footer */}
      <footer className="h-7 bg-muted/50 border-t border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold tracking-tight">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>SECURE PREVIEW ACTIVE • REDIRECTS BLOCKED</span>
        </div>
        {deployedUrl && (
          <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold">
            <Rocket className="w-3 h-3" />
            <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
              {deployedUrl.replace('https://', '')}
            </a>
          </div>
        )}
      </footer>
    </div>
  );
};

export default PreviewApp;
