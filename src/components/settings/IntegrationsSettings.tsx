import { useState } from 'react';
import { 
  Key, 
  Github, 
  Mail, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  ExternalLink,
  Database,
  Cloud,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isSet: boolean;
  description: string;
  docsUrl?: string;
}

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  status?: 'active' | 'error' | 'pending';
}

export const IntegrationsSettings = () => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'gemini',
      name: 'Gemini API Key',
      key: '••••••••••••••••',
      isSet: true,
      description: 'Google Gemini AI for code generation and chat',
      docsUrl: 'https://ai.google.dev/'
    },
    {
      id: 'gmail',
      name: 'Gmail App Password',
      key: '••••••••••••••••',
      isSet: true,
      description: 'Gmail app password for sending emails',
      docsUrl: 'https://support.google.com/accounts/answer/185833'
    },
    {
      id: 'openai',
      name: 'OpenAI API Key',
      key: '',
      isSet: false,
      description: 'OpenAI GPT models for AI features',
      docsUrl: 'https://platform.openai.com/api-keys'
    },
    {
      id: 'stripe',
      name: 'Stripe Secret Key',
      key: '',
      isSet: false,
      description: 'Stripe for payment processing',
      docsUrl: 'https://dashboard.stripe.com/apikeys'
    }
  ]);

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      description: 'Sync code to GitHub repository',
      connected: false,
      status: 'pending'
    },
    {
      id: 'supabase',
      name: 'Lovable Cloud',
      icon: <Cloud className="w-5 h-5" />,
      description: 'Database, auth, and edge functions',
      connected: true,
      status: 'active'
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: <Zap className="w-5 h-5" />,
      description: 'Deploy to Vercel hosting',
      connected: false,
      status: 'pending'
    }
  ]);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveKey = (id: string) => {
    if (!newKeyValue.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setApiKeys(prev => prev.map(key => 
      key.id === id 
        ? { ...key, key: '••••••••••••••••', isSet: true }
        : key
    ));
    setEditingKey(null);
    setNewKeyValue('');
    toast.success('API key saved successfully');
  };

  const handleRemoveKey = (id: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === id 
        ? { ...key, key: '', isSet: false }
        : key
    ));
    toast.success('API key removed');
  };

  const handleConnect = (id: string) => {
    if (id === 'github') {
      toast.info('Use GitHub → Connect to GitHub in the editor menu');
      return;
    }
    
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, connected: true, status: 'active' as const }
        : int
    ));
    toast.success('Integration connected');
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, connected: false, status: 'pending' as const }
        : int
    ));
    toast.success('Integration disconnected');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your API keys and integrations</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="api-keys" className="gap-2">
                <Key className="w-4 h-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2">
                <Zap className="w-4 h-4" />
                Integrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Configure API keys for AI services, email, payments, and more.
              </p>

              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="bg-secondary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">{apiKey.name}</CardTitle>
                        {apiKey.isSet ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Set
                          </Badge>
                        )}
                      </div>
                      {apiKey.docsUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => window.open(apiKey.docsUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Docs
                        </Button>
                      )}
                    </div>
                    <CardDescription className="text-xs">{apiKey.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingKey === apiKey.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="Enter your API key"
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                            className="font-mono text-sm"
                          />
                          <Button size="sm" onClick={() => handleSaveKey(apiKey.id)}>
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingKey(null);
                              setNewKeyValue('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            type={showKeys[apiKey.id] ? 'text' : 'password'}
                            value={apiKey.isSet ? apiKey.key : 'Not configured'}
                            readOnly
                            className="font-mono text-sm bg-background/50"
                          />
                          {apiKey.isSet && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => toggleShowKey(apiKey.id)}
                            >
                              {showKeys[apiKey.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={apiKey.isSet ? 'outline' : 'default'}
                          onClick={() => setEditingKey(apiKey.id)}
                        >
                          {apiKey.isSet ? 'Update' : 'Add Key'}
                        </Button>
                        {apiKey.isSet && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveKey(apiKey.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Lovable AI Included</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your project includes Lovable AI with Gemini models. Your own API keys take priority when configured.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Connect external services and platforms.
              </p>

              {integrations.map((integration) => (
                <Card key={integration.id} className="bg-secondary/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          integration.connected 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {integration.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium">{integration.name}</h3>
                            {integration.connected && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  integration.status === 'active' && "bg-green-500/10 text-green-400 border-green-500/30",
                                  integration.status === 'error' && "bg-red-500/10 text-red-400 border-red-500/30"
                                )}
                              >
                                {integration.status === 'active' ? 'Connected' : 'Error'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <div>
                        {integration.connected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                            disabled={integration.id === 'supabase'}
                          >
                            {integration.id === 'supabase' ? 'Active' : 'Disconnect'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConnect(integration.id)}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Environment</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <span className="text-muted-foreground">Project ID</span>
                    <p className="font-mono mt-1 truncate">vyigudviaospfrmcmzsd</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <span className="text-muted-foreground">Region</span>
                    <p className="font-mono mt-1">us-east-1</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};
