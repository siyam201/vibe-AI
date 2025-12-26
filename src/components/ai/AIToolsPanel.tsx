import { useState } from 'react';
import { 
  Code2, 
  Wrench, 
  Sparkles, 
  Lightbulb, 
  Copy, 
  Check,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode?: string;
  onExplain: (code: string) => void;
  onFix: (code: string, error: string) => void;
  isLoading?: boolean;
}

export const AIToolsPanel = ({ 
  isOpen, 
  onClose, 
  selectedCode = '', 
  onExplain, 
  onFix,
  isLoading 
}: AIToolsPanelProps) => {
  const [activeTab, setActiveTab] = useState<'explain' | 'fix' | 'improve'>('explain');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = () => {
    if (activeTab === 'explain') {
      onExplain(selectedCode);
    } else if (activeTab === 'fix') {
      onFix(selectedCode, errorMessage);
    }
    onClose();
  };

  const tabs = [
    { id: 'explain', label: 'Explain', icon: Lightbulb, description: 'Understand what this code does' },
    { id: 'fix', label: 'Fix', icon: Wrench, description: 'Fix errors in this code' },
    { id: 'improve', label: 'Improve', icon: Sparkles, description: 'Make this code better' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-warning flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AI Tools</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors",
                activeTab === tab.id 
                  ? "text-primary border-b-2 border-primary bg-primary/5" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>

          {/* Code Preview */}
          <div className="relative">
            <pre className="bg-secondary rounded-lg p-4 text-sm text-foreground overflow-auto max-h-[200px] font-mono">
              {selectedCode || 'No code selected. Select code in the editor first.'}
            </pre>
            {selectedCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="absolute top-2 right-2 h-8 w-8 p-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>

          {/* Error Input for Fix tab */}
          {activeTab === 'fix' && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Error message (optional)</label>
              <textarea
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="Paste the error message here..."
                className="w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-border bg-secondary/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAction}
            disabled={!selectedCode || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {activeTab === 'explain' && <Lightbulb className="w-4 h-4" />}
                {activeTab === 'fix' && <Wrench className="w-4 h-4" />}
                {activeTab === 'improve' && <Sparkles className="w-4 h-4" />}
                {tabs.find(t => t.id === activeTab)?.label} Code
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
