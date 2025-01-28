import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

type ErrorState = {
  field: 'code' | 'general' | null;
  message: string;
};

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState>({ field: null, message: '' });
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const router = useRouter();
  const BASEURL = API_BASE_URL;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleVerify = async () => {
    setError({ field: null, message: '' });

    if (!code) {
      setError({ field: 'code', message: 'Verification code is required' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASEURL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/(auth)/login');
      } else {
        setError({ field: 'code', message: data.message || 'Invalid verification code' });
      }
    } catch (error) {
      setError({ 
        field: 'general', 
        message: 'Unable to connect to the server. Please check your internet connection.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderErrorMessage = (fieldName: ErrorState['field']) => {
    if (error.field === fieldName) {
      return (
        <Animated.View 
          style={[
            styles.errorContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error.message}</Text>
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? -64 : 0}
        >
          <View style={styles.content}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#2eac5f" />
            </TouchableOpacity>

            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>Enter the code sent to your email</Text>
            </Animated.View>

            {error.field === 'general' && (
              <Animated.View 
                style={[
                  styles.errorContainer,
                  { opacity: fadeAnim }
                ]}
              >
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{error.message}</Text>
              </Animated.View>
            )}

            <Animated.View 
              style={[
                styles.form,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  error.field === 'code' && styles.inputError
                ]}>
                  <Ionicons 
                    name="key-outline" 
                    size={20} 
                    color={error.field === 'code' ? "#dc2626" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Verification Code"
                    style={styles.input}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (error.field === 'code') {
                        setError({ field: null, message: '' });
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                </View>
                {renderErrorMessage('code')}
              </View>

              <TouchableOpacity 
                style={[
                  styles.button, 
                  (!code || isLoading) && styles.buttonDisabled
                ]}
                onPress={handleVerify}
                disabled={!code || isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="sync" size={24} color="#FFF" />
                    </Animated.View>
                    <Text style={styles.buttonText}>Verifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity 
                  onPress={() => {/* Handle resend */}}
                  disabled={isLoading}
                >
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    fontFamily: 'Figtree-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Figtree',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#F8F8F8',
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
    fontFamily: 'Figtree',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Figtree',
  },
  button: {
    backgroundColor: '#2eac5f',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#2eac5f',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Figtree',
  },
  resendLink: {
    color: '#2eac5f',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
    padding: 8,
    borderRadius: 20,
  },
});
