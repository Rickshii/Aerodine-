import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription;

    const initializeAuth = async () => {
      if (isSupabaseConfigured) {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchAndSetUserRole(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await fetchAndSetUserRole(session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        });
        
        subscription = data.subscription;
      } else {
        // Fallback mock logic if Supabase isn't fully set up yet
        const stored = localStorage.getItem('rms_user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchAndSetUserRole = async (authUser) => {
    try {
      // Query the custom users table for the role
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();
        
      if (data && !error) {
        setUser({
          uid: authUser.id,
          email: authUser.email,
          role: data.role
        });
      } else {
        // Fallback if no role in table
        setUser({
          uid: authUser.id,
          email: authUser.email,
          role: 'waiter' // Default role
        });
      }
    } catch (err) {
      console.error("Error fetching user role", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, mockRole = 'waiter') => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        await fetchAndSetUserRole(data.user);
        return data;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    } else {
      // Simulate static login roles
      const mockUser = {
        uid: `uid-${Math.random()}`,
        email,
        role: mockRole
      };
      setUser(mockUser);
      localStorage.setItem('rms_user', JSON.stringify(mockUser));
      setLoading(false);
      return mockUser;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      setUser(null);
      localStorage.removeItem('rms_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
