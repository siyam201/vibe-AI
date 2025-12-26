import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Copy, 
  Check,
  Code,
  FilePlus,
  FileEdit,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseFileOperations, FileOperation } from '@/hooks/useFileOperations';
import { useChatHistory, ChatMessage as DBChatMessage } from '@/hooks/useChatHistory';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operations?: FileOperation[];
}

interface AIChatPanelProps {
  onInsertCode: (code: string) => void;
  onFileOperations: (operations: FileOperation[]) => void;
  currentFiles: { path: string; content: string }[];
  queuedMessage?: { id: string; content: string } | null;
  onQueuedMessageHandled?: (id: string) => void;
  projectId?: string;
}

const quickActions = [
  { icon: FilePlus, label: 'Create File', prompt: 'Create a new file called ' },
  { icon: FileEdit, label: 'Edit File', prompt: 'Edit the file ' },
  { icon: Trash2, label: 'Delete File', prompt: 'Delete the file ' },
];

const testPrompts = [
  { label: '🚀 Landing Page', prompt: 'Create a modern landing page with hero section, features, and footer' },
  { label: '📝 Todo App', prompt: 'Create a todo app with add, complete, and delete functionality' },
  { label: '🎨 Dashboard', prompt: 'Create a dashboard with stats cards and a chart section' },
  { label: '🔐 Login Form', prompt: 'Create a beautiful login form with email and password fields' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export const AIChatPanel = ({
  onInsertCode,
  onFileOperations,
  currentFiles,
  queuedMessage,
  onQueuedMessageHandled,
  projectId,
}: AIChatPanelProps) => {
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
    clearCurrentConversation,
    setMessages: setDbMessages,
  } = useChatHistory(projectId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '👋 Hi! I\'m Vibe AI. I can:\n\n• **Create** new files\n• **Edit** existing files\n• **Delete** files\n\nTry: "Create a button component" or "Add hover effect to styles.css"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Ensure we have a conversation (create if not logged in or no current)
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
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
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
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

      // Process remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
            }
          } catch {
            /* ignore */
          }
        }
      }

      // Parse and execute file operations
      const { operations, cleanText } = parseFileOperations(assistantContent);

      console.log('[AIChatPanel] Parsed operations:', operations);
      console.log('[AIChatPanel] Clean text:', cleanText.substring(0, 100));

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
        console.log('[AIChatPanel] Executing', operations.length, 'operations');
        onFileOperations(operations);

        // Show detailed toast for each operation
        operations.forEach((op) => {
          const action = op.type === 'create' ? 'Created' : op.type === 'edit' ? 'Updated' : 'Deleted';
          toast.success(`${action}: ${op.path}`);
        });
      } else {
        console.log('[AIChatPanel] No file operations found in response');
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
    await sendMessage(input);
  };

  useEffect(() => {
    if (!queuedMessage?.content?.trim()) return;
    if (isLoading) return;

    void sendMessage(queuedMessage.content);
    onQueuedMessageHandled?.(queuedMessage.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          '👋 Hi! I\'m Vibe AI. I can:\n\n• **Create** new files\n• **Edit** existing files\n• **Delete** files\n\nTry: "Create a button component" or "Add hover effect to styles.css"',
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

  return (
    <div className="h-full flex">
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
      <div className="flex-1 flex flex-col bg-[#1a1a2e]">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">Vibe AI</h2>
                <p className="text-xs text-muted-foreground">
                  {currentConversation ? currentConversation.title : 'File Operations Enabled'}
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
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setInput(action.prompt)}
                title={action.label}
              >
                <action.icon className="w-3 h-3" />
              </Button>
            ))}
          </div>
          
          {/* Test Templates */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs justify-between"
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
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
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
                "flex-1 rounded-lg p-3 text-sm",
                message.role === 'user'
                  ? "bg-primary/10 text-foreground"
                  : "bg-secondary/50 text-foreground"
              )}>
                {/* File operations badges */}
                {message.operations && message.operations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {message.operations.map((op, idx) => (
                      <span key={idx}>{renderOperationBadge(op)}</span>
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {message.content.split('```').map((part, index) => {
                    if (index % 2 === 1) {
                      const [lang, ...codeLines] = part.split('\n');
                      const code = codeLines.join('\n');
                      return (
                        <div key={index} className="my-2 rounded-md overflow-hidden border border-border">
                          <div className="bg-background/50 px-3 py-1.5 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{lang || 'code'}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleCopy(code, `${message.id}-${index}`)}
                              >
                                {copiedId === `${message.id}-${index}` ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onInsertCode(code)}
                              >
                                <Code className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <pre className="bg-background/30 p-3 overflow-x-auto text-xs font-mono">
                            {code}
                          </pre>
                        </div>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 rounded-lg bg-secondary/50 p-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Create, edit, or delete files..."
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              rows={2}
            />
            <Button
              variant="glow"
              size="icon-sm"
              className="absolute right-2 bottom-2"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};