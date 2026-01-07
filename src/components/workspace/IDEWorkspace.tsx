import { useState, useCallback, useEffect, useRef } from 'react';
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

  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSyncing, setIsSyncing] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview'>('chat');
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // ১. ডাটাবেজ থেকে প্রজেক্ট সিঙ্ক করা (Sync Logic)
  useEffect(() => {
    const sync = async () => {
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
    sync();
  }, [projectName, projects, loadProject, currentProject?.id]);

  // ২. প্রজেক্টের ফাইলগুলো স্টেটে সেট করা
  useEffect(() => {
    if (currentProject?.files && currentProject.files.length > 0) {
      setFiles(currentProject.files);
      // শুরুতে README বা প্রথম ফাইলটি ট্যাবে ওপেন করা
      if (openTabs.length === 0) {
        const firstFile = currentProject.files[0];
        if (firstFile.type === 'file') {
          setOpenTabs([{ id: firstFile.id, name: firstFile.name, language: getLanguage(firstFile.extension) }]);
          setActiveTabId(firstFile.id);
        }
      }
    }
  }, [currentProject]);

  // ৩. অটো-সেভ ফিক্স (Auto-save Logic)
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0) return;

    const performSave = async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ files: files as any, updated_at: new Date().toISOString() })
        .eq('id', currentProject.id);

      if (error) {
        setSaveStatus('error');
        console.error("Auto-save failed:", error);
      } else {
        updateProjectFiles(currentProject.id, files);
        setSaveStatus('saved');
      }
    };

    const timeout = setTimeout(performSave, 3000); // র‍্যাম বাঁচাতে ৩ সেকেন্ড গ্যাপ
    return () => clearTimeout(timeout);
  }, [files, currentProject?.id, isSyncing]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prevFiles => {
      const updateRecursive = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.id === fileId) return { ...item, content };
          if (item.children) return { ...item, children: updateRecursive(item.children) };
          return item;
        });
      };
      return updateRecursive(prevFiles);
    });
  }, []);

  const handleTabClose = (id: string) => {
    const filtered = openTabs.filter(t => t.id !== id);
    setOpenTabs(filtered);
    if (activeTabId === id && filtered.length > 0) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const activeFile = (() => {
    const find = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === activeTabId) return item;
        if (item.children) {
          const res = find(item.children);
          if (res) return res;
        }
      }
      return null;
    };
    return find(files);
  })();

  if (isSyncing && !currentProject) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60">Vibe-AI প্রজেক্ট সিঙ্ক করছে...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <span className="font-medium text-sm truncate">{currentProject?.name || projectName}</span>
          <div className="ml-2 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
             {saveStatus === 'saving' ? <span className="text-amber-500 animate-pulse">SAVING...</span> : 
              saveStatus === 'saved' ? <span className="text-emerald-500">SAVED</span> : <span className="text-red-500">ERROR</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowProjectHistory(true)}><FolderOpen className="w-4 h-4 mr-2" />Projects</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onPublish}><Play className="w-4 h-4 mr-2" />Run</Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-60 border-r border-white/10 bg-[#121225]">
            <FileExplorer 
              files={files} 
              activeFileId={activeTabId} 
              onFileSelect={(f) => {
                if (f.type === 'file') {
                  if (!openTabs.find(t => t.id === f.id)) {
                    setOpenTabs([...openTabs, { id: f.id, name: f.name, language: getLanguage(f.extension) }]);
                  }
                  setActiveTabId(f.id);
                }
              }} 
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <EditorTabs tabs={openTabs} activeTabId={activeTabId} onTabSelect={setActiveTabId} onTabClose={handleTabClose} />
          <div className="flex-1">
            {activeFile ? (
              <CodeEditor code={activeFile.content || ''} language={getLanguage(activeFile.extension)} onChange={(v) => updateFileContent(activeTabId, v || '')} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4 font-bogura">
                <Code2 size={48} />
                <p>হামাগো বগুড়ার এডিটরে স্বাগতম! একটা ফাইল বাছেন।</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-[400px] border-l border-white/10 bg-[#121225]">
           <UnifiedAIChatPanel 
             onInsertCode={(c) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + c)} 
             onFileOperations={executeOperations} 
             currentFiles={files.map(f => ({ path: f.name, content: f.content || '' }))}
           />
        </div>
      </div>

      {showProjectHistory && <ProjectHistoryPanel projects={projects} currentProjectId={currentProject?.id} onCreateProject={createProject} onLoadProject={loadProject} onDeleteProject={deleteProject} onDuplicateProject={duplicateProject} onClose={() => setShowProjectHistory(false)} />}
    </div>
  );
};
