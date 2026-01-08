import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Copy, 
  Check,
  FilePlus,
  FileEdit,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Target,
  Bug,
  Upload,
  FileText,
  X,
  TestTube,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Code2,
  Paperclip,
  ThumbsUp,
  Clock,
  Lightbulb,
  Image,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  operations?: FileOperation[];
  attachments?: AttachedFile[];
  testResults?: TestResult[];
}

interface FileOperation {
  type: 'create' | 'edit' | 'delete';
  path: string;
  content?: string;
}

interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
}

interface TestResult {
  type: 'error' | 'warning' | 'success';
  message: string;
  file?: string;
}

interface Feature {
  id: number;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could' | 'future';
  effort: 'low' | 'medium' | 'high';
  approved: boolean;
}

interface ExecutionPlan {
  title: string;
  summary: string;
  features?: Feature[];
  aiRecommendation?: string;
}

const quickActions = [
  { icon: FilePlus, label: 'Create File', prompt: 'Create a new file called ' },
  { icon: FileEdit, label: 'Edit File', prompt: 'Edit the file ' },
  { icon: Bug, label: 'Fix Bug', prompt: 'Fix the bug in ' },
  { icon: TestTube, label: 'Test App', prompt: 'Test my app for bugs and issues' },
];

const testPrompts = [
  { label: '🚀 Landing Page', prompt: 'Create a modern landing page with hero section, features, and footer' },
  { label: '📝 Todo App', prompt: 'Create a todo app with add, complete, and delete functionality' },
  { label: '🎨 Dashboard', prompt: 'Create a dashboard with stats cards and a chart section' },
  { label: '🔐 Login Form', prompt: 'Create a beautiful login form with email and password fields' },
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Assistant. I can:\n\n• **Create & Edit** files\n• **Plan** your projects\n• **Test** for bugs\n• **Upload** images & files\n\nTell me what you want to build!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'plan' | 'test'>('chat');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newAttachments: AttachedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      size: file.size,
    }));
    setAttachedFiles(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const runTests = () => {
    setIsLoading(true);
    const testResults: TestResult[] = [
      { type: 'success', message: 'All tests passed! No issues found.' },
      { type: 'warning', message: 'Consider adding error boundaries', file: 'App.tsx' },
    ];

    const testMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '## Test Results\n\nScanned project files:\n\n✅ All tests passed\n⚠️ 1 warning found',
      timestamp: new Date(),
      testResults,
    };

    setTimeout(() => {
      setMessages(prev => [...prev, testMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const sendMessage = (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const attachmentInfo = attachedFiles.length > 0
      ? `\n\n[Attached ${attachedFiles.length} file(s): ${attachedFiles.map(f => f.name).join(', ')}]`
      : '';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim() + attachmentInfo,
      timestamp: new Date(),
      attachments: [...attachedFiles],
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: activeMode === 'plan' 
          ? "I've created a plan for your project. Review the features and click 'Execute Plan' to begin."
          : "I'll help you build that! Here's what I can do:\n\n1. Create the necessary files\n2. Set up the structure\n3. Implement the functionality\n\nLet me know if you'd like me to proceed!",
        timestamp: new Date(),
        operations: activeMode === 'chat' ? [
          { type: 'create', path: 'components/Button.tsx' },
          { type: 'edit', path: 'App.tsx' }
        ] : undefined,
      };

      if (activeMode === 'plan') {
        setCurrentPlan({
          title: 'Modern Web App',
          summary: 'A responsive web application with modern UI/UX',
          features: [
            { id: 1, name: 'User Authentication', description: 'Login and signup functionality', priority: 'must', effort: 'medium', approved: false },
            { id: 2, name: 'Dashboard', description: 'Main dashboard with stats', priority: 'must', effort: 'high', approved: false },
            { id: 3, name: 'Dark Mode', description: 'Toggle between light and dark themes', priority: 'should', effort: 'low', approved: false },
          ],
          aiRecommendation: 'Start with authentication first, then build the dashboard. Dark mode can be added later.',
        });
      }

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSend = () => {
    if (activeMode === 'test') {
      runTests();
    } else {
      sendMessage(input);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleFeatureApproval = (featureId: number) => {
    if (!currentPlan?.features) return;
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.map(f => 
        f.id === featureId ? { ...f, approved: !f.approved } : f
      )
    });
  };

  const approveAll = () => {
    if (!currentPlan?.features) return;
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.map(f => ({ ...f, approved: true }))
    });
  };

  const handleExecutePlan = () => {
    if (!currentPlan) return;
    const approvedFeatures = currentPlan.features?.filter(f => f.approved) || [];
    if (approvedFeatures.length === 0) return;
    
    setActiveMode('chat');
    setCurrentPlan(null);
    setInput(`Execute plan: ${currentPlan.title} with ${approvedFeatures.length} features`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'must': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'should': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'could': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low': return <Zap className="w-3 h-3 text-green-400" />;
      case 'medium': return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div 
      className="h-screen flex bg-gray-950 text-gray-100"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`${showHistory ? 'w-64' : 'w-12'} bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          {showHistory && <span className="text-sm font-medium">Chats</span>}
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
        
        {showHistory && (
          <>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {['Recent chat', 'Project planning', 'Bug fixes', 'Code review'].map((chat, i) => (
                <button key={i} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-400 hover:text-gray-100 transition-colors">
                  {chat}
                </button>
              ))}
            </div>
            <button className="m-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col relative">
        {isDragging && (
          <div className="absolute inset-0 bg-green-500/20 border-2 border-dashed border-green-500 z-50 flex items-center justify-center">
            <div className="bg-gray-900 p-6 rounded-xl shadow-xl text-center">
              <Upload className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="font-medium">Drop files here</p>
              <p className="text-gray-400 text-sm">Images, documents, or code files</p>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Vibe AI</h2>
                <p className="text-xs text-gray-400">Chat + Plan + Test</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-gray-900 p-1 rounded-lg">
            {[
              { id: 'chat', icon: Code2, label: 'Code' },
              { id: 'plan', icon: Target, label: 'Plan' },
              { id: 'test', icon: TestTube, label: 'Test' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as 'chat' | 'plan' | 'test')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeMode === mode.id
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  if (action.label === 'Test App') {
                    setActiveMode('test');
                    runTests();
                  } else {
                    setInput(action.prompt);
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5" />
              Quick Templates
            </span>
            {showTemplates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {showTemplates && (
            <div className="grid grid-cols-2 gap-2">
              {testPrompts.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setInput(item.prompt);
                    setShowTemplates(false);
                  }}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-left transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  message.role === 'user' 
                    ? "bg-green-600" 
                    : "bg-gradient-to-br from-green-500 to-emerald-600"
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 rounded-xl p-4 max-w-[85%] ${
                  message.role === 'user'
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-gray-900 border border-gray-800"
                }`}>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.attachments.map((file) => (
                        <div key={file.id} className="bg-gray-800 rounded p-2 flex items-center gap-2 border border-gray-700">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <FileText className="w-8 h-8 text-gray-400" />
                          )}
                          <div className="text-xs">
                            <p className="font-medium truncate max-w-[100px]">{file.name}</p>
                            <p className="text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.operations && message.operations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.operations.map((op, idx) => (
                        <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          op.type === 'create' ? 'bg-green-500/20 text-green-400' :
                          op.type === 'edit' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {op.type === 'create' && <FilePlus className="w-3 h-3" />}
                          {op.type === 'edit' && <FileEdit className="w-3 h-3" />}
                          {op.type === 'delete' && <Trash2 className="w-3 h-3" />}
                          {op.type}: {op.path}
                        </span>
                      ))}
                    </div>
                  )}

                  {message.testResults && message.testResults.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {message.testResults.map((result, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded text-xs ${
                            result.type === 'error' ? 'bg-red-500/10 text-red-400' :
                            result.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-green-500/10 text-green-400'
                          }`}
                        >
                          {result.type === 'error' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {result.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {result.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{result.message}</span>
                          {result.file && <code className="opacity-70">({result.file})</code>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                  {message.role === 'assistant' && message.content && (
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="mt-3 p-1.5 hover:bg-gray-800 rounded transition-colors"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                <span className="text-sm text-green-500">
                  {activeMode === 'test' ? 'Running tests...' : activeMode === 'plan' ? 'Creating plan...' : 'Generating...'}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {currentPlan && (
          <div className="border-t border-gray-800 bg-gray-900 max-h-[50%] overflow-auto">
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{currentPlan.summary}</p>
                </div>
                <button onClick={() => setCurrentPlan(null)} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentPlan.aiRecommendation && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-green-400">{currentPlan.aiRecommendation}</p>
                  </div>
                </div>
              )}

              {currentPlan.features && currentPlan.features.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Features ({currentPlan.features.filter(f => f.approved).length}/{currentPlan.features.length} approved)
                    </h4>
                    <button onClick={approveAll} className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      Approve All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {currentPlan.features.map((feature) => (
                      <div
                        key={feature.id}
                        className={`rounded-lg p-3 border transition-all ${
                          feature.approved 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-gray-800 border-gray-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={feature.approved}
                            onChange={() => toggleFeatureApproval(feature.id)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 accent-green-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium">{feature.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] border ${getPriorityColor(feature.priority)}`}>
                                {feature.priority}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                {getEffortIcon(feature.effort)}
                                {feature.effort}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCurrentPlan(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecutePlan}
                  disabled={!currentPlan.features?.some(f => f.approved)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Execute Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {attachedFiles.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-800 flex gap-2 flex-wrap">
            {attachedFiles.map((file) => (
              <div key={file.id} className="bg-gray-800 rounded-lg p-2 flex items-center gap-2 text-xs border border-gray-700">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                ) : (
                  <FileText className="w-6 h-6 text-gray-400" />
                )}
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-900 rounded-xl border border-gray-800 focus-within:border-green-500/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeMode === 'test' 
                  ? "Click 'Run Tests' or describe what to test..." 
                  : activeMode === 'plan'
                  ? "Describe your project idea..."
                  : "Describe what you want to build..."
              }
              className="w-full bg-transparent px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
              rows={2}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.html,.css"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Upload image"
                >
                  <Image className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 ml-2 flex items-center gap-1">
                  {activeMode === 'chat' && <><Zap className="w-3 h-3" /> Code</>}
                  {activeMode === 'plan' && <><Target className="w-3 h-3" /> Plan</>}
                  {activeMode === 'test' && <><TestTube className="w-3 h-3" /> Test</>}
                </span>
              </div>
              <button 
                onClick={handleSend}
                disabled={(!input.trim() && activeMode !== 'test') || isLoading}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : activeMode === 'test' ? (
                  <>
                    <TestTube className="w-4 h-4" />
                    Run Tests
                  </>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Press Enter to send • Drag & drop files to attach
          </p>
        </div>
      </div>
    </div>
  );
}
