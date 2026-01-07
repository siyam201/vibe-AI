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

// সিয়াম ভাই, আপনার স্ক্রিনশট ২৫১ অনুযায়ী এই পাথটি একদম সঠিক:
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

  // সিয়াম ভাই, এই ফাংশনটি আপনার ১৭-১৮টি ফাইল ফোল্ডারসহ JSON আকারে ডাটাবেসে পাঠাবে
  const saveToSupabase = useCallback(async (currentFiles: FileItem[]) => {
    if (!projectName) return;
    setIsSaving(true);
    try {
      const fileMap: Record<string, string> = {};
      
      // রিকার্সিভলি ফোল্ডার স্ট্রাকচার বের করা (স্ক্রিনশট ২৫২ এর ফোল্ডারগুলোর জন্য)
      const extract = (items: FileItem[], path = '') => {
        items.forEach(item => {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          if (item.type === 'file') {
            fileMap[fullPath] = item.content || '';
          } else if (item.children) {
            extract(item.children, fullPath);
          }
        });
      };
      extract(currentFiles);

      // সুপাবেজে UPSERT - স্ক্রিনশট ২৪৯ এর কলাম 'files' এ ডাটা যাবে
      const { error } = await supabase
        .from('app_previews')
        .upsert({ 
          app_name: projectName,
          files: fileMap, 
          html_content: fileMap['index.html'] || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'app_name' });

      if (error) throw error;
      console.log("সব ফাইল সাকসেসফুলি সেভ হয়েছে!");
    } catch (err) {
      console.error("সুপাবেজ সেভ এরর:", err);
    } finally {
      setIsSaving(false);
    }
  }, [projectName]);

  // ৪জিবি র‍্যামের জন্য ৩ সেকেন্ড ডিলে (Auto-save)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentProject) {
        updateProjectFiles(currentProject.id, files);
        saveToSupabase(files);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [files, currentProject, updateProjectFiles, saveToSupabase]);

  // এডিটর আপডেট লজিক
  const updateFileContent = (fileId: string, content: string) => {
    const updateRecursive = (items: FileItem[]): FileItem[] => items.map(i => 
      i.id === fileId ? { ...i, content } : (i.children ? { ...i, children: updateRecursive(i.children) } : i)
    );
    setFiles(prev => updateRecursive(prev));
  };

  const preview = {
    html: files.find(f => f.name === 'index.html')?.content || '',
    css: '', // আপনি চাইলে একইভাবে css ফাইল খুঁজে এখানে দিতে পারেন
    js: '',
    fileMap: {}
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-[#16162a]">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <span className="font-bold text-sm">{projectName}</span>
          {isSaving && <span className="text-[10px] text-green-400 animate-pulse ml-2">● DB Saving...</span>}
        </div>
        <Button onClick={onPublish} size="sm" className="bg-green-600 hover:bg-green-700 h-8">
          <Play className="w-3.5 h-3.5 mr-1" /> Run
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
                onChange={(v) => updateFileContent(activeTabId, v || '')} 
                language={getLanguage(files.find(f => f.id === activeTabId)?.extension)} 
             />
          </div>
        </div>

        <div className="w-[400px] border-l border-white/10 bg-[#16162a]">
          <div className="flex border-b border-white/10">
            <button className={cn("flex-1 p-2 text-xs", rightPanel === 'chat' && "bg-white/10")} onClick={() => setRightPanel('chat')}>AI Chat</button>
            <button className={cn("flex-1 p-2 text-xs", rightPanel === 'preview' && "bg-white/10")} onClick={() => setRightPanel('preview')}>Preview</button>
          </div>
          {rightPanel === 'chat' ? (
            <UnifiedAIChatPanel onFileOperations={executeOperations} />
          ) : (
            <PreviewPanel {...preview} files={{}} projectName={projectName} />
          )}
        </div>
      </div>
    </div>
  );
};
