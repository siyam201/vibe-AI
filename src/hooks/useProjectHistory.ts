// useProjectHistory.ts - 简化版本
import { useState, useCallback } from 'react';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileItem[];
  path?: string;
  lastModified?: string;
  issues?: Array<{
    type: 'error' | 'warning' | 'info' | 'security';
    message: string;
    line?: number;
    column?: number;
    fix?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export const useProjectHistory = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];

  const pushState = useCallback((newState: T) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      return newHistory;
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

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

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};
