import { useState, useCallback, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Share2,
  Settings,
  History,
  Terminal,
  Eye,
  Code2,
  Package,
  Save,
  Download,
  FolderOpen,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileExplorer, FileItem } from '@/components/files/FileExplorer';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { VersionHistory } from '@/components/history/VersionHistory';
import { ShareDialog } from '@/components/share/ShareDialog';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { PackageManager } from '@/components/packages/PackageManager';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { GitPanel } from '@/components/git/GitPanel';
import { useFileOperations, FileOperation } from '@/hooks/useFileOperations';
import { useProjectHistory, getDefaultFiles } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase'; // সিয়াম ভাই, এই ইমপোর্টটি নিশ্চিত করুন

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

const getLanguage = (extension?: string) => {
  switch (extension) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'jsx': return 'javascript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

export const IDEWorkspace = ({ projectName, onPublish, initialPrompt, initialMode }: IDEWorkspaceProps) => {
  const {
    projects,
    currentProject,
    createProject,
    updateProjectFiles,
    deleteProject,
    loadProject,
    duplicateProject,
  } = useProjectHistory();

  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'index-html', name: 'index.html', language: 'html' }]);
  const [activeTabId, setActiveTabId] = useState('index-html');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview' | 'git'>('chat');
  const [isSaving, setIsSaving] = useState(false);

  const [queuedChatMessage, setQueuedChatMessage] = useState<{ id: string; content: string; mode?: string } | null>(
    initialPrompt ? { id: Date.now().toString(), content: initialPrompt, mode: initialMode || 'plan' } : null
  );

  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // --- সিয়াম ভাই, এই ফাংশনটি ফাইলগুলোকে ডাটাবেসে সেভ করবে ---
  const saveToSupabase = useCallback(async (currentFiles: FileItem[]) => {
    if (!projectName) return;
    
    setIsSaving(true);
    try {
      const fileMap: Record<string, string> = {};
      
      // ফাইল ট্রি থেকে সব ফাইল বের করে একটি ফ্ল্যাট অবজেক্ট বানানো
      const extract = (items: FileItem[]) => {
        items.forEach(item => {
          if (item.type === 'file' && item.content !== undefined) {
            fileMap[item.name] = item.content;
          }
          if (item.children) extract(item.children);
        });
      };
      extract(currentFiles);

      // সুপাবেজে আপডেট পাঠানো
      const { error } = await supabase
        .from('app_previews')
        .update({ 
          files: fileMap, // এখানেই আপনার ১৭-১৮টি ফাইল সেভ হবে
          html_content: fileMap['index.html'] || '',
          updated_at: new Date().toISOString()
        })
        .eq('app_name', projectName);

      if (error) throw error;
      console.log("Database updated successfully with files");
    } catch (err) {
      console.error("Database Sync Error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [projectName]);

  useEffect(() => {
    if (currentProject) {
      setFiles(currentProject.files);
    }
  }, [currentProject]);

  // অটো-সেভ লজিক: ফাইল পরিবর্তন হলে সুপাবেজে পাঠাবে
  useEffect(() => {
    if (currentProject && files !== currentProject.files) {
      const debounce = setTimeout(() => {
        updateProjectFiles(currentProject.id, files);
        saveToSupabase(files); // ডাটাবেসে ফাইলগুলো পাঠানো হচ্ছে
      }, 2000); // পিসি স্লো না হওয়ার জন্য ২ সেকেন্ড ডিলে রাখা হয়েছে
      return () => clearTimeout(debounce);
    }
  }, [files, currentProject, updateProjectFiles, saveToSupabase]);

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

  const activeFile = findFile(files, activeTabId);
  const currentContent = activeFile?.content || '';
  const currentLanguage = getLanguage(activeFile?.extension);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => {
      return items.map(item => {
        if (item.id === fileId) return { ...item, content };
        if (item.children) return { ...item, children: updateRecursive(item.children) };
        return item;
      });
    };
    setFiles(prev => updateRecursive(prev));
    setOpenTabs(tabs => tabs.map(tab => tab.id === fileId ? { ...tab, isDirty: true } : tab));
  }, []);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      if (!openTabs.find(t => t.id === file.id)) {
        setOpenTabs([...openTabs, { id: file.id, name: file.name, language: getLanguage(file.extension) }]);
      }
      setActiveTabId(file.id);
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const handleFileCreate = (parentId: string | null, name: string, type: 'file' | 'folder') => {
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type,
      extension: name.includes('.') ? name.split('.').pop() : undefined,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
    };
    const addToParent = (items: FileItem[]): FileItem[] => {
      if (!parentId) return [...items, newFile];
      return items.map(item => {
        if (item.id === parentId && item.children) return { ...item, children: [...item.children, newFile] };
        if (item.children) return { ...item, children: addToParent(item.children) };
        return item;
      });
    };
    setFiles(addToParent(files));
    toast.success(`Created ${name}`);
  };

  const handleFileDelete = (fileId: string) => {
    const del = (items: FileItem[]): FileItem[] => items.filter(i => i.id !== fileId).map(i => ({...i, children: i.children ? del(i.children) : undefined}));
    setFiles(del(files));
    setOpenTabs(tabs => tabs.filter(t => t.id !== fileId));
    toast.success('File deleted');
  };

  const handleFileRename = (fileId: string, newName: string) => {
    const ren = (items: FileItem[]): FileItem[] => items.map(i => i.id === fileId ? {...i, name: newName, extension: newName.split('.').pop()} : {...i, children: i.children ? ren(i.children) : undefined});
    setFiles(ren(files));
  };

  // প্রিভিউ ডাটা জেনারেশন
  const getPreviewCode = () => {
    let html = '';
    const fileMap: Record<string, string> = {};
    const css: string[] = [], js: string[] = [];

    const find = (items: FileItem[]) => {
      items.forEach(i => {
        if (i.type === 'file' && i.content) {
          fileMap[i.name] = i.content;
          if (i.extension === 'css') css.push(i.content);
          if (i.extension === 'js') js.push(i.content);
        }
        if (i.children) find(i.children);
      });
    };
    find(files);

    const activeTab = openTabs.find(t => t.id === activeTabId);
    html = (activeTab?.name.endsWith('.html')) ? fileMap[activeTab.name] : (fileMap['index.html'] || '');

    return { html, css: css.join('\n\n'), js: js.join('\n\n'), fileMap };
  };

  const { html, css, js, fileMap } = getPreviewCode();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <Package className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{currentProject?.name || projectName}</span>
          {isSaving && <span className="text-[10px] text-green-500 animate-pulse ml-2">Syncing DB...</span>}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowProjectHistory(true)}><FolderOpen className="w-4 h-4" /> Projects</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowTerminal(!showTerminal)}><Terminal className="w-4 h-4" /> Shell</Button>
          <Button variant="ghost" size="sm" onClick={() => setRightPanel('git')}><GitBranch className="w-4 h-4" /> Git</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}><History className="w-4 h-4" /> History</Button>
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 ml-2" onClick={onPublish}><Play className="w-4 h-4" /> Run</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-56 flex flex-col border-r border-border bg-[#1a1a2e]">
            <div className="h-10 flex items-center justify-between px-3 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">FILES</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveToSupabase(files)}><Save className="w-3.5 h-3.5" /></Button>
            </div>
            <FileExplorer files={files} activeFileId={activeTabId} onFileSelect={handleFileSelect} onFileCreate={handleFileCreate} onFileDelete={handleFileDelete} onFileRename={handleFileRename} />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center bg-[#1a1a2e] border-b border-border">
            <div className="flex-1 overflow-x-auto"><EditorTabs tabs={openTabs} activeTabId={activeTabId} onTabSelect={setActiveTabId} onTabClose={handleTabClose} /></div>
            <div className="flex items-center border-l border-border">
              <button className={cn("px-3 py-2 text-xs", rightPanel === 'chat' && "bg-primary/20 text-primary")} onClick={() => setRightPanel('chat')}><Code2 className="w-4 h-4" /></button>
              <button className={cn("px-3 py-2 text-xs", rightPanel === 'preview' && "bg-primary/20 text-primary")} onClick={() => setRightPanel('preview')}><Eye className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {activeFile ? <CodeEditor code={currentContent} language={currentLanguage} onChange={(v) => updateFileContent(activeTabId, v || '')} /> : <div className="h-full flex items-center justify-center">Select a file</div>}
          </div>
        </div>

        <div className="w-[420px] flex flex-col border-l border-border">
          {rightPanel === 'chat' && <UnifiedAIChatPanel onInsertCode={(c) => activeFile && updateFileContent(activeTabId, currentContent + '\n' + c)} onFileOperations={executeOperations} currentFiles={Object.entries(fileMap).map(([p, c]) => ({ path: p, content: c }))} queuedMessage={queuedChatMessage} onQueuedMessageHandled={(id) => setQueuedChatMessage(prev => prev?.id === id ? null : prev)} />}
          {rightPanel === 'preview' && <PreviewPanel html={html} css={css} js={js} files={fileMap} projectName={projectName} />}
        </div>
      </div>
    </div>
  );
};
