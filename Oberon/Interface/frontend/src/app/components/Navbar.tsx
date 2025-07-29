// app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../contexts/accountContext';
import AccountSelector from './analysis/accountSelector';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const { user, logout } = useAuth();
  const { selectedAccountId, setSelectedAccountId } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = !!user;

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 20);
      
      // Make navbar transparent only on landing page at top
      if (!isLoggedIn && pathname === '/') {
        setIsTransparent(offset < 100);
      } else {
        setIsTransparent(false);
      }
    };

    // Check if we're on landing page
    setIsTransparent(!isLoggedIn && pathname === '/');
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoggedIn, pathname]);

  // Handle account change
  const handleAccountChange = (accountId: string | null) => {
    console.log('Navbar - Account changed to:', accountId);
    setSelectedAccountId(accountId);
    window.dispatchEvent(new CustomEvent('accountChanged', { detail: { accountId } }));
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    // If not on home page, navigate to home first
    if (pathname !== '/') {
      router.push('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const offset = 80; // Account for navbar height
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80; // Account for navbar height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
    
    // Close mobile menu if open
    setIsMenuOpen(false);
  };

  // Dynamic navbar classes based on scroll and page
  const navbarClasses = `
    fixed top-0 w-full z-50 transition-all duration-300
    ${scrolled ? 'shadow-lg' : ''}
    ${isTransparent 
      ? 'bg-transparent' 
      : scrolled 
        ? 'bg-white/95 backdrop-blur-md' 
        : 'bg-white'
    }
  `;

  const linkClasses = `
    transition-colors px-3 py-2 rounded-md text-sm font-medium cursor-pointer
    ${isTransparent 
      ? 'text-white hover:text-gray-200 hover:bg-white/10' 
      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }
  `;

  const logoClasses = `
    flex items-center cursor-pointer
    ${isTransparent ? 'text-white' : 'text-gray-900'}
  `;

  const buttonPrimaryClasses = `
    px-4 py-2 rounded-md text-sm font-medium transition-all
    ${isTransparent
      ? 'bg-white text-gray-900 hover:bg-gray-100'
      : 'bg-blue-600 text-white hover:bg-blue-700'
    }
  `;

  const buttonSecondaryClasses = `
    px-3 py-2 rounded-md text-sm font-medium transition-all
    ${isTransparent
      ? 'text-white border border-white hover:bg-white hover:text-gray-900'
      : 'text-gray-600 hover:text-blue-600'
    }
  `;

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo and Links */}
          <div className="flex items-center">
            <div 
              onClick={() => {
                if (pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  router.push('/');
                }
              }}
              className={logoClasses}
            >
              <div className={`h-8 w-8 rounded-md ${isTransparent ? 'bg-white/20' : 'bg-blue-600'}`}></div>
              <span className="ml-2 text-xl font-bold">Quo</span>
            </div>
            <div className="ml-10 hidden md:flex items-center space-x-4">
              <button 
                onClick={() => scrollToSection('about')} 
                className={linkClasses}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className={linkClasses}
              >
                Features
              </button>
              {isLoggedIn && (
                <Link href="/dashboard" className={linkClasses}>
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
                <span className={`text-sm ${isTransparent ? 'text-white' : 'text-gray-700'}`}>
                  {user.firstName || user.email}
                </span>
                <button
                  onClick={logout}
                  className={buttonSecondaryClasses}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonSecondaryClasses}>
                  Login
                </Link>
                <Link href="/signup" className={buttonPrimaryClasses}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isTransparent 
                  ? 'text-white hover:bg-white/10' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
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
        <div className={`md:hidden ${isTransparent ? 'bg-black/90' : 'bg-white'} backdrop-blur-md`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button 
              onClick={() => scrollToSection('about')} 
              className={`block w-full text-left ${linkClasses}`}
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className={`block w-full text-left ${linkClasses}`}
            >
              Features
            </button>

            {isLoggedIn && (
              <Link href="/dashboard" className={`block ${linkClasses}`}>
                Dashboard
              </Link>
            )}

            <div className="pt-4 pb-3 border-t border-gray-200/20">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2">
                    <AccountSelector
                      userId={user.id}
                      selectedAccountId={selectedAccountId}
                      onAccountSelect={handleAccountChange}
                    />
                  </div>
                  <div className={`px-3 py-2 text-sm ${isTransparent ? 'text-white' : 'text-gray-700'} mt-2`}>
                    Welcome, {user.firstName || user.email}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left ${linkClasses}`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={`block ${buttonSecondaryClasses} text-center mb-2 mx-3`}>
                    Login
                  </Link>
                  <Link href="/signup" className={`block ${buttonPrimaryClasses} text-center mx-3`}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
