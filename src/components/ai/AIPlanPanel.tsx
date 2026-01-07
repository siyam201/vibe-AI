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

// --- Interfaces ---
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
  steps?: unknown[]; // any বদলে unknown ব্যবহার করা নিরাপদ
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
    files: false,
    risks: false,
    future: false,
  });

  // --- Handlers ---
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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) throw new Error('খুব বেশি রিকোয়েস্ট পাঠাচ্ছেন। কিছুক্ষণ পর চেষ্টা করুন।');
        if (response.status === 402) throw new Error('ক্রেডিট শেষ হয়ে গেছে। দয়া করে ফান্ড অ্যাড করুন।');
        throw new Error(data.error || 'প্ল্যান তৈরি করতে সমস্যা হয়েছে।');
      }

      if (data.plan) {
        // নতুন ফিচার আসলে ডিফল্টভাবে approved false থাকবে
        const updatedPlan = { ...data.plan };
        if (updatedPlan.features) {
          updatedPlan.features = updatedPlan.features.map((f: Feature) => ({
            ...f,
            approved: f.priority === 'must' // 'must' ফিচারগুলো অটো-চেক থাকতে পারে চাইলে
          }));
        }
        setPlan(updatedPlan);
        setShowFeedback(false);
        setFeedback('');
        toast.success('প্ল্যান রেডি! একটু চেক করে দেখুন।');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeatureApproval = (featureId: number) => {
    if (!plan?.features) return;
    setPlan({
      ...plan,
      features: plan.features.map(f => 
        f.id === featureId ? { ...f, approved: !f.approved } : f
      )
    });
  };

  const removeFeature = (featureId: number) => {
    if (!plan?.features) return;
    setPlan({
      ...plan,
      features: plan.features.filter(f => f.id !== featureId)
    });
    toast.success('ফিচারটি বাদ দেওয়া হয়েছে।');
  };

  const moveToFuture = (featureId: number) => {
    if (!plan?.features) return;
    setPlan({
      ...plan,
      features: plan.features.map(f => 
        f.id === featureId ? { ...f, priority: 'future' as const, approved: false } : f
      )
    });
    toast.success('ভবিষ্যতের জন্য সেভ করা হলো।');
  };

  const handleExecute = () => {
    if (!plan) return;
    
    const approvedFeatures = plan.features?.filter(f => f.approved && f.priority !== 'future') || [];
    
    if (approvedFeatures.length === 0 && plan.features && plan.features.length > 0) {
      toast.error('কাজ শুরু করতে অন্তত একটি ফিচার সিলেক্ট করুন।');
      return;
    }

    onExecutePlan({ ...plan, features: approvedFeatures });
    toast.success('কাজ শুরু হচ্ছে...');
  };

  const approveAll = () => {
    if (!plan?.features) return;
    setPlan({
      ...plan,
      features: plan.features.map(f => 
        f.priority !== 'future' ? { ...f, approved: true } : f
      )
    });
  };

  // --- Helpers ---
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      simple: 'text-green-400 bg-green-500/20',
      medium: 'text-yellow-400 bg-yellow-500/20',
      complex: 'text-red-400 bg-red-500/20'
    };
    return colors[complexity as keyof typeof colors] || 'text-muted-foreground bg-muted';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      must: 'bg-red-500/20 text-red-400 border-red-500/30',
      should: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      could: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      future: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[priority as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <FolderPlus className="w-3.5 h-3.5 text-green-400" />;
      case 'edit': return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
      case 'delete': return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      default: return <Circle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">AI Architect</h2>
            <p className="text-[11px] text-slate-400">প্ল্যানিং থেকে প্রোডাকশন — সবই এক জায়গায়</p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      {!plan && (
        <div className="p-4 border-b border-white/5 bg-white/5">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-slate-300">নতুন প্রজেক্টের আইডিয়া লিখুন</span>
          </div>
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGeneratePlan('new'))}
              placeholder="যেমন: বগুড়ার দই বিক্রির জন্য একটা ই-কমার্স অ্যাপ চাই..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
              rows={3}
            />
            <Button
              variant="glow"
              size="icon"
              className="absolute right-2 bottom-2 rounded-lg"
              onClick={() => handleGeneratePlan('new')}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-sm font-medium">আইডিয়া প্রসেস হচ্ছে...</p>
              <p className="text-xs text-slate-500 mt-1">টেক-স্ট্যাক এবং রিস্ক অ্যানালাইসিস করছি</p>
            </div>
          )}

          {plan && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Plan Overview Card */}
              <div className="bg-slate-800/40 rounded-xl p-4 border border-white/10 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-100">{plan.title}</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => (setPlan(null), setInput(''))}>
                    <X className="w-4 h-4 text-slate-500 hover:text-red-400" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{plan.summary}</p>
                <div className="flex items-center gap-3">
                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getComplexityColor(plan.complexity))}>
                    {plan.complexity}
                  </span>
                  {plan.estimatedTime && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {plan.estimatedTime}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Insight Section */}
              {plan.aiRecommendation && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Insight</span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{plan.aiRecommendation}</p>
                  </div>
                </div>
              )}

              {/* Features Accordion */}
              {plan.features && (
                <Collapsible open={expandedSections.features} onOpenChange={() => toggleSection('features')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold">ফিচার লিস্ট ({plan.features.filter(f => f.approved).length}/{plan.features.length})</span>
                    </div>
                    {expandedSections.features ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    <div className="flex justify-end pr-1">
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 text-slate-400" onClick={approveAll}>
                        <ThumbsUp className="w-3 h-3 mr-1" /> Approve All
                      </Button>
                    </div>
                    {plan.features.map((feature) => (
                      <div key={feature.id} className={cn("rounded-xl p-3 border transition-all duration-300", feature.approved ? "bg-emerald-500/5 border-emerald-500/20 shadow-inner" : "bg-slate-900/30 border-white/5 opacity-80")}>
                        <div className="flex items-start gap-3">
                          <Checkbox checked={feature.approved} onCheckedChange={() => toggleFeatureApproval(feature.id)} className="mt-1 border-slate-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-bold text-slate-200">{feature.name}</span>
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border capitalize", getPriorityColor(feature.priority))}>
                                {feature.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-snug">{feature.description}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => moveToFuture(feature.id)} title="ভবিষ্যতের জন্য">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 hover:bg-red-500/10" onClick={() => removeFeature(feature.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Dynamic Sections (Tech, Risks, Files) - Similar UI Pattern */}
              {/* Tech Stack */}
              {plan.techStack && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tech Stack</span>
                 <div className="grid grid-cols-2 gap-3">
  {plan?.techStack && Object.entries(plan.techStack).map(([cat, items]) => (
    // নিশ্চিত হওয়া যে items একটি Array এবং তা খালি নয়
    Array.isArray(items) && items.length > 0 && (
      <div key={cat} className="space-y-1">
        <span className="text-[9px] text-slate-500 uppercase">{cat}</span>
        <div className="flex flex-wrap gap-1">
          {items.map(i => (
            <span 
              key={`${cat}-${i}`} // কী (key) আরও ইউনিক করা হলো
              className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300"
            >
              {i}
            </span>
          ))}
        </div>
      </div>
    )
  ))}
</div>
              )}

              {/* Execution Actions */}
              <div className="pt-4 space-y-2 sticky bottom-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e] to-transparent p-2">
                {!showFeedback ? (
                  <Button variant="outline" className="w-full h-10 border-white/10 hover:bg-white/5" onClick={() => setShowFeedback(true)}>
                    <Edit3 className="w-4 h-4 mr-2" /> কিছু পরিবর্তন করতে চান?
                  </Button>
                ) : (
                  <div className="bg-slate-800 rounded-xl p-3 border border-purple-500/30 animate-in zoom-in-95">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="যেমন: স্ট্যাক পাল্টে সুপাবেস ব্যবহার করো..."
                      className="w-full bg-slate-900/50 border-none text-xs p-2 rounded-lg mb-2 focus:ring-0"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => handleGeneratePlan('revise')} disabled={!feedback.trim() || isLoading}>
                        {isLoading ? <Loader2 className="animate-spin w-3 h-3" /> : <RefreshCw className="w-3 h-3 mr-1" />} রিভাইজ করুন
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowFeedback(false)}>বাতিল</Button>
                    </div>
                  </div>
                )}
                <Button className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20" onClick={handleExecute} disabled={isLoading}>
                  <Play className="w-4 h-4 mr-2 fill-current" /> কাজ শুরু করুন
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !plan && (
            <div className="py-20 flex flex-col items-center justify-center opacity-30 grayscale">
              <Zap className="w-16 h-16 mb-4" />
              <p className="text-sm">নতুন কিছু শুরু করা যাক?</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
