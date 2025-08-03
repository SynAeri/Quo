// account selector
//
import React, { useState, useEffect } from 'react';

import { ChevronDown, Building2, CreditCard, RefreshCw, Check } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  accountNo: string;
  balance: number;
  availableBalance: number;
  accountType: string;
  institution: string;
  status: string;
  lastUpdated: string;
}

interface AccountSelectorProps {
  userId: string;
  selectedAccountId: string | null;
  onAccountSelect: (accountId: string | null) => void;
}

export default function AccountSelector({ userId, selectedAccountId, onAccountSelect }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [userId]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.accounts || []);
      
      // Set default account if none selected
      if (!selectedAccountId && data.defaultAccountId) {
        onAccountSelect(data.defaultAccountId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg animate-pulse">
        <CreditCard className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading accounts...</span>
      </div>
    );
  }

  if (error || accounts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
        <span className="text-sm text-red-600">
          {error || 'No accounts found'}
        </span>
        <button
          onClick={fetchAccounts}
          className="ml-2 text-red-600 hover:text-red-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Building2 className="w-4 h-4 text-gray-600" />
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">
            {selectedAccount ? selectedAccount.name : 'All Accounts'}
          </div>
          {selectedAccount && (
            <div className="text-xs text-gray-500">
              {selectedAccount.institution} • ****{selectedAccount.accountNo.slice(-4)}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {/* All Accounts Option */}
              <button
                onClick={() => {
                  onAccountSelect(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                  !selectedAccountId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium">All Accounts</div>
                      <div className="text-xs text-gray-500">Combined view</div>
                    </div>
                  </div>
                  {!selectedAccountId && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              </button>

              <div className="my-2 border-t border-gray-200" />

              {/* Individual Accounts */}
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    onAccountSelect(account.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    selectedAccountId === account.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium">{account.name}</div>
                        <div className="text-xs text-gray-500">
                          {account.institution} • ****{account.accountNo.slice(-4)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Balance: {formatCurrency(account.balance)}
                        </div>
                      </div>
                    </div>
                    {selectedAccountId === account.id && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
