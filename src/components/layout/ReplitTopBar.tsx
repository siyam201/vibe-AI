import { 
  ChevronDown, 
  Plus,
  Monitor,
  Terminal,
  FolderOpen,
  X,
  Search,
  Users,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  closable?: boolean;
}

interface ReplitTopBarProps {
  projectName: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onPublish: () => void;
}

export const ReplitTopBar = ({ 
  projectName, 
  tabs, 
  activeTab, 
  onTabChange, 
  onTabClose,
  onPublish 
}: ReplitTopBarProps) => {
  return (
    <header className="h-11 bg-card border-b border-border flex items-center justify-between">
      {/* Left: Project Info */}
      <div className="flex items-center gap-3 px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">v</span>
          </div>
          <span className="text-sm font-medium text-foreground">{projectName}</span>
          <span className="w-2 h-2 rounded-full bg-muted" />
        </div>
        <Button size="sm" className="h-7 gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-3 h-3" />
          Upgrade
        </Button>
      </div>

      {/* Center: Tabs */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all border",
              activeTab === tab.id 
                ? "bg-card border-border text-foreground" 
                : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.closable && (
              <X 
                className="w-3 h-3 hover:text-destructive ml-1" 
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              />
            )}
          </button>
        ))}
        <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 px-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Users className="w-4 h-4" />
        </Button>
        <Button 
          onClick={onPublish}
          className="h-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Rocket className="w-4 h-4" />
          Publish
        </Button>
      </div>
    </header>
  );
};
