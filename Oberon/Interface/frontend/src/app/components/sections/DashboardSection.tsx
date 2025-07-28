// app/components/sections/DashboardSection.tsx
'use client';
import { useEffect, useState } from 'react';
import Typewriter from 'typewriter-effect';
import ButtonMain from '../ui/ButtonMain';
import BasiqConnectionModal from '../BasiqConnectionWrapper';
import EnhancedSpendingAnalysis from '../analysis/EnhancedSpendingAnalysis';
import TrendAnalysis from '../analysis/trendAnalysis';
import SavingsOpportunities from '../analysis/SavingsOpportunities';
import { useBasiqConnection } from '../../hooks/useBasiqConnection';
import { TrendingUp, PiggyBank, CreditCard, BarChart3, AlertCircle } from 'lucide-react';

interface DashboardSectionProps {
  user: any;
  onConnectBank: () => void;
  isBasiqModalOpen: boolean;
  onBasiqModalClose: () => void;
  onBasiqSuccess: (data: any, userId: string) => void;
  selectedAccountId?: string | null;
  onAccountChange?: (accountId: string | null) => void;
}

export default function DashboardSection({
  user,
  onConnectBank,
  isBasiqModalOpen,
  onBasiqModalClose,
  onBasiqSuccess,
  selectedAccountId,
  onAccountChange
}: DashboardSectionProps) {
  const { hasConnections, connections, checkConnections } = useBasiqConnection();
  const [activeView, setActiveView] = useState<'overview' | 'spending' | 'trends' | 'savings' | 'risk'>('overview');
  const [quickStats, setQuickStats] = useState<any>(null);

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/trends/${user.id}?months=1${
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
        setQuickStats(data);
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error);
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

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
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

        {/* Connection Status */}
        {hasConnections && connections.length > 0 && (
          <ConnectionStatus 
            connections={connections} 
            selectedAccountId={selectedAccountId}
          />
        )}

        {/* Quick Stats (New) */}
        {hasConnections && quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <QuickStatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="This Month"
              value={formatCurrency(quickStats.insights?.average_monthly || 0)}
              trend={quickStats.insights?.trend}
              color="blue"
            />
            <QuickStatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Predicted Next Month"
              value={formatCurrency(quickStats.insights?.next_month_prediction || 0)}
              color="purple"
            />
            <QuickStatCard
              icon={<PiggyBank className="w-5 h-5" />}
              label="Savings Potential"
              value="View Insights"
              onClick={() => setActiveView('savings')}
              color="green"
            />
            <QuickStatCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Active Subscriptions"
              value="Analyze"
              onClick={() => setActiveView('savings')}
              color="orange"
            />
          </div>
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
              highlight={quickStats?.patterns?.length > 0 ? "New patterns detected!" : null}
            />
            <FeatureCard
              title="Trends & Predictions"
              description="See spending trends and future predictions"
              icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
              enabled={true}
              onClick={() => setActiveView('trends')}
              highlight={quickStats?.insights?.trend === 'increasing' ? "Spending trending up" : null}
            />
            <FeatureCard
              title="Savings Opportunities"
              description="Discover ways to save money with AI analysis"
              icon={<PiggyBank className="w-8 h-8 text-green-600" />}
              enabled={true}
              onClick={() => setActiveView('savings')}
              highlight="New opportunities found!"
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
          <EnhancedSpendingAnalysis userId={user.id} selectedAccountId={selectedAccountId} />
        )}

        {hasConnections && activeView === 'trends' && (
          <TrendAnalysis userId={user.id} selectedAccountId={selectedAccountId} />
        )}

        {hasConnections && activeView === 'savings' && (
          <SavingsOpportunities userId={user.id} selectedAccountId={selectedAccountId} />
        )}

        {hasConnections && activeView === 'risk' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk Assessment</h2>
            <p className="text-gray-600">Risk assessment feature coming soon...</p>
          </div>
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

function QuickStatCard({ icon, label, value, trend, color, onClick }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div 
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend === 'increasing' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
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
