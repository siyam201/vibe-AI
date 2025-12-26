import { useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Copy, 
  Clock, 
  MoreVertical,
  FileCode,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectHistoryItem } from '@/hooks/useProjectHistory';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectHistoryPanelProps {
  projects: ProjectHistoryItem[];
  currentProjectId?: string;
  onCreateProject: (name: string, description?: string) => void;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onClose: () => void;
}

export const ProjectHistoryPanel = ({
  projects,
  currentProjectId,
  onCreateProject,
  onLoadProject,
  onDeleteProject,
  onDuplicateProject,
  onClose,
}: ProjectHistoryPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
      setShowNewDialog(false);
      setNewProjectName('');
      setNewProjectDesc('');
      toast.success('Project created');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const countFiles = (project: ProjectHistoryItem): number => {
    let count = 0;
    const countRecursive = (items: typeof project.files) => {
      items.forEach(item => {
        if (item.type === 'file') count++;
        if (item.children) countRecursive(item.children);
      });
    };
    countRecursive(project.files);
    return count;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Project History</h2>
              <p className="text-xs text-muted-foreground">{projects.length} projects saved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => setShowNewDialog(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Projects List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FileCode className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {searchQuery ? 'Try a different search' : 'Create your first project to get started'}
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "group p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/30",
                    currentProjectId === project.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/10"
                  )}
                  onClick={() => onLoadProject(project.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {project.name}
                        </h3>
                        {currentProjectId === project.id && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                            Current
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(project.updated_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileCode className="w-3 h-3" />
                          {countFiles(project)} files
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProject(project.id);
                          toast.success('Project duplicated');
                        }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                            toast.success('Project deleted');
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* New Project Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Project Name</label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description (optional)</label>
                <Input
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="A brief description..."
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
