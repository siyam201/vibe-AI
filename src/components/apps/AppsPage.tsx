import { useState } from 'react';
import {
  Grid3X3,
  List,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  Pencil,
  Clock,
  Play,
  Star,
  StarOff,
  FolderOpen,
  FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProjectHistory, ProjectHistoryItem } from '@/hooks/useProjectHistory';
import { toast } from 'sonner';

interface AppsPageProps {
  onOpenApp: (appId: string, appName: string) => void;
  onCreateApp: () => void;
}

export const AppsPage = ({ onOpenApp, onCreateApp }: AppsPageProps) => {
  const { projects, deleteProject, duplicateProject, loadProject } = useProjectHistory();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const filteredProjects = projects.filter((project) => {
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleStar = (projectId: string) => {
    setStarredIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleDelete = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(projectId);
    toast.success('Project deleted');
  };

  const handleDuplicate = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateProject(projectId);
    toast.success('Project duplicated');
  };

  const handleOpen = (project: ProjectHistoryItem) => {
    loadProject(project.id);
    onOpenApp(project.id, project.name);
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
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">My Apps</h1>
            <Badge variant="secondary" className="text-xs">
              {projects.length} projects
            </Badge>
          </div>
          <Button onClick={onCreateApp} className="gap-2">
            <Plus className="w-4 h-4" />
            Create App
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
            <Button onClick={onCreateApp} className="gap-2">
              <Plus className="w-4 h-4" />
              Create App
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => handleOpen(project)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                  
                  {/* Star Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(project.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 hover:bg-background transition-colors"
                  >
                    {starredIds.has(project.id) ? (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpen(project)}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDuplicate(project.id, e)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => handleDelete(project.id, e)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {project.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{countFiles(project)} files</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => handleOpen(project)}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                    {starredIds.has(project.id) && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{project.description || 'No description'}</p>
                </div>

                {/* Files count */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{countFiles(project)} files</span>
                </div>

                {/* Last Edited */}
                <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(project.updated_at)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); toggleStar(project.id); }}
                  >
                    {starredIds.has(project.id) ? (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpen(project)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDuplicate(project.id, e)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => handleDelete(project.id, e)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
