import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReplitSidebar } from '@/components/layout/ReplitSidebar';
import { CreateAppPrompt } from '@/components/home/CreateAppPrompt';
import { CommandPalette } from '@/components/command/CommandPalette';
import { TemplatesPage } from '@/components/templates/TemplatesPage';
import { PricingModal } from '@/components/modals/PricingModal';
import { LearnPage } from '@/components/learn/LearnPage';
import { DocsPage } from '@/components/docs/DocsPage';
import { DeployPanel } from '@/components/deploy/DeployPanel';
import { IDEWorkspace } from '@/components/workspace/IDEWorkspace';
import { AppsPage } from '@/components/apps/AppsPage';
import { AccountDBPage } from '@/components/account/AccountDBPage';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProjectHistory } from '@/hooks/useProjectHistory';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  // Navigation state
  const [activeNav, setActiveNav] = useState('home');
  const [view, setView] = useState<'home' | 'editor' | 'templates' | 'learn' | 'docs' | 'apps' | 'account'>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  // ১. প্রজেক্ট হিস্ট্রি থেকে ডাটা নেয়া (একবারই ডিক্লেয়ার করা হয়েছে)
  const { createProject, currentProject } = useProjectHistory();

  // Persist sidebar state
  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };
  
  // Modal state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  
  // Project state
  const [projectName, setProjectName] = useState('My-App');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create app from prompt
  const handleCreateApp = async (idea: string, type: 'app' | 'design', projectInfo?: { name: string; type: string; mode: string }) => {
    const name = projectInfo?.name || idea.split(' ').slice(0, 3).join('-') || 'My-App';
    const project = await createProject(name);
    if (project) {
      setProjectName(project.name);
      setInitialPrompt(`Create a ${projectInfo?.type || 'web'} app: ${idea}`);
      setActiveNav('apps');
      setView('editor');
      toast.success(`Starting "${project.name}" - sending to AI Planner...`);
    }
  };

  const handleCommandSelect = (id: string) => {
    switch (id) {
      case 'console':
      case 'preview':
        setView('editor');
        break;
      case 'publishing':
        setShowDeploy(true);
        break;
      case 'auth':
        navigate('/auth');
        break;
      default:
        toast.info(`Opening ${id}...`);
    }
  };

  const handleNavChange = (nav: string) => {
    setActiveNav(nav);
    if (nav === 'home') setView('home');
    if (nav === 'apps') setView('apps');
    if (nav === 'frameworks') setView('templates');
    if (nav === 'learn') setView('learn');
    if (nav === 'docs') setView('docs');
    if (nav === 'account') setView('account');
  };

  const handleOpenApp = (appId: string, appName: string) => {
    setProjectName(appName);
    setView('editor');
    setActiveNav('apps');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <ReplitSidebar 
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onCreateApp={() => setView('home')}
        user={user}
        onLogout={async () => {
          await signOut();
          navigate('/auth');
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {view === 'home' && (
          <CreateAppPrompt 
            userName={userName} 
            onStart={handleCreateApp}
          />
        )}

        {view === 'templates' && (
          <TemplatesPage 
            onSelectTemplate={(id) => {
              toast.success(`Creating ${id} project...`);
              setView('editor');
            }}
          />
        )}

        {view === 'learn' && <LearnPage />}
        {view === 'docs' && <DocsPage />}

        {view === 'apps' && (
          <AppsPage 
            onOpenApp={handleOpenApp}
            onCreateApp={() => setView('home')}
          />
        )}

        {view === 'account' && <AccountDBPage />}

        {view === 'editor' && (
          <IDEWorkspace
            projectName={projectName}
            onPublish={() => setShowDeploy(true)}
            initialPrompt={initialPrompt}
            initialMode="plan"
          />
        )}
      </div>

      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelect={handleCommandSelect}
      />
      <PricingModal 
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
      />
      
      {/* ২. ডিপ্লয় প্যানেলে ডাটা পাঠানো হচ্ছে */}
      <DeployPanel
        isOpen={showDeploy}
        onClose={() => setShowDeploy(false)}
        projectName={projectName}
        projectFiles={currentProject?.files || []} 
      />
    </div>
  );
};

export default Index;
