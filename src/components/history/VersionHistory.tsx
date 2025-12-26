import { useState } from 'react';
import { 
  History, 
  ChevronRight, 
  RotateCcw, 
  Eye, 
  GitBranch,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Checkpoint {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  changes: number;
  isCurrent?: boolean;
}

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRollback: (checkpointId: string) => void;
}

const mockCheckpoints: Checkpoint[] = [
  {
    id: '1',
    title: 'Add AI chat functionality',
    description: 'Implemented streaming AI responses and file operations',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    changes: 5,
    isCurrent: true,
  },
  {
    id: '2',
    title: 'Setup project structure',
    description: 'Created initial files and folder structure',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    changes: 12,
  },
  {
    id: '3',
    title: 'Add authentication',
    description: 'Implemented Firebase authentication with Google sign-in',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    changes: 8,
  },
  {
    id: '4',
    title: 'Initial commit',
    description: 'Project created from template',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    changes: 3,
  },
];

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const VersionHistory = ({ isOpen, onClose, onRollback }: VersionHistoryProps) => {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string | null>(null);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {mockCheckpoints.map((checkpoint, index) => (
            <div
              key={checkpoint.id}
              className={cn(
                "relative p-4 rounded-lg border transition-all cursor-pointer",
                selectedCheckpoint === checkpoint.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                checkpoint.isCurrent && "ring-2 ring-green-500/20"
              )}
              onClick={() => setSelectedCheckpoint(checkpoint.id)}
            >
              {/* Timeline connector */}
              {index < mockCheckpoints.length - 1 && (
                <div className="absolute left-[27px] top-[52px] w-0.5 h-[calc(100%+8px)] bg-border" />
              )}

              <div className="flex items-start gap-3">
                {/* Timeline dot */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                  checkpoint.isCurrent
                    ? "bg-green-500 text-white"
                    : "bg-secondary text-muted-foreground"
                )}>
                  {checkpoint.isCurrent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <GitBranch className="w-3 h-3" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {checkpoint.title}
                    </h4>
                    {checkpoint.isCurrent && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {checkpoint.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(checkpoint.timestamp)}
                    </span>
                    <span>{checkpoint.changes} changes</span>
                  </div>

                  {/* Actions */}
                  {selectedCheckpoint === checkpoint.id && !checkpoint.isCurrent && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => {}}
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => onRollback(checkpoint.id)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Rollback
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
