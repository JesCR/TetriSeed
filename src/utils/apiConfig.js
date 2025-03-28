// API configuration for different environments
const API_URL = {
  development: '', // Empty for development (uses proxy)
  production: 'https://your-deployed-server-url.com' // Replace with your actual server URL
};

// Get the current environment
const env = import.meta.env.MODE || 'development';

// Export the base URL for API calls
export const API_BASE_URL = API_URL[env];

// Helper function to get the full API URL
export const getApiUrl = (endpoint) => {
  // In development, just use the endpoint (proxy will handle it)
  // In production, prefix with the full server URL
  return env === 'development' ? endpoint : `${API_BASE_URL}${endpoint}`;
}; 