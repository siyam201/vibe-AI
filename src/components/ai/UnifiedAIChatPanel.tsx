import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Copy, 
  Check,
  FilePlus,
  FileEdit,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Target,
  Bug,
  Upload,
  Image,
  FileText,
  X,
  TestTube,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Code2,
  Paperclip,
  Settings2,
  ThumbsUp,
  Clock,
  Package,
  Lightbulb,
  HelpCircle,
  FolderPlus,
  FileCode,
  Circle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseFileOperations, FileOperation } from '@/hooks/useFileOperations';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operations?: FileOperation[];
  attachments?: AttachedFile[];
  testResults?: TestResult[];
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
}

interface TestResult {
  type: 'error' | 'warning' | 'success';
  message: string;
  file?: string;
  line?: number;
}

interface Feature {
  id: number;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'future';
  effort: 'low' | 'medium' | 'high';
  approved: boolean;
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
  techStack?: {
    frontend: string[];
    backend: string[];
    database: string[];
    apis: string[];
  };
  features?: Feature[];
  files: PlanFile[];
  risks?: { type: string; description: string; mitigation: string; severity: 'low' | 'medium' | 'high' }[];
  futureConsiderations?: string[];
  dependencies: string[];
  warnings: string[];
  questions: string[];
  aiRecommendation?: string;
}

