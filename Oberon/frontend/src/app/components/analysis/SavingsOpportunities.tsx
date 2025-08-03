// app/components/analysis/SavingsOpportunities.tsx
import React, { useState, useEffect } from 'react';
import { PiggyBank, Coffee, CreditCard, ShoppingCart, Lightbulb, Target, DollarSign } from 'lucide-react';

interface SavingsOpportunitiesProps {
  userId: string;
  selectedAccountId?: string | null;
}

interface Opportunity {
  type: string;
  category: string;
  description: string;
  suggestion: string;
  savings_potential: number;
  difficulty: string;
}

interface Subscription {
  name: string;
  amount: number;
  frequency: string;
  category: string;
  last_charged: string;
  next_expected: string;
}

export default function SavingsOpportunities({ userId, selectedAccountId }: SavingsOpportunitiesProps) {
  const [savingsData, setSavingsData] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'subscriptions'>('opportunities');

  useEffect(() => {
    fetchSavingsData();
  }, [userId, selectedAccountId]);

  const fetchSavingsData = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/savings-opportunities/${userId}${
          selectedAccountId ? `?account_id=${selectedAccountId}` : ''
        }`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSavingsData(data);
        
        // Extract subscriptions from opportunities
        const subs = data.opportunities
          .filter((opp: Opportunity) => opp.type === 'subscription')
          .map((opp: Opportunity) => {
            const match = opp.description.match(/(.+) - \$(\d+\.?\d*)/);
            return {
              name: match ? match[1] : opp.description,
              amount: match ? parseFloat(match[2]) : opp.savings_potential,
              frequency: 'monthly',
              category: opp.category,
              last_charged: 'Recently',
              next_expected: 'Next month'
            };
          });
        setSubscriptions(subs);
      }
    } catch (error) {
      console.error('Error fetching savings data:', error);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'high_frequency': return <Coffee className="w-5 h-5" />;
      case 'subscription': return <CreditCard className="w-5 h-5" />;
      case 'category_overspending': return <ShoppingCart className="w-5 h-5" />;
      case 'behavioral': return <Lightbulb className="w-5 h-5" />;
      default: return <PiggyBank className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!savingsData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600">No savings data available</p>
      </div>
    );
  }

  const nonSubscriptionOpportunities = savingsData.opportunities.filter(
    (opp: Opportunity) => opp.type !== 'subscription'
  );

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Savings Opportunities</h2>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-bold">{formatCurrency(savingsData.total_savings_potential)}</p>
          <p className="text-green-100 pb-1">per month potential savings</p>
        </div>
        <p className="text-green-100 mt-2">
          That's {formatCurrency(savingsData.total_savings_potential * 12)} per year!
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'opportunities'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Quick Wins ({nonSubscriptionOpportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'subscriptions'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
        </div>
      </div>

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nonSubscriptionOpportunities.map((opp: Opportunity, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {getTypeIcon(opp.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{opp.category}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(opp.difficulty)}`}>
                      {opp.difficulty} to implement
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(opp.savings_potential)}
                  </p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{opp.description}</p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Action:</strong> {opp.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {subscriptions.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Detected Subscriptions</h3>
                <p className="text-sm text-gray-600">
                  Review these recurring charges and cancel any you don't actively use.
                </p>
              </div>
              
              <div className="space-y-3">
                {subscriptions.map((sub, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{sub.name}</p>
                        <p className="text-sm text-gray-500">{sub.frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(sub.amount)}</p>
                      <button className="text-sm text-red-600 hover:text-red-700">
                        Cancel?
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </>
          ) : (
            <p className="text-gray-600">No recurring subscriptions detected in your recent transactions.</p>
          )}
        </div>
      )}

      {/* Personalized Tips */}
      {savingsData.personalized_tips && savingsData.personalized_tips.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Personalized Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsData.personalized_tips.map((tip: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <Target className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{tip.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
