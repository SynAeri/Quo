// ===== app/components/sections/DashboardSection.tsx =====
'use client';

import { useEffect } from 'react';
import Typewriter from 'typewriter-effect';
import ButtonMain from '../ui/ButtonMain';
import BasiqConnectionModal from '../BasiqConnectionWrapper';
import { useBasiqConnection } from '../../hooks/useBasiqConnection';

interface DashboardSectionProps {
  user: any;
  onConnectBank: () => void;
  isBasiqModalOpen: boolean;
  onBasiqModalClose: () => void;
  onBasiqSuccess: (data: any, userId: string) => void;
}

export default function DashboardSection({
  user,
  onConnectBank,
  isBasiqModalOpen,
  onBasiqModalClose,
  onBasiqSuccess
}: DashboardSectionProps) {
  const { hasConnections, connections, checkConnections } = useBasiqConnection();

  useEffect(() => {
    if (user?.id) {
      checkConnections(user.id);
    }
  }, [user]);

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Typewriter
            options={{
              strings: hasConnections 
                ? `Welcome back ${user.firstName}! Your bank is connected.`
                : `Welcome back ${user.firstName}! Ready to connect your bank?`,
              autoStart: true,
              delay: 50,
            }}
          />
        </div>

        {/* Connection Status */}
        {hasConnections && connections.length > 0 && (
          <ConnectionStatus connections={connections} />
        )}

        {/* Main CTA */}
        <ButtonMain 
          onClick={onConnectBank}
          className={hasConnections ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
        >
          {hasConnections ? 'Manage Bank Accounts' : 'Connect Bank Account'}
        </ButtonMain>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <FeatureCard
            title="Risk Assessment"
            description={hasConnections ? "Get your financial risk score" : "Connect a bank first"}
            enabled={hasConnections}
          />
          <FeatureCard
            title="Spending Analysis"
            description={hasConnections ? "AI-powered insights" : "Connect a bank first"}
            enabled={hasConnections}
          />
        </div>
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

function ConnectionStatus({ connections }: any) {
  return (
    <div className="bg-green-50 p-4 rounded-lg mb-8">
      <h3 className="font-semibold text-green-800 mb-2">Connected Banks</h3>
      {connections.map((conn: any, index: number) => (
        <div key={index} className="text-sm text-green-700">
          ✓ {conn.institution_name || 'Bank Account'} - Connected
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ title, description, enabled }: any) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${!enabled && 'opacity-50'}`}>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
