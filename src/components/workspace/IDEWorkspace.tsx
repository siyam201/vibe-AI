import { useState, useCallback, useEffect } from 'react';
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
  Code2
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
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { GitPanel } from '@/components/git/GitPanel';
import { useFileOperations } from '@/hooks/useFileOperations';
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
    updateProjectFiles,
    loadProject,
    createProject,
    deleteProject,
    duplicateProject
  } = useProjectHistory();

  // --- States ---
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'readme', name: 'README.md', language: 'markdown' }]);
  const [activeTabId, setActiveTabId] = useState('readme');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSyncing, setIsSyncing] = useState(true);

  // --- UI State ---
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview' | 'git'>('chat');
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // --- Project Sync Logic ---
  useEffect(() => {
    const syncWithURL = async () => {
      if (projectName && projects.length > 0) {
        const decodedName = decodeURIComponent(projectName);
        const target = projects.find(p => p.name === decodedName);
        if (target && currentProject?.id !== target.id) {
          setIsSyncing(true);
          await loadProject(target.id);
          setIsSyncing(false);
        } else if (target) {
          setIsSyncing(false);
        }
      }
    };
    syncWithURL();
  }, [projectName, projects, loadProject, currentProject?.id]);

  useEffect(() => {
    if (currentProject?.files) {
      setFiles(currentProject.files);
    }
  }, [currentProject]);

  // --- File & Tab Operations ---
  const handleTabClose = useCallback((tabId: string) => {
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  }, [openTabs, activeTabId]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) return { ...item, content };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    };
    setFiles(prev => updateRecursive(prev));
  }, []);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      if (!openTabs.find(t => t.id === file.id)) {
        setOpenTabs([...openTabs, { id: file.id, name: file.name, language: getLanguage(file.extension) }]);
      }
      setActiveTabId(file.id);
    }
  };

  const findActiveFile = (items: FileItem[]): FileItem | null => {
    for (const item of items) {
      if (item.id === activeTabId) return item;
      if (item.children) {
        const found = findActiveFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const activeFile = findActiveFile(files);

  // --- Rendering ---
  if (isSyncing && !currentProject) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="animate-pulse">Vibe-AI প্রজেক্ট লোড করছে...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      {/* Top Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="w-4 h-4 text-primary" />
            <span className="truncate max-w-[150px]">{currentProject?.name || projectName}</span>
          </div>
          <div className="ml-4 flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <Check size={12} /> SAVED
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setShowProjectHistory(true)}>
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> Projects
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={onPublish}>
            <Play className="w-3.5 h-3.5 mr-1.5" fill="currentColor" /> Run
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-60 border-r border-white/10 bg-[#121225] flex flex-col">
            <FileExplorer 
              files={files} 
              activeFileId={activeTabId} 
              onFileSelect={handleFileSelect}
              onFileCreate={() => toast.info("Creating files...")}
              onFileDelete={() => {}}
              onFileRename={() => {}}
            />
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f1a]">
          <EditorTabs 
            tabs={openTabs} 
            activeTabId={activeTabId} 
            onTabSelect={setActiveTabId} 
            onTabClose={handleTabClose} 
          />
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <CodeEditor 
                code={activeFile.content || ''} 
                language={getLanguage(activeFile.extension)} 
                onChange={(v) => updateFileContent(activeTabId, v || '')} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                <Code2 size={48} />
                <p>এডিট করার জন্য একটি ফাইল সিলেক্ট করুন</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Chat/Preview Panel */}
        <div className="w-[400px] border-l border-white/10 bg-[#121225] flex flex-col">
          <div className="flex border-b border-white/10">
            <button onClick={() => setRightPanel('chat')} className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors", rightPanel === 'chat' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/40 hover:text-white/60")}>AI CHAT</button>
            <button onClick={() => setRightPanel('preview')} className={cn("flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors", rightPanel === 'preview' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/40 hover:text-white/60")}>PREVIEW</button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {rightPanel === 'chat' && (
              <UnifiedAIChatPanel 
                onInsertCode={(c) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + c)} 
                onFileOperations={executeOperations} 
                currentFiles={[]}
              />
            )}
            {rightPanel === 'preview' && (
              <PreviewPanel html="" css="" js="" files={{}} projectName={projectName} />
            )}
          </div>
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
        />
      )}
    </div>
  );
};
