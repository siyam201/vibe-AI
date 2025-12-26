import { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  X, 
  Maximize2, 
  Minimize2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TerminalProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose?: () => void;
}

interface CommandHistory {
  command: string;
  output: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

export const TerminalPanel = ({ isExpanded, onToggleExpand, onClose }: TerminalProps) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([
    { command: '', output: 'Welcome to VibeCode Terminal', type: 'info', timestamp: new Date() },
    { command: '', output: 'Type "help" for available commands', type: 'info', timestamp: new Date() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const commands: Record<string, (args: string[]) => string> = {
    help: () => `Available commands:
  help     - Show this help message
  clear    - Clear the terminal
  echo     - Print text to terminal
  ls       - List files in current directory
  pwd      - Print working directory
  date     - Show current date and time
  node -v  - Show Node.js version
  npm -v   - Show npm version
  whoami   - Show current user`,
    clear: () => {
      setHistory([]);
      return '';
    },
    echo: (args) => args.join(' '),
    ls: () => 'src/  node_modules/  package.json  README.md  index.html',
    pwd: () => '/home/runner/my-app',
    date: () => new Date().toString(),
    'node': (args) => args[0] === '-v' ? 'v20.10.0' : 'Usage: node [options] [script.js]',
    'npm': (args) => args[0] === '-v' ? '10.2.5' : 'Usage: npm <command>',
    whoami: () => 'runner',
    exit: () => {
      onClose?.();
      return 'Closing terminal...';
    },
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = '';
    let type: 'success' | 'error' | 'info' = 'success';

    if (command === 'clear') {
      setHistory([]);
      return;
    }

    if (commands[command]) {
      output = commands[command](args);
    } else if (trimmed.startsWith('npm ')) {
      output = `npm WARN exec The following package was not found and will be installed: ${args.join(' ')}`;
      type = 'info';
    } else {
      output = `bash: ${command}: command not found`;
      type = 'error';
    }

    setHistory(prev => [...prev, {
      command: trimmed,
      output,
      type,
      timestamp: new Date(),
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commandHistory = history.filter(h => h.command).map(h => h.command);
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const commandHistory = history.filter(h => h.command).map(h => h.command);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commandNames = Object.keys(commands);
      const match = commandNames.find(c => c.startsWith(input));
      if (match) setInput(match);
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-[#1a1a2e] border-t border-border transition-all",
      isExpanded ? "h-64" : "h-8"
    )}>
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-3 bg-[#16162a] border-b border-border">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium text-foreground">Shell</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      {isExpanded && (
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((item, i) => (
            <div key={i} className="mb-1">
              {item.command && (
                <div className="flex items-center gap-2 text-green-400">
                  <span className="text-blue-400">~/my-app</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{item.command}</span>
                </div>
              )}
              {item.output && (
                <div className={cn(
                  "whitespace-pre-wrap",
                  item.type === 'error' ? 'text-red-400' : 
                  item.type === 'info' ? 'text-yellow-400' : 'text-foreground'
                )}>
                  {item.output}
                </div>
              )}
            </div>
          ))}
          
          {/* Input Line */}
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-blue-400">~/my-app</span>
            <ChevronRight className="w-3 h-3" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-foreground caret-green-400"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
};
