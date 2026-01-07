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

  const loadPreview = async () => {
    if (!appName) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_previews')
        .select('html_content, files')
        .eq('app_name', appName)
        .single();

      if (data) {
        setPreviewCode(data.html_content);
        setProjectFiles(data.files && typeof data.files === 'object' ? (data.files as FileMap) : { 'index.html': data.html_content });
        setIframeKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPreview(); }, [appName]);

  const handleDeployToVercel = async () => {
    if (!appName) return toast.error('App name missing');
    setIsDeploying(true);
    
    try {
      // ১. ফাইল পাথের শুরু থেকে '/' সরিয়ে ক্লিন করা (Vercel Fix)
      const cleanedFiles: FileMap = {};
      Object.entries(projectFiles).forEach(([path, content]) => {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        cleanedFiles[cleanPath] = content;
      });

      // ২. index.html নিশ্চিত করা
      if (!cleanedFiles['index.html'] && previewCode) {
        cleanedFiles['index.html'] = previewCode;
      }

      // ৩. এজ ফাংশন কল
      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: { appName, files: cleanedFiles }
      });

      if (error) throw error;

      if (data?.success) {
        setDeployedUrl(data.url);
        toast.success("ডেপ্লয়মেন্ট সফল হয়েছে!", { description: data.url });
      } else {
        throw new Error(data?.error || "Deployment failed");
      }
    } catch (err: any) {
      toast.error("ফাইল পাঠাতে সমস্যা হয়েছে", { description: err.message });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
          <div className="bg-muted px-3 py-1 rounded-full text-xs font-mono">
            vibe-ai.app/{appName}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          </Button>
          <Button onClick={handleDeployToVercel} disabled={isDeploying || !previewCode}>
            {isDeploying ? <Loader2 className="animate-spin mr-2" size={16} /> : <Rocket className="mr-2" size={16} />}
            {isDeploying ? 'Sending...' : 'Deploy to Vercel'}
          </Button>
        </div>
      </header>

      <main className="flex-1 relative bg-white">
        <iframe
          key={iframeKey}
          srcDoc={previewCode || ""}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      </main>
    </div>
  );
};

export default PreviewApp;
