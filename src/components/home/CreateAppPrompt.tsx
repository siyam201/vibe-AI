import { useState, useEffect } from 'react';
import { Globe, Pencil, Paperclip, ArrowRight, Zap, Clock, ChevronDown, Sparkles, FileText, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CreateAppPromptProps {
  userName?: string;
  onStart: (idea: string, type: 'app' | 'design', projectInfo?: ProjectInfo) => void;
}

interface ProjectInfo {
  name: string;
  type: 'web' | 'mobile' | 'api' | 'desktop';
  mode: 'fast' | 'detailed';
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
}

const projectTypes = [
  { id: 'web', label: 'Web app', icon: Globe },
  { id: 'mobile', label: 'Mobile app', icon: Globe },
  { id: 'api', label: 'API / Backend', icon: FileText },
  { id: 'desktop', label: 'Desktop app', icon: Globe },
];

const buildModes = [
  { id: 'build', label: 'Build', description: 'Standard build mode' },
  { id: 'fast', label: 'Fast Build', description: 'Quick prototype with key features' },
  { id: 'detailed', label: 'Detailed Build', description: 'Comprehensive with all features' },
];

export const CreateAppPrompt = ({ userName = 'User', onStart }: CreateAppPromptProps) => {
  const [activeTab, setActiveTab] = useState<'app' | 'design'>('app');
  const [idea, setIdea] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<'web' | 'mobile' | 'api' | 'desktop'>('web');
  const [buildMode, setBuildMode] = useState<'fast' | 'detailed'>('fast');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-generate project name from idea
  useEffect(() => {
    if (idea.trim()) {
      const words = idea.trim().split(' ').filter(Boolean).slice(0, 3);
      const name = words
        .map(w => (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join('-');
      setProjectName(name.replace(/[^a-zA-Z0-9-]/g, ''));
    } else {
      setProjectName('');
    }
  }, [idea]);

  const handleStart = () => {
    if (idea.trim()) {
      onStart(idea, activeTab, {
        name: projectName || 'My-App',
        type: projectType,
        mode: buildMode,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: AttachedFile[] = Array.from(files).map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
      }));
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const newFiles: AttachedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const selectedProjectType = projectTypes.find(t => t.id === projectType);

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-primary/20 border-2 border-dashed border-primary z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-xl shadow-xl text-center">
            <Paperclip className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-foreground font-medium">Drop files to attach</p>
            <p className="text-muted-foreground text-sm">Images, designs, or documents</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl animate-fade-in">
        {/* Greeting */}
        <h1 className="text-3xl font-semibold text-foreground text-center mb-8">
          Hi {userName}, what do you want to make?
        </h1>

        {/* App Type Tabs */}
        <div className="bg-card border border-border rounded-xl p-1 mb-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('app')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                activeTab === 'app' 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Globe className="w-4 h-4" />
              App
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                activeTab === 'design' 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Pencil className="w-4 h-4" />
              Design
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your idea, '/' for integrations..."
            className="w-full bg-transparent border-none px-4 pt-4 pb-20 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-sm min-h-[160px]"
            rows={4}
          />

          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {attachedFiles.map(file => (
                <div 
                  key={file.id}
                  className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-lg text-xs"
                >
                  {file.type === 'image' ? (
                    <Image className="w-3 h-3 text-primary" />
                  ) : (
                    <FileText className="w-3 h-3 text-primary" />
                  )}
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(file.id)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              {/* Build Mode Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    Build
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {buildModes.map(mode => (
                    <DropdownMenuItem 
                      key={mode.id}
                      onClick={() => setBuildMode(mode.id as 'fast' | 'detailed')}
                      className="flex flex-col items-start"
                    >
                      <span className="font-medium">{mode.label}</span>
                      <span className="text-xs text-muted-foreground">{mode.description}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Attach Files */}
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                />
                <div className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Paperclip className="w-4 h-4" />
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick AI */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                title="AI Quick Start"
              >
                <Zap className="w-4 h-4" />
              </Button>

              {/* Start Button */}
              <Button 
                onClick={handleStart}
                disabled={!idea.trim()}
                variant="ghost"
                className="h-8 gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Start
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Project Info Bar */}
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-4">
            {/* Project Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                  {selectedProjectType && <selectedProjectType.icon className="w-4 h-4" />}
                  {selectedProjectType?.label || 'Web app'}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {projectTypes.map(type => (
                  <DropdownMenuItem 
                    key={type.id}
                    onClick={() => setProjectType(type.id as any)}
                  >
                    <type.icon className="w-4 h-4 mr-2" />
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mode Description */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {buildMode === 'fast' 
                ? 'Fast mode - create a quick version of your app with key features.'
                : 'Detailed mode - comprehensive build with all features.'
              }
            </div>
          </div>
        </div>

        {/* Auto-generated Project Name */}
        {projectName && (
          <div className="mt-4 p-3 bg-secondary/50 border border-border rounded-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Project name:</span>
                <span className="text-sm font-medium text-foreground">{projectName}</span>
              </div>
              <input 
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                className="text-sm bg-transparent border border-border rounded px-2 py-1 w-40 text-right focus:outline-none focus:border-primary"
                placeholder="Edit name"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
