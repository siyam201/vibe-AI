import { useState } from 'react';
import { 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Sparkles,
  Settings,
  FolderPlus,
  FilePlus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileItem[];
}

interface SidebarProps {
  files: FileItem[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onNewFile: () => void;
  onNewFolder: () => void;
}

const getFileIcon = (extension?: string) => {
  switch (extension) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-warning" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-destructive" />;
    case 'css':
      return <FileCode className="w-4 h-4 text-info" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-warning" />;
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
};

const FileTreeItem = ({ 
  item, 
  depth = 0,
  activeFileId,
  onFileSelect 
}: { 
  item: FileItem; 
  depth?: number;
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = item.type === 'folder';
  const isActive = item.id === activeFileId;

  return (
    <div className="animate-slide-in" style={{ animationDelay: `${depth * 50}ms` }}>
      <button
        onClick={() => isFolder ? setIsOpen(!isOpen) : onFileSelect(item.id)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-200 group",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        {isFolder ? (
          <FolderOpen className={cn(
            "w-4 h-4 transition-colors",
            isOpen ? "text-primary" : "text-muted-foreground"
          )} />
        ) : (
          getFileIcon(item.extension)
        )}
        <span className="truncate flex-1 text-left">{item.name}</span>
        <MoreHorizontal className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" />
      </button>
      
      {isFolder && isOpen && item.children && (
        <div className="relative">
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-border/50" 
            style={{ marginLeft: `${depth * 12 + 16}px` }}
          />
          {item.children.map((child) => (
            <FileTreeItem 
              key={child.id} 
              item={child} 
              depth={depth + 1}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ files, activeFileId, onFileSelect, onNewFile, onNewFolder }: SidebarProps) => {
  return (
    <aside className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">Vibe Code</h1>
            <p className="text-xs text-muted-foreground">my-project</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <Button 
            variant="editor" 
            size="sm" 
            className="flex-1"
            onClick={onNewFile}
          >
            <FilePlus className="w-4 h-4" />
            <span>File</span>
          </Button>
          <Button 
            variant="editor" 
            size="sm" 
            className="flex-1"
            onClick={onNewFolder}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Folder</span>
          </Button>
        </div>
      </div>

      {/* File Explorer */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
          Explorer
        </div>
        {files.map((item) => (
          <FileTreeItem 
            key={item.id} 
            item={item}
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Button>
      </div>
    </aside>
  );
};