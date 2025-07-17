import React, { useState, useEffect } from 'react';
import { AccountVerificationFormProvider } from '../basiqComponents/AccountVerificationForm/AccountVerificationFormProvider';
import { AccountVerificationFormStep1PreConsent } from '../basiqComponents/AccountVerificationForm/AccountVerificationFormStep1PreConsent';
import { useAccountVerificationForm } from '../basiqComponents/AccountVerificationForm/AccountVerificationFormProvider';
import { AccountVerificationFormStep3LoadingSteps } from '../basiqComponents/AccountVerificationForm/AccountVerificationFormStep3LoadingSteps';
import { AccountVerificationFormStep4SelectAccount } from '../basiqComponents/AccountVerificationForm/AccountVerificationFormStep4SelectAccount';

// Inner component that has access to Basiq context
const BasiqFlowContent = ({ onSuccess, onCancel, userId }) => {
  const {
    goToConsent,
    basiqConnection,
    accountVerificationFormState,
    updateAccountVerificationFormState,
    hasCompletedForm,
    createBasiqConnection,
    goToStep,
    currentStep,
    goForward
  } = useAccountVerificationForm();

  const [internalStep, setInternalStep] = useState('preConsent');

  // Set user in the form state and session storage
  useEffect(() => {
    updateAccountVerificationFormState({
      user: { id: userId }
    });
    sessionStorage.setItem("userId", userId);
  }, [userId, updateAccountVerificationFormState]);

  // Check URL for jobId when component mounts or URL changes
  useEffect(() => {
    const checkForReturn = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('jobIds');
      
      if (jobId) {
        // User is returning from Basiq consent UI
        console.log('User returned from Basiq with jobId:', jobId);
        setInternalStep('loading');
        
        // Move to step 2 (AccountVerificationFormStep3LoadingSteps)
        goToStep(2);
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };

    // Check immediately
    checkForReturn();

    // Also listen for popstate events (browser back/forward)
    window.addEventListener('popstate', checkForReturn);
    
    return () => {
      window.removeEventListener('popstate', checkForReturn);
    };
  }, [goToStep]);

  // Monitor the actual form step from the provider
  useEffect(() => {
    // Map the provider's currentStep to our internal step
    if (currentStep === 0 || currentStep === 1) {
      setInternalStep('preConsent');
    } else if (currentStep === 2) {
      setInternalStep('loading');
    } else if (currentStep === 3) {
      setInternalStep('selectAccount');
    } else if (currentStep === 4) {
      // Summary step - form is complete
      if (accountVerificationFormState?.selectedAccount) {
        const accountData = {
          basiqUserId: accountVerificationFormState.user?.id,
          institutionName: accountVerificationFormState.selectedInstitution?.name,
          accountId: accountVerificationFormState.selectedAccount?.id,
          accountName: accountVerificationFormState.selectedAccount?.name,
          accountBalance: accountVerificationFormState.selectedAccount?.balance,
          accountNumber: accountVerificationFormState.selectedAccount?.accountNo,
          connectionDate: new Date().toISOString(),
          jobId: basiqConnection?.jobId
        };
        
        onSuccess(accountData);
      }
    }
  }, [currentStep, accountVerificationFormState, basiqConnection, onSuccess]);

  // Monitor Basiq connection status
  useEffect(() => {
    if (basiqConnection?.error) {
      console.error('Basiq connection error:', basiqConnection.error);
      // You might want to show an error state here instead of canceling
    }
  }, [basiqConnection]);

  if (internalStep === 'preConsent') {
    return (
      <div className="p-4">
        <AccountVerificationFormStep1PreConsent />
        <div className="mt-6 flex justify-center">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (internalStep === 'loading') {
    return (
      <div className="p-4">
        <AccountVerificationFormStep3LoadingSteps />
        <div className="mt-6 flex justify-center">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (internalStep === 'selectAccount') {
    return (
      <div className="p-4">
        <AccountVerificationFormStep4SelectAccount />
        <div className="mt-6 flex justify-center">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
};

const BasiqConnectionWrapper = ({
  isOpen,
  onClose,
  onSuccess,
  userId
}) => {
  const [step, setStep] = useState('intro');
  const [loading, setLoading] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);

  // Check if we're returning from Basiq on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobIds');
    
    if (jobId && isOpen) {
      // Skip intro and go straight to Basiq flow
      setStep('basiq');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle transition from intro to Basiq flow
  const handleStartConnection = () => {
    setStep('basiq');
  };

  // Handle successful Basiq connection
  const handleBasiqSuccess = async (accountData) => {
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
          accountId: accountData.accountId,
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
    // Clear session storage
    sessionStorage.removeItem("userId");
    setStep('intro');
  };

  // Handle final close
  const handleClose = () => {
    setStep('intro');
    setLoading(false);
    setConnectedAccount(null);
    sessionStorage.removeItem("userId");
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
              <BasiqFlowContent
                onSuccess={handleBasiqSuccess}
                onCancel={handleBasiqCancel}
                userId={userId}
              />
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
