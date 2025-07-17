import Axios from 'axios';
import { getBasiqAuthorizationHeader } from '../clientAuthentication';

/**
 * When making API calls from the client, you should always be importing axios from this file rather than "node_modules"
 * This is because in this file we have set up a custom axios instance with interceptors for managing tokens, error messages etc
 *
 * https://axios-http.com/docs/instance
 * https://axios-http.com/docs/interceptors
 */

export const axios = Axios.create({
  // Add base URL for your FastAPI backend
  baseURL: process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : ''
});

// Intercept all requests made to the Basiq API and insert a "Authorization" header and other common headers
axios.interceptors.request.use(async function (request) {
  const { url, headers } = request;
  
  // For Basiq API calls, add Basiq auth headers
  if (url?.startsWith('https://au-api.basiq.io/')) {
    headers.Authorization = await getBasiqAuthorizationHeader();
    headers.Accept = 'application/json';
    headers['Content-Type'] = 'application/json';
  }
  
  // For your backend API calls, add your app's auth headers if needed
  if (url?.startsWith('/api/')) {
    headers['Content-Type'] = 'application/json';
    // Add your auth token if needed:
    // headers.Authorization = `Bearer ${localStorage.getItem('authToken')}`;
  }
  
  return request;
});

// Intercept all responses from the Basiq API and a provide more useful error messages to the user
axios.interceptors.response.use(
  // Any status code that lie within the range of 2xx cause this function to trigger
  function (response) {
    return response;
  },
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  function (error) {
    // Check if error.response exists before accessing its properties
    if (error.response && 
        error.response.config && 
        error.response.config.url.startsWith('https://au-api.basiq.io/') && 
        error.response.status === 403) {
      
      if (process.env.NODE_ENV !== 'production') {
        // When in development mode, show a detailed error
        const details = error.response.data.data?.[0];
        return Promise.reject(details ? Error(details.title + ': ' + details.detail) : error);
      } else {
        // When in production mode, show a generic error
        return Promise.reject(
          Error('Something went wrong, please try again. If the problem persists, contact support.')
        );
      }
    }
    
    // For all other errors (including network errors, validation errors, etc.)
    return Promise.reject(error);
  }
);

