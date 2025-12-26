import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User, 
  Database, 
  Shield, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const AuthTest = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, updateProfile, refetch } = useProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    setIsUpdating(true);
    const { error } = await updateProfile({ display_name: displayName });
    setIsUpdating(false);

    if (error) {
      toast.error('Failed to update profile: ' + error.message);
    } else {
      toast.success('Profile updated successfully!');
      setDisplayName('');
    }
  };

  const StatusIndicator = ({ status, label }: { status: 'success' | 'error' | 'loading' | 'pending'; label: string }) => {
    const icons = {
      success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      error: <XCircle className="w-5 h-5 text-red-500" />,
      loading: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
      pending: <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />,
    };

    return (
      <div className="flex items-center gap-2">
        {icons[status]}
        <span className="text-sm">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Button>

        <h1 className="text-3xl font-bold text-foreground">Auth & Database Test</h1>
        <p className="text-muted-foreground">
          This page tests the authentication and database integration.
        </p>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusIndicator 
              status={authLoading ? 'loading' : user ? 'success' : 'error'} 
              label={authLoading ? 'Checking auth...' : user ? 'Authenticated' : 'Not authenticated'} 
            />
            <StatusIndicator 
              status={profileLoading ? 'loading' : profile ? 'success' : profileError ? 'error' : 'pending'} 
              label={profileLoading ? 'Loading profile...' : profile ? 'Profile loaded' : profileError ? 'Profile error' : 'No profile'} 
            />
            <StatusIndicator 
              status={session ? 'success' : 'pending'} 
              label={session ? 'Session active' : 'No session'} 
            />
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Current authenticated user details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sign In:</span>
                  <span>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      await signOut();
                      toast.success('Signed out');
                      navigate('/auth');
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Not logged in</p>
                <Button onClick={() => navigate('/auth')}>
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Profile
                </CardTitle>
                <CardDescription>
                  Profile data from Supabase database
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={refetch}
                disabled={profileLoading}
              >
                <RefreshCw className={`w-4 h-4 ${profileLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : profileError ? (
              <div className="text-center py-4 text-red-500">
                Error: {profileError}
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile ID:</span>
                    <span className="font-mono text-xs">{profile.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Display Name:</span>
                    <span>{profile.display_name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span>{profile.username || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bio:</span>
                    <span>{profile.bio || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(profile.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(profile.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Update Profile Form */}
                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="font-medium">Update Profile</h4>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder={profile.display_name || 'Enter display name'}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={isUpdating || !displayName.trim()}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </div>
              </div>
            ) : user ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Profile not found. It should be created automatically on signup.
                </p>
                <Button variant="outline" onClick={refetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Login to see your profile
              </p>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-secondary p-4 rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify({ 
                authLoading,
                profileLoading,
                hasUser: !!user,
                hasSession: !!session,
                hasProfile: !!profile,
                profileError,
                userId: user?.id,
                profileUserId: profile?.user_id,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;
