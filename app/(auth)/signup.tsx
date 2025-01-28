// app/auth/signup.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Text } from "../components/Text";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get('window');

type ErrorState = {
  field: 'name' | 'email' | 'password' | 'confirmPassword' | 'general' | null;
  message: string;
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState>({ field: null, message: '' });
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const router = useRouter();
  const { login } = useAuth();
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

  const handleSignup = async () => {
    setError({ field: null, message: '' });

    if (!name || !email || !password || !confirmPassword) {
      if (!name) setError({ field: 'name', message: 'Name is required' });
      else if (!email) setError({ field: 'email', message: 'Email is required' });
      else if (!password) setError({ field: 'password', message: 'Password is required' });
      else if (!confirmPassword) setError({ field: 'confirmPassword', message: 'Please confirm your password' });
      return;
    }

    if (password !== confirmPassword) {
      setError({ field: 'confirmPassword', message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASEURL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.access_token, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          notifications_count: 0,
          messages_count: 0,
        });
        router.push('/(tabs)');
      } else {
        if (data.message.toLowerCase().includes('email')) {
          setError({ field: 'email', message: data.message });
        } else if (data.message.toLowerCase().includes('password')) {
          setError({ field: 'password', message: data.message });
        } else {
          setError({ field: 'general', message: data.message || 'Registration failed' });
        }
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join us and start your journey</Text>
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
                  error.field === 'name' && styles.inputError
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={error.field === 'name' ? "#dc2626" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Full Name"
                    style={styles.input}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (error.field === 'name') {
                        setError({ field: null, message: '' });
                      }
                    }}
                    autoCapitalize="words"
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                </View>
                {renderErrorMessage('name')}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  error.field === 'email' && styles.inputError
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={error.field === 'email' ? "#dc2626" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Email address"
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error.field === 'email') {
                        setError({ field: null, message: '' });
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                </View>
                {renderErrorMessage('email')}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  error.field === 'password' && styles.inputError
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={error.field === 'password' ? "#dc2626" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Password"
                    style={styles.input}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error.field === 'password') {
                        setError({ field: null, message: '' });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                {renderErrorMessage('password')}
              </View>

              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  error.field === 'confirmPassword' && styles.inputError
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={error.field === 'confirmPassword' ? "#dc2626" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    placeholder="Confirm Password"
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error.field === 'confirmPassword') {
                        setError({ field: null, message: '' });
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                {renderErrorMessage('confirmPassword')}
              </View>

              <TouchableOpacity 
                style={[
                  styles.button, 
                  (!name || !email || !password || !confirmPassword || isLoading) && styles.buttonDisabled
                ]}
                onPress={handleSignup}
                disabled={!name || !email || !password || !confirmPassword || isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="sync" size={24} color="#FFF" />
                    </Animated.View>
                    <Text style={styles.buttonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Already have an account? </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/login')}
                  disabled={isLoading}
                >
                  <Text style={styles.signupLink}>Sign In</Text>
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
  passwordToggle: {
    padding: 8,
    borderRadius: 20,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Figtree',
  },
  signupLink: {
    color: '#2eac5f',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Figtree-SemiBold',
    padding: 8,
    borderRadius: 20,
  },
});
