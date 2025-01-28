import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DeepCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error first
        if (params.error) {
          Alert.alert('Authentication Error', params.error as string, [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)'),
            },
          ]);
          return;
        }

        // Extract token and user data
        // Note: The server returns the access token as "token" in the query params
        // useLocalSearchParams should automatically decode URL-encoded values
        const token = params.token as string;
        const email = params.email as string;
        const id = params.id as string;
        const name = params.name as string;
        const profile = (params.profile as string) || '';

        console.log('Deep callback received params:', {
          hasToken: !!token,
          hasEmail: !!email,
          hasId: !!id,
          hasName: !!name,
          tokenLength: token?.length || 0,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
          allParams: Object.keys(params),
        });

        // Debug: Log the raw token value
        console.log('Raw token value:', token);
        console.log('Token type:', typeof token);
        console.log('Token is empty string?', token === '');
        console.log('Token is undefined?', token === undefined);
        console.log('Token is null?', token === null);

        // Validate required fields
        if (!token || !email || !id || !name) {
          console.error('Missing required auth data:', {
            token: !!token,
            email: !!email,
            id: !!id,
            name: !!name,
          });
          Alert.alert(
            'Authentication Error',
            'Missing authentication data. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)'),
              },
            ]
          );
          return;
        }

        // Verify token before saving
        if (!token || token.trim() === '') {
          console.error('ERROR: Token is empty or invalid!');
          Alert.alert(
            'Authentication Error',
            'Invalid access token received. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)'),
              },
            ]
          );
          return;
        }

        console.log('Saving access token and user data...');
        console.log('Token to save (first 30 chars):', token.substring(0, 30));
        console.log('User data to save:', { id, name, email, hasProfile: !!profile });
        
        // Login with the received data - this will save the token to AsyncStorage
        // The login function saves it as "accessToken" in AsyncStorage
        // It will also connect to the socket using the user ID
        await login(token, {
          id,
          name,
          email,
          image: profile || undefined,
          notifications_count: 0,
          messages_count: 0,
        });
        
        console.log('Login function completed, socket should be connecting...');

        // Verify the token was actually saved
        const savedToken = await AsyncStorage.getItem("accessToken");
        if (savedToken) {
          console.log('✅ Access token verified in AsyncStorage!');
          console.log('Saved token length:', savedToken.length);
        } else {
          console.error('❌ ERROR: Access token was NOT saved to AsyncStorage!');
          Alert.alert(
            'Error',
            'Failed to save access token. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)'),
              },
            ]
          );
          return;
        }

        console.log('Access token saved successfully!');

        // Navigate to main app
        router.replace('/(tabs)');
      } catch (error: any) {
        console.error('Deep callback error:', error);
        Alert.alert(
          'Authentication Error',
          error.message || 'Failed to complete authentication. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)'),
            },
          ]
        );
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [params, login, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#2eac5f" />
        <Text style={styles.text}>Completing authentication...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Figtree',
  },
});

