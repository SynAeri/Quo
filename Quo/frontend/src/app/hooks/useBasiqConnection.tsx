// ===== app/hooks/useBasiqConnection.tsx - Basiq Logic =====
'use client';

import { useState, useEffect } from 'react';
import { checkUserConnections, saveBasiqConnection } from '../utils/api';

export function useBasiqConnection() {
  const [isBasiqModalOpen, setIsBasiqModalOpen] = useState(false);
  const [hasConnections, setHasConnections] = useState(false);
  const [connections, setConnections] = useState([]);

  // Check for Basiq return URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobIds = urlParams.get('jobIds');
    
    if (jobIds) {
      console.log('Detected return from Basiq with jobIds:', jobIds);
      setTimeout(() => setIsBasiqModalOpen(true), 100);
    }
  }, []);

  const openBasiqModal = () => setIsBasiqModalOpen(true);
  const closeBasiqModal = () => setIsBasiqModalOpen(false);

  const checkConnections = async (userId: string) => {
    try {
      const data = await checkUserConnections(userId);
      setHasConnections(data.has_connections);
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  };

  const handleBasiqSuccess = async (accountData: any, userId: string) => {
    console.log('Bank account connected successfully:', accountData);
    
    try {
      await saveBasiqConnection({
        userId,
        basiqUserId: accountData.basiqUserId,
        institutionName: accountData.institutionName,
        accountIds: [accountData.accountId]
      });
      
      await checkConnections(userId);
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
    
    closeBasiqModal();
    
    // Clean up URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  };

  return {
    isBasiqModalOpen,
    openBasiqModal,
    closeBasiqModal,
    hasConnections,
    connections,
    checkConnections,
    handleBasiqSuccess
  };
}
