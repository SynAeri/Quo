'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBasiqConnection } from './hooks/useBasiqConnection';
import HeroSection from './components/sections/HeroSection';
import DashboardSection from './components/sections/DashboardSection';
import AuthHeader from './components/sections/AuthHeader';
import AboutSection from './components/sections/AboutSection';

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

  // Listen for account changes from navbar
  useEffect(() => {
    const handleAccountChange = (event: CustomEvent) => {
      console.log('Page - Account changed event received:', event.detail);
      setSelectedAccountId(event.detail.accountId);
    };

    window.addEventListener('accountChanged', handleAccountChange as EventListener);
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange as EventListener);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Page - Selected Account:', selectedAccountId);
  }, [selectedAccountId]);

  // For logged-in users, show dashboard only
  if (user) {
    return (
      <div className="min-h-screen">
        <DashboardSection 
          user={user}
          onConnectBank={openBasiqModal}
          isBasiqModalOpen={isBasiqModalOpen}
          onBasiqModalClose={closeBasiqModal}
          onBasiqSuccess={handleBasiqSuccess}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
        />
      </div>
    );
  }

  // For non-logged-in users, show landing page with sections
  return (
    <div className="relative">
      {/* Hero section with original background */}
      <div className="min-h-[95vh] relative">
        <HeroSection />
      </div>
      
      {/* Gradient transition */}
      <div className="h-70 bg-gradient-to-b from-transparent to-black relative z-10" /> 
      
      {/* About section with white background */}
      <div className="bg-black relative z-10">
        <AboutSection />
        
        {/* Add more sections here */}
        {/* <FeaturesSection /> */}
        {/* <TestimonialsSection /> */}
        {/* <FooterSection /> */}
      </div>
    </div>
  );
}
