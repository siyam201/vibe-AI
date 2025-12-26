import { useState, useRef, useEffect } from 'react';
import { 
  RotateCcw, 
  Zap, 
  Settings2, 
  Paperclip,
  Square,
  CheckCircle2,
  ChevronDown,
  ArrowUp,
  FileCode,
  Pencil,
  Trash2,
  Package,
  Wrench,
  Loader2,
  Sparkles,
  Send,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatMessage, AIAction } from '@/hooks/useAIChat';

interface AgentChatPanelProps {
  projectName: string;
  messages: ChatMessage[];
  isLoading: boolean;
  currentAction: string | null;
  onSendMessage: (message: string) => void;
}

const ActionIcon = ({ type }: { type: AIAction['type'] }) => {
  switch (type) {
    case 'file_create': return <FileCode className="w-3 h-3" />;
    case 'file_edit': return <Pencil className="w-3 h-3" />;
    case 'file_delete': return <Trash2 className="w-3 h-3" />;
    case 'install_package': return <Package className="w-3 h-3" />;
    case 'fix_error': return <Wrench className="w-3 h-3" />;
  }
};

const ActionLabel = ({ type }: { type: AIAction['type'] }) => {
  switch (type) {
    case 'file_create': return 'Created';
    case 'file_edit': return 'Edited';
    case 'file_delete': return 'Deleted';
    case 'install_package': return 'Installed';
    case 'fix_error': return 'Fixed';
  }
};

const formatContent = (content: string) => {
  // Remove file operation commands from display
  return content
    .replace(/<<<FILE_CREATE:\{[^>]+\}>>>/g, '')
    .replace(/<<<FILE_EDIT:\{[^>]+\}>>>/g, '')
    .replace(/<<<FILE_DELETE:\{[^>]+\}>>>/g, '')
    .trim();
};

export const AgentChatPanel = ({ 
  projectName, 
  messages, 
  isLoading, 
  currentAction,
  onSendMessage 
}: AgentChatPanelProps) => {
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

  const quickActions = [
    { label: 'Build a landing page', icon: Sparkles },
    { label: 'Add user authentication', icon: Zap },
    { label: 'Create a contact form', icon: FileCode },
  ];

  return (
    <div className="w-[420px] h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-warning flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Vibe AI Agent</span>
            <p className="text-xs text-muted-foreground">{projectName}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Vibe AI Agent</h3>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                Tell me what you want to build. I'll write the code, create files, and help fix errors automatically.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">Try asking:</p>
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onSendMessage(action.label)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-all text-left"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn(
              "rounded-lg animate-fade-in",
              msg.role === 'user' ? "ml-8" : "mr-4"
            )}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-warning flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">Vibe AI</span>
                  {msg.status === 'streaming' && (
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  )}
                </div>
              )}
              
              <div className={cn(
                "p-3 rounded-lg",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary"
              )}>
                <p className="text-sm whitespace-pre-wrap">{formatContent(msg.content) || (msg.status === 'streaming' ? '...' : '')}</p>
              </div>

              {/* Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.actions.map((action, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <ActionIcon type={action.type} />
                      <span>{ActionLabel({ type: action.type })}</span>
                      {action.path && <code className="text-green-300">{action.path}</code>}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        )}

        {/* Current Action Indicator */}
        {isLoading && currentAction && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-primary">{currentAction}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
            placeholder="Describe what you want to build..."
            className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[60px] max-h-[120px]"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Zap className="w-4 h-4" />
                Agent
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
