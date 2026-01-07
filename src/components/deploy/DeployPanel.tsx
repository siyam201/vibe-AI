import { useState } from 'react';
import { 
  Globe, Rocket, Link2, Copy, Check, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client'; // Supabase ইমপোর্ট নিশ্চিত করুন
import { toast } from 'sonner';

interface DeployPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectFiles: Record<string, string>; // প্রজেক্টের সব ফাইল এখানে থাকতে হবে
}

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

export const DeployPanel = ({ isOpen, onClose, projectName, projectFiles }: DeployPanelProps) => {
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [deployUrl, setDeployUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

 const handleDeployToVercel = async () => {
  if (!appName) return toast.error('App name missing');
  
  setIsDeploying(true);
  try {
    const filesToDeploy: FileMap = {};
    
    // Safety Check: projectFiles যদি null হয় তবে খালি অবজেক্ট নিবে
    const safeFiles = projectFiles || {}; 

    Object.entries(safeFiles).forEach(([path, content]) => {
      if (path && content) { // নিশ্চিত হওয়া যে পাথ ও কন্টেন্ট আছে
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        filesToDeploy[cleanPath] = content;
      }
    });

    // বাকি কোড...

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
    navigator.clipboard.writeText(deployUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Deploy to Vercel</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={status === 'deploying'}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ready to Go Live?</h3>
                <p className="text-sm text-muted-foreground">
                  Your project with {Object.keys(projectFiles).length} files will be deployed.
                </p>
              </div>
            </div>
          )}

          {status === 'deploying' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-12 h-12 mx-auto text-green-500 animate-spin" />
              <h3 className="text-lg font-semibold">Deploying Files...</h3>
              <p className="text-sm text-muted-foreground italic">
                আপনার ৪জিবি র‍্যামের পিসিতে প্রসেস হতে ১-২ মিনিট লাগতে পারে, দয়া করে অপেক্ষা করুন।
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold">Successfully Deployed!</h3>
              <div className="bg-secondary p-3 rounded-lg flex items-center gap-2">
                <code className="flex-1 text-xs truncate text-green-600 font-bold">{deployUrl}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <h3 className="text-lg font-semibold text-red-500">Error Occurred</h3>
              <p className="text-sm text-muted-foreground bg-red-50/10 p-2 rounded border border-red-500/20">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-secondary/30 border-t flex justify-end gap-2">
          {status !== 'deploying' && (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}
          {status === 'idle' && (
            <Button onClick={handleDeploy} className="bg-green-600 hover:bg-green-700">
              Confirm & Deploy
            </Button>
          )}
          {status === 'success' && (
            <Button onClick={() => window.open(deployUrl, '_blank')} className="gap-2">
              <ExternalLink className="w-4 h-4" /> Open App
            </Button>
          )}
          {status === 'error' && (
            <Button onClick={handleDeploy}>Try Again</Button>
          )}
        </div>
      </div>
    </div>
  );
};
