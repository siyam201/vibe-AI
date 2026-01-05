import { useState, useCallback, useEffect } from 'react';
import { WebContainer, FileSystemTree } from '@webcontainer/api';

interface UseWebContainerReturn {
  isBooting: boolean;
  isReady: boolean;
  previewUrl: string | null;
  logs: string[];
  error: string | null;
  boot: () => Promise<void>;
  mountFiles: (files: FileSystemTree) => Promise<void>;
  runCommand: (command: string, args?: string[]) => Promise<number>;
  writeFile: (path: string, content: string) => Promise<void>;
  teardown: () => void;
  reset: () => void;
}

// Module-level singleton - only ONE instance per browser session
let globalInstance: WebContainer | null = null;
let globalBootPromise: Promise<WebContainer> | null = null;
let instanceListeners: Set<(url: string) => void> = new Set();

export const useWebContainer = (): UseWebContainerReturn => {
  const [isBooting, setIsBooting] = useState(false);
  const [isReady, setIsReady] = useState(!!globalInstance);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-100), message]);
  }, []);

  // Register listener for server-ready events
  useEffect(() => {
    const listener = (url: string) => {
      setPreviewUrl(url);
    };
    instanceListeners.add(listener);
    return () => {
      instanceListeners.delete(listener);
    };
  }, []);

  const boot = useCallback(async () => {
    // Already have a running instance
    if (globalInstance) {
      addLog('[WebContainer] Using existing instance');
      setIsReady(true);
      return;
    }

    // Boot already in progress - wait for it
    if (globalBootPromise) {
      addLog('[WebContainer] Boot already in progress, waiting...');
      setIsBooting(true);
      try {
        await globalBootPromise;
        setIsReady(true);
      } finally {
        setIsBooting(false);
      }
      return;
    }

    setIsBooting(true);
    setError(null);
    addLog('[WebContainer] Booting...');

    try {
      // Check for cross-origin isolation
      if (!crossOriginIsolated) {
        throw new Error('Cross-Origin Isolation required. Headers COOP/COEP not set.');
      }

      // Create boot promise and store globally
      globalBootPromise = WebContainer.boot();
      globalInstance = await globalBootPromise;
      
      // Listen for server-ready event
      globalInstance.on('server-ready', (port, url) => {
        addLog(`[WebContainer] Server ready on port ${port}: ${url}`);
        // Notify all listeners
        instanceListeners.forEach(listener => listener(url));
      });

      // Listen for errors
      globalInstance.on('error', (err) => {
        addLog(`[WebContainer] Error: ${err.message}`);
        setError(err.message);
      });

      setIsReady(true);
      addLog('[WebContainer] Boot complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`[WebContainer] Boot failed: ${message}`);
      globalBootPromise = null;
    } finally {
      setIsBooting(false);
    }
  }, [addLog]);

  const mountFiles = useCallback(async (files: FileSystemTree) => {
    if (!globalInstance) {
      throw new Error('WebContainer not booted');
    }
    
    addLog('[WebContainer] Mounting files...');
    await globalInstance.mount(files);
    addLog('[WebContainer] Files mounted');
  }, [addLog]);

  const runCommand = useCallback(async (command: string, args: string[] = []): Promise<number> => {
    if (!globalInstance) {
      throw new Error('WebContainer not booted');
    }

    addLog(`[WebContainer] Running: ${command} ${args.join(' ')}`);
    
    const process = await globalInstance.spawn(command, args);
    
    // Stream output to logs
    process.output.pipeTo(new WritableStream({
      write(data) {
        addLog(data);
      }
    }));

    const exitCode = await process.exit;
    addLog(`[WebContainer] Command exited with code ${exitCode}`);
    return exitCode;
  }, [addLog]);

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!globalInstance) {
      throw new Error('WebContainer not booted');
    }

    await globalInstance.fs.writeFile(path, content);
    addLog(`[WebContainer] File written: ${path}`);
  }, [addLog]);

  const teardown = useCallback(() => {
    if (globalInstance) {
      globalInstance.teardown();
      globalInstance = null;
      globalBootPromise = null;
      setIsReady(false);
      setPreviewUrl(null);
      addLog('[WebContainer] Teardown complete');
    }
  }, [addLog]);

  // Reset clears logs and preview without destroying the instance
  const reset = useCallback(() => {
    setLogs([]);
    setPreviewUrl(null);
    setError(null);
    addLog('[WebContainer] Reset - ready for new files');
  }, [addLog]);

  // Don't teardown on unmount - keep the singleton alive
  // Only reset local state

  return {
    isBooting,
    isReady,
    previewUrl,
    logs,
    error,
    boot,
    mountFiles,
    runCommand,
    writeFile,
    teardown,
    reset
  };
};
