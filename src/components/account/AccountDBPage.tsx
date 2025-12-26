import { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Eye,
  Users,
  FolderOpen,
  Loader2,
  Plus,
  User,
  Mail,
  Calendar,
  Shield,
  Save,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

type TableName = 'projects' | 'profiles';

interface TableInfo {
  name: string;
  rowCount: number;
  icon: React.ElementType;
}

export const AccountDBPage = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  
  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  // DB state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        username: username,
        bio: bio
      });
      toast({
        title: "Saved",
        description: "Profile updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchTableInfo = async () => {
    setRefreshing(true);
    try {
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setTables([
        { name: 'projects', rowCount: projectsCount || 0, icon: FolderOpen },
        { name: 'profiles', rowCount: profilesCount || 0, icon: Users },
      ]);
    } catch (error) {
      console.error('Error fetching table info:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchTableData = async (tableName: TableName) => {
    setLoading(true);
    setSelectedTable(tableName);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100);

      if (error) throw error;
      setTableData((data as Record<string, unknown>[]) || []);
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast({
        title: "Error",
        description: `Failed to fetch data from ${tableName}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestProject = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: `Test Project ${Date.now()}`,
          description: 'A test project',
          files: [],
          is_starred: false
        });

      if (error) throw error;

      toast({
        title: "Created",
        description: "Test project created"
      });

      fetchTableInfo();
      if (selectedTable === 'projects') {
        fetchTableData('projects');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const deleteRow = async (id: string) => {
    if (!selectedTable) return;
    
    try {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Deleted", description: "Row deleted" });
      fetchTableData(selectedTable);
      fetchTableInfo();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchTableInfo();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              Please log in to access your account and database controls
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Account & Database</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and data</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-foreground font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="text-foreground font-mono text-sm">{user.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <div className="flex items-center gap-2 text-foreground">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant="default" className="mt-1">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Edit Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Edit Profile
                </CardTitle>
                <CardDescription>
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your display name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="your_username"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={createTestProject}>
                <Plus className="w-4 h-4 mr-2" />
                Create Test Project
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchTableInfo}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((tableInfo) => (
                <Card 
                  key={tableInfo.name}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedTable === tableInfo.name ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => fetchTableData(tableInfo.name as TableName)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <tableInfo.icon className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-base">{tableInfo.name}</CardTitle>
                      </div>
                      <Badge variant="secondary">{tableInfo.rowCount} rows</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Click to view data</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Table Data */}
            {selectedTable && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {selectedTable}
                    </CardTitle>
                    <Badge variant="outline">{tableData.length} records</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : tableData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No data found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            {Object.keys(tableData[0]).map((key) => (
                              <th key={key} className="text-left p-3 font-medium text-muted-foreground">
                                {key}
                              </th>
                            ))}
                            <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, index) => {
                            const rowId = row.id as string | undefined;
                            return (
                              <tr key={rowId || index} className="border-b border-border/50 hover:bg-muted/50">
                                {Object.entries(row).map(([key, value]) => (
                                  <td key={key} className="p-3 max-w-xs truncate">
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value).substring(0, 30) + '...'
                                      : String(value ?? '-')
                                    }
                                  </td>
                                ))}
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {rowId && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteRow(rowId);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
