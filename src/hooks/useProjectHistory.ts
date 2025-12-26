import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { FileItem } from '@/components/files/FileExplorer';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  files: FileItem[];
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

// Re-export FileItem for backwards compatibility
export type { FileItem };

// Legacy type alias for backwards compatibility
export type ProjectHistoryItem = Project;

// Default files for new projects
export const getDefaultFiles = (): FileItem[] => [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'index-html',
        name: 'index.html',
        type: 'file',
        extension: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="container">
    <h1>Welcome to My App</h1>
    <p>Start building something amazing!</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        id: 'styles-css',
        name: 'styles.css',
        type: 'file',
        extension: 'css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  color: #94a3b8;
}`,
      },
      {
        id: 'app-js',
        name: 'app.js',
        type: 'file',
        extension: 'js',
        content: `// Your JavaScript code here
console.log('App initialized!');`,
      },
    ],
  },
  {
    id: 'readme',
    name: 'README.md',
    type: 'file',
    extension: 'md',
    content: `# My App

A new project created with VibeCode.

## Getting Started

Edit the files in the src folder to build your app.`,
  },
];

export const useProjectHistory = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      setIsLoaded(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        return;
      }

      const projectsList = (data || []).map((p) => ({
        ...p,
        files: (p.files as unknown as FileItem[]) || [],
      })) as Project[];

      setProjects(projectsList);

      // Set current project to most recently updated if none selected
      if (projectsList.length > 0 && !currentProject) {
        setCurrentProject(projectsList[0]);
      } else if (projectsList.length === 0) {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Error in fetchProjects:', err);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create a new project
  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    if (!user?.id) {
      toast.error('Please log in to create projects');
      return null;
    }

    const sanitizedName = name.trim().slice(0, 48) || 'My-App';

    try {
      const insertData = {
        user_id: user.id,
        name: sanitizedName,
        description: description || null,
        files: JSON.parse(JSON.stringify(getDefaultFiles())),
        is_starred: false,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project');
        return null;
      }

      const project = {
        ...data,
        files: data.files as unknown as FileItem[],
      } as Project;

      setProjects((prev) => [project, ...prev]);
      setCurrentProject(project);
      toast.success(`Created "${sanitizedName}"`);
      return project;
    } catch (err) {
      console.error('Error in createProject:', err);
      return null;
    }
  };

  // Update project files (with debounce-friendly design)
  const updateProjectFiles = useCallback(
    async (projectId: string, files: FileItem[]) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase
          .from('projects')
          .update({ files: JSON.parse(JSON.stringify(files)) })
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating project files:', error);
          return;
        }

        // Update local state
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, files, updated_at: new Date().toISOString() } : p
          )
        );

        if (currentProject?.id === projectId) {
          setCurrentProject((prev) =>
            prev ? { ...prev, files, updated_at: new Date().toISOString() } : prev
          );
        }
      } catch (err) {
        console.error('Error in updateProjectFiles:', err);
      }
    },
    [user?.id, currentProject?.id]
  );

  // Rename project
  const renameProject = async (projectId: string, newName: string) => {
    if (!user?.id) return;

    const sanitizedName = newName.trim().slice(0, 48) || 'My-App';

    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: sanitizedName })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming project:', error);
        toast.error('Failed to rename project');
        return;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: sanitizedName } : p))
      );

      if (currentProject?.id === projectId) {
        setCurrentProject((prev) => (prev ? { ...prev, name: sanitizedName } : prev));
      }
    } catch (err) {
      console.error('Error in renameProject:', err);
    }
  };

  // Load a specific project
  const loadProject = (projectId: string): Project | null => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      return project;
    }
    return null;
  };

  // Delete a project
  const deleteProject = async (projectId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
        return;
      }

      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);

      if (currentProject?.id === projectId) {
        setCurrentProject(remaining[0] || null);
      }

      toast.success('Project deleted');
    } catch (err) {
      console.error('Error in deleteProject:', err);
    }
  };

  // Duplicate a project
  const duplicateProject = async (projectId: string): Promise<Project | null> => {
    const source = projects.find((p) => p.id === projectId);
    if (!source || !user?.id) return null;

    const result = await createProject(`${source.name} (Copy)`, source.description || undefined);
    return result;
  };

  // Toggle star status
  const toggleStar = async (projectId: string) => {
    if (!user?.id) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_starred: !project.is_starred })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling star:', error);
        return;
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, is_starred: !p.is_starred } : p))
      );
    } catch (err) {
      console.error('Error in toggleStar:', err);
    }
  };

  return {
    projects,
    currentProject,
    loading,
    isLoaded,
    createProject,
    updateProjectFiles,
    renameProject,
    loadProject,
    deleteProject,
    duplicateProject,
    toggleStar,
    refetch: fetchProjects,
  };
};
