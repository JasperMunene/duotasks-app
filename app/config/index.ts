export const API_BASE_URL = "https://rhtr3fc9-5000.uks1.devtunnels.ms";
export const GOOGLE_MAP_CLIENT_ID = "AIzaSyBm6Enu-eA-AbZDqdOsenaInyDsIrT-62k"; // Replace with your actual Google Client ID

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    VERIFY: '/auth/verify',
  },
  USER: {
    PROFILE: '/user/profile',
  },
} as const;

// Function to get full API URL
export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`; 