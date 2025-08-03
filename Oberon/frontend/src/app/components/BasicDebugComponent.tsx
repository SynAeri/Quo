import React, { useEffect, useState } from 'react';

const BasiqDebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState({
    currentUrl: '',
    hasJobIds: false,
    jobIds: '',
    sessionUserId: '',
    basiqToken: '',
    error: ''
  });

  useEffect(() => {
    // Check current URL and parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobIds = urlParams.get('jobIds');
    const sessionUserId = sessionStorage.getItem('userId');
    
    setDebugInfo(prev => ({
      ...prev,
      currentUrl: window.location.href,
      hasJobIds: !!jobIds,
      jobIds: jobIds || 'none',
      sessionUserId: sessionUserId || 'none'
    }));

    // Try to get Basiq token
    if (sessionUserId) {
      fetch(`/api/client-token?userId=${sessionUserId}`)
        .then(res => res.json())
        .then(data => {
          setDebugInfo(prev => ({
            ...prev,
            basiqToken: data.access_token ? 'Token received' : 'No token',
            error: data.detail || ''
          }));
        })
        .catch(err => {
          setDebugInfo(prev => ({
            ...prev,
            error: err.message
          }));
        });
    }
  }, []);

  const testBasiqRedirect = async () => {
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        alert('No user ID in session storage!');
        return;
      }

      // Get client token
      const response = await fetch(`/api/client-token?userId=${userId}`);
      const data = await response.json();
      
      if (data.access_token) {
        // Redirect to Basiq consent
        const consentUrl = `https://consent.basiq.io/home?userId=${data.basiq_user_id}&token=${data.access_token}`;
        console.log('Redirecting to:', consentUrl);
        window.location.href = consentUrl;
      } else {
        alert('Failed to get Basiq token: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-md">
      <h3 className="font-bold text-lg mb-2">Basiq Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Current URL:</strong>
          <div className="text-xs break-all">{debugInfo.currentUrl}</div>
        </div>
        
        <div>
          <strong>Has jobIds param:</strong> {debugInfo.hasJobIds ? '✅ Yes' : '❌ No'}
        </div>
        
        {debugInfo.hasJobIds && (
          <div>
            <strong>Job ID:</strong> {debugInfo.jobIds}
          </div>
        )}
        
        <div>
          <strong>Session User ID:</strong> {debugInfo.sessionUserId}
        </div>
        
        <div>
          <strong>Basiq Token:</strong> {debugInfo.basiqToken}
        </div>
        
        {debugInfo.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {debugInfo.error}
          </div>
        )}
      </div>
      
      <button
        onClick={testBasiqRedirect}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Test Basiq Redirect
      </button>
    </div>
  );
};

export default BasiqDebugComponent;
