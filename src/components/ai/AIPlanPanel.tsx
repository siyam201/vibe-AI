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
  ThumbsDown,
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
    files: false,
    risks: false,
    future: false,
  });

  const handleGeneratePlan = async (mode: 'new' | 'revise' = 'new') => {
    const message = mode === 'revise' ? feedback : input;
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    if (mode === 'new') {
      setPlan(null);
    }

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

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again later.');
          return;
        }
        if (response.status === 402) {
          toast.error('Credits exhausted. Please add funds.');
          return;
        }
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      
      if (data.plan) {
        // Initialize features as not approved
        if (data.plan.features) {
          data.plan.features = data.plan.features.map((f: Feature) => ({
            ...f,
            approved: false
          }));
        }
        setPlan(data.plan);
        setShowFeedback(false);
        setFeedback('');
        toast.success('প্ল্যান তৈরি হয়েছে! Review করুন।');
      } else {
        throw new Error(data.error || 'No plan generated');
      }
    } catch (error) {
      console.error('Plan error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate plan');
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
    toast.success('Feature removed');
  };

  const moveToFuture = (featureId: number) => {
    if (!plan?.features) return;
    setPlan({
      ...plan,
      features: plan.features.map(f => 
        f.id === featureId ? { ...f, priority: 'future' as const, approved: false } : f
      )
    });
    toast.success('Feature moved to future');
  };

  const handleExecute = () => {
    if (!plan) return;
    
    // Filter to only approved features
    const approvedFeatures = plan.features?.filter(f => f.approved && f.priority !== 'future') || [];
    
    if (approvedFeatures.length === 0 && plan.features && plan.features.length > 0) {
      toast.error('কমপক্ষে একটি feature approve করুন');
      return;
    }

    const executionPlan = {
      ...plan,
      features: approvedFeatures
    };

    onExecutePlan(executionPlan);
    toast.success('প্ল্যান execute হচ্ছে...');
  };

  const approveAll = () => {
    if (!plan?.features) return;
    setPlan({
      ...plan,
      features: plan.features.map(f => 
        f.priority !== 'future' ? { ...f, approved: true } : f
      )
    });
    toast.success('All features approved');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'complex': return 'text-red-400 bg-red-500/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'must': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'should': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'could': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'future': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low': return <Zap className="w-3 h-3 text-green-400" />;
      case 'medium': return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
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
    <div className="h-full flex flex-col bg-[#1a1a2e]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">AI Architect</h2>
            <p className="text-xs text-muted-foreground">তোমার আইডিয়া → AI প্ল্যান → তোমার সিদ্ধান্ত</p>
          </div>
        </div>
      </div>

      {/* Input */}
      {!plan && (
        <div className="p-3 border-b border-border">
          <div className="mb-2">
            <span className="text-xs text-muted-foreground">
              🚀 তোমার আইডিয়া বলো (এলোমেলো হলেও চলবে)
            </span>
          </div>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGeneratePlan('new');
                }
              }}
              placeholder="যেমন: একটা vibe code web বানাতে চাই gemini api দিয়ে..."
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              rows={3}
            />
            <Button
              variant="glow"
              size="icon-sm"
              className="absolute right-2 bottom-2"
              onClick={() => handleGeneratePlan('new')}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Plan Display */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">আইডিয়া analyze করছি...</p>
              <p className="text-xs mt-1">ঝুঁকি, feasibility সব দেখছি</p>
            </div>
          )}

          {plan && (
            <div className="space-y-4 animate-fade-in">
              {/* Plan Header */}
              <div className="bg-background/50 rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{plan.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{plan.summary}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setPlan(null);
                      setInput('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getComplexityColor(plan.complexity))}>
                    {plan.complexity}
                  </span>
                  {plan.estimatedTime && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {plan.estimatedTime}
                    </span>
                  )}
                </div>
              </div>

              {/* AI Recommendation */}
              {plan.aiRecommendation && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-primary">AI Recommendation</span>
                      <p className="text-xs text-foreground/80 mt-1">{plan.aiRecommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions */}
              {plan.questions && plan.questions.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">স্পষ্ট করা দরকার</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.questions.map((q, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tech Stack */}
              {plan.techStack && (
                <Collapsible open={expandedSections.techStack} onOpenChange={() => toggleSection('techStack')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Tech Stack</span>
                    </div>
                    {expandedSections.techStack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 px-3 space-y-2">
                    {Object.entries(plan.techStack).map(([category, items]) => (
                      items.length > 0 && (
                        <div key={category}>
                          <span className="text-[10px] uppercase text-muted-foreground">{category}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {items.map((item, i) => (
                              <span key={i} className="px-2 py-0.5 bg-secondary rounded text-xs">{item}</span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Features - Editable */}
              {plan.features && plan.features.length > 0 && (
                <Collapsible open={expandedSections.features} onOpenChange={() => toggleSection('features')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Features ({plan.features.filter(f => f.approved).length}/{plan.features.length} approved)</span>
                    </div>
                    {expandedSections.features ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={approveAll}>
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Approve All
                      </Button>
                    </div>
                    {plan.features.map((feature) => (
                      <div
                        key={feature.id}
                        className={cn(
                          "rounded-lg p-3 border transition-colors",
                          feature.approved 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-background/30 border-border"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={feature.approved}
                            onCheckedChange={() => toggleFeatureApproval(feature.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{feature.name}</span>
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", getPriorityColor(feature.priority))}>
                                {feature.priority}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                {getEffortIcon(feature.effort)}
                                {feature.effort}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {feature.priority !== 'future' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6"
                                onClick={() => moveToFuture(feature.id)}
                                title="Move to future"
                              >
                                <Calendar className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeFeature(feature.id)}
                              title="Remove feature"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* User Flow */}
              {plan.userFlow && plan.userFlow.length > 0 && (
                <Collapsible open={expandedSections.userFlow} onOpenChange={() => toggleSection('userFlow')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">User Flow</span>
                    </div>
                    {expandedSections.userFlow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {plan.userFlow.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-background/30 rounded">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">
                          {step.step}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs">{step.action}</p>
                          <p className="text-[10px] text-muted-foreground">→ {step.result}</p>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Files */}
              {plan.files && plan.files.length > 0 && (
                <Collapsible open={expandedSections.files} onOpenChange={() => toggleSection('files')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Files ({plan.files.length})</span>
                    </div>
                    {expandedSections.files ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1">
                    {plan.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-background/30">
                        {getActionIcon(file.action)}
                        <span className="text-xs font-mono flex-1 truncate">{file.path}</span>
                        <span className="text-[10px] text-muted-foreground">{file.action}</span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Risks */}
              {plan.risks && plan.risks.length > 0 && (
                <Collapsible open={expandedSections.risks} onOpenChange={() => toggleSection('risks')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-medium text-red-400">Risks ({plan.risks.length})</span>
                    </div>
                    {expandedSections.risks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {plan.risks.map((risk, i) => (
                      <div key={i} className="bg-background/30 rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-xs font-medium", getSeverityColor(risk.severity))}>
                            [{risk.severity.toUpperCase()}]
                          </span>
                          <span className="text-xs text-muted-foreground">{risk.type}</span>
                        </div>
                        <p className="text-xs">{risk.description}</p>
                        <p className="text-[10px] text-green-400 mt-1">✓ {risk.mitigation}</p>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Future Considerations */}
              {plan.futureConsiderations && plan.futureConsiderations.length > 0 && (
                <Collapsible open={expandedSections.future} onOpenChange={() => toggleSection('future')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">Future</span>
                    </div>
                    {expandedSections.future ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 px-3">
                    <ul className="space-y-1">
                      {plan.futureConsiderations.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Warnings */}
              {plan.warnings && plan.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">সতর্কতা</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback Input */}
              {showFeedback && (
                <div className="bg-background/50 rounded-lg p-3 border border-border">
                  <span className="text-xs text-muted-foreground mb-2 block">পরিবর্তন চাও? বলো:</span>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="যেমন: এই feature বাদ দাও, এইটা simple কর..."
                    className="w-full bg-background/50 border border-border rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleGeneratePlan('revise')}
                      disabled={!feedback.trim() || isLoading}
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Revise
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFeedback(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {!showFeedback && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShowFeedback(true)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    পরিবর্তন চাই
                  </Button>
                )}
                <Button
                  className="w-full gap-2"
                  onClick={handleExecute}
                  disabled={isLoading}
                >
                  <Play className="w-4 h-4" />
                  Approve & Execute
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !plan && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm text-center mb-2">
                তোমার আইডিয়া বলো
              </p>
              <p className="text-xs text-center opacity-70">
                AI analyze করবে, প্ল্যান দেবে, তুমি approve করবে
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};