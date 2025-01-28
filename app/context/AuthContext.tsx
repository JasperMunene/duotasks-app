import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { useSocket } from "./SocketContext";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  location?: string;
  title?: string;
  bio?: string;
  rating?: number;
  tasksCompleted?: number;
  joinedDate?: string;
  walletBalance?: number;
  notifications_count?: number;
  messages_count?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLocationBeingFetched, setIsLocationBeingFetched] = useState(false);
  const { connect } = useSocket();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Retrieve both accessToken and user data from AsyncStorage
      const token = await AsyncStorage.getItem("accessToken");
      const userData = await AsyncStorage.getItem("user");

      // Both token and user data must be present to restore authentication
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Validate that we have essential user data
          if (parsedUser && parsedUser.id) {
            // Restore authentication state
            setAccessToken(token);
            setUser(parsedUser);
            setIsAuthenticated(true);
            
            console.log('Auth state restored: User authenticated with saved token');
            
            // Connect to socket with user ID
            connect(parsedUser.id);
            
            // Fetch and update location when app opens - only when authenticated
            // getUserLocation will check authentication internally
            await getUserLocation(token);
          } else {
            console.warn('Auth state check: User data missing ID, clearing storage');
            // Clear invalid data
            await AsyncStorage.removeItem("accessToken");
            await AsyncStorage.removeItem("user");
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          // Clear corrupted data
          await AsyncStorage.removeItem("accessToken");
          await AsyncStorage.removeItem("user");
        }
      } else {
        // If either token or user data is missing, ensure both are cleared
        if (token && !userData) {
          console.warn('Auth state check: Token found but no user data, clearing token');
          await AsyncStorage.removeItem("accessToken");
        } else if (!token && userData) {
          console.warn('Auth state check: User data found but no token, clearing user data');
          await AsyncStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // On error, clear potentially corrupted auth data
      try {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("user");
      } catch (clearError) {
        console.error("Error clearing auth data:", clearError);
      }
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      return {
        street: data.address.road || '',
        area: data.address.suburb || data.address.neighbourhood || '',
        state: data.address.state || '',
        country: data.address.country || '',
        latitude: lat,
        longitude: lon,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const postUserLocation = async (
    location: {
      street: string;
      area: string;
      state: string;
      country: string;
      latitude: number;
      longitude: number;
    },
    token: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });
      
      if (response.ok) {
        console.log('User location updated successfully in database');
      } else {
        console.error('Failed to update user location in database');
      }
    } catch (error) {
      console.error('Error posting user location:', error);
    }
  };
 

  const getUserLocation = async (token: string) => {
    // Only update location when user is authenticated
    // Check token parameter (primary) and current auth state (secondary safeguard)
    if (!token) {
      console.log('Location update skipped: no token provided');
      return;
    }
    
    // Additional safeguard: ensure auth state is set (may be async, so this is a best-effort check)
    if (!isAuthenticated || !user) {
      console.log('Location update skipped: authentication state not ready');
      return;
    }

    // Prevent multiple simultaneous location requests
    if (isLocationBeingFetched) {
      console.log('Location fetch already in progress');
      return;
    }

    setIsLocationBeingFetched(true);
    
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        distanceInterval: 0,
      });

      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address information
      const locationData = await reverseGeocode(latitude, longitude);
      
      if (locationData) {
        // Post location to database
        await postUserLocation(locationData, token);
        console.log('Location fetched and updated:', locationData);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    } finally {
      setIsLocationBeingFetched(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      console.log('Login: Starting login process...');
      console.log('Login: Token received - length:', token?.length || 0);
      console.log('Login: Token preview:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
      
      // Validate token before saving
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Login: ERROR - Invalid token provided!', {
          token,
          type: typeof token,
          isEmpty: token === '',
          isUndefined: token === undefined,
        });
        throw new Error('Invalid access token provided');
      }
      
      console.log('Login: Saving access token to AsyncStorage...');
      // Save the access token (received as "token" from server) to AsyncStorage as "accessToken"
      await AsyncStorage.setItem("accessToken", token);
      
      // Verify it was saved
      const verifyToken = await AsyncStorage.getItem("accessToken");
      if (verifyToken !== token) {
        console.error('Login: ERROR - Token verification failed!');
        console.error('Expected:', token.substring(0, 30));
        console.error('Got:', verifyToken?.substring(0, 30));
        throw new Error('Failed to save access token');
      }
      
      console.log('Login: ✅ Access token verified in AsyncStorage');
      
      // Save user data to AsyncStorage (same storage mechanism as accessToken)
      // Both accessToken and user data are saved separately but together to ensure
      // the user can be authenticated when they return to the app
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      console.log('Login: Access token saved successfully to AsyncStorage');
      console.log('Login: User data saved:', { id: userData.id, email: userData.email, name: userData.name });
      console.log('Login: ✅ Both accessToken and user data persisted to AsyncStorage');

      setAccessToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('Login: Setting authentication state complete');
      console.log('Login: User ID for socket connection:', userData.id);
      
      if (userData.id) {
        console.log('Login: Connecting to socket with user ID:', userData.id);
        connect(userData.id);
        console.log('Login: Socket connection initiated');
        
        // Fetch and update location when user logs in - only when authenticated
        // getUserLocation will check authentication internally
        await getUserLocation(token);
      } else {
        console.error('Login: ERROR - No user ID provided, cannot connect to socket!');
        console.error('Login: User data:', userData);
      }
      
      console.log('Login: Authentication complete');
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("user");

      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      await login(data.access_token, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    // Update the user object locally
    const updatedUser: User = {
      ...user,
      ...updates,
    };

    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  }, [user, setUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        login,
        logout,
        register,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
