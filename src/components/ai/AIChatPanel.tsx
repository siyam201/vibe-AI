import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Loader2, Bot, User, Copy, Check, Code,
  FilePlus, FileEdit, Trash2, Play, ChevronDown, ChevronUp, 
  History, Plus, Terminal, Layout, Command, Cpu
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
  { icon: FilePlus, label: 'Create', prompt: 'Create a new file called ' },
  { icon: FileEdit, label: 'Edit', prompt: 'Edit the file ' },
  { icon: Layout, label: 'UI Fix', prompt: 'Fix the UI layout of ' },
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
  } = useChatHistory(projectId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'আসসালামু আলাইকুম সিয়াম ভাই! আমি আপনার ফাইল এডিট বা নতুন কোড লিখতে সাহায্য করতে পারি। কি করতে হবে বলুন?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dbMessages.length > 0) {
      setMessages(dbMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
        operations: m.operations as FileOperation[],
      })));
    }
  }, [dbMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    let convId = currentConversation?.id;
    if (user && !convId) {
      const newConv = await createConversation();
      convId = newConv?.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (user && convId) await addMessage(convId, 'user', messageText.trim());

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) 
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const assistantRaw = data.choices?.[0]?.message?.content || "";
      const { operations, cleanText } = parseFileOperations(assistantRaw);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText,
        timestamp: new Date(),
        operations
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (user && convId) await addMessage(convId, 'assistant', cleanText, operations);
      if (operations.length > 0) onFileOperations(operations);

    } catch (error) {
      toast.error('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOperationBadge = (op: FileOperation) => (
    <div className="flex items-center gap-2 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400">
      {op.type === 'create' ? <FilePlus className="w-3 h-3" /> : <FileEdit className="w-3 h-3" />}
      <span className="truncate max-w-[150px]">{op.path}</span>
    </div>
  );

  return (
    <div className="h-full flex bg-[#0a0a0f] text-slate-300 font-sans selection:bg-indigo-500/30">
      {user && (
        <ChatHistorySidebar
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          isCollapsed={!showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onSelectConversation={loadConversation}
          onNewChat={() => setMessages([{ id: '1', role: 'assistant', content: 'New session started, Siyam.', timestamp: new Date() }])}
          onDeleteConversation={deleteConversation}
          loading={historyLoading}
        />
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Modern Header */}
        <header className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  VIBE ENGINE <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-indigo-400 uppercase">v2.1</span>
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-500 font-medium">SYSTEM READY</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="h-8 w-8 hover:bg-white/5">
                <History className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Quick Actions Bar */}
        <div className="flex gap-2 p-3 bg-white/[0.02] border-b border-white/5 overflow-x-auto no-scrollbar">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => setInput(action.prompt)}
              className="h-7 text-[10px] bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-400 rounded-full"
            >
              <action.icon className="w-3 h-3 mr-1.5 text-indigo-400" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6 max-w-3xl mx-auto">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col gap-2", m.role === 'user' ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 px-1">
                  {m.role === 'assistant' && <Bot className="w-3 h-3 text-indigo-500" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {m.role === 'user' ? 'Developer' : 'Vibe AI'}
                  </span>
                  {m.role === 'user' && <User className="w-3 h-3 text-indigo-500" />}
                </div>

                <div className={cn(
                  "relative group max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed transition-all",
                  m.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-900/20" 
                    : "bg-white/[0.03] border border-white/10 text-slate-200 rounded-tl-none"
                )}>
                  {m.operations && m.operations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-white/10">
                      {m.operations.map((op, i) => <div key={i}>{renderOperationBadge(op)}</div>)}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Code Block Handling */}
                  {m.content.includes('```') && (
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-12 top-0 flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-black/50 border border-white/10"><Copy className="w-3 h-3" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs font-medium text-slate-400 animate-pulse italic">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Floating Input Area */}
        <div className="p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative bg-[#12121e] border border-white/10 rounded-2xl p-2 shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                placeholder="সিয়াম ভাই, কি করতে হবে বলুন..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 min-h-[80px] max-h-[200px] resize-none text-white placeholder:text-slate-600"
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex gap-1 text-[10px] text-slate-500 font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 flex items-center gap-1">
                    <Command className="w-3 h-3" /> ENTER TO SEND
                  </span>
                </div>
                <Button 
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "h-10 px-4 rounded-xl transition-all",
                    input.trim() ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40" : "bg-slate-800 text-slate-600"
                  )}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-4 tracking-widest uppercase font-bold">
            Vibe AI Interface • Optimized for Low-Memory Systems
          </p>
        </div>
      </div>
    </div>
  );
};
