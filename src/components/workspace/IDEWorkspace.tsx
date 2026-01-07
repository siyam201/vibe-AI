import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Share2, Settings, History,
  Terminal, Eye, Code2, Package, Save, Download, FolderOpen, GitBranch,
  Cloud, Check, CloudOff, Loader2, Plus, X, Trash2, Edit3, ChevronRight,
  ChevronDown, Search, FileCode, FolderPlus, FilePlus, Copy, Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

export const IDEWorkspace = ({ projectName, projectId }: WorkspaceProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // ১. সুপাবেস থেকে ডাটা লোড করা
  useEffect(() => {
    const fetchProjectData = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('files')
        .eq('id', projectId)
        .single();

      if (data?.files) {
        setFiles(data.files);
        // প্রথম ফাইলটি ডিফল্ট ওপেন হবে
        const firstFile = findFirstFile(data.files);
        if (firstFile) {
          setActiveTabId(firstFile.id);
          setOpenTabs([firstFile.id]);
        }
      }
    };
    fetchProjectData();
  }, [projectId]);

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

  // ২. অটো-সেভ সিস্টেম (ফাইল ও ফোল্ডার উভয়ই ক্লাউডে যাবে)
  useEffect(() => {
    if (files.length === 0) return;

    const saveToCloud = setTimeout(async () => {
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
      } else {
        setSaveStatus('unsaved');
        toast.error("ক্লাউডে সেভ করতে পারি নাই!");
      }
    }, 3000); // ৩ সেকেন্ড পর অটো সেভ হবে

    return () => clearTimeout(saveToCloud);
  }, [files, projectId]);

  // ৩. রিকার্সিভ ফাইল/ফোল্ডার আপডেট ফাংশন
  const updateFilesState = (newFiles: FileItem[]) => {
    setFiles(newFiles);
    setSaveStatus('unsaved');
  };

  // ৪. ফাইল বা ফোল্ডার তৈরি (নতুন সিস্টেম)
  const addItem = (parentId: string | null, type: 'file' | 'folder') => {
    const name = prompt(`${type === 'file' ? 'ফাইলের' : 'ফোল্ডারের'} নাম লিখুন:`);
    if (!name) return;

    const newItem: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      parentId,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : [],
      extension: name.split('.').pop()
    };

    if (!parentId) {
      updateFilesState([...files, newItem]);
    } else {
      const addChild = (items: FileItem[]): FileItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), newItem] };
          }
          if (item.children) {
            return { ...item, children: addChild(item.children) };
          }
          return item;
        });
      };
      updateFilesState(addChild(files));
    }
    toast.success(`${name} তৈরি হইছে!`);
  };

  // ৫. ফাইল ডিলিট সিস্টেম
  const deleteItem = (id: string) => {
    const filterItems = (items: FileItem[]): FileItem[] => {
      return items.filter(item => {
        if (item.id === id) return false;
        if (item.children) {
          item.children = filterItems(item.children);
        }
        return true;
      });
    };
    updateFilesState(filterItems(files));
    setOpenTabs(prev => prev.filter(t => t !== id));
    toast.error("ডিলিট করা হইছে!");
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

  return (
    <div className="flex flex-col h-screen w-full bg-[#08080e] text-slate-300 overflow-hidden">
      {/* Top Header */}
      <nav className="h-12 border-b border-white/5 bg-[#0d0d1a] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-1.5 rounded-lg"><Package size={18} className="text-primary" /></div>
          <span className="text-xs font-bold uppercase tracking-widest">{projectName}</span>
          <div className="flex items-center gap-2 ml-4 px-2 py-1 bg-white/5 rounded">
            {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin text-amber-500" /> : 
             saveStatus === 'saved' ? <Check size={12} className="text-emerald-500" /> : 
             <CloudOff size={12} className="text-rose-500" />}
            <span className="text-[10px] font-bold uppercase">{saveStatus}</span>
          </div>
        </div>
        <Button size="sm" className="bg-emerald-600 h-8"><Play size={14} className="mr-2" /> RUN</Button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-[#0d0d1a] flex flex-col">
          <div className="p-3 border-b border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-black opacity-50 uppercase">Explorer</span>
            <div className="flex gap-1">
              <button onClick={() => addItem(null, 'file')} title="New File"><FilePlus size={14} /></button>
              <button onClick={() => addItem(null, 'folder')} title="New Folder"><FolderPlus size={14} /></button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
             {/* ফাইল লিস্ট রেন্ডারিং এখানে হবে (রিকার্সিভলি) */}
             {files.map(file => (
               <div key={file.id} className="mb-1">
                 <div 
                   onClick={() => file.type === 'file' ? (setActiveTabId(file.id), setOpenTabs([...new Set([...openTabs, file.id])])) : null}
                   className={cn("flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5", activeTabId === file.id && "bg-primary/20 text-white")}
                 >
                   {file.type === 'folder' ? <ChevronRight size={14} /> : <FileCode size={14} />}
                   <span className="text-xs flex-1 truncate">{file.name}</span>
                   <button onClick={() => deleteItem(file.id)}><Trash2 size={12} className="text-slate-500 hover:text-rose-500" /></button>
                 </div>
               </div>
             ))}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col bg-[#08080e]">
          <div className="flex bg-[#0d0d1a] border-b border-white/5 overflow-x-auto">
            {openTabs.map(tabId => {
              const file = findFileById(files, tabId);
              return (
                <div key={tabId} onClick={() => setActiveTabId(tabId)} className={cn("px-4 py-2 text-xs border-r border-white/5 flex items-center gap-2 cursor-pointer", activeTabId === tabId ? "bg-[#08080e] border-t-2 border-primary" : "opacity-50")}>
                  <span>{file?.name}</span>
                  <X size={12} onClick={(e) => { e.stopPropagation(); setOpenTabs(openTabs.filter(t => t !== tabId)); }} />
                </div>
              );
            })}
          </div>
          <div className="flex-1">
            {activeFile ? (
              <textarea
                value={activeFile.content}
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
                className="w-full h-full bg-transparent p-6 font-mono text-sm outline-none resize-none"
              />
            ) : (
              <div className="h-full flex items-center justify-center opacity-10 uppercase tracking-[10px] font-black">Vibe Code</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
