import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Settings, History,
  Terminal, Eye, Code2, Package, Save, FolderOpen, 
  GitBranch, Sparkles, Layout, CheckCircle2, Bug,
  ChevronRight, Search, Plus, Download, Share2,
  MoreHorizontal, Command, Cpu, Cloud
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

// --- Types ---
interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

export const IDEWorkspace = ({ projectName, onPublish, initialPrompt, initialMode }: IDEWorkspaceProps) => {
  // --- States ---
  const { currentProject, updateProjectFiles } = useProjectHistory();
  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'index-html', name: 'index.html', language: 'html' }]);
  const [activeTabId, setActiveTabId] = useState('index-html');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview'>('chat');
  const [isSaving, setIsSaving] = useState(false);
  const [aiTab, setAiTab] = useState<'chat' | 'plan' | 'test'>('chat');
  
  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // --- Utility: Get Language ---
  const getLanguage = (ext?: string) => {
    const map: Record<string, string> = { 
      js: 'javascript', ts: 'typescript', jsx: 'javascript', 
      tsx: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' 
    };
    return map[ext || ''] || 'plaintext';
  };

  // --- Bulk Sync to Supabase ---
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
        files: fileMap, // বাল্ক ফাইল অবজেক্ট
        html_content: fileMap['index.html'] || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'app_name' });

      if (error) throw error;
      if (!silent) console.log("Manual Sync Success");
    } catch (err) {
      console.error("Supabase Sync Failed:", err);
      if (!silent) toast.error("ডাটাবেসে সেভ হতে সমস্যা হয়েছে!");
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, [currentProject, projectName]);

  // --- Auto-save effect ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentProject) {
        updateProjectFiles(currentProject.id, files);
        syncToSupabase(files, true);
      }
    }, 4000); // ৪জিবি র‍্যামের জন্য ৪ সেকেন্ড ডিলে
    return () => clearTimeout(timer);
  }, [files, currentProject, updateProjectFiles, syncToSupabase]);

  // --- Deploy Logic ---
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

  // --- File Actions ---
  const updateFileContent = (id: string, content: string) => {
    const update = (items: FileItem[]): FileItem[] => items.map(i => 
      i.id === id ? { ...i, content } : (i.children ? { ...i, children: update(i.children) } : i)
    );
    setFiles(prev => update(prev));
  };

  const activeFile = files.find(f => f.id === activeTabId);

  // --- Preview Data Preparation ---
  const getPreviewCode = () => {
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
  };

  const previewData = getPreviewCode();

  return (
    <div className="flex flex-col h-screen bg-[#050508] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* --- TOP HEADER (Modern & Minimal) --- */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-white/[0.04] bg-[#0d0d14]/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
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
                  {isSaving ? 'Syncing...' : 'Saved to Cloud'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 mr-4 bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
            <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-full hover:bg-white/5"><History className="w-3.5 h-3.5 mr-1.5" /> History</Button>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-full hover:bg-white/5"><Share2 className="w-3.5 h-3.5 mr-1.5" /> Share</Button>
          </div>
          
          <Button 
            onClick={handleDeploy}
            disabled={isSaving}
            className="h-9 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-xs gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Cloud className={cn("w-3.5 h-3.5", isSaving && "animate-bounce")} />
            Deploy Project
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* --- LEFT SIDEBAR: File Explorer --- */}
        {showSidebar && (
          <aside className="w-64 flex flex-col border-r border-white/[0.05] bg-[#08080c]">
            <div className="p-4 flex items-center justify-between border-b border-white/[0.03]">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Explorer</span>
              </div>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white"><Plus className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white"><Search className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 px-2">
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

            <div className="p-3 border-t border-white/[0.03] bg-black/20">
              <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group">
                <GitBranch className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-300">main branch</span>
              </div>
            </div>
          </aside>
        )}

        {/* --- CENTER: Editor Section --- */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f]">
          {/* Tab Bar */}
          <div className="flex items-center bg-[#08080c] px-2 h-11 border-b border-white/[0.05]">
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <EditorTabs 
                tabs={openTabs} 
                activeTabId={activeTabId} 
                onTabSelect={setActiveTabId} 
                onTabClose={(id) => setOpenTabs(openTabs.filter(t => t.id !== id))} 
              />
            </div>
            <div className="flex items-center gap-1 px-2 border-l border-white/[0.05]">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setRightPanel('chat')}
                className={cn("h-7 px-3 rounded-md text-[11px] font-bold transition-all", rightPanel === 'chat' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500")}
              >
                EDITOR
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setRightPanel('preview')}
                className={cn("h-7 px-3 rounded-md text-[11px] font-bold transition-all", rightPanel === 'preview' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500")}
              >
                PREVIEW
              </Button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            <CodeEditor 
              code={activeFile?.content || ''} 
              language={getLanguage(activeFile?.extension)}
              onChange={(v) => updateFileContent(activeTabId, v || '')}
            />
          </div>

          {/* Status Bar */}
          <footer className="h-7 bg-[#0d0d14] border-t border-white/[0.05] flex items-center justify-between px-3 text-[10px] font-medium text-slate-500">
             <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3" /> UTF-8</span>
                <span className="flex items-center gap-1.5"><Code2 className="w-3 h-3" /> {getLanguage(activeFile?.extension).toUpperCase()}</span>
             </div>
             <div className="flex gap-4">
                <span className="hover:text-slate-300 cursor-pointer">Ln 1, Col 1</span>
                <span className="text-emerald-500/80">● Ready</span>
             </div>
          </footer>
        </section>
               </div>
               <PreviewPanel 
                  html={previewData.html} 
                  css={previewData.css} 
                  js={previewData.js} 
                  files={previewData.fileMap} 
                  projectName={projectName} 
                />
            </div>
          )}
        </aside>
      </main>

      {/* --- FLOATING COMMAND PALETTE HINT --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-[#16162a]/90 backdrop-blur-md border border-white/[0.1] rounded-2xl shadow-2xl z-[100] pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300">Ctrl</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300">K</kbd>
        </div>
        <span className="text-[11px] font-medium text-slate-400">Quick Actions</span>
      </div>
    </div>
  );
};
