// app/hooks/useEnhancedSpendingAnalysis.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from '../contexts/accountContext';

interface SpendingCategory {
  name: string;
  amount: number;
}

interface Subcategory {
  name: string;
  amount: number;
  count: number;
}

interface EnhancedCategory {
  total: number;
  count: number;
  subcategories: Subcategory[];
}

interface GroupedCategory {
  name: string;
  total: number;
  percentage: number;
  categories: Array<{ name: string; amount: number }>;
}

interface EnhancedSpendingData {
  categories: SpendingCategory[];
  enhanced_categories: Record<string, EnhancedCategory>;
  grouped_categories?: GroupedCategory[];
  total: number;
  period?: string;
  period_label?: string;
  average_monthly?: number;
  num_transactions?: number;
  account_id?: string;
  account_name?: string;
  transaction_count?: number;
  monthly_breakdown?: Record<string, number>;
  insights?: {
    unknown_ratio?: number;
    categories_with_subcategories?: string[];
    category_insights?: any;
    highest_month?: string;
    lowest_month?: string;
    num_months?: number;
    total_categories?: number;
    total_groups?: number;
    has_uncategorized?: boolean;
  };
  message?: string;
}

interface CacheEntry {
  data: EnhancedSpendingData;
  timestamp: number;
}

interface PrefetchOptions {
  enablePrefetch?: boolean;
  prefetchDelay?: number;
}

// In-memory cache only (no browser storage)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MEMORY_CACHE = new Map<string, CacheEntry>();

// Prefetch management
const PREFETCH_QUEUE = new Set<string>();
const PREFETCH_TIMERS = new Map<string, NodeJS.Timeout>();

