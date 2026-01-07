import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, RefreshCw, Rocket, Loader2 } from 'lucide-react';
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

  // ফাইলগুলোকে ফ্ল্যাট করার ফাংশন (নেস্টেড ফোল্ডার সাপোর্ট করার জন্য)
  const flattenFiles = (items: any[], path = ''): Record<string, string> => {
    let flatFiles: Record<string, string> = {};
    if (!Array.isArray(items)) return items; // যদি আগে থেকেই অবজেক্ট থাকে

    items.forEach(item => {
      const currentPath = path ? `${path}/${item.name}` : item.name;
      if (item.type === 'file' && item.content !== undefined) {
        flatFiles[currentPath] = item.content;
      } else if (item.type === 'folder' && item.children) {
        Object.assign(flatFiles, flattenFiles(item.children, currentPath));
      }
    });
    return flatFiles;
  };

  const loadPreview = async () => {
    if (!appName) return;
    setLoading(true);
    try {
      // আমরা 'app_previews' থেকে ডাটা নিচ্ছি
      const { data, error } = await supabase
        .from('app_previews')
        .select('*')
        .eq('app_name', appName)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreviewCode(data.html_content);
        
        // ফাইল কনভার্ট করা হচ্ছে
        let loadedFiles = {};
        if (data.files) {
          loadedFiles = Array.isArray(data.files) 
            ? flattenFiles(data.files) 
            : data.files;
        }

        // যদি files কলাম খালি থাকে কিন্তু html_content থাকে
        if (Object.keys(loadedFiles).length === 0 && data.html_content) {
          loadedFiles = { 'index.html': data.html_content };
        }
        
        setProjectFiles(loadedFiles);
        setIframeKey(prev => prev + 1);
        console.log("Database থেকে প্রাপ্ত মোট ফাইল:", Object.keys(loadedFiles).length);
      }
    } catch (err: any) {
      console.error('Error loading preview:', err);
      toast.error("প্রিভিউ লোড করতে সমস্যা: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [appName]);

  const handleDeployToVercel = async () => {
    if (!appName) return toast.error('App name missing');
    if (Object.keys(projectFiles).length === 0) {
      return toast.error('ডিপ্লয় করার মতো কোনো ফাইল পাওয়া যায়নি!');
    }
    
    setIsDeploying(true);
    try {
      // Vercel Edge Function কল করা
      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: { 
          appName: appName, 
          files: projectFiles 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setDeployedUrl(data.url);
        toast.success(`ডেপ্লয়মেন্ট সফল! ${Object.keys(projectFiles).length} টি ফাইল পাঠানো হয়েছে।`);
        window.open(data.url, '_blank');
      } else {
        throw new Error(data?.error || 'ডিপ্লয়মেন্ট ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      toast.error("Deployment Error: " + err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
          <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-mono text-slate-600 truncate max-w-[200px]">
            vibe-ai.app/{appName}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deployedUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(deployedUrl, '_blank')} className="border-green-200 text-green-700 hover:bg-green-50">
              <ExternalLink size={14} className="mr-1" /> View Live
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={loadPreview} disabled={loading} className="h-9 w-9">
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </Button>
          <Button onClick={handleDeployToVercel} disabled={isDeploying || !previewCode} className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
            {isDeploying ? <Loader2 className="animate-spin mr-2" size={16} /> : <Rocket className="mr-2" size={16} />}
            {isDeploying ? 'Deploying...' : 'Deploy to Vercel'}
          </Button>
        </div>
      </header>

      <main className="flex-1 relative bg-[#f8fafc]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-orange-500" size={32} />
              <p className="text-sm text-slate-500 font-medium">Loading your awesome app...</p>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            srcDoc={previewCode || ""}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-forms allow-same-origin"
            title="App Preview"
          />
        )}
      </main>
    </div>
  );
};

export default PreviewApp;
