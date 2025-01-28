import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView, // Import Dimensions
    Modal, // Import KeyboardAvoidingView
    Platform // Import Platform
    ,





    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { Text as CustomText } from './Text'; // Assuming this custom Text component exists

interface VerifyMpesaBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onVerificationSuccess: () => void;
  existingMpesaNumber?: string; // New prop for prefilling
}

const screenHeight = Dimensions.get('window').height;

export default function VerifyMpesaBottomSheet({ isVisible, onClose, onVerificationSuccess, existingMpesaNumber }: VerifyMpesaBottomSheetProps) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState(1); // 1: M-Pesa number input, 2: OTP input
  const [mpesaNumber, setMpesaNumber] = useState(existingMpesaNumber || ''); // Initialize with existing number
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyMpesaNumber = useCallback(async () => {
    const sanitizedMpesaNumber = mpesaNumber.replace(/\D/g, ''); // Remove non-digit characters
    if (!sanitizedMpesaNumber || sanitizedMpesaNumber.length < 10) { // Minimum 10 digits
      setError('Please enter a valid M-Pesa number (minimum 10 digits).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/payment/mpesa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ mpesa_number: sanitizedMpesaNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify M-Pesa number.');
      }

      setStep(2); // Move to OTP input step
    } catch (err) {
      console.error('M-Pesa verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify M-Pesa number.');
    } finally {
      setLoading(false);
    }
  }, [mpesaNumber, accessToken]);

  const handleSubmitOtp = useCallback(async () => {
    if (!otp || otp.length !== 6) { // Assuming OTP is 6 digits
      setError('Please enter a 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/payment/mpesa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ mpesa_number: mpesaNumber.replace(/\D/g, ''), otp: otp }), // Sanitize number for OTP submission too
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP.');
      }

      onVerificationSuccess(); // Trigger wallet data refetch
      onClose(); // Close the modal on success
    } catch (err) {
      console.error('OTP submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit OTP.');
    } finally {
      setLoading(false);
    }
  }, [mpesaNumber, otp, accessToken, onVerificationSuccess, onClose]);

  const handleClose = () => {
    setStep(1);
    setMpesaNumber(existingMpesaNumber || ''); // Reset to initial prop value
    setOtp('');
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose} // Revert closing functionality
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <CustomText style={[styles.title, styles.boldText]}>
            {step === 1 ? 'Verify M-Pesa Number' : 'Enter OTP'}
          </CustomText>
          <CustomText style={styles.essentialText}>Payment details are essential for using the app's full functionality.</CustomText>

          {error && <CustomText style={styles.errorText}>{error}</CustomText>}

          {step === 1 ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter M-Pesa number (e.g., 254712345678)"
                value={mpesaNumber}
                onChangeText={setMpesaNumber}
                keyboardType="numeric"
                maxLength={15} // Allow more characters for flexible input
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyMpesaNumber}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <CustomText style={[styles.buttonText, styles.mediumText]}>Verify Number</CustomText>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <CustomText style={styles.otpInfoText}>An OTP has been sent to {mpesaNumber}. Please enter it below.</CustomText>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmitOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <CustomText style={[styles.buttonText, styles.mediumText]}>Submit OTP</CustomText>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendOtpButton} onPress={() => setError('OTP resend functionality not yet implemented.')}> 
                <CustomText style={styles.resendOtpText}>Resend OTP</CustomText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    minHeight: screenHeight * 0.6, // 60% of screen height
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20, // Apply border radius
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#2eac5f',
    padding: 15,
    borderRadius: 27, // Apply border radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    width: '100%',
  },
  otpInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    width: '100%',
  },
  resendOtpButton: {
    marginTop: 15,
    padding: 10,
  },
  resendOtpText: {
    color: '#007bff',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  mediumText: {
    fontWeight: '500',
  },
  essentialText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
}); 