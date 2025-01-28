import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text } from '../components/Text';

export default function TwoFactor() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [secret] = useState('JBSWY3DPEHPK3PXP'); // In real app, this should be generated on the server
  const qrData = `otpauth://totp/DuoTasks:user@example.com?secret=${secret}&issuer=DuoTasks`;

  const handleEnable2FA = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      // TODO: Implement 2FA verification logic here
      setIsEnabled(true);
      Alert.alert('Success', 'Two-factor authentication has been enabled');
    } catch (error) {
      Alert.alert('Error', 'Failed to enable two-factor authentication');
    }
  };

  const handleDisable2FA = () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            setIsEnabled(false);
            Alert.alert('Success', 'Two-factor authentication has been disabled');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title} medium>
            {isEnabled ? 'Disable 2FA' : 'Enable Two-Factor Authentication'}
          </Text>
          <Text style={styles.description}>
            {isEnabled
              ? 'Two-factor authentication is currently enabled. This adds an extra layer of security to your account.'
              : 'Add an extra layer of security to your account by requiring both your password and an authentication code to sign in.'}
          </Text>

          {!isEnabled && (
            <>
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrData}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>

              <View style={styles.secretContainer}>
                <Text style={styles.secretLabel}>Manual Setup Code:</Text>
                <Text style={styles.secretCode} selectable>
                  {secret}
                </Text>
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle} medium>
                  Setup Instructions:
                </Text>
                <Text style={styles.instruction}>
                  1. Download an authenticator app (Google Authenticator, Authy, etc.)
                </Text>
                <Text style={styles.instruction}>
                  2. Scan the QR code above with your authenticator app
                </Text>
                <Text style={styles.instruction}>
                  3. Enter the 6-digit code from your authenticator app below
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              isEnabled ? styles.disableButton : styles.enableButton,
            ]}
            onPress={isEnabled ? handleDisable2FA : handleEnable2FA}
          >
            <Text
              style={[
                styles.buttonText,
                isEnabled ? styles.disableButtonText : styles.enableButtonText,
              ]}
              medium
            >
              {isEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    color: '#000',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  secretContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  secretLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  secretCode: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    letterSpacing: 1,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#000',
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: '#2eac5f',
  },
  disableButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    fontSize: 16,
  },
  enableButtonText: {
    color: '#fff',
  },
  disableButtonText: {
    color: '#fff',
  },
}); 