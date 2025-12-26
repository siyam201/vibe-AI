import { Heart, Plus, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Template {
  id: string;
  name: string;
  icon: string;
  color: string;
  likes: string;
  forks: string;
  verified?: boolean;
}

interface TemplatesPageProps {
  onSelectTemplate: (id: string) => void;
}

const languageTemplates: Template[] = [
  { id: 'python', name: 'Python', icon: '🐍', color: 'bg-blue-500', likes: '5.2K', forks: '35.9M', verified: true },
  { id: 'html-css', name: 'HTML, CSS...', icon: '🌐', color: 'bg-orange-500', likes: '2.8K', forks: '11.2M', verified: true },
  { id: 'nodejs', name: 'Node.js', icon: '💚', color: 'bg-green-600', likes: '829', forks: '6.5M', verified: true },
  { id: 'cpp', name: 'C++', icon: '⚡', color: 'bg-blue-600', likes: '959', forks: '4.9M', verified: true },
  { id: 'java', name: 'Java', icon: '☕', color: 'bg-red-500', likes: '934', forks: '4.6M', verified: true },
  { id: 'c', name: 'C', icon: '🔧', color: 'bg-gray-600', likes: '604', forks: '4.5M', verified: true },
  { id: 'csharp', name: 'C#', icon: '🎯', color: 'bg-purple-600', likes: '346', forks: '758.7K', verified: true },
  { id: 'bash', name: 'Bash', icon: '💻', color: 'bg-gray-800', likes: '213', forks: '650.4K', verified: true },
  { id: 'php', name: 'PHP Web...', icon: '🐘', color: 'bg-indigo-600', likes: '201', forks: '568.5K', verified: true },
  { id: 'blank', name: 'Blank Repl', icon: '📄', color: 'bg-gray-500', likes: '159', forks: '506.2K', verified: true },
  { id: 'react', name: 'React Jav...', icon: '⚛️', color: 'bg-cyan-500', likes: '247', forks: '353.2K', verified: true },
  { id: 'html-css-js', name: 'HTML, CS...', icon: '📱', color: 'bg-orange-600', likes: '156', forks: '213.8K', verified: true },
];

const aiTemplates: Template[] = [
  { id: 'python-ds', name: 'Python Data Science', icon: '🤖', color: 'bg-gradient-to-br from-orange-500 to-red-500', likes: '1.2K', forks: '89.5K', verified: true },
];

export const TemplatesPage = ({ onSelectTemplate }: TemplatesPageProps) => {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Developer Frameworks</h1>
            <p className="text-muted-foreground">
              Developer frameworks are advanced coding stacks that can be used to start your next project.
            </p>
            <a href="#" className="text-primary hover:underline text-sm">How to publish a Framework</a>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>

        {/* Languages Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Languages</h2>
          <div className="grid grid-cols-4 gap-4">
            {languageTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="replit-card p-4 text-left hover:border-primary/50 transition-all group"
              >
                <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center text-xl mb-3`}>
                  {template.icon}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm font-medium text-foreground truncate">{template.name}</span>
                  {template.verified && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {template.likes}
                  </span>
                  <span>+ {template.forks}</span>
                </div>
              </button>
            ))}
          </div>
          <Button variant="ghost" className="mt-4 gap-2 text-muted-foreground">
            View more
            <ArrowRight className="w-4 h-4" />
          </Button>
        </section>

        {/* AI Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">AI</h2>
          <div className="grid grid-cols-4 gap-4">
            {aiTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="replit-card overflow-hidden text-left hover:border-primary/50 transition-all group"
              >
                <div className={`h-24 ${template.color} flex items-end p-4`}>
                  <span className="text-4xl opacity-50">{template.icon}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm font-medium text-foreground">{template.name}</span>
                    {template.verified && <CheckCircle className="w-4 h-4 text-success" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {template.likes}
                    </span>
                    <span>+ {template.forks}</span>
                  </div>
                </div>
              </button>
            ))}
            <button className="replit-card p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
              <Plus className="w-5 h-5" />
              Use Framework
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
