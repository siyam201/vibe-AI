import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        // Profile doesn't exist yet, it will be created by the trigger
        // Wait a moment and try again
        console.log('Profile not found, waiting for trigger...');
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (retryData) {
            setProfile(retryData as Profile);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'username' | 'bio' | 'avatar_url'>>) => {
    if (!user?.id) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return { error: updateError };
      }

      setProfile(data as Profile);
      return { data, error: null };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      return { error: err instanceof Error ? err : new Error('Unknown error') };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
};
