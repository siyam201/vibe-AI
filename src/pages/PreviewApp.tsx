import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Code, ExternalLink, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PreviewApp = () => {
  const { appName } = useParams<{ appName: string }>();
  const location = useLocation();
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

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

  // ৪০৪ এরর ফিক্স করার জন্য প্রসেসর
  const processHtmlContent = (html: string) => {
    const fixClickScript = `
      <script>
        // বাটনে ক্লিক করলে পেজ যাতে রিফ্রেশ বা পরিবর্তন না হয়ে যায়
        document.addEventListener('click', function(e) {
          const target = e.target.closest('a');
          if (target) {
            const href = target.getAttribute('href');
            // যদি লিঙ্কে # থাকে বা লোকাল রাউট হয়, তবে ব্রাউজার রিফ্রেশ আটকানো
            if (href && (href.startsWith('/') || href.startsWith('#'))) {
              e.preventDefault();
              console.log('Navigating to:', href);
              // এখানে আপনার অ্যাপের লজিক অনুযায়ী পেজ সুইচ হবে
              // যেহেতু এটি একটি সিঙ্গেল HTML প্রিভিউ, তাই আমরা শুধু অ্যালার্ট বা কনসোল দিচ্ছি
              alert('Navigation to ' + href + ' is simulated. In a full app, this would load the ' + href + ' component.');
            }
          }
        }, true);
      </script>
    `;
    
    if (html.includes('</body>')) {
      return html.replace('</body>', fixClickScript + '</body>');
    }
    return html + fixClickScript;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full border">
            <Lock className="w-3 h-3 text-green-500" />
            <span className="text-xs font-mono truncate max-w-[150px]">
              vibe-ai.app/{appName}{currentPath}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenExternal} className="hidden sm:flex">
            <ExternalLink className="w-4 h-4 mr-2" />
            Launch
          </Button>
          <div className={`w-2.5 h-2.5 rounded-full ${previewCode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>
      </header>

      {/* Preview Area */}
      <main className="flex-1 w-full bg-[#f8f9fa] relative">
        <iframe
          key={iframeKey}
          srcDoc={loading ? "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;'>Loading...</body></html>" : processHtmlContent(previewCode || "")}
          className="absolute inset-0 w-full h-full border-0"
          title="Secure Preview"
          /* 'allow-top-navigation' সরিয়ে দেওয়া হয়েছে যাতে ৪০৪ এরর না আসে */
          sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
        />
      </main>

      {/* Footer */}
      <footer className="h-7 bg-muted border-t border-border flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>Secure Environment</span>
        </div>
      </footer>
    </div>
  );
};

export default PreviewApp;
