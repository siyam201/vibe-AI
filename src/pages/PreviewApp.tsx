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
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<FileMap>({});
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);

  const loadPreview = async () => {
  if (!appName) return;
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('app_previews')
      .select('*') // সব কলাম সিলেক্ট করুন
      .eq('app_name', appName)
      .single();

    if (error) throw error;

    if (data) {
      setPreviewCode(data.html_content);
      
      // গুরুত্বপূর্ণ: ডাটাবেসে files কলামে যা আছে তা সরাসরি সেট করুন
      const loadedFiles = data.files || {}; 
      
      // যদি files খালি থাকে কিন্তু html_content থাকে, তবে অন্তত index.html তৈরি করুন
      if (Object.keys(loadedFiles).length === 0 && data.html_content) {
        setProjectFiles({ 'index.html': data.html_content });
      } else {
        setProjectFiles(loadedFiles);
      }
      
      setIframeKey(prev => prev + 1);
      console.log("Database থেকে প্রাপ্ত মোট ফাইল:", Object.keys(loadedFiles).length);
    }
  } catch (err) {
    console.error('Error loading preview:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadPreview();
  }, [appName]);

  const handleDeployToVercel = async () => {
  if (!appName) return toast.error('App name missing');
  
  setIsDeploying(true);
  try {
    // সিয়াম ভাই, আমরা নিশ্চিত করছি যে projectFiles খালি থাকলে যেন তা এরর না দেয়
    const allFiles = projectFiles && Object.keys(projectFiles).length > 0 
      ? projectFiles 
      : {};

    // যদি ডেটাবেসে ফাইলগুলো না থাকে, তবে বর্তমান previewCode কে index.html হিসেবে নিন
    if (Object.keys(allFiles).length === 0 && previewCode) {
       allFiles['index.html'] = previewCode;
    }

    console.log("Total files found for deployment:", Object.keys(allFiles).length);

    const { data, error } = await supabase.functions.invoke('vercel-deploy', {
      body: { 
        appName: appName, 
        files: allFiles // এখানে সব ফাইল যাচ্ছে
      }
    });

    if (error) throw error;
    if (data?.success) {
      setDeployedUrl(data.url);
      // এখানে ডাইনামিক মেসেজ দেখাবে কয়টি ফাইল গেল
      toast.success(`মোট ${Object.keys(allFiles).length} টি ফাইল সফলভাবে পাঠানো হয়েছে!`);
    }
  } catch (err: any) {
    toast.error("Error: " + err.message);
  } finally {
    setIsDeploying(false);
  }
};

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
          <div className="bg-muted px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono truncate max-w-[150px] sm:max-w-none">
            vibe-ai.app/{appName}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deployedUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(deployedUrl, '_blank')} className="hidden sm:flex border-green-200 text-green-700">
              <ExternalLink size={14} className="mr-1" /> View Live
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </Button>
          <Button onClick={handleDeployToVercel} disabled={isDeploying || !previewCode} className="bg-orange-600 hover:bg-orange-700 text-white">
            {isDeploying ? <Loader2 className="animate-spin mr-2" size={16} /> : <Rocket className="mr-2" size={16} />}
            {isDeploying ? 'Sending...' : 'Deploy to Vercel'}
          </Button>
        </div>
      </header>

      <main className="flex-1 relative bg-[#f8fafc]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : (
          <iframe
            key={iframeKey}
            srcDoc={previewCode || ""}
            className="absolute inset-0 w-full h-full border-0 shadow-inner"
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
        )}
      </main>
    </div>
  );
};

export default PreviewApp;
