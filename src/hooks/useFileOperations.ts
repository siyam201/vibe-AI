import { useCallback } from 'react';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
}

export interface FileOperation {
  type: 'create' | 'edit' | 'delete';
  path: string;
  content?: string;
}

// Extract JSON from a string starting at a position, handling nested braces
const extractJSON = (text: string, startIndex: number): { json: string; endIndex: number } | null => {
  let depth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escape = true;
      continue;
    }
    
    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return { json: text.slice(start, i + 1), endIndex: i + 1 };
      }
    }
  }
  return null;
};

// Alternative regex-based extraction for simpler JSON
const extractJSONRegex = (text: string, startIndex: number): { json: string; endIndex: number; path: string; content: string } | null => {
  const remaining = text.slice(startIndex);
  
  // Match pattern: {"path":"...", "content":"..."}>>>
  // This handles escaped quotes inside the content
  const pathMatch = remaining.match(/^\s*\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"/);
  if (!pathMatch) return null;
  
  const path = pathMatch[1];
  let contentStart = pathMatch[0].length;
  let contentEnd = -1;
  let escape = false;
  
  // Find the end of the content string
  for (let i = contentStart; i < remaining.length; i++) {
    const char = remaining[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      // Found end of content string
      contentEnd = i;
      break;
    }
  }
  
  if (contentEnd === -1) return null;
  
  const content = remaining.slice(contentStart, contentEnd);
  
  // Find closing brace and >>>
  const afterContent = remaining.slice(contentEnd);
  const closeMatch = afterContent.match(/^"\s*\}/);
  if (!closeMatch) return null;
  
  const jsonEnd = contentEnd + closeMatch[0].length;
  const json = remaining.slice(0, jsonEnd);
  
  // Unescape the content
  const unescapedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
  
  return { 
    json, 
    endIndex: startIndex + jsonEnd, 
    path, 
    content: unescapedContent 
  };
};

// Parse file operations from AI response
export const parseFileOperations = (text: string): { operations: FileOperation[]; cleanText: string } => {
  const operations: FileOperation[] = [];
  let cleanText = text;
  const replacements: { original: string; replacement: string }[] = [];

  console.log('[FileOps] Parsing AI response for file operations...');
  console.log('[FileOps] Input text length:', text.length);

  // Process each operation type
  const operationTypes = [
    { marker: '<<<FILE_CREATE:', type: 'create' as const, emoji: '✅ Created' },
    { marker: '<<<FILE_EDIT:', type: 'edit' as const, emoji: '✏️ Edited' },
    { marker: '<<<FILE_DELETE:', type: 'delete' as const, emoji: '🗑️ Deleted' },
  ];

  for (const opType of operationTypes) {
    let searchStart = 0;
    while (true) {
      const markerIndex = text.indexOf(opType.marker, searchStart);
      if (markerIndex === -1) break;

      console.log(`[FileOps] Found ${opType.type} marker at index ${markerIndex}`);

      // Try the regex-based extraction first (more reliable for escaped content)
      const regexResult = extractJSONRegex(text, markerIndex + opType.marker.length);
      if (regexResult) {
        console.log(`[FileOps] Regex extracted path: ${regexResult.path}`);
        
        // Find the closing >>> - look within reasonable range after JSON end
        let closeIndex = text.indexOf('>>>', regexResult.endIndex);
        // If >>> not found or too far away (>20 chars), accept without it
        const hasCloseMarker = closeIndex !== -1 && closeIndex - regexResult.endIndex < 20;
        
        const matchEnd = hasCloseMarker ? closeIndex + 3 : regexResult.endIndex;
        const fullMatch = text.slice(markerIndex, matchEnd);
        
        operations.push({ 
          type: opType.type, 
          path: regexResult.path, 
          content: regexResult.content 
        });
        replacements.push({ 
          original: fullMatch, 
          replacement: `${opType.emoji}: ${regexResult.path}` 
        });
        
        searchStart = matchEnd;
        continue;
      }

      // Fallback to standard JSON extraction
      const jsonResult = extractJSON(text, markerIndex + opType.marker.length);
      if (!jsonResult) {
        console.warn(`[FileOps] Failed to extract JSON for ${opType.type}`);
        searchStart = markerIndex + 1;
        continue;
      }

      console.log(`[FileOps] Extracted JSON for ${opType.type}`);

      // Find the closing >>> - accept without it if not found nearby
      let closeIndex = text.indexOf('>>>', jsonResult.endIndex);
      const hasCloseMarker = closeIndex !== -1 && closeIndex - jsonResult.endIndex < 20;
      
      const matchEnd = hasCloseMarker ? closeIndex + 3 : jsonResult.endIndex;
      const fullMatch = text.slice(markerIndex, matchEnd);
      
      try {
        const data = JSON.parse(jsonResult.json);
        console.log(`[FileOps] Parsed ${opType.type}:`, data.path);
        operations.push({ 
          type: opType.type, 
          path: data.path, 
          content: data.content 
        });
        replacements.push({ 
          original: fullMatch, 
          replacement: `${opType.emoji}: ${data.path}` 
        });
      } catch (e) {
        console.error(`[FileOps] Failed to parse ${opType.type}:`, e);
      }

      searchStart = matchEnd;
    }
  }

  // Apply all replacements to cleanText
  for (const { original, replacement } of replacements) {
    cleanText = cleanText.replace(original, replacement);
  }

  console.log(`[FileOps] Found ${operations.length} operations`);
  return { operations, cleanText };
};

// Generate unique ID for files
const generateFileId = (path: string): string => {
  return path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

// Get file extension from path
const getExtension = (path: string): string | undefined => {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : undefined;
};

// Get filename from path
const getFileName = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

// Helper to get language from extension
const getLanguageFromExt = (ext?: string): string => {
  switch (ext) {
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

export const useFileOperations = (
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>,
  setOpenTabs: React.Dispatch<React.SetStateAction<{ id: string; name: string; language: string; isDirty?: boolean }[]>>
) => {
  // Create a new file - handles nested paths like "src/components/Button.tsx"
  const createFile = useCallback((path: string, content: string) => {
    const parts = path.split('/').filter(p => p.length > 0);
    const fileName = parts[parts.length - 1];
    const fileId = generateFileId(path);
    const extension = getExtension(fileName);

    const newFile: FileItem = {
      id: fileId,
      name: fileName,
      type: 'file',
      extension,
      content,
    };

    setFiles((prev) => {
      // Deep clone to avoid mutation issues
      const cloned = JSON.parse(JSON.stringify(prev)) as FileItem[];
      
      if (parts.length === 1) {
        // Root level file
        const existingIndex = cloned.findIndex(item => item.name === fileName);
        if (existingIndex !== -1) {
          cloned[existingIndex].content = content;
        } else {
          cloned.push(newFile);
        }
        return cloned;
      }

      // Navigate/create folder structure
      const folderPath = parts.slice(0, -1);
      let current: FileItem[] = cloned;
      
      for (let i = 0; i < folderPath.length; i++) {
        const folderName = folderPath[i];
        let folder = current.find(item => item.name === folderName && item.type === 'folder');
        
        if (!folder) {
          // Create folder if it doesn't exist
          folder = {
            id: generateFileId(folderPath.slice(0, i + 1).join('/')),
            name: folderName,
            type: 'folder',
            children: [],
          };
          current.push(folder);
        }
        
        if (!folder.children) {
          folder.children = [];
        }
        current = folder.children;
      }

      // Add or update file in the target folder
      const existingIndex = current.findIndex(item => item.name === fileName);
      if (existingIndex !== -1) {
        current[existingIndex].content = content;
      } else {
        current.push(newFile);
      }

      return cloned;
    });

    // Open the new file in a tab
    setOpenTabs((prev) => {
      if (!prev.some((tab) => tab.id === fileId)) {
        return [...prev, { id: fileId, name: fileName, language: getLanguageFromExt(extension) }];
      }
      return prev;
    });
    setActiveFileId(fileId);

    return fileId;
  }, [setFiles, setOpenTabs, setActiveFileId]);

  // Edit an existing file
  const editFile = useCallback((path: string, content: string) => {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];

    setFiles((prev) => {
      const updateContent = (items: FileItem[]): FileItem[] => {
        return items.map((item) => {
          if (item.name === fileName && item.type === 'file') {
            return { ...item, content };
          }
          if (item.children) {
            return { ...item, children: updateContent(item.children) };
          }
          return item;
        });
      };
      return updateContent(prev);
    });
  }, [setFiles]);

  // Delete a file
  const deleteFile = useCallback((path: string) => {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    const fileId = generateFileId(path);

    setFiles((prev) => {
      const removeFile = (items: FileItem[]): FileItem[] => {
        return items
          .filter((item) => item.name !== fileName)
          .map((item) => {
            if (item.children) {
              return { ...item, children: removeFile(item.children) };
            }
            return item;
          });
      };
      return removeFile(prev);
    });

    // Close tab if open
    setOpenTabs((prev) => prev.filter((tab) => tab.id !== fileId && tab.name !== fileName));
  }, [setFiles, setOpenTabs]);

  // Execute file operations from AI response
  const executeOperations = useCallback((operations: FileOperation[]) => {
    operations.forEach((op) => {
      switch (op.type) {
        case 'create':
          if (op.content !== undefined) {
            createFile(op.path, op.content);
          }
          break;
        case 'edit':
          if (op.content !== undefined) {
            editFile(op.path, op.content);
          }
          break;
        case 'delete':
          deleteFile(op.path);
          break;
      }
    });
  }, [createFile, editFile, deleteFile]);

  return { createFile, editFile, deleteFile, executeOperations };
};
