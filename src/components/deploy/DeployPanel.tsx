import { useState } from 'react';
import { 
  Globe, Rocket, Link2, Copy, Check, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, X, RefreshCw
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

  // ফাইলগুলোকে ফ্ল্যাট অবজেক্টে রূপান্তর (Recursive)
  const flattenFiles = (items: any[], path = ''): Record<string, string> => {
    let flatFiles: Record<string, string> = {};
    if (!Array.isArray(items)) return flatFiles;

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

  const handleDeploy = async () => {
    if (!projectName) return toast.error('Project name missing');
    
    setStatus('deploying');
    setErrorMessage('');
    
    try {
      let filesToDeploy: Record<string, string> = {};

      if (Array.isArray(projectFiles)) {
        filesToDeploy = flattenFiles(projectFiles);
      } else if (projectFiles && typeof projectFiles === 'object') {
        filesToDeploy = projectFiles as Record<string, string>;
      }

      const fileCount = Object.keys(filesToDeploy).length;
      if (fileCount === 0) {
        throw new Error("আপনার প্রজেক্টে কোনো ফাইল পাওয়া যায়নি।");
      }

      const { data, error } = await supabase.functions.invoke('vercel-deploy', {
        body: { appName: projectName, files: filesToDeploy }
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
      setErrorMessage(err.message || 'Unknown error occurred');
      setStatus('error');
      toast.error("Deployment Failed");
    }
  };

  // Redeploy ফাংশন: এটি স্টেট রিসেট করে আবার ডিপ্লয় শুরু করবে
  const handleRedeploy = () => {
    setStatus('idle');
    setDeployUrl('');
    // আপনি চাইলে সরাসরি handleDeploy() কল করতে পারেন অথবা ইউজারকে আবার "Confirm" করার সুযোগ দিতে পারেন।
    // এখানে আমি ইউজারকে আবার চেক করার সুযোগ দিচ্ছি।
  };

  const handleCopy = () => {
    if (!deployUrl) return;
    navigator.clipboard.writeText(deployUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <span className="font-semibold text-white">Vercel Deployment</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={status === 'deploying'} className="text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <Globe className="w-16 h-16 mx-auto text-orange-500/20" />
              <div>
                <h3 className="text-lg font-semibold text-white">Ready to Deploy?</h3>
                <p className="text-sm text-slate-400">
                  প্রজেক্ট: <span className="text-orange-400">{projectName}</span> ({displayFileCount} ফাইল)
                </p>
              </div>
            </div>
          )}

          {status === 'deploying' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-12 h-12 mx-auto text-orange-500 animate-spin" />
              <h3 className="text-lg font-semibold text-white">Redeploying...</h3>
              <p className="text-xs text-slate-400">বগুড়া সার্ভার ভিউ আপডেট হচ্ছে...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold text-white">Update Live!</h3>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex items-center gap-2">
                <code className="flex-1 text-xs truncate text-orange-400 font-bold">{deployUrl}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-2">
          {status === 'success' ? (
            <>
              <Button variant="outline" onClick={handleRedeploy} className="gap-2 border-slate-600 text-slate-300">
                <RefreshCw className="w-4 h-4" /> Redeploy
              </Button>
              <Button onClick={() => window.open(deployUrl, '_blank')} className="bg-orange-600">
                Open App
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={status === 'deploying'}>Cancel</Button>
              <Button onClick={handleDeploy} disabled={status === 'deploying'} className="bg-orange-600 min-w-[120px]">
                {status === 'deploying' ? 'Deploying...' : 'Confirm & Deploy'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
