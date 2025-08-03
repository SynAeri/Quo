// app/components/analysis/TrendAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface TrendAnalysisProps {
  userId: string;
  selectedAccountId?: string | null;
}

interface TrendData {
  trends: Array<{
    month: string;
    total: number;
    categories: Record<string, number>;
  }>;
  insights: {
    trend: string;
    average_monthly: number;
    next_month_prediction: number;
    volatility: number;
    volatility_rating: string;
    change_rate: number;
    months_analyzed: number;
  };
  patterns: Array<{
    type: string;
    description: string;
  }>;
  top_categories: Array<[string, number]>;
}

export default function TrendAnalysis({ userId, selectedAccountId }: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthsToShow, setMonthsToShow] = useState(6);

  useEffect(() => {
    fetchTrendData();
  }, [userId, selectedAccountId, monthsToShow]);

  const fetchTrendData = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/trends/${userId}?months=${monthsToShow}${
          selectedAccountId ? `&account_id=${selectedAccountId}` : ''
        }`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTrendData(data);
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!trendData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Period Selector */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Spending Trends & Predictions</h2>
          <select
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Trend Direction</span>
              {trendData.insights.trend === 'increasing' ? (
                <TrendingUp className="w-5 h-5 text-red-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-xl font-semibold">
              {trendData.insights.trend === 'increasing' ? 'Increasing' : 'Decreasing'}
            </p>
            <p className="text-sm text-gray-500">
              {Math.abs(trendData.insights.change_rate).toFixed(0)}% per month
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Next Month Forecast</span>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xl font-semibold">
              {formatCurrency(trendData.insights.next_month_prediction)}
            </p>
            <p className="text-sm text-gray-500">
              Based on {trendData.insights.months_analyzed} months
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Volatility</span>
              <div className={`w-3 h-3 rounded-full ${
                trendData.insights.volatility_rating === 'high' ? 'bg-red-500' :
                trendData.insights.volatility_rating === 'moderate' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
            <p className="text-xl font-semibold capitalize">
              {trendData.insights.volatility_rating}
            </p>
            <p className="text-sm text-gray-500">
              ±{formatCurrency(trendData.insights.volatility)}
            </p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            <div className="h-full flex items-end space-x-2">
              {trendData.trends.map((month, index) => {
                const maxAmount = Math.max(...trendData.trends.map(t => t.total));
                const height = (month.total / maxAmount) * 100;
                const previousMonth = index > 0 ? trendData.trends[index - 1].total : month.total;
                const change = ((month.total - previousMonth) / previousMonth) * 100;
                
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full">
                      {index > 0 && (
                        <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
                          change > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {change > 0 ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                          {Math.abs(change).toFixed(0)}%
                        </div>
                      )}
                      <div 
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                        style={{ height: `${height}%`, minHeight: '20px' }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {formatCurrency(month.total)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">
                      {new Date(month.month + '-01').toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Patterns */}
        {trendData.patterns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Detected Patterns</h3>
            <div className="space-y-2">
              {trendData.patterns.map((pattern, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {pattern.type.replace(/_/g, ' ').charAt(0).toUpperCase() + pattern.type.slice(1).replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-blue-700">{pattern.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Trends */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Categories Over Time</h3>
        <div className="space-y-3">
          {trendData.top_categories.slice(0, 5).map(([category, total], index) => (
            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <span className="font-medium">{category}</span>
              </div>
              <span className="font-semibold">{formatCurrency(total / trendData.insights.months_analyzed)}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
