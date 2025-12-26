import { useState } from 'react';
import { 
  FileCode, 
  FileJson, 
  FileText, 
  Search, 
  X,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  path?: string;
  type: 'file' | 'folder';
  extension?: string;
}

interface FileSearchPanelProps {
  files: FileItem[];
  onFileSelect: (id: string) => void;
  onClose: () => void;
}

const getFileIcon = (extension?: string) => {
  switch (extension) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-warning" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-warning" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-destructive" />;
    case 'css':
      return <FileCode className="w-4 h-4 text-info" />;
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
};

export const FileSearchPanel = ({ files, onFileSelect, onClose }: FileSearchPanelProps) => {
  const [search, setSearch] = useState('');

  const flattenFiles = (items: any[], path = ''): FileItem[] => {
    let result: FileItem[] = [];
    for (const item of items) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      if (item.type === 'file') {
        result.push({ ...item, path: itemPath });
      }
      if (item.children) {
        result = [...result, ...flattenFiles(item.children, itemPath)];
      }
    }
    return result;
  };

  const allFiles = flattenFiles(files as any[]);
  const filteredFiles = allFiles.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.path?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Files</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a file"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file.id)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors"
          >
            {getFileIcon(file.extension)}
            <div className="flex-1 text-left">
              <div className="text-sm text-foreground">{file.name}</div>
              {file.path && (
                <div className="text-xs text-muted-foreground">{file.path}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
