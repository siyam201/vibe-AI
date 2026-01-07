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
  Loader2,
  Check,
  CloudOff
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
import { supabase } from '@/integrations/supabase/client';

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

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
  const {
    projects,
    currentProject,
    createProject,
    updateProjectFiles,
    deleteProject,
    loadProject,
    duplicateProject,
  } = useProjectHistory();

  // States
  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'readme', name: 'README.md', language: 'markdown' }]);
  const [activeTabId, setActiveTabId] = useState('readme');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // UI Panels
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview' | 'git'>('chat');
  
  // AI related
  const [queuedChatMessage, setQueuedChatMessage] = useState<{ id: string; content: string; mode?: string } | null>(
    initialPrompt ? { id: Date.now().toString(), content: initialPrompt, mode: initialMode || 'plan' } : null
  );

  // Modals
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // Cloud Sync (Auto-save) logic
  useEffect(() => {
    if (!currentProject?.id || files.length === 0) return;

    const performSave = async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ files: files as any, updated_at: new Date().toISOString() })
        .eq('id', currentProject.id);

      if (error) {
        setSaveStatus('error');
      } else {
        updateProjectFiles(currentProject.id, files);
        setSaveStatus('saved');
      }
    };

    const debounce = setTimeout(performSave, 2000);
    return () => clearTimeout(debounce);
  }, [files, currentProject?.id]);

  // Sync state with current project change
  useEffect(() => {
    if (currentProject) setFiles(currentProject.files);
  }, [currentProject]);

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

  const activeFile = findFile(files, activeTabId);
  const currentContent = activeFile?.content || '';
  const currentLanguage = getLanguage(activeFile?.extension);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) return { ...item, content };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    };
    setFiles(updateRecursive(files));
    setOpenTabs(tabs => tabs.map(tab => tab.id === fileId ? { ...tab, isDirty: true } : tab));
  }, [files]);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      if (!openTabs.find(t => t.id === file.id)) {
        setOpenTabs([...openTabs, { id: file.id, name: file.name, language: getLanguage(file.extension) }]);
      }
      setActiveTabId(file.id);
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const handleFileCreate = useCallback((parentId: string | null, name: string, type: 'file' | 'folder') => {
    const extension = name.includes('.') ? name.split('.').pop() : undefined;
    const newFile: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name, type, extension,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    const addToParent = (items: FileItem[]): FileItem[] => {
      if (!parentId) return [...items, newFile];
      return items.map(item => {
        if (item.id === parentId && item.children) return { ...item, children: [...item.children, newFile] };
        if (item.children) return { ...item, children: addToParent(item.children) };
        return item;
      });
    };
    setFiles(addToParent(files));
    toast.success(`Created ${name}`);
  }, [files]);

  const handleFileDelete = (fileId: string) => {
    const deleteRecursive = (items: FileItem[]): FileItem[] => {
      return items.filter(item => item.id !== fileId).map(item => ({
        ...item, children: item.children ? deleteRecursive(item.children) : undefined
      }));
    };
    setFiles(deleteRecursive(files));
    setOpenTabs(tabs => tabs.filter(t => t.id !== fileId));
    toast.success('Deleted');
  };

  const handleFileRename = (fileId: string, newName: string) => {
    const renameRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) return { ...item, name: newName, extension: newName.split('.').pop() || item.extension };
        if (item.children) return { ...item, children: renameRecursive(item.children) };
        return item;
      });
    };
    setFiles(renameRecursive(files));
    setOpenTabs(tabs => tabs.map(t => t.id === fileId ? { ...t, name: newName } : t));
  };

  const getPreviewCode = () => {
    let html = '', css = '', js = '';
    const fileMap: { [path: string]: string } = {};
    const findContent = (items: FileItem[], path = '') => {
      items.forEach(item => {
        const curPath = path ? `${path}/${item.name}` : item.name;
        if (item.type === 'file' && item.content) {
          fileMap[curPath] = item.content;
          if (item.extension === 'css') css += item.content + '\n';
          if (item.extension === 'js') js += item.content + '\n';
          if (item.extension === 'html' && (item.name === 'index.html' || !html)) html = item.content;
        }
        if (item.children) findContent(item.children, curPath);
      });
    };
    findContent(files);
    return { html, css, js, fileMap };
  };

  const { html, css, js, fileMap } = getPreviewCode();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <Package className="w-4 h-4 text-primary" />
          <span className="font-medium">{currentProject?.name || projectName}</span>
          
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2 ml-4 px-2 py-0.5 bg-white/5 rounded border border-white/5 text-[10px] font-bold uppercase tracking-widest">
            {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin text-amber-500" /> : 
             saveStatus === 'saved' ? <Check className="w-3 h-3 text-emerald-500" /> : <CloudOff className="w-3 h-3 text-red-500" />}
            {saveStatus}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowProjectHistory(true)}><FolderOpen className="w-4 h-4 mr-2" />Projects</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowTerminal(!showTerminal)}><Terminal className="w-4 h-4 mr-2" />Shell</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}><History className="w-4 h-4 mr-2" />History</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onPublish}><Play className="w-4 h-4 mr-2" />Run</Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-64 border-r border-white/10 bg-[#121225]">
            <FileExplorer 
              files={files} 
              activeFileId={activeTabId} 
              onFileSelect={handleFileSelect} 
              onFileCreate={handleFileCreate} 
              onFileDelete={handleFileDelete} 
              onFileRename={handleFileRename} 
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <EditorTabs tabs={openTabs} activeTabId={activeTabId} onTabSelect={setActiveTabId} onTabClose={handleTabClose} />
          <div className="flex-1">
            {activeFile ? (
              <CodeEditor code={currentContent} language={currentLanguage} onChange={(v) => updateFileContent(activeTabId, v || '')} />
            ) : (
              <div className="h-full flex items-center justify-center text-white/40">Select a file to edit</div>
            )}
          </div>
          {showTerminal && <TerminalPanel isExpanded={terminalExpanded} onToggleExpand={() => setTerminalExpanded(!terminalExpanded)} onClose={() => setShowTerminal(false)} />}
        </div>

        {/* Right Panel */}
        <div className="w-[400px] border-l border-white/10 bg-[#121225]">
          <div className="flex border-b border-white/10">
            <button onClick={() => setRightPanel('chat')} className={cn("flex-1 p-2 text-xs font-bold uppercase tracking-wider", rightPanel === 'chat' && "bg-primary/20 text-primary border-b-2 border-primary")}>AI Chat</button>
            <button onClick={() => setRightPanel('preview')} className={cn("flex-1 p-2 text-xs font-bold uppercase tracking-wider", rightPanel === 'preview' && "bg-primary/20 text-primary border-b-2 border-primary")}>Preview</button>
            <button onClick={() => setRightPanel('git')} className={cn("flex-1 p-2 text-xs font-bold uppercase tracking-wider", rightPanel === 'git' && "bg-primary/20 text-primary border-b-2 border-primary")}>Git</button>
          </div>
          <div className="flex-1 overflow-hidden h-[calc(100%-40px)]">
            {rightPanel === 'chat' && <UnifiedAIChatPanel onInsertCode={(c) => activeFile && updateFileContent(activeTabId, currentContent + '\n' + c)} onFileOperations={executeOperations} currentFiles={Object.entries(fileMap).map(([path, content]) => ({ path, content }))} queuedMessage={queuedChatMessage} onQueuedMessageHandled={() => setQueuedChatMessage(null)} />}
            {rightPanel === 'preview' && <PreviewPanel html={html} css={css} js={js} files={fileMap} projectName={projectName} />}
            {rightPanel === 'git' && <GitPanel files={files} projectName={projectName} />}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <VersionHistory isOpen={showHistory} onClose={() => setShowHistory(false)} onRollback={() => {}} />
      <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} projectName={projectName} projectUrl="" />
      {showProjectHistory && <ProjectHistoryPanel projects={projects} currentProjectId={currentProject?.id} onCreateProject={createProject} onLoadProject={loadProject} onDeleteProject={deleteProject} onDuplicateProject={duplicateProject} onClose={() => setShowProjectHistory(false)} />}
    </div>
  );
};
