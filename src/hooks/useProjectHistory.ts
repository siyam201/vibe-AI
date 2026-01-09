import { useState, useCallback, useEffect } from 'react';
import { useFileOperations, type FileItem } from './useFileOperations';

export const useProjectHistory = (projectId?: string, initialFiles: FileItem[] = []) => {
  const [history, setHistory] = useState<FileItem[][]>([initialFiles]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 使用文件操作 hook
  const fileOperations = useFileOperations(projectId);

  const currentState = history[currentIndex] || [];

  // 从 Supabase 加载项目文件
  const loadProjectFiles = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const files = await fileOperations.listProjectFiles();
      
      if (files.length > 0) {
        setHistory([files]);
        setCurrentIndex(0);
      } else {
        // 如果没有文件，使用初始文件
        setHistory([initialFiles]);
      }
    } catch (error) {
      console.error('Error loading project files:', error);
      setHistory([initialFiles]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fileOperations.listProjectFiles, initialFiles]);

  // 初始化时加载文件
  useEffect(() => {
    loadProjectFiles();
  }, [loadProjectFiles]);

  const pushState = useCallback((newState: FileItem[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      return newHistory;
    });
    setCurrentIndex((prev) => prev + 1);
    
    // 可选：同步到后端
    if (projectId) {
      // 这里可以添加同步到数据库的逻辑
      console.log('State pushed, would sync to backend for project:', projectId);
    }
  }, [currentIndex, projectId]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, history.length]);

  // 保存当前状态到 Supabase
  const saveToBackend = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // 这里可以实现保存到数据库的逻辑
      // 例如：更新项目的文件结构
      console.log('Saving project state to backend:', projectId);
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  }, [projectId]);

  return {
    // 状态
    currentState: currentState,
    history,
    currentIndex,
    
    // 操作
    pushState,
    undo,
    redo,
    saveToBackend,
    reloadFiles: loadProjectFiles,
    
    // 状态检查
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    isLoading,
    
    // 文件操作代理
    fileOperations
  };
};
