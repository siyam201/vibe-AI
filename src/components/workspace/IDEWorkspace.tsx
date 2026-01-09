import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  FolderOpen,
  Loader2,
  Check,
  CloudOff,
  Code2,
  Search,
  Zap,
  Moon,
  Sun,
  GitBranch,
  Terminal,
  FileCode,
  FileText,
  Folder,
  File,
  Plus,
  ChevronRight,
  ChevronDown,
  Shield,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Bot,
  Send,
  Copy,
  Settings,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  MessageSquare,
  Lightbulb,
  Wrench,
  Trash2,
  Edit2,
  MoreVertical,
  Upload as UploadIcon,
  CheckCircle,
  XCircle,
  FileWarning,
  Cpu,
  Battery,
  Activity,
  User,
  BookOpen,
  Clock,
  ChevronLeft,
  Target,
  Brain,
  History,
  Package,
  Layers,
  ShieldCheck,
  GitPullRequest,
  GitMerge,
  Rocket,
  Palette,
  Monitor,
  Smartphone,
  Globe,
  Database,
  Server,
  Network,
  MemoryStick,
  HardDrive,
  CircuitBoard,
  TerminalSquare,
  FileJson,
  FileImage,
  FolderPlus,
  FolderSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorTabs, EditorTab } from '@/components/editor/EditorTabs';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { ProjectHistoryPanel } from '@/components/projects/ProjectHistoryPanel';
import { useFileSystem } from '@/hooks/useFileSystem';
import { UnifiedAIChatPanel } from '@/components/ai/UnifiedAIChatPanel';
import { toast } from 'sonner';

