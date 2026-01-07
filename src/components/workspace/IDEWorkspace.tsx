import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Share2, Settings, History,
  Terminal, Eye, Code2, Package, Save, Download, FolderOpen, GitBranch,
  Cloud, Check, CloudOff, Loader2, Plus, X, Trash2, Edit3, ChevronRight,
  ChevronDown, Search, FileCode, FolderPlus, FilePlus, Copy, Github,
  MoreVertical, Command, Zap, MessageSquare, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// --- ১. টাইপ ডেফিনিশন (Types) ---
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  parentId: string | null;
  children?: FileItem[];
  isOpen?: boolean;
}

interface WorkspaceProps {
  projectName: string;
  projectId: string;
}

// --- ২. রিকার্সিভ ফাইল কম্পোনেন্ট (Sidebar Helper) ---
const FileTreeItem = ({ 
  item, 
  level, 
  activeId, 
  onSelect, 
  onDelete, 
  onToggle 
}: { 
  item: FileItem; 
  level: number; 
  activeId: string; 
  onSelect: (id: string) => void; 
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) => {
  const isSelected = activeId === item.id;
  const isFolder = item.type === 'folder';

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer group transition-all duration-150",
          isSelected ? "bg-primary/20 text-white shadow-[inset_2px_0_0_0_#3b82f6]" : "hover:bg-white/5 text-slate-400"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => isFolder ? onToggle(item.id) : onSelect(item.id)}
      >
        {isFolder ? (
          item.isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
        ) : (
          <FileCode size={14} className={isSelected ? "text-primary" : "text-slate-500"} />
        )}
        
        <span className="text-[13px] font-medium truncate flex-1">{item.name}</span>
        
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1 hover:text-rose-500 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {isFolder && item.isOpen && item.children && (
        <div className="flex flex-col">
          {item.children.map(child => (
            <FileTreeItem 
              key={child.id} 
              item={child} 
              level={level + 1} 
              activeId={activeId} 
              onSelect={onSelect} 
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- ৩. মেইন কম্পোনেন্ট ---
export const IDEWorkspace = ({ projectName, projectId }: WorkspaceProps) => {
  // স্টেট ম্যানেজমেন্ট
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSideNav, setActiveSideNav] = useState('files');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Vibe Code Engine v1.0 connected...']);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ৪. ডাটাবেজ থেকে ডাটা আনা (Initial Load)
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (data?.files) {
          setFiles(data.files);
          const firstFile = findFirstFile(data.files);
          if (firstFile) {
            setActiveTabId(firstFile.id);
            setOpenTabs([firstFile.id]);
          }
        }
      } catch (err) {
        toast.error("সার্ভার থেকে ডাটা আনতে সমস্যা হইছে!");
      }
    };
    fetchProjectData();
  }, [projectId]);

  // ৫. অটো-সেভ লজিক (৩ সেকেন্ড ডিবাইন্স)
  useEffect(() => {
    if (files.length === 0) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ files, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (!error) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('unsaved');
        toast.error("সেভ করতে পারি নাই!");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [files, projectId]);

  // ৬. হেল্পার ফাংশনসমূহ
  const findFirstFile = (items: FileItem[]): FileItem | null => {
    for (const item of items) {
      if (item.type === 'file') return item;
      if (item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const findFileById = useCallback((items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const activeFile = useMemo(() => findFileById(files, activeTabId), [files, activeTabId, findFileById]);

  // ৭. ফাইল ও ফোল্ডার অপারেশন
  const updateFilesState = (newFiles: FileItem[]) => {
    setFiles(newFiles);
    setSaveStatus('unsaved');
  };

  const addItem = (type: 'file' | 'folder') => {
    const name = prompt(`${type === 'file' ? 'ফাইলের' : 'ফোল্ডারের'} নাম দিন:`);
    if (!name) return;

    const newItem: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      parentId: null,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      isOpen: true,
      extension: name.split('.').pop()
    };

    updateFilesState([...files, newItem]);
    if (type === 'file') {
      setActiveTabId(newItem.id);
      setOpenTabs(prev => [...new Set([...prev, newItem.id])]);
    }
    toast.success(`${name} তৈরি হইছে!`);
  };

  const deleteItem = (id: string) => {
    const recursiveFilter = (items: FileItem[]): FileItem[] => {
      return items.filter(item => {
        if (item.id === id) return false;
        if (item.children) item.children = recursiveFilter(item.children);
        return true;
      });
    };
    updateFilesState(recursiveFilter(files));
    setOpenTabs(prev => prev.filter(t => t !== id));
    toast.error("ডিলিট করা হইছে!");
  };

  const toggleFolder = (id: string) => {
    const recursiveToggle = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === id) return { ...item, isOpen: !item.isOpen };
        if (item.children) return { ...item, children: recursiveToggle(item.children) };
        return item;
      });
    };
    setFiles(recursiveToggle(files));
  };

  // ৮. শর্টকাট কী (Keyboard Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSaveStatus('saving');
        // ফোর্স সেভ লজিক...
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#08080e] text-slate-300 font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="h-12 border-b border-white/5 bg-[#0d0d1a] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
            <Zap className="w-4 h-4 text-primary fill-primary animate-pulse" />
            <span className="text-xs font-black text-white tracking-widest uppercase">{projectName}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin text-amber-500" /> : 
             saveStatus === 'saved' ? <Check size={14} className="text-emerald-500 font-bold" /> : 
             <CloudOff size={14} className="text-rose-500" />}
            <span className={cn("text-[10px] font-bold uppercase", 
              saveStatus === 'saving' ? "text-amber-500" : saveStatus === 'saved' ? "text-emerald-500" : "text-rose-500"
            )}>
              {saveStatus === 'saving' ? "Syncing..." : saveStatus === 'saved' ? "Cloud Active" : "Unsaved"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 hover:bg-white/10"><Share2 size={14}/> Share</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-bold px-4 rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
            <Play size={12} fill="white" className="mr-2" /> RUN
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Settings size={16} /></Button>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Activity Bar (Slim Left) */}
        <nav className="w-14 bg-[#0a0a14] border-r border-white/5 flex flex-col items-center py-4 gap-4">
          <button onClick={() => setActiveSideNav('files')} className={cn("p-2.5 rounded-xl transition-all", activeSideNav === 'files' ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "text-slate-500 hover:text-white")}><FileCode size={22} /></button>
          <button onClick={() => setActiveSideNav('search')} className={cn("p-2.5 rounded-xl transition-all", activeSideNav === 'search' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-white")}><Search size={22} /></button>
          <button onClick={() => setActiveSideNav('git')} className={cn("p-2.5 rounded-xl transition-all", activeSideNav === 'git' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-white")}><GitBranch size={22} /></button>
          <button onClick={() => setActiveSideNav('chat')} className={cn("p-2.5 rounded-xl transition-all mt-auto", activeSideNav === 'chat' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-white")}><MessageSquare size={22} /></button>
        </nav>

        {/* Sidebar Explorer */}
        {showSidebar && (
          <aside className="w-64 bg-[#0d0d1a] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Explorer</span>
              <div className="flex gap-2">
                <button onClick={() => addItem('file')} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all"><FilePlus size={16} /></button>
                <button onClick={() => addItem('folder')} className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-all"><FolderPlus size={16} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
              {files.map(item => (
                <FileTreeItem 
                  key={item.id} 
                  item={item} 
                  level={0} 
                  activeId={activeTabId} 
                  onSelect={(id) => {
                    setActiveTabId(id);
                    setOpenTabs(prev => [...new Set([...prev, id])]);
                  }}
                  onDelete={deleteItem}
                  onToggle={toggleFolder}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Editor Main Area */}
        <main className="flex-1 flex flex-col bg-[#08080e] min-w-0 overflow-hidden">
          
          {/* Tabs Navigation */}
          <div className="flex bg-[#0d0d1a] border-b border-white/5 overflow-x-auto no-scrollbar h-10 items-center">
            {openTabs.map(tabId => {
              const file = findFileById(files, tabId);
              if (!file) return null;
              return (
                <div 
                  key={tabId}
                  onClick={() => setActiveTabId(tabId)}
                  className={cn(
                    "flex items-center gap-2 px-4 h-full text-xs font-medium border-r border-white/5 cursor-pointer transition-all group min-w-[120px]",
                    activeTabId === tabId ? "bg-[#08080e] text-primary border-t-2 border-primary" : "text-slate-500 hover:bg-white/5"
                  )}
                >
                  <FileCode size={12} className={activeTabId === tabId ? "text-primary" : "text-slate-500"} />
                  <span className="truncate flex-1">{file.name}</span>
                  <X 
                    size={14} 
                    className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-sm p-0.5 transition-all" 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTabs = openTabs.filter(t => t !== tabId);
                      setOpenTabs(newTabs);
                      if (activeTabId === tabId && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1]);
                      else if (newTabs.length === 0) setActiveTabId('');
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 relative overflow-hidden">
            {activeFile ? (
              <div className="h-full flex flex-col">
                <div className="flex justify-between px-6 py-2 bg-white/5 border-b border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono italic">src/{activeFile.name}</span>
                  <div className="flex gap-4 text-[10px] text-slate-500">
                    <span>UTF-8</span>
                    <span>Spaces: 2</span>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  value={activeFile.content || ''}
                  onChange={(e) => {
                    const updateContent = (items: FileItem[]): FileItem[] => {
                      return items.map(item => {
                        if (item.id === activeTabId) return { ...item, content: e.target.value };
                        if (item.children) return { ...item, children: updateContent(item.children) };
                        return item;
                      });
                    };
                    updateFilesState(updateContent(files));
                  }}
                  className="flex-1 w-full bg-transparent p-8 font-mono text-sm outline-none resize-none leading-relaxed caret-primary"
                  spellCheck={false}
                  autoFocus
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
                <Code2 size={120} strokeWidth={1} />
                <h2 className="text-3xl font-black mt-4 uppercase tracking-[15px]">Vibe Code</h2>
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 text-xs"><Command size={14} /> + P : Search Files</div>
                  <div className="flex items-center gap-2 text-xs"><Command size={14} /> + B : Toggle Sidebar</div>
                </div>
              </div>
            )}
          </div>

          {/* Integrated Terminal */}
          {showTerminal && (
            <div className="h-48 bg-[#0a0a14] border-t border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Output Terminal</span>
                <button onClick={() => setShowTerminal(false)} className="hover:bg-white/10 p-1 rounded"><X size={12} /></button>
              </div>
              <div className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto custom-scrollbar space-y-1">
                {terminalOutput.map((line, i) => <div key={i}><span className="text-primary mr-2">➜</span> {line}</div>)}
                <div className="flex gap-2">
                  <span className="text-primary">➜</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Preview Panel (Hidden on Mobile) */}
        <div className="w-[450px] border-l border-white/5 bg-[#0d0d1a] hidden xl:flex flex-col">
           <div className="flex h-10 border-b border-white/5">
             <button className="flex-1 text-[10px] font-black uppercase tracking-widest border-b-2 border-primary text-primary">Live Preview</button>
             <button className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">AI Helper</button>
           </div>
           <div className="flex-1 bg-white p-0 overflow-hidden relative group">
             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-[10px] text-white flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all">
                <Globe size={12} className="text-primary" /> localhost:3000
             </div>
             <iframe srcDoc="<html><body style='background:#f8fafc; font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;'><div><h1 style='color:#0f172a;'>Preview Ready!</h1><p style='color:#64748b;'>Start coding to see changes.</p></div></body></html>" className="w-full h-full border-none" />
           </div>
        </div>
      </div>

      {/* --- STATUS BAR --- */}
      <footer className="h-6 bg-[#0d0d1a] border-t border-white/5 px-3 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[1px]">
        <div className="flex gap-4">
          <button onClick={() => setShowTerminal(!showTerminal)} className="flex items-center gap-1.5 hover:text-primary transition-all cursor-pointer">
            <Terminal size={12} /> Terminal
          </button>
          <div className="flex items-center gap-1.5 cursor-help">
            <GitBranch size={12} /> Main*
          </div>
          <div className="flex items-center gap-1.5 text-emerald-500/70">
            <Zap size={12} /> Engine: 180°C
          </div>
        </div>
        <div className="flex gap-5">
          <span className="hover:text-white transition-all cursor-default">Line 1, Col 1</span>
          <span className="hover:text-white transition-all cursor-default">UTF-8</span>
          <span className="text-primary font-black tracking-tighter">Bogura Server v2.1</span>
        </div>
      </footer>

      {/* --- CUSTOM STYLES --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        textarea { caret-color: #3b82f6; }
      `}</style>
    </div>
  );
};
