import { axios } from './utils/axios';

/**
 * The Basiq API authentication process is fairly straight forward, we simply exchange our API key for a token which has an expiry of 60 minutes
 * Our token will be passed as the authorization header to requests made to the Basiq API, which you can find in `./utils/axios`
 *
 * IMPORTANT: You do not want to request a new token on every request!
 * In this file we keep the latest client token in local storage and only request a new token when it is expired
 *
 * https://api.basiq.io/reference/authentication
 */
const REFRESH_INTERVAL = 1000 * 60 * 30; // 30 minutes
const TOKEN_KEY = 'basiqApiClientAccessToken';
const REFRESH_DATE_KEY = 'basiqApiClientAccessTokenRefreshDate';
const BASIQ_USER_ID_KEY = 'basiqUserId'; // New key for storing Basiq user ID

export async function getBasiqAuthorizationHeader() {
  const userId = sessionStorage.getItem('userId'); // Get from sessionStorage
  const tokenData = await getClientToken(userId);
  
  // Handle both old format (string) and new format (object)
  const token = typeof tokenData === 'string' ? tokenData : tokenData.access_token;
  return `Bearer ${token}`;
}

export async function getClientToken(userId) {
  let tokenData = getClientTokenFromLocalStorage();
  const refreshDate = getClientTokenRefreshDateFromLocalStorage() || 0;
  
  if (!tokenData || Date.now() - refreshDate > REFRESH_INTERVAL || userId) {
    // If we don't have a client token in memory or the token has expired, fetch a new one
    tokenData = await updateClientToken(userId);
  }
  
  return tokenData;
}

async function updateClientToken(userId) {
  const tokenData = await getNewClientToken(userId);
  
  // Handle new API response format
  if (typeof tokenData === 'object' && tokenData.access_token) {
    // Store the token in localStorage for caching
    setClientTokenInLocalStorage(tokenData.access_token);
    
    // Store the Basiq user ID in sessionStorage (since it's user-specific)
    sessionStorage.setItem(BASIQ_USER_ID_KEY, tokenData.basiq_user_id);
    
    const refreshDate = Date.now();
    setClientTokenRefreshDateInLocalStorage(refreshDate);
    
    return tokenData;
  } else {
    // Fallback for old format (if your API returns just a string)
    setClientTokenInLocalStorage(tokenData);
    const refreshDate = Date.now();
    setClientTokenRefreshDateInLocalStorage(refreshDate);
    return tokenData;
  }
}

async function getNewClientToken(userId) {
  const { data } = await axios.get('/api/client-token', { params: { userId } });
  return data;
}

export function getClientTokenFromLocalStorage() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setClientTokenInLocalStorage(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getClientTokenRefreshDateFromLocalStorage() {
  return localStorage.getItem(REFRESH_DATE_KEY);
}

export function setClientTokenRefreshDateInLocalStorage(refreshDate) {
  localStorage.setItem(REFRESH_DATE_KEY, refreshDate);
}

// New helper function to get Basiq user ID
export function getBasiqUserId() {
  return sessionStorage.getItem(BASIQ_USER_ID_KEY);
}

// Helper function for your goToConsent function
export async function getTokenAndBasiqUserId() {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    throw new Error('No userId found in sessionStorage');
  }
  
  const tokenData = await getClientToken(userId);
  
  // Handle both formats
  if (typeof tokenData === 'object') {
    return {
      token: tokenData.access_token,
      basiqUserId: tokenData.basiq_user_id
    };
  } else {
    // For old format, get basiq user ID from sessionStorage
    return {
      token: tokenData,
      basiqUserId: getBasiqUserId()
    };
  }
}
