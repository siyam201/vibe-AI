import { 
  Plus, 
  Upload, 
  Home, 
  FolderOpen, 
  Globe, 
  Search,
  Sparkles,
  LogOut,
  User,
  Database,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReplitSidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  onCreateApp: () => void;
  user?: { email?: string | null; displayName?: string | null } | null;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'apps', label: 'Apps', icon: FolderOpen },
  { id: 'published', label: 'Published apps', icon: Globe },
  { id: 'account', label: 'Account & DB', icon: Database },
];

export const ReplitSidebar = ({ 
  activeNav, 
  onNavChange, 
  onCreateApp, 
  user, 
  onLogout,
  isCollapsed = false,
  onToggleCollapse
}: ReplitSidebarProps) => {

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60"
      )}>
        {/* Logo & Search */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-warning flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <span className="text-sm font-semibold text-foreground">VibeCode</span>
              )}
            </div>
            {!isCollapsed && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* User Info */}
          {user && (
            <div className={cn(
              "flex items-center justify-between mb-3 rounded-lg bg-secondary/50",
              isCollapsed ? "px-1.5 py-1.5" : "px-2 py-1.5"
            )}>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border border-border">
                    <p>{displayName}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs text-foreground truncate max-w-[120px]">{displayName}</span>
                  </div>
                  {onLogout && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={onLogout}
                    >
                      <LogOut className="w-3 h-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Create App Button */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={onCreateApp}
                  size="icon"
                  className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border border-border">
                <p>Create App</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button 
              onClick={onCreateApp}
              className="w-full justify-start gap-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border"
            >
              <Plus className="w-4 h-4" />
              Create App
            </Button>
          )}

          {/* Import */}
          {!isCollapsed && (
            <button className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-all">
              <Upload className="w-4 h-4" />
              Import code or design
            </button>
          )}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full flex justify-center py-2 mt-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-all">
                  <Upload className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border border-border">
                <p>Import code or design</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              isCollapsed ? (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onNavChange(item.id)}
                      className={cn(
                        "w-full flex justify-center py-2.5 rounded-lg transition-all",
                        activeNav === item.id 
                          ? "bg-sidebar-accent text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border border-border">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  key={item.id}
                  onClick={() => onNavChange(item.id)}
                  className={cn(
                    "nav-item w-full",
                    activeNav === item.id && "active"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              )
            ))}
          </div>
        </nav>

        {/* Collapse Toggle Button */}
        {onToggleCollapse && (
          <div className="p-2 border-t border-sidebar-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "sm"}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    isCollapsed ? "w-full" : "w-full justify-start gap-2"
                  )}
                  onClick={onToggleCollapse}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4" />
                  ) : (
                    <>
                      <PanelLeftClose className="w-4 h-4" />
                      <span className="text-xs">Collapse</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-popover border border-border">
                  <p>Expand sidebar</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
};
