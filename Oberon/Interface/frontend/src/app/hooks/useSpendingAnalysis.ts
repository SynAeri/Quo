// app/hooks/useEnhancedSpendingAnalysis.ts
import { useState, useEffect, useCallback } from 'react';

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

interface EnhancedSpendingData {
  categories: SpendingCategory[];
  enhanced_categories: Record<string, EnhancedCategory>;
  total: number;
  period?: string;
  period_label?: string;
  average_monthly?: number;
  num_transactions?: number;
  monthly_breakdown?: Record<string, number>;
  insights?: {
    unknown_ratio: number;
    categories_with_subcategories: string[];
    highest_month?: string;
    lowest_month?: string;
    num_months?: number;
  };
  message?: string;
}

interface CacheEntry {
  data: EnhancedSpendingData;
  timestamp: number;
}

// Cache configuration
const CACHE_PREFIX = 'spending_analysis_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MEMORY_CACHE = new Map<string, CacheEntry>();

export function useEnhancedSpendingAnalysis(userId: string | undefined, period: string = 'month') {
  const [data, setData] = useState<EnhancedSpendingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate cache key
  const getCacheKey = useCallback(() => {
    return `${CACHE_PREFIX}${userId}_${period}`;
  }, [userId, period]);

  // Check if cache is valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Get from cache (memory first, then sessionStorage)
  const getFromCache = useCallback((): CacheEntry | null => {
    const cacheKey = getCacheKey();
    
    // Check memory cache first
    const memoryCache = MEMORY_CACHE.get(cacheKey);
    if (memoryCache && isCacheValid(memoryCache.timestamp)) {
      return memoryCache;
    }
    
    // Check sessionStorage
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed: CacheEntry = JSON.parse(stored);
        if (isCacheValid(parsed.timestamp)) {
          // Also update memory cache
          MEMORY_CACHE.set(cacheKey, parsed);
          return parsed;
        } else {
          // Clean up expired cache
          sessionStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.error('Error reading from cache:', e);
    }
    
    return null;
  }, [getCacheKey]);

  // Save to cache (both memory and sessionStorage)
  const saveToCache = useCallback((data: EnhancedSpendingData) => {
    const cacheKey = getCacheKey();
    const cacheEntry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    // Save to memory cache
    MEMORY_CACHE.set(cacheKey, cacheEntry);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (e) {
      console.error('Error saving to cache:', e);
      // If quota exceeded, clear old entries
      clearOldCacheEntries();
    }
  }, [getCacheKey]);

  // Clear old cache entries if storage is full
  const clearOldCacheEntries = () => {
    const keys = Object.keys(sessionStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    // Sort by timestamp and remove oldest half
    const entries = cacheKeys.map(key => {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}') as CacheEntry;
        return { key, timestamp: data.timestamp || 0 };
      } catch {
        return { key, timestamp: 0 };
      }
    });
    
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.floor(entries.length / 2);
    
    for (let i = 0; i < toRemove; i++) {
      sessionStorage.removeItem(entries[i].key);
    }
  };

  // Clear all cache for a user (useful after new transactions)
  const clearUserCache = useCallback(() => {
    if (!userId) return;
    
    // Clear memory cache
    const keysToDelete: string[] = [];
    MEMORY_CACHE.forEach((_, key) => {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => MEMORY_CACHE.delete(key));
    
    // Clear sessionStorage
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(userId)) {
        sessionStorage.removeItem(key);
      }
    });
  }, [userId]);

  const fetchSpendingData = async (forceRefresh = false) => {
    if (!userId) return;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        setData(cached.data);
        setError(null);
        return;
      }
    }

    setIsLoading(!data); // Only show loading if no cached data
    setIsRefreshing(forceRefresh);
    setError(null);

    try {
      // Use the grouped endpoint for all periods
      const endpoint = `/api/analysis/groupedSpendingByPeriod/${userId}?period=${period}&group_categories=true`;
        
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to fetch spending data');
      }

      const spendingData = await response.json();
      
      console.log('API Response for period:', period, spendingData);
      
      // Check if there's a message indicating no data
      if (spendingData.message && (!spendingData.categories || spendingData.categories.length === 0)) {
        setError(spendingData.message);
      } else if (!spendingData.categories) {
        // Handle case where categories is missing
        console.error('Invalid response structure:', spendingData);
        setError('Invalid data format received from server');
      } else {
        // Save to cache on successful fetch
        saveToCache(spendingData);
      }
      
      setData(spendingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching enhanced spending data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchSpendingData();
    }
  }, [userId, period]);

  // Prefetch other periods in the background
  useEffect(() => {
    if (!userId || !data) return;
    
    // Prefetch other periods after a delay
    const prefetchTimer = setTimeout(() => {
      const periods = ['month', 'year', 'all'];
      periods.forEach(p => {
        if (p !== period) {
          // Check if already cached
          const cacheKey = `${CACHE_PREFIX}${userId}_${p}`;
          const cached = MEMORY_CACHE.get(cacheKey) || 
                       (sessionStorage.getItem(cacheKey) ? JSON.parse(sessionStorage.getItem(cacheKey)!) : null);
          
          if (!cached || !isCacheValid(cached.timestamp)) {
            // Prefetch in background
            const prefetchEndpoint = `/api/analysis/groupedSpendingByPeriod/${userId}?period=${p}&group_categories=true`;
              
            fetch(`${process.env.NEXT_PUBLIC_API_URL}${prefetchEndpoint}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              },
            })
            .then(res => res.json())
            .then(prefetchedData => {
              const prefetchEntry: CacheEntry = {
                data: prefetchedData,
                timestamp: Date.now()
              };
              MEMORY_CACHE.set(cacheKey, prefetchEntry);
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(prefetchEntry));
              } catch (e) {
                console.error('Error caching prefetched data:', e);
              }
            })
            .catch(err => console.error('Prefetch error:', err));
          }
        }
      });
    }, 2000); // Wait 2 seconds before prefetching
    
    return () => clearTimeout(prefetchTimer);
  }, [userId, period, data]);

  return { 
    data, 
    isLoading, 
    isRefreshing,
    error, 
    refetch: () => fetchSpendingData(true),
    clearCache: clearUserCache 
  };
}
