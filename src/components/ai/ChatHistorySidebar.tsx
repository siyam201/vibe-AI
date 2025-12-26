import { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatConversation } from '@/hooks/useChatHistory';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistorySidebarProps {
  conversations: ChatConversation[];
  currentConversationId?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  loading?: boolean;
}

export const ChatHistorySidebar = ({
  conversations,
  currentConversationId,
  isCollapsed,
  onToggle,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  loading,
}: ChatHistorySidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-border bg-background/50 flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-2"
          onClick={onToggle}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onNewChat}
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <div className="text-[10px] text-muted-foreground -rotate-90 whitespace-nowrap">
          {conversations.length} chats
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 border-r border-border bg-background/50 flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Chat History</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={onNewChat}
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs bg-secondary/50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative rounded-md transition-colors cursor-pointer",
                  conv.id === currentConversationId
                    ? "bg-primary/10"
                    : "hover:bg-secondary/50"
                )}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectConversation(conv)}
              >
                <div className="px-2 py-2">
                  <div className="flex items-start gap-2">
                    <MessageSquare className={cn(
                      "w-3.5 h-3.5 mt-0.5 shrink-0",
                      conv.id === currentConversationId ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs font-medium truncate",
                        conv.id === currentConversationId && "text-primary"
                      )}>
                        {conv.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {conv.messageCount} messages • {formatDate(conv.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Delete button */}
                {hoveredId === conv.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};