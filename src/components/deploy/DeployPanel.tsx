import { useState } from 'react';
import { 
  Globe, Rocket, Link2, Copy, Check, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeployPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectFiles: any[] | Record<string, string> | null | undefined;
}

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

export const DeployPanel = ({ isOpen, onClose, projectName, projectFiles }: DeployPanelProps) => {
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [deployUrl, setDeployUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // ফাইলগুলোকে ফ্ল্যাট অবজেক্টে রূপান্তর করার ফাংশন (Recursive)
  const flattenFiles = (items: any[], path = ''): Record<string, string> => {
    let flatFiles: Record<string, string> = {};

    items.forEach(item => {
      const currentPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.type === 'file' && item.content !== undefined) {
        flatFiles[currentPath] = item.content;
      } else if (item.type === 'folder' && item.children) {
        // ফোল্ডারের ভেতর আবার চেক করবে
        Object.assign(flatFiles, flattenFiles(item.children, currentPath));
      }
    });

    return flatFiles;
  };

  const handleDeploy = async () => {
    if (!projectName) return toast.error('Project name missing');
    
    setStatus('deploying');
    setErrorMessage('');
    
    try {
      let filesToDeploy: Record<string, string> = {};

      // ডাটা টাইপ চেক করে প্রসেসিং
      if (Array.isArray(projectFiles)) {
        filesToDeploy = flattenFiles(projectFiles);
      } else if (projectFiles && typeof projectFiles === 'object') {
        filesToDeploy = projectFiles as Record<string, string>;
      }

      const fileCount = Object.keys(filesToDeploy).length;
      console.log("Files being deployed:", filesToDeploy);

      if (fileCount === 0) {
        throw new Error("আপনার প্রজেক্টে কোনো ফাইল পাওয়া যায়নি। দয়া করে কোড লিখে সেভ করুন।");
      }

      // সুপাবেজ এজ ফাংশন ইনভোক
      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: { 
          appName: projectName, 
          files: filesToDeploy 
        }
      });

      if (error) throw error;

      if (data?.success && data?.url) {
        setDeployUrl(data.url);
        setStatus('success');
        toast.success("Deployment Successful!");
      } else {
        throw new Error(data?.error || 'Deployment failed');
      }
    } catch (err: any) {
      console.error('Deployment error:', err);
      setErrorMessage(err.message || 'Unknown error occurred');
      setStatus('error');
      toast.error("Deployment Failed");
    }
  };

  const handleCopy = () => {
    if (!deployUrl) return;
    navigator.clipboard.writeText(deployUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // UI-তে দেখানোর জন্য ফাইল সংখ্যা বের করা
  const displayFileCount = Array.isArray(projectFiles) 
    ? Object.keys(flattenFiles(projectFiles)).length 
    : Object.keys(projectFiles ?? {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Deploy to Vercel</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={status === 'deploying'} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Ready to Go Live?</h3>
                <p className="text-sm text-slate-400">
                  Your project "{projectName}" with <span className="text-orange-400 font-bold">{displayFileCount}</span> files is ready.
                </p>
              </div>
            </div>
          )}

          {status === 'deploying' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-12 h-12 mx-auto text-orange-500 animate-spin" />
              <h3 className="text-lg font-semibold text-white">Deploying to Cloud...</h3>
              <p className="text-xs text-slate-400 px-4">
                বগুড়া সার্ভার ভিউ ২.১ প্রসেসিং হচ্ছে। দয়া করে কিছুক্ষণ অপেক্ষা করুন।
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold text-white">Deployment Live!</h3>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center gap-2">
                <code className="flex-1 text-xs truncate text-orange-400 font-bold">{deployUrl}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="hover:bg-slate-800">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <h3 className="text-lg font-semibold text-red-500">Deployment Error</h3>
              <p className="text-sm text-slate-400 bg-red-500/10 p-3 rounded border border-red-500/20">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-2">
          {status !== 'deploying' && (
            <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">Close</Button>
          )}
          {status === 'idle' && (
            <Button onClick={handleDeploy} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20">
              Confirm & Deploy
            </Button>
          )}
          {status === 'success' && (
            <Button onClick={() => window.open(deployUrl, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
              <ExternalLink className="w-4 h-4" /> Open Live App
            </Button>
          )}
          {status === 'error' && (
            <Button onClick={handleDeploy} className="bg-slate-700 hover:bg-slate-600">Try Again</Button>
          )}
        </div>
      </div>
    </div>
  );
};
