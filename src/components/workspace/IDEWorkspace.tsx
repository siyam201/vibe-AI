import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Share2, Settings, History,
  Terminal, Eye, Code2, Package, Save, Download, FolderOpen, GitBranch,
  CloudCheck, CloudOff, Loader2, Plus, X, Trash2, Edit3, ChevronRight,
  ChevronDown, Search, FileCode, FolderPlus, FilePlus, Copy, Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
// একদম সঠিক পাথ হবে এইটা (আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী):
import { supabase } from '../integrations/supabase/client';

// --- Types ---
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  parentId: string | null;
  children?: FileItem[];
}

interface WorkspaceProps {
  projectName: string;
  projectId: string;
}

// --- Main Component ---
export const IDEWorkspace = ({ projectName, projectId }: WorkspaceProps) => {
  // 1. Core State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // 2. UI Panels State
  const [leftPanel, setLeftPanel] = useState<'files' | 'search' | 'git'>('files');
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview'>('chat');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // 3. Performance Optimized File Lookup
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

  // 4. Initial Data Load from Supabase
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (data && data.files) {
          setFiles(data.files);
          if (data.files.length > 0) {
            const firstFile = data.files.find((f: any) => f.type === 'file');
            if (firstFile) {
              setActiveTabId(firstFile.id);
              setOpenTabs([firstFile.id]);
            }
          }
        }
      } catch (err) {
        toast.error("সুপাবেস থেকে ফাইল আনতে পারি নাই!");
      }
    };
    fetchProject();
  }, [projectId]);

  // 5. Smart 5-Second Auto Save (Debounced)
  useEffect(() => {
    if (files.length === 0) return;

    const saveTimer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('projects')
          .update({ 
            files: files, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', projectId);

        if (error) throw error;
        setSaveStatus('saved');
        console.log("বগুড়ার সার্ভারে ফাইল সেভ হইছে!");
      } catch (err) {
        setSaveStatus('unsaved');
        toast.error("সার্ভারে সেভ করতে সমস্যা হইছে!");
      }
    }, 5000); // ৫ সেকেন্ড ডিবাইন্স

    return () => clearTimeout(saveTimer);
  }, [files, projectId]);

  // 6. File Operations
  const updateContent = (content: string) => {
    if (!activeTabId) return;
    setSaveStatus('unsaved');
    
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === activeTabId) return { ...item, content };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    };
    setFiles(prev => updateRecursive(prev));
  };

  const createFile = (name: string, type: 'file' | 'folder' = 'file') => {
    const newFile: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      parentId: null,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      extension: name.split('.').pop()
    };
    setFiles(prev => [...prev, newFile]);
    if (type === 'file') {
      setActiveTabId(newFile.id);
      setOpenTabs(prev => [...new Set([...prev, newFile.id])]);
    }
    toast.success(`${name} তৈরি হইছে!`);
  };

  const deleteFile = (id: string) => {
    const filterRecursive = (items: FileItem[]): FileItem[] => {
      return items.filter(item => {
        if (item.id === id) return false;
        if (item.children) item.children = filterRecursive(item.children);
        return true;
      });
    };
    setFiles(prev => filterRecursive(prev));
    setOpenTabs(prev => prev.filter(t => t !== id));
    if (activeTabId === id) setActiveTabId('');
    toast.error("ফাইল ডিলিট করা হইছে!");
  };

  // 7. Folder Toggle
  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFolders(newSet);
  };

  // 8. Render Preview Logic
  const generatePreview = () => {
    // এখানে আপনার আগের আইডির প্রিভিউ লজিক কাজ করবে
    const html = files.find(f => f.name === 'index.html')?.content || '';
    const css = files.find(f => f.name === 'style.css')?.content || '';
    return `<html><style>${css}</style><body>${html}</body></html>`;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#08080e] text-slate-300 font-sans selection:bg-primary/30">
      
      {/* --- Header / Navigation --- */}
      <nav className="h-12 border-b border-white/5 bg-[#0d0d1a] flex items-center justify-between px-4 z-50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md border border-white/5">
            <Package className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">{projectName}</span>
          </div>
          
          <div className="h-4 w-[1px] bg-white/10" />
          
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/20">
            {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin text-amber-500" /> : 
             saveStatus === 'saved' ? <CloudCheck size={14} className="text-emerald-500" /> : 
             <CloudOff size={14} className="text-rose-500" />}
            <span className={cn("text-[10px] font-black uppercase tracking-tighter", 
              saveStatus === 'saving' ? "text-amber-500" : saveStatus === 'saved' ? "text-emerald-500" : "text-rose-500")}>
              {saveStatus === 'saving' ? 'Syncing...' : saveStatus === 'saved' ? 'Cloud Synced' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10"><Search size={16} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10"><Github size={16} /></Button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-4 h-8 rounded-full shadow-lg shadow-emerald-900/20" onClick={() => toast.info("প্রজেক্ট রান হচ্ছে...")}>
            <Play size={12} fill="white" /> RUN
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10 h-8 rounded-full text-xs" onClick={() => setRightPanel('preview')}>
            <Eye size={12} className="mr-2" /> PREVIEW
          </Button>
        </div>
      </nav>

      {/* --- Workspace Layout --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Activity Bar (Slim Left) */}
        <div className="w-12 bg-[#0a0a14] border-r border-white/5 flex flex-col items-center py-4 gap-4">
          <button onClick={() => setLeftPanel('files')} className={cn("p-2 rounded-lg transition-all", leftPanel === 'files' ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "text-slate-500 hover:text-slate-300")}><FileCode size={20} /></button>
          <button onClick={() => setLeftPanel('search')} className={cn("p-2 rounded-lg transition-all", leftPanel === 'search' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-slate-300")}><Search size={20} /></button>
          <button onClick={() => setLeftPanel('git')} className={cn("p-2 rounded-lg transition-all", leftPanel === 'git' ? "text-primary bg-primary/10" : "text-slate-500 hover:text-slate-300")}><GitBranch size={20} /></button>
          <div className="mt-auto mb-2 flex flex-col gap-4">
            <button className="text-slate-500 hover:text-white"><Settings size={20} /></button>
          </div>
        </div>

        {/* Sidebar Content */}
        {showSidebar && (
          <div className="w-60 bg-[#0d0d1a] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-3 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Explorer</span>
              <div className="flex gap-1">
                <button onClick={() => createFile('new_file.js')} className="p-1 hover:bg-white/10 rounded"><FilePlus size={14} /></button>
                <button onClick={() => createFile('new_folder', 'folder')} className="p-1 hover:bg-white/10 rounded"><FolderPlus size={14} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {files.map(file => (
                <div key={file.id} className="group">
                  <div 
                    onClick={() => {
                      if (file.type === 'file') {
                        setActiveTabId(file.id);
                        setOpenTabs(prev => [...new Set([...prev, file.id])]);
                      } else {
                        toggleFolder(file.id);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all duration-200 mb-[2px]",
                      activeTabId === file.id ? "bg-primary/20 text-white" : "hover:bg-white/5 text-slate-400"
                    )}
                  >
                    {file.type === 'folder' ? (
                      expandedFolders.has(file.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : <FileCode size={14} className={activeTabId === file.id ? "text-primary" : "text-slate-500"} />}
                    <span className="text-xs font-medium truncate flex-1">{file.name}</span>
                    <button onClick={(e) => {e.stopPropagation(); deleteFile(file.id)}} className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor Engine */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#08080e] relative">
          
          {/* Tabs Bar */}
          <div className="flex bg-[#0d0d1a] overflow-x-auto no-scrollbar border-b border-white/5">
            {openTabs.map(tabId => {
              const file = findFileById(files, tabId);
              if (!file) return null;
              return (
                <div 
                  key={tabId}
                  onClick={() => setActiveTabId(tabId)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-xs font-medium border-r border-white/5 cursor-pointer min-w-[140px] transition-all relative group",
                    activeTabId === tabId ? "bg-[#08080e] text-primary border-t-2 border-primary shadow-inner" : "text-slate-500 hover:bg-white/5"
                  )}
                >
                  <FileCode size={12} />
                  <span className="truncate">{file.name}</span>
                  <X size={12} className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded" 
                    onClick={(e) => { e.stopPropagation(); setOpenTabs(openTabs.filter(t => t !== tabId)); }} />
                </div>
              );
            })}
          </div>

          {/* Code Area */}
          <div className="flex-1 relative">
            {activeFile ? (
              <textarea
                value={activeFile.content || ''}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full h-full bg-transparent p-8 font-mono text-[13px] outline-none resize-none text-slate-300 leading-relaxed caret-primary selection:bg-primary/20"
                spellCheck={false}
                autoFocus
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
                <Code2 size={120} />
                <h2 className="text-2xl font-black mt-4 uppercase tracking-[10px]">Vibe Code</h2>
              </div>
            )}
          </div>

          {/* Simple Terminal (Footer of Editor) */}
          {showTerminal && (
            <div className="h-40 bg-[#0a0a14] border-t border-white/10 p-4 font-mono text-xs text-emerald-500 overflow-y-auto">
              <div className="flex gap-2">
                <span className="text-primary font-bold">siayam@bogura:~$</span>
                <span>npm start project --port 3000</span>
              </div>
              <div className="mt-2 text-slate-500 tracking-tighter">
                {`> Initializing build...`} <br />
                {`> Project updated at ${new Date().toLocaleTimeString()}`} <br />
                {`> Connected to Supabase Cluster: OK`}
              </div>
            </div>
          )}
        </div>

        {/* Right Section (AI / Preview / Git) */}
        <div className="w-[450px] bg-[#0d0d1a] border-l border-white/5 flex flex-col hidden lg:flex">
          <div className="flex h-10 border-b border-white/5">
            <button onClick={() => setRightPanel('chat')} className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all", rightPanel === 'chat' ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-slate-500")}>AI Assistant</button>
            <button onClick={() => setRightPanel('preview')} className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all", rightPanel === 'preview' ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-slate-500")}>Live Preview</button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'chat' ? (
              <div className="h-full flex flex-col p-4 bg-gradient-to-b from-transparent to-primary/5">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs leading-relaxed">আসসালামু আলাইকুম সিয়াম ভাই! আমি আপনার কোড হেল্পার। ৫ সেকেন্ডের অটো-সেভ চালু আছে। কি করতে হবে বলেন?</p>
                  </div>
                </div>
                <div className="relative group">
                  <input type="text" placeholder="AI-কে কিছু জিজ্ঞেস করবেন?" className="w-full bg-[#111122] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary/20 rounded-lg text-primary hover:bg-primary hover:text-white transition-colors"><ChevronRight size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white flex flex-col">
                <div className="h-8 bg-slate-100 flex items-center px-4 gap-2 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded text-[10px] px-2 py-0.5 border border-slate-200 truncate">localhost:3000/preview</div>
                </div>
                <iframe srcDoc={generatePreview()} className="flex-1 w-full border-none shadow-2xl" title="preview" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Status Bar --- */}
      <footer className="h-6 bg-[#0d0d1a] border-t border-white/5 px-3 flex items-center justify-between text-[10px] font-medium text-slate-500 uppercase tracking-widest">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer" onClick={() => setShowTerminal(!showTerminal)}>
            <Terminal size={12} />
            <span>Terminal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} />
            <span>Main*</span>
          </div>
        </div>
        <div className="flex gap-4">
          <span>JavaScript</span>
          <span>Bogura Server: Active</span>
          <span className="text-primary font-black">180°C Engine</span>
        </div>
      </footer>

      {/* Custom Styles for Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
