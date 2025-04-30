// In frontend/src/api.jsx
import axios from 'axios';

// Set default base URL for all axios requests - without /api suffix
axios.defaults.baseURL = 'http://localhost:3001';

// Add a request interceptor to handle errors
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default axios;