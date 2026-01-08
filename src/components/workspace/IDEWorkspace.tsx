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
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileExplorer, FileItem } from '@/components/files/FileExplorer';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
    'jpeg': 'image'
  };
  return map[ext] || 'plaintext';
};

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

  // --- States ---
  const [files, setFiles] = useState<FileItem[]>([]);
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
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);

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
          const loadedFiles = data.files as unknown as FileItem[];
          setFiles(loadedFiles);
          if (openTabs.length === 0 && loadedFiles.length > 0) {
            const first = loadedFiles[0];
            setOpenTabs([{ 
              id: first.id, 
              name: first.name, 
              language: getLanguage(first.extension),
              icon: getFileIcon(first.name)
            }]);
            setActiveTabId(first.id);
          }
        }

        // Load saved settings
        if (data?.settings) {
          const settings = data.settings as any;
          setDarkMode(settings.darkMode ?? true);
          setEditorFontSize(settings.editorFontSize ?? 14);
          setLayoutMode(settings.layoutMode ?? 'split');
        }

        await loadProject(target.id);
      }
      setIsSyncing(false);
    };

    if (projects.length > 0) initWorkspace();
  }, [projectName, projects.length]);

  // ২. অটো-সেভ লজিক
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0) return;

    const autoSave = async () => {
      setSaveStatus('saving');
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
      }
    };

    const timer = setTimeout(autoSave, 3000);
    return () => clearTimeout(timer);
  }, [files, currentProject?.id, isSyncing, darkMode, editorFontSize, layoutMode]);

  // ৩. ফাইল আপডেট ফাংশন
  const updateFileContent = useCallback((fileId: string, content: string) => {
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
  }, []);

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

  // ৫. ফাইল আইকন নির্ধারণ
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': case 'jsx': return <FileCode className="w-4 h-4 text-yellow-500" />;
      case 'ts': case 'tsx': return <FileCode className="w-4 h-4 text-blue-500" />;
      case 'html': return <FileCode className="w-4 h-4 text-orange-500" />;
      case 'css': case 'scss': case 'less': return <FileCode className="w-4 h-4 text-pink-500" />;
      case 'json': return <FileCode className="w-4 h-4 text-green-500" />;
      case 'md': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'py': return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'java': return <FileCode className="w-4 h-4 text-red-500" />;
      case 'sql': return <Database className="w-4 h-4 text-blue-300" />;
      case 'png': case 'jpg': case 'jpeg': case 'svg': return <Image className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // ৬. টার্মিনাল রান ফাংশন
  const runTerminalCommand = async (command: string) => {
    setTerminalOutput(prev => [...prev, `$ ${command}`]);
    
    // Simulate command execution
    setTimeout(() => {
      if (command.startsWith('npm run')) {
        setTerminalOutput(prev => [...prev, 'Starting development server...', 'Server running on http://localhost:3000']);
      } else if (command === 'git status') {
        setTerminalOutput(prev => [...prev, 'On branch main', 'Your branch is up to date with origin/main.', 'nothing to commit, working tree clean']);
      }
    }, 500);
  };

  if (isSyncing) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60 font-bogura">বগুড়া সার্ভার থ্যাকা ফাইল লিয়াসছি...</p>
        <Progress value={70} className="w-64 mt-4" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex-1 flex flex-col h-full transition-colors duration-300",
        darkMode ? "bg-[#0f0f1a] text-white" : "bg-gray-50 text-gray-900"
      )}>
        {/* Enhanced Header */}
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
            
            <Button variant="ghost" size="sm" onClick={() => setShowCollaborators(true)}>
              <Users className="w-4 h-4 mr-2" />
              <Badge variant="secondary" className="ml-1">2</Badge>
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

              {/* File Explorer / Active View */}
              <div className="flex-1 overflow-auto p-2">
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
                    onFileSelect={(f) => {
                      if (f.type === 'file') {
                        if (!openTabs.find(t => t.id === f.id)) {
                          setOpenTabs([...openTabs, { 
                            id: f.id, 
                            name: f.name, 
                            language: getLanguage(f.extension),
                            icon: getFileIcon(f.name)
                          }]);
                        }
                        setActiveTabId(f.id);
                      }
                    }}
                    onFileCreate={(parentId, name, type) => {
                      const newFile: FileItem = {
                        id: crypto.randomUUID(),
                        name,
                        type,
                        extension: type === 'file' ? name.split('.').pop() : undefined,
                        content: type === 'file' ? '' : undefined,
                        children: type === 'folder' ? [] : undefined,
                        lastModified: new Date().toISOString()
                      };
                      setFiles(prev => [...prev, newFile]);
                    }}
                    onFileDelete={(fileId) => {
                      setFiles(prev => prev.filter(f => f.id !== fileId));
                      setOpenTabs(prev => prev.filter(t => t.id !== fileId));
                    }}
                    onFileRename={(fileId, newName) => {
                      setFiles(prev => prev.map(f => 
                        f.id === fileId ? { 
                          ...f, 
                          name: newName, 
                          extension: newName.split('.').pop(),
                          lastModified: new Date().toISOString()
                        } : f
                      ));
                      setOpenTabs(prev => prev.map(t => 
                        t.id === fileId ? { ...t, name: newName } : t
                      ));
                    }}
                  />
                )}

                {activeView === 'search' && (
                  <div className="space-y-2">
                    <Input 
                      placeholder="Search in files..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    {/* Search results would go here */}
                  </div>
                )}

                {activeView === 'git' && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground p-2">
                      Git features coming soon...
                    </div>
                  </div>
                )}
              </div>

              {/* Status Bar at Bottom of Sidebar */}
              <div className={cn(
                "border-t p-2 text-xs",
                darkMode ? "border-white/10" : "border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <span>Lines: {activeFile?.content?.split('\n').length || 0}</span>
                  <span>UTF-8</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6"
                    onClick={() => setEditorFontSize(fs => Math.min(fs + 1, 24))}
                  >
                    A+
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Enhanced Tabs */}
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
                  if (activeTabId === id && filtered.length > 0) setActiveTabId(filtered[filtered.length-1].id);
                }} 
              />
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
              {layoutMode === 'split' && (
                <div className="grid grid-cols-2 h-full">
                  <div className="border-r">
                    {activeFile ? (
                      <CodeEditor 
                        code={activeFile.content || ''} 
                        language={getLanguage(activeFile.extension)} 
                        theme={darkMode ? 'vs-dark' : 'light'}
                        fontSize={editorFontSize}
                        onChange={(v) => updateFileContent(activeTabId, v || '')} 
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <Code2 size={64} />
                        <p>Select a file to start editing</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <PreviewPanel />
                  </div>
                </div>
              )}

              {layoutMode === 'editor' && (
                <div className="h-full">
                  {activeFile ? (
                    <CodeEditor 
                      code={activeFile.content || ''} 
                      language={getLanguage(activeFile.extension)} 
                      theme={darkMode ? 'vs-dark' : 'light'}
                      fontSize={editorFontSize}
                      onChange={(v) => updateFileContent(activeTabId, v || '')} 
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                      <Code2 size={64} />
                      <p>Select a file to start editing</p>
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
                  onInsertCode={(code) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + code)} 
                  onFileOperations={executeOperations} 
                  currentFiles={files.map(f => ({ path: f.name, content: f.content || '' }))}
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
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <button 
              className="flex items-center gap-1"
              onClick={() => toast.info('Help documentation coming soon!')}
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Modals */}
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
