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
  <main class="container">
    <h1>My App</h1>
    <p>Edit files or ask AI to create new ones.</p>
    <button id="btn" type="button">Click me</button>
  </main>
  <script src="main.js"></script>
</body>
</html>`,
      },
      {
        id: 'styles-css',
        name: 'styles.css',
        type: 'file',
        extension: 'css',
        content: `:root{
  color-scheme: dark;
}

*{ box-sizing: border-box; }

body{
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(1200px circle at 20% 10%, #2a1c3d 0%, transparent 55%),
              radial-gradient(1000px circle at 80% 30%, #143a4a 0%, transparent 55%),
              linear-gradient(180deg, #0b0f14 0%, #0a0d12 100%);
  color: #e8eef7;
}

.container{
  width: min(680px, calc(100% - 40px));
  padding: 28px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  background: rgba(255,255,255,.04);
  backdrop-filter: blur(10px);
}

h1{ margin: 0 0 8px; font-size: 32px; letter-spacing: -0.03em; }

p{ margin: 0 0 18px; color: rgba(232,238,247,.75); }

button{
  border: 0;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 650;
  color: #061018;
  background: linear-gradient(135deg, #ffd166 0%, #fca311 40%, #ff7a18 100%);
  cursor: pointer;
}

button:hover{ filter: brightness(1.05); }`,
      },
      {
        id: 'main-js',
        name: 'main.js',
        type: 'file',
        extension: 'js',
        content: `document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn');
  let clicks = 0;

  btn?.addEventListener('click', () => {
    clicks += 1;
    btn.textContent = clicks === 1 ? 'Clicked once!' : 'Clicked ' + clicks + ' times!';
  });
});`,
      },
    ],
  },
  {
    id: 'readme',
    name: 'README.md',
    type: 'file',
    extension: 'md',
    content:
      '# My App\n\nStarter project includes `index.html`, `styles.css`, and `main.js`.\n\nAsk AI: "Create a navbar", "Add a login form", "Create src/components/Button.jsx".',
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
