'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Head from "next/head";
import styles from "./styles/home.module.css";
import Typewriter from "typewriter-effect";
import ButtonMain from "./components/mainButtons";
import LoginSignupModal from './basiqComponents/modal';
import BasiqConnectionWrapper from './components/BasiqConnectionWrapper';
import BasiqDebugComponent from './components/BasicDebugComponent';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface BankConnection {
  institution_name: string;
  connection_status: string;
  connected_at: string;
  account_ids: string[];
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBasiqModalOpen, setIsBasiqModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState(false);
  const [connections, setConnections] = useState<BankConnection[]>([]);

  // Check for Basiq return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobIds = urlParams.get('jobIds');
    
    if (jobIds) {
      console.log('Detected return from Basiq with jobIds:', jobIds);
      const timer = setTimeout(() => {
        setIsBasiqModalOpen(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Check if user has bank connections
  const checkUserConnections = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/basiq/check-connection/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHasConnections(data.has_connections);
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  };

  // Check auth status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            let userData: User | null = null;
            
            if (data.id && data.email) {
              userData = data as User;
            } else if (data.user && data.user.id) {
              userData = data.user as User;
            } else if (data.data && data.data.id) {
              userData = data.data as User;
            }
            
            if (userData) {
              setUser(userData);
              sessionStorage.setItem('userId', userData.id);
              sessionStorage.setItem('userData', JSON.stringify(userData));
              
              // Check for bank connections
              await checkUserConnections(userData.id);
            }
          } else {
            if (response.status === 401) {
              localStorage.removeItem('authToken');
              sessionStorage.clear();
            }
          }
        } catch (error) {
          console.error('Auth verification error:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('userId', userData.id);
    sessionStorage.setItem('userData', JSON.stringify(userData));
    console.log('User logged in successfully:', userData);
    
    // Check for connections after login
    checkUserConnections(userData.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    setUser(null);
    setHasConnections(false);
    setConnections([]);
  };

  const initializeBasiqConnection = () => {
    if (!user || !user.id) {
      console.error('Cannot open Basiq connection: User ID is missing');
      return;
    }
    setIsBasiqModalOpen(true);
  };

  const handleBasiqSuccess = async (accountData: any) => {
    console.log('Bank account connected successfully:', accountData);
    
    // Save connection to backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/basiq/save-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId: user?.id,
          basiqUserId: accountData.basiqUserId,
          institutionName: accountData.institutionName,
          accountIds: [accountData.accountId]
        })
      });

      if (response.ok) {
        // Refresh connection status
        if (user) {
          await checkUserConnections(user.id);
        }
      }
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
    
    setIsBasiqModalOpen(false);
    
    // Clean up URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>{user ? `Welcome ${user.firstName || 'User'} - Quo` : "Quo - Financial Risk Assessment"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header with Auth Controls */}
      {user && (
        <header className="">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-lg text-gray-700">
                  Welcome back, {user.firstName || user.email}!
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={initializeBasiqConnection}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    hasConnections 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {hasConnections ? 'Manage Bank Accounts' : 'Connect Bank Account'}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main>
        <section className="py-8 md:py-16">
          <div className="max-w-7x1 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="sm:col-span-2 md:p-6 min-h-[calc(100vh-200px)]">
                <div className="ml-15 mt-15 flex items-center">
                  <h1><span className="text-4xl">Quo</span></h1>
                </div>
                <div className="mt-10 ml-10 space-y-10">
                  <div className="striped-content">
                    {user ? (
                      <Typewriter options={{
                        strings: hasConnections 
                          ? `Welcome back ${user.firstName || 'there'}! Your bank is connected and ready.`
                          : `Welcome back ${user.firstName || 'there'}! Ready to connect your bank?`,
                        autoStart: true,
                        delay: 50,
                      }} />
                    ) : (
                      <Typewriter options={{
                        strings: "Attempt at saving better",
                        autoStart: true,
                        delay: 50,
                      }} />
                    )}
                  </div>
                  
                  {user ? (
                    <div className="space-y-4">
                      {/* Show connection status */}
                      {hasConnections && connections.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <h3 className="font-semibold text-green-800 mb-2">Connected Banks</h3>
                          {connections.map((conn, index) => (
                            <div key={index} className="text-sm text-green-700">
                              ✓ {conn.institution_name || 'Bank Account'} - Connected
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <ButtonMain 
                        onClick={initializeBasiqConnection}
                        className={hasConnections ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                      >
                        {hasConnections ? 'Manage Bank Accounts' : 'Connect Bank Account'}
                      </ButtonMain>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <div className={`bg-white p-4 rounded-lg shadow-md ${!hasConnections && 'opacity-50'}`}>
                          <h3 className="font-semibold text-gray-900 mb-2">Risk Assessment</h3>
                          <p className="text-sm text-gray-600">
                            {hasConnections ? 'Get your financial risk score' : 'Connect a bank first'}
                          </p>
                        </div>
                        <div className={`bg-white p-4 rounded-lg shadow-md ${!hasConnections && 'opacity-50'}`}>
                          <h3 className="font-semibold text-gray-900 mb-2">Spending Analysis</h3>
                          <p className="text-sm text-gray-600">
                            {hasConnections ? 'AI-powered insights' : 'Connect a bank first'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ButtonMain onClick={() => setIsModalOpen(true)}>
                      Sign Up
                    </ButtonMain>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <LoginSignupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {user && user.id && (
        <BasiqConnectionWrapper
          isOpen={isBasiqModalOpen}
          onClose={() => setIsBasiqModalOpen(false)}
          onSuccess={handleBasiqSuccess}
          userId={user.id}
        />
      )}
      
      {process.env.NODE_ENV === 'development' && <BasiqDebugComponent />}
    </div>
  );
};
