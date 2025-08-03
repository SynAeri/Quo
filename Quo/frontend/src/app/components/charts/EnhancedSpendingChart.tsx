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
      error,
      viewMode
    });
    
    if (data?.grouped_categories) {
      console.log('Grouped categories structure:', data.grouped_categories);
      console.log('Grouped categories type:', typeof data.grouped_categories);
      console.log('Is array?', Array.isArray(data.grouped_categories));
      console.log('Length:', Array.isArray(data.grouped_categories) ? data.grouped_categories.length : 'N/A');
    }
  }, [userId, selectedAccountId, selectedPeriod, data, isLoading, error, viewMode]);

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

  // Check if we have grouped data
  const hasGroupedData = data?.grouped_categories && 
                        Array.isArray(data.grouped_categories) && 
                        data.grouped_categories.length > 0;

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
                <span>Period Total</span>
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
                {hasGroupedData 
                  ? `Grouped into ${data.grouped_categories.length} categories`
                  : data.enhanced_categories && Object.keys(data.enhanced_categories).length > 0
                  ? `${Object.keys(data.enhanced_categories).length} with details`
                  : 'No grouping available'}
              </p>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('Switching to grouped view');
              setViewMode('grouped');
            }}
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
            onClick={() => {
              console.log('Switching to all categories view');
              setViewMode('all');
            }}
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
            {viewMode === 'grouped' && hasGroupedData
              ? `${data.grouped_categories.length} groups • ${data.categories?.length || 0} categories`
              : `${data?.categories?.length || 0} categories`}
          </span>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {viewMode === 'grouped' && hasGroupedData ? 'Grouped Categories' : 'All Spending Categories'}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : data ? (
          viewMode === 'grouped' && hasGroupedData ? (
            <GroupedSpendingChart
              groupedData={data.grouped_categories}
              total={data.total}
              insights={data.insights}
            />
          ) : (
            <FilterableSpendingChart
              data={data.categories || []}
              enhancedCategories={data.enhanced_categories || {}}
              total={data.total || 0}
            />
          )
        ) : (
          <p className="text-gray-500 text-center py-8">No spending data available</p>
        )}
      </div>

      {/* Insights Section */}
      {data?.insights && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.insights.category_insights && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Category Analysis</h4>
                <div className="space-y-2">
                  {data.insights.category_insights.largest_super_category && (
                    <p className="text-sm text-blue-800">
                      <strong>Largest category:</strong> {data.insights.category_insights.largest_super_category.name} ({formatCurrency(data.insights.category_insights.largest_super_category.amount)})
                    </p>
                  )}
                  {data.insights.category_insights.most_diverse_category && (
                    <p className="text-sm text-blue-800">
                      <strong>Most diverse:</strong> {data.insights.category_insights.most_diverse_category.name} ({data.insights.category_insights.most_diverse_category.num_subcategories} subcategories)
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {data.insights.has_uncategorized && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2">Uncategorized Spending</h4>
                <p className="text-sm text-amber-800">
                  Some transactions couldn't be automatically categorized. Review these for better insights.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <p>Debug Info:</p>
          <p>Account: {selectedAccountId || 'All'}</p>
          <p>Period: {selectedPeriod}</p>
          <p>View Mode: {viewMode}</p>
          <p>Data loaded: {data ? 'Yes' : 'No'}</p>
          {data && (
            <>
              <p>Categories: {data.categories?.length || 0}</p>
              <p>Has grouped data: {hasGroupedData ? 'Yes' : 'No'}</p>
              {hasGroupedData && (
                <p>Groups: {data.grouped_categories.length}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
