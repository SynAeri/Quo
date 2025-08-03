// app/components/analysis/EnhancedSpendingAnalysis.tsx
'use client';
import { useState, useEffect } from 'react';
import { useEnhancedSpendingAnalysis } from '../../hooks/useEnhancedSpendingAnalysis';
import FilterableSpendingChart from '../charts/FilterableSpendingChart';
import GroupedSpendingChart from '../charts/GroupedSpendingChart';
import { AlertCircle, TrendingUp, Calendar, DollarSign, Loader2 } from 'lucide-react';

interface EnhancedSpendingAnalysisProps {
  userId: string;
  selectedAccountId?: string | null;
}

export default function EnhancedSpendingAnalysis({ userId, selectedAccountId }: EnhancedSpendingAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped');
  
  // Pass selectedAccountId to the hook
  const { data, isLoading, isRefreshing, error, refetch } = useEnhancedSpendingAnalysis(
    userId, 
    selectedPeriod,
    selectedAccountId
  );

  // Debug logging
  useEffect(() => {
    console.log('EnhancedSpendingAnalysis rendered with:', {
      userId,
      selectedAccountId,
      selectedPeriod,
      dataAvailable: !!data,
      isLoading,
      error
    });
    
    if (data?.grouped_categories) {
      console.log('Grouped categories structure:', data.grouped_categories);
      console.log('Grouped categories type:', typeof data.grouped_categories);
      console.log('Is array?', Array.isArray(data.grouped_categories));
      console.log('Keys:', Object.keys(data.grouped_categories));
    }
  }, [userId, selectedAccountId, selectedPeriod, data, isLoading, error]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPeriodLabel = () => {
    if (data?.period_label) return data.period_label;
    
    const now = new Date();
    switch (selectedPeriod) {
      case 'month':
        return now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
      case 'year':
        return now.getFullYear().toString();
      case 'all':
        return 'All Time';
    }
  };
  const hasGroupedData = data?.grouped_categories && 
                        Array.isArray(data.grouped_categories) && 
                        data.grouped_categories.length > 0;




  // Force initial load if no data
  useEffect(() => {
    if (!data && !isLoading && !error) {
      console.log('No data on mount, triggering initial fetch');
      refetch();
    }
  }, [])

  // Debug logging for grouped data
  useEffect(() => {
    if (data) {
      console.log('Data received in component:', {
        hasData: !!data,
        categoriesCount: data.categories?.length || 0,
        groupedCategoriesType: typeof data.grouped_categories,
        groupedCategoriesIsArray: Array.isArray(data.grouped_categories),
        groupedCategoriesLength: Array.isArray(data.grouped_categories) ? data.grouped_categories.length : 'N/A',
        hasGroupedData
      });
    }


  }, [data, hasGroupedData]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Account Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Spending Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedAccountId ? `Account: ${data?.account_name || selectedAccountId.slice(0, 8) + '...'}` : 'All Accounts'} • {getPeriodLabel()}
            </p>
            {selectedAccountId && data?.message && (
              <p className="text-xs text-amber-600 mt-1">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                {data.message}
              </p>
            )}
          </div>
          {isRefreshing && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Refreshing...</span>
            </div>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['month', 'year', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => {
                console.log(`Switching period to: ${period}`);
                setSelectedPeriod(period);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period === 'month' ? 'This Month' : 
               period === 'year' ? 'This Year' : 
               'All Time'}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        {data && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Monthly Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.total || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.num_transactions || 0} transactions
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Monthly Average</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.average_monthly || data.total || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Based on {data.insights?.num_months || 1} months
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Categories</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.categories?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.enhanced_categories && Object.keys(data.enhanced_categories).length > 0
                  ? `${Object.keys(data.enhanced_categories).length} with details`
                  : data.grouped_categories && Object.keys(data.grouped_categories || {}).length > 0
                  ? `${Object.keys(data.grouped_categories).length} groups`
                  : 'No enhanced categories'}
              </p>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Grouped View
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            All Categories
          </button>
          <span className="ml-auto text-sm text-gray-600 self-center">
            {viewMode === 'grouped' && data?.grouped_categories 
              ? `${Object.keys(data.grouped_categories).length} groups • ${data.categories?.length || 0} categories`
              : `${data?.categories?.length || 0} categories`}
          </span>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {viewMode === 'grouped' && hasGroupedData ? 'Grouped Categories' : 'All Spending Categories'}
        </h3>
        
        {/* Debug info - temporary */}
        {data && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p>Debug: View Mode = {viewMode}</p>
            <p>Has grouped data = {hasGroupedData ? 'YES' : 'NO'}</p>
            <p>Grouped categories = {data.grouped_categories ? `Array(${data.grouped_categories.length})` : 'undefined'}</p>
            <p>Should show grouped chart = {viewMode === 'grouped' && hasGroupedData ? 'YES' : 'NO'}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data ? (
          viewMode === 'grouped' && hasGroupedData ? (
            <>
              <p className="text-sm text-gray-600 mb-2">Showing GroupedSpendingChart</p>
              <GroupedSpendingChart
                groupedData={data.grouped_categories}
                total={data.total}
                insights={data.insights}
              />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">Showing FilterableSpendingChart</p>
              <FilterableSpendingChart
                data={data.categories || []}
                enhancedCategories={data.enhanced_categories || {}}
                total={data.total || 0}
              />
            </>
          )
        ) : (
          <p className="text-gray-500 text-center py-8">No spending data available</p>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
        <p>Debug Info:</p>
        <p>Account: {selectedAccountId || 'All'}</p>
        <p>Period: {selectedPeriod}</p>
        <p>Cache Key: {`spending_analysis_${userId}_${selectedPeriod}_${selectedAccountId || 'all'}`}</p>
        <p>Data loaded: {data ? 'Yes' : 'No'}</p>
        {data?.grouped_categories && (
          <p>Grouped categories type: {typeof data.grouped_categories} | Keys: {Object.keys(data.grouped_categories).length}</p>
        )}
      </div>
    </div>
  );
}
