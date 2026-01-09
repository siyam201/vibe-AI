// useFileOperations.ts - 修正版本
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

// 生成唯一文件ID
const generateFileId = (path: string): string => {
  return path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

// 获取文件扩展名
const getExtension = (path: string): string | undefined => {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : undefined;
};

// 获取文件名
const getFileName = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

// 根据扩展名获取语言
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

// 简化版本，不需要复杂的解析逻辑
export const useFileOperations = () => {
  // 创建新文件
  const createFile = useCallback(async (name: string, content: string): Promise<FileItem> => {
    const fileId = generateFileId(name);
    const extension = getExtension(name);
    
    const newFile: FileItem = {
      id: fileId,
      name: name,
      type: 'file',
      extension,
      content,
      lastModified: new Date().toISOString()
    };
    
    return newFile;
  }, []);

  // 创建文件夹
  const createFolder = useCallback(async (name: string): Promise<FileItem> => {
    const folderId = generateFileId(name);
    
    const newFolder: FileItem = {
      id: folderId,
      name: name,
      type: 'folder',
      children: [],
      lastModified: new Date().toISOString()
    };
    
    return newFolder;
  }, []);

  // 更新文件内容
  const updateFileContent = useCallback(async (fileId: string, content: string): Promise<void> => {
    // 对于本地操作，这个函数只返回成功状态
    console.log(`Updated file ${fileId} content`);
    return;
  }, []);

  // 删除文件
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    console.log(`Deleted file ${fileId}`);
    return;
  }, []);

  // 重命名文件
  const renameFile = useCallback(async (fileId: string, newName: string): Promise<void> => {
    console.log(`Renamed file ${fileId} to ${newName}`);
    return;
  }, []);

  // 上传文件
  const uploadFile = useCallback(async (file: File): Promise<FileItem> => {
    const fileId = generateFileId(file.name);
    const extension = getExtension(file.name);
    
    const uploadedFile: FileItem = {
      id: fileId,
      name: file.name,
      type: 'file',
      extension,
      content: '', // 实际应用中可能需要读取文件内容
      lastModified: new Date().toISOString()
    };
    
    return uploadedFile;
  }, []);

  return {
    createFile,
    createFolder,
    updateFileContent,
    deleteFile,
    renameFile,
    uploadFile,
    isLoading: false
  };
};
