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
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview'>('chat');
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // ১. ইউআরএল থেকে প্রোজেক্ট চিনে ডাটাবেজ থেকে ডাটা আনা
  useEffect(() => {
    const syncProject = async () => {
      if (projects.length > 0) {
        const decodedName = decodeURIComponent(projectName);
        const target = projects.find(p => p.name === decodedName);
        
        if (target) {
          if (currentProject?.id !== target.id) {
            console.log("Database-থেকে ফাইল লোড হচ্ছে...");
            await loadProject(target.id);
          }
          setIsSyncing(false);
        } else {
          // যদি প্রোজেক্ট খুঁজে না পায় তবে ৩ সেকেন্ড পর লোডিং বন্ধ হবে
          setTimeout(() => setIsSyncing(false), 3000);
        }
      }
    };
    syncProject();
  }, [projectName, projects, loadProject, currentProject?.id]);

  // ২. কারেন্ট প্রোজেক্টের ফাইলগুলো এডিটর স্টেটে বসানো
  useEffect(() => {
    if (currentProject?.files && currentProject.files.length > 0) {
      setFiles(currentProject.files);
      
      // প্রথমবার ফাইল লোড হলে README অটো ওপেন করা
      if (openTabs.length === 0) {
        const readme = currentProject.files.find(f => f.name.toLowerCase().includes('readme')) || currentProject.files[0];
        if (readme && readme.type === 'file') {
          setOpenTabs([{ id: readme.id, name: readme.name, language: getLanguage(readme.extension) }]);
          setActiveTabId(readme.id);
        }
      }
    }
  }, [currentProject]);

  // ৩. ফিক্সড অটো-সেভ লজিক (৩ সেকেন্ড ডিবউন্স)
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0) return;

    const saveToDB = async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ 
          files: files as any, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentProject.id);

      if (error) {
        console.error("Auto-save error:", error);
        setSaveStatus('error');
      } else {
        updateProjectFiles(currentProject.id, files);
        setSaveStatus('saved');
      }
    };

    const timer = setTimeout(saveToDB, 3000); // র‍্যামের ওপর প্রেশার কমাতে ৩ সেকেন্ড দেওয়া
    return () => clearTimeout(timer);
  }, [files, currentProject?.id, isSyncing]);

  // ৪. ফাইল কন্টেন্ট আপডেট (Optimize for 4GB RAM)
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

  // ৫. একটিভ ফাইল খোঁজা (Recursive)
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

  // লোডিং স্ক্রিন
  if (isSyncing && !currentProject) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">আপনার প্রোজেক্ট ফাইলগুলো সাজানো হচ্ছে...</p>
        <p className="text-xs text-white/40 mt-2">বগুড়া থেকে ডাটা লোড হতে একটু সময় লাগতিছে</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      {/* Header Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm truncate max-w-[120px]">{currentProject?.name || projectName}</span>
          </div>
          {/* সেভ ইন্ডিকেটর */}
          <div className="ml-4 flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
             {saveStatus === 'saving' ? (
               <><Loader2 className="w-3 h-3 animate-spin text-amber-500" /><span className="text-[9px] text-amber-500 uppercase font-bold">Saving</span></>
             ) : (
               <><Check className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-500 uppercase font-bold">Saved</span></>
             )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowProjectHistory(true)}>
            <FolderOpen className="w-4 h-4 mr-2" /> Projects
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={onPublish}>
            <Play className="w-3.5 h-3.5 mr-2" /> Run
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: File Explorer */}
        {showSidebar && (
          <div className="w-64 border-r border-white/10 bg-[#121225] flex flex-col">
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

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorTabs 
            tabs={openTabs} 
            activeTabId={activeTabId} 
            onTabSelect={setActiveTabId} 
            onTabClose={(id) => {
              const filtered = openTabs.filter(t => t.id !== id);
              setOpenTabs(filtered);
              if (activeTabId === id && filtered.length > 0) setActiveTabId(filtered[filtered.length - 1].id);
            }} 
          />
          <div className="flex-1 relative">
            {activeFile ? (
              <CodeEditor 
                code={activeFile.content || ''} 
                language={getLanguage(activeFile.extension)} 
                onChange={(v) => updateFileContent(activeTabId, v || '')} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                <Code2 size={64} strokeWidth={1} />
                <p className="text-sm">হামাগো বগুড়ার এডিটরে ফাইল একটা বাছেন শুরু করবার জন্য!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Chat */}
        <div className="w-[400px] border-l border-white/10 bg-[#121225] hidden lg:flex flex-col">
           <UnifiedAIChatPanel 
             onInsertCode={(code) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + code)} 
             onFileOperations={executeOperations} 
             currentFiles={files.map(f => ({ path: f.name, content: f.content || '' }))}
           />
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
