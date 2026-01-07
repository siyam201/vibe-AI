import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Share2, Settings, History,
  Terminal, Eye, Code2, Save, X, Trash2, ChevronRight, ChevronDown, 
  FileCode, FolderPlus, FilePlus, Zap, MessageSquare, Globe, Send, 
  Sparkles, RefreshCw, Loader2, Check, CloudOff, MoreVertical, Search,
  Download, GitBranch, Github, Copy, ExternalLink, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// --- TYPES & INTERFACES ---
type Project = Database['public']['Tables']['projects']['Row'];

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
  children?: FileItem[];
  isOpen?: boolean;
  extension?: string;
}

interface IDEWorkspaceProps {
  projectId: string;
  projectName?: string;
}

// --- HELPER: FILE TREE ENGINE ---
const FileTreeItem = ({ 
  item, level, activeId, onSelect, onDelete, onToggle 
}: { 
  item: FileItem; level: number; activeId: string; 
  onSelect: (item: FileItem) => void; 
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) => {
  const isSelected = activeId === item.id;
  const isFolder = item.type === 'folder';

  return (
    <div className="flex flex-col">
      <div 
        onClick={() => isFolder ? onToggle(item.id) : onSelect(item)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer group transition-colors relative",
          isSelected ? "bg-primary/10 text-primary border-r-2 border-primary" : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {isFolder ? (
          item.isOpen ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />
        ) : (
          <FileCode size={14} className={isSelected ? "text-primary" : "text-slate-500"} />
        )}
        <span className="text-[13px] font-medium truncate flex-1">{item.name}</span>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isFolder && item.isOpen && item.children && (
        <div className="border-l border-white/5 ml-[18px]">
          {item.children.map(child => (
            <FileTreeItem 
              key={child.id} item={child} level={level + 1} 
              activeId={activeId} onSelect={onSelect} 
              onDelete={onDelete} onToggle={onToggle} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN IDE COMPONENT ---
export const IDEWorkspace = ({ projectId, projectName: initialName }: IDEWorkspaceProps) => {
  // ১. স্টেট লজিক (র‍্যাম সাশ্রয়ী)
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'preview' | 'ai'>('preview');
  const [aiMessage, setAiMessage] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>(['VibeCode Engine v2.0 initialized...', 'System: Bogura_Node_Connected']);

  // ২. ডাটাবেজ লোডিং
  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (data) {
        setProject(data);
        const initialFiles = (data.files as unknown as FileItem[]) || [];
        setFiles(initialFiles);
        
        // অটো-ট্যাব ওপেনিং
        const first = initialFiles.find(f => f.type === 'file');
        if (first) {
          setActiveTabId(first.id);
          setOpenTabs([first.id]);
        }
      }
    };
    fetchProject();
  }, [projectId]);

  // ৩. স্মার্ট অটো-সেভ লজিক (Debounced Cloud Sync)
  useEffect(() => {
    if (files.length === 0) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ files: files as any, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (!error) {
        setSaveStatus('saved');
        setTerminalLines(prev => [...prev.slice(-5), `[${new Date().toLocaleTimeString()}] Cloud Sync: Success`]);
      } else {
        setSaveStatus('unsaved');
        toast.error("সেভ হতে সমস্যা হচ্ছে!");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [files, projectId]);

  // ৪. ফাইল অপারেশন হ্যান্ডলার
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

  const activeFile = useMemo(() => findFile(files, activeTabId), [files, activeTabId, findFile]);

  const updateFileContent = (id: string, newContent: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => items.map(item => {
      if (item.id === id) return { ...item, content: newContent };
      if (item.children) return { ...item, children: updateRecursive(item.children) };
      return item;
    });
    setFiles(updateRecursive(files));
    setSaveStatus('unsaved');
  };

  const handleCreateFile = (type: 'file' | 'folder') => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;
    const newItem: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      parentId: null,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      isOpen: true
    };
    setFiles([...files, newItem]);
  };

  const toggleFolder = (id: string) => {
    const update = (items: FileItem[]): FileItem[] => items.map(item => {
      if (item.id === id) return { ...item, isOpen: !item.isOpen };
      if (item.children) return { ...item, children: update(item.children) };
      return item;
    });
    setFiles(update(files));
  };

  // ৫. প্রিভিউ বিল্ডার (HTML/CSS/JS Integration)
  const getCombinedPreview = () => {
    const html = files.find(f => f.name.endsWith('.html'))?.content || '';
    const css = files.find(f => f.name.endsWith('.css'))?.content || '';
    return `<html><style>${css}</style><body>${html}</body></html>`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#05050a] text-slate-300 overflow-hidden font-sans">
      
      {/* --- TOP NAVIGATION --- */}
      <header className="h-12 border-b border-white/5 bg-[#0d0d1a] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30">
            <Zap className="w-4 h-4 text-primary fill-primary animate-pulse" />
            <span className="text-[11px] font-black text-white uppercase tracking-tighter">
              {project?.name || initialName || 'VibeCode'}
            </span>
          </div>

          {/* Cloud Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            {saveStatus === 'saving' ? (
              <Loader2 size={12} className="animate-spin text-amber-500" />
            ) : (
              <Check size={12} className="text-emerald-500" />
            )}
            <span className={cn("text-[9px] font-bold uppercase", 
              saveStatus === 'saving' ? "text-amber-500" : "text-emerald-500"
            )}>
              {saveStatus === 'saving' ? 'Syncing...' : 'Cloud Active'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold hover:bg-white/10"><Share2 size={14} className="mr-2"/> SHARE</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[11px] font-black px-5 rounded-full shadow-lg shadow-emerald-500/10">
            <Play size={12} fill="white" className="mr-2" /> RUN APP
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-2" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Settings size={16} /></Button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Activity Bar (Mini Sidebar) */}
        <aside className="w-12 bg-[#0a0a14] border-r border-white/5 flex flex-col items-center py-4 gap-6 shrink-0">
          <button onClick={() => setShowSidebar(!showSidebar)} className={cn("transition-colors", showSidebar ? "text-primary" : "text-slate-600 hover:text-white")}><FolderOpen size={20} /></button>
          <button onClick={() => setRightPanel('ai')} className={cn("transition-colors", rightPanel === 'ai' ? "text-primary" : "text-slate-600 hover:text-white")}><MessageSquare size={20} /></button>
          <button onClick={() => setRightPanel('preview')} className={cn("transition-colors", rightPanel === 'preview' ? "text-primary" : "text-slate-600 hover:text-white")}><Globe size={20} /></button>
          <div className="mt-auto flex flex-col gap-6 mb-2">
             <button className="text-slate-600 hover:text-white"><Github size={20} /></button>
             <button className="text-slate-600 hover:text-white"><History size={20} /></button>
          </div>
        </aside>

        {/* File Explorer */}
        {showSidebar && (
          <aside className="w-60 bg-[#0d0d1a] border-r border-white/5 flex flex-col shrink-0 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between bg-[#0a0a14]/50 border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace</span>
              <div className="flex gap-1">
                <button onClick={() => handleCreateFile('file')} className="p-1 hover:bg-white/10 rounded text-slate-400"><FilePlus size={14} /></button>
                <button onClick={() => handleCreateFile('folder')} className="p-1 hover:bg-white/10 rounded text-slate-400"><FolderPlus size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
              {files.map(item => (
                <FileTreeItem 
                  key={item.id} item={item} level={0} 
                  activeId={activeTabId} 
                  onSelect={(file) => {
                    setActiveTabId(file.id);
                    if (!openTabs.includes(file.id)) setOpenTabs([...openTabs, file.id]);
                  }}
                  onDelete={(id) => setFiles(prev => prev.filter(f => f.id !== id))}
                  onToggle={toggleFolder}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Editor Engine */}
        <main className="flex-1 flex flex-col bg-[#05050a] min-w-0 overflow-hidden relative">
          {/* Editor Tabs */}
          <div className="flex bg-[#0d0d1a] border-b border-white/5 overflow-x-auto no-scrollbar h-10 items-center">
            {openTabs.map(tabId => {
              const file = findFile(files, tabId);
              if (!file) return null;
              return (
                <div 
                  key={tabId}
                  onClick={() => setActiveTabId(tabId)}
                  className={cn(
                    "flex items-center gap-2 px-4 h-full text-[11px] font-bold border-r border-white/5 cursor-pointer transition-all min-w-[130px] group relative",
                    activeTabId === tabId ? "bg-[#05050a] text-primary border-t-2 border-primary" : "text-slate-500 hover:bg-white/5"
                  )}
                >
                  <FileCode size={12} />
                  <span className="truncate flex-1">{file.name}</span>
                  <X 
                    size={12} 
                    className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5" 
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = openTabs.filter(t => t !== tabId);
                      setOpenTabs(filtered);
                      if (activeTabId === tabId && filtered.length > 0) setActiveTabId(filtered[filtered.length-1]);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Real-time Code Input */}
          <div className="flex-1 relative">
            {activeFile ? (
              <div className="h-full flex">
                {/* Line Numbers Sim */}
                <div className="w-10 bg-[#08080e] border-r border-white/5 flex flex-col items-center pt-6 text-[11px] text-slate-600 font-mono select-none">
                  {Array.from({length: 40}).map((_, i) => <div key={i}>{i+1}</div>)}
                </div>
                <textarea
                  value={activeFile.content || ''}
                  onChange={(e) => updateFileContent(activeTabId, e.target.value)}
                  spellCheck={false}
                  autoFocus
                  className="flex-1 bg-transparent p-6 font-mono text-[13px] outline-none resize-none leading-relaxed text-slate-300 custom-scrollbar"
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 select-none">
                <Code2 size={120} strokeWidth={1} className="text-primary" />
                <h2 className="text-4xl font-black mt-4 tracking-[20px] text-white">VIBECODE</h2>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-primary">Powered by Bogura Engine</p>
              </div>
            )}
          </div>

          {/* Integrated Terminal */}
          {isTerminalOpen && (
            <div className="h-44 bg-[#08080e] border-t border-white/10 flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/5">
                <div className="flex gap-4">
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter flex items-center gap-2"><Terminal size={12}/> Output</span>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Problems</span>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Debug Console</span>
                </div>
                <button onClick={() => setIsTerminalOpen(false)} className="hover:bg-white/10 p-1 rounded"><X size={12}/></button>
              </div>
              <div className="flex-1 p-4 font-mono text-[11px] text-slate-400 overflow-y-auto custom-scrollbar">
                {terminalLines.map((line, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-emerald-500 mr-2">➜</span> {line}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                   <span className="text-primary">➜</span>
                   <input className="bg-transparent outline-none text-white w-full" autoFocus />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Side Panel: AI & Preview */}
        <aside className="w-[440px] border-l border-white/5 bg-[#0d0d1a] flex flex-col shrink-0">
          <div className="flex h-10 border-b border-white/5">
            <button 
              onClick={() => setRightPanel('preview')} 
              className={cn("flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2", 
                rightPanel === 'preview' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-500 hover:text-white"
              )}
            >
              <Globe size={12} /> Live Preview
            </button>
            <button 
              onClick={() => setRightPanel('ai')} 
              className={cn("flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2", 
                rightPanel === 'ai' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-500 hover:text-white"
              )}
            >
              <Sparkles size={12} /> AI Developer
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {rightPanel === 'preview' ? (
              <div className="h-full bg-white flex flex-col">
                <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded border border-slate-300 px-3 py-1 text-[10px] text-slate-500 truncate">
                    https://{projectId.slice(0,8)}.vibecode.app
                  </div>
                  <RefreshCw size={12} className="text-slate-400 cursor-pointer hover:rotate-180 transition-transform duration-500" />
                  <ExternalLink size={12} className="text-slate-400 cursor-pointer" />
                </div>
                <iframe srcDoc={getCombinedPreview()} className="w-full h-full border-none" title="preview" />
              </div>
            ) : (
              <div className="h-full flex flex-col p-4 bg-gradient-to-b from-[#0d0d1a] to-primary/10">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <Zap size={14} className="text-primary fill-primary" />
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none text-[12px] leading-relaxed shadow-xl">
                      আসসালামু আলাইকুম সিয়াম ভাই! আপনার <span className="text-primary font-bold">Bogura_Node</span> এখন অনলাইন। 
                      আমি আপনার প্রজেক্টের বর্তমান ফাইল <span className="underline italic text-white">"{activeFile?.name || 'Empty'}"</span> এর কোড বুঝতে পারছি। 
                      আপনি কি চান আমি কোন নতুন ফিচার যোগ করি?
                    </div>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative flex flex-col bg-[#16162a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <textarea 
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      placeholder="Ask AI to generate code..." 
                      className="w-full bg-transparent p-4 text-[13px] outline-none resize-none h-24 text-slate-200" 
                    />
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-white/5">
                      <span className="text-[10px] font-bold text-slate-500">Ctrl + Enter to send</span>
                      <button className="bg-primary hover:bg-primary/80 p-2 rounded-xl text-white transition-all transform active:scale-95 shadow-lg shadow-primary/20">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* --- FOOTER STATUS BAR --- */}
      <footer className="h-7 bg-[#0a0a14] border-t border-white/5 px-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest z-50">
        <div className="flex gap-5 items-center">
          <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className="flex items-center gap-2 hover:text-white transition-colors group">
            <Terminal size={14} className="group-hover:text-emerald-500" /> 
            Terminal
          </button>
          <div className="flex items-center gap-2"><GitBranch size={14} /> master*</div>
          <div className="flex items-center gap-2 text-emerald-500/80 tracking-tighter">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Bogura_Server: 12ms
          </div>
        </div>
        <div className="flex gap-4 items-center">
           <span className="text-slate-600">UTF-8</span>
           <span className="text-slate-600">TypeScript React</span>
           <div className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 text-[9px]">VibeCode v2.1.5</div>
        </div>
      </footer>

      {/* Internal Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
