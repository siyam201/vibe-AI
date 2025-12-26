import { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  RefreshCw, 
  Trash2, 
  Eye,
  Users,
  FolderOpen,
  Loader2,
  Plus,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TableInfo {
  name: string;
  rowCount: number;
  icon: React.ElementType;
}

type TableName = 'projects' | 'profiles';

export const DBControlPage = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTableInfo = async () => {
    setRefreshing(true);
    try {
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (projectsError) console.error('Projects error:', projectsError);
      if (profilesError) console.error('Profiles error:', profilesError);

      setTables([
        { name: 'projects', rowCount: projectsCount || 0, icon: FolderOpen },
        { name: 'profiles', rowCount: profilesCount || 0, icon: Users },
      ]);
    } catch (error) {
      console.error('Error fetching table info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch database info",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const createTestProject = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to create test data",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: `Test Project ${Date.now()}`,
          description: 'A test project created from DB Control',
          files: [],
          is_starred: false
        });

      if (error) throw error;

      toast({
        title: "Created",
        description: "Test project created successfully"
      });

      fetchTableInfo();
      if (selectedTable === 'projects') {
        fetchTableData('projects');
      }
    } catch (error) {
      console.error('Error creating test project:', error);
      toast({
        title: "Error",
        description: "Failed to create test project",
        variant: "destructive"
      });
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

  const deleteRow = async (id: string) => {
    if (!selectedTable) return;
    
    try {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Deleted",
        description: "Row deleted successfully"
      });
      
      fetchTableData(selectedTable);
      fetchTableInfo();
    } catch (error) {
      console.error('Error deleting row:', error);
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTableInfo();
  }, []);

  return (
    <div className="flex-1 p-6 overflow-auto bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Database Control</h1>
              <p className="text-sm text-muted-foreground">Manage your application data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Badge variant="default" className="flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Logged in as {user.email}
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <UserX className="w-3 h-3" />
                Not logged in
              </Badge>
            )}
            <Button 
              variant="outline" 
              onClick={createTestProject}
              disabled={!user}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Test Data
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
        </div>

        {/* Auth Warning */}
        {!user && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                You must be logged in to view and manage database records. RLS policies require authentication.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                <CardDescription>
                  Click to view and manage data
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Data View */}
        {selectedTable && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-muted-foreground" />
                  <CardTitle>{selectedTable}</CardTitle>
                </div>
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
                  <p>No data found in this table</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {Object.keys(tableData[0]).map((key) => (
                          <th 
                            key={key} 
                            className="text-left p-3 font-medium text-muted-foreground"
                          >
                            {key}
                          </th>
                        ))}
                        <th className="text-right p-3 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => {
                        const rowId = row.id as string | undefined;
                        return (
                          <tr 
                            key={rowId || index} 
                            className="border-b border-border/50 hover:bg-muted/50"
                          >
                            {Object.entries(row).map(([key, value]) => (
                              <td key={key} className="p-3 max-w-xs truncate">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 50) + '...'
                                  : String(value ?? '-')
                                }
                              </td>
                            ))}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {rowId && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive"
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
      </div>
    </div>
  );
};
