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
  ThumbsUp,
  Clock,
  Lightbulb,
  FolderPlus,
  FileCode,
  Circle,
  MessageSquare,
  Layout,
  Search,
  Filter,
  MoreVertical,
  Star,
  TrendingUp,
  Brain,
  Rocket,
  Wand2,
  Palette,
  ShieldCheck,
  Cpu,
  Layers,
  GitBranch,
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ... (keep existing interfaces, add new ones if needed)

const quickActions = [
  { 
    icon: FilePlus, 
    label: 'Create', 
    prompt: 'Create a new file called ',
    color: 'text-green-500 bg-green-500/10',
    description: 'New file'
  },
  { 
    icon: FileEdit, 
    label: 'Edit', 
    prompt: 'Edit the file ',
    color: 'text-blue-500 bg-blue-500/10',
    description: 'Modify existing'
  },
  { 
    icon: Bug, 
    label: 'Debug', 
    prompt: 'Fix the bug in ',
    color: 'text-red-500 bg-red-500/10',
    description: 'Fix issues'
  },
  { 
    icon: TestTube, 
    label: 'Test', 
    prompt: 'Test my app for bugs and issues',
    color: 'text-purple-500 bg-purple-500/10',
    description: 'Run tests'
  },
  { 
    icon: Layout, 
    label: 'UI', 
    prompt: 'Design a modern UI for ',
    color: 'text-pink-500 bg-pink-500/10',
    description: 'Design interface'
  },
  { 
    icon: Wand2, 
    label: 'Optimize', 
    prompt: 'Optimize the performance of ',
    color: 'text-amber-500 bg-amber-500/10',
    description: 'Performance boost'
  },
];

