import { useState } from 'react';
import { Terminal, Trash2, AlertCircle, Info, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

interface ConsolePanelProps {
  logs: LogEntry[];
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const LogIcon = ({ type }: { type: LogEntry['type'] }) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case 'warn':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'info':
      return <Info className="w-4 h-4 text-info" />;
    default:
      return <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">›</span>;
  }
};

export const ConsolePanel = ({ logs, onClear, isExpanded, onToggleExpand }: ConsolePanelProps) => {
  return (
    <div className={cn(
      "bg-editor border-t border-border flex flex-col transition-all duration-300",
      isExpanded ? "h-48" : "h-10"
    )}>
      {/* Header */}
      <div 
        className="h-10 min-h-[40px] bg-editor-gutter border-b border-border/50 flex items-center justify-between px-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Console</span>
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Log Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">
              No console output yet
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-2 py-1 px-2 rounded hover:bg-secondary/30 transition-colors",
                  log.type === 'error' && "bg-destructive/10",
                  log.type === 'warn' && "bg-warning/10"
                )}
              >
                <LogIcon type={log.type} />
                <span className={cn(
                  "flex-1",
                  log.type === 'error' && "text-destructive",
                  log.type === 'warn' && "text-warning",
                  log.type === 'info' && "text-info",
                  log.type === 'log' && "text-foreground"
                )}>
                  {log.message}
                </span>
                <span className="text-xs text-muted-foreground">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};