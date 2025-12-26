import { useState } from 'react';
import { 
  Globe, 
  Rocket, 
  Link2, 
  Copy, 
  Check, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeployPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

export const DeployPanel = ({ isOpen, onClose, projectName }: DeployPanelProps) => {
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [deployUrl, setDeployUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate a clean URL-safe name
  const generateSafeUrl = (name: string): string => {
    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
    
    // Fallback to a generated name if empty
    if (!cleanName) {
      return `app-${Date.now().toString(36)}`;
    }
    return cleanName;
  };

  const handleDeploy = async () => {
    setStatus('deploying');
    
    // Simulate deployment
    setTimeout(() => {
      setStatus('success');
      const safeName = generateSafeUrl(projectName);
      setDeployUrl(`https://${safeName}.vibecode.app`);
    }, 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(deployUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Deploy to Web</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <Globe className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Deploy</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy your project to the web and get a shareable URL instantly.
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-left">
                <p className="text-xs text-muted-foreground mb-2">Project</p>
                <p className="text-sm font-medium text-foreground">{projectName}</p>
              </div>
            </div>
          )}

          {status === 'deploying' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Deploying...</h3>
                <p className="text-sm text-muted-foreground">
                  Building and deploying your app to the cloud.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Building application</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span>Deploying to servers</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Deployed Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your app is now live on the web.
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Your app URL</p>
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <code className="flex-1 text-sm text-primary truncate">{deployUrl}</code>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Deployment Failed</h3>
                <p className="text-sm text-muted-foreground">
                  Something went wrong. Please try again.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-border bg-secondary/30">
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleDeploy} className="gap-2 bg-green-500 hover:bg-green-600 text-white">
                <Rocket className="w-4 h-4" />
                Deploy Now
              </Button>
            </>
          )}
          {status === 'success' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={() => window.open(deployUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open App
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDeploy}>
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