export function useEnhancedSpendingAnalysis(
  userId: string | undefined, 
  period: string = 'month',
  accountId?: string | null,
  options: PrefetchOptions = { enablePrefetch: true, prefetchDelay: 2000 }
) {
  // Get account from context if not provided
  const { selectedAccountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId !== undefined ? accountId : contextAccountId;
  
  const [data, setData] = useState<EnhancedSpendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<Array<{id: string, name: string}>>([]);
  
  // Track if this is the initial load
  const isInitialLoadRef = useRef(true);
  
  // Track previous values to detect changes
  const prevAccountIdRef = useRef(effectiveAccountId);
  const prevPeriodRef = useRef(period);
  const prevUserIdRef = useRef(userId);

  // Generate cache key including account ID
  const getCacheKey = useCallback((accId?: string | null, per?: string) => {
    const accountKey = accId !== undefined ? (accId || 'all') : (effectiveAccountId || 'all');
    const periodKey = per || period;
    return `spending_${userId}_${periodKey}_${accountKey}`;
  }, [userId, period, effectiveAccountId]);

  // Check if cache is valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Get from memory cache
  const getFromCache = useCallback((accId?: string | null): CacheEntry | null => {
    const cacheKey = getCacheKey(accId);
    const cached = MEMORY_CACHE.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('Using cached data for:', cacheKey);
      return cached;
    }
    
    // Clean up expired entry
    if (cached) {
      MEMORY_CACHE.delete(cacheKey);
    }
    
    return null;
  }, [getCacheKey]);

  // Save to memory cache
  const saveToCache = useCallback((responseData: EnhancedSpendingData, accId?: string | null) => {
    const cacheKey = getCacheKey(accId);
    const cacheEntry: CacheEntry = {
      data: responseData,
      timestamp: Date.now()
    };
    
    MEMORY_CACHE.set(cacheKey, cacheEntry);
    console.log('Cached data for:', cacheKey);
  }, [getCacheKey]);

  // Clear cache for current user
  const clearUserCache = useCallback(() => {
    if (!userId) return;
    
    console.log('Clearing cache for user:', userId);
    const keysToDelete: string[] = [];
    
    MEMORY_CACHE.forEach((_, key) => {
      if (key.includes(`_${userId}_`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      console.log('Deleting cache key:', key);
      MEMORY_CACHE.delete(key);
    });
    
    // Clear prefetch timers
    PREFETCH_TIMERS.forEach(timer => clearTimeout(timer));
    PREFETCH_TIMERS.clear();
    PREFETCH_QUEUE.clear();
    
    // Also clear current data to force UI update
    setData(null);
  }, [userId]);

  // Fetch available accounts for prefetching
  const fetchAvailableAccounts = useCallback(async () => {
    if (!userId || !options.enablePrefetch) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const accounts = data.accounts || [];
        setAvailableAccounts(accounts);
        
        // Schedule prefetch for accounts
        if (accounts.length > 0 && options.enablePrefetch) {
          schedulePrefetch(accounts);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts for prefetch:', error);
    }
  }, [userId, options.enablePrefetch]);

  // Schedule prefetching of other accounts
  const schedulePrefetch = useCallback((accounts: Array<{id: string, name: string}>) => {
    if (!options.enablePrefetch) return;
    
    // Clear existing timers for this user
    const userTimerPrefix = `${userId}_${period}_`;
    PREFETCH_TIMERS.forEach((timer, key) => {
      if (key.startsWith(userTimerPrefix)) {
        clearTimeout(timer);
        PREFETCH_TIMERS.delete(key);
      }
    });
    
    // Schedule prefetch for each account not currently selected
    accounts.forEach((account, index) => {
      const timerKey = `${userTimerPrefix}${account.id}`;
      
      // Don't prefetch the currently selected account
      if (account.id === effectiveAccountId) return;
      
      // Check if already cached
      if (getFromCache(account.id)) return;
      
      // Stagger prefetch requests to avoid overloading
      const delay = options.prefetchDelay! + (index * 500);
      
      const timer = setTimeout(() => {
        prefetchAccountData(account.id);
        PREFETCH_TIMERS.delete(timerKey);
      }, delay);
      
      PREFETCH_TIMERS.set(timerKey, timer);
    });
    
    // Also prefetch "all accounts" view if not currently selected
    if (effectiveAccountId !== null && !getFromCache(null)) {
      const timerKey = `${userTimerPrefix}all`;
      const timer = setTimeout(() => {
        prefetchAccountData(null);
        PREFETCH_TIMERS.delete(timerKey);
      }, options.prefetchDelay!);
      
      PREFETCH_TIMERS.set(timerKey, timer);
    }
  }, [userId, period, effectiveAccountId, options.enablePrefetch, options.prefetchDelay, getFromCache]);

  // Prefetch data for a specific account
  const prefetchAccountData = useCallback(async (accountIdToPrefetch: string | null) => {
    const cacheKey = getCacheKey(accountIdToPrefetch);
    
    // Skip if already in queue or cached
    if (PREFETCH_QUEUE.has(cacheKey) || getFromCache(accountIdToPrefetch)) {
      return;
    }
    
    PREFETCH_QUEUE.add(cacheKey);
    console.log(`🔄 Prefetching data for account: ${accountIdToPrefetch || 'all'}`);
    
    try {
      const params = new URLSearchParams({
        period: period,
        group_categories: 'true'
      });
      
      if (accountIdToPrefetch) {
        params.append('account_id', accountIdToPrefetch);
      }

      const endpoint = `/api/analysis/groupedSpendingByPeriod/${userId}?${params}`;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        saveToCache(responseData, accountIdToPrefetch);
        console.log(`✅ Prefetched account: ${accountIdToPrefetch || 'all'}`);
      }
    } catch (error) {
      console.error(`❌ Error prefetching account ${accountIdToPrefetch}:`, error);
    } finally {
      PREFETCH_QUEUE.delete(cacheKey);
    }
  }, [userId, period, getCacheKey, getFromCache, saveToCache]);

  const fetchSpendingData = useCallback(async (forceRefresh = false, skipCache = false) => {
    if (!userId) {
      console.log('No userId, skipping fetch');
      setIsLoading(false);
      return;
    }

    // Check cache first (unless force refresh or skip cache)
    if (!forceRefresh && !skipCache && !isRefreshing) {
      const cached = getFromCache();
      if (cached) {
        setData(cached.data);
        setError(null);
        setIsLoading(false);
        
        // Still trigger prefetch for other accounts
        if (options.enablePrefetch && availableAccounts.length === 0) {
          fetchAvailableAccounts();
        }
        return;
      }
    }

    console.log('Fetching spending data:', { userId, period, accountId: effectiveAccountId, forceRefresh, skipCache });
    
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Build the request URL
      const params = new URLSearchParams({
        period: period,
        group_categories: 'true'
      });
      
      if (effectiveAccountId) {
        params.append('account_id', effectiveAccountId);
      }

      const endpoint = `/api/analysis/groupedSpendingByPeriod/${userId}?${params}`;
      
      console.log('Fetching from:', endpoint);
      
      // Get auth token - handle if it doesn't exist
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!authToken) {
        throw new Error('No authentication token found');
      }
        
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `HTTP ${response.status}: Failed to fetch spending data`);
      }

      const responseData = await response.json();
      
      console.log('API Response:', {
        categories: responseData.categories?.length || 0,
        grouped_categories: Array.isArray(responseData.grouped_categories) ? responseData.grouped_categories.length : 0,
        total: responseData.total,
        account: responseData.account_name || effectiveAccountId || 'all'
      });
      
      // Validate response
      if (!responseData.categories || !Array.isArray(responseData.categories)) {
        console.error('Invalid response - categories missing or not an array:', responseData);
        throw new Error('Invalid data format received from server');
      }
      
      // Save to cache on successful fetch
      saveToCache(responseData);
      setData(responseData);
      
      // Trigger prefetch for other accounts after successful load
      if (options.enablePrefetch && availableAccounts.length === 0) {
        fetchAvailableAccounts();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching spending data:', err);
      setError(errorMessage);
      
      // Clear data on error
      setData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, period, effectiveAccountId, getFromCache, saveToCache, options.enablePrefetch, fetchAvailableAccounts, availableAccounts.length]);

  // Initial load effect
  useEffect(() => {
    if (isInitialLoadRef.current && userId) {
      console.log('Initial load - fetching data immediately');
      isInitialLoadRef.current = false;
      // Skip cache on initial load to ensure fresh data
      fetchSpendingData(false, true);
    }
  }, [userId, fetchSpendingData]);

  // Handle changes in userId, period, or accountId
  useEffect(() => {
    // Skip if this is the initial load (handled above)
    if (isInitialLoadRef.current) return;
    
    const userChanged = prevUserIdRef.current !== userId;
    const periodChanged = prevPeriodRef.current !== period;
    const accountChanged = prevAccountIdRef.current !== effectiveAccountId;
    
    if (userChanged || accountChanged || periodChanged) {
      console.log('Dependencies changed:', {
        userChanged,
        periodChanged,
        accountChanged,
        newValues: { userId, period, accountId: effectiveAccountId }
      });
      
      // Update refs
      prevUserIdRef.current = userId;
      prevPeriodRef.current = period;
      prevAccountIdRef.current = effectiveAccountId;
      
      if (userChanged || accountChanged) {
        // Check cache first for account changes
        const cached = getFromCache();
        if (cached && !userChanged) {
          // Use cached data immediately
          setData(cached.data);
          setError(null);
          setIsLoading(false);
          console.log('Used cached data for account switch');
          
          // Re-schedule prefetch for other accounts
          if (options.enablePrefetch && availableAccounts.length > 0) {
            schedulePrefetch(availableAccounts);
          }
        } else {
          // Clear old data and fetch new
          setData(null);
          setIsLoading(true);
          
          if (userChanged) {
            clearUserCache();
          }
          fetchSpendingData(true);
        }
      } else if (periodChanged) {
        // For period changes, check cache first
        const cached = getFromCache();
        if (cached) {
          setData(cached.data);
          setIsLoading(false);
        } else {
          setIsLoading(true);
          fetchSpendingData(false);
        }
        
        // Clear and reschedule prefetch for new period
        PREFETCH_TIMERS.forEach(timer => clearTimeout(timer));
        PREFETCH_TIMERS.clear();
        if (options.enablePrefetch && availableAccounts.length > 0) {
          schedulePrefetch(availableAccounts);
        }
      }
    }
  }, [userId, period, effectiveAccountId, fetchSpendingData, clearUserCache, getFromCache, options.enablePrefetch, availableAccounts, schedulePrefetch]);

  // Listen for external account changes
  useEffect(() => {
    const handleAccountChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newAccountId = customEvent.detail?.accountId;
      console.log('External account change event:', newAccountId);
      
      // Check if we have cached data for this account
      const cached = getFromCache(newAccountId);
      if (cached) {
        // Use cached data immediately
        setData(cached.data);
        setError(null);
        setIsLoading(false);
        console.log('Used cached data for external account change');
      } else {
        // Set loading state and fetch
        setIsLoading(true);
        setData(null);
        clearUserCache();
        fetchSpendingData(true);
      }
    };

    window.addEventListener('accountChanged', handleAccountChange);
    window.addEventListener('accountChangedFromDashboard', handleAccountChange);
    
    return () => {
      window.removeEventListener('accountChanged', handleAccountChange);
      window.removeEventListener('accountChangedFromDashboard', handleAccountChange);
    };
  }, [fetchSpendingData, clearUserCache, getFromCache]);

  const refetch = useCallback(() => {
    console.log('Manual refetch triggered');
    const cacheKey = getCacheKey();
    MEMORY_CACHE.delete(cacheKey);
    fetchSpendingData(true);
  }, [getCacheKey, fetchSpendingData]);

  // Check if data is cached for a specific account
  const isAccountCached = useCallback((accountId: string | null) => {
    return !!getFromCache(accountId);
  }, [getFromCache]);

  return { 
    data, 
    isLoading, 
    isRefreshing,
    error, 
    refetch,
    clearCache: clearUserCache,
    // Prefetch status
    prefetchStatus: {
      availableAccounts,
      isCached: isAccountCached,
      prefetchQueue: Array.from(PREFETCH_QUEUE)
    }
  };
}
