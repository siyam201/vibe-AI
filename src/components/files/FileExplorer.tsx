import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  FileCode,
  FileJson,
  FileText,
  Image,
  MoreHorizontal,
  FolderPlus,
  FilePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
}

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string | null;
  onFileSelect: (file: FileItem) => void;
  onFileCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newName: string) => void;
}

const getFileIcon = (extension?: string) => {
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-500" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-500" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'md':
      return <FileText className="w-4 h-4 text-muted-foreground" />;
    case 'png':
    case 'jpg':
    case 'svg':
    case 'gif':
      return <Image className="w-4 h-4 text-purple-400" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
};

interface FileTreeItemProps {
  item: FileItem;
  depth: number;
  activeFileId: string | null;
  onFileSelect: (file: FileItem) => void;
  onFileCreate: (parentId: string | null, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newName: string) => void;
}

const FileTreeItem = ({ 
  item, 
  depth, 
  activeFileId, 
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename
}: FileTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const handleRename = () => {
    if (newName.trim() && newName !== item.name) {
      onFileRename(item.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const isActive = item.id === activeFileId;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors",
          isActive ? "bg-primary/20 text-primary" : "hover:bg-secondary text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            setIsExpanded(!isExpanded);
          } else {
            onFileSelect(item);
          }
        }}
      >
        {item.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-500" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            {getFileIcon(item.extension)}
          </>
        )}
        
        {isRenaming ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="h-5 py-0 px-1 text-xs bg-background"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm truncate flex-1">{item.name}</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {item.type === 'folder' && (
              <>
                <DropdownMenuItem onClick={() => onFileCreate(item.id, 'untitled.js', 'file')}>
                  <FilePlus className="w-4 h-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFileCreate(item.id, 'new-folder', 'folder')}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onFileDelete(item.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onFileCreate={onFileCreate}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer = ({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
}: FileExplorerProps) => {
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file');

  const handleCreateNew = () => {
    if (newFileName.trim()) {
      onFileCreate(null, newFileName.trim(), newFileType);
      setNewFileName('');
      setShowNewFileDialog(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar overflow-hidden">
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {files.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            depth={0}
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
          />
        ))}
      </div>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {newFileType === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder={newFileType === 'file' ? 'filename.js' : 'folder-name'}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNew}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
