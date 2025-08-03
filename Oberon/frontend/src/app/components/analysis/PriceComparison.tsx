// app/components/analysis/PriceComparison.tsx
'use client';
import { useState } from 'react';
import { ShoppingCart, Search, TrendingDown, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface ComparisonResult {
  transaction: {
    description: string;
    amount: number;
    date: string;
    id: string;
  };
  product: {
    name: string;
    price: number;
    rating: number;
    link: string;
  };
  potential_savings: number;
  savings_percentage: number;
}

interface PriceComparisonProps {
  userId: string;
  selectedAccountId?: string | null;
}

export default function PriceComparison({ userId, selectedAccountId }: PriceComparisonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showTransactionSelector, setShowTransactionSelector] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/recentPayments/${userId}?limit=20${
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
        setRecentTransactions(data.transactions || []);
        setShowTransactionSelector(true);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const runPriceComparison = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/priceComparison/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_ids: selectedTransactions,
            account_id: selectedAccountId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to run price comparison');
      }

      const data = await response.json();
      setResults(data.results || []);
      setShowTransactionSelector(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze prices');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalSavings = results.reduce((sum, r) => sum + r.potential_savings, 0);
  const totalOriginal = results.reduce((sum, r) => sum + r.transaction.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-purple-600" />
              Smart Price Comparison
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Find cheaper alternatives for your recent purchases
            </p>
          </div>
          {!showTransactionSelector && !isAnalyzing && (
            <button
              onClick={fetchRecentTransactions}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Analyze Purchases
            </button>
          )}
        </div>

        {/* How it works */}
        {!showTransactionSelector && results.length === 0 && (
          <div className="bg-purple-50 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-purple-900 mb-2">How it works:</h3>
            <ol className="space-y-2 text-sm text-purple-800">
              <li>1. Select recent purchases you want to check</li>
              <li>2. Our AI searches for similar products at better prices</li>
              <li>3. See how much you could save on future purchases</li>
              <li>4. Get direct links to cheaper alternatives</li>
            </ol>
          </div>
        )}
      </div>

      {/* Transaction Selector */}
      {showTransactionSelector && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select purchases to analyze:
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentTransactions.map((tx) => (
              <label
                key={tx.id}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTransactions.includes(tx.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTransactions([...selectedTransactions, tx.id]);
                    } else {
                      setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id));
                    }
                  }}
                  className="mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{tx.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.date).toLocaleDateString()} • {formatCurrency(tx.amount)}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={runPriceComparison}
              disabled={selectedTransactions.length === 0 || isAnalyzing}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching for deals...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Better Prices ({selectedTransactions.length})
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowTransactionSelector(false);
                setSelectedTransactions([]);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Searching for better prices...</p>
          <p className="text-sm text-gray-600 mt-2">This may take a minute</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Savings Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-purple-200 text-sm">Original Spending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOriginal)}</p>
              </div>
              <div>
                <p className="text-purple-200 text-sm">Potential Savings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
              </div>
              <div>
                <p className="text-purple-200 text-sm">Savings Percentage</p>
                <p className="text-2xl font-bold">
                  {totalOriginal > 0 ? ((totalSavings / totalOriginal) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Individual Results */}
          <div className="space-y-4">
            {results.sort((a, b) => b.potential_savings - a.potential_savings).map((result, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Original Purchase */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Your Purchase</h4>
                    <p className="text-lg font-medium">{result.transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(result.transaction.date).toLocaleDateString()}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-2">
                      {formatCurrency(result.transaction.amount)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <TrendingDown className="w-8 h-8 text-green-600" />
                  </div>

                  {/* Cheaper Alternative */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Better Deal Found!</h4>
                    <p className="text-lg font-medium">{result.product.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Rating: {result.product.rating}/5</span>
                      <span>⭐</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      {formatCurrency(result.product.price)}
                    </p>
                  </div>
                </div>

                {/* Savings Badge & Link */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <span className="font-semibold">
                      Save {formatCurrency(result.potential_savings)} ({result.savings_percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <a
                    href={result.product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View Product
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Smart Shopping Tips
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Check product specifications to ensure they match your needs</li>
              <li>• Consider shipping costs and delivery times</li>
              <li>• Read reviews before purchasing from new sellers</li>
              <li>• Some alternatives may be bulk purchases - check minimum quantities</li>
            </ul>
          </div>
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
