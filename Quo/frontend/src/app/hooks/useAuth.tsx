// app/hooks/useAuth.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { verifyToken, loginUser, signupUser } from '../utils/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Create a global event emitter for auth state changes
const authEventEmitter = {
  listeners: [] as Array<() => void>,
  emit() {
    this.listeners.forEach(listener => listener());
  },
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, forceUpdate] = useState({});
  const router = useRouter();

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = authEventEmitter.subscribe(() => {
      checkAuthStatus();
      forceUpdate({}); // Force re-render
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      try {
        const userData = await verifyToken(token);
        if (userData) {
          setUser(userData);
          sessionStorage.setItem('userId', userData.id);
          sessionStorage.setItem('userData', JSON.stringify(userData));
        } else {
          // Token is invalid
          localStorage.removeItem('authToken');
          sessionStorage.clear();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      }
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response = await loginUser(email, password);
    
    if (response.success) {
      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      sessionStorage.setItem('userId', response.user.id);
      sessionStorage.setItem('userData', JSON.stringify(response.user));
      authEventEmitter.emit(); // Notify all listeners
    }
    
    return response;
  };

  const signup = async (data: any) => {
    const response = await signupUser(data);
    
    if (response.success) {
      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      sessionStorage.setItem('userId', response.user.id);
      sessionStorage.setItem('userData', JSON.stringify(response.user));
      authEventEmitter.emit(); // Notify all listeners
    }
    
    return response;
  };

  const setUserData = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('userId', userData.id);
    sessionStorage.setItem('userData', JSON.stringify(userData));
    authEventEmitter.emit(); // Notify all listeners
  };

  const logout = useCallback(() => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    setUser(null);
    
    // Emit auth change event
    authEventEmitter.emit();
    
    // Try router methods
    router.push('/');
    router.refresh();
    
    // If all else fails, force a page reload after a short delay
    setTimeout(() => {
      if (localStorage.getItem('authToken')) {
        // If token still exists, force reload
        window.location.href = '/';
      }
    }, 100);
  }, [router]);

  return {
    user,
    isLoading,
    login,
    signup,
    setUserData,
    logout,
    checkAuthStatus
  };
}
