import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FileItem {
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

// 生成文件 ID
const generateFileId = (name: string): string => {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 生成文件夹 ID
const generateFolderId = (name: string): string => {
  return `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useFileOperations = (projectId?: string) => {
  const [isLoading, setIsLoading] = useState(false);

  // 上传文件到 Supabase Storage
  const uploadFileToStorage = useCallback(async (file: File, path: string = ''): Promise<string | null> => {
    if (!projectId) {
      console.error('Project ID is required for file upload');
      return null;
    }

    try {
      setIsLoading(true);
      
      // 准备文件路径
      const filePath = path ? `${path}/${file.name}` : file.name;
      const bucketPath = `projects/${projectId}/${filePath}`;

      // 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(bucketPath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading file to storage:', error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(bucketPath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFileToStorage:', error);
      toast.error('Upload failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 从 Supabase Storage 下载文件
  const downloadFileFromStorage = useCallback(async (filePath: string): Promise<string | null> => {
    if (!projectId) {
      console.error('Project ID is required for file download');
      return null;
    }

    try {
      setIsLoading(true);
      
      const bucketPath = `projects/${projectId}/${filePath}`;
      
      // 下载文件
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(bucketPath);

      if (error) {
        console.error('Error downloading file from storage:', error);
        return null;
      }

      // 读取文件内容
      return await data.text();
    } catch (error) {
      console.error('Error in downloadFileFromStorage:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 列出项目中的所有文件
  const listProjectFiles = useCallback(async (): Promise<FileItem[]> => {
    if (!projectId) {
      console.error('Project ID is required for listing files');
      return [];
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.storage
        .from('project-files')
        .list(`projects/${projectId}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('Error listing project files:', error);
        return [];
      }

      // 转换存储列表为 FileItem 数组
      const files: FileItem[] = [];
      
      // 按文件夹分组
      const folderMap: Record<string, FileItem> = {};
      
      data.forEach(item => {
        if (item.name.includes('/')) {
          // 处理嵌套文件
          const parts = item.name.split('/');
          const folderName = parts[0];
          const fileName = parts[1];
          
          if (!folderMap[folderName]) {
            folderMap[folderName] = {
              id: generateFolderId(folderName),
              name: folderName,
              type: 'folder',
              children: []
            };
            files.push(folderMap[folderName]);
          }
          
          const extension = fileName.split('.').pop();
          folderMap[folderName].children?.push({
            id: generateFileId(fileName),
            name: fileName,
            type: 'file',
            extension,
            path: `${folderName}/${fileName}`
          });
        } else {
          // 根目录文件
          const extension = item.name.split('.').pop();
          files.push({
            id: generateFileId(item.name),
            name: item.name,
            type: 'file',
            extension,
            path: item.name,
            size: item.metadata?.size
          });
        }
      });

      return files;
    } catch (error) {
      console.error('Error in listProjectFiles:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 创建新文件
  const createFile = useCallback(async (name: string, content: string = ''): Promise<FileItem> => {
    const fileId = generateFileId(name);
    const extension = name.split('.').pop();
    
    const newFile: FileItem = {
      id: fileId,
      name,
      type: 'file',
      extension,
      content,
      lastModified: new Date().toISOString()
    };

    // 如果项目ID存在，上传到 Supabase
    if (projectId && content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], name, { type: 'text/plain' });
      await uploadFileToStorage(file);
    }

    return newFile;
  }, [projectId, uploadFileToStorage]);

  // 创建文件夹
  const createFolder = useCallback(async (name: string): Promise<FileItem> => {
    const folderId = generateFolderId(name);
    
    const newFolder: FileItem = {
      id: folderId,
      name,
      type: 'folder',
      children: [],
      lastModified: new Date().toISOString()
    };

    // 在 Supabase 中创建文件夹（实际上是在数据库中记录）
    if (projectId) {
      try {
        await supabase
          .from('project_folders')
          .insert({
            project_id: projectId,
            name,
            path: name
          });
      } catch (error) {
        console.error('Error creating folder in database:', error);
      }
    }

    return newFolder;
  }, [projectId]);

  // 更新文件内容
  const updateFileContent = useCallback(async (fileId: string, content: string): Promise<void> => {
    // 在实际应用中，这里需要根据文件ID找到文件路径
    console.log(`Updating file ${fileId} with content length: ${content.length}`);
    
    if (projectId) {
      // 这里应该从文件系统中获取文件名
      // 暂时先记录到控制台
      console.log('File update would be synced to Supabase for project:', projectId);
    }
  }, [projectId]);

  // 删除文件
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    console.log(`Deleting file ${fileId}`);
    
    if (projectId) {
      // 在实际应用中，这里需要根据文件ID找到文件路径并删除
      console.log('File deletion would be synced to Supabase for project:', projectId);
    }
  }, [projectId]);

  // 重命名文件
  const renameFile = useCallback(async (fileId: string, newName: string): Promise<void> => {
    console.log(`Renaming file ${fileId} to ${newName}`);
    
    if (projectId) {
      console.log('File rename would be synced to Supabase for project:', projectId);
    }
  }, [projectId]);

  // 上传本地文件
  const uploadFile = useCallback(async (file: File): Promise<FileItem> => {
    setIsLoading(true);
    
    try {
      // 上传到 Supabase Storage
      const fileUrl = await uploadFileToStorage(file);
      
      const extension = file.name.split('.').pop();
      const fileId = generateFileId(file.name);
      
      const uploadedFile: FileItem = {
        id: fileId,
        name: file.name,
        type: 'file',
        extension,
        content: '', // 对于大文件，可能不直接加载内容
        path: file.name,
        lastModified: new Date().toISOString(),
        size: file.size
      };

      // 如果是文本文件，尝试读取内容
      if (file.type.startsWith('text/') || file.type === 'application/javascript' || file.type === 'application/json') {
        const content = await file.text();
        uploadedFile.content = content;
      }

      toast.success(`Uploaded ${file.name}`);
      return uploadedFile;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      toast.error(`Failed to upload ${file.name}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [uploadFileToStorage]);

  return {
    // 基础文件操作
    createFile,
    createFolder,
    updateFileContent,
    deleteFile,
    renameFile,
    uploadFile,
    
    // Supabase 存储操作
    uploadFileToStorage,
    downloadFileFromStorage,
    listProjectFiles,
    
    // 状态
    isLoading
  };
};
