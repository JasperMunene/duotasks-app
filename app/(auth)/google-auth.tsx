import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

// Complete the auth session when the browser is dismissed
WebBrowser.maybeCompleteAuthSession();

interface AuthParams {
  token?: string;
  email?: string;
  id?: string;
  name?: string;
  profile?: string;
  error?: string;
}

export default function GoogleAuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleAuthUrl = `${API_BASE_URL}/login/google`;
  const { login } = useAuth();
  const parseCallbackUrl = (url: string): AuthParams => {
    const params: AuthParams = {};
    
    try {
      // Handle deep link format: duotasks://auth/deep_callback?token=...
      let queryString = '';
      if (url.includes('?')) {
        queryString = url.split('?')[1];
      }

      if (queryString) {
        queryString.split('&').forEach((param) => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key as keyof AuthParams] = decodeURIComponent(value);
          }
        });
      }
    } catch (err) {
      console.error('Error parsing callback URL:', err);
      params.error = 'Failed to parse authentication response';
    }

    return params;
  };

  const saveAuthData = async (params: AuthParams) => {
    try {
      if (!params.token || !params.email || !params.id || !params.name) {
        throw new Error('Missing required authentication data');
      }

      // Store access token
      await AsyncStorage.setItem('access_token', params.token);

      // Store user data
      const userData = {
        id: params.id,
        email: params.email,
        name: params.name,
        image: params.profile || null,
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      console.log('✅ Authentication data saved successfully');
      await login(params.token, userData as any);
      return true;
    } catch (err) {
      console.error('Error saving auth data:', err);
      throw err;
    }
  };

  const handleAuthCallback = async (url: string) => {
    try {
      console.log('Processing auth callback URL:', url);
      
      const params = parseCallbackUrl(url);

      // Check for errors
      if (params.error) {
        Alert.alert('Authentication Error', params.error, [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]);
        return;
      }

      // Validate required params
      if (!params.token || !params.email || !params.id || !params.name) {
        Alert.alert(
          'Authentication Error',
          'Missing authentication data. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
        return;
      }

      // Save auth data
      await saveAuthData(params);

      // Show success message
      Alert.alert(
        'Success!',
        `Welcome ${params.name}! You're now signed in.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to home screen or main app
              router.replace('/(tabs)' as any);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error handling auth callback:', err);
      Alert.alert(
        'Authentication Error',
        err.message || 'Failed to complete authentication',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }
  };

  const handleGoogleAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Opening Google auth:', googleAuthUrl);

      // Open auth URL in system browser
      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        'duotasks://auth/deep_callback'
      );

      console.log('Browser auth result:', result);

      // Handle different result types
      if (result.type === 'success' && result.url) {
        // Direct success with URL
        console.log('Auth success with URL');
        await handleAuthCallback(result.url);
        setLoading(false);
      } else if (result.type === 'dismiss') {
        // Browser dismissed - deep link may have been triggered
        // The deep link will be caught by app.json scheme handler
        console.log('Browser dismissed - waiting for deep link');
        setLoading(false);
        // Don't navigate - let deep link handler manage it
      } else if (result.type === 'cancel') {
        // User cancelled
        console.log('User cancelled auth');
        setLoading(false);
        router.replace('/(auth)/login');
      } else {
        // Unknown result
        console.log('Unknown result:', result);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error during Google auth:', err);
      setError(err.message || 'Failed to open authentication');
      setLoading(false);
    
      Alert.alert(
        'Error',
        'Failed to open Google authentication. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: handleGoogleAuth,
          },
          {
            text: 'Cancel',
            onPress: () => router.replace('/(auth)/login'),
            style: 'cancel',
          },
        ]
      );
    }
  }, [googleAuthUrl, router]);

  useEffect(() => {
    // Automatically start auth when screen mounts
    const timer = setTimeout(() => {
      handleGoogleAuth();
    }, 500);

    return () => clearTimeout(timer);
  }, [handleGoogleAuth]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#2eac5f" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Google Sign In</Text>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2eac5f" />
            <Text style={styles.loadingText}>Opening Google Sign In...</Text>
            <Text style={styles.loadingSubtext}>
              You will be redirected to your browser to complete sign in
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleGoogleAuth}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.infoText}>
              Opening Google Sign In in your browser...
            </Text>
            <Text style={styles.infoSubtext}>
              If the browser doesn't open automatically, tap the button below
            </Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={handleGoogleAuth}
            >
              <Text style={styles.openButtonText}>Open Browser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Figtree-SemiBold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Figtree-SemiBold',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Figtree',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Figtree',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Figtree-Medium',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Figtree-SemiBold',
    marginTop: 16,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Figtree',
    marginTop: 8,
    marginBottom: 24,
  },
  openButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#2eac5f',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
  },
  googleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  googleIconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Figtree-Bold',
  },
});