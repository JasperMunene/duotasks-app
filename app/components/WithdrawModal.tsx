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
import { Text } from './Text';

interface WithdrawModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  balance: number;
}

const { height } = Dimensions.get('window');

export default function WithdrawModal({ isVisible, onClose, onSuccess, balance }: WithdrawModalProps) {
  const [stage, setStage] = useState<'initial' | 'processing' | 'success'>('initial');
  const [slideAnim] = useState(new Animated.Value(height));
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > balance) {
      setError('Insufficient balance');
      return;
    }
    if (withdrawAmount < 100) {
      setError('Minimum withdrawal amount is KES 100');
      return;
    }
    setError('');
    setStage('processing');
    // Simulate success after 3 seconds
    setTimeout(() => {
      setStage('success');
      if (onSuccess) onSuccess();
    }, 3000);
  };

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
      setError('');
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
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
          onPress={handleClose}
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
                <Text style={styles.title} bold>Withdraw to M-Pesa</Text>
                <Text style={styles.subtitle}>Available balance: KES {balance.toLocaleString()}</Text>
                <Text style={styles.pendingNote}>
                  Some funds may be pending based on task completion terms
                </Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>KES</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(formatAmount(text));
                    setError('');
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>Minimum withdrawal: KES 100</Text>
                  <Text style={styles.infoText}>Only available balance can be withdrawn</Text>
                </View>
              )}

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
                    Withdraw KES {amount ? parseFloat(amount).toLocaleString() : '0'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.secureText}>
                  <Ionicons name="shield-checkmark" size={14} color="#666" /> Secure M-Pesa Transfer
                </Text>
              </View>
            </View>
          )}

          {stage === 'processing' && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#2eac5f" />
              <Text style={styles.title} bold>Processing</Text>
              <Text style={styles.description}>
                Please wait while we process your withdrawal...
              </Text>
              <Text style={styles.amount} bold>KES {parseFloat(amount).toLocaleString()}</Text>
            </View>
          )}

          {stage === 'success' && (
            <View style={styles.centerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={50} color="#2eac5f" />
              </View>
              <Text style={styles.title} bold>Withdrawal Successful!</Text>
              <Text style={styles.amount} bold>KES {parseFloat(amount).toLocaleString()}</Text>
              <Text style={styles.description}>
                Your withdrawal has been processed and will be sent to your M-Pesa.
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText} medium>Done</Text>
              </TouchableOpacity>
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
    marginBottom: 4,
  },
  pendingNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  infoContainer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSection: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
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
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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
}); 