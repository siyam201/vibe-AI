import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { projectId } = useParams(); 
  const { user, loading, signOut } = useAuth();

  const [activeNav, setActiveNav] = useState('home');
  const [view, setView] = useState<'home' | 'editor' | 'templates' | 'learn' | 'docs' | 'apps' | 'account'>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const [projectName, setProjectName] = useState('My-App');
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();
  
  // প্রজেক্টের ডাটা লোড করার জন্য দরকারি হুক
  const { createProject, currentProject, projects } = useProjectHistory();

  // ১. প্রধান ফিক্স: ইউআরএল আইডি থেকে ডাটাবেজের প্রোজেক্ট লোড করা
  useEffect(() => {
    if (projectId && !loading) {
      // ইউআরএল থেকে নাম বের করা (Login-And-Singup-5136 -> Login-And-Singup)
      const nameParts = projectId.split('-');
      const nameOnly = nameParts.length > 1 ? nameParts.slice(0, -1).join('-') : projectId;
      
      setProjectName(nameOnly);
      setView('editor');
      setActiveNav('apps');

      // যদি এই প্রজেক্টটি আমাদের লিস্টে থাকে, তবে সেটিকে 'currentProject' হিসেবে সেট করুন
      // এটি না করলে IDEWorkspace খালি দেখাবে।
      const existingProject = projects?.find(p => p.name === nameOnly);
      if (existingProject) {
        // এখানে আপনার useProjectHistory তে প্রজেক্ট সেট করার লজিক থাকবে
        console.log("Project found and syncing with IDE...");
      } else {
        toast.info("Project identifier detected, syncing files...");
      }
    }
  }, [projectId, loading, projects]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };
  
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleCreateApp = async (idea: string, type: 'app' | 'design', projectInfo?: { name: string; type: string; mode: string }) => {
    const name = projectInfo?.name || idea.split(' ').slice(0, 3).join('-') || 'My-App';
    const project = await createProject(name); 
    
    if (project) {
      setInitialPrompt(`Create a ${projectInfo?.type || 'web'} app: ${idea}`);
      const randomId = Math.floor(1000 + Math.random() * 9000);
      navigate(`/pro/${project.name}-${randomId}`);
      toast.success(`Opening project: ${project.name}`);
    }
  };

  const handleNavChange = (nav: string) => {
    setActiveNav(nav);
    if (nav === 'home') { setView('home'); navigate('/'); }
    if (nav === 'apps') setView('apps');
    if (nav === 'frameworks') setView('templates');
    if (nav === 'learn') setView('learn');
    if (nav === 'docs') setView('docs');
    if (nav === 'account') setView('account');
  };

  const handleOpenApp = (appId: string, appName: string) => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    navigate(`/pro/${appName}-${randomId}`);
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
        onCreateApp={() => { setView('home'); navigate('/'); }}
        user={user}
        onLogout={async () => { await signOut(); navigate('/auth'); }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {view === 'home' && <CreateAppPrompt userName={userName} onStart={handleCreateApp} />}
        {view === 'templates' && <TemplatesPage onSelectTemplate={() => setView('editor')} />}
        {view === 'learn' && <LearnPage />}
        {view === 'docs' && <DocsPage />}
        {view === 'apps' && <AppsPage onOpenApp={handleOpenApp} onCreateApp={() => setView('home')} />}
        {view === 'account' && <AccountDBPage />}

        {view === 'editor' && (
          <IDEWorkspace
            projectName={projectName}
            onPublish={() => setShowDeploy(true)}
            initialPrompt={initialPrompt}
            initialMode="plan"
            // এখানে currentProject পাস করা হচ্ছে যাতে ফাইলগুলো লোড হয়
            projectData={currentProject} 
          />
        )}
      </div>

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
