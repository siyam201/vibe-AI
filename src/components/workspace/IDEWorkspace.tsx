import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Settings, History, Terminal,
  Package, FolderOpen, Loader2, Check, CloudOff, Code2, Save,
  Plus, Search, Layout, Cpu, Database
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

const getLanguage = (ext?: string) => {
  const map: Record<string, string> = {
    'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 
    'tsx': 'typescript', 'html': 'html', 'css': 'css', 'json': 'json'
  };
  return map[ext || ''] || 'plaintext';
};

export const IDEWorkspace = ({ projectName, onPublish }: IDEWorkspaceProps) => {
  const { projects, currentProject, updateProjectFiles, loadProject, createProject, deleteProject, duplicateProject } = useProjectHistory();

  // --- Core States ---
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSyncing, setIsSyncing] = useState(true);
  
  // --- UI States ---
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview'>('chat');
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // ১. ফিক্সড ডাটা সিঙ্ক (রিফ্রেশ দিলে যাতে ডাটা না হারায়)
  useEffect(() => {
    const syncWithDB = async () => {
      setIsSyncing(true);
      const decodedName = decodeURIComponent(projectName);
      const target = projects.find(p => p.name === decodedName);
      
      if (target) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', target.id)
          .single();

        if (data?.files) {
          const loadedFiles = data.files as unknown as FileItem[];
          setFiles(loadedFiles);
          
          // অটোমেটিক প্রথম প্রয়োজনীয় ফাইলটি ওপেন করা
          if (openTabs.length === 0 && loadedFiles.length > 0) {
            const priorityFile = loadedFiles.find(f => f.name === 'index.html' || f.name === 'App.tsx') || loadedFiles[0];
            if (priorityFile.type === 'file') {
              setOpenTabs([{ id: priorityFile.id, name: priorityFile.name, language: getLanguage(priorityFile.extension) }]);
              setActiveTabId(priorityFile.id);
            }
          }
        }
        await loadProject(target.id);
      }
      setIsSyncing(false);
    };

    if (projects.length > 0) syncWithDB();
  }, [projectName, projects.length]);

  // ২. র‍্যাম ফ্রেন্ডলি অটো-সেভ (৩ সেকেন্ড গ্যাপ)
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0) return;

    const performSave = async () => {
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
        toast.error("সেভ করতে সমস্যা হচ্ছে!");
      }
    };

    const debounce = setTimeout(performSave, 3000);
    return () => clearTimeout(debounce);
  }, [files, currentProject?.id, isSyncing]);

  // ৩. ফাইল আপডেট লজিক
  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => {
      const recursiveUpdate = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.id === fileId) return { ...item, content };
          if (item.children) return { ...item, children: recursiveUpdate(item.children) };
          return item;
        });
      };
      return recursiveUpdate(prev);
    });
  }, []);

  // ৪. একটিভ ফাইল মেমোরাইজেশন (পারফরম্যান্স বুস্ট)
  const activeFile = useMemo(() => {
    const find = (nodes: FileItem[]): FileItem | null => {
      for (const node of nodes) {
        if (node.id === activeTabId) return node;
        if (node.children) {
          const found = find(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(files);
  }, [files, activeTabId]);

  if (isSyncing && !currentProject) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#09090b] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-bogura animate-pulse">বগুড়া থেকে ফাইলগুলা সাজায়া লিয়া আসতিছি...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-slate-300 overflow-hidden font-sans">
      {/* Top Navigation */}
      <header className="h-12 border-b border-white/5 bg-[#0c0c0e] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md border border-white/10">
            <Package size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-white truncate max-w-[150px]">{currentProject?.name}</span>
          </div>
          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
            saveStatus === 'saving' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {saveStatus === 'saving' ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            {saveStatus.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setShowProjectHistory(true)}>
            <History size={16} /> <span className="hidden sm:inline">History</span>
          </Button>
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={onPublish}>
            <Play size={14} className="mr-2 fill-current" /> RUN SITE
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Explorer */}
        {showSidebar && (
          <aside className="w-64 border-r border-white/5 bg-[#0c0c0e] flex flex-col">
            <div className="p-3 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Explorer</span>
              <Button variant="ghost" size="icon" className="h-6 w-6"><Plus size={14}/></Button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
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
          </aside>
        )}

        {/* Center: Editor */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
          <EditorTabs 
            tabs={openTabs} 
            activeTabId={activeTabId} 
            onTabSelect={setActiveTabId} 
            onTabClose={(id) => {
              const remaining = openTabs.filter(t => t.id !== id);
              setOpenTabs(remaining);
              if (activeTabId === id && remaining.length > 0) setActiveTabId(remaining[remaining.length-1].id);
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
              <div className="h-full flex flex-col items-center justify-center space-y-4 bg-[#09090b]">
                <div className="p-6 rounded-full bg-white/5 border border-white/10">
                  <Cpu size={48} className="text-slate-700 animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-slate-400 font-medium font-bogura">সিয়াম ভাই, একটা ফাইল সিলেক্ট করেন!</h3>
                  <p className="text-xs text-slate-600 mt-1">আপনার ৪জিবি র‍্যাম পিসিতে এডিটর রেডি।</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Terminal Toggle */}
          <div className="h-8 border-t border-white/5 bg-[#0c0c0e] flex items-center px-4 justify-between">
            <button onClick={() => setTerminalOpen(!terminalOpen)} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase">
              <Terminal size={12} /> Terminal
            </button>
            <div className="flex items-center gap-4 text-[10px] text-slate-600">
              <span>UTF-8</span>
              <span>{activeFile?.extension?.toUpperCase() || 'NONE'}</span>
            </div>
          </div>
        </section>

        {/* Right: AI Panel */}
        <aside className="w-[450px] border-l border-white/5 bg-[#0c0c0e] flex flex-col">
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setRightPanel('chat')}
              className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all", 
              rightPanel === 'chat' ? "text-blue-400 border-b-2 border-blue-400 bg-blue-400/5" : "text-slate-500")}
            >AI Assistant</button>
            <button 
              onClick={() => setRightPanel('preview')}
              className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all", 
              rightPanel === 'preview' ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5" : "text-slate-500")}
            >Live Preview</button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'chat' ? (
              <UnifiedAIChatPanel 
                onInsertCode={(code) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + code)} 
                onFileOperations={executeOperations} 
                currentFiles={files.map(f => ({ path: f.name, content: f.content || '' }))}
              />
            ) : (
              <PreviewPanel projectName={projectName} files={files} />
            )}
          </div>
        </aside>
      </main>

      {/* History Overlay */}
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
