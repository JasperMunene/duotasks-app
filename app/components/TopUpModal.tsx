import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Text } from './Text';

interface TopUpModalProps {
  isVisible: boolean;
  mpesa_number: string;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: number;
  message?: string;
}

const { height } = Dimensions.get('window');

export default function TopUpModal({ isVisible, mpesa_number, onClose, onSuccess, initialAmount, message }: TopUpModalProps) {
  const [stage, setStage] = useState<'initial' | 'processing' | 'success' | 'failed'>('initial');
  const [slideAnim] = useState(new Animated.Value(height));
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { socket } = useSocket();
  const { user, accessToken } = useAuth();

  // Set initial amount when modal becomes visible
  useEffect(() => {
    if (isVisible && initialAmount) {
      setAmount(initialAmount.toString());
    }
  }, [isVisible, initialAmount]);

  const handleContinue = async () => {
    if (amount && parseFloat(amount) > 0) {
      setStage('processing');
      setErrorMessage('');
      
      try {
        // Call the API to initiate M-Pesa payment
        const response = await fetch(`${API_BASE_URL}/payment/mpesa/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            phone_number: mpesa_number,
          }),
        });

        const responseData = await response.json();

        if (response.status === 200 && responseData.message === "Payment request successfully initiated") {
          // API call successful, now wait for WebSocket confirmation
          console.log('Payment initiated, waiting for confirmation...');
        } else {
          // API call failed
          setStage('failed');
          setErrorMessage(responseData.message || 'Failed to initiate payment. Please try again.');
        }
      } catch (error) {
        console.error('Payment initiation error:', error);
        setStage('failed');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    }
  };

  // Listen for WebSocket payment confirmation
  useEffect(() => {
    if (socket && stage === 'processing') {
      const handlePaymentReceived = (data: any) => {
        console.log('Payment received:', data);
        if (data.message === "Transaction successful") {
          setStage('success');
          if (onSuccess) onSuccess();
        } else {
          setStage('failed');
          setErrorMessage(data.message || 'Payment failed. Please try again.');
        }
      };

      const handlePaymentFailed = (data: any) => {
        console.log('Payment failed:', data);
        setStage('failed');
        // Construct a detailed error message including reason and code if available
        const errorDetails = [
          data.message || 'Payment failed',
          data.reason && `Reason: ${data.reason}`,
          data.code && `Error Code: ${data.code}`
        ].filter(Boolean).join('\n');
        
        setErrorMessage(errorDetails);
      };

      // Listen for payment events
      socket.on('payment_received', handlePaymentReceived);
      socket.on('payment_failed', handlePaymentFailed);

      // Cleanup listeners
      return () => {
        socket.off('payment_received', handlePaymentReceived);
        socket.off('payment_failed', handlePaymentFailed);
      };
    }
  }, [socket, stage, onSuccess]);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 9,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setStage('initial');
      setAmount('');
      setErrorMessage('');
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleRetry = () => {
    setStage('initial');
    setErrorMessage('');
  };

  const formatAmount = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const match = cleaned.match(/^(\d*\.?\d{0,2})/);
    return match ? match[0] : '';
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={stage !== 'processing' ? handleClose : undefined}
        />
        <Animated.View 
          style={[
            styles.content,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          {stage === 'initial' && (
            <View style={styles.initialContent}>
              <View style={styles.header}>
                <Text style={styles.title} bold>Top Up Wallet</Text>
                <Text style={styles.subtitle}>Enter amount to add to your wallet</Text>
                {message && (
                  <Text style={styles.message}>{message}</Text>
                )}
                <Text bold>{`We'll Charge you from ${mpesa_number}`}</Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>KES</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => setAmount(formatAmount(text))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>

              <View style={styles.bottomSection}>
                <TouchableOpacity 
                  style={[
                    styles.continueButton,
                    (!amount || parseFloat(amount) <= 0) && styles.continueButtonDisabled
                  ]}
                  onPress={handleContinue}
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  <Text style={styles.continueButtonText} medium>
                    Continue to M-Pesa
                  </Text>
                </TouchableOpacity>

                <Text style={styles.secureText}>
                  <Ionicons name="shield-checkmark" size={14} color="#666" /> Secure M-Pesa Payment
                </Text>
              </View>
            </View>
          )}

          {stage === 'processing' && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#2eac5f" />
              <Text style={styles.title} bold>Processing Payment</Text>
              <Text style={styles.description}>
                Please enter your M-Pesa PIN when prompted on your phone...
              </Text>
              <Text style={styles.amount} bold>KES {parseFloat(amount).toLocaleString()}</Text>
              <Text style={styles.waitingText}>
                Waiting for payment confirmation...
              </Text>
            </View>
          )}

          {stage === 'success' && (
            <View style={styles.centerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={50} color="#2eac5f" />
              </View>
              <Text style={styles.title} bold>Top Up Successful!</Text>
              <Text style={styles.amount} bold>KES {parseFloat(amount).toLocaleString()}</Text>
              <Text style={styles.description}>
                Your wallet has been topped up successfully.
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText} medium>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === 'failed' && (
            <View style={styles.centerContent}>
              <View style={[styles.iconContainer, styles.errorIconContainer]}>
                <Ionicons name="close-circle" size={50} color="#ff4444" />
              </View>
              <Text style={styles.title} bold>Payment Failed</Text>
              <Text style={styles.errorDescription}>
                {errorMessage || 'Something went wrong with your payment. Please try again.'}
              </Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText} medium>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText} medium>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 400 : 380,
  },
  initialContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  currencySymbol: {
    fontSize: 30,
    color: '#2eac5f',
    marginRight: 8,
    fontWeight: 'bold',
  },
  amountInput: {
    fontSize: 48,
    color: '#2eac5f',
    minWidth: 150,
    textAlign: 'left',
    fontWeight: 'bold',
    padding: 0,
  },
  continueButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  secureText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 172, 95, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorDescription: {
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  waitingText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: 36,
    color: '#2eac5f',
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 10,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 30,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});