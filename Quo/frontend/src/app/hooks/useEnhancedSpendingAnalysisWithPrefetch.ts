// app/hooks/useEnhancedSpendingAnalysisWithPrefetch.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from '../contexts/accountContext';

// ... (same interfaces as before)

// Background prefetch queue
const PREFETCH_QUEUE = new Set<string>();
let prefetchTimer: NodeJS.Timeout | null = null;

export function useEnhancedSpendingAnalysis(
  userId: string | undefined, 
  period: string = 'month',
  accountId?: string | null,
  options?: {
    prefetchAccounts?: boolean; // Enable smart prefetching
    prefetchDelay?: number; // Delay before prefetching (ms)
  }
) {
  const { selectedAccountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId !== undefined ? accountId : contextAccountId;
  
  const [data, setData] = useState<EnhancedSpendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track available accounts for prefetching
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  
  const prefetchDelay = options?.prefetchDelay ?? 2000; // Default 2 seconds
  const shouldPrefetch = options?.prefetchAccounts ?? true;

  // ... (same cache functions as before)

  // Fetch account list for prefetching
  const fetchAvailableAccounts = useCallback(async () => {
    if (!userId || !shouldPrefetch) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const accountIds = data.accounts?.map((acc: any) => acc.id) || [];
        setAvailableAccounts(accountIds);
        
        // Schedule prefetch for other accounts
        if (accountIds.length > 0) {
          schedulePrefetch(accountIds, effectiveAccountId);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts for prefetch:', error);
    }
  }, [userId, shouldPrefetch, effectiveAccountId]);

  // Smart prefetch scheduler
  const schedulePrefetch = useCallback((accountIds: string[], currentAccountId: string | null) => {
    if (!shouldPrefetch) return;
    
    // Clear existing timer
    if (prefetchTimer) {
      clearTimeout(prefetchTimer);
    }
    
    // Schedule prefetch after delay
    prefetchTimer = setTimeout(() => {
      // Prefetch other accounts in background
      accountIds.forEach(accId => {
        if (accId !== currentAccountId && !PREFETCH_QUEUE.has(accId)) {
          PREFETCH_QUEUE.add(accId);
          prefetchAccountData(accId);
        }
      });
      
      // Also prefetch "all accounts" view
      if (currentAccountId !== null && !PREFETCH_QUEUE.has('all')) {
        PREFETCH_QUEUE.add('all');
        prefetchAccountData(null);
      }
    }, prefetchDelay);
  }, [shouldPrefetch, prefetchDelay]);

  // Background prefetch function
  const prefetchAccountData = useCallback(async (accountIdToPrefetch: string | null) => {
    const cacheKey = `spending_${userId}_${period}_${accountIdToPrefetch || 'all'}`;
    
    // Check if already cached
    if (MEMORY_CACHE.has(cacheKey)) {
      PREFETCH_QUEUE.delete(accountIdToPrefetch || 'all');
      return;
    }
    
    try {
      console.log(`Prefetching data for account: ${accountIdToPrefetch || 'all'}`);
      
      const params = new URLSearchParams({
        period: period,
        group_categories: 'true'
      });
      
      if (accountIdToPrefetch) {
        params.append('account_id', accountIdToPrefetch);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/groupedSpendingByPeriod/${userId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        
        // Cache the prefetched data
        const cacheEntry: CacheEntry = {
          data: responseData,
          timestamp: Date.now()
        };
        MEMORY_CACHE.set(cacheKey, cacheEntry);
        
        console.log(`Prefetched and cached data for: ${cacheKey}`);
      }
    } catch (error) {
      console.error(`Error prefetching account ${accountIdToPrefetch}:`, error);
    } finally {
      PREFETCH_QUEUE.delete(accountIdToPrefetch || 'all');
    }
  }, [userId, period]);

  // Initialize: fetch current data and start prefetching
  useEffect(() => {
    if (userId) {
      fetchAvailableAccounts();
    }
  }, [userId, fetchAvailableAccounts]);

  // ... (rest of the hook implementation remains the same)

  // Add prefetch status to return
  return { 
    data, 
    isLoading, 
    isRefreshing,
    error, 
    refetch,
    clearCache: clearUserCache,
    prefetchStatus: {
      availableAccounts,
      prefetchQueue: Array.from(PREFETCH_QUEUE),
      hasCachedData: (accountId: string | null) => {
        const cacheKey = `spending_${userId}_${period}_${accountId || 'all'}`;
        return MEMORY_CACHE.has(cacheKey);
      }
    }
  };
}
