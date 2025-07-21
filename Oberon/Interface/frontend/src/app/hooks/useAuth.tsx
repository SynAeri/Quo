'use client';

import { useState, useEffect } from 'react';
import { verifyToken, loginUser, signupUser } from '../utils/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        // Don't clear auth on network errors - server might be down
      }
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
    }
    
    return response;
  };

  // Alternative login method for components that just pass userData
  const setUserData = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('userId', userData.id);
    sessionStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,      // For email/password login
    signup,     // For signup
    setUserData, // For components that already have user data
    logout,
    checkAuthStatus
  };
}
