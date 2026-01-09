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
  Image,
  FileText,
  X,
  Paperclip,
  MessageSquare,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseFileOperations, FileOperation } from '@/hooks/useFileOperations';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operations?: FileOperation[];
  attachments?: AttachedFile[];
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
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
      content: '👋 Hi! I\'m your AI Assistant. Tell me what you want to build!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFiles = useCallback((files: File[]) => {
    const newAttachments: AttachedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      size: file.size,
    }));
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
          // Tell the AI to respond in a structured format for features/files
          instructions: "Please provide a clear response with features and files needed. Format features as bullet points and files as a list."
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
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
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
        content: '👋 Hi! I\'m your AI Assistant. Tell me what you want to build!',
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

  return (
    <div className="h-full flex bg-background">
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
      <div 
        className="flex-1 flex flex-col relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl border-2 border-dashed border-primary">
              <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-foreground font-medium">Drop files here</p>
            </div>
          </div>
        )}

        {/* Minimal Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">
                  {currentConversation ? currentConversation.title : 'New Chat'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(showHistory && "bg-muted")}
                >
                  <History className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Simple Chat Mode Indicator */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center justify-center">
            <div className="bg-muted/50 px-3 py-1 rounded-full">
              <span className="text-xs font-medium flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Chat Assistant
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className={cn(
                  "flex-1 rounded-lg p-3 text-sm",
                  message.role === 'user'
                    ? "bg-primary/10 text-foreground"
                    : "bg-muted text-foreground"
                )}>
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {message.attachments.map((file) => (
                        <div key={file.id} className="bg-background rounded p-2 flex items-center gap-2">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          )}
                          <div className="text-xs">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File operations */}
                  {message.operations && message.operations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {message.operations.map((op, idx) => (
                        <span key={idx}>{renderOperationBadge(op)}</span>
                      ))}
                    </div>
                  )}

                  {/* Message text - render markdown-like content */}
                  <div className="whitespace-pre-wrap">
                    {message.content.split('\n').map((line, idx) => {
                      // Check if line is a header
                      if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-lg font-bold mt-2 mb-1">{line.substring(2)}</h1>;
                      }
                      if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-md font-semibold mt-2 mb-1">{line.substring(3)}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-sm font-medium mt-2 mb-1">{line.substring(4)}</h3>;
                      }
                      // Check if line is a feature/item with bullet point
                      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        const text = line.trim().substring(2);
                        const isFeature = text.includes('Feature') || text.includes('feature');
                        const isFile = text.toLowerCase().includes('.txt') || 
                                      text.toLowerCase().includes('.tsx') || 
                                      text.toLowerCase().includes('.ts') ||
                                      text.toLowerCase().includes('.jsx') ||
                                      text.toLowerCase().includes('.js');
                        
                        return (
                          <div key={idx} className="flex items-start gap-2 mt-1">
                            <span className="text-muted-foreground">•</span>
                            <span className={cn(
                              isFeature && "font-medium",
                              isFile && "font-mono text-sm"
                            )}>
                              {text}
                            </span>
                          </div>
                        );
                      }
                      // Regular text
                      return <p key={idx} className="mb-1">{line}</p>;
                    })}
                  </div>

                  {/* Copy button */}
                  {message.role === 'assistant' && message.content && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mt-2 h-6 w-6"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
            {attachedFiles.map((file) => (
              <div key={file.id} className="bg-muted rounded p-2 flex items-center gap-2 text-xs shrink-0">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-6 h-6 object-cover rounded" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground" />
                )}
                <span>{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-4 w-4"
                  onClick={() => removeAttachment(file.id)}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe what you want to build (e.g., 'Create a login system with Supabase Auth')..."
                  className="w-full bg-background border border-input rounded-lg px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[60px]"
                  rows={2}
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.html,.css"
                />
              </div>
              <Button
                size="default"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-[52px] px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
