import { useState } from 'react';
import { 
  Settings, 
  User, 
  Palette, 
  Code2, 
  Bell, 
  Shield, 
  Keyboard,
  Monitor,
  Moon,
  Sun,
  X,
  Key,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IntegrationsSettings } from './IntegrationsSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'profile' | 'editor' | 'appearance' | 'notifications' | 'shortcuts' | 'integrations';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
];

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [settings, setSettings] = useState({
    // Profile
    displayName: 'User',
    email: 'user@example.com',
    
    // Editor
    fontSize: '14',
    tabSize: '2',
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    bracketPairColorization: true,
    autoSave: true,
    
    // Appearance
    theme: 'dark',
    accentColor: 'orange',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-secondary/30 p-4">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Settings
              </SheetTitle>
            </SheetHeader>
            
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Profile Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Display Name</label>
                    <Input
                      value={settings.displayName}
                      onChange={(e) => updateSetting('displayName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      type="email"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Editor Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Font Size</p>
                      <p className="text-sm text-muted-foreground">Editor font size in pixels</p>
                    </div>
                    <Select
                      value={settings.fontSize}
                      onValueChange={(v) => updateSetting('fontSize', v)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['12', '14', '16', '18', '20'].map(size => (
                          <SelectItem key={size} value={size}>{size}px</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tab Size</p>
                      <p className="text-sm text-muted-foreground">Spaces per tab</p>
                    </div>
                    <Select
                      value={settings.tabSize}
                      onValueChange={(v) => updateSetting('tabSize', v)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['2', '4', '8'].map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Word Wrap</p>
                      <p className="text-sm text-muted-foreground">Wrap long lines</p>
                    </div>
                    <Switch
                      checked={settings.wordWrap}
                      onCheckedChange={(v) => updateSetting('wordWrap', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Minimap</p>
                      <p className="text-sm text-muted-foreground">Show code minimap</p>
                    </div>
                    <Switch
                      checked={settings.minimap}
                      onCheckedChange={(v) => updateSetting('minimap', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Line Numbers</p>
                      <p className="text-sm text-muted-foreground">Show line numbers</p>
                    </div>
                    <Switch
                      checked={settings.lineNumbers}
                      onCheckedChange={(v) => updateSetting('lineNumbers', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Save</p>
                      <p className="text-sm text-muted-foreground">Automatically save changes</p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(v) => updateSetting('autoSave', v)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Appearance</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={settings.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('theme', 'light')}
                      >
                        <Sun className="w-4 h-4 mr-1" />
                        Light
                      </Button>
                      <Button
                        variant={settings.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('theme', 'dark')}
                      >
                        <Moon className="w-4 h-4 mr-1" />
                        Dark
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Accent Color</p>
                      <p className="text-sm text-muted-foreground">Primary accent color</p>
                    </div>
                    <div className="flex gap-2">
                      {['orange', 'blue', 'green', 'purple', 'pink'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateSetting('accentColor', color)}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            color === 'orange' && "bg-orange-500",
                            color === 'blue' && "bg-blue-500",
                            color === 'green' && "bg-green-500",
                            color === 'purple' && "bg-purple-500",
                            color === 'pink' && "bg-pink-500",
                            settings.accentColor === color && "ring-2 ring-offset-2 ring-offset-background ring-white"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(v) => updateSetting('emailNotifications', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(v) => updateSetting('pushNotifications', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sound</p>
                      <p className="text-sm text-muted-foreground">Play notification sounds</p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(v) => updateSetting('soundEnabled', v)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                
                <div className="space-y-2">
                  {[
                    { keys: ['⌘', 'K'], action: 'Command Palette' },
                    { keys: ['⌘', 'S'], action: 'Save File' },
                    { keys: ['⌘', 'P'], action: 'Quick Open' },
                    { keys: ['⌘', 'B'], action: 'Toggle Sidebar' },
                    { keys: ['⌘', '`'], action: 'Toggle Terminal' },
                    { keys: ['⌘', '/'], action: 'Toggle Comment' },
                    { keys: ['⌘', 'D'], action: 'Duplicate Line' },
                    { keys: ['⌘', '⇧', 'F'], action: 'Search in Files' },
                  ].map((shortcut, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-sm">{shortcut.action}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 text-xs bg-secondary rounded border border-border"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <IntegrationsSettings />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
