// app/components/ProvidersWrapper.tsx
'use client';

import { AccountProvider } from '../contexts/accountContext';
import Navbar from './Navbar';
import ParticlesBackground from './nodeShapes';

export default function ProvidersWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <AccountProvider>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        {children}
      </main>
      <ParticlesBackground />
    </AccountProvider>
  );
}
