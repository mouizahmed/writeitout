import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { userApi } from '@/lib/api';
import { User, UserResponse } from '@/types/user';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    if (!isSignedIn || !isLoaded) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get the token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const userData = await userApi.getCurrentUser(token);
      
      // Convert API response to User type
      const user: User = {
        ...userData,
        plan: userData.plan as 'free' | 'pro' | 'enterprise',
        status: userData.status as 'active' | 'inactive' | 'suspended',
      };
      
      setUser(user);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [isSignedIn, isLoaded]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}