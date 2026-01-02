import { useState, useCallback, useRef, useEffect } from 'react';
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
}

export const useWebContainer = (): UseWebContainerReturn => {
  const [isBooting, setIsBooting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const instanceRef = useRef<WebContainer | null>(null);
  const bootedRef = useRef(false);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-100), message]); // Keep last 100 logs
  }, []);

  const boot = useCallback(async () => {
    if (bootedRef.current || instanceRef.current) {
      addLog('[WebContainer] Already booted');
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

      instanceRef.current = await WebContainer.boot();
      bootedRef.current = true;
      
      // Listen for server-ready event
      instanceRef.current.on('server-ready', (port, url) => {
        addLog(`[WebContainer] Server ready on port ${port}: ${url}`);
        setPreviewUrl(url);
      });

      // Listen for errors
      instanceRef.current.on('error', (err) => {
        addLog(`[WebContainer] Error: ${err.message}`);
        setError(err.message);
      });

      setIsReady(true);
      addLog('[WebContainer] Boot complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`[WebContainer] Boot failed: ${message}`);
    } finally {
      setIsBooting(false);
    }
  }, [addLog]);

  const mountFiles = useCallback(async (files: FileSystemTree) => {
    if (!instanceRef.current) {
      throw new Error('WebContainer not booted');
    }
    
    addLog('[WebContainer] Mounting files...');
    await instanceRef.current.mount(files);
    addLog('[WebContainer] Files mounted');
  }, [addLog]);

  const runCommand = useCallback(async (command: string, args: string[] = []): Promise<number> => {
    if (!instanceRef.current) {
      throw new Error('WebContainer not booted');
    }

    addLog(`[WebContainer] Running: ${command} ${args.join(' ')}`);
    
    const process = await instanceRef.current.spawn(command, args);
    
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
    if (!instanceRef.current) {
      throw new Error('WebContainer not booted');
    }

    await instanceRef.current.fs.writeFile(path, content);
    addLog(`[WebContainer] File written: ${path}`);
  }, [addLog]);

  const teardown = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.teardown();
      instanceRef.current = null;
      bootedRef.current = false;
      setIsReady(false);
      setPreviewUrl(null);
      addLog('[WebContainer] Teardown complete');
    }
  }, [addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.teardown();
      }
    };
  }, []);

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
    teardown
  };
};
