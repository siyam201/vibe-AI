import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Copy, 
  Check,
  FilePlus,
  FileEdit,
  Trash2,
  History,
  Plus,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Paperclip,
  MessageSquare,
  Brain,
  Target,
  Sparkles,
  FolderPlus,
  CheckCircle2,
  ThumbsUp,
  Clock,
  Zap,
  AlertTriangle,
  Eye,
  Download,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Layers,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseFileOperations, FileOperation } from '@/hooks/useFileOperations';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operations?: FileOperation[];
  attachments?: AttachedFile[];
  isPlan?: boolean;
  planApproved?: boolean;
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
  content?: string; // For text files
}

interface PlanFeature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  approved: boolean;
}

interface PlanSection {
  title: string;
  items: string[];
}

interface ExtractedPlan {
  title: string;
  summary: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
  features: PlanFeature[];
  files: string[];
  dependencies: string[];
  warnings: string[];
  sections?: PlanSection[];
}

interface UnifiedAIChatPanelProps {
  onInsertCode: (code: string) => void;
  onFileOperations: (operations: FileOperation[]) => void;
  currentFiles: { path: string; content: string }[];
  queuedMessage?: { id: string; content: string } | null;
  onQueuedMessageHandled?: (id: string) => void;
  projectId?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export const UnifiedAIChatPanel = ({
  onInsertCode,
  onFileOperations,
  currentFiles,
  queuedMessage,
  onQueuedMessageHandled,
  projectId,
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
      content: '👋 Hi! I\'m your AI Assistant. Tell me what you want to build or upload files for analysis!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [extractedPlans, setExtractedPlans] = useState<Map<string, ExtractedPlan>>(new Map());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // File upload handler with content extraction
  const handleFiles = useCallback(async (files: File[]) => {
    const newAttachments: AttachedFile[] = [];
    
    for (const file of files) {
      const attachment: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        size: file.size,
      };

      // Read text files
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        try {
          const content = await file.text();
          attachment.content = content;
          toast.info(`Read ${file.name}: ${content.length} characters`);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }

      // Process images
      if (file.type.startsWith('image/')) {
        setIsProcessingImage(true);
        try {
          // Simulate image processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success(`Image ${file.name} uploaded for analysis`);
        } catch (error) {
          console.error('Error processing image:', error);
        } finally {
          setIsProcessingImage(false);
        }
      }

      newAttachments.push(attachment);
    }

    setAttachedFiles(prev => [...prev, ...newAttachments]);
    toast.success(`${files.length} file(s) attached`);
  }, []);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  }, [handleFiles]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        setIsProcessingImage(true);
        setUploadProgress(0);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);

        await handleFiles(imageFiles);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }
  }, [handleFiles]);

  const removeAttachment = useCallback((id: string) => {
    const file = attachedFiles.find(f => f.id === id);
    if (file && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  }, [attachedFiles]);

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Extract plan from AI response
  const extractPlanFromContent = (content: string, messageId: string): ExtractedPlan | null => {
    const lines = content.split('\n');
    const plan: Partial<ExtractedPlan> = {
      title: 'Project Plan',
      summary: '',
      complexity: 'medium',
      estimatedTime: '2-3 hours',
      features: [],
      files: [],
      dependencies: [],
      warnings: [],
      sections: [],
    };

    let currentSection: PlanSection | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract title
      if (line.startsWith('# ') && !plan.title) {
        plan.title = line.substring(2);
        continue;
      }
      
      // Extract summary
      if (line.toLowerCase().includes('summary:') || line.toLowerCase().includes('description:')) {
        plan.summary = line.split(':')[1]?.trim() || lines[i+1]?.trim() || '';
      }
      
      // Extract complexity
      if (line.toLowerCase().includes('complexity:')) {
        const complexity = line.toLowerCase().split('complexity:')[1]?.trim();
        if (complexity?.includes('simple')) plan.complexity = 'simple';
        else if (complexity?.includes('complex')) plan.complexity = 'complex';
        else plan.complexity = 'medium';
      }
      
      // Extract estimated time
      if (line.toLowerCase().includes('estimated') && line.toLowerCase().includes('time')) {
        const timeMatch = line.match(/\d+-\d+\s*(hours|days|weeks)/i);
        if (timeMatch) plan.estimatedTime = timeMatch[0];
      }
      
      // Extract features
      if (line.toLowerCase().includes('feature') || line.includes('-')) {
        if (line.includes('-')) {
          const featureText = line.replace(/^[-\*•]\s*/, '').trim();
          if (featureText && !featureText.toLowerCase().includes('file')) {
            const priority = featureText.toLowerCase().includes('high') ? 'high' : 
                           featureText.toLowerCase().includes('low') ? 'low' : 'medium';
            const effort = featureText.toLowerCase().includes('large') ? 'large' : 
                          featureText.toLowerCase().includes('small') ? 'small' : 'medium';
            
            plan.features!.push({
              id: `feature-${plan.features!.length + 1}`,
              name: featureText.split(':')[0]?.trim() || `Feature ${plan.features!.length + 1}`,
              description: featureText.split(':')[1]?.trim() || featureText,
              priority,
              effort,
              approved: false
            });
          }
        }
      }
      
      // Extract files
      if (line.includes('.') && (line.includes('.tsx') || line.includes('.ts') || 
          line.includes('.jsx') || line.includes('.js') || line.includes('.css'))) {
        const fileMatch = line.match(/(\S+\.(tsx|ts|jsx|js|css|html|txt|md|json))/i);
        if (fileMatch && !plan.files!.includes(fileMatch[1])) {
          plan.files!.push(fileMatch[1]);
        }
      }
      
      // Extract sections
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) {
          plan.sections!.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, ''),
          items: []
        };
      } else if (currentSection && line.startsWith('- ')) {
        currentSection.items.push(line.substring(2).trim());
      }
    }
    
    if (currentSection) {
      plan.sections!.push(currentSection);
    }

    // If we found a reasonable plan, return it
    if (plan.features!.length > 0 || plan.files!.length > 0 || plan.sections!.length > 0) {
      const fullPlan: ExtractedPlan = {
        title: plan.title!,
        summary: plan.summary || 'No summary provided',
        complexity: plan.complexity!,
        estimatedTime: plan.estimatedTime!,
        features: plan.features!,
        files: plan.files!,
        dependencies: plan.dependencies!,
        warnings: plan.warnings!,
        sections: plan.sections!
      };
      
      setExtractedPlans(prev => new Map(prev.set(messageId, fullPlan)));
      return fullPlan;
    }
    
    return null;
  };

  const sendMessage = async (messageText: string, isPlanRequest = false) => {
    if (!messageText.trim() || isLoading) return;

    // Include attached file contents in message
    let fileContents = '';
    if (attachedFiles.length > 0) {
      fileContents = '\n\nAttached files:\n';
      attachedFiles.forEach(file => {
        if (file.content) {
          fileContents += `\n${file.name}:\n${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}\n`;
        } else if (file.type === 'image') {
          fileContents += `\n[Image: ${file.name}]`;
        }
      });
    }

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

    // Prepare the message content
    let finalMessage = messageText.trim() + fileContents;
    if (isPlanRequest) {
      finalMessage = `Create a detailed project plan for: ${messageText.trim()}${fileContents}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalMessage,
      timestamp: new Date(),
      attachments: [...attachedFiles],
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);
    setIsCreatingPlan(isPlanRequest);

    // Save user message to DB if logged in
    if (user && convId) {
      await addMessage(convId, 'user', finalMessage);
    }

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
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: apiMessages,
          instructions: isPlanRequest 
            ? `Create a detailed, structured project plan with these sections:
               1. Title and Brief Summary
               2. Complexity Level (simple/medium/complex)
               3. Estimated Time
               4. Key Features (list with priorities: high/medium/low)
               5. Files to Create/Modify
               6. Dependencies
               7. Warnings/Considerations
               
               Format with clear headers (##) and bullet points (-).`
            : "Provide a clear, helpful response. If suggesting implementation, include specific files and features."
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add initial assistant message
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isPlan: isPlanRequest,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

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
          if (line.trim() === '') continue;
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

      // Extract plan if this is a plan request
      if (isPlanRequest) {
        extractPlanFromContent(assistantContent, assistantId);
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

    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast.error(errorMessage);
      
      // Remove loading message if there was an error
      setMessages(prev => prev.filter(m => m.id !== assistantId || m.content));
      
      // Add error message
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      
      // Save error message to DB
      if (user && convId) {
        await addMessage(convId, 'assistant', errorMsg.content);
      }
    } finally {
      setIsLoading(false);
      setIsCreatingPlan(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
  };

  const handleCreatePlan = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input, true);
  };

  const handleAcceptPlan = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, planApproved: true } : msg
    ));
    
    const plan = extractedPlans.get(messageId);
    if (plan) {
      // Create implementation prompt from approved plan
      const approvedFeatures = plan.features.filter(f => f.approved);
      const featuresText = approvedFeatures.map(f => 
        `- ${f.name}: ${f.description} (${f.priority} priority)`
      ).join('\n');
      
      const filesText = plan.files.map(f => `- ${f}`).join('\n');
      
      const implementationPrompt = `Implement this approved plan:\n\nTitle: ${plan.title}\n\nSummary: ${plan.summary}\n\nApproved Features:\n${featuresText}\n\nFiles to create:\n${filesText}\n\nComplexity: ${plan.complexity}\nEstimated Time: ${plan.estimatedTime}\n\nPlease generate the complete code implementation.`;
      
      setInput(implementationPrompt);
      toast.success('Plan accepted! Implementation prompt ready.');
    }
  };

  const togglePlanExpansion = (messageId: string) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleFeatureApproval = (messageId: string, featureId: string) => {
    const plan = extractedPlans.get(messageId);
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      features: plan.features.map(f => 
        f.id === featureId ? { ...f, approved: !f.approved } : f
      )
    };

    setExtractedPlans(prev => new Map(prev.set(messageId, updatedPlan)));
  };

  const approveAllFeatures = (messageId: string) => {
    const plan = extractedPlans.get(messageId);
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      features: plan.features.map(f => ({ ...f, approved: true }))
    };

    setExtractedPlans(prev => new Map(prev.set(messageId, updatedPlan)));
    toast.success('All features approved');
  };

  useEffect(() => {
    if (!queuedMessage?.content?.trim()) return;
    if (isLoading) return;

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
        content: '👋 Hi! I\'m your AI Assistant. Tell me what you want to build or upload files for analysis!',
        timestamp: new Date(),
      },
    ]);
    setExtractedPlans(new Map());
    setExpandedPlans(new Set());
  };

  const renderOperationBadge = (op: FileOperation) => {
    const icons = {
      create: <FilePlus className="w-3 h-3" />,
      edit: <FileEdit className="w-3 h-3" />,
      delete: <Trash2 className="w-3 h-3" />,
    };
    const colors = {
      create: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      edit: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      delete: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    };
    return (
      <Badge variant="outline" className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono", colors[op.type])}>
        {icons[op.type]}
        {op.type}: {op.path.split('/').pop()}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'complex': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'small': return <Zap className="w-3 h-3 text-emerald-400" />;
      case 'medium': return <Clock className="w-3 h-3 text-amber-400" />;
      case 'large': return <AlertTriangle className="w-3 h-3 text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-background via-background to-muted/20">
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

      {/* Main Chat Area - Glass Morphism Design */}
      <div 
        className="flex-1 flex flex-col relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card/95 p-8 rounded-2xl border-2 border-dashed border-primary/50 shadow-2xl">
              <Upload className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-semibold text-foreground">Drop files here to upload</p>
              <p className="text-sm text-muted-foreground mt-1">Supports images, text files, and code</p>
            </div>
          </div>
        )}

        {/* Fixed Header with Glass Effect */}
        <div className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Assistant
                </h2>
                <p className="text-xs text-muted-foreground">
                  {currentConversation ? currentConversation.title : 'New Chat'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all duration-200",
                    showHistory && "bg-primary/10 text-primary"
                  )}
                >
                  <History className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="h-9 w-9 rounded-lg hover:bg-primary/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="px-4 py-2 border-b border-border/50 bg-muted/30 backdrop-blur-sm sticky top-[73px] z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-3 py-1 rounded-full border border-primary/20">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat Assistant
                </span>
              </div>
              {isProcessingImage && (
                <div className="flex items-center gap-2 text-xs text-blue-500 animate-pulse">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Processing image...
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentFiles.length > 0 && `${currentFiles.length} project files loaded`}
            </div>
          </div>
        </div>

        {/* Messages Area with Custom Scrollbar */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => {
              const plan = extractedPlans.get(message.id);
              const isExpanded = expandedPlans.has(message.id);
              const isPlan = message.isPlan || plan;
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 animate-in fade-in-50 duration-300",
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
                      message.role === 'user' 
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-primary/30" 
                        : "bg-gradient-to-br from-muted to-muted/80 text-foreground ring-muted/30"
                    )}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={cn(
                    "flex-1 rounded-xl p-4 text-sm max-w-[85%] shadow-sm backdrop-blur-sm transition-all duration-300",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                      : "bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
                  )}>
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-3 p-3 rounded-lg bg-background/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-medium">Attachments ({message.attachments.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.attachments.map((file) => (
                            <div 
                              key={file.id} 
                              className={cn(
                                "bg-background rounded-lg p-2 flex items-center gap-2 border hover:border-primary/30 transition-all duration-200 cursor-pointer",
                                file.type === 'image' && "hover:scale-[1.02]"
                              )}
                              onClick={() => file.type === 'image' && setShowImagePreview(file.url)}
                            >
                              {file.type === 'image' ? (
                                <>
                                  <div className="relative">
                                    <img 
                                      src={file.url} 
                                      alt={file.name} 
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                    <Eye className="absolute inset-0 m-auto w-4 h-4 text-white/0 group-hover:text-white/80 transition-all" />
                                  </div>
                                  <div className="text-xs">
                                    <p className="font-medium truncate max-w-[100px]">{file.name}</p>
                                    <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-6 h-6 text-muted-foreground" />
                                  <div className="text-xs">
                                    <p className="font-medium truncate max-w-[100px]">{file.name}</p>
                                    <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                                    {file.content && (
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        {file.content.length} chars
                                      </p>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File operations */}
                    {message.operations && message.operations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {message.operations.map((op, idx) => (
                          <div key={idx}>{renderOperationBadge(op)}</div>
                        ))}
                      </div>
                    )}

                    {/* Plan Acceptance Button */}
                    {isPlan && !message.planApproved && (
                      <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Project Plan Generated</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptPlan(message.id)}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Accept Plan
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Review the plan below and click accept to generate implementation
                        </p>
                      </div>
                    )}

                    {/* Plan Content */}
                    {isPlan && (
                      <div className="mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between mb-2 hover:bg-muted/50"
                          onClick={() => togglePlanExpansion(message.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <span className="font-medium">View Plan Details</span>
                          </div>
                          {isExpanded ? (
                            <Minimize2 className="w-4 h-4" />
                          ) : (
                            <Maximize2 className="w-4 h-4" />
                          )}
                        </Button>
                        
                        {isExpanded && plan && (
                          <div className="space-y-4 p-3 rounded-lg bg-background/50 border border-border/50 animate-in fade-in-50">
                            {/* Plan Header */}
                            <div className="space-y-2">
                              <h3 className="font-bold text-lg">{plan.title}</h3>
                              <p className="text-sm text-muted-foreground">{plan.summary}</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getComplexityColor(plan.complexity)}>
                                  {plan.complexity} complexity
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  {plan.estimatedTime}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Code2 className="w-3 h-3" />
                                  {plan.files.length} files
                                </Badge>
                              </div>
                            </div>

                            {/* Features Section */}
                            {plan.features.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">Features</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => approveAllFeatures(message.id)}
                                    className="h-7 text-xs"
                                  >
                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                    Approve All
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {plan.features.map((feature) => (
                                    <div 
                                      key={feature.id}
                                      className={cn(
                                        "flex items-start gap-3 p-2 rounded-lg border transition-all duration-200",
                                        feature.approved
                                          ? "bg-emerald-500/10 border-emerald-500/20"
                                          : "bg-background/80 border-border/50"
                                      )}
                                    >
                                      <Switch
                                        checked={feature.approved}
                                        onCheckedChange={() => toggleFeatureApproval(message.id, feature.id)}
                                        className="data-[state=checked]:bg-emerald-500"
                                      />
                                      <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium">{feature.name}</span>
                                          <Badge variant="outline" className={getPriorityColor(feature.priority)}>
                                            {feature.priority}
                                          </Badge>
                                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            {getEffortIcon(feature.effort)}
                                            {feature.effort} effort
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Files Section */}
                            {plan.files.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-semibold">Files to Create</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                  {plan.files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                                      <FilePlus className="w-3.5 h-3.5 text-muted-foreground" />
                                      <code className="text-xs font-mono truncate">{file}</code>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional Sections */}
                            {plan.sections && plan.sections.length > 0 && (
                              <div className="space-y-3">
                                {plan.sections.map((section, idx) => (
                                  <div key={idx} className="space-y-1.5">
                                    <h4 className="font-semibold text-sm">{section.title}</h4>
                                    <ul className="space-y-1">
                                      {section.items.map((item, itemIdx) => (
                                        <li key={itemIdx} className="flex items-start gap-2 text-sm">
                                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message text */}
                    <div className="whitespace-pre-wrap break-words chat-message-content">
                      {message.content.split('\n').map((line, idx) => {
                        // Enhanced markdown parsing
                        if (line.startsWith('# ')) {
                          return <h1 key={idx} className="text-xl font-bold mt-3 mb-2 text-foreground">{line.substring(2)}</h1>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={idx} className="text-lg font-semibold mt-3 mb-1.5 text-foreground">{line.substring(3)}</h2>;
                        }
                        if (line.startsWith('### ')) {
                          return <h3 key={idx} className="text-base font-medium mt-2 mb-1 text-foreground">{line.substring(4)}</h3>;
                        }
                        
                        // Bold text with **
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={idx} className="mb-1.5">
                              {parts.map((part, i) => 
                                i % 2 === 1 ? (
                                  <strong key={i} className="font-semibold text-foreground">{part}</strong>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                          );
                        }
                        
                        // Code blocks
                        if (line.includes('`')) {
                          const parts = line.split('`');
                          return (
                            <p key={idx} className="mb-1.5">
                              {parts.map((part, i) => 
                                i % 2 === 1 ? (
                                  <code key={i} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                    {part}
                                  </code>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                          );
                        }
                        
                        // Bullet points
                        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                          const text = line.trim().substring(2);
                          const isFeature = /feature|component|page|api|auth/i.test(text);
                          const isFile = /\.(tsx|ts|jsx|js|css|html|txt|md|json|py|java|cpp)$/i.test(text);
                          
                          return (
                            <div key={idx} className="flex items-start gap-2 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                              <span className={cn(
                                isFeature && "font-medium bg-primary/5 px-2 py-1 rounded",
                                isFile && "font-mono text-sm bg-muted px-2 py-1 rounded"
                              )}>
                                {text}
                              </span>
                            </div>
                          );
                        }
                        
                        // Numbered list
                        if (/^\d+\.\s/.test(line.trim())) {
                          const num = line.trim().match(/^\d+/)?.[0];
                          const text = line.trim().replace(/^\d+\.\s/, '');
                          return (
                            <div key={idx} className="flex items-start gap-2 mt-1">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {num}
                              </div>
                              <span>{text}</span>
                            </div>
                          );
                        }
                        
                        // Regular text
                        if (line.trim()) {
                          return <p key={idx} className="mb-1.5 leading-relaxed">{line}</p>;
                        }
                        
                        return <br key={idx} />;
                      })}
                    </div>

                    {/* Copy button */}
                    {message.role === 'assistant' && message.content && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="mt-3 h-7 w-7 rounded-lg hover:bg-muted/50 transition-all"
                        onClick={() => handleCopy(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 animate-pulse">
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isCreatingPlan ? 'Creating detailed plan...' : 'Generating response...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isCreatingPlan ? 'Analyzing requirements and structuring plan...' : 'Thinking...'}
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Image Preview Modal */}
        {showImagePreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <span className="font-medium">Image Preview</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImagePreview(null)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto">
                <img 
                  src={showImagePreview} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Attached Files Bar */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-3 border-t border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{attachedFiles.length} file(s) attached</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachedFiles([])}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
            
            <div className="flex gap-2 overflow-x-auto mt-2 pb-1">
              {attachedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className={cn(
                    "bg-muted/50 rounded-lg p-2 flex items-center gap-2 text-xs shrink-0 border border-border/50 hover:border-primary/30 transition-all duration-200 group",
                    file.type === 'image' && "cursor-pointer"
                  )}
                  onClick={() => file.type === 'image' && setShowImagePreview(file.url)}
                >
                  {file.type === 'image' ? (
                    <>
                      <div className="relative">
                        <img 
                          src={file.url} 
                          alt={file.name} 
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded flex items-center justify-center">
                          <Eye className="w-3 h-3 text-white/0 group-hover:text-white/80 transition-all" />
                        </div>
                      </div>
                      <span className="max-w-[80px] truncate">{file.name}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="max-w-[100px] truncate">{file.name}</span>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-5 w-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(file.id);
                    }}
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Input Area with Glass Effect */}
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl sticky bottom-0 z-40 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreatePlan}
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className={cn(
                  "border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all",
                  isCreatingPlan && "bg-primary/10 border-primary/50"
                )}
              >
                <Target className="w-3.5 h-3.5 mr-1.5" />
                {isCreatingPlan ? 'Creating Plan...' : 'Create Plan'}
              </Button>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 rounded-lg hover:bg-primary/10"
                  title="Upload files"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  className="h-8 w-8 rounded-lg hover:bg-primary/10"
                  title="Upload images"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.java,.cpp"
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                  multiple
                  accept="image/*"
                />
              </div>
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe what you want to build, ask a question, or upload files..."
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none min-h-[60px] max-h-[150px] shadow-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {input.length > 0 && `${input.length} chars`}
                  </span>
                </div>
              </div>
              <Button
                size="default"
                onClick={handleSend}
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className="h-[52px] px-6 min-w-[60px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Help Text */}
            <div className="flex items-center justify-between text-xs text-muted-foreground/70">
              <div className="flex items-center gap-4">
                <span>Press Enter to send • Shift+Enter for new line</span>
                {attachedFiles.length > 0 && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Files will be included in analysis
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {extractedPlans.size > 0 && (
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {extractedPlans.size} plan(s) generated
                  </span>
                )}
                {isCreatingPlan && (
                  <span className="flex items-center gap-1 text-blue-500 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    Creating structured plan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for chat messages */}
      <style jsx>{`
        .chat-message-content h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }
        
        .chat-message-content h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.375rem;
          color: hsl(var(--foreground));
        }
        
        .chat-message-content h3 {
          font-size: 1rem;
          font-weight: 500;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          color: hsl(var(--foreground));
        }
        
        .chat-message-content code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
          background: hsl(var(--muted));
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          border: 1px solid hsl(var(--border));
        }
        
        .chat-message-content pre {
          background: hsl(var(--muted));
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        
        .chat-message-content ul, .chat-message-content ol {
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        
        .chat-message-content li {
          margin: 0.25rem 0;
        }
        
        .chat-message-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-decoration-color: hsl(var(--primary) / 0.3);
          transition: text-decoration-color 0.2s;
        }
        
        .chat-message-content a:hover {
          text-decoration-color: hsl(var(--primary));
        }
        
        /* Custom scrollbar for the messages area */
        .scroll-area-viewport::-webkit-scrollbar {
          width: 6px;
        }
        
        .scroll-area-viewport::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.3);
          border-radius: 3px;
        }
        
        .scroll-area-viewport::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
          transition: background 0.2s;
        }
        
        .scroll-area-viewport::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.2s, border-color 0.2s, transform 0.2s;
        }
      `}</style>
    </div>
  );
};
