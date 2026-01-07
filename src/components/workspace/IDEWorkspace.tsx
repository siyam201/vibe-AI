import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Settings,
  History,
  Terminal,
  Package,
  FolderOpen,
  Loader2,
  Check,
  CloudOff,
  Code2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileExplorer, FileItem } from '@/components/files/FileExplorer';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useProjectHistory } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
  initialPrompt?: string;
  initialMode?: 'chat' | 'plan' | 'test';
}

const getLanguage = (extension?: string) => {
  const map: Record<string, string> = {
    'js': 'javascript', 'ts': 'typescript', 'jsx': 'javascript', 
    'tsx': 'typescript', 'html': 'html', 'css': 'css', 
    'json': 'json', 'md': 'markdown'
  };
  return map[extension || ''] || 'plaintext';
};

export const IDEWorkspace = ({ projectName, onPublish }: IDEWorkspaceProps) => {
  const {
    projects,
    currentProject,
    updateProjectFiles,
    loadProject
  } = useProjectHistory();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSyncing, setIsSyncing] = useState(true);

  // ১. মাউন্ট হওয়ার সাথে সাথে ডাটাবেজ থেকে ফাইলগুলো জোর করে নামিয়ে আনা
  useEffect(() => {
    const initWorkspace = async () => {
      setIsSyncing(true);
      try {
        const decodedName = decodeURIComponent(projectName);
        const target = projects.find(p => p.name === decodedName);
        
        if (target) {
          // সুপাবেস থেকে লেটেস্ট ডাটা রি-ফেচ করা (রিফ্রেশ এরর এড়াতে)
          const { data, error } = await supabase
            .from('projects')
            .select('files')
            .eq('id', target.id)
            .single();

          if (data?.files) {
            setFiles(data.files as any);
            // প্রথম ফাইলটি (যেমন index.html) অটো ওপেন করা
            const firstFile = (data.files as any)[0];
            if (firstFile && openTabs.length === 0) {
              setOpenTabs([{ id: firstFile.id, name: firstFile.name, language: 'html' }]);
              setActiveTabId(firstFile.id);
            }
          }
          await loadProject(target.id);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    if (projects.length > 0) {
      initWorkspace();
    }
  }, [projectName, projects.length]); // শুধু প্রথমবার লোড হবে

  // ২. অটো-সেভ লজিক (৩ সেকেন্ড গ্যাপ - র‍্যাম বাঁচানোর জন্য)
  useEffect(() => {
    if (isSyncing || !currentProject?.id || files.length === 0) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('projects')
        .update({ files: files as any, updated_at: new Date().toISOString() })
        .eq('id', currentProject.id);

      if (!error) {
        updateProjectFiles(currentProject.id, files);
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    };

    const timer = setTimeout(autoSave, 3000); //
    return () => clearTimeout(timer);
  }, [files, currentProject?.id, isSyncing]);

  // ৩. রিফ্রেশ দিলে যাতে "Not Found" না আসে তার জন্য সেফটি চেক
  if (isSyncing) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60 animate-pulse font-bogura">হামাগো বগুড়ার সার্ভার থ্যাকা ফাইলগুলা লিয়াসছি, একনা দাঁড়ান...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0f1a] text-white">
      {/* Header Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#16162a] border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm truncate max-w-[120px]">{currentProject?.name || projectName}</span>
          </div>
          {/* সেভ ইন্ডিকেটর */}
          <div className="ml-4 flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
             {saveStatus === 'saving' ? (
               <><Loader2 className="w-3 h-3 animate-spin text-amber-500" /><span className="text-[9px] text-amber-500 uppercase font-bold">Saving</span></>
             ) : (
               <><Check className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-500 uppercase font-bold">Saved</span></>
             )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowProjectHistory(true)}>
            <FolderOpen className="w-4 h-4 mr-2" /> Projects
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs" onClick={onPublish}>
            <Play className="w-3.5 h-3.5 mr-2" /> Run
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: File Explorer */}
        {showSidebar && (
          <div className="w-64 border-r border-white/10 bg-[#121225] flex flex-col">
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
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorTabs 
            tabs={openTabs} 
            activeTabId={activeTabId} 
            onTabSelect={setActiveTabId} 
            onTabClose={(id) => {
              const filtered = openTabs.filter(t => t.id !== id);
              setOpenTabs(filtered);
              if (activeTabId === id && filtered.length > 0) setActiveTabId(filtered[filtered.length - 1].id);
            }} 
          />
          <div className="flex-1 relative">
            {activeFile ? (
              <CodeEditor 
                code={activeFile.content || ''} 
                language={getLanguage(activeFile.extension)} 
                onChange={(v) => updateFileContent(activeTabId, v || '')} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                <Code2 size={64} strokeWidth={1} />
                <p className="text-sm">হামাগো বগুড়ার এডিটরে ফাইল একটা বাছেন শুরু করবার জন্য!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Chat */}
        <div className="w-[400px] border-l border-white/10 bg-[#121225] hidden lg:flex flex-col">
           <UnifiedAIChatPanel 
             onInsertCode={(code) => activeFile && updateFileContent(activeTabId, activeFile.content + '\n' + code)} 
             onFileOperations={executeOperations} 
             currentFiles={files.map(f => ({ path: f.name, content: f.content || '' }))}
           />
        </div>
      </div>

      {/* Project History Modal */}
      {showProjectHistory && (
        <ProjectHistoryPanel 
          projects={projects} 
          currentProjectId={currentProject?.id} 
          onCreateProject={createProject} 
          onLoadProject={loadProject} 
          onDeleteProject={deleteProject} 
          onDuplicateProject={duplicateProject} 
          onClose={() => setShowProjectHistory(false)} 
        />
      )}
    </div>
  );
};
