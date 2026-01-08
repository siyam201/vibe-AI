import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  downloads?: number;
  license?: string;
  homepage?: string;
}

interface InstalledPackage {
  name: string;
  version: string;
  isDev?: boolean;
}

interface PackageManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Popular packages for suggestions
const popularPackages: PackageInfo[] = [
  { name: 'react', version: '18.2.0', description: 'A JavaScript library for building user interfaces', downloads: 19500000 },
  { name: 'axios', version: '1.6.2', description: 'Promise based HTTP client for the browser and node.js', downloads: 45000000 },
  { name: 'lodash', version: '4.17.21', description: 'Lodash modular utilities', downloads: 52000000 },
  { name: 'moment', version: '2.29.4', description: 'Parse, validate, manipulate, and display dates', downloads: 18000000 },
  { name: 'uuid', version: '9.0.0', description: 'RFC4122 (v1, v4, and v5) UUIDs', downloads: 82000000 },
  { name: 'date-fns', version: '2.30.0', description: 'Modern JavaScript date utility library', downloads: 20000000 },
  { name: 'zod', version: '3.22.4', description: 'TypeScript-first schema validation', downloads: 8000000 },
  { name: 'framer-motion', version: '10.16.4', description: 'Production-ready animation library for React', downloads: 3500000 },
];

const formatDownloads = (num?: number) => {
  if (!num) return '';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

export const PackageManager = ({ isOpen, onClose }: PackageManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PackageInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [installingPackage, setInstallingPackage] = useState<string | null>(null);
  const [uninstallingPackage, setUninstallingPackage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'installed' | 'search'>('installed');
  
  const [installedPackages, setInstalledPackages] = useState<InstalledPackage[]>([
    { name: 'react', version: '18.3.1' },
    { name: 'react-dom', version: '18.3.1' },
    { name: 'react-router-dom', version: '6.30.1' },
    { name: 'lucide-react', version: '0.462.0' },
    { name: '@tanstack/react-query', version: '5.83.0' },
    { name: 'tailwind-merge', version: '2.6.0' },
    { name: 'sonner', version: '1.7.4' },
    { name: 'zod', version: '3.25.76' },
    { name: 'typescript', version: '5.3.3', isDev: true },
    { name: 'vite', version: '5.4.11', isDev: true },
    { name: 'tailwindcss', version: '3.4.17', isDev: true },
  ]);

  // Simulated search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const results = popularPackages.filter(pkg => 
        (pkg.name || '').toLowerCase().includes(q) ||
        (pkg.description || '').toLowerCase().includes(q)
      );
      
      // Add some mock results based on query
      if (results.length === 0 && searchQuery.length > 2) {
        results.push({
          name: searchQuery,
          version: '1.0.0',
          description: `A package named ${searchQuery}`,
          downloads: Math.floor(Math.random() * 100000),
        });
      }
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInstall = (pkg: PackageInfo) => {
    if (installedPackages.some(p => p.name === pkg.name)) {
      toast.info(`${pkg.name} is already installed`);
      return;
    }

    setInstallingPackage(pkg.name);
    
    // Simulate installation
    setTimeout(() => {
      setInstalledPackages(prev => [...prev, { name: pkg.name, version: pkg.version }]);
      setInstallingPackage(null);
      toast.success(`Installed ${pkg.name}@${pkg.version}`);
    }, 2000);
  };

  const handleUninstall = (pkgName: string) => {
    setUninstallingPackage(pkgName);
    
    // Simulate uninstallation
    setTimeout(() => {
      setInstalledPackages(prev => prev.filter(p => p.name !== pkgName));
      setUninstallingPackage(null);
      toast.success(`Uninstalled ${pkgName}`);
    }, 1500);
  };

  const isInstalled = (pkgName: string) => installedPackages.some(p => p.name === pkgName);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Package Manager
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('installed')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === 'installed'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Installed ({installedPackages.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === 'search'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Search Packages
          </button>
        </div>

        {/* Search Bar (always visible in search tab) */}
        {activeTab === 'search' && (
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search npm packages..."
                className="pl-10 bg-secondary"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'installed' && (
            <div className="p-4 space-y-2">
              {/* Dependencies */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Dependencies ({installedPackages.filter(p => !p.isDev).length})
                </h3>
                {installedPackages.filter(p => !p.isDev).map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <Box className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">v{pkg.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(`https://www.npmjs.com/package/${pkg.name}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleUninstall(pkg.name)}
                        disabled={uninstallingPackage === pkg.name}
                      >
                        {uninstallingPackage === pkg.name ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dev Dependencies */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Dev Dependencies ({installedPackages.filter(p => p.isDev).length})
                </h3>
                {installedPackages.filter(p => p.isDev).map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <Box className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">v{pkg.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(`https://www.npmjs.com/package/${pkg.name}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="p-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No packages found for "{searchQuery}"</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((pkg) => (
                    <div
                      key={pkg.name}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{pkg.name}</h4>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                              v{pkg.version}
                            </span>
                            {isInstalled(pkg.name) && (
                              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Installed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {pkg.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {pkg.downloads && (
                              <span className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {formatDownloads(pkg.downloads)}/week
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isInstalled(pkg.name) ? "outline" : "default"}
                          className="ml-4"
                          disabled={isInstalled(pkg.name) || installingPackage === pkg.name}
                          onClick={() => handleInstall(pkg)}
                        >
                          {installingPackage === pkg.name ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Installing...
                            </>
                          ) : isInstalled(pkg.name) ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Installed
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Install
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Popular Packages</h3>
                  <div className="space-y-2">
                    {popularPackages.map((pkg) => (
                      <div
                        key={pkg.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => setSearchQuery(pkg.name)}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDownloads(pkg.downloads)} downloads/week</p>
                          </div>
                        </div>
                        {isInstalled(pkg.name) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <Button variant="outline" className="w-full gap-2" onClick={() => toast.info('Checking for updates...')}>
            <RefreshCw className="w-4 h-4" />
            Check for Updates
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
