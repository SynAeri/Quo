'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Head from "next/head";
import styles from "./styles/home.module.css";
import Typewriter from "typewriter-effect";
import ButtonMain from "./components/mainButtons";
import LoginSignupModal from './basiqComponents/modal';
import BasiqConnectionWrapper from './components/BasiqConnectionWrapper';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

{/* Main Page */}
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBasiqModalOpen, setIsBasiqModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token with backend 
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            sessionStorage.setItem('userId', userData.user.id); // Add this line
          } else {
            // Token is invalid, remove 
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('userId', userData.id); // Add this line
    console.log('User logged in successfully:', userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const initializeBasiqConnection = () => {
    setIsBasiqModalOpen(true);
  };

  const handleBasiqSuccess = (accountData: any) => {
    console.log('Bank account connected successfully:', accountData);
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
        <title>{user ? `Welcome ${user.firstName} - Quo` : "Quo - Financial Risk Assessment"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header with Auth Controls */}
      {user && (
        <header className="">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-lg text-gray-700">Welcome back, {user.firstName}!</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={initializeBasiqConnection}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Connect Bank Account
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

      {/* Section for prelogin */}
      <main>
        <section className="py-8 md:py-16">
          <div className="max-w-7x1 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Big rectangle */}
              <div className="sm:col-span-2 md:p-6 min-h-[calc(100vh-200px)]">
                <div className="ml-15 mt-15 flex items-center">
                  <h1><span className="text-4xl">Quo</span></h1>
                </div>
                <div className="mt-10 ml-10 space-y-10">
                  <div className="striped-content">
                    {user ? (
                      <Typewriter options={{
                        strings: `Welcome back ${user.firstName}! Ready to analyze your finances?`,
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
                    // Show dashboard options for logged-in users
                    <div className="space-y-4">
                      <ButtonMain 
                        onClick={initializeBasiqConnection}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Connect Bank Account
                      </ButtonMain>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <h3 className="font-semibold text-gray-900 mb-2">Risk Assessment</h3>
                          <p className="text-sm text-gray-600">Get your financial risk score</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <h3 className="font-semibold text-gray-900 mb-2">Spending Analysis</h3>
                          <p className="text-sm text-gray-600">AI-powered insights</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show sign-up for non-authenticated users
                    <ButtonMain 
                      onClick={() => setIsModalOpen(true)}
                    >
                      Sign Up
                    </ButtonMain>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Login/Signup Modal */}
      <LoginSignupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Basiq Connection Modal */}
      {user && (
        <BasiqConnectionWrapper
          isOpen={isBasiqModalOpen}
          onClose={() => setIsBasiqModalOpen(false)}
          onSuccess={handleBasiqSuccess}
          userId={user.id}
        />
      )}
    </div>
  );
};
