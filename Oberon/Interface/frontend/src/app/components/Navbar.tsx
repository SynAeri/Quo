// app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../contexts/accountContext';
import AccountSelector from './analysis/accountSelector';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { selectedAccountId, setSelectedAccountId } = useAccount();
  const isLoggedIn = !!user;

  // Handle account change
  const handleAccountChange = (accountId: string | null) => {
    console.log('Navbar - Account changed to:', accountId);
    setSelectedAccountId(accountId);
    // Also emit event for backwards compatibility
    window.dispatchEvent(new CustomEvent('accountChanged', { detail: { accountId } }));
  };

  return (
    <nav
      className="bg-white shadow-sm"
      style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo and Links */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-md"></div>
              <span className="ml-2 text-xl font-bold hover:text-blue-600">Quo</span>
            </Link>
            <div className="ml-10 hidden md:flex items-center space-x-4">
              <Link href="/services" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">
                About
              </Link>
              <Link href="/projects" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">
                FAQ
              </Link>
              {isLoggedIn && (
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <AccountSelector
                  userId={user.id}
                  selectedAccountId={selectedAccountId}
                  onAccountSelect={handleAccountChange}
                />
                <span className="text-gray-700 text-sm">
                  {user.firstName || user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
            Home
          </Link>
          <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
            About
          </Link>
          <Link href="/faq" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
            FAQ
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
              Dashboard
            </Link>
          )}

          <div className="pt-4 pb-3 border-t border-gray-200">
            {isLoggedIn ? (
              <>
                <div className="px-3 py-2">
                  <AccountSelector
                    userId={user.id}
                    selectedAccountId={selectedAccountId}
                    onAccountSelect={handleAccountChange}
                  />
                </div>
                <div className="px-3 py-2 text-sm text-gray-700 mt-2">
                  Welcome, {user.firstName || user.email}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 mb-2">
                  Login
                </Link>
                <Link href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
