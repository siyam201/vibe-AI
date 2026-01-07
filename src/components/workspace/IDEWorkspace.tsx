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

// আপনার GitHub-এর পাথ অনুযায়ী সঠিক ইমপোর্ট
import { supabase } from '@/integrations/supabase/client'; 

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
    currentProject,
    updateProjectFiles,
  } = useProjectHistory();

  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'index-html', name: 'index.html', language: 'html' }]);
  const [activeTabId, setActiveTabId] = useState('index-html');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview' | 'git'>('chat');
  const [isSaving, setIsSaving] = useState(false);

  const [queuedChatMessage, setQueuedChatMessage] = useState<{ id: string; content: string; mode?: string } | null>(
    initialPrompt ? { id: Date.now().toString(), content: initialPrompt, mode: initialMode || 'plan' } : null
  );

  const [showHistory, setShowHistory] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // --- সিয়াম ভাই, এই ফাংশনটি ফোল্ডারসহ সব ফাইল বাল্ক আপডেট করবে ---
  const saveToSupabase = useCallback(async (currentFiles: FileItem[]) => {
    if (!projectName) return;
    
    setIsSaving(true);
    try {
      const fileMap: Record<string, string> = {};
      
      // রিকার্সিভলি ফোল্ডার পাথসহ ফাইলগুলো বের করা
      const extract = (items: FileItem[], path = '') => {
        items.forEach(item => {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          if (item.type === 'file' && item.content !== undefined) {
            fileMap[fullPath] = item.content;
          }
          if (item.children) extract(item.children, fullPath);
        });
      };
      extract(currentFiles);

      // সুপাবেজে UPSERT (যাতে নতুন প্রজেক্ট হলেও সেভ হয়)
      const { error } = await supabase
        .from('app_previews')
        .upsert({ 
          app_name: projectName,
          files: fileMap, // আপনার jsonb কলামে ডাটা যাবে
          html_content: fileMap['index.html'] || fileMap['src/index.html'] || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'app_name' });

      if (error) throw error;
      console.log("Database Sync Successful");
    } catch (err: any) {
      console.error("Database Sync Error:", err.message);
      toast.error("ডাটাবেসে ফাইল সেভ হয়নি!");
    } finally {
      setIsSaving(false);
    }
  }, [projectName]);

  // অটো-সেভ লজিক (৩ সেকেন্ড ডিলে যাতে ল্যাগ না করে)
  useEffect(() => {
    if (currentProject && files !== currentProject.files) {
      const debounce = setTimeout(() => {
        updateProjectFiles(currentProject.id, files);
        saveToSupabase(files);
      }, 3000); 
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
  }, []);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      if (!openTabs.find(t => t.id === file.id)) {
        setOpenTabs([...openTabs, { id: file.id, name: file.name, language: getLanguage(file.extension) }]);
      }
      setActiveTabId(file.id);
    }
  };

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

  const preview = getPreviewCode();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a]">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <span className="font-medium text-white">{projectName}</span>
          {isSaving && <span className="text-[10px] text-green-400 animate-pulse ml-2">● DB Syncing...</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-white" onClick={() => setShowProjectHistory(true)}><FolderOpen className="w-4 h-4 mr-1" /> Projects</Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={onPublish}><Play className="w-4 h-4 mr-1" /> Run</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-60 border-r border-white/10 bg-[#16162a]">
            <div className="p-2 border-b border-white/10 flex justify-between items-center">
              <span className="text-xs text-white/50">FILES</span>
              <Save className="w-3 h-3 text-white/50 cursor-pointer" onClick={() => saveToSupabase(files)} />
            </div>
            <FileExplorer files={files} activeFileId={activeTabId} onFileSelect={handleFileSelect} />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <EditorTabs tabs={openTabs} activeTabId={activeTabId} onTabSelect={setActiveTabId} onTabClose={(id) => setOpenTabs(openTabs.filter(t => t.id !== id))} />
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <CodeEditor code={currentContent} language={currentLanguage} onChange={(v) => updateFileContent(activeTabId, v || '')} />
            ) : (
              <div className="h-full flex items-center justify-center text-white/30">Select a file to edit</div>
            )}
          </div>
        </div>

        <div className="w-[400px] border-l border-white/10 bg-[#16162a]">
          <div className="flex border-b border-white/10">
            <button className={cn("flex-1 p-2 text-xs", rightPanel === 'chat' ? "bg-white/10 text-white" : "text-white/50")} onClick={() => setRightPanel('chat')}>AI Chat</button>
            <button className={cn("flex-1 p-2 text-xs", rightPanel === 'preview' ? "bg-white/10 text-white" : "text-white/50")} onClick={() => setRightPanel('preview')}>Preview</button>
          </div>
          {rightPanel === 'chat' ? (
             <UnifiedAIChatPanel onFileOperations={executeOperations} currentFiles={Object.entries(preview.fileMap).map(([p, c]) => ({ path: p, content: c }))} />
          ) : (
            <PreviewPanel {...preview} files={preview.fileMap} projectName={projectName} />
          )}
        </div>
      </div>
    </div>
  );
};
