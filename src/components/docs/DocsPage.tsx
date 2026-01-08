import { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  FileText, 
  Play, 
  Settings, 
  Code2,
  FolderOpen,
  Terminal,
  Globe,
  Share2,
  Users,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DocCategory {
  id: string;
  title: string;
  titleBn: string;
  icon: React.ElementType;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
}

const categories: DocCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    titleBn: 'শুরু করুন',
    icon: Play,
    articles: [
      {
        id: 'intro',
        title: 'Introduction to VibeCode',
        titleBn: 'VibeCode পরিচিতি',
        description: 'Learn what VibeCode is and how it works',
        descriptionBn: 'VibeCode কী এবং এটি কীভাবে কাজ করে তা জানুন',
      },
      {
        id: 'create-first-app',
        title: 'Create Your First App',
        titleBn: 'আপনার প্রথম অ্যাপ তৈরি করুন',
        description: 'Step-by-step guide to create your first application',
        descriptionBn: 'আপনার প্রথম অ্যাপ্লিকেশন তৈরির ধাপে ধাপে গাইড',
      },
      {
        id: 'workspace',
        title: 'Understanding the Workspace',
        titleBn: 'ওয়ার্কস্পেস বোঝা',
        description: 'Learn about the editor, files, and preview panels',
        descriptionBn: 'এডিটর, ফাইল এবং প্রিভিউ প্যানেল সম্পর্কে জানুন',
      },
    ],
  },
  {
    id: 'editor',
    title: 'Code Editor',
    titleBn: 'কোড এডিটর',
    icon: Code2,
    articles: [
      {
        id: 'editor-basics',
        title: 'Editor Basics',
        titleBn: 'এডিটর বেসিক',
        description: 'Learn the basics of the code editor',
        descriptionBn: 'কোড এডিটরের মৌলিক বিষয়গুলো শিখুন',
      },
      {
        id: 'shortcuts',
        title: 'Keyboard Shortcuts',
        titleBn: 'কীবোর্ড শর্টকাট',
        description: 'Master keyboard shortcuts for faster coding',
        descriptionBn: 'দ্রুত কোডিংয়ের জন্য কীবোর্ড শর্টকাট শিখুন',
      },
      {
        id: 'autocomplete',
        title: 'Code Autocomplete',
        titleBn: 'কোড অটোকমপ্লিট',
        description: 'Use AI-powered code suggestions',
        descriptionBn: 'AI-চালিত কোড সাজেশন ব্যবহার করুন',
      },
    ],
  },
  {
    id: 'files',
    title: 'Files & Folders',
    titleBn: 'ফাইল ও ফোল্ডার',
    icon: FolderOpen,
    articles: [
      {
        id: 'file-management',
        title: 'File Management',
        titleBn: 'ফাইল ব্যবস্থাপনা',
        description: 'Create, edit, and organize your files',
        descriptionBn: 'আপনার ফাইল তৈরি, সম্পাদনা এবং সংগঠিত করুন',
      },
      {
        id: 'import-files',
        title: 'Importing Files',
        titleBn: 'ফাইল ইম্পোর্ট',
        description: 'Import files and projects from your computer',
        descriptionBn: 'আপনার কম্পিউটার থেকে ফাইল এবং প্রজেক্ট ইম্পোর্ট করুন',
      },
    ],
  },
  {
    id: 'console',
    title: 'Console & Debugging',
    titleBn: 'কনসোল ও ডিবাগিং',
    icon: Terminal,
    articles: [
      {
        id: 'console-basics',
        title: 'Using the Console',
        titleBn: 'কনসোল ব্যবহার',
        description: 'Learn how to use the console for debugging',
        descriptionBn: 'ডিবাগিংয়ের জন্য কনসোল কীভাবে ব্যবহার করবেন',
      },
      {
        id: 'debugging-tips',
        title: 'Debugging Tips',
        titleBn: 'ডিবাগিং টিপস',
        description: 'Tips and tricks for finding and fixing bugs',
        descriptionBn: 'বাগ খুঁজে বের করা এবং ঠিক করার টিপস',
      },
    ],
  },
  {
    id: 'publishing',
    title: 'Publishing & Sharing',
    titleBn: 'পাবলিশ ও শেয়ার',
    icon: Share2,
    articles: [
      {
        id: 'publish-app',
        title: 'Publish Your App',
        titleBn: 'আপনার অ্যাপ পাবলিশ করুন',
        description: 'Deploy your app to the web',
        descriptionBn: 'আপনার অ্যাপ ওয়েবে ডিপ্লয় করুন',
      },
      {
        id: 'custom-domain',
        title: 'Custom Domains',
        titleBn: 'কাস্টম ডোমেইন',
        description: 'Connect your own domain to your app',
        descriptionBn: 'আপনার নিজের ডোমেইন অ্যাপে কানেক্ট করুন',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings & Account',
    titleBn: 'সেটিংস ও অ্যাকাউন্ট',
    icon: Settings,
    articles: [
      {
        id: 'account-settings',
        title: 'Account Settings',
        titleBn: 'অ্যাকাউন্ট সেটিংস',
        description: 'Manage your account and preferences',
        descriptionBn: 'আপনার অ্যাকাউন্ট এবং পছন্দ পরিচালনা করুন',
      },
      {
        id: 'billing',
        title: 'Billing & Plans',
        titleBn: 'বিলিং ও প্ল্যান',
        description: 'View your plan and manage billing',
        descriptionBn: 'আপনার প্ল্যান দেখুন এবং বিলিং পরিচালনা করুন',
      },
    ],
  },
];

export const DocsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const q = searchQuery.toLowerCase();
  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(
          a => 
            (a.title || '').toLowerCase().includes(q) ||
            (a.titleBn || '').includes(searchQuery) ||
            (a.description || '').toLowerCase().includes(q)
        )
      })).filter(cat => cat.articles.length > 0)
    : categories;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Documentation</h1>
              <p className="text-sm text-muted-foreground">ডকুমেন্টেশন</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            VibeCode এর সম্পূর্ণ গাইড। এখানে আপনি প্রতিটি ফিচার কীভাবে ব্যবহার করতে হয় 
            তা ধাপে ধাপে শিখতে পারবেন।
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ডকুমেন্টেশনে সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <a 
            href="#getting-started"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-medium text-foreground group-hover:text-primary transition-colors">শুরু করুন</div>
                <div className="text-xs text-muted-foreground">Quick start guide</div>
              </div>
            </div>
          </a>
          <a 
            href="#editor"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-foreground group-hover:text-primary transition-colors">এডিটর</div>
                <div className="text-xs text-muted-foreground">Editor guide</div>
              </div>
            </div>
          </a>
          <a 
            href="#publishing"
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-foreground group-hover:text-primary transition-colors">পাবলিশ</div>
                <div className="text-xs text-muted-foreground">Deploy your app</div>
              </div>
            </div>
          </a>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} id={category.id} className="scroll-mt-6">
              <div 
                className="flex items-center gap-2 mb-3 cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <category.icon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{category.title}</h2>
                <span className="text-sm text-muted-foreground">({category.titleBn})</span>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform ml-auto",
                  selectedCategory === category.id && "rotate-90"
                )} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-primary/70 mb-1">{article.titleBn}</p>
                        <p className="text-sm text-muted-foreground">{article.descriptionBn}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">সাহায্য দরকার?</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            আপনি যদি কোনো সমস্যায় পড়েন বা কিছু বুঝতে না পারেন, আমাদের সাপোর্ট টিম সাহায্য করতে প্রস্তুত।
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              সাপোর্টে যোগাযোগ করুন
            </button>
            <button className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              কমিউনিটি ফোরাম
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
