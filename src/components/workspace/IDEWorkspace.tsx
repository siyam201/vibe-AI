import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Settings, History,
  Terminal, Eye, Code2, Package, Save, FolderOpen, 
  GitBranch, Sparkles, Layout, CheckCircle2, Bug,
  ChevronRight, Search, Plus, Download, Share2,
  MoreHorizontal, Command, Cpu, Cloud, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileExplorer, FileItem } from '@/components/files/FileExplorer';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useProjectHistory, getDefaultFiles } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

export const IDEWorkspace = ({ projectName, onPublish, initialPrompt, initialMode }: IDEWorkspaceProps) => {
  const { currentProject, updateProjectFiles } = useProjectHistory();
  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'index-html', name: 'index.html', language: 'html' }]);
  const [activeTabId, setActiveTabId] = useState('index-html');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview'>('chat');
  const [isSaving, setIsSaving] = useState(false);
  
  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  const getLanguage = (ext?: string) => {
    const map: Record<string, string> = { 
      js: 'javascript', ts: 'typescript', jsx: 'javascript', 
      tsx: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' 
    };
    return map[ext || ''] || 'plaintext';
  };

  const syncToSupabase = useCallback(async (currentFiles: FileItem[], silent = true) => {
    const targetName = currentProject?.name || projectName;
    if (!targetName) return;
    if (!silent) setIsSaving(true);
    
    try {
      const fileMap: Record<string, string> = {};
      const extract = (items: FileItem[]) => {
        items.forEach(item => {
          if (item.type === 'file') fileMap[item.name] = item.content || '';
          if (item.children) extract(item.children);
        });
      };
      extract(currentFiles);

      const { error } = await supabase.from('app_previews').upsert({ 
        app_name: targetName,
        files: fileMap,
        html_content: fileMap['index.html'] || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'app_name' });

      if (error) throw error;
    } catch (err) {
      console.error("Sync Failed:", err);
      if (!silent) toast.error("ডাটাবেসে সেভ হতে সমস্যা হয়েছে!");
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [currentProject, projectName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentProject) {
        updateProjectFiles(currentProject.id, files);
        syncToSupabase(files, true);
      }
    }, 4000); 
    return () => clearTimeout(timer);
  }, [files, currentProject, updateProjectFiles, syncToSupabase]);

  const handleDeploy = async () => {
    setIsSaving(true);
    const toastId = toast.loading("ফাইলগুলো সংগ্রহ করে পাবলিশ করা হচ্ছে...");
    try {
      await syncToSupabase(files, false);
      toast.dismiss(toastId);
      toast.success("পাবলিশ সফল! প্রজেক্ট লাইভ হচ্ছে।", { icon: '🚀' });
      onPublish();
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("পাবলিশ ব্যর্থ হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const updateFileContent = (id: string, content: string) => {
    const update = (items: FileItem[]): FileItem[] => items.map(i => 
      i.id === id ? { ...i, content } : (i.children ? { ...i, children: update(i.children) } : i)
    );
    setFiles(prev => update(prev));
  };

  const activeFile = useMemo(() => {
    const findFile = (items: FileItem[]): FileItem | undefined => {
      for (const item of items) {
        if (item.id === activeTabId) return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
    };
    return findFile(files);
  }, [files, activeTabId]);

  const previewData = useMemo(() => {
    const fileMap: Record<string, string> = {};
    const css: string[] = [], js: string[] = [];
    const collect = (items: FileItem[]) => items.forEach(i => {
      if (i.type === 'file') {
        fileMap[i.name] = i.content || '';
        if (i.extension === 'css') css.push(i.content || '');
        if (i.extension === 'js') js.push(i.content || '');
      }
      if (i.children) collect(i.children);
    });
    collect(files);
    return { html: fileMap['index.html'] || '', css: css.join('\n'), js: js.join('\n'), fileMap };
  }, [files]);

  return (
    <div className="flex flex-col h-screen bg-[#050508] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-white/[0.04] bg-[#0d0d14]/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} className="h-8 w-8 text-slate-400">
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-100 tracking-tight leading-none">
                {currentProject?.name || projectName}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                  {isSaving ? 'Syncing...' : 'Cloud Synced'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleDeploy} disabled={isSaving} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-xs gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            <Cloud className={cn("w-3.5 h-3.5", isSaving && "animate-bounce")} />
            Deploy Project
          </Button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-64 flex flex-col border-r border-white/[0.05] bg-[#08080c] animate-in slide-in-from-left duration-300">
            <div className="p-4 flex items-center justify-between border-b border-white/[0.03]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Explorer</span>
              <Plus className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
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

        {/* Editor Center */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f] border-r border-white/[0.05]">
          <div className="flex items-center bg-[#08080c] px-2 h-11 border-b border-white/[0.05] justify-between">
            <EditorTabs 
              tabs={openTabs} 
              activeTabId={activeTabId} 
              onTabSelect={setActiveTabId} 
              onTabClose={(id) => {
                const newTabs = openTabs.filter(t => t.id !== id);
                setOpenTabs(newTabs);
                if (activeTabId === id && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
              }} 
            />
          </div>

          <div className="flex-1 relative overflow-hidden">
            <CodeEditor 
              code={activeFile?.content || ''} 
              language={getLanguage(activeFile?.extension)}
              onChange={(v) => updateFileContent(activeTabId, v || '')}
            />
          </div>

          <footer className="h-7 bg-[#0d0d14] border-t border-white/[0.05] flex items-center justify-between px-3 text-[10px] text-slate-500 font-mono">
             <div className="flex gap-4 items-center">
               <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> UTF-8</span>
               <span className="text-emerald-500 uppercase">{getLanguage(activeFile?.extension)}</span>
             </div>
             <div>Ln 1, Col 1</div>
          </footer>
        </section>

        {/* Right Panel: AI Chat or Preview */}
        <aside className="w-[450px] flex flex-col bg-[#08080c]">
          <div className="h-11 flex items-center border-b border-white/[0.05] px-2 bg-black/20">
            <div className="flex bg-white/5 p-1 rounded-lg w-full">
              <button 
                onClick={() => setRightPanel('chat')}
                className={cn("flex-1 flex items-center justify-center gap-2 py-1 rounded-md text-[10px] font-bold transition-all", 
                rightPanel === 'chat' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
              >
                <Sparkles className="w-3 h-3" /> AI ASSISTANT
              </button>
              <button 
                onClick={() => setRightPanel('preview')}
                className={cn("flex-1 flex items-center justify-center gap-2 py-1 rounded-md text-[10px] font-bold transition-all", 
                rightPanel === 'preview' ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
              >
                <Eye className="w-3 h-3" /> LIVE PREVIEW
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {rightPanel === 'chat' ? (
              <UnifiedAIChatPanel 
                onInsertCode={(code) => updateFileContent(activeTabId, code)}
                onFileOperations={executeOperations}
                currentFiles={previewData.fileMap as any}
                projectId={currentProject?.id}
                initialMode={initialMode}
              />
            ) : (
              <PreviewPanel 
                html={previewData.html} 
                css={previewData.css} 
                js={previewData.js} 
                files={previewData.fileMap} 
                projectName={projectName} 
              />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};
