import { 
  Upload, 
  Shield, 
  KeyRound, 
  Search, 
  Code2, 
  Puzzle, 
  GitBranch, 
  Play,
  Database,
  Terminal,
  X
} from 'lucide-react';

interface ToolsCommandPanelProps {
  onClose: () => void;
  onSelectTool: (tool: string) => void;
}

const tools = [
  { id: 'uploads', label: 'Uploads', description: 'Upload files, images, videos, and documents', icon: Upload },
  { id: 'auth', label: 'Auth', description: 'Let users log in to your App using a prebuilt login page', icon: Shield },
  { id: 'security', label: 'Security Scanner', description: 'Scan your app for vulnerabilities', icon: Shield },
  { id: 'secrets', label: 'Secrets', description: 'Store sensitive information (like API keys) securely in your App', icon: KeyRound },
  { id: 'code-search', label: 'Code Search', description: 'Search through the text contents of your App', icon: Search },
];

const devTools = [
  { id: 'extensions', label: 'Extension Store', description: 'Find and install workspace extensions', icon: Puzzle },
  { id: 'git', label: 'Git', description: 'Version control for your App', icon: GitBranch },
  { id: 'playground', label: 'Playground', description: 'View and test agents and automations', icon: Play },
  { id: 'kv-store', label: 'Key-Value Store', description: 'Free, easy-to-use key-value store for caching and session management', icon: Database },
  { id: 'shell', label: 'Shell', description: 'Directly access your App through a command line interface (CLI)', icon: Terminal },
];

export const ToolsCommandPanel = ({ onClose, onSelectTool }: ToolsCommandPanelProps) => {
  return (
    <div className="w-96 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search for tools & files..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tools List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
          >
            <tool.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground">{tool.label}</div>
              <div className="text-xs text-muted-foreground">{tool.description}</div>
            </div>
          </button>
        ))}

        <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase border-t border-border mt-2">
          Developer
        </div>

        {devTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
          >
            <tool.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground">{tool.label}</div>
              <div className="text-xs text-muted-foreground">{tool.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
