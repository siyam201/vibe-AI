import { 
  Play, 
  Save, 
  Share2, 
  Download,
  Github,
  User,
  ChevronDown,
  FilePlus,
  FolderPlus,
  FileDown,
  Trash2,
  Undo,
  Redo,
  Scissors,
  Copy,
  Clipboard,
  Search,
  Replace,
  PanelLeftClose,
  PanelRightClose,
  Terminal,
  Maximize2,
  Sun,
  Moon,
  HelpCircle,
  Info,
  Keyboard,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface TopBarProps {
  onRun: () => void;
  onSave: () => void;
  isRunning: boolean;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onToggleSidebar?: () => void;
  onToggleConsole?: () => void;
  onTogglePreview?: () => void;
  onExport?: () => void;
}

export const TopBar = ({ 
  onRun, 
  onSave, 
  isRunning,
  onNewFile,
  onNewFolder,
  onToggleSidebar,
  onToggleConsole,
  onTogglePreview,
  onExport
}: TopBarProps) => {
  
  const handleUndo = () => toast.info('Undo: Ctrl+Z');
  const handleRedo = () => toast.info('Redo: Ctrl+Y');
  const handleCut = () => {
    document.execCommand('cut');
    toast.success('Cut to clipboard');
  };
  const handleCopy = () => {
    document.execCommand('copy');
    toast.success('Copied to clipboard');
  };
  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      toast.success('Pasted from clipboard');
    }).catch(() => toast.error('Cannot access clipboard'));
  };
  const handleFind = () => toast.info('Find: Ctrl+F');
  const handleReplace = () => toast.info('Replace: Ctrl+H');
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };
  const handleShare = () => toast.info('Share feature coming soon!');
  const handleExportProject = () => {
    onExport?.();
    toast.success('Project exported!');
  };

  return (
    <header className="h-12 bg-editor-gutter border-b border-border flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-sm font-bold text-primary-foreground">V</span>
          </div>
          <span className="text-lg font-bold text-gradient">Vibe Code</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {/* File Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">File</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={onNewFile}>
                <FilePlus className="w-4 h-4 mr-2" />
                New File
                <DropdownMenuShortcut>Ctrl+N</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewFolder}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
                <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportProject}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Project
                <DropdownMenuShortcut>Ctrl+E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">Edit</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleUndo}>
                <Undo className="w-4 h-4 mr-2" />
                Undo
                <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRedo}>
                <Redo className="w-4 h-4 mr-2" />
                Redo
                <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCut}>
                <Scissors className="w-4 h-4 mr-2" />
                Cut
                <DropdownMenuShortcut>Ctrl+X</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
                <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePaste}>
                <Clipboard className="w-4 h-4 mr-2" />
                Paste
                <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFind}>
                <Search className="w-4 h-4 mr-2" />
                Find
                <DropdownMenuShortcut>Ctrl+F</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReplace}>
                <Replace className="w-4 h-4 mr-2" />
                Replace
                <DropdownMenuShortcut>Ctrl+H</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">View</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={onToggleSidebar}>
                <PanelLeftClose className="w-4 h-4 mr-2" />
                Toggle Sidebar
                <DropdownMenuShortcut>Ctrl+B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleConsole}>
                <Terminal className="w-4 h-4 mr-2" />
                Toggle Console
                <DropdownMenuShortcut>Ctrl+`</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePreview}>
                <PanelRightClose className="w-4 h-4 mr-2" />
                Toggle Preview
                <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFullscreen}>
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
                <DropdownMenuShortcut>F11</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">Help</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem>
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Documentation
                <ExternalLink className="w-3 h-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Info className="w-4 h-4 mr-2" />
                About Vibe Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Center Section - Run Button */}
      <div className="flex items-center gap-2">
        <Button variant="run" size="sm" onClick={onRun} disabled={isRunning}>
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button variant="editor" size="sm" onClick={onSave}>
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button variant="editor" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button variant="editor" size="sm" onClick={handleExportProject}>
          <Download className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button variant="ghost" size="icon-sm">
          <Github className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" className="gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-3 h-3 text-primary" />
          </div>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>
    </header>
  );
};
