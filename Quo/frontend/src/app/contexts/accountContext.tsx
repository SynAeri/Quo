// app/contexts/accountContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AccountContextType {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Memoize the setter to prevent unnecessary re-renders
  const handleSetSelectedAccountId = useCallback((accountId: string | null) => {
    console.log('AccountContext - Setting account:', accountId);
    setSelectedAccountId(accountId);
  }, []);

  // Listen for account changes from other sources (for backwards compatibility)
  useEffect(() => {
    const handleAccountChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('AccountContext - External account change:', customEvent.detail?.accountId);
      const newAccountId = customEvent.detail?.accountId ?? null;
      handleSetSelectedAccountId(newAccountId);
    };

    window.addEventListener('accountChanged', handleAccountChange);
    window.addEventListener('accountChangedFromDashboard', handleAccountChange);

    return () => {
      window.removeEventListener('accountChanged', handleAccountChange);
      window.removeEventListener('accountChangedFromDashboard', handleAccountChange);
    };
  }, [handleSetSelectedAccountId]); // Only depends on the memoized setter

  const contextValue = React.useMemo(
    () => ({
      selectedAccountId,
      setSelectedAccountId: handleSetSelectedAccountId,
    }),
    [selectedAccountId, handleSetSelectedAccountId]
  );

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
