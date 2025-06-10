'use client'; // Add this line for client-side interactivity

import Link from 'next/link';
import { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className=""
    style={{
      position: 'fixed',
      bottom: 0,
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo and site name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-md"></div>
              <span className="ml-2 text-xl font-bold hover:text-blue-600">Synaeri</span>
            </Link>
            <div className="ml-10 flex items-center space-x-4">
            <Link href="/services" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">
              Services
            </Link>
            <Link href="/projects" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">
              Projects
            </Link>
            <Link href="/commissions" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium">
              Commissions
            </Link>
            </div>
          </div>
          {/* Desktop navigation */}

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
              Home
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
              About
            </Link>
            <Link href="/services" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
              Services
            </Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50">
              Contact
            </Link>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 mb-2">
                Login
              </Link>
              <Link href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
