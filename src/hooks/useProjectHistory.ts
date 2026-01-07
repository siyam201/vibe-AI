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

// Default files for new projects (Node.js style like Replit)
export const getDefaultFiles = (): FileItem[] => [
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
    <title>VibeCode Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  },
  {
    id: 'package-json',
    name: 'package.json',
    type: 'file',
    extension: 'json',
    content: `{
  "name": "vibecode-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.5.0",
    "lucide-react": "^0.320.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1"
  }
}`,
  },
  {
    id: 'vite-config',
    name: 'vite.config.ts',
    type: 'file',
    extension: 'ts',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
  },
  {
    id: 'src-folder',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'main-tsx',
        name: 'main.tsx',
        type: 'file',
        extension: 'tsx',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`,
      },
      {
        id: 'app-tsx',
        name: 'App.tsx',
        type: 'file',
        extension: 'tsx',
        content: `import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="app-container">
      <h1>VibeCode + Vite + Supabase</h1>
      <p>আপনার প্রজেক্ট সফলভাবে সেটআপ হয়েছে।</p>
    </div>
  );
}

export default App;`,
      },
      {
        id: 'lib-folder',
        name: 'lib',
        type: 'folder',
        children: [
          {
            id: 'supabase-ts',
            name: 'supabase.ts',
            type: 'file',
            extension: 'ts',
            content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`,
          }
        ]
      },
      {
        id: 'styles-folder',
        name: 'styles',
        type: 'folder',
        children: [
          {
            id: 'index-css',
            name: 'index.css',
            type: 'file',
            extension: 'css',
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root { font-family: Inter, system-ui, sans-serif; }`,
          }
        ]
      },
      {
        id: 'vite-env-d-ts',
        name: 'vite-env.d.ts',
        type: 'file',
        extension: 'ts',
        content: `/// <reference types="vite/client" />`,
      }
    ],
  },
  {
    id: 'tsconfig-json',
    name: 'tsconfig.json',
    type: 'file',
    extension: 'json',
    content: `{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`,
  }
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
