import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Code, ExternalLink, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PreviewApp = () => {
  const { appName } = useParams<{ appName: string }>();
  const location = useLocation();
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // বর্তমান পাথ হ্যান্ডেল করা (যেমন: /, /auth, /login)
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
        .select('html_content')
        .eq('app_name', appName)
        .single();

      if (error) {
        console.error('Error loading preview:', error);
      } else if (data) {
        setPreviewCode(data.html_content);
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
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  // সিকিউরিটি এবং রাউটিং স্ক্রিপ্ট ইনজেকশন
  const processHtmlContent = (html: string) => {
    const secureScript = `
      <script>
        // অটোমেটিক স্ক্রল টপে রাখা
        window.scrollTo(0, 0);
        
        // ক্লিক ডিটেকশন (ভবিষ্যতে রাউটিং এর জন্য)
        document.addEventListener('click', e => {
          const link = e.target.closest('a');
          if (link && link.getAttribute('href').startsWith('/')) {
            console.log('Navigating to:', link.getAttribute('href'));
          }
        });
      </script>
    `;
    
    if (html.includes('</body>')) {
      return html.replace('</body>', secureScript + '</body>');
    }
    return html + secureScript;
  };

  const loadingHtml = `
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#fff;color:#6366f1;">
      <div style="text-align:center;">
        <div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 10px;"></div>
        <p>Loading Secure Environment...</p>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    </div>
  `;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* 1. SECURE HEADER */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link to="/">
            <Button variant="ghost" size="sm" className="h-9 px-2 hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back to IDE</span>
            </Button>
          </Link>
          
          <div className="h-6 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border max-w-[200px] sm:max-w-md">
            <Lock className="w-3 h-3 text-green-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-mono text-foreground truncate">
              vibe-ai.app/{appName}<span className="text-primary font-bold">{currentPath}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={loadPreview} disabled={loading} className="h-9 w-9">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenExternal} className="hidden md:flex h-9 border-primary/20 hover:bg-primary/5">
            <ExternalLink className="w-4 h-4 mr-2" />
            Launch
          </Button>
          <div className="ml-2 flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${previewCode ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
            <span className="text-[10px] font-bold text-muted-foreground hidden lg:inline">LIVE</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN PREVIEW AREA (The Fix) */}
      <main className="flex-1 w-full bg-[#f0f2f5] relative">
        <iframe
          key={iframeKey}
          srcDoc={loading ? loadingHtml : processHtmlContent(previewCode || "")}
          className="absolute inset-0 w-full h-full border-0"
          title="App Preview"
          /* স্যান্ডবক্সিং সিকিউরিটি */
          sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
          style={{ background: 'white' }}
        />
      </main>

      {/* 3. SECURITY STATUS FOOTER */}
      <footer className="h-8 bg-card border-t border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span>SECURE PREVIEW ACTIVE</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
           PATH_ORIGIN: {window.location.hostname}
        </div>
      </footer>
    </div>
  );
};

export default PreviewApp;
