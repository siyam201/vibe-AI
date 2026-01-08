import { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Circle,
  FileCode,
  FolderPlus,
  AlertTriangle,
  HelpCircle,
  Play,
  Clock,
  Target,
  X,
  Edit3,
  ThumbsUp,
  RefreshCw,
  Lightbulb,
  Shield,
  Zap,
  Calendar,
  Package,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Interfaces (Unchanged for compatibility)
interface Feature {
  id: number;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'future';
  effort: 'low' | 'medium' | 'high';
  approved: boolean;
}

interface UserFlowStep {
  step: number;
  action: string;
  result: string;
}

interface Risk {
  type: string;
  description: string;
  mitigation: string;
  severity: 'low' | 'medium' | 'high';
}

interface PlanFile {
  path: string;
  action: 'create' | 'edit' | 'delete';
  purpose: string;
}

interface ExecutionPlan {
  title: string;
  summary: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime?: string;
  estimatedSteps?: number;
  techStack?: {
    frontend: string[];
    backend: string[];
    database: string[];
    apis: string[];
  };
  features?: Feature[];
  userFlow?: UserFlowStep[];
  steps?: any[];
  files: PlanFile[];
  risks?: Risk[];
  futureConsiderations?: string[];
  dependencies: string[];
  warnings: string[];
  questions: string[];
  aiRecommendation?: string;
}

interface AIPlanPanelProps {
  onExecutePlan: (plan: ExecutionPlan) => void;
  currentFiles: string[];
}

const PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-plan`;

export const AIPlanPanel = ({ onExecutePlan, currentFiles }: AIPlanPanelProps) => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    techStack: true,
    userFlow: false,
    files: true, // Updated to true for better visibility
    risks: false,
    future: false,
  });

  // --- Helper Functions (With Fixes) ---
  
  const getComplexityColor = (complexity?: string) => {
    const val = (complexity || 'medium').toLowerCase();
    switch (val) {
      case 'simple': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'complex': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getActionIcon = (action?: string) => {
    const safeAction = (action || 'edit').toLowerCase();
    switch (safeAction) {
      case 'create': return <FolderPlus className="w-3.5 h-3.5 text-green-400" />;
      case 'edit': return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
      case 'delete': return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      default: return <Circle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    const p = (priority || 'should').toLowerCase();
    switch (p) {
      case 'must': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'should': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'could': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'future': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // --- Logic Handlers ---

  const handleGeneratePlan = async (mode: 'new' | 'revise' = 'new') => {
    const message = mode === 'revise' ? feedback : input;
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    if (mode === 'new') setPlan(null);

    try {
      const response = await fetch(PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          message: message.trim(),
          context: { files: currentFiles },
          mode
        }),
      });

      if (!response.ok) throw new Error('প্ল্যান জেনারেট করতে সমস্যা হয়েছে।');

      const data = await response.json();
      if (data.plan) {
        if (data.plan.features) {
          data.plan.features = data.plan.features.map((f: Feature) => ({
            ...f,
            approved: f.priority !== 'future' // Auto-approve non-future features
          }));
        }
        setPlan(data.plan);
        setShowFeedback(false);
        setFeedback('');
        toast.success('প্ল্যান তৈরি হয়েছে! রিভিউ করুন।');
      }
    } catch (error) {
      console.error('Plan error:', error);
      toast.error('সার্ভারে সমস্যা, আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = () => {
    if (!plan) return;
    const approvedFeatures = plan.features?.filter(f => f.approved) || [];
    if (approvedFeatures.length === 0 && plan.features?.length) {
      toast.error('কমপক্ষে একটি feature approve করুন');
      return;
    }
    onExecutePlan({ ...plan, features: approvedFeatures });
    toast.success('প্ল্যান এক্সিকিউট হচ্ছে...');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Target className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight">AI Architect</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">System Design & Execution</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      {!plan && (
        <div className="p-4 border-b border-white/5 bg-gradient-to-b from-transparent to-white/5">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার আইডিয়া এখানে লিখুন... (যেমন: একটা লগইন পেজ বানান)"
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-purple-500/50 transition-all min-h-[100px]"
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2 rounded-lg bg-purple-600 hover:bg-purple-500 shadow-lg"
              onClick={() => handleGeneratePlan('new')}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading && !plan && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 animate-pulse"></div>
               <Loader2 className="w-12 h-12 text-purple-500 animate-spin relative z-10" />
            </div>
            <p className="text-sm font-medium text-slate-300">আর্কিটেকচার ডিজাইন করছি...</p>
            <p className="text-xs text-slate-500 mt-1">আপনার রিকোয়েস্ট এনালাইজ করা হচ্ছে</p>
          </div>
        )}

        {plan && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Plan Summary Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon-sm" onClick={() => setPlan(null)}><X className="w-4 h-4" /></Button>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{plan.title}</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{plan.summary}</p>
              
              <div className="flex gap-2 flex-wrap">
                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", getComplexityColor(plan.complexity))}>
                  {plan.complexity}
                </span>
                {plan.estimatedTime && (
                  <span className="flex items-center gap-1.5 text-[10px] bg-white/5 px-2.5 py-1 rounded-full text-slate-300 border border-white/10">
                    <Clock className="w-3 h-3" /> {plan.estimatedTime}
                  </span>
                )}
              </div>
            </div>

            {/* Recommendation */}
            {plan.aiRecommendation && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex gap-3">
                <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-200 leading-relaxed italic">"{plan.aiRecommendation}"</p>
              </div>
            )}

            {/* Tech Stack Collapsible */}
            {plan.techStack && (
              <div className="space-y-2">
                <Collapsible open={expandedSections.techStack} onOpenChange={() => toggleSection('techStack')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Technology Stack</span>
                    </div>
                    {expandedSections.techStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 grid grid-cols-2 gap-2">
                    {Object.entries(plan.techStack).map(([category, items]) => items.length > 0 && (
                      <div key={category} className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[9px] uppercase text-slate-500 mb-1 font-bold">{category}</p>
                        <div className="flex flex-wrap gap-1">
                          {items.map((it, idx) => <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">{it}</span>)}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Files List - Fixed for toLowerCase() error */}
            {plan.files && plan.files.length > 0 && (
  <div className="mt-4 space-y-2">
    <div className="flex items-center justify-between mb-2 px-1">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
        Proposed Changes ({plan.files.length})
      </span>
    </div>
    
    <div className="space-y-1.5">
      {plan.files.map((file, i) => (
        <div 
          key={i} 
          className="group flex items-center gap-3 px-3 py-2 bg-slate-900/60 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all duration-200"
        >
          {/* Action Icon - Safe toLowerCase */}
          {getActionIcon(file?.action || 'edit')}
          
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono text-slate-300 truncate">
              {/* ফাইল নেম বা পাথ ডিসপ্লে */}
              {file?.path || 'unknown_file'}
            </p>
          </div>

          {/* Delete/Remove Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // আপনার স্টেট থেকে ফাইল ডিলিট করার লজিক
              // যদি setPlan বা অনুরুপ ফাংশন থাকে তবে নিচের মতো করুন:
              // const updatedFiles = plan.files.filter((_, index) => index !== i);
              // setPlan({ ...plan, files: updatedFiles });
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded text-red-400/70 hover:text-red-400 transition-all"
            title="Remove from plan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </div>
)}

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-[#0f0f1a] pt-4 pb-2 space-y-3">
              <Button 
                onClick={handleExecute} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 h-11 rounded-xl shadow-lg shadow-purple-500/20 font-bold tracking-tight"
              >
                <Play className="w-4 h-4 mr-2" /> Approve & Execute Plan
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs border-white/10 bg-white/5" onClick={() => setShowFeedback(!showFeedback)}>
                  <Edit3 className="w-3.5 h-3.5 mr-2" /> Revise Plan
                </Button>
                <Button variant="outline" className="text-xs border-white/10 bg-white/5" onClick={() => toast.info('বগুড়ার ভাষায় এআই সাহায্য করবে শীঘ্রই!')}>
                  <HelpCircle className="w-3.5 h-3.5" />
                </Button>
              </div>

              {showFeedback && (
                <div className="mt-4 p-3 bg-slate-900 border border-purple-500/30 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                   <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="কি পরিবর্তন করতে হবে বলুন..."
                    className="w-full bg-transparent border-none text-sm resize-none focus:ring-0"
                    rows={2}
                   />
                   <div className="flex justify-end gap-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={() => setShowFeedback(false)}>Cancel</Button>
                      <Button size="sm" className="bg-purple-600" onClick={() => handleGeneratePlan('revise')}>Update Plan</Button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !plan && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-slate-600" />
             </div>
             <p className="text-sm font-medium">আইডিয়া দিলে কাজ শুরু করবো</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
