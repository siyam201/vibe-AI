import { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitMerge,
  RefreshCw,
  Plus,
  Check,
  X,
  ChevronDown,
  Upload,
  Download,
  FileEdit,
  FilePlus,
  FileMinus,
  Circle,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';

interface ChangedFile {
  id: string;
  name: string;
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
}

interface Commit {
  id: string;
  message: string;
  author: string;
  date: Date;
  hash: string;
}

interface Branch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

// Mock data
const mockChangedFiles: ChangedFile[] = [
  { id: '1', name: 'index.html', path: 'index.html', status: 'modified', staged: false },
  { id: '2', name: 'styles.css', path: 'styles.css', status: 'modified', staged: false },
  { id: '3', name: 'main.js', path: 'main.js', status: 'added', staged: false },
  { id: '4', name: 'old-file.txt', path: 'old-file.txt', status: 'deleted', staged: false },
];

const mockCommits: Commit[] = [
  { id: '1', message: 'Add responsive design', author: 'You', date: new Date(Date.now() - 1000 * 60 * 30), hash: 'a1b2c3d' },
  { id: '2', message: 'Initial commit', author: 'You', date: new Date(Date.now() - 1000 * 60 * 60 * 2), hash: 'e4f5g6h' },
  { id: '3', message: 'Setup project structure', author: 'You', date: new Date(Date.now() - 1000 * 60 * 60 * 24), hash: 'i7j8k9l' },
];

const mockBranches: Branch[] = [
  { name: 'main', isCurrent: true, isRemote: false },
  { name: 'develop', isCurrent: false, isRemote: false },
  { name: 'feature/new-ui', isCurrent: false, isRemote: false },
  { name: 'origin/main', isCurrent: false, isRemote: true },
];

export const GitPanel = () => {
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>(mockChangedFiles);
  const [commits] = useState<Commit[]>(mockCommits);
  const [branches] = useState<Branch[]>(mockBranches);
  const [commitMessage, setCommitMessage] = useState('');
  const [showChanges, setShowChanges] = useState(true);
  const [showCommits, setShowCommits] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const currentBranch = branches.find(b => b.isCurrent)?.name || 'main';
  const stagedFiles = changedFiles.filter(f => f.staged);
  const unstagedFiles = changedFiles.filter(f => !f.staged);

  const getStatusIcon = (status: ChangedFile['status']) => {
    switch (status) {
      case 'modified': return <FileEdit className="w-3.5 h-3.5 text-yellow-500" />;
      case 'added': return <FilePlus className="w-3.5 h-3.5 text-green-500" />;
      case 'deleted': return <FileMinus className="w-3.5 h-3.5 text-red-500" />;
      case 'untracked': return <Circle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: ChangedFile['status']) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      case 'untracked': return 'U';
    }
  };

  const toggleStaged = (fileId: string) => {
    setChangedFiles(files =>
      files.map(f => f.id === fileId ? { ...f, staged: !f.staged } : f)
    );
  };

  const stageAll = () => {
    setChangedFiles(files => files.map(f => ({ ...f, staged: true })));
    toast.success('All changes staged');
  };

  const unstageAll = () => {
    setChangedFiles(files => files.map(f => ({ ...f, staged: false })));
    toast.success('All changes unstaged');
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }
    if (stagedFiles.length === 0) {
      toast.error('No changes staged for commit');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setChangedFiles(files => files.filter(f => !f.staged));
      setCommitMessage('');
      setIsLoading(false);
      toast.success('Changes committed successfully');
    }, 800);
  };

  const handlePush = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Pushed to remote');
    }, 1000);
  };

  const handlePull = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Pulled latest changes');
    }, 1000);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Repository refreshed');
    }, 500);
  };

  const formatDate = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e]">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Source Control</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="truncate">{currentBranch}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {branches.filter(b => !b.isRemote).map(branch => (
                <DropdownMenuItem key={branch.name} className="gap-2">
                  {branch.isCurrent && <Check className="w-3.5 h-3.5" />}
                  <span className={cn(!branch.isCurrent && "ml-5")}>{branch.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="gap-2 text-primary">
                <Plus className="w-3.5 h-3.5" />
                Create new branch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePull} disabled={isLoading}>
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePush} disabled={isLoading}>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Commit Input */}
          <div className="space-y-2">
            <Input
              placeholder="Commit message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="h-8 text-sm bg-background/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            />
            <Button
              size="sm"
              className="w-full gap-2"
              onClick={handleCommit}
              disabled={isLoading || stagedFiles.length === 0}
            >
              <GitCommit className="w-3.5 h-3.5" />
              Commit {stagedFiles.length > 0 && `(${stagedFiles.length})`}
            </Button>
          </div>

          {/* Changes Section */}
          <Collapsible open={showChanges} onOpenChange={setShowChanges}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 group">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  !showChanges && "-rotate-90"
                )} />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Changes ({changedFiles.length})
                </span>
              </div>
              {changedFiles.length > 0 && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => { e.stopPropagation(); stageAll(); }}
                    title="Stage all"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => { e.stopPropagation(); unstageAll(); }}
                    title="Unstage all"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2">
              {/* Staged Files */}
              {stagedFiles.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">Staged</span>
                  {stagedFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 group cursor-pointer"
                      onClick={() => toggleStaged(file.id)}
                    >
                      <Checkbox checked={true} className="h-3.5 w-3.5" />
                      {getStatusIcon(file.status)}
                      <span className="flex-1 text-sm truncate">{file.path}</span>
                      <span className={cn(
                        "text-[10px] font-mono",
                        file.status === 'modified' && "text-yellow-500",
                        file.status === 'added' && "text-green-500",
                        file.status === 'deleted' && "text-red-500"
                      )}>
                        {getStatusLabel(file.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Unstaged Files */}
              {unstagedFiles.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">Changes</span>
                  {unstagedFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 group cursor-pointer"
                      onClick={() => toggleStaged(file.id)}
                    >
                      <Checkbox checked={false} className="h-3.5 w-3.5" />
                      {getStatusIcon(file.status)}
                      <span className="flex-1 text-sm truncate">{file.path}</span>
                      <span className={cn(
                        "text-[10px] font-mono",
                        file.status === 'modified' && "text-yellow-500",
                        file.status === 'added' && "text-green-500",
                        file.status === 'deleted' && "text-red-500"
                      )}>
                        {getStatusLabel(file.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {changedFiles.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No changes detected
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Commits Section */}
          <Collapsible open={showCommits} onOpenChange={setShowCommits}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full py-1">
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-transform",
                !showCommits && "-rotate-90"
              )} />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent Commits
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2">
              {commits.map(commit => (
                <div
                  key={commit.id}
                  className="flex items-start gap-2 px-2 py-2 rounded hover:bg-accent/50 cursor-pointer"
                >
                  <GitCommit className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{commit.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono">{commit.hash}</span>
                      <span>•</span>
                      <span>{formatDate(commit.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <GitPullRequest className="w-3.5 h-3.5" />
            PR
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <GitMerge className="w-3.5 h-3.5" />
            Merge
          </Button>
        </div>
      </div>
    </div>
  );
};