const testPrompts = [
  { label: '🎯 Landing Page', prompt: 'Create a modern landing page with hero section, features, and footer', category: 'UI' },
  { label: '📊 Dashboard', prompt: 'Create a dashboard with stats cards and charts', category: 'Data' },
  { label: '🔐 Auth System', prompt: 'Create a secure authentication system', category: 'Security' },
  { label: '🛒 E-commerce', prompt: 'Build an e-commerce product page', category: 'E-commerce' },
  { label: '💬 Chat UI', prompt: 'Create a modern chat interface', category: 'UI' },
  { label: '📱 Mobile App', prompt: 'Design a responsive mobile app layout', category: 'Mobile' },
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
        '👋 **Welcome to Vibe AI Studio**\n\nI\'m your AI development assistant, ready to help you:\n\n✨ **Code Generation** - Write, edit, and optimize code\n📋 **Project Planning** - Create detailed execution plans\n🔍 **Testing & Debugging** - Find and fix issues\n🎨 **UI/UX Design** - Design beautiful interfaces\n\nWhat would you like to build today?',
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
  const [searchQuery, setSearchQuery] = useState('');

  // ... (keep existing useEffect and helper functions)

  return (
    <div 
      className="h-full flex bg-gradient-to-br from-background via-background to-secondary/5"
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
      <div className="flex-1 flex flex-col bg-transparent relative">
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 backdrop-blur-sm bg-primary/10 border-2 border-dashed border-primary/50 z-50 flex items-center justify-center rounded-lg">
            <div className="bg-card/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center border border-primary/20">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">Drop files here</p>
              <p className="text-muted-foreground">Images, documents, or code files</p>
              <p className="text-xs text-muted-foreground mt-2">Supports .png, .jpg, .txt, .md, .js, .ts, .jsx, .tsx</p>
            </div>
          </div>
        )}

        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
          <div className="relative p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Brain className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Vibe AI Studio
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {currentConversation ? currentConversation.title : 'Ready to create'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {user && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowHistory(!showHistory)}
                          className={cn(
                            "h-9 w-9 rounded-lg transition-all duration-200",
                            showHistory && "bg-primary/20 text-primary"
                          )}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Chat History</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNewChat}
                        className="h-9 w-9 rounded-lg hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>New Chat</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Mode Tabs with Glow Effect */}
            <div className="relative">
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'chat' | 'plan' | 'test')}>
                <TabsList className="grid w-full grid-cols-3 h-10 bg-secondary/30 backdrop-blur-sm">
                  <TabsTrigger value="chat" className="text-sm gap-2 relative group">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                    <div className={cn(
                      "absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300",
                      activeMode === 'chat' ? 'scale-100' : 'scale-0 group-hover:scale-50'
                    )} />
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="text-sm gap-2 relative group">
                    <Target className="w-4 h-4" />
                    Plan
                    <div className={cn(
                      "absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300",
                      activeMode === 'plan' ? 'scale-100' : 'scale-0 group-hover:scale-50'
                    )} />
                  </TabsTrigger>
                  <TabsTrigger value="test" className="text-sm gap-2 relative group">
                    <TestTube className="w-4 h-4" />
                    Test
                    <div className={cn(
                      "absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300",
                      activeMode === 'test' ? 'scale-100' : 'scale-0 group-hover:scale-50'
                    )} />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </h3>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                      <Search className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search actions</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                      <Filter className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Filter</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {quickActions.map((action) => (
              <TooltipProvider key={action.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-16 flex-col gap-1.5 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200",
                        action.color
                      )}
                      onClick={() => {
                        if (action.label === 'Test') {
                          setActiveMode('test');
                          runTests();
                        } else {
                          setInput(action.prompt);
                        }
                      }}
                    >
                      <div className={cn("p-1.5 rounded-lg", action.color.split(' ')[0])}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                      <span className="text-[10px] text-muted-foreground">{action.description}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{action.description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          {/* Templates Section */}
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-8 rounded-lg hover:bg-secondary/50"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <div className="flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Quick Templates</span>
                <Badge variant="outline" className="ml-1 text-[10px]">
                  {testPrompts.length}
                </Badge>
              </div>
              {showTemplates ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </Button>
            
            {showTemplates && (
              <div className="mt-2 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {testPrompts.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 px-3 rounded-lg text-left hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                    onClick={() => {
                      setInput(item.prompt);
                      setShowTemplates(false);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <div className="text-lg">{item.label.split(' ')[0]}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.label.split(' ').slice(1).join(' ')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {item.prompt.substring(0, 40)}...
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {item.category}
                          </Badge>
                          <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center relative",
                    message.role === 'user' 
                      ? "bg-gradient-to-br from-primary to-accent shadow-lg" 
                      : "bg-gradient-to-br from-secondary to-muted border border-border"
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                    {message.role === 'assistant' && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className={cn(
                  "flex-1 rounded-2xl p-4 text-sm max-w-[85%] relative",
                  message.role === 'user'
                    ? "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                    : "bg-gradient-to-br from-secondary/30 to-secondary/10 border border-border/50"
                )}>
                  {/* Timestamp */}
                  <div className={cn(
                    "text-xs mb-2 flex items-center gap-1",
                    message.role === 'user' ? "text-primary/70" : "text-muted-foreground"
                  )}>
                    <Clock className="w-3 h-3" />
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.attachments.map((file) => (
                        <div key={file.id} className="bg-background/50 rounded-lg p-2 flex items-center gap-2 border border-border/50 hover:border-primary/30 transition-colors">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          )}
                          <div className="text-xs">
                            <p className="font-medium truncate max-w-[80px]">{file.name}</p>
                            <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File operations badges */}
                  {message.operations && message.operations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {message.operations.map((op, idx) => (
                        <Badge key={idx} variant={op.type === 'create' ? 'default' : op.type === 'edit' ? 'secondary' : 'destructive'} className="gap-1">
                          {op.type === 'create' && <FilePlus className="w-3 h-3" />}
                          {op.type === 'edit' && <FileEdit className="w-3 h-3" />}
                          {op.type === 'delete' && <Trash2 className="w-3 h-3" />}
                          {op.type}: {op.path}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Test results */}
                  {message.testResults && message.testResults.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {message.testResults.map((result, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg text-xs border",
                            result.type === 'error' && "bg-red-500/10 text-red-400 border-red-500/20",
                            result.type === 'warning' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                            result.type === 'success' && "bg-green-500/10 text-green-400 border-green-500/20"
                          )}
                        >
                          {result.type === 'error' && <AlertTriangle className="w-4 h-4" />}
                          {result.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                          {result.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                          <span>{result.message}</span>
                          {result.file && (
                            <code className="ml-2 px-1.5 py-0.5 bg-black/20 rounded text-[10px]">
                              {result.file}
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                    {message.content}
                  </div>

                  {/* Action buttons */}
                  <div className={cn(
                    "flex items-center gap-1 mt-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {message.role === 'assistant' && message.content && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-7 w-7 rounded-lg hover:bg-primary/10"
                              onClick={() => handleCopy(message.content, message.id)}
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedId === message.id ? 'Copied!' : 'Copy message'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3 w-24 bg-primary/20 rounded-full animate-pulse" />
                    <div className="h-2 w-12 bg-primary/10 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-primary/10 rounded-full animate-pulse" />
                    <div className="h-2 w-4/5 bg-primary/10 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Plan Edit & Approve UI - Keep existing but add better styling */}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-border/50 bg-gradient-to-r from-secondary/20 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">Attached Files</span>
                <Badge variant="outline" className="text-[10px]">
                  {attachedFiles.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => setAttachedFiles([])}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="bg-background rounded-lg p-2 flex items-center gap-2 text-xs border border-border/50 hover:border-primary/30 transition-colors min-w-[140px]">
                  {file.type === 'image' ? (
                    <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-muted-foreground text-[10px]">{formatFileSize(file.size)}</p>
                  </div>
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
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-background via-background to-transparent">
          <div className="relative">
            <div className="bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
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
                    ? "🔍 Describe what you want to test or click 'Run Tests'..." 
                    : activeMode === 'plan'
                    ? "📋 Describe your project idea or requirements..."
                    : "💬 Ask me anything or describe what you want to build..."
                }
                className="w-full bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[72px] max-h-[144px]"
                rows={2}
                disabled={isLoading}
              />
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach files</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upload image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="h-5 w-px bg-border/50 mx-1" />
                  <Badge variant="outline" className="text-xs font-normal gap-1.5 px-2.5">
                    {activeMode === 'chat' && <><Cpu className="w-3 h-3" /> Smart AI</>}
                    {activeMode === 'plan' && <><Layers className="w-3 h-3" /> Planning</>}
                    {activeMode === 'test' && <><ShieldCheck className="w-3 h-3" /> Testing</>}
                  </Badge>
                </div>
                <Button 
                  size="sm"
                  onClick={handleSend}
                  disabled={(!input.trim() && activeMode !== 'test') || isLoading}
                  className="h-9 px-5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : activeMode === 'test' ? (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Run Tests
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.html,.css,.scss,.py,.java,.cpp,.go,.rs"
            />
            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-primary rounded-full" />
                Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Enter</kbd> to send
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Drag & drop files to attach
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
