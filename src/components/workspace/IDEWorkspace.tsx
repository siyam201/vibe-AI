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
import { supabase } from '@/integrations/supabase/client'; // এটি নিশ্চিত করুন

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

  // Get HTML/CSS/JS for preview - based on active tab or first available HTML
  const getPreviewCode = () => {
    let html = '';
    let css = '';
    let js = '';
    const fileMap: { [path: string]: string } = {};
    const allCss: string[] = [];
    const allJs: string[] = [];
    const allHtmlFiles: { name: string; content: string; path: string }[] = [];

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
          
          // Collect all JS files
          if (item.extension === 'js') {
            allJs.push(item.content);
          }
          
          // Collect all HTML files
          if (item.extension === 'html') {
            allHtmlFiles.push({ name: item.name, content: item.content, path: currentPath });
          }
        }
        
        if (item.children) findContent(item.children, currentPath);
      });
    };
    findContent(files);
    
    // Determine which HTML to show:
    // 1. If active tab is an HTML file, show that
    // 2. Otherwise, prioritize: index.html > login.html > first available HTML
    const activeTab = openTabs.find(t => t.id === activeTabId);
    if (activeTab && activeTab.name.endsWith('.html')) {
      const matchedHtml = allHtmlFiles.find(h => h.name === activeTab.name || h.path === activeTab.name);
      if (matchedHtml) {
        html = matchedHtml.content;
      }
    }
    
    if (!html) {
      // Priority order for HTML files
      const priorityOrder = ['index.html', 'login.html', 'signup.html', 'dashboard.html'];
      for (const priority of priorityOrder) {
        const found = allHtmlFiles.find(h => h.name === priority);
        if (found) {
          html = found.content;
          break;
        }
      }
      // If still no HTML, use first available
      if (!html && allHtmlFiles.length > 0) {
        html = allHtmlFiles[0].content;
      }
    }
    // ... আগের কোড (ইমপোর্ট এবং ইন্টারফেস) ঠিক থাকবে

export const IDEWorkspace = ({ projectName, onPublish, initialPrompt, initialMode }: IDEWorkspaceProps) => {
  // ১. প্রজেক্ট ডাটা এবং ফাইল স্টেট
  const { currentProject, updateProjectFiles, createProject, loadProject, projects, deleteProject, duplicateProject } = useProjectHistory();
  
  // আপনার ডাটাবেজ আইডি (যদি থাকে)
  const projectId = currentProject?.id;

  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // ২. ক্লাউড অটো-সেভ সিস্টেম (সরাসরি সুপাবেস এ সেভ হবে)
  useEffect(() => {
    if (!projectId || files.length === 0) return;

    const performSave = async () => {
      setSaveStatus('saving');
      
      // সুপাবেস ডাটাবেজে আপডেট
      const { error } = await supabase
        .from('projects')
        .update({ 
          files: files as any, // Json টাইপ কাস্ট
          updated_at: new Date().toISOString() 
        })
        .eq('id', projectId);

      if (error) {
        console.error("Save Error:", error);
        setSaveStatus('error');
      } else {
        // লোকাল হিস্ট্রিতেও আপডেট রাখুন
        updateProjectFiles(projectId, files);
        setSaveStatus('saved');
      }
    };

    const debounceTimer = setTimeout(performSave, 2000); // ২ সেকেন্ড পর পর সেভ
    return () => clearTimeout(debounceTimer);
  }, [files, projectId, updateProjectFiles]);

  // ৩. ফাইল এবং ফোল্ডার তৈরির নতুন হ্যান্ডলার
  const handleFileCreate = useCallback(async (parentId: string | null, name: string, type: 'file' | 'folder') => {
    const extension = name.includes('.') ? name.split('.').pop() : undefined;
    const newFile: FileItem = {
      id: Math.random().toString(36).substr(2, 9), // ইউনিক আইডি
      name,
      type,
      extension,
      parentId,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    const addToTree = (items: FileItem[]): FileItem[] => {
      if (!parentId) return [...items, newFile];
      return items.map(item => {
        if (item.id === parentId) {
          return { ...item, children: [...(item.children || []), newFile] };
        }
        if (item.children) {
          return { ...item, children: addToTree(item.children) };
        }
        return item;
      });
    };

    const updatedFiles = addToTree(files);
    setFiles(updatedFiles);
    setSaveStatus('unsaved');
    toast.success(`${type === 'file' ? 'ফাইল' : 'ফোল্ডার'} তৈরি হয়েছে!`);
  }, [files]);

  // ৪. ফাইল ডিলিট সিস্টেম
  const handleFileDelete = useCallback((fileId: string) => {
    const deleteFromTree = (items: FileItem[]): FileItem[] => {
      return items
        .filter(item => item.id !== fileId)
        .map(item => ({
          ...item,
          children: item.children ? deleteFromTree(item.children) : undefined
        }));
    };

    setFiles(deleteFromTree(files));
    toast.error('ফাইলটি মুছে ফেলা হয়েছে');
  }, [files]);

  // --- বাকি কোড (Tabs, UI, Panels) আগের মতোই থাকবে ---
  
  return (
    // আপনার আগের রিটার্ন JSX কোড এখানে বসবে
    // শুধু UI-তে সেভ স্ট্যাটাস দেখানোর জন্য এই অংশটি যোগ করতে পারেন:
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 ml-4">
       {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin text-amber-500" /> : 
        saveStatus === 'saved' ? <Check size={12} className="text-emerald-500" /> : <CloudOff size={12} />}
       <span className="text-[10px] font-bold uppercase tracking-tighter">
         {saveStatus === 'saved' ? 'Cloud Synced' : 'Syncing...'}
       </span>
    </div>
  );
};
    // Combine all CSS
    const combinedCss = allCss.join('\n\n');
    
    // Combine all JS
    const combinedJs = allJs.join('\n\n');
    
    return { html, css: combinedCss, js: combinedJs, fileMap };
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
              projectName={currentProject?.name || projectName}
              onConsoleLog={(log) => console.log(log)}
            />
          )}
          {rightPanel === 'git' && (
            <GitPanel files={files} projectName={currentProject?.name || projectName} />
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
