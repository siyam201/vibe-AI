import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Settings,
  History,
  Terminal,
  Package,
  FolderOpen,
  Loader2,
  Check,
  CloudOff,
  Code2,
  Save,
  Search,
  Zap,
  Moon,
  Sun,
  Layout,
  GitBranch,
  Users,
  Bell,
  HelpCircle,
  Maximize2,
  Minimize2,
  Split,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  Image,
  Database,
  Folder,
  File,
  Trash2,
  Edit2,
  Plus,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { useFileSystem } from '@/hooks/useFileSystem';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
  path?: string;
  lastModified?: string;
}

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

const getLanguage = (extension?: string) => {
  if (!extension) return 'plaintext';
  
  const ext = extension.toLowerCase();
  const map: Record<string, string> = {
    'js': 'javascript', 
    'ts': 'typescript', 
    'jsx': 'javascript', 
    'tsx': 'typescript', 
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'html': 'html', 
    'css': 'css', 
    'scss': 'scss',
    'less': 'less',
    'json': 'json', 
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'shell',
    'svg': 'svg',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'txt': 'plaintext'
  };
  return map[ext] || 'plaintext';
};

// ফাইল এক্সপ্লোরার কম্পোনেন্ট - আপনার পুরোনো ফাইল API ব্যবহার করে
const FileExplorer = ({ 
  files, 
  activeFileId, 
  collapsedFolders,
  onToggleFolder,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onUploadFile
}: {
  files: FileItem[];
  activeFileId: string;
  collapsedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onFileSelect: (file: FileItem) => void;
  onCreateFile: (parentId: string | null, name: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onDeleteFile: (fileId: string, filePath: string) => void;
  onRenameFile: (fileId: string, oldPath: string, newName: string) => void;
  onUploadFile: (file: File, parentPath?: string) => void;
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createName, setCreateName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderFileTree = (items: FileItem[], depth = 0, parentPath = '') => {
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isCollapsed = collapsedFolders.has(item.id);
      const isActive = activeFileId === item.id;
      const isRenaming = renamingId === item.id;
      const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

      return (
        <div key={item.id}>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm group",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-white/10 text-gray-300"
                )}
                style={{ paddingLeft: `${depth * 20 + 12}px` }}
                onClick={() => {
                  if (isFolder) {
                    onToggleFolder(item.id);
                  } else {
                    onFileSelect(item);
                  }
                }}
                onDoubleClick={() => {
                  if (isFolder) {
                    onToggleFolder(item.id);
                  }
                }}
              >
                {isFolder ? (
                  <button
                    className="w-4 h-4 flex items-center justify-center hover:bg-white/20 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFolder(item.id);
                    }}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                ) : (
                  <div className="w-4" />
                )}
                
                {isFolder ? (
                  <Folder className="w-4 h-4 text-blue-400" />
                ) : (
                  getFileIcon(item.name)
                )}
                
                {isRenaming ? (
                  <Input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newName.trim()) {
                        onRenameFile(item.id, currentPath, newName);
                        setRenamingId(null);
                        setNewName('');
                      } else if (e.key === 'Escape') {
                        setRenamingId(null);
                        setNewName('');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-sm flex-1"
                    onBlur={() => {
                      setRenamingId(null);
                      setNewName('');
                    }}
                  />
                ) : (
                  <span className="truncate flex-1">{item.name}</span>
                )}
                
                {!isRenaming && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isFolder && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedFolderId(item.id);
                              setCreateType('file');
                              setCreateName('');
                              setShowCreateDialog(true);
                            }}
                          >
                            <File className="w-4 h-4 mr-2" />
                            New File
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedFolderId(item.id);
                              setCreateType('folder');
                              setCreateName('');
                              setShowCreateDialog(true);
                            }}
                          >
                            <Folder className="w-4 h-4 mr-2" />
                            New Folder
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={() => {
                          setRenamingId(item.id);
                          setNewName(item.name);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                            onDeleteFile(item.id, currentPath);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent className="w-48">
              {isFolder ? (
                <>
                  <ContextMenuItem onClick={() => {
                    setSelectedFolderId(item.id);
                    setCreateType('file');
                    setCreateName('');
                    setShowCreateDialog(true);
                  }}>
                    <File className="w-4 h-4 mr-2" />
                    New File
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => {
                    setSelectedFolderId(item.id);
                    setCreateType('folder');
                    setCreateName('');
                    setShowCreateDialog(true);
                  }}>
                    <Folder className="w-4 h-4 mr-2" />
                    New Folder
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </ContextMenuItem>
                </>
              ) : (
                <ContextMenuItem onClick={() => {
                  setRenamingId(item.id);
                  setNewName(item.name);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </ContextMenuItem>
              )}
              
              <ContextMenuItem 
                className="text-red-600"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                    onDeleteFile(item.id, currentPath);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {isFolder && !isCollapsed && item.children && (
            <div className="ml-4">
              {renderFileTree(item.children, depth + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadFile(file, selectedFolderId || '');
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">EXPLORER</h3>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setCreateType('file');
                    setCreateName('');
                    setShowCreateDialog(true);
                  }}
                >
                  <File className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New File</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setSelectedFolderId(null);
                    setCreateType('folder');
                    setCreateName('');
                    setShowCreateDialog(true);
                  }}
                >
                  <Folder className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Folder</TooltipContent>
            </Tooltip>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload File</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => {
              onCreateFile(null, 'index.html');
              toast.success('Created index.html');
            }}
          >
            HTML
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => {
              onCreateFile(null, 'style.css');
              toast.success('Created style.css');
            }}
          >
            CSS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => {
              onCreateFile(null, 'script.js');
              toast.success('Created script.js');
            }}
          >
            JS
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-1">No files yet</p>
            <p className="text-xs opacity-75 mb-4">Create or upload files to get started</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedFolderId(null);
                setCreateType('file');
                setCreateName('');
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First File
            </Button>
          </div>
        ) : (
          renderFileTree(files)
        )}
      </div>

      {/* Create File/Folder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {createType === 'file' ? 'File Name' : 'Folder Name'}
              </Label>
              <Input
                id="name"
                placeholder={`Enter ${createType} name...`}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createName.trim()) {
                    if (createType === 'file') {
                      onCreateFile(selectedFolderId, createName);
                    } else {
                      onCreateFolder(selectedFolderId, createName);
                    }
                    setShowCreateDialog(false);
                    setCreateName('');
                  }
                }}
                autoFocus
              />
              {createType === 'file' && (
                <p className="text-xs text-gray-500">
                  Include extension (e.g., .js, .tsx, .html, .css)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setCreateName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (createName.trim()) {
                  if (createType === 'file') {
                    onCreateFile(selectedFolderId, createName);
                  } else {
                    onCreateFolder(selectedFolderId, createName);
                  }
                  setShowCreateDialog(false);
                  setCreateName('');
                }
              }}
              disabled={!createName.trim()}
            >
              Create {createType === 'file' ? 'File' : 'Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ফাইল আইকন ফাংশন
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js': case 'jsx': return <FileCode className="w-4 h-4 text-yellow-500" />;
    case 'ts': case 'tsx': return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'html': case 'htm': return <FileCode className="w-4 h-4 text-orange-500" />;
    case 'css': case 'scss': case 'less': return <FileCode className="w-4 h-4 text-pink-500" />;
    case 'json': return <FileCode className="w-4 h-4 text-green-500" />;
    case 'md': return <FileText className="w-4 h-4 text-gray-500" />;
    case 'py': return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'java': return <FileCode className="w-4 h-4 text-red-500" />;
    case 'sql': return <Database className="w-4 h-4 text-blue-300" />;
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': 
      return <Image className="w-4 h-4 text-purple-500" />;
    case 'txt': return <FileText className="w-4 h-4 text-gray-400" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

// Upload icon component
const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

export const IDEWorkspace = ({ projectName, onPublish }: IDEWorkspaceProps) => {
  const {
    projects,
    currentProject,
    updateProjectFiles,
    loadProject,
    createProject,
    deleteProject,
    duplicateProject
  } = useProjectHistory();

  // ফাইল সিস্টেম হুক ব্যবহার করুন (আপনার পুরোনো ফাইল API)
  const {
    files,
    setFiles,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    uploadFile,
    updateFileContent: fileSystemUpdateContent,
    isLoading: fileSystemLoading,
    error: fileSystemError
  } = useFileSystem(projectName);

  // --- States ---
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSyncing, setIsSyncing] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'explorer' | 'search' | 'git' | 'extensions'>('explorer');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [editorFontSize, setEditorFontSize] = useState(14);

  // ফাইল অপারেশনের হুক (আপনার পুরোনো হুক)
  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // ১. প্রজেক্ট ডাটা লোড করা
  useEffect(() => {
    const initWorkspace = async () => {
      setIsSyncing(true);
      const decodedName = decodeURIComponent(projectName);
      const target = projects.find(p => p.name === decodedName);
      
      if (target) {
        const { data } = await supabase
          .from('projects')
          .select('files, settings')
          .eq('id', target.id)
          .single();

        if (data?.files) {
          try {
            const loadedFiles = data.files as FileItem[];
            setFiles(loadedFiles);
            
            // Find and open the first file
            const findFirstFile = (items: FileItem[]): FileItem | null => {
              for (const item of items) {
                if (item.type === 'file') return item;
                if (item.children) {
                  const found = findFirstFile(item.children);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const firstFile = findFirstFile(loadedFiles);
            if (firstFile) {
              setOpenTabs([{ 
                id: firstFile.id, 
                name: firstFile.name, 
                language: getLanguage(firstFile.extension),
                icon: getFileIcon(firstFile.name),
                path: firstFile.path
              }]);
              setActiveTabId(firstFile.id);
            }
          } catch (error) {
            console.error('Error loading files:', error);
            toast.error('Failed to load project files');
          }
        }

        // Load saved settings
        if (data?.settings) {
          try {
            const settings = data.settings as any;
            setDarkMode(settings.darkMode ?? true);
            setEditorFontSize(settings.editorFontSize ?? 14);
            setLayoutMode(settings.layoutMode ?? 'split');
          } catch (error) {
            console.error('Error loading settings:', error);
          }
        }

        await loadProject(target.id);
      } else {
        // If no project found, create sample files
        const sampleFiles: FileItem[] = [
          {
            id: '1',
            name: 'src',
            type: 'folder',
            children: [
              {
                id: '2',
                name: 'index.html',
                type: 'file',
                extension: 'html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to ${projectName}</h1>
        <p>Start coding here...</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`
              },
              {
                id: '3',
                name: 'style.css',
                type: 'file',
                extension: 'css',
                content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

#app {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 600px;
    text-align: center;
}

h1 {
    color: #333;
    margin-bottom: 1rem;
}

p {
    color: #666;
    line-height: 1.6;
}`
              },
              {
                id: '4',
                name: 'script.js',
                type: 'file',
                extension: 'js',
                content: `console.log('Hello from ${projectName}!');

// Sample interactive code
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const button = document.createElement('button');
    button.textContent = 'Click Me';
    button.style.cssText = \`
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 20px;
        transition: background 0.3s;
    \`;
    
    button.addEventListener('click', () => {
        button.textContent = 'Clicked!';
        button.style.background = '#45a049';
        setTimeout(() => {
            button.textContent = 'Click Me Again';
            button.style.background = '#4CAF50';
        }, 1000);
    });
    
    app.appendChild(button);
});`
              }
            ]
          },
          {
            id: '5',
            name: 'README.md',
            type: 'file',
            extension: 'md',
            content: `# ${projectName}

Welcome to your new project!

## Getting Started

This is a sample project created in Bogura IDE.

## Project Structure

\`\`\`
project/
├── src/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
\`\`\`

## Features

- Modern HTML5, CSS3, and JavaScript
- Responsive design
- Interactive components
- Clean and maintainable code

## Development

To start developing:

1. Edit the files in the \`src\` folder
2. Use the Preview panel to see changes
3. Click "Run Project" to test your application

## Tips

- Use AI Assistant for code suggestions
- Create new files with appropriate extensions
- Organize your code in folders
- Save frequently (auto-save is enabled)`
          }
        ];
        
        setFiles(sampleFiles);
        setOpenTabs([{ 
          id: '2', 
          name: 'index.html', 
          language: 'html',
          icon: getFileIcon('index.html')
        }]);
        setActiveTabId('2');
      }
      setIsSyncing(false);
    };

    initWorkspace();
  }, [projectName, projects]);

  // ২. অটো-সেভ লজিক
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0 || fileSystemLoading) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('projects')
          .update({ 
            files: files as any, 
            settings: {
              darkMode,
              editorFontSize,
              layoutMode
            },
            updated_at: new Date().toISOString() 
          })
          .eq('id', currentProject.id);

        if (!error) {
          updateProjectFiles(currentProject.id, files);
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
          toast.error('Failed to save project');
        }
      } catch (error) {
        console.error('Save error:', error);
        setSaveStatus('error');
        toast.error('Failed to save project');
      }
    };

    const timer = setTimeout(autoSave, 3000);
    return () => clearTimeout(timer);
  }, [files, currentProject?.id, isSyncing, darkMode, editorFontSize, layoutMode, fileSystemLoading]);

  // ৩. ফাইল আপডেট ফাংশন - fileSystem হুক ব্যবহার করে
  const updateFileContent = useCallback(async (fileId: string, content: string) => {
    // Find the file to get its path
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === fileId) return item;
        if (item.children) {
          const res = findFile(item.children);
          if (res) return res;
        }
      }
      return null;
    };
    
    const file = findFile(files);
    if (file && file.path) {
      // Use your fileSystem hook to update content
      await fileSystemUpdateContent(file.path, content);
      
      // Also update local state
      setFiles(prev => {
        const updateNode = (nodes: FileItem[]): FileItem[] => {
          return nodes.map(node => {
            if (node.id === fileId) return { ...node, content, lastModified: new Date().toISOString() };
            if (node.children) return { ...node, children: updateNode(node.children) };
            return node;
          });
        };
        return updateNode(prev);
      });
    }
  }, [files, fileSystemUpdateContent]);

  // ৪. একটিভ ফাইল
  const activeFile = useMemo(() => {
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === activeTabId) return item;
        if (item.children) {
          const res = findFile(item.children);
          if (res) return res;
        }
      }
      return null;
    };
    return findFile(files);
  }, [files, activeTabId]);

  // ৫. ফাইল ক্রিয়েট হ্যান্ডলার
  const handleCreateFile = useCallback(async (parentId: string | null, fileName: string) => {
    try {
      const parentFile = parentId ? findFileById(files, parentId) : null;
      const parentPath = parentFile?.path || '';
      const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
      
      // Use your fileSystem hook to create file
      await createFile(fullPath, '');
      
      // Generate new file item
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: fileName,
        type: 'file',
        extension: fileName.split('.').pop(),
        content: '',
        path: fullPath,
        lastModified: new Date().toISOString()
      };
      
      // Add to local state
      if (parentId && parentFile) {
        setFiles(prev => addFileToFolder(prev, parentId, newFile));
      } else {
        setFiles(prev => [...prev, newFile]);
      }
      
      // Open in new tab
      setOpenTabs(prev => [...prev, { 
        id: newFile.id, 
        name: newFile.name, 
        language: getLanguage(newFile.extension),
        icon: getFileIcon(newFile.name),
        path: newFile.path
      }]);
      setActiveTabId(newFile.id);
      
      toast.success(`Created ${fileName}`);
    } catch (error) {
      console.error('Error creating file:', error);
      toast.error('Failed to create file');
    }
  }, [files, createFile]);

  // ৬. ফোল্ডার ক্রিয়েট হ্যান্ডলার
  const handleCreateFolder = useCallback(async (parentId: string | null, folderName: string) => {
    try {
      const parentFile = parentId ? findFileById(files, parentId) : null;
      const parentPath = parentFile?.path || '';
      const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      
      // Use your fileSystem hook to create folder
      await createFolder(fullPath);
      
      // Generate new folder item
      const newFolder: FileItem = {
        id: crypto.randomUUID(),
        name: folderName,
        type: 'folder',
        children: [],
        path: fullPath,
        lastModified: new Date().toISOString()
      };
      
      // Add to local state
      if (parentId && parentFile) {
        setFiles(prev => addFileToFolder(prev, parentId, newFolder));
      } else {
        setFiles(prev => [...prev, newFolder]);
      }
      
      toast.success(`Created folder ${folderName}`);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  }, [files, createFolder]);

  // ৭. ফাইল ডিলিট হ্যান্ডলার
  const handleDeleteFile = useCallback(async (fileId: string, filePath: string) => {
    try {
      // Use your fileSystem hook to delete file
      await deleteFile(filePath);
      
      // Remove from local state
      setFiles(prev => deleteFileFromTree(prev, fileId));
      setOpenTabs(prev => prev.filter(t => t.id !== fileId));
      
      if (activeTabId === fileId && openTabs.length > 1) {
        const remainingTabs = openTabs.filter(t => t.id !== fileId);
        setActiveTabId(remainingTabs[remainingTabs.length-1].id);
      }
      
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  }, [deleteFile, activeTabId, openTabs]);

  // ৮. ফাইল রিনেম হ্যান্ডলার
  const handleRenameFile = useCallback(async (fileId: string, oldPath: string, newName: string) => {
    try {
      // Use your fileSystem hook to rename file
      await renameFile(oldPath, newName);
      
      // Update local state
      setFiles(prev => renameFileInTree(prev, fileId, newName));
      setOpenTabs(prev => prev.map(t => 
        t.id === fileId ? { ...t, name: newName } : t
      ));
      
      toast.success('File renamed successfully');
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error('Failed to rename file');
    }
  }, [renameFile]);

  // ৯. ফাইল আপলোড হ্যান্ডলার
  const handleUploadFile = useCallback(async (file: File, parentPath?: string) => {
    try {
      // Use your fileSystem hook to upload file
      const uploadedPath = await uploadFile(file, parentPath);
      
      // Create new file item for the uploaded file
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'file',
        extension: file.name.split('.').pop(),
        path: uploadedPath,
        lastModified: new Date().toISOString()
      };
      
      // Add to local state (simplified - in real app, you'd need to find the parent)
      setFiles(prev => [...prev, newFile]);
      
      toast.success(`Uploaded ${file.name}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  }, [uploadFile]);

  // হেল্পার ফাংশনস
  const findFileById = useCallback((items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const addFileToFolder = useCallback((tree: FileItem[], folderId: string, newFile: FileItem): FileItem[] => {
    return tree.map(item => {
      if (item.id === folderId && item.type === 'folder') {
        return {
          ...item,
          children: [...(item.children || []), newFile]
        };
      }
      if (item.children) {
        return {
          ...item,
          children: addFileToFolder(item.children, folderId, newFile)
        };
      }
      return item;
    });
  }, []);

  const deleteFileFromTree = useCallback((tree: FileItem[], fileId: string): FileItem[] => {
    return tree.filter(item => {
      if (item.id === fileId) return false;
      if (item.children) {
        item.children = deleteFileFromTree(item.children, fileId);
      }
      return true;
    });
  }, []);

  const renameFileInTree = useCallback((tree: FileItem[], fileId: string, newName: string): FileItem[] => {
    return tree.map(item => {
      if (item.id === fileId) {
        const extension = item.type === 'file' ? newName.split('.').pop() : undefined;
        return { 
          ...item, 
          name: newName,
          extension,
          lastModified: new Date().toISOString()
        };
      }
      if (item.children) {
        return {
          ...item,
          children: renameFileInTree(item.children, fileId, newName)
        };
      }
      return item;
    });
  }, []);

  // লোডিং স্টেট
  if (isSyncing || fileSystemLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60 font-bogura">বগুড়া সার্ভার থ্যাকা ফাইল লিয়াসছি...</p>
        <Progress value={70} className="w-64 mt-4" />
      </div>
    );
  }

  // এরর স্টেট
  if (fileSystemError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <CloudOff className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl text-white mb-2">File System Error</h2>
        <p className="text-white/60 mb-4">{fileSystemError}</p>
        <Button onClick={() => window.location.reload()}>
          Reload IDE
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex-1 flex flex-col h-full transition-colors duration-300",
        darkMode ? "bg-[#0f0f1a] text-white" : "bg-gray-50 text-gray-900"
      )}>
        {/* Header */}
        <div className={cn(
          "h-12 flex items-center justify-between px-4 border-b",
          darkMode ? "bg-[#16162a] border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
                  {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showSidebar ? 'Sidebar Close' : 'Sidebar Open'}</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate max-w-[150px]">
                {currentProject?.name || projectName}
              </span>
              <Badge variant="outline" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" /> main
              </Badge>
            </div>

            <div className="ml-2 px-2 py-0.5 rounded flex items-center gap-1 border">
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-3 h-3 animate-spin text-amber-500" /><span className="text-[9px] text-amber-500">SAVING</span></>
              ) : saveStatus === 'error' ? (
                <><CloudOff className="w-3 h-3 text-red-500" /><span className="text-[9px] text-red-500">ERROR</span></>
              ) : (
                <><Check className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-500">SAVED</span></>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Controls */}
            <div className="flex items-center gap-1 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setLayoutMode('split')}
                    className={layoutMode === 'split' ? "bg-white/10" : ""}
                  >
                    <Split className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Split View</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setLayoutMode('editor')}
                    className={layoutMode === 'editor' ? "bg-white/10" : ""}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editor Only</TooltipContent>
              </Tooltip>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search files..." 
                className="w-40 pl-8 h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{darkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
            </Tooltip>

            {/* Quick Actions */}
            <Button variant="ghost" size="sm" onClick={() => setShowProjectHistory(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Projects
            </Button>
            
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
              onClick={onPublish}
            >
              <Zap className="w-4 h-4 mr-2" />
              Run Project
            </Button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          {showSidebar && (
            <div className={cn(
              "w-64 border-r flex flex-col",
              darkMode ? "bg-[#121225] border-white/10" : "bg-white border-gray-200"
            )}>
              {/* Sidebar Tabs */}
              <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="px-2 pt-2">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="explorer">
                    <FileCode className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="search">
                    <Search className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="git">
                    <GitBranch className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="extensions">
                    <Package className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* File Explorer */}
              <div className="flex-1 overflow-auto">
                {activeView === 'explorer' && (
                  <FileExplorer 
                    files={files} 
                    activeFileId={activeTabId} 
                    collapsedFolders={collapsedFolders}
                    onToggleFolder={(folderId) => {
                      setCollapsedFolders(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(folderId)) {
                          newSet.delete(folderId);
                        } else {
                          newSet.add(folderId);
                        }
                        return newSet;
                      });
                    }}
                    onFileSelect={(file) => {
                      if (file.type === 'file') {
                        if (!openTabs.find(t => t.id === file.id)) {
                          setOpenTabs([...openTabs, { 
                            id: file.id, 
                            name: file.name, 
                            language: getLanguage(file.extension),
                            icon: getFileIcon(file.name),
                            path: file.path
                          }]);
                        }
                        setActiveTabId(file.id);
                      }
                    }}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    onUploadFile={handleUploadFile}
                  />
                )}

                {activeView === 'search' && (
                  <div className="p-3">
                    <Input 
                      placeholder="Search in files..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-4"
                    />
                    <div className="text-sm text-muted-foreground">
                      Type to search files and code
                    </div>
                  </div>
                )}

                {activeView === 'git' && (
                  <div className="p-3">
                    <div className="text-sm text-muted-foreground">
                      Git integration coming soon...
                    </div>
                  </div>
                )}

                {activeView === 'extensions' && (
                  <div className="p-3">
                    <div className="text-sm text-muted-foreground">
                      Extensions marketplace coming soon...
                    </div>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className={cn(
                "border-t p-2 text-xs",
                darkMode ? "border-white/10" : "border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <span>Total: {files.length} items</span>
                  <div className="flex items-center gap-2">
                    <span>UTF-8</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => setEditorFontSize(fs => Math.max(10, fs - 1))}
                      >
                        A-
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => setEditorFontSize(fs => Math.min(fs + 1, 24))}
                      >
                        A+
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Editor Tabs */}
            <div className={cn(
              "border-b",
              darkMode ? "border-white/10" : "border-gray-200"
            )}>
              <EditorTabs 
                tabs={openTabs} 
                activeTabId={activeTabId} 
                onTabSelect={setActiveTabId} 
                onTabClose={(id) => {
                  const filtered = openTabs.filter(t => t.id !== id);
                  setOpenTabs(filtered);
                  if (activeTabId === id && filtered.length > 0) {
                    setActiveTabId(filtered[filtered.length-1].id);
                  }
                }} 
              />
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
              {layoutMode === 'split' ? (
                <div className="grid grid-cols-2 h-full">
                  <div className="border-r">
                    {activeFile ? (
                      <CodeEditor 
                        code={activeFile.content || ''} 
                        language={getLanguage(activeFile.extension)} 
                        theme={darkMode ? 'vs-dark' : 'light'}
                        fontSize={editorFontSize}
                        onChange={(content) => updateFileContent(activeTabId, content || '')} 
                        filePath={activeFile.path}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <Code2 size={64} />
                        <p>Select a file to start editing</p>
                        <p className="text-sm">Or create a new file from the explorer</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 overflow-auto">
                    <PreviewPanel />
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  {activeFile ? (
                    <CodeEditor 
                      code={activeFile.content || ''} 
                      language={getLanguage(activeFile.extension)} 
                      theme={darkMode ? 'vs-dark' : 'light'}
                      fontSize={editorFontSize}
                      onChange={(content) => updateFileContent(activeTabId, content || '')} 
                      filePath={activeFile.path}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                      <Code2 size={64} />
                      <p>Select a file to start editing</p>
                      <p className="text-sm">Or create a new file from the explorer</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            {showTerminal && (
              <div className={cn(
                "h-64 border-t",
                darkMode ? "bg-black/90 border-white/10" : "bg-gray-100 border-gray-200"
              )}>
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span className="text-sm font-medium">Terminal</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowTerminal(false)}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-2 font-mono text-sm overflow-auto h-[calc(100%-40px)]">
                  <div className="mb-2 text-green-400">$ Welcome to Bogura IDE Terminal</div>
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))}
                  <div className="flex items-center mt-2">
                    <span className="text-green-400 mr-2">$</span>
                    <input
                      className="flex-1 bg-transparent border-none outline-none"
                      placeholder="Type command (ls, npm run, git status)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          // Simulate terminal commands
                          const command = e.currentTarget.value.trim();
                          setTerminalOutput(prev => [...prev, `$ ${command}`]);
                          
                          if (command === 'ls') {
                            const fileList = files.map(f => f.name).join('  ');
                            setTimeout(() => {
                              setTerminalOutput(prev => [...prev, fileList]);
                            }, 100);
                          } else if (command === 'npm run dev') {
                            setTimeout(() => {
                              setTerminalOutput(prev => [...prev, 
                                'Starting development server...',
                                'Server running on http://localhost:3000',
                                'Compiled successfully!'
                              ]);
                            }, 100);
                          }
                          
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI Assistant */}
          {showRightPanel && (
            <div className={cn(
              "w-[400px] border-l flex flex-col",
              darkMode ? "bg-[#121225] border-white/10" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">AI Assistant</span>
                  <Badge variant="secondary" className="ml-1">Beta</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowRightPanel(false)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <UnifiedAIChatPanel 
                  onInsertCode={(code) => {
                    if (activeFile && activeFile.content !== undefined) {
                      updateFileContent(activeTabId, activeFile.content + '\n' + code);
                    }
                  }} 
                  onFileOperations={(operations) => {
                    // AI থেকে ফাইল অপারেশনের জন্য
                    executeOperations(operations);
                  }} 
                  currentFiles={files
                    .filter(f => f.type === 'file')
                    .map(f => ({ 
                      path: f.path || f.name, 
                      content: f.content || '' 
                    }))}
                  theme={darkMode ? 'dark' : 'light'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className={cn(
          "h-8 border-t flex items-center justify-between px-3 text-xs",
          darkMode ? "bg-[#16162a] border-white/10" : "bg-gray-100 border-gray-200 text-gray-700"
        )}>
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded"
              onClick={() => setShowTerminal(!showTerminal)}
            >
              <Terminal className="w-3 h-3" />
              Terminal
            </button>
            <span>Branch: main</span>
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI Ready
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ln {activeFile?.content?.split('\n').length || 1}, Col 1</span>
            <span>UTF-8</span>
            <button 
              className="flex items-center gap-1"
              onClick={() => toast.info('Help documentation coming soon!')}
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Project History Modal */}
        {showProjectHistory && (
          <ProjectHistoryPanel 
            projects={projects} 
            currentProjectId={currentProject?.id} 
            onCreateProject={createProject} 
            onLoadProject={loadProject} 
            onDeleteProject={deleteProject} 
            onDuplicateProject={duplicateProject} 
            onClose={() => setShowProjectHistory(false)} 
            theme={darkMode ? 'dark' : 'light'}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
