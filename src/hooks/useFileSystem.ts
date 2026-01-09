// src/hooks/useFileSystem.ts
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
  path?: string;
  lastModified?: string;
  size?: number;
}

interface UseFileSystemProps {
  projectName?: string;
}

export const useFileSystem = (props?: UseFileSystemProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with sample files
  const initializeFiles = useCallback(() => {
    try {
      setIsLoading(true);
      
      const sampleFiles: FileItem[] = [
        {
          id: '1',
          name: 'src',
          type: 'folder',
          children: [
            {
              id: '2',
              name: 'index.html',
              type: 'file',
              extension: 'html',
              content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="root"></div>
    <script src="script.js"></script>
</body>
</html>`,
              path: 'src/index.html',
              lastModified: new Date().toISOString()
            },
            {
              id: '3',
              name: 'style.css',
              type: 'file',
              extension: 'css',
              content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

#root {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 600px;
    text-align: center;
}

h1 {
    color: #333;
    margin-bottom: 1rem;
}

p {
    color: #666;
    line-height: 1.6;
}`,
              path: 'src/style.css',
              lastModified: new Date().toISOString()
            },
            {
              id: '4',
              name: 'script.js',
              type: 'file',
              extension: 'js',
              content: `console.log('Hello, world!');

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = \`
            <h1>Welcome to My App</h1>
            <p>This is a sample JavaScript application.</p>
            <button id="clickMe">Click me!</button>
            <div id="output"></div>
        \`;
        
        const button = document.getElementById('clickMe');
        const output = document.getElementById('output');
        
        if (button && output) {
            button.addEventListener('click', () => {
                output.innerHTML = \`<p>Button clicked at: \${new Date().toLocaleTimeString()}</p>\`;
            });
        }
    }
});`,
              path: 'src/script.js',
              lastModified: new Date().toISOString()
            }
          ],
          path: 'src'
        },
        {
          id: '5',
          name: 'README.md',
          type: 'file',
          extension: 'md',
          content: `# My Project

This is a sample project created with the IDE.

## Getting Started

1. Edit the files in the \`src\` folder
2. Save your changes
3. Click "Run Project" to preview

## Project Structure

- \`src/index.html\` - Main HTML file
- \`src/style.css\` - Stylesheet
- \`src/script.js\` - JavaScript file

## Features

- Live preview
- Auto-save
- File management
- AI assistance`,
          path: 'README.md',
          lastModified: new Date().toISOString()
        }
      ];

      setFiles(sampleFiles);
      setError(null);
      return sampleFiles;
    } catch (err) {
      setError('Failed to initialize files');
      toast.error('Failed to load project files');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create file
  const createFile = useCallback(async (path: string, content: string = '') => {
    try {
      const fileName = path.split('/').pop() || 'new-file';
      const extension = fileName.split('.').pop();
      
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: fileName,
        type: 'file',
        extension,
        content,
        path,
        lastModified: new Date().toISOString()
      };

      setFiles(prev => [...prev, newFile]);
      toast.success(`Created ${fileName}`);
      return newFile;
    } catch (err) {
      toast.error('Failed to create file');
      throw err;
    }
  }, []);

  // Create folder
  const createFolder = useCallback(async (name: string) => {
    try {
      const newFolder: FileItem = {
        id: crypto.randomUUID(),
        name,
        type: 'folder',
        children: [],
        lastModified: new Date().toISOString()
      };

      setFiles(prev => [...prev, newFolder]);
      toast.success(`Created folder ${name}`);
      return newFolder;
    } catch (err) {
      toast.error('Failed to create folder');
      throw err;
    }
  }, []);

  // Update file content
  const updateFileContent = useCallback(async (fileId: string, content: string) => {
    try {
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, content, lastModified: new Date().toISOString() }
          : file
      ));
      return true;
    } catch (err) {
      toast.error('Failed to update file');
      throw err;
    }
  }, []);

  // Rename file
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    try {
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              name: newName,
              extension: file.type === 'file' ? newName.split('.').pop() : undefined,
              lastModified: new Date().toISOString()
            }
          : file
      ));
      toast.success('File renamed');
      return true;
    } catch (err) {
      toast.error('Failed to rename file');
      throw err;
    }
  }, []);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setFiles(prev => prev.filter(file => file.id !== fileId));
      toast.success('File deleted');
      return true;
    } catch (err) {
      toast.error('Failed to delete file');
      throw err;
    }
  }, []);

  // Upload file (simulated)
  const uploadFile = useCallback(async (file: File) => {
    try {
      const content = await readFileAsText(file);
      const newFile: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'file',
        extension: file.name.split('.').pop(),
        content,
        lastModified: new Date().toISOString(),
        size: file.size
      };

      setFiles(prev => [...prev, newFile]);
      toast.success(`Uploaded ${file.name}`);
      return newFile;
    } catch (err) {
      toast.error('Failed to upload file');
      throw err;
    }
  }, []);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Initialize on mount
  useEffect(() => {
    initializeFiles();
  }, [initializeFiles]);

  return {
    files,
    setFiles,
    createFile,
    createFolder,
    updateFileContent,
    renameFile,
    deleteFile,
    uploadFile,
    isLoading,
    error
  };
};
