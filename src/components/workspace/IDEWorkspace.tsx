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
  Save
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
  const map: Record<string, string> = {
    'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 
    'tsx': 'typescript', 'html': 'html', 'css': 'css', 
    'json': 'json', 'md': 'markdown'
  };
  return map[extension || ''] || 'plaintext';
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

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // ১. প্রজেক্ট ডাটা লোড করা (Sync Logic)
  useEffect(() => {
    const initWorkspace = async () => {
      setIsSyncing(true);
      const decodedName = decodeURIComponent(projectName);
      const target = projects.find(p => p.name === decodedName);
      
      if (target) {
        const { data } = await supabase
          .from('projects')
          .select('files')
          .eq('id', target.id)
          .single();

        if (data?.files) {
          const loadedFiles = data.files as unknown as FileItem[];
          setFiles(loadedFiles);
          if (openTabs.length === 0 && loadedFiles.length > 0) {
            const first = loadedFiles[0];
            setOpenTabs([{ id: first.id, name: first.name, language: getLanguage(first.extension) }]);
            setActiveTabId(first.id);
          }
        }
        await loadProject(target.id);
      }
      setIsSyncing(false);
    };

    if (projects.length > 0) initWorkspace();
  }, [projectName, projects.length]);

  // ২. অটো-সেভ লজিক (৩ সেকেন্ড গ্যাপ - র‍্যাম বাঁচাতে)
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ files: files as any, updated_at: new Date().toISOString() })
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
  }, [files, currentProject?.id, isSyncing]);

  // ৩. ফাইল আপডেট ফাংশন (Memoized for Performance)
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => {
      const updateNode = (nodes: FileItem[]): FileItem[] => {
        return nodes.map(node => {
          if (node.id === fileId) return { ...node, content };
          if (node.children) return { ...node, children: updateNode(node.children) };
          return node;
        });
      };
      return updateNode(prev);
    });
  }, []);

  // ৪. একটিভ ফাইল মেমোরাইজেশন
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

  if (isSyncing) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60 font-bogura">বগুড়া সার্ভার থ্যাকা ফাইল লিয়াসছি...</p>
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
          <span className="font-medium text-sm truncate max-w-[150px]">{currentProject?.name || projectName}</span>
          <div className="ml-2 px-2 py-0.5 rounded bg-white/5 border border-white/10 flex items-center gap-1">
             {saveStatus === 'saving' ? (
               <><Loader2 className="w-3 h-3 animate-spin text-amber-500" /><span className="text-[9px] text-amber-500">SAVING</span></>
             ) : (
               <><Check className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-500">SAVED</span></>
             )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowProjectHistory(true)}><FolderOpen className="w-4 h-4 mr-2" />Projects</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onPublish}><Play className="w-4 h-4 mr-2" />Run</Button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-64 border-r border-white/10 bg-[#121225]">
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
          <div className="flex-1">
            {activeFile ? (
              <CodeEditor code={activeFile.content || ''} language={getLanguage(activeFile.extension)} onChange={(v) => updateFileContent(activeTabId, v || '')} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                <Code2 size={64} />
                <p>বগুড়ার এডিটরে ফাইল একটা বাছেন শুরু করবার জন্য!</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-[400px] border-l border-white/10 bg-[#121225] hidden lg:block">
           <UnifiedAIChatPanel 
             onInsertCode={(code) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + code)} 
             onFileOperations={executeOperations} 
             currentFiles={files.map(f => ({ path: f.name, content: f.content || '' }))}
           />
        </div>
      </div>

      {showProjectHistory && (
        <ProjectHistoryPanel 
          projects={projects} currentProjectId={currentProject?.id} 
          onCreateProject={createProject} onLoadProject={loadProject} 
          onDeleteProject={deleteProject} onDuplicateProject={duplicateProject} 
          onClose={() => setShowProjectHistory(false)} 
        />
      )}
    </div>
  );
};
