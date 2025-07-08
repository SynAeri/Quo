import React, { useState } from 'react';

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
  const [step, setStep] = useState<'intro' | 'connecting' | 'success'>('intro');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartConnection = async () => {
    setStep('connecting');
    setLoading(true);

    try {
      // TODO: Integrate with your Basiq components here
      // For now, simulate the connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful connection
      const mockAccountData = {
        accountId: 'acc_123456',
        institutionName: 'Demo Bank',
        accountName: 'Savings Account',
        userId: userId
      };

      setStep('success');
      onSuccess(mockAccountData);
    } catch (error) {
      console.error('Basiq connection failed:', error);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('intro');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'intro' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Bank Account
              </h2>
              <p className="text-gray-600">
                Securely connect your bank account to start analyzing your financial health.
              </p>
            </div>

            <button
              onClick={handleStartConnection}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Bank Account
            </button>
          </div>
        )}

        {step === 'connecting' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connecting to Basiq...
              </h2>
              <p className="text-gray-600">
                Please wait while we establish a secure connection.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-700 text-sm">
                🔒 Your connection is secured with bank-level encryption
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center">
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
                Your bank account has been securely connected. You can now access your financial insights.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasiqConnectionWrapper;
