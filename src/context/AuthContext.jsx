import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseMock } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseMock && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // Extract mock role from custom attributes, in a real app this comes from custom claims or DB
          const role = firebaseUser.email.split('@')[0]; // Simple logic for demo
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: role || 'waiter'
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Load mock session from local storage if testing locally
      const stored = localStorage.getItem('rms_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email, password, mockRole = 'waiter') => {
    setLoading(true);
    if (!isFirebaseMock && auth) {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential;
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
    if (!isFirebaseMock && auth) {
      await signOut(auth);
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
