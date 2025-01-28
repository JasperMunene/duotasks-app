import axios from 'axios';

// Set up the Axios instance with default configurations
const axiosInstance = axios.create({
  baseURL: 'https://your-api-url.com', // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to handle token expiration, authentication errors, etc.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // You may store the token in AsyncStorage or SecureStorage (for React Native)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for handling errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios (like token expiration, authentication errors)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors (token expired or invalid)
      console.log('Unauthorized, please log in again.');
    } else if (error.response && error.response.status === 500) {
      // Handle server errors
      console.log('Server error, please try again later.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