interface UnifiedAIChatPanelProps {
  onInsertCode: (code: string) => void;
  onFileOperations: (operations: FileOperation[]) => void;
  currentFiles: { path: string; content: string }[];
  queuedMessage?: { id: string; content: string; mode?: string } | null;
  onQueuedMessageHandled?: (id: string) => void;
  projectId?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

const quickActions = [
  { icon: FilePlus, label: 'Create File', prompt: 'Create a new file called ' },
  { icon: FileEdit, label: 'Edit File', prompt: 'Edit the file ' },
  { icon: Bug, label: 'Fix Bug', prompt: 'Fix the bug in ' },
  { icon: TestTube, label: 'Test App', prompt: 'Test my app for bugs and issues' },
];

const testPrompts = [
  { label: '🚀 Landing Page', prompt: 'Create a modern landing page with hero section, features, and footer' },
  { label: '📝 Todo App', prompt: 'Create a todo app with add, complete, and delete functionality' },
  { label: '🎨 Dashboard', prompt: 'Create a dashboard with stats cards and a chart section' },
  { label: '🔐 Login Form', prompt: 'Create a beautiful login form with email and password fields' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const PLAN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-plan`;

export const UnifiedAIChatPanel = ({
  onInsertCode,
  onFileOperations,
  currentFiles,
  queuedMessage,
  onQueuedMessageHandled,
  projectId,
  initialMode = 'chat',
}: UnifiedAIChatPanelProps) => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    messages: dbMessages,
    loading: historyLoading,
    createConversation,
    addMessage,
    updateMessage,
    loadConversation,
    deleteConversation,
  } = useChatHistory(projectId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '👋 Hi! I\'m your AI Assistant. I can:\n\n• **Create & Edit** files\n• **Plan** your projects\n• **Test** for bugs\n• **Upload** images & files\n\nTell me what you want to build!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'plan' | 'test'>(initialMode);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    techStack: true,
    files: false,
    risks: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync messages when loading a conversation
  useEffect(() => {
    if (dbMessages.length > 0) {
      const convertedMessages: Message[] = dbMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
        operations: m.operations as FileOperation[],
      }));
      setMessages(convertedMessages);
    }
  }, [dbMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newAttachments: AttachedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      size: file.size,
    }));
    setAttachedFiles(prev => [...prev, ...newAttachments]);
    toast.success(`${files.length} file(s) attached`);
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Run tests on current files
  const runTests = useCallback(async () => {
    setIsLoading(true);
    const testResults: TestResult[] = [];

    // Analyze current files for common issues
    for (const file of currentFiles) {
      const content = file.content;
      
      // Check for console.log statements
      if (content.includes('console.log')) {
        testResults.push({
          type: 'warning',
          message: 'Found console.log statement (consider removing for production)',
          file: file.path,
        });
      }

      // Check for TODO comments
      if (content && content.toLowerCase().includes('todo')) {
            testResults.push({
          type: 'warning',
          message: 'Found TODO comment',
          file: file.path,
        });
      }

      // Check for empty catch blocks
      if (content.includes('catch') && content.includes('{}')) {
        testResults.push({
          type: 'error',
          message: 'Found empty catch block (errors may be silently swallowed)',
          file: file.path,
        });
      }

      // Check for missing alt attributes in images
      if (content.includes('<img') && !content.includes('alt=')) {
        testResults.push({
          type: 'warning',
          message: 'Image missing alt attribute (accessibility issue)',
          file: file.path,
        });
      }
    }

    if (testResults.length === 0) {
      testResults.push({
        type: 'success',
        message: 'No issues found! Your code looks good.',
      });
    }

    const testMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `## Test Results\n\nScanned ${currentFiles.length} files:\n\n${testResults.map(r => 
        `${r.type === 'error' ? '❌' : r.type === 'warning' ? '⚠️' : '✅'} ${r.message}${r.file ? ` (${r.file})` : ''}`
      ).join('\n')}`,
      timestamp: new Date(),
      testResults,
    };

    setMessages(prev => [...prev, testMessage]);
    setIsLoading(false);
  }, [currentFiles]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Ensure we have a conversation
    let convId = currentConversation?.id;
    if (user && !convId) {
      const newConv = await createConversation();
      if (newConv) {
        convId = newConv.id;
      }
    }

    // Build context about current files
    const fileContext =
      currentFiles.length > 0
        ? `\n\nCurrent project files:\n${currentFiles.map((f) => `- ${f.path}`).join('\n')}`
        : '';

    // Add attachment info to message
    const attachmentInfo = attachedFiles.length > 0
      ? `\n\n[Attached ${attachedFiles.length} file(s): ${attachedFiles.map(f => f.name).join(', ')}]`
      : '';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim() + attachmentInfo,
      timestamp: new Date(),
      attachments: [...attachedFiles],
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    // Save user message to DB if logged in
    if (user && convId) {
      await addMessage(convId, 'user', messageText.trim());
    }

    // Use appropriate API based on mode
    const apiUrl = activeMode === 'plan' ? PLAN_URL : CHAT_URL;

    // Prepare messages for API with file context
    const apiMessages = newMessages
      .filter((m) => m.id !== '1')
      .map((m) => ({
        role: m.role,
        content:
          m.role === 'user' && m.id === userMessage.id
            ? m.content + fileContext
            : m.content,
      }));

    let assistantContent = '';
    const assistantId = (Date.now() + 1).toString();
    let dbMessageId: string | null = null;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(
          activeMode === 'plan' 
            ? { message: messageText.trim(), context: { files: currentFiles.map(f => f.path) }, mode: 'new' }
            : { messages: apiMessages }
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (activeMode === 'plan') {
        // Handle plan response (non-streaming)
        const data = await response.json();
        if (data.plan) {
          // Initialize features as not approved
          if (data.plan.features) {
            data.plan.features = data.plan.features.map((f: Feature, idx: number) => ({
              ...f,
              id: f.id || idx + 1,
              approved: false
            }));
          }
          setCurrentPlan(data.plan);
          assistantContent = `## 📋 Plan Generated: ${data.plan.title}\n\n${data.plan.summary}\n\nReview and approve features below.`;
        }
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        }]);
        toast.success('Plan generated! Review and approve features.');
      } else {
        // Handle chat response (streaming)
        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';

        // Add initial assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          },
        ]);

        // Create DB message placeholder
        if (user && convId) {
          const dbMsg = await addMessage(convId, 'assistant', '');
          if (dbMsg) {
            dbMessageId = dbMsg.id;
          }
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m)),
                );
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Parse and execute file operations
        const { operations, cleanText } = parseFileOperations(assistantContent);

        // Update message with clean text and operations
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: cleanText, operations } : m)),
        );

        // Update DB message
        if (user && dbMessageId) {
          await updateMessage(dbMessageId, cleanText, operations);
        }

        // Execute file operations
        if (operations.length > 0) {
          onFileOperations(operations);
          operations.forEach((op) => {
            const action = op.type === 'create' ? 'Created' : op.type === 'edit' ? 'Updated' : 'Deleted';
            toast.success(`${action}: ${op.path}`);
          });
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast.error(errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (activeMode === 'test') {
      await runTests();
    } else {
      await sendMessage(input);
    }
  };

  useEffect(() => {
    if (!queuedMessage?.content?.trim()) return;
    if (isLoading) return;

    // Switch to the appropriate mode if specified
    if (queuedMessage.mode) {
      setActiveMode(queuedMessage.mode as 'chat' | 'plan' | 'test');
    }

    void sendMessage(queuedMessage.content);
    onQueuedMessageHandled?.(queuedMessage.id);
  }, [queuedMessage?.id]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = async () => {
    if (user) {
      await createConversation();
    }
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          '👋 Hi! I\'m your AI Assistant. I can:\n\n• **Create & Edit** files\n• **Plan** your projects\n• **Test** for bugs\n• **Upload** images & files\n\nTell me what you want to build!',
        timestamp: new Date(),
      },
    ]);
  };

  const renderOperationBadge = (op: FileOperation) => {
    const icons = {
      create: <FilePlus className="w-3 h-3" />,
      edit: <FileEdit className="w-3 h-3" />,
      delete: <Trash2 className="w-3 h-3" />,
    };
    const colors = {
      create: 'bg-green-500/20 text-green-400',
      edit: 'bg-yellow-500/20 text-yellow-400',
      delete: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs", colors[op.type])}>
        {icons[op.type]}
        {op.type}: {op.path}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Plan helper functions
  const toggleFeatureApproval = (featureId: number) => {
    if (!currentPlan?.features) return;
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.map(f => 
        f.id === featureId ? { ...f, approved: !f.approved } : f
      )
    });
  };

  const approveAll = () => {
    if (!currentPlan?.features) return;
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.map(f => 
        f.priority !== 'future' ? { ...f, approved: true } : f
      )
    });
    toast.success('All features approved');
  };

  const removeFeature = (featureId: number) => {
    if (!currentPlan?.features) return;
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.filter(f => f.id !== featureId)
    });
    toast.success('Feature removed');
  };

  const handleExecutePlan = () => {
    if (!currentPlan) return;
    
    const approvedFeatures = currentPlan.features?.filter(f => f.approved && f.priority !== 'future') || [];
    
    if (approvedFeatures.length === 0 && currentPlan.features && currentPlan.features.length > 0) {
      toast.error('Please approve at least one feature');
      return;
    }

    // Generate code based on the plan
    const planSummary = `Execute this plan:\n\n**${currentPlan.title}**\n\nFeatures to build:\n${approvedFeatures.map(f => `- ${f.name}: ${f.description}`).join('\n')}\n\nFiles to create:\n${currentPlan.files?.map(f => `- ${f.action}: ${f.path}`).join('\n') || 'Based on features'}`;
    
    setActiveMode('chat');
    setCurrentPlan(null);
    setInput(planSummary);
    toast.success('Plan ready! Click send to execute.');
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

  const getActionIcon = (action: string | undefined | null) => {
  // যদি action না থাকে তবে default হিসেবে 'edit' ধরবে
  const safeAction = (action || 'edit').toLowerCase();
  
  switch (safeAction) {
    case 'create': 
      return <FolderPlus className="w-3.5 h-3.5 text-green-400" />;
    case 'edit': 
      return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
    case 'delete': 
      return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
    default: 
      return <Circle className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div 
      className="h-full flex"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Chat History Sidebar */}
      {user && (
        <ChatHistorySidebar
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          isCollapsed={!showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onSelectConversation={loadConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={deleteConversation}
          loading={historyLoading}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl shadow-xl text-center">
              <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-foreground font-medium">Drop files here</p>
              <p className="text-muted-foreground text-sm">Images, documents, or code files</p>
            </div>
          </div>
        )}

        {/* Header with Mode Tabs */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">Vibe AI</h2>
                <p className="text-xs text-muted-foreground">
                  {currentConversation ? currentConversation.title : 'Chat + Plan + Test'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(showHistory && "bg-primary/20 text-primary")}
                  title="Chat History"
                >
                  <History className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mode Tabs */}
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'chat' | 'plan' | 'test')}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="chat" className="text-xs gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Code
              </TabsTrigger>
              <TabsTrigger value="plan" className="text-xs gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Plan
              </TabsTrigger>
              <TabsTrigger value="test" className="text-xs gap-1.5">
                <TestTube className="w-3.5 h-3.5" />
                Test
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Actions */}
        <div className="p-2 border-b border-border space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => {
                  if (action.label === 'Test App') {
                    setActiveMode('test');
                    runTests();
                  } else {
                    setInput(action.prompt);
                  }
                }}
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </Button>
            ))}
          </div>
          
          {/* Templates Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs justify-between h-7"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              Quick Templates
            </span>
            {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          
          {showTemplates && (
            <div className="grid grid-cols-2 gap-1">
              {testPrompts.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 justify-start"
                  onClick={() => {
                    setInput(item.prompt);
                    setShowTemplates(false);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  message.role === 'user' 
                    ? "bg-primary/20 text-primary" 
                    : "bg-gradient-to-br from-primary/20 to-accent/20"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className={cn(
                  "flex-1 rounded-lg p-3 text-sm max-w-[85%]",
                  message.role === 'user'
                    ? "bg-primary/10 text-foreground"
                    : "bg-secondary/50 text-foreground"
                )}>
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {message.attachments.map((file) => (
                        <div key={file.id} className="bg-background/50 rounded p-2 flex items-center gap-2">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          )}
                          <div className="text-xs">
                            <p className="font-medium truncate max-w-[100px]">{file.name}</p>
                            <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File operations badges */}
                  {message.operations && message.operations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {message.operations.map((op, idx) => (
                        <span key={idx}>{renderOperationBadge(op)}</span>
                      ))}
                    </div>
                  )}

                  {/* Test results */}
                  {message.testResults && message.testResults.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {message.testResults.map((result, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded text-xs",
                            result.type === 'error' && "bg-red-500/10 text-red-400",
                            result.type === 'warning' && "bg-yellow-500/10 text-yellow-400",
                            result.type === 'success' && "bg-green-500/10 text-green-400"
                          )}
                        >
                          {result.type === 'error' && <AlertTriangle className="w-3 h-3" />}
                          {result.type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                          {result.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          <span>{result.message}</span>
                          {result.file && <code className="opacity-70">({result.file})</code>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Copy button */}
                  {message.role === 'assistant' && message.content && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mt-2 h-6 w-6"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-primary">
                  {activeMode === 'test' ? 'Running tests...' : activeMode === 'plan' ? 'Creating plan...' : 'Generating...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Plan Edit & Approve UI */}
        {currentPlan && (
          <div className="border-t border-border bg-secondary/30 max-h-[50%] overflow-auto">
            <div className="p-3 space-y-3">
              {/* Plan Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground text-sm">{currentPlan.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getComplexityColor(currentPlan.complexity))}>
                      {currentPlan.complexity}
                    </span>
                    {currentPlan.estimatedTime && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {currentPlan.estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setCurrentPlan(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* AI Recommendation */}
              {currentPlan.aiRecommendation && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">{currentPlan.aiRecommendation}</p>
                  </div>
                </div>
              )}

              {/* Features - Editable */}
              {currentPlan.features && currentPlan.features.length > 0 && (
                <Collapsible open={expandedSections.features} onOpenChange={() => toggleSection('features')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Features ({currentPlan.features.filter(f => f.approved).length}/{currentPlan.features.length} approved)</span>
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
                    {currentPlan.features.map((feature) => (
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
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 text-muted-foreground hover:text-red-400"
                            onClick={() => removeFeature(feature.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Files */}
              {currentPlan.files && currentPlan.files.length > 0 && (
                <Collapsible open={expandedSections.files} onOpenChange={() => toggleSection('files')}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-background/30 rounded-lg hover:bg-background/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Files ({currentPlan.files.length})</span>
                    </div>
                    {expandedSections.files ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1">
                    {currentPlan.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-background/20 rounded text-xs">
                        {getActionIcon(file.action)}
                        <span className="font-mono text-muted-foreground">{file.path}</span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Execute Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setCurrentPlan(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="glow"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleExecutePlan}
                  disabled={!currentPlan.features?.some(f => f.approved)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Execute Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="px-3 py-2 border-t border-border flex gap-2 flex-wrap">
            {attachedFiles.map((file) => (
              <div key={file.id} className="bg-secondary rounded-lg p-2 flex items-center gap-2 text-xs">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                ) : (
                  <FileText className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="max-w-[100px] truncate">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-5 w-5"
                  onClick={() => removeAttachment(file.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-border">
          <div className="bg-secondary rounded-lg border border-border focus-within:border-primary/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeMode === 'test' 
                  ? "Click 'Run Tests' or describe what to test..." 
                  : activeMode === 'plan'
                  ? "Describe your project idea..."
                  : "Describe what you want to build..."
              }
              className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[60px] max-h-[120px]"
              rows={2}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.html,.css"
                />
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  title="Upload image"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {activeMode === 'chat' && <><Zap className="w-3 h-3 inline" /> Code</>}
                  {activeMode === 'plan' && <><Target className="w-3 h-3 inline" /> Plan</>}
                  {activeMode === 'test' && <><TestTube className="w-3 h-3 inline" /> Test</>}
                </span>
              </div>
              <Button 
                size="sm"
                onClick={handleSend}
                disabled={(!input.trim() && activeMode !== 'test') || isLoading}
                className="h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : activeMode === 'test' ? (
                  <>
                    <TestTube className="w-4 h-4 mr-1" />
                    Run Tests
                  </>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send • Drag & drop files to attach
          </p>
        </div>
      </div>
    </div>
  );
};
