// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBasiqConnection } from './hooks/useBasiqConnection';
import HeroSection from './components/sections/HeroSection';
import DashboardSection from './components/sections/DashboardSection';
import AboutSection from './components/sections/AboutSection';
import FeaturesSection from './components/sections/FeaturesSection';
import FooterSection from './components/sections/FooterSection';
import ScrollToTop from './components/ui/ScrollToTop';

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const { 
    isBasiqModalOpen, 
    openBasiqModal, 
    closeBasiqModal,
    handleBasiqSuccess 
  } = useBasiqConnection();
  
  // Add account state management
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Handle account changes from both navbar and dashboard
  const handleAccountChange = (accountId: string | null) => {
    console.log('Page - Account changed to:', accountId);
    setSelectedAccountId(accountId);
    
    // Emit event for navbar to update its display
    const event = new CustomEvent('accountChangedFromDashboard', {
      detail: { accountId }
    });
    window.dispatchEvent(event);
  };
  
  // Listen for account changes from navbar
  useEffect(() => {
    const handleNavbarAccountChange = (event: CustomEvent) => {
      console.log('Page - Account changed from navbar:', event.detail);
      setSelectedAccountId(event.detail.accountId);
    };
    
    window.addEventListener('accountChanged', handleNavbarAccountChange as EventListener);
    
    return () => {
      window.removeEventListener('accountChanged', handleNavbarAccountChange as EventListener);
    };
  }, []);
  
  // Reset account when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, resetting account selection');
      setSelectedAccountId(null);
    }
  }, [user?.id]);
  
  // For logged-in users, show dashboard only
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSection 
          user={user}
          onConnectBank={openBasiqModal}
          isBasiqModalOpen={isBasiqModalOpen}
          onBasiqModalClose={closeBasiqModal}
          onBasiqSuccess={handleBasiqSuccess}
          selectedAccountId={selectedAccountId}
          onAccountChange={handleAccountChange}
        />
      </div>
    );
  }
  
  // For non-logged-in users, show landing page with sections
  return (
    <div className="relative">
      {/* Hero section with dark background */}
      <div className="min-h-screen relative">
        <HeroSection />
      </div>
      
      {/* About section with transition from black to dark gray */}
      <div id="about" className="relative scroll-mt-20">
        {/* Gradient transition */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-0" />
        
        <div className="bg-gray-900 relative">
          <AboutSection />
        </div>
      </div>
      
      {/* Features section with transition to light */}
      <div id="features" className="relative scroll-mt-20">
        {/* Gradient transition from dark to light */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-900 to-gray-50 z-0" />
        
        <FeaturesSection />
      </div>
      
      {/* FAQ section with transition back to dark */}
      <div id="faq" className="relative scroll-mt-20">
        {/* Gradient transition from light to dark */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-gray-900 z-0" />
        
        <div className="bg-gray-900 relative pt-32">
        </div>
      </div>
      
      {/* Footer */}
      <FooterSection />
      
      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
}
