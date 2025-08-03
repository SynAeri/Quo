// app/components/sections/DashboardSection.tsx
'use client';
import { useEffect, useState } from 'react';
import Typewriter from 'typewriter-effect';
import ButtonMain from '../ui/ButtonMain';
import BasiqConnectionModal from '../BasiqConnectionWrapper';
import EnhancedSpendingAnalysis from '../analysis/EnhancedSpendingAnalysis';
import TrendAnalysis from '../analysis/trendAnalysis';
import SavingsOpportunities from '../analysis/SavingsOpportunities';
import AccountSelector from '../analysis/accountSelector';
import { useBasiqConnection } from '../../hooks/useBasiqConnection';
import PriceComparison from '../analysis/PriceComparison';
import { 
  TrendingUp, 
  PiggyBank, 
  CreditCard, 
  BarChart3, 
  AlertCircle,
  DollarSign,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';

interface DashboardSectionProps {
  user: any;
  onConnectBank: () => void;
  isBasiqModalOpen: boolean;
  onBasiqModalClose: () => void;
  onBasiqSuccess: (data: any, userId: string) => void;
  selectedAccountId?: string | null;
  onAccountChange?: (accountId: string | null) => void;
}

interface QuickStatsData {
  currentMonthSpending: number;
  lastMonthSpending: number;
  monthlyAverage: number;
  savingsPotential: number;
  activeSubscriptions: number;
  topCategory: { name: string; amount: number };
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  nextMonthPrediction: number;
}

export default function DashboardSection({
  user,
  onConnectBank,
  isBasiqModalOpen,
  onBasiqModalClose,
  onBasiqSuccess,
  selectedAccountId: parentSelectedAccountId,
  onAccountChange: parentOnAccountChange
}: DashboardSectionProps) {
  const { hasConnections, connections, checkConnections } = useBasiqConnection();
  const [activeView, setActiveView] = useState<'overview' | 'spending' | 'trends' | 'savings' | 'comparison' | 'risk'>('overview');
  const [quickStats, setQuickStats] = useState<QuickStatsData | null>(null);
  const [quickStatsLoading, setQuickStatsLoading] = useState(false);
  
  // Local account state if parent doesn't provide it
  const [localSelectedAccountId, setLocalSelectedAccountId] = useState<string | null>(null);
  
  // Use parent's account state if provided, otherwise use local
  const selectedAccountId = parentSelectedAccountId !== undefined ? parentSelectedAccountId : localSelectedAccountId;
  const handleAccountChange = (accountId: string | null) => {
    console.log('Dashboard handling account change:', accountId);
    if (parentOnAccountChange) {
      parentOnAccountChange(accountId);
    } else {
      setLocalSelectedAccountId(accountId);
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkConnections(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && hasConnections) {
      fetchQuickStats();
    }
  }, [user, hasConnections, selectedAccountId]);

  const fetchQuickStats = async () => {
    try {
      setQuickStatsLoading(true);
      
      // Fetch multiple data points in parallel
      const [trendsResponse, spendingResponse, savingsResponse] = await Promise.all([
        // Trends data
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/trends/${user.id}?months=3${
            selectedAccountId ? `&account_id=${selectedAccountId}` : ''
          }`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        ),
        // Current month spending
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/groupedSpendingByPeriod/${user.id}?period=month&group_categories=true${
            selectedAccountId ? `&account_id=${selectedAccountId}` : ''
          }`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        ),
        // Savings opportunities
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/savings-opportunities/${user.id}${
            selectedAccountId ? `?account_id=${selectedAccountId}` : ''
          }`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        )
      ]);
      
      if (trendsResponse.ok && spendingResponse.ok && savingsResponse.ok) {
        const trendsData = await trendsResponse.json();
        const spendingData = await spendingResponse.json();
        const savingsData = await savingsResponse.json();
        
        // Calculate statistics
        const currentMonthSpending = spendingData.total || 0;
        const monthlyAverage = trendsData.insights?.average_monthly || currentMonthSpending;
        const lastMonthSpending = trendsData.trends?.[trendsData.trends.length - 2]?.total || monthlyAverage;
        
        // Calculate trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let changePercentage = 0;
        
        if (lastMonthSpending > 0) {
          changePercentage = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
          if (changePercentage > 5) trend = 'increasing';
          else if (changePercentage < -5) trend = 'decreasing';
        }
        
        // Count active subscriptions from savings data
        const activeSubscriptions = savingsData.opportunities?.filter(
          (opp: any) => opp.type === 'subscription'
        ).length || 0;
        
        // Get top spending category
        const topCategory = spendingData.categories?.reduce((max: any, cat: any) => 
          cat.amount > (max?.amount || 0) ? cat : max
        , null) || { name: 'None', amount: 0 };
        
        setQuickStats({
          currentMonthSpending,
          lastMonthSpending,
          monthlyAverage,
          savingsPotential: savingsData.total_savings_potential || 0,
          activeSubscriptions,
          topCategory,
          trend,
          changePercentage,
          nextMonthPrediction: trendsData.insights?.next_month_prediction || monthlyAverage
        });
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    } finally {
      setQuickStatsLoading(false);
    }
  };

  const refreshQuickStats = () => {
    fetchQuickStats();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Account Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <Typewriter
              options={{
                strings: hasConnections 
                  ? `Welcome back ${user.firstName}! Your financial insights are ready.`
                  : `Welcome back ${user.firstName}! Ready to connect your bank?`,
                autoStart: true,
                delay: 50,
              }}
            />
          </div>
          
          {/* Account Selector */}
          {hasConnections && (
            <AccountSelector
              userId={user.id}
              selectedAccountId={selectedAccountId}
              onAccountSelect={handleAccountChange}
            />
          )}
        </div>

        {/* Connection Status */}
        {hasConnections && connections.length > 0 && (
          <ConnectionStatus 
            connections={connections} 
            selectedAccountId={selectedAccountId}
          />
        )}

        {/* Enhanced Quick Stats Section */}
        {hasConnections && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Financial Overview {selectedAccountId ? '(Account)' : '(All Accounts)'}
              </h3>
              <button
                onClick={refreshQuickStats}
                disabled={quickStatsLoading}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${quickStatsLoading ? 'animate-spin' : ''}`} />
                {quickStatsLoading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <QuickStatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="This Month"
                value={quickStatsLoading ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
                ) : (
                  formatCurrency(quickStats?.currentMonthSpending || 0)
                )}
                trend={quickStats?.trend}
                subtitle={quickStats?.changePercentage !== undefined && !quickStatsLoading
                  ? quickStats?.trend === 'increasing' 
                    ? `↑ ${Math.abs(quickStats.changePercentage).toFixed(1)}% vs last month`
                    : quickStats?.trend === 'decreasing'
                    ? `↓ ${Math.abs(quickStats.changePercentage).toFixed(1)}% vs last month`
                    : 'No significant change'
                  : null
                }
                color="blue"
              />
              
              <QuickStatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Monthly Average"
                value={quickStatsLoading ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
                ) : (
                  formatCurrency(quickStats?.monthlyAverage || 0)
                )}
                subtitle={quickStats?.topCategory && !quickStatsLoading
                  ? `Top: ${quickStats.topCategory.name}`
                  : 'Based on 3 months'
                }
                color="purple"
              />
              
              <QuickStatCard
                icon={<PiggyBank className="w-5 h-5" />}
                label="Savings Potential"
                value={quickStatsLoading ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
                ) : quickStats?.savingsPotential ? (
                  formatCurrency(quickStats.savingsPotential)
                ) : (
                  "Calculate"
                )}
                onClick={() => setActiveView('savings')}
                subtitle={quickStats?.savingsPotential && !quickStatsLoading
                  ? "Per month" 
                  : "View opportunities"
                }
                color="green"
              />
              
              <QuickStatCard
                icon={<CreditCard className="w-5 h-5" />}
                label="Subscriptions"
                value={quickStatsLoading ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
                ) : quickStats?.activeSubscriptions ? (
                  `${quickStats.activeSubscriptions} Active`
                ) : (
                  "Analyze"
                )}
                onClick={() => setActiveView('savings')}
                subtitle="Click to review"
                color="orange"
              />
            </div>

            {/* Error state */}
            {!quickStatsLoading && !quickStats && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-yellow-800">
                  Unable to load quick stats. 
                  <button 
                    onClick={fetchQuickStats}
                    className="ml-2 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </p>
              </div>
            )}
          </>
        )}

        {/* Main CTA or Navigation */}
        {!hasConnections ? (
          <ButtonMain 
            onClick={onConnectBank}
            className="bg-green-600 hover:bg-green-700 mb-8"
          >
            Connect Bank Account
          </ButtonMain>
        ) : (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveView('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('spending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'spending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Spending Analysis
              </button>
              <button
                onClick={() => setActiveView('trends')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'trends' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Trends & Predictions
              </button>
              <button
                onClick={() => setActiveView('savings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'savings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Savings Opportunities
              </button>
              <button
                onClick={() => setActiveView('risk')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'risk' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Risk Assessment
              </button>
              <button
                onClick={() => setActiveView('comparison')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'comparison' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Price Comparison
              </button>
              <button
                onClick={onConnectBank}
                className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors ml-auto"
              >
                Manage Banks
              </button>

            </div>
          </div>
        )}

        {/* Content Area */}
        {hasConnections && activeView === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Spending Analysis"
              description="View your spending patterns and get AI-powered insights"
              icon={<BarChart3 className="w-8 h-8 text-blue-600" />}
              enabled={true}
              onClick={() => setActiveView('spending')}
              highlight={quickStats?.trend === 'increasing' ? "Spending up this month" : null}
            />
            <FeatureCard
              title="Trends & Predictions"
              description="See spending trends and future predictions"
              icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
              enabled={true}
              onClick={() => setActiveView('trends')}
              highlight={quickStats?.nextMonthPrediction && quickStats.nextMonthPrediction > quickStats.currentMonthSpending 
                ? "Higher spending predicted" : null}
            />
            <FeatureCard
              title="Savings Opportunities"
              description="Discover ways to save money with AI analysis"
              icon={<PiggyBank className="w-8 h-8 text-green-600" />}
              enabled={true}
              onClick={() => setActiveView('savings')}
              highlight={quickStats?.savingsPotential && quickStats.savingsPotential > 0 
                ? `Save ${formatCurrency(quickStats.savingsPotential)}/mo` : "Check opportunities"}
            />
            <FeatureCard
              title="Risk Assessment"
              description="Get your personalized financial risk score"
              icon={<AlertCircle className="w-8 h-8 text-orange-600" />}
              enabled={true}
              onClick={() => setActiveView('risk')}
            />
          </div>
        )}

        {hasConnections && activeView === 'spending' && (
          <EnhancedSpendingAnalysis 
            userId={user.id} 
            selectedAccountId={selectedAccountId} 
            key={`spending-${selectedAccountId}`}
          />
        )}

        {hasConnections && activeView === 'trends' && (
          <TrendAnalysis 
            userId={user.id} 
            selectedAccountId={selectedAccountId}
            key={`trends-${selectedAccountId}`}
          />
        )}

        {hasConnections && activeView === 'savings' && (
          <SavingsOpportunities 
            userId={user.id} 
            selectedAccountId={selectedAccountId}
            key={`savings-${selectedAccountId}`}
          />
        )}

        {hasConnections && activeView === 'risk' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk Assessment</h2>
            <p className="text-gray-600">Risk assessment feature coming soon...</p>
          </div>
        )}
        {hasConnections && activeView === 'comparison' && (
          <PriceComparison 
            userId={user.id} 
            selectedAccountId={selectedAccountId}
            key={`comparison-${selectedAccountId}`}
          />
        )}
        {/* Feature Cards for non-connected users */}
        {!hasConnections && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              title="Spending Analysis"
              description="Connect a bank first"
              icon={<BarChart3 className="w-8 h-8 text-gray-400" />}
              enabled={false}
            />
            <FeatureCard
              title="Trends & Predictions"
              description="Connect a bank first"
              icon={<TrendingUp className="w-8 h-8 text-gray-400" />}
              enabled={false}
            />
            <FeatureCard
              title="Savings Opportunities"
              description="Connect a bank first"
              icon={<PiggyBank className="w-8 h-8 text-gray-400" />}
              enabled={false}
            />
            <FeatureCard
              title="Risk Assessment"
              description="Connect a bank first"
              icon={<AlertCircle className="w-8 h-8 text-gray-400" />}
              enabled={false}
            />
            <FeatureCard
              title="Price Comparison"
              description="Find cheaper alternatives for your purchases"
              icon={<ShoppingCart className="w-8 h-8 text-purple-600" />}
              enabled={true}
              onClick={() => setActiveView('comparison')}
              highlight="New feature!"
            />
          </div>
        )}
      </div>

      {/* Basiq Modal */}
      <BasiqConnectionModal
        isOpen={isBasiqModalOpen}
        onClose={onBasiqModalClose}
        onSuccess={(data) => onBasiqSuccess(data, user.id)}
        userId={user.id}
      />
    </section>
  );
}

function ConnectionStatus({ connections, selectedAccountId }: any) {
  return (
    <div className="bg-green-50 p-4 rounded-lg mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-green-800 mb-2">Connected Banks</h3>
          {connections.map((conn: any, index: number) => (
            <div key={index} className="text-sm text-green-700">
              ✓ {conn.institution_name || 'Bank Account'} - Connected
            </div>
          ))}
        </div>
        {selectedAccountId && (
          <div className="text-sm text-green-700">
            Viewing: Specific Account
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStatCard({ icon, label, value, trend, subtitle, color, onClick }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  } as const;

  const trendColors = {
    increasing: 'bg-red-100 text-red-600',
    decreasing: 'bg-green-100 text-green-600',
    stable: 'bg-gray-100 text-gray-600'
  } as const;

  return (
    <div 
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trendColors[trend as keyof typeof trendColors]
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600">{label}</p>
      <div className="mt-1">
        {typeof value === 'string' || typeof value === 'number' ? (
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        ) : (
          value
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function FeatureCard({ title, description, icon, enabled, onClick, highlight }: any) {
  return (
    <div 
      className={`bg-white p-6 rounded-lg shadow-md transition-all relative overflow-hidden ${
        !enabled ? 'opacity-50' : 'hover:shadow-lg cursor-pointer'
      }`}
      onClick={enabled ? onClick : undefined}
    >
      {highlight && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-bl-lg">
          {highlight}
        </div>
      )}
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      {enabled && (
        <p className="text-sm text-blue-600 mt-2">Click to view →</p>
      )}
    </div>
  );
}
