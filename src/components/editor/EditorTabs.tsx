import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface EditorTab {
  id: string;
  name: string;
  language: string;
  isDirty?: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const getLanguageColor = (language: string) => {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return 'bg-yellow-500';
    case 'html':
      return 'bg-orange-500';
    case 'css':
      return 'bg-blue-500';
    case 'json':
      return 'bg-yellow-600';
    case 'python':
      return 'bg-green-500';
    default:
      return 'bg-muted';
  }
};

export const EditorTabs = ({ tabs, activeTabId, onTabSelect, onTabClose }: EditorTabsProps) => {
  return (
    <div className="flex items-center gap-0.5 bg-[#1a1a2e] px-2 border-b border-border overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 cursor-pointer border-b-2 transition-colors",
            activeTabId === tab.id
              ? "bg-editor border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className={cn("w-2 h-2 rounded-full", getLanguageColor(tab.language))} />
          <span className="text-sm whitespace-nowrap">
            {tab.name}
            {tab.isDirty && <span className="text-primary ml-1">•</span>}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:bg-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};
