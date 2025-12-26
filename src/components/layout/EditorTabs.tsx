import { X, FileCode, FileText, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  name: string;
  extension?: string;
  isModified?: boolean;
}

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

const getTabIcon = (extension?: string) => {
  switch (extension) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return <FileCode className="w-3.5 h-3.5 text-warning" />;
    case 'html':
      return <FileCode className="w-3.5 h-3.5 text-destructive" />;
    case 'css':
      return <FileCode className="w-3.5 h-3.5 text-info" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-warning" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

export const EditorTabs = ({ tabs, activeTabId, onTabClick, onTabClose }: EditorTabsProps) => {
  return (
    <div className="h-10 bg-editor-gutter border-b border-border flex items-center overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={cn(
            "group flex items-center gap-2 h-full px-4 border-r border-border/50 text-sm transition-all duration-200 min-w-[120px]",
            activeTabId === tab.id
              ? "bg-editor text-foreground border-t-2 border-t-primary"
              : "bg-editor-gutter text-muted-foreground hover:bg-secondary/50 hover:text-foreground border-t-2 border-t-transparent"
          )}
        >
          {getTabIcon(tab.extension)}
          <span className="truncate flex-1">{tab.name}</span>
          {tab.isModified && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-secondary rounded p-0.5 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </button>
      ))}
    </div>
  );
};