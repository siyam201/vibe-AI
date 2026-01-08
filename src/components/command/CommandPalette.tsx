import { useState } from 'react';
import { 
  Search, 
  X, 
  Terminal, 
  Monitor, 
  Rocket, 
  Link2, 
  Database, 
  FolderOpen,
  Shield,
  KeyRound,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const commands: CommandItem[] = [
  { id: 'console', label: 'Console', description: 'View the terminal output after running your code', icon: <Terminal className="w-5 h-5" />, category: 'Your App' },
  { id: 'preview', label: 'Preview', description: 'Preview your App', icon: <Monitor className="w-5 h-5" />, category: 'Jump to existing tab' },
  { id: 'publishing', label: 'Publishing', description: 'Publish a live, stable, public version of your App', icon: <Rocket className="w-5 h-5" />, category: 'Suggested' },
  { id: 'integrations', label: 'Integrations', description: 'Connect to native and external services', icon: <Link2 className="w-5 h-5" />, category: 'Suggested' },
  { id: 'database', label: 'Database', description: 'Stores structured data such as user profiles, game scores, and product catalogs', icon: <Database className="w-5 h-5" />, category: 'Suggested' },
  { id: 'storage', label: 'App Storage', description: 'Built-in object storage that lets your app easily host and save uploads', icon: <FolderOpen className="w-5 h-5" />, category: 'Suggested' },
  { id: 'auth', label: 'Auth', description: 'Let users log in to your App using a prebuilt login page', icon: <Users className="w-5 h-5" />, category: 'Suggested' },
  { id: 'security', label: 'Security Scanner', description: 'Scan your app for vulnerabilities', icon: <Shield className="w-5 h-5" />, category: 'Suggested' },
  { id: 'secrets', label: 'Secrets', description: 'Store sensitive information (like API keys) securely', icon: <KeyRound className="w-5 h-5" />, category: 'Suggested' },
];

export const CommandPalette = ({ isOpen, onClose, onSelect }: CommandPaletteProps) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filteredCommands = commands.filter(cmd => 
    (cmd.label || '').toLowerCase().includes(q) ||
    (cmd.description || '').toLowerCase().includes(q)
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for tools & files..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">{category}</div>
              {items.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelect(cmd.id);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
                >
                  <span className="text-muted-foreground mt-0.5">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
