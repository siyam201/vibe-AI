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

  // ৪MD এরর ফিক্স করার জন্য স্পেশাল ইন্টারসেপ্টর স্ক্রিপ্ট
  const processHtmlContent = (html: string) => {
    const routingFixScript = `
      <script>
        // লিঙ্ক ক্লিক করলে যাতে Lovable/Vercel-এর ৪MD পেজে না যায়
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            const href = link.getAttribute('href');
            
            // যদি লিঙ্কটি ইন্টারনাল হয় (যেমন: /register বা #)
            if (href && (href.startsWith('/') || href.startsWith('#'))) {
              e.preventDefault(); // ব্রাউজারের আসল নেভিগেশন বন্ধ করা হলো
              
              // এখানে আমরা শুধু ইউজারকে দেখাচ্ছি যে সে ক্লিক করেছে
              // সত্যিকারের পেজ চেঞ্জ করতে হলে ডাটাবেসে ওই পেজের কোড থাকতে হবে
              console.log('Intercepted navigation to:', href);
              
              // ডামি হিসেবে বডি কন্টেন্ট চেঞ্জ করে দেওয়া (যাতে ৪MD না আসে)
              if (href.includes('register')) {
                document.body.innerHTML = '<div style="padding:20px; text-align:center; font-family:sans-serif;"><h2>Registration Page</h2><p>This is a simulated register view.</p><a href="/">Back to Login</a></div>';
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
      {/* Header - ফিক্সড হাইট */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-border">
            <Lock className="w-3 h-3 text-green-500" />
            <span className="text-xs font-mono truncate max-w-[120px] sm:max-w-xs">
              vibe-ai.app/{appName}{currentPath}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className={`w-2 h-2 rounded-full ${previewCode ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        </div>
      </header>

      {/* Main Preview - কালো অংশ দূর করার জন্য absolute positioning */}
      <main className="flex-1 w-full bg-white relative overflow-hidden">
        <iframe
          key={iframeKey}
          srcDoc={loading ? "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;'>Loading...</body></html>" : processHtmlContent(previewCode || "")}
          className="absolute inset-0 w-full h-full border-0 m-0 p-0"
          title="Secure Preview"
          sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
          style={{ display: 'block', height: '100%', width: '100%' }}
        />
      </main>

      {/* Status Bar */}
      <footer className="h-6 bg-muted border-t border-border flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold tracking-tighter">
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>SANDBOX ACTIVE • NO EXTERNAL NAV</span>
        </div>
      </footer>
    </div>
  );
};

export default PreviewApp;