// Types
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
  path?: string;
  lastModified?: string;
  issues?: Array<{
    type: 'error' | 'warning' | 'info' | 'security';
    message: string;
    line?: number;
    column?: number;
    fix?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface IDEWorkspaceProps {
  projectName: string;
  onPublish: () => void;
}

// Helper functions
const getLanguage = (extension?: string) => {
  if (!extension) return 'plaintext';
  
  const ext = extension.toLowerCase();
  const map: Record<string, string> = {
    'js': 'javascript', 
    'ts': 'typescript', 
    'jsx': 'javascript', 
    'tsx': 'typescript',
    'html': 'html', 
    'css': 'css', 
    'json': 'json', 
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'php': 'php'
  };
  return map[ext] || 'plaintext';
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js': case 'jsx': return <FileCode className="w-4 h-4 text-yellow-500" />;
    case 'ts': case 'tsx': return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'html': return <FileCode className="w-4 h-4 text-orange-500" />;
    case 'css': return <FileCode className="w-4 h-4 text-pink-500" />;
    case 'json': return <FileJson className="w-4 h-4 text-green-500" />;
    case 'md': return <FileText className="w-4 h-4 text-gray-500" />;
    case 'py': return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'java': return <FileCode className="w-4 h-4 text-red-500" />;
    case 'png': case 'jpg': case 'jpeg': case 'gif': return <FileImage className="w-4 h-4 text-purple-500" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

// File Explorer Component
const FileExplorer = ({ 
  files, 
  activeFileId, 
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onUploadFile
}: {
  files: FileItem[];
  activeFileId: string;
  onFileSelect: (file: FileItem) => void;
  onCreateFile: (name: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onUploadFile: (file: File) => void;
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map(item => {
      const isFolder = item.type === 'folder';
      const isCollapsed = collapsedFolders.has(item.id);
      const isActive = activeFileId === item.id;
      const isRenaming = renamingId === item.id;

      return (
        <div key={item.id} className="select-none group">
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
              isActive 
                ? "bg-blue-600 text-white" 
                : "hover:bg-white/10 text-gray-300"
            )}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
            onClick={(e) => {
              if (isRenaming) {
                e.stopPropagation();
                return;
              }
              if (isFolder) {
                setCollapsedFolders(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.id)) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  return newSet;
                });
              } else {
                onFileSelect(item);
              }
            }}
          >
            {isFolder ? (
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform flex-shrink-0", 
                !isCollapsed && "rotate-90"
              )} />
            ) : (
              <div className="w-4 flex-shrink-0" />
            )}
            
            <div className="flex-shrink-0">
              {isFolder ? (
                <Folder className="w-4 h-4 text-blue-400" />
              ) : (
                getFileIcon(item.name)
              )}
            </div>
            
            {isRenaming ? (
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    onRenameFile(item.id, renameValue);
                    setRenamingId(null);
                    setRenameValue('');
                  } else if (e.key === 'Escape') {
                    setRenamingId(null);
                    setRenameValue('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 text-sm flex-1 min-w-0"
                onBlur={() => {
                  setRenamingId(null);
                  setRenameValue('');
                }}
              />
            ) : (
              <span className="truncate flex-1">{item.name}</span>
            )}
            
            {item.issues && item.issues.length > 0 && (
              <Badge 
                variant={item.issues.some(i => i.type === 'error') ? "destructive" : "secondary"}
                className="ml-auto text-xs"
              >
                {item.issues.length}
              </Badge>
            )}
            
            {!isRenaming && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFolder) {
                    onCreateFolder(`${item.name}/new-folder`);
                  } else {
                    setRenamingId(item.id);
                    setRenameValue(item.name);
                  }
                }}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {isFolder && !isCollapsed && item.children && (
            <div className="ml-4">
              {renderFileTree(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadFile(file);
      event.target.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <FolderSearch className="w-4 h-4" />
            EXPLORER
          </h3>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => onCreateFile('new-file.txt')}
                >
                  <File className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New File</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => onCreateFolder('new-folder')}
                >
                  <FolderPlus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Folder</TooltipContent>
            </Tooltip>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload File</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => onCreateFile('index.html')}
          >
            HTML
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => onCreateFile('style.css')}
          >
            CSS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => onCreateFile('script.js')}
          >
            JS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs h-6"
            onClick={() => onCreateFile('app.tsx')}
          >
            TSX
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-1">No files yet</p>
              <p className="text-xs opacity-75 mb-4">Create or upload files to get started</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateFile('index.html')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First File
              </Button>
            </div>
          ) : (
            renderFileTree(files)
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Auto Scan & Fix System
const AutoScanSystem = ({ 
  files, 
  onScanComplete,
  onAutoFix 
}: { 
  files: FileItem[];
  onScanComplete: (results: any) => void;
  onAutoFix: (fixedFiles: FileItem[]) => void;
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<{
    totalFiles: number;
    scannedFiles: number;
    issuesFound: number;
    securityIssues: number;
    performanceIssues: number;
    suggestions: number;
    detailedIssues: Array<{
      fileId: string;
      fileName: string;
      issues: Array<{
        type: 'error' | 'warning' | 'info' | 'security';
        message: string;
        line?: number;
        fix?: string;
        severity: 'low' | 'medium' | 'high';
      }>;
    }>;
  } | null>(null);

  const scanCodeForIssues = useCallback((content: string, fileName: string) => {
    const issues = [];
    
    // Security checks
    if (fileName.endsWith('.html')) {
      if (content.includes('innerHTML')) {
        issues.push({
          type: 'security',
          message: 'Potential XSS vulnerability: innerHTML usage',
          fix: 'Use textContent or createElement instead',
          severity: 'high'
        });
      }
      
      if (content.includes('eval(')) {
        issues.push({
          type: 'security',
          message: 'Dangerous eval() function detected',
          fix: 'Avoid using eval()',
          severity: 'critical'
        });
      }
    }
    
    // Performance checks
    if (fileName.endsWith('.js')) {
      if (content.includes('console.log')) {
        issues.push({
          type: 'performance',
          message: 'Console.log in production code',
          fix: 'Remove or comment out console.log statements',
          severity: 'low'
        });
      }
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('for(') && line.includes('innerHTML')) {
          issues.push({
            type: 'performance',
            message: 'DOM manipulation inside loop',
            line: index + 1,
            fix: 'Move DOM manipulation outside loop',
            severity: 'medium'
          });
        }
      });
    }
    
    // Code quality checks
    if (content.length > 5000) {
      issues.push({
        type: 'warning',
        message: 'File is too large',
        fix: 'Consider splitting into smaller files',
        severity: 'medium'
      });
    }
    
    if (content.includes('// TODO') || content.includes('// FIXME')) {
      issues.push({
        type: 'info',
        message: 'TODO/FIXME comments found',
        fix: 'Address pending tasks',
        severity: 'low'
      });
    }
    
    return issues;
  }, []);

  const scanFiles = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const allFiles: FileItem[] = [];
    const collectFiles = (items: FileItem[]) => {
      items.forEach(item => {
        if (item.type === 'file') {
          allFiles.push(item);
        }
        if (item.children) {
          collectFiles(item.children);
        }
      });
    };
    collectFiles(files);
    
    const totalFiles = allFiles.length;
    let scannedFiles = 0;
    let issuesFound = 0;
    let securityIssues = 0;
    let performanceIssues = 0;
    let suggestions = 0;
    const detailedIssues: any[] = [];
    
    // Simulate scanning with progress
    for (const file of allFiles) {
      await new Promise(resolve => setTimeout(resolve, 50));
      scannedFiles++;
      setScanProgress((scannedFiles / totalFiles) * 100);
      
      if (file.content) {
        const issues = scanCodeForIssues(file.content, file.name);
        
        if (issues.length > 0) {
          issuesFound += issues.length;
          securityIssues += issues.filter(i => i.type === 'security').length;
          performanceIssues += issues.filter(i => i.type === 'performance').length;
          suggestions += issues.filter(i => i.type === 'info').length;
          
          detailedIssues.push({
            fileId: file.id,
            fileName: file.name,
            issues
          });
        }
      }
    }
    
    const results = {
      totalFiles,
      scannedFiles,
      issuesFound,
      securityIssues,
      performanceIssues,
      suggestions,
      detailedIssues
    };
    
    setScanResults(results);
    onScanComplete(results);
    setIsScanning(false);
    setScanProgress(0);
    
    toast.success(`Scan complete: Found ${issuesFound} issues in ${scannedFiles} files`);
  }, [files, scanCodeForIssues, onScanComplete]);

  const performAutoFix = useCallback(() => {
    if (!scanResults) return;
    
    const fixedFiles = [...files];
    let fixedCount = 0;
    
    scanResults.detailedIssues.forEach(fileIssue => {
      const fileIndex = fixedFiles.findIndex(f => f.id === fileIssue.fileId);
      if (fileIndex !== -1 && fixedFiles[fileIndex].content) {
        let content = fixedFiles[fileIndex].content || '';
        
        // Apply fixes
        fileIssue.issues.forEach(issue => {
          if (issue.fix && issue.type === 'performance') {
            if (issue.message.includes('Console.log')) {
              content = content.replace(/console\.log\(.*?\);?\n?/g, '');
              fixedCount++;
            }
          }
        });
        
        fixedFiles[fileIndex] = {
          ...fixedFiles[fileIndex],
          content
        };
      }
    });
    
    onAutoFix(fixedFiles);
    toast.success(`Auto-fixed ${fixedCount} issues`);
    setScanResults(null);
  }, [scanResults, files, onAutoFix]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-base">Auto Scan & Fix</CardTitle>
          </div>
          <Badge variant={scanResults?.issuesFound ? "destructive" : "secondary"}>
            {scanResults?.issuesFound || 0} Issues
          </Badge>
        </div>
        <CardDescription>
          Advanced code analysis and automatic fixes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isScanning ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Scanning code...</span>
              </div>
              <span className="text-sm font-medium">{Math.round(scanProgress)}%</span>
            </div>
            <Progress value={scanProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="text-red-500">Security</div>
              <div className="text-orange-500">Performance</div>
              <div className="text-blue-500">Quality</div>
            </div>
          </div>
        ) : scanResults ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-500">{scanResults.securityIssues}</div>
                <div className="text-xs mt-1">Security</div>
              </div>
              <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{scanResults.performanceIssues}</div>
                <div className="text-xs mt-1">Performance</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{scanResults.suggestions}</div>
                <div className="text-xs mt-1">Suggestions</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Total files scanned</span>
                <span className="font-medium">{scanResults.scannedFiles}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Total issues found</span>
                <span className="font-medium">{scanResults.issuesFound}</span>
              </div>
            </div>
            
            {scanResults.detailedIssues.length > 0 && (
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {scanResults.detailedIssues.slice(0, 3).map((fileIssue, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{fileIssue.fileName}</div>
                      <div className="text-xs text-gray-500">
                        {fileIssue.issues.length} issues
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1" 
                onClick={scanFiles}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rescan
              </Button>
              <Button 
                size="sm" 
                className="flex-1" 
                onClick={performAutoFix}
                disabled={scanResults.issuesFound === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Auto Fix
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Scan your code for security vulnerabilities, performance issues, and code quality problems.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">Security Scan</span>
                </div>
                <p className="text-xs text-gray-500">XSS, injection, eval()</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Performance</span>
                </div>
                <p className="text-xs text-gray-500">DOM issues, loops</p>
              </div>
            </div>
            
            <Button className="w-full" onClick={scanFiles}>
              <Shield className="w-4 h-4 mr-2" />
              Start Advanced Scan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// AI Assistant Panel
// const AIAssistantPanel = ({ 
//   onInsertCode,
//   onFileOperations,
//   currentFiles 
// }: { 
//   onInsertCode: (code: string) => void;
//   onFileOperations: (operations: any[]) => void;
//   currentFiles: Array<{ path: string; content: string }>;
// }) => {
//   const [queuedMessage, setQueuedMessage] = useState<{ id: string; content: string; mode?: string } | null>(null);
  
//   const quickActions = [
//     {
//       label: 'Create Login System',
//       prompt: 'Create a complete login system with email/password authentication and protected routes',
//       mode: 'plan' as const,
//       icon: <Shield className="w-3 h-3" />
//     },
//     {
//       label: 'Fix Code Issues',
//       prompt: 'Scan my code for issues and suggest fixes',
//       mode: 'test' as const,
//       icon: <Wrench className="w-3 h-3" />
//     },
//     {
//       label: 'Create Dashboard',
//       prompt: 'Create a responsive admin dashboard with charts and tables',
//       mode: 'plan' as const,
//       icon: <Monitor className="w-3 h-3" />
//     },
//     {
//       label: 'Optimize Performance',
//       prompt: 'Analyze my code for performance issues and suggest improvements',
//       mode: 'test' as const,
//       icon: <Zap className="w-3 h-3" />
//     }
//   ];

  return (
    <div className="h-full flex flex-col">
      {/* Quick Actions Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
              <Brain className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-gray-400">Powered by GPT-4</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Activity className="w-3 h-3" />
            Online
          </Badge>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              className="text-xs h-8 bg-white/5 hover:bg-white/10 border-white/10"
              onClick={() => setQueuedMessage({
                id: Date.now().toString(),
                content: action.prompt,
                mode: action.mode
              })}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Unified AI Chat Panel */}
      <div className="flex-1 overflow-hidden">
        <UnifiedAIChatPanel
          onInsertCode={onInsertCode}
          onFileOperations={onFileOperations}
          currentFiles={currentFiles}
          queuedMessage={queuedMessage}
          onQueuedMessageHandled={() => setQueuedMessage(null)}
          projectId="current-project"
          initialMode="chat"
        />
      </div>
    </div>
  );
};

// Main IDE Workspace Component
export const IDEWorkspace = ({ projectName, onPublish }: IDEWorkspaceProps) => {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([
    { 
      id: 'welcome', 
      name: 'Welcome', 
      language: 'markdown',
      icon: <BookOpen className="w-4 h-4" />
    }
  ]);
  
  const [activeTabId, setActiveTabId] = useState<string>('welcome');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'explorer' | 'scan'>('explorer');
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  const fileSystem = useFileSystem({ projectName });

  // Auto-save simulation
  useEffect(() => {
    if (activeTabId && saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('saving');
        setTimeout(() => setSaveStatus('saved'), 1000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeTabId, saveStatus]);

  const activeFile = useMemo(() => {
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === activeTabId) return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFile(fileSystem.files);
  }, [fileSystem.files, activeTabId]);

  const updateFileContent = useCallback(async (fileId: string, content: string) => {
    await fileSystem.updateFileContent(fileId, content);
  }, [fileSystem.updateFileContent]);

  const handleCreateFile = useCallback(async (name: string) => {
    const newFile = await fileSystem.createFile(name, '');
    if (newFile) {
      const tab: EditorTab = {
        id: newFile.id,
        name: newFile.name,
        language: getLanguage(newFile.extension),
        icon: getFileIcon(newFile.name)
      };
      setOpenTabs(prev => [...prev, tab]);
      setActiveTabId(newFile.id);
    }
  }, [fileSystem.createFile]);

  const handleCreateFolder = useCallback(async (name: string) => {
    await fileSystem.createFolder(name);
  }, [fileSystem.createFolder]);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    await fileSystem.deleteFile(fileId);
    setOpenTabs(prev => prev.filter(t => t.id !== fileId));
    if (activeTabId === fileId && openTabs.length > 1) {
      setActiveTabId(openTabs[0].id);
    }
  }, [fileSystem.deleteFile, activeTabId, openTabs]);

  const handleRenameFile = useCallback(async (fileId: string, newName: string) => {
    await fileSystem.renameFile(fileId, newName);
    setOpenTabs(prev => prev.map(t => 
      t.id === fileId ? { ...t, name: newName } : t
    ));
  }, [fileSystem.renameFile]);

  const handleUploadFile = useCallback(async (file: File) => {
    const newFile = await fileSystem.uploadFile(file);
    if (newFile) {
      const tab: EditorTab = {
        id: newFile.id,
        name: newFile.name,
        language: getLanguage(newFile.extension),
        icon: getFileIcon(newFile.name)
      };
      setOpenTabs(prev => [...prev, tab]);
      setActiveTabId(newFile.id);
    }
  }, [fileSystem.uploadFile]);

  const handleScanComplete = useCallback((results: any) => {
    console.log('Scan complete:', results);
  }, []);

  const handleAutoFix = useCallback((fixedFiles: FileItem[]) => {
    fileSystem.setFiles(fixedFiles);
  }, [fileSystem.setFiles]);

  const handleInsertCode = useCallback((code: string) => {
    if (activeFile) {
      updateFileContent(activeFile.id, (activeFile.content || '') + '\n' + code);
    }
  }, [activeFile, updateFileContent]);

  const handleFileOperations = useCallback((operations: any[]) => {
    operations.forEach(async (op) => {
      try {
        switch (op.type) {
          case 'create':
            await handleCreateFile(op.path.split('/').pop() || 'new-file.txt');
            break;
          case 'edit':
            // Find and update file content
            const file = fileSystem.files.find(f => f.path === op.path);
            if (file) {
              await updateFileContent(file.id, op.content || '');
            }
            break;
          case 'delete':
            const fileToDelete = fileSystem.files.find(f => f.path === op.path);
            if (fileToDelete) {
              await handleDeleteFile(fileToDelete.id);
            }
            break;
        }
      } catch (error) {
        console.error('File operation failed:', error);
        toast.error(`Failed to ${op.type} ${op.path}`);
      }
    });
  }, [handleCreateFile, fileSystem.files, updateFileContent, handleDeleteFile]);

  const currentFiles = useMemo(() => {
    const extractFiles = (items: FileItem[]): Array<{ path: string; content: string }> => {
      let files: Array<{ path: string; content: string }> = [];
      
      items.forEach(item => {
        if (item.type === 'file' && item.content !== undefined) {
          files.push({
            path: item.path || item.name,
            content: item.content
          });
        }
        
        if (item.children) {
          files = [...files, ...extractFiles(item.children)];
        }
      });
      
      return files;
    };
    
    return extractFiles(fileSystem.files);
  }, [fileSystem.files]);

  if (fileSystem.isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f0f1a]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-white/60">Loading workspace...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex-1 flex flex-col h-full transition-colors duration-300",
        darkMode ? "bg-[#0f0f1a] text-white" : "bg-gray-50 text-gray-900"
      )}>
        {/* Header */}
        <div className={cn(
          "h-12 flex items-center justify-between px-4 border-b",
          darkMode ? "bg-[#16162a] border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate max-w-[150px]">{projectName}</span>
              <Badge variant="outline" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" /> main
              </Badge>
            </div>

            <div className="ml-2 px-2 py-0.5 rounded flex items-center gap-1 border">
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-3 h-3 animate-spin text-amber-500" /><span className="text-[9px] text-amber-500">SAVING</span></>
              ) : saveStatus === 'error' ? (
                <><CloudOff className="w-3 h-3 text-red-500" /><span className="text-[9px] text-red-500">ERROR</span></>
              ) : (
                <><Check className="w-3 h-3 text-emerald-500" /><span className="text-[9px] text-emerald-500">SAVED</span></>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setShowProjectHistory(true)}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
              onClick={onPublish}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          {showSidebar && (
            <div className={cn(
              "w-64 border-r flex flex-col",
              darkMode ? "bg-[#121225] border-white/10" : "bg-white border-gray-200"
            )}>
              <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="px-2 pt-2">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="explorer" className="text-xs">
                    <FileCode className="w-4 h-4" />
                    Explorer
                  </TabsTrigger>
                  <TabsTrigger value="scan" className="text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    Scan
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex-1 overflow-hidden">
                {activeView === 'explorer' ? (
                  <FileExplorer 
                    files={fileSystem.files} 
                    activeFileId={activeTabId} 
                    onFileSelect={(file) => {
                      if (!openTabs.find(t => t.id === file.id)) {
                        const tab: EditorTab = {
                          id: file.id,
                          name: file.name,
                          language: getLanguage(file.extension),
                          icon: getFileIcon(file.name)
                        };
                        setOpenTabs(prev => [...prev, tab]);
                      }
                      setActiveTabId(file.id);
                    }}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    onUploadFile={handleUploadFile}
                  />
                ) : (
                  <div className="p-3">
                    <AutoScanSystem 
                      files={fileSystem.files} 
                      onScanComplete={handleScanComplete}
                      onAutoFix={handleAutoFix}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className={cn(
              "border-b",
              darkMode ? "border-white/10" : "border-gray-200"
            )}>
              <EditorTabs 
                tabs={openTabs} 
                activeTabId={activeTabId} 
                onTabSelect={setActiveTabId} 
                onTabClose={(id) => {
                  if (id === 'welcome') return; // Don't close welcome tab
                  const filtered = openTabs.filter(t => t.id !== id);
                  setOpenTabs(filtered);
                  if (activeTabId === id && filtered.length > 0) {
                    setActiveTabId(filtered[filtered.length-1].id);
                  }
                }} 
              />
            </div>

            <div className="flex-1 relative">
              {activeFile ? (
                <div className="grid grid-cols-2 h-full">
                  <div className="border-r">
                    <CodeEditor 
                      code={activeFile.content || ''} 
                      language={getLanguage(activeFile.extension)} 
                      theme={darkMode ? 'vs-dark' : 'light'}
                      fontSize={14}
                      onChange={(content) => updateFileContent(activeFile.id, content || '')} 
                    />
                  </div>
                  <div className="p-4 overflow-auto">
                    <PreviewPanel />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <CircuitBoard size={64} className="opacity-50" />
                  <p className="text-lg">Welcome to Bogura IDE</p>
                  <p className="text-sm text-center max-w-md opacity-75">
                    A modern, AI-powered development environment with advanced features
                  </p>
                  <div className="flex gap-4 mt-4">
                    <Button variant="outline" onClick={() => handleCreateFile('index.html')}>
                      <FileCode className="w-4 h-4 mr-2" />
                      New HTML File
                    </Button>
                    <Button variant="outline" onClick={() => handleCreateFile('app.tsx')}>
                      <Code2 className="w-4 h-4 mr-2" />
                      New React App
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {showTerminal && (
              <div className={cn(
                "h-64 border-t",
                darkMode ? "bg-black/90 border-white/10" : "bg-gray-100 border-gray-200"
              )}>
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Terminal</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowTerminal(false)}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-2 font-mono text-sm overflow-auto h-[calc(100%-40px)]">
                  <div className="mb-2 text-green-400">$ Welcome to Bogura IDE Terminal</div>
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                  ))}
                  <div className="flex items-center mt-2">
                    <span className="text-green-400 mr-2">$</span>
                    <input
                      className="flex-1 bg-transparent border-none outline-none"
                      placeholder="Type command..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setTerminalOutput(prev => [...prev, `$ ${e.currentTarget.value}`]);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI Assistant */}
          {showRightPanel && (
            <div className={cn(
              "w-[400px] border-l flex flex-col",
              darkMode ? "bg-[#121225] border-white/10" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">AI Assistant</span>
                  <Badge variant="secondary" className="ml-1">Beta</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowRightPanel(false)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <AIAssistantPanel 
                  onInsertCode={handleInsertCode}
                  onFileOperations={handleFileOperations}
                  currentFiles={currentFiles}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className={cn(
          "h-8 border-t flex items-center justify-between px-3 text-xs",
          darkMode ? "bg-[#16162a] border-white/10" : "bg-gray-100 border-gray-200 text-gray-700"
        )}>
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded"
              onClick={() => setShowTerminal(!showTerminal)}
            >
              <TerminalSquare className="w-3 h-3" />
              Terminal
            </button>
            <span>Branch: main</span>
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI Ready
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ln {activeFile?.content?.split('\n').length || 1}, Col 1</span>
            <span>UTF-8</span>
            <button 
              className="flex items-center gap-1"
              onClick={() => toast.info('Help documentation coming soon!')}
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Project History Modal */}
        {showProjectHistory && (
          <ProjectHistoryPanel 
            projects={[]} 
            currentProjectId="" 
            onCreateProject={() => {}} 
            onLoadProject={() => {}} 
            onDeleteProject={() => {}} 
            onDuplicateProject={() => {}} 
            onClose={() => setShowProjectHistory(false)} 
            theme={darkMode ? 'dark' : 'light'}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
