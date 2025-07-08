import React, { useState } from 'react';
// Import the real Basiq components
import { AccountVerificationFormProvider } from '../AccountVerificationForm/AccountVerificationFormProvider';
import { AccountVerificationFormStep1PreConsent } from '../AccountVerificationForm/AccountVerificationFormStep1PreConsent';

interface BasiqConnectionWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accountData: any) => void;
  userId: string;
}

const BasiqConnectionWrapper: React.FC<BasiqConnectionWrapperProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId
}) => {
  // Updated state to handle real Basiq flow
  const [step, setStep] = useState<'intro' | 'basiq' | 'success'>('intro');
  const [loading, setLoading] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<any>(null);

  if (!isOpen) return null;

  // Handle transition from intro to Basiq flow
  const handleStartConnection = () => {
    setStep('basiq');
  };

  // Handle successful Basiq connection
  const handleBasiqSuccess = async (accountData: any) => {
    console.log('🎉 Basiq connection successful:', accountData);
    setConnectedAccount(accountData);
    setStep('success');

    // Save connection to your backend
    try {
      const response = await fetch('/api/basiq/save-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          userId: userId,
          basiqUserId: accountData.basiqUserId,
          institutionName: accountData.institutionName,
          accountIds: accountData.accountIds || [],
          connectionData: accountData
        })
      });

      if (response.ok) {
        console.log('✅ Connection saved to backend');
      } else {
        console.error('❌ Failed to save connection to backend');
      }
    } catch (error) {
      console.error('❌ Error saving connection:', error);
    }

    // Notify parent component
    onSuccess(accountData);
  };

  // Handle Basiq flow cancellation
  const handleBasiqCancel = () => {
    setStep('intro');
  };

  // Handle final close
  const handleClose = () => {
    setStep('intro');
    setLoading(false);
    setConnectedAccount(null);
    onClose();
  };

  // Handle final success confirmation
  const handleFinalSuccess = () => {
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 relative max-h-[90vh] overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* STEP 1: INTRODUCTION */}
          {step === 'intro' && (
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Connect Your Bank Account
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Securely connect your bank account to start analyzing your financial health with Quo.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-green-600 text-2xl mb-2">🔒</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Secure</h3>
                  <p className="text-sm text-gray-600">Bank-level encryption via Basiq</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-blue-600 text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Fast</h3>
                  <p className="text-sm text-gray-600">Connect in under 2 minutes</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-purple-600 text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Insights</h3>
                  <p className="text-sm text-gray-600">Instant financial analysis</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartConnection}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Connect Bank Account
                </button>
                <button
                  onClick={handleClose}
                  className="w-full text-gray-600 py-2 px-6 rounded-md hover:text-gray-800 transition-colors"
                >
                  Skip for Now
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>
                  By connecting your account, you agree to our Terms of Service and Privacy Policy.
                  We use Basiq's secure API and never store your banking credentials.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: REAL BASIQ FLOW */}
          {step === 'basiq' && (
            <AccountVerificationFormProvider>
              <div className="p-4">
                <AccountVerificationFormStep1PreConsent />
                
                {/* You'll need to add more Basiq steps here */}
                {/* For now, we'll simulate the flow */}
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={handleBasiqCancel}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      // Simulate successful connection for now
                      const mockData = {
                        basiqUserId: 'basiq_user_' + userId,
                        institutionName: 'Demo Bank',
                        accountIds: ['acc_1', 'acc_2'],
                        accountName: 'Savings Account',
                        connectionDate: new Date().toISOString()
                      };
                      handleBasiqSuccess(mockData);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Simulate Success
                  </button>
                </div>
              </div>
            </AccountVerificationFormProvider>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Successfully Connected!
                </h2>
                <p className="text-gray-600">
                  Your bank account has been securely connected to Quo. We're now analyzing your 
                  financial data to provide personalized insights.
                </p>
              </div>

              {/* Show connected account info */}
              {connectedAccount && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Connected Account</h3>
                  <p className="text-gray-600">
                    {connectedAccount.institutionName}
                    {connectedAccount.accountName && ` - ${connectedAccount.accountName}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Connected on {new Date(connectedAccount.connectionDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleFinalSuccess}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasiqConnectionWrapper;
