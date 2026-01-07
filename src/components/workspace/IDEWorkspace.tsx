import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Share2, Settings, History,
  Terminal, Eye, Code2, Package, Save, Download, FolderOpen, GitBranch,
  Cloud, Check, CloudOff, Loader2, Plus, X, Trash2, Edit3, ChevronRight,
  ChevronDown, Search, FileCode, FolderPlus, FilePlus, Copy, Github,
  MoreVertical, Command, Zap, MessageSquare, Globe, Send, Sparkles, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// --- TYPES ---
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

interface IDEWorkspaceProps {
  projectName: string;
  projectId: string; // সুপাবেস প্রজেক্ট আইডি
}

// --- HELPER COMPONENT: FILE TREE ---
const FileNode = ({ 
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
  onSelect: (item: FileItem) => void; 
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) => {
  const isSelected = activeId === item.id;
  const isFolder = item.type === 'folder';

  return (
    <div className="flex flex-col select-none">
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 cursor-pointer group transition-all",
          isSelected ? "bg-primary/20 text-white border-l-2 border-primary" : "hover:bg-white/5 text-slate-400"
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => isFolder ? onToggle(item.id) : onSelect(item)}
      >
        {isFolder ? (
          item.isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
        ) : (
          <FileCode size={14} className={isSelected ? "text-primary" : "text-slate-500"} />
        )}
        <span className="text-[13px] font-medium truncate flex-1">{item.name}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isFolder && item.isOpen && item.children && (
        <div>
          {item.children.map(child => (
            <FileNode 
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

// --- MAIN WORKSPACE COMPONENT ---
export const IDEWorkspace = ({ projectName, projectId }: IDEWorkspaceProps) => {
  // ১. সকল স্টেট (State Management)
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'preview' | 'ai' | 'git'>('preview');
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>('');

  // ২. সুপাবেস থেকে ডাটা লোড করা
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (data?.files) {
          setFiles(data.files);
          // প্রথম ফাইলটি অটো ওপেন করা
          const firstFile = findFirstFile(data.files);
          if (firstFile) {
            setActiveTabId(firstFile.id);
            setOpenTabs([firstFile.id]);
          }
        }
      } catch (err) {
        toast.error("সুপাবেস ডাটাবেজ কানেক্ট হচ্ছে না!");
      }
    };
    fetchProject();
  }, [projectId]);

  // ৩. অটো-সেভ লজিক (Auto-Save Function)
  useEffect(() => {
    if (files.length === 0) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ 
          files: files, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', projectId);

      if (!error) {
        setSaveStatus('saved');
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        setSaveStatus('error');
        toast.error("সেভ করা সম্ভব হয়নি!");
      }
    }, 3000); // ৩ সেকেন্ড ডিবাইন্স

    return () => clearTimeout(timer);
  }, [files, projectId]);

  // ৪. ফাইল অপারেশনস (Recursive Helpers)
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

  const toggleFolder = (id: string) => {
    const update = (items: FileItem[]): FileItem[] => items.map(item => {
      if (item.id === id) return { ...item, isOpen: !item.isOpen };
      if (item.children) return { ...item, children: update(item.children) };
      return item;
    });
    setFiles(update(files));
  };

  const addNewItem = (type: 'file' | 'folder') => {
    const name = prompt(`${type === 'file' ? 'File' : 'Folder'} Name:`);
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
    if (type === 'file') {
      setActiveTabId(newItem.id);
      setOpenTabs(prev => [...new Set([...prev, newItem.id])]);
    }
  };

  const deleteItem = (id: string) => {
    const filter = (items: FileItem[]): FileItem[] => items.filter(item => {
      if (item.id === id) return false;
      if (item.children) item.children = filter(item.children);
      return true;
    });
    setFiles(filter(files));
    setOpenTabs(prev => prev.filter(tid => tid !== id));
  };

  // ৫. AI চ্যাট হ্যান্ডলার
  const handleAiSearch = () => {
    if (!aiMessage.trim()) return;
    const userMsg = aiMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiMessage('');
    
    // সিমুলেটেড AI রেসপন্স (বগুড়ার ভাষায় কিছুটা স্বাদ রাখা হয়েছে)
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: `সিয়াম ভাই, "${userMsg}" এর ওপর কাজ করছি। আপনার বর্তমান ফাইল "${activeFile?.name || 'কোনো ফাইল নেই'}" এ আমি কিছু কোড অপ্টিমাইজ করার পরামর্শ দিচ্ছি।` 
      }]);
    }, 1000);
  };

  // ৬. প্রিভিউ কোড জেনারেটর
  const getPreviewDoc = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'))?.content || '<h1>No index.html</h1>';
    const cssFile = files.find(f => f.name.endsWith('.css'))?.content || '';
    return `
      <html>
        <style>${cssFile}</style>
        <body>${htmlFile}</body>
      </html>
    `;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#08080e] text-slate-300 font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="h-12 border-b border-white/5 bg-[#0d0d1a] flex items-center justify-between px-4 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span className="text-xs font-black text-white tracking-widest uppercase">{projectName}</span>
          </div>
          
          {/* Cloud Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin text-amber-500" /> : 
             saveStatus === 'saved' ? <Check size={14} className="text-emerald-500 font-bold" /> : 
             <CloudOff size={14} className="text-rose-500" />}
            <span className={cn("text-[9px] font-bold uppercase tracking-tighter", 
              saveStatus === 'saving' ? "text-amber-500" : saveStatus === 'saved' ? "text-emerald-500" : "text-rose-500"
            )}>
              {saveStatus === 'saving' ? "Syncing..." : saveStatus === 'saved' ? `Synced ${lastSynced}` : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-2 hover:bg-white/10"><Share2 size={14}/> SHARE</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[11px] font-bold px-4 rounded-full transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            <Play size={12} fill="white" className="mr-2" /> RUN APP
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Settings size={16} /></Button>
        </div>
      </header>

      {/* --- MAIN BODY --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Mini Sidebar (Activity Bar) */}
        <nav className="w-14 bg-[#0a0a14] border-r border-white/5 flex flex-col items-center py-4 gap-4">
          <button onClick={() => setShowSidebar(!showSidebar)} className={cn("p-2.5 rounded-xl transition-all", showSidebar ? "text-primary bg-primary/10" : "text-slate-500 hover:text-white")}><FolderOpen size={20} /></button>
          <button onClick={() => setRightPanel('ai')} className={cn("p-2.5 rounded-xl transition-all", rightPanel === 'ai' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-white")}><MessageSquare size={20} /></button>
          <button onClick={() => setRightPanel('preview')} className={cn("p-2.5 rounded-xl transition-all", rightPanel === 'preview' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-white")}><Globe size={20} /></button>
          <div className="mt-auto p-2.5 text-slate-600 hover:text-white cursor-pointer"><Settings size={20} /></div>
        </nav>

        {/* File Explorer Sidebar */}
        {showSidebar && (
          <aside className="w-64 bg-[#0d0d1a] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Explorer</span>
              <div className="flex gap-2">
                <button onClick={() => addNewItem('file')} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"><FilePlus size={15} /></button>
                <button onClick={() => addNewItem('folder')} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"><FolderPlus size={15} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
              {files.map(item => (
                <FileNode 
                  key={item.id} 
                  item={item} 
                  level={0} 
                  activeId={activeTabId} 
                  onSelect={(file) => {
                    setActiveTabId(file.id);
                    setOpenTabs(prev => [...new Set([...prev, file.id])]);
                  }}
                  onDelete={deleteItem}
                  onToggle={toggleFolder}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Center: Editor Area */}
        <main className="flex-1 flex flex-col bg-[#08080e] min-w-0 overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex bg-[#0d0d1a] border-b border-white/5 overflow-x-auto no-scrollbar h-10 items-center">
            {openTabs.map(tabId => {
              const file = findFileById(files, tabId);
              if (!file) return null;
              return (
                <div 
                  key={tabId}
                  onClick={() => setActiveTabId(tabId)}
                  className={cn(
                    "flex items-center gap-2 px-4 h-full text-[11px] font-medium border-r border-white/5 cursor-pointer transition-all group min-w-[120px]",
                    activeTabId === tabId ? "bg-[#08080e] text-primary border-t-2 border-primary" : "text-slate-500 hover:bg-white/5"
                  )}
                >
                  <FileCode size={12} className={activeTabId === tabId ? "text-primary" : "text-slate-500"} />
                  <span className="truncate flex-1">{file.name}</span>
                  <X 
                    size={12} 
                    className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTabs = openTabs.filter(t => t !== tabId);
                      setOpenTabs(newTabs);
                      if (activeTabId === tabId && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1]);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Text Editor */}
          <div className="flex-1 relative overflow-hidden">
            {activeFile ? (
              <textarea
                value={activeFile.content || ''}
                spellCheck={false}
                onChange={(e) => {
                  const update = (items: FileItem[]): FileItem[] => items.map(item => {
                    if (item.id === activeTabId) return { ...item, content: e.target.value };
                    if (item.children) return { ...item, children: update(item.children) };
                    return item;
                  });
                  setFiles(update(files));
                  setSaveStatus('unsaved');
                }}
                className="w-full h-full bg-transparent p-8 font-mono text-sm outline-none resize-none leading-relaxed caret-primary text-slate-200"
                autoFocus
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
                <Code2 size={100} strokeWidth={1} />
                <h2 className="text-2xl font-black mt-4 uppercase tracking-[10px]">VIBE CODE</h2>
                <p className="mt-2 text-xs">বগুড়া থেকে বিশ্বজয়ের পথে সিয়াম ভাই</p>
              </div>
            )}
          </div>

          {/* Integrated Terminal Panel */}
          {isTerminalOpen && (
            <div className="h-48 bg-[#0a0a14] border-t border-white/10 flex flex-col animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Bash Output</span>
                <button onClick={() => setIsTerminalOpen(false)} className="hover:bg-white/10 p-1 rounded"><X size={12} /></button>
              </div>
              <div className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto custom-scrollbar">
                <div>➜ <span className="text-white">vibecode init</span></div>
                <div className="text-slate-500">Project {projectName} initialized successfully.</div>
                <div className="mt-1">➜ <span className="animate-pulse">_</span></div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Preview & AI */}
        <aside className="w-[450px] border-l border-white/5 bg-[#0d0d1a] flex flex-col overflow-hidden">
          <div className="flex h-10 border-b border-white/5">
            <button onClick={() => setRightPanel('preview')} className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all", rightPanel === 'preview' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-500")}>Live Preview</button>
            <button onClick={() => setRightPanel('ai')} className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all", rightPanel === 'ai' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-500")}>AI Assistant</button>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {rightPanel === 'preview' ? (
              <div className="h-full bg-white flex flex-col">
                <div className="h-8 bg-slate-100 flex items-center px-4 text-[10px] text-slate-500 gap-2 border-b border-slate-200">
                  <Globe size={10} /> localhost:3000
                  <RefreshCw size={10} className="ml-auto cursor-pointer" />
                </div>
                <iframe srcDoc={getPreviewDoc()} className="w-full h-full border-none" title="preview" />
              </div>
            ) : (
              <div className="h-full flex flex-col p-4 bg-gradient-to-b from-[#0d0d1a] to-primary/5">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-10">
                      <Sparkles className="mx-auto w-10 h-10 text-primary opacity-50 mb-4" />
                      <p className="text-xs text-slate-500 italic">"সিয়াম ভাই, কি সাহায্য করতে পারি?"</p>
                    </div>
                  )}
                  {chatHistory.map((chat, i) => (
                    <div key={i} className={cn("flex flex-col gap-1 max-w-[90%]", chat.role === 'user' ? "ml-auto items-end" : "items-start")}>
                      <div className={cn("p-3 rounded-2xl text-[12px] leading-relaxed", chat.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none")}>
                        {chat.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                    placeholder="Ask AI or type code..." 
                    className="w-full bg-[#16162a] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12 text-slate-200" 
                  />
                  <button onClick={handleAiSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary/20 rounded-lg text-primary hover:bg-primary hover:text-white transition-all">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* --- STATUS FOOTER --- */}
      <footer className="h-6 bg-[#0d0d1a] border-t border-white/5 px-4 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex gap-4">
          <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className="flex items-center gap-1.5 hover:text-white transition-all"><Terminal size={12} /> Terminal</button>
          <div className="flex items-center gap-1.5"><GitBranch size={12} /> master*</div>
          <div className="flex items-center gap-1.5 text-primary"><RefreshCw size={12} className="animate-spin" /> Auto-Sync Active</div>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-500/80">Bogura Node: Active</span>
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 tracking-tighter">VibeCode v2.1.0</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
