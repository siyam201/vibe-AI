import { useState, useCallback, useEffect } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Play, Package, Save, FolderOpen, 
  Code2, Eye, GitBranch, History, Terminal
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

// সিয়াম ভাই, এই লাইনটিই ভার্সেল বিল্ড এরর ঠিক করবে
import { supabase } from '@/integrations/supabase/client'; 

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

const getLanguage = (ext?: string) => {
  const map: Record<string, string> = { js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown' };
  return map[ext || ''] || 'plaintext';
};

export const IDEWorkspace = ({ projectName, onPublish }: IDEWorkspaceProps) => {
  const { currentProject, updateProjectFiles } = useProjectHistory();
  const [files, setFiles] = useState<FileItem[]>(currentProject?.files || getDefaultFiles());
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([{ id: 'index-html', name: 'index.html', language: 'html' }]);
  const [activeTabId, setActiveTabId] = useState('index-html');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rightPanel, setRightPanel] = useState<'chat' | 'preview' | 'git'>('chat');
  const [isSaving, setIsSaving] = useState(false);

  const { executeOperations } = useFileOperations(files, setFiles, setActiveTabId, setOpenTabs);

  // সব ফাইল এবং ফোল্ডারকে একসাথ করে সুপাবেজে পাঠানোর ফাংশন
  const saveToSupabase = useCallback(async (currentFiles: FileItem[]) => {
    if (!projectName) return;
    setIsSaving(true);
    try {
      const fileMap: Record<string, string> = {};
      const extract = (items: FileItem[], path = '') => {
        items.forEach(item => {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          if (item.type === 'file') fileMap[fullPath] = item.content || '';
          if (item.children) extract(item.children, fullPath);
        });
      };
      extract(currentFiles);

      const { error } = await supabase
        .from('app_previews')
        .upsert({ 
          app_name: projectName,
          files: fileMap, // সব ১৭-১৮টি ফাইল এখানে যাবে
          html_content: fileMap['index.html'] || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'app_name' });

      if (error) throw error;
      console.log("Database Sync Done!");
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [projectName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentProject) {
        updateProjectFiles(currentProject.id, files);
        saveToSupabase(files);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [files, currentProject, updateProjectFiles, saveToSupabase]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-[#16162a]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <span className="font-bold">{projectName}</span>
          {isSaving && <span className="text-[10px] text-green-400 animate-pulse ml-2">● DB Saving...</span>}
        </div>
        <Button onClick={onPublish} size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
          <Play className="w-4 h-4" /> Run
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-60 border-r border-white/10 bg-[#1a1a2e]">
            <FileExplorer 
              files={files} 
              onFileSelect={(f) => {
                if (f.type === 'file') {
                  if (!openTabs.find(t => t.id === f.id)) setOpenTabs([...openTabs, { id: f.id, name: f.name, language: getLanguage(f.extension) }]);
                  setActiveTabId(f.id);
                }
              }} 
            />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <EditorTabs tabs={openTabs} activeTabId={activeTabId} onTabSelect={setActiveTabId} onTabClose={(id) => setOpenTabs(openTabs.filter(t => t.id !== id))} />
          <div className="flex-1">
             <CodeEditor 
                code={files.find(f => f.id === activeTabId)?.content || ''} 
                onChange={(v) => {
                  const update = (items: FileItem[]): FileItem[] => items.map(i => i.id === activeTabId ? { ...i, content: v || '' } : (i.children ? { ...i, children: update(i.children) } : i));
                  setFiles(prev => update(prev));
                }} 
                language={getLanguage(files.find(f => f.id === activeTabId)?.extension)} 
             />
          </div>
        </div>
        <div className="w-[400px] border-l border-white/10 bg-[#16162a]">
          <div className="flex border-b border-white/10">
            <button className={cn("flex-1 p-2 text-xs", rightPanel === 'chat' && "bg-white/10")} onClick={() => setRightPanel('chat')}>Chat</button>
            <button className={cn("flex-1 p-2 text-xs", rightPanel === 'preview' && "bg-white/10")} onClick={() => setRightPanel('preview')}>Preview</button>
          </div>
          {rightPanel === 'chat' ? <UnifiedAIChatPanel onFileOperations={executeOperations} /> : <PreviewPanel html={""} css={""} js={""} files={{}} projectName={projectName} />}
        </div>
      </div>
    </div>
  );
};
