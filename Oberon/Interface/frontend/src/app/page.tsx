'use client';

import { useAuth } from './hooks/useAuth';
import { useBasiqConnection } from './hooks/useBasiqConnection';
import HeroSection from './components/sections/HeroSection';
import DashboardSection from './components/sections/DashboardSection';
import AuthHeader from './components/sections/AuthHeader';


export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const { 
    isBasiqModalOpen, 
    openBasiqModal, 
    closeBasiqModal,
    handleBasiqSuccess 
  } = useBasiqConnection();



  return (
    <div className="min-h-screen">
      {user && <AuthHeader user={user} onLogout={logout} />}
      
      <main>
        {user ? (
          <DashboardSection 
            user={user}
            onConnectBank={openBasiqModal}
            isBasiqModalOpen={isBasiqModalOpen}
            onBasiqModalClose={closeBasiqModal}
            onBasiqSuccess={handleBasiqSuccess}
          />
        ) : (
          <HeroSection />
        )}
      </main>
    </div>
  );
}
