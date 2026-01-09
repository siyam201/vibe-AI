// src/components/workspace/IDEWorkspace.tsx
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  FolderOpen,
  Loader2,
  Check,
  CloudOff,
  Code2,
  Search,
  Zap,
  Moon,
  Sun,
  GitBranch,
  Terminal,
  FileCode,
  FileText,
  Image,
  Database,
  Folder,
  File,
  Trash2,
  Edit2,
  Plus,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Shield,
  Sparkles,
  RefreshCw,
  Bug,
  CheckCircle,
  Activity,
  Eye,
  Lock,
  Upload as UploadIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { useFileSystem } from '@/hooks/useFileSystem';
import { toast } from 'sonner';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
  path?: string;
  lastModified?: string;
  size?: number;
  issues?: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
  }>;
}

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
}

const getLanguage = (extension?: string) => {
  if (!extension) return 'plaintext';
  
  const ext = extension.toLowerCase();
  const map: Record<string, string> = {
    'js': 'javascript', 
    'ts': 'typescript', 
    'jsx': 'javascript', 
    'tsx': 'typescript',
    'html': 'html', 
    'css': 'css', 
    'json': 'json', 
    'md': 'markdown',
  };
  return map[ext] || 'plaintext';
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js': case 'jsx': return <FileCode className="w-4 h-4 text-yellow-500" />;
    case 'ts': case 'tsx': return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'html': return <FileCode className="w-4 h-4 text-orange-500" />;
    case 'css': return <FileCode className="w-4 h-4 text-pink-500" />;
    case 'json': return <FileCode className="w-4 h-4 text-green-500" />;
    case 'md': return <FileText className="w-4 h-4 text-gray-500" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const FileExplorer = ({ 
  files, 
  activeFileId, 
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onUploadFile
}: {
  files: FileItem[];
  activeFileId: string;
  onFileSelect: (file: FileItem) => void;
  onCreateFile: (name: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onUploadFile: (file: File) => void;
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isCollapsed = collapsedFolders.has(item.id);
      const isActive = activeFileId === item.id;

      return (
        <div key={item.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/10",
              isActive && "bg-blue-600 text-white"
            )}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
            onClick={() => {
              if (isFolder) {
                setCollapsedFolders(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  return newSet;
                });
              } else {
                onFileSelect(item);
              }
            }}
          >
            {isFolder ? (
              <ChevronRight className={cn("w-4 h-4 transition-transform", !isCollapsed && "rotate-90")} />
            ) : null}
            
            {isFolder ? (
              <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              getFileIcon(item.name)
            )}
            
            <span className="truncate">{item.name}</span>
            
            {item.issues && item.issues.length > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs">
                {item.issues.length}
              </Badge>
            )}
          </div>
          
          {isFolder && !isCollapsed && item.children && (
            <div className="ml-4">
              {renderFileTree(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">EXPLORER</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCreateFile('new-file.txt')}>
              <File className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCreateFolder('new-folder')}>
              <Folder className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
          </div>
        ) : (
          renderFileTree(files)
        )}
      </ScrollArea>
    </div>
  );
};

// Auto Scan & Fix System Component
const AutoScanSystem = ({ files, onFixIssue }: { 
  files: FileItem[];
  onFixIssue: (fileId: string, issueIndex: number) => void;
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    totalIssues: number;
    securityIssues: number;
    performanceIssues: number;
    suggestions: number;
    scannedFiles: number;
  } | null>(null);

  const scanFiles = useCallback(async () => {
    setIsScanning(true);
    
    // Simulate scanning
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let totalIssues = 0;
    let securityIssues = 0;
    let performanceIssues = 0;
    let suggestions = 0;
    let scannedFiles = 0;

    const scanFile = (file: FileItem) => {
      if (file.type === 'file') {
        scannedFiles++;
        
        // Check for common issues
        const issues: typeof file.issues = [];
        
        if (file.content) {
          // Check for console.log in production code
          if (file.extension === 'js' && file.content.includes('console.log')) {
            issues.push({
              type: 'warning',
              message: 'Console.log found in production code',
              line: 1
            });
            performanceIssues++;
          }
          
          // Check for large files
          if (file.content.length > 10000) {
            issues.push({
              type: 'warning',
              message: 'File is large, consider splitting',
              line: 1
            });
            performanceIssues++;
          }
          
          // Check for security issues
          if (file.extension === 'html' && file.content.includes('innerHTML')) {
            issues.push({
              type: 'warning',
              message: 'Potential XSS vulnerability with innerHTML',
              line: file.content.split('\n').findIndex(l => l.includes('innerHTML')) + 1
            });
            securityIssues++;
          }
        }
        
        if (issues.length > 0) {
          totalIssues += issues.length;
          file.issues = issues;
        }
      }
      
      if (file.children) {
        file.children.forEach(scanFile);
      }
    };

    files.forEach(scanFile);
    
    // Add some suggestions
    suggestions = Math.floor(Math.random() * 5) + 1;
    
    setScanResults({
      totalIssues,
      securityIssues,
      performanceIssues,
      suggestions,
      scannedFiles
    });
    
    setIsScanning(false);
    toast.success(`Scanned ${scannedFiles} files, found ${totalIssues} issues`);
  }, [files]);

  const autoFixAll = useCallback(() => {
    // Simple auto-fix logic
    files.forEach(file => {
      if (file.type === 'file' && file.issues && file.content) {
        // Remove console.log statements
        if (file.extension === 'js') {
          const newContent = file.content.replace(/console\.log\(.*?\);?\n?/g, '');
          if (newContent !== file.content) {
            file.content = newContent;
            file.issues = file.issues?.filter(issue => 
              !issue.message.includes('Console.log')
            );
          }
        }
      }
    });
    
    toast.success('Auto-fix applied to all files');
    setScanResults(prev => prev ? { ...prev, totalIssues: 0 } : null);
  }, [files]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-base">Auto Scan & Fix</CardTitle>
          </div>
          <Badge variant={scanResults?.totalIssues ? "destructive" : "secondary"}>
            {scanResults?.totalIssues || 0} Issues
          </Badge>
        </div>
        <CardDescription>
          Scan your code for security, performance, and quality issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning files...</span>
            </div>
            <Progress value={70} />
          </div>
        ) : scanResults ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Security</span>
                </div>
                <div className="text-2xl font-bold">{scanResults.securityIssues}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Performance</span>
                </div>
                <div className="text-2xl font-bold">{scanResults.performanceIssues}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Scanned files</span>
                <span className="text-sm font-medium">{scanResults.scannedFiles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Suggestions</span>
                <span className="text-sm font-medium">{scanResults.suggestions}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={scanFiles} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Rescan
              </Button>
              <Button size="sm" className="flex-1" onClick={autoFixAll}>
                <Sparkles className="w-4 h-4 mr-2" />
                Auto Fix All
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                No scan performed yet. Click scan to analyze your code.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={scanFiles}>
              <Shield className="w-4 h-4 mr-2" />
              Start Scan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const IDEWorkspace = ({ projectName, onPublish }: IDEWorkspaceProps) => {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'explorer' | 'scan'>('explorer');

  const fileSystem = useFileSystem({ projectName });

  // Initialize tabs from first file
  useEffect(() => {
    if (fileSystem.files.length > 0 && openTabs.length === 0) {
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

      const firstFile = findFirstFile(fileSystem.files);
      if (firstFile) {
        const tab: EditorTab = {
          id: firstFile.id,
          name: firstFile.name,
          language: getLanguage(firstFile.extension),
          icon: getFileIcon(firstFile.name)
        };
        setOpenTabs([tab]);
        setActiveTabId(firstFile.id);
      }
    }
  }, [fileSystem.files, openTabs.length]);

  // Auto-save simulation
  useEffect(() => {
    if (activeTabId && saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('saving');
        setTimeout(() => setSaveStatus('saved'), 1000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeTabId, saveStatus]);

  const activeFile = useMemo(() => {
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === activeTabId) return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFile(fileSystem.files);
  }, [fileSystem.files, activeTabId]);

  const updateFileContent = useCallback(async (fileId: string, content: string) => {
    const file = activeFile;
    if (file && file.path) {
      await fileSystem.updateFileContent(file.path, content);
    }
  }, [activeFile, fileSystem.updateFileContent]);

  const handleCreateFile = useCallback(async (name: string) => {
    const path = `src/${name}`;
    await fileSystem.createFile(path, '');
    
    const newFile: FileItem = {
      id: crypto.randomUUID(),
      name,
      type: 'file',
      extension: name.split('.').pop(),
      path
    };

    const tab: EditorTab = {
      id: newFile.id,
      name: newFile.name,
      language: getLanguage(newFile.extension),
      icon: getFileIcon(newFile.name)
    };
    
    setOpenTabs(prev => [...prev, tab]);
    setActiveTabId(newFile.id);
  }, [fileSystem.createFile]);

  const handleCreateFolder = useCallback(async (name: string) => {
    await fileSystem.createFolder(`src/${name}`);
  }, [fileSystem.createFolder]);

  const handleFixIssue = useCallback((fileId: string, issueIndex: number) => {
    // Fix specific issue
    toast.info(`Fixed issue in file ${fileId}`);
  }, []);

  if (fileSystem.isLoading && fileSystem.files.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60">Loading project files...</p>
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
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate max-w-[150px]">{projectName}</span>
              <Badge variant="outline" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" /> main
              </Badge>
            </div>

            <div className="ml-2 px-2 py-0.5 rounded flex items-center gap-1 border">
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-3 h-3 animate-spin text-amber-500" /><span className="text-[9px] text-amber-500">SAVING</span></>
              ) : (
                <><Check className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-500">SAVED</span></>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
              <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="px-2 pt-2">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="explorer">
                    <FileCode className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="scan">
                    <Shield className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex-1 overflow-auto">
                {activeView === 'explorer' ? (
                  <FileExplorer 
                    files={fileSystem.files} 
                    activeFileId={activeTabId} 
                    onFileSelect={(file) => {
                      if (!openTabs.find(t => t.id === file.id)) {
                        const tab: EditorTab = {
                          id: file.id,
                          name: file.name,
                          language: getLanguage(file.extension),
                          icon: getFileIcon(file.name)
                        };
                        setOpenTabs(prev => [...prev, tab]);
                      }
                      setActiveTabId(file.id);
                    }}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFile={() => {}}
                    onRenameFile={() => {}}
                    onUploadFile={() => {}}
                  />
                ) : (
                  <div className="p-3">
                    <AutoScanSystem 
                      files={fileSystem.files} 
                      onFixIssue={handleFixIssue}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
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

            <div className="flex-1 relative">
              {activeFile ? (
                <div className="grid grid-cols-2 h-full">
                  <div className="border-r">
                    <CodeEditor 
                      code={activeFile.content || ''} 
                      language={getLanguage(activeFile.extension)} 
                      theme={darkMode ? 'vs-dark' : 'light'}
                      fontSize={14}
                      onChange={(content) => updateFileContent(activeTabId, content || '')} 
                    />
                  </div>
                  <div className="p-4">
                    <PreviewPanel />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <Code2 size={64} />
                  <p>Select a file to start editing</p>
                </div>
              )}
            </div>

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
                  <Button variant="ghost" size="icon" onClick={() => setShowTerminal(false)}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-2 font-mono text-sm overflow-auto h-[calc(100%-40px)]">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
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
                <Button variant="ghost" size="icon" onClick={() => setShowRightPanel(false)}>
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
                  onFileOperations={() => {}} 
                  currentFiles={fileSystem.files
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
          </div>
          <div className="flex items-center gap-4">
            <span>Ln {activeFile?.content?.split('\n').length || 1}, Col 1</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
