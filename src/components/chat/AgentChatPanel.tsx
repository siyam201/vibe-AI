import { useState, useRef, useEffect } from 'react';
import { 
  RotateCcw, Zap, Paperclip, CheckCircle2, FileCode, Pencil, 
  Trash2, Package, Wrench, Loader2, Sparkles, Send, Bot,
  Bug, FilePlus, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- মেসেজ এবং অ্যাকশন টাইপ ---
export interface AIAction {
  type: 'file_create' | 'file_edit' | 'file_delete' | 'install_package' | 'fix_error';
  path?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'streaming' | 'done';
  actions?: AIAction[];
}

interface AgentChatPanelProps {
  projectName: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const AgentChatPanel = ({ projectName, messages, isLoading, onSendMessage }: AgentChatPanelProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] text-slate-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Copilot</h3>
            <p className="text-[10px] text-slate-500 font-medium">{projectName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white"><RotateCcw className="w-4 h-4" /></Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-white font-bold mb-2">Build something amazing</h4>
            <p className="text-sm text-slate-500 max-w-[240px]">Tell me what you want to build, and I'll handle the code for you.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
              )}>
                {msg.content}
              </div>
              
              {/* Actions list */}
              {msg.actions?.map((action, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="font-bold uppercase tracking-tighter">{action.type.replace('_', ' ')}:</span>
                  <code className="text-emerald-300">{action.path}</code>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Action Buttons */}
      <div className="px-4 py-3 border-t border-white/5 bg-black/20">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          <Button variant="outline" size="sm" className="h-8 text-[11px] bg-white/5 border-white/10 hover:border-indigo-500/50 gap-2 rounded-full whitespace-nowrap">
            <FilePlus className="w-3.5 h-3.5 text-emerald-400" /> Create File
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] bg-white/5 border-white/10 hover:border-indigo-500/50 gap-2 rounded-full whitespace-nowrap">
            <Pencil className="w-3.5 h-3.5 text-blue-400" /> Edit File
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] bg-white/5 border-white/10 hover:border-indigo-500/50 gap-2 rounded-full whitespace-nowrap">
            <Bug className="w-3.5 h-3.5 text-rose-400" /> Fix Bug
          </Button>
        </div>

        {/* Chat Input */}
        <div className="relative bg-[#16162a] border border-white/[0.08] rounded-2xl focus-within:border-indigo-500/50 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Describe your next feature..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm p-4 min-h-[100px] resize-none placeholder:text-slate-600 text-white"
          />
          <div className="flex items-center justify-between p-2 border-t border-white/5">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-400"><Paperclip className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-400"><Zap className="w-4 h-4" /></Button>
            </div>
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "h-9 w-9 rounded-xl transition-all",
                input.trim() ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-800 text-slate-600"
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
