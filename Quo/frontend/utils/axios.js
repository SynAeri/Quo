// utils/axios.js
import Axios from 'axios';
import { getBasiqAuthorizationHeader } from '../clientAuthentication';

/**
 * Custom axios instance with interceptors for managing tokens, error messages etc
 */

// Determine the base URL based on environment
const getBaseURL = () => {
  // For server-side rendering
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  // For client-side
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  
  // For production, use the environment variable
  return process.env.NEXT_PUBLIC_API_URL || '';
};

export const axios = Axios.create({
  baseURL: getBaseURL()
});

// Intercept all requests
axios.interceptors.request.use(async function (request) {
  const { url, headers } = request;
  
  // For Basiq API calls, add Basiq auth headers
  if (url?.startsWith('https://au-api.basiq.io/')) {
    headers.Authorization = await getBasiqAuthorizationHeader();
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
  }
  
  // For your backend API calls
  if (url?.startsWith('/api/') || url?.includes('/api/')) {
    headers['Content-Type'] = 'application/json';
    
    // Add auth token if it exists
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
    }
  }
  
  return request;
});

// Intercept all responses
axios.interceptors.response.use(
  // Success responses (2xx)
  function (response) {
    return response;
  },
  // Error responses
  function (error) {
    // Handle Basiq API errors
    if (error.response?.config?.url?.startsWith('https://au-api.basiq.io/')) {
      if (error.response.status === 403) {
        if (process.env.NODE_ENV !== 'production') {
          const details = error.response.data?.data?.[0];
          return Promise.reject(details ? Error(details.title + ': ' + details.detail) : error);
        } else {
          return Promise.reject(
            Error('Something went wrong, please try again. If the problem persists, contact support.')
          );
        }
      }
    }
    
    // Handle your backend API errors
    if (error.response?.config?.url?.includes('/api/')) {
      // Handle 401 Unauthorized
      if (error.response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      
      // Return a user-friendly error message
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'An error occurred. Please try again.';
      return Promise.reject(new Error(errorMessage));
    }
    
    // For all other errors
    return Promise.reject(error);
  }
);
