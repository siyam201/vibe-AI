import { useState, useCallback, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Share2,
  Settings,
  History,
  Terminal,
  Eye,
  Code2,
  Package,
  Save,
  Download,
  FolderOpen,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileExplorer, FileItem } from '@/components/files/FileExplorer';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { VersionHistory } from '@/components/history/VersionHistory';
import { ShareDialog } from '@/components/share/ShareDialog';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { PackageManager } from '@/components/packages/PackageManager';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { GitPanel } from '@/components/git/GitPanel';
import { useFileOperations, FileOperation } from '@/hooks/useFileOperations';
import { useProjectHistory, getDefaultFiles } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

// Empty initial files - AI creates files on request
const initialFiles: FileItem[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [],
  },
  { 
    id: 'readme', 
    name: 'README.md', 
    type: 'file', 
    extension: 'md', 
    content: '# My Project\n\nAsk AI to create files for you!\n\nExample prompts:\n- "Create a login page"\n- "Create a todo app"\n- "Create index.html with a button"' 
  },
];

const getLanguage = (extension?: string) => {
  switch (extension) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'jsx': return 'javascript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

export const IDEWorkspace = ({ projectName, onPublish, initialPrompt, initialMode }: IDEWorkspaceProps) => {
  // Project history hook
  const {
    projects,
    currentProject,
    createProject,
    updateProjectFiles,
    deleteProject,
    loadProject,
    duplicateProject,
  } = useProjectHistory();

  // File state - use current project files or defaults
  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'index-html', name: 'index.html', language: 'html' }]);
  const [activeTabId, setActiveTabId] = useState('index-html');

  // Panel state
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview' | 'git'>('chat');
  const [showGitPanel, setShowGitPanel] = useState(false);

  // AI plan -> chat bridge (initialize with initial prompt if provided)
  const [queuedChatMessage, setQueuedChatMessage] = useState<{ id: string; content: string; mode?: string } | null>(
    initialPrompt ? { id: Date.now().toString(), content: initialPrompt, mode: initialMode || 'plan' } : null
  );

  // Modal state
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  // File operations hook for AI
  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);


  // Sync files when current project changes
  useEffect(() => {
    if (currentProject) {
      setFiles(currentProject.files);
    }
  }, [currentProject]);

  // Auto-save files to current project
  useEffect(() => {
    if (currentProject && files !== currentProject.files) {
      const debounce = setTimeout(() => {
        updateProjectFiles(currentProject.id, files);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [files, currentProject, updateProjectFiles]);

  // Handle creating new project
  const handleCreateProject = async (name: string, description?: string) => {
    const newProject = await createProject(name, description);
    if (newProject) {
      setFiles(newProject.files);
      setOpenTabs([{ id: 'readme', name: 'README.md', language: 'markdown' }]);
      setActiveTabId('readme');
    }
    setShowProjectHistory(false);
  };

  // Handle loading project
  const handleLoadProject = (projectId: string) => {
    const project = loadProject(projectId);
    if (project) {
      setFiles(project.files);
      setOpenTabs([{ id: 'readme', name: 'README.md', language: 'markdown' }]);
      setActiveTabId('readme');
      setShowProjectHistory(false);
      toast.success(`Loaded "${project.name}"`);
    }
  };

  // Find file by ID recursively
  const findFile = useCallback((items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFile(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Get current file content
  const activeFile = findFile(files, activeTabId);
  const currentContent = activeFile?.content || '';
  const currentLanguage = getLanguage(activeFile?.extension);

  // Update file content
  const updateFileContent = useCallback((fileId: string, content: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) {
          return { ...item, content };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    setFiles(updateRecursive(files));
    
    // Mark tab as dirty
    setOpenTabs(tabs => tabs.map(tab => 
      tab.id === fileId ? { ...tab, isDirty: true } : tab
    ));
  }, [files]);

  // File operations
  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      const existingTab = openTabs.find(t => t.id === file.id);
      if (!existingTab) {
        setOpenTabs([...openTabs, {
          id: file.id,
          name: file.name,
          language: getLanguage(file.extension),
        }]);
      }
      setActiveTabId(file.id);
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleFileCreate = (parentId: string | null, name: string, type: 'file' | 'folder') => {
    const extension = name.includes('.') ? name.split('.').pop() : undefined;
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type,
      extension,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    if (parentId) {
      const addToParent = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.id === parentId && item.children) {
            return { ...item, children: [...item.children, newFile] };
          }
          if (item.children) {
            return { ...item, children: addToParent(item.children) };
          }
          return item;
        });
      };
      setFiles(addToParent(files));
    } else {
      setFiles([...files, newFile]);
    }
    toast.success(`Created ${name}`);
  };

  const handleFileDelete = (fileId: string) => {
    const deleteRecursive = (items: FileItem[]): FileItem[] => {
      return items.filter(item => {
        if (item.id === fileId) return false;
        if (item.children) {
          item.children = deleteRecursive(item.children);
        }
        return true;
      });
    };
    setFiles(deleteRecursive(files));
    setOpenTabs(tabs => tabs.filter(t => t.id !== fileId));
    toast.success('File deleted');
  };

  const handleFileRename = (fileId: string, newName: string) => {
    const renameRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) {
          const extension = newName.includes('.') ? newName.split('.').pop() : item.extension;
          return { ...item, name: newName, extension };
        }
        if (item.children) {
          return { ...item, children: renameRecursive(item.children) };
        }
        return item;
      });
    };
    setFiles(renameRecursive(files));
    setOpenTabs(tabs => tabs.map(t => 
      t.id === fileId ? { ...t, name: newName } : t
    ));
  };

  // Get HTML/CSS/JS for preview
  const getPreviewCode = () => {
    let html = '';
    let css = '';
    let js = '';
    const fileMap: { [path: string]: string } = {};
    const allCss: string[] = [];

    const findContent = (items: FileItem[], parentPath = '') => {
      items.forEach(item => {
        const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        
        if (item.type === 'file' && item.content) {
          // Store all files in the map for resolving links
          fileMap[item.name] = item.content;
          fileMap[currentPath] = item.content;
          
          // Collect all CSS files
          if (item.extension === 'css') {
            allCss.push(item.content);
          }
        }
        
        // Primary files
        if (item.name === 'index.html' && item.content) html = item.content;
        if (item.name === 'styles.css' && item.content) css = item.content;
        if (item.name === 'main.js' && item.content) js = item.content;
        if (item.children) findContent(item.children, currentPath);
      });
    };
    findContent(files);
    
    // Combine all CSS (styles.css first, then others)
    const combinedCss = allCss.length > 0 ? allCss.join('\n\n') : css;
    
    return { html, css: combinedCss, js, fileMap };
  };

  const { html, css, js, fileMap } = getPreviewCode();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
          <Package className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{currentProject?.name || projectName}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowProjectHistory(true)}
          >
            <FolderOpen className="w-4 h-4" />
            Projects
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <Terminal className="w-4 h-4" />
            Shell
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setRightPanel('git')}
          >
            <GitBranch className="w-4 h-4" />
            Git
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory(true)}
          >
            <History className="w-4 h-4" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-green-600 hover:bg-green-700 ml-2"
            onClick={onPublish}
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showSidebar && (
          <div className="w-56 flex flex-col border-r border-border bg-[#1a1a2e]">
            {/* Files Header with Actions */}
            <div className="h-10 flex items-center justify-between px-3 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Files</span>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => toast.success('File saved')}
                >
                  <Save className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPackages(true)}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <FileExplorer
                files={files}
                activeFileId={activeTabId}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
              />
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Tabs with Toggle */}
          <div className="flex items-center bg-[#1a1a2e] border-b border-border">
            {openTabs.length > 0 && (
              <div className="flex-1 overflow-x-auto">
                <EditorTabs
                  tabs={openTabs}
                  activeTabId={activeTabId}
                  onTabSelect={setActiveTabId}
                  onTabClose={handleTabClose}
                />
              </div>
            )}
            {/* Panel Toggle */}
            <div className="flex items-center border-l border-border">
              <button
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5",
                  rightPanel === 'chat' 
                    ? "bg-primary/20 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setRightPanel('chat')}
                title="AI Chat"
              >
                <Code2 className="w-4 h-4" />
                up
              </button>
              <button
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5",
                  rightPanel === 'git' 
                    ? "bg-primary/20 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setRightPanel('git')}
                title="Git"
              >
                <GitBranch className="w-4 h-4" />
              </button>
              <button
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5",
                  rightPanel === 'preview' 
                    ? "bg-primary/20 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setRightPanel('preview')}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            {activeFile ? (
              <CodeEditor
                code={currentContent}
                language={currentLanguage}
                onChange={(value) => updateFileContent(activeTabId, value || '')}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <TerminalPanel
              isExpanded={terminalExpanded}
              onToggleExpand={() => setTerminalExpanded(!terminalExpanded)}
              onClose={() => setShowTerminal(false)}
            />
          )}
        </div>

        {/* Right Panel Content */}
        <div className="w-[420px] flex flex-col border-l border-border">
          {rightPanel === 'chat' && (
            <UnifiedAIChatPanel
              onInsertCode={(code) => {
                if (activeFile) {
                  updateFileContent(activeTabId, currentContent + '\n' + code);
                  toast.success('Code inserted');
                }
              }}
              onFileOperations={(operations: FileOperation[]) => {
                executeOperations(operations);
              }}
              currentFiles={Object.entries(fileMap).map(([path, content]) => ({ path, content }))}
              queuedMessage={queuedChatMessage}
              onQueuedMessageHandled={(id) => {
                setQueuedChatMessage((prev) => (prev?.id === id ? null : prev));
              }}
              initialMode={initialMode}
            />
          )}
          {rightPanel === 'preview' && (
            <PreviewPanel
              html={html}
              css={css}
              js={js}
              files={fileMap}
              onConsoleLog={(log) => console.log(log)}
            />
          )}
          {rightPanel === 'git' && (
            <GitPanel />
          )}
        </div>
      </div>

      {/* Modals */}
      <VersionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRollback={(id) => {
          toast.success('Rolled back to checkpoint');
          setShowHistory(false);
        }}
      />
      <ShareDialog
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        projectName={projectName}
        projectUrl={`https://${(() => {
          const cleanName = projectName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          return cleanName || `app-${Date.now().toString(36)}`;
        })()}.vibecode.app`}
      />
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <PackageManager
        isOpen={showPackages}
        onClose={() => setShowPackages(false)}
      />
      {showProjectHistory && (
        <ProjectHistoryPanel
          projects={projects}
          currentProjectId={currentProject?.id}
          onCreateProject={handleCreateProject}
          onLoadProject={handleLoadProject}
          onDeleteProject={deleteProject}
          onDuplicateProject={duplicateProject}
          onClose={() => setShowProjectHistory(false)}
        />
      )}
    </div>
  );
};
