import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../components/Text';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface SecuritySection {
  title: string;
  description: string;
  action: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function LoginSecurity() {
  const router = useRouter();
  const { logout, accessToken, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const changePasswordResponse = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },  
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),   
        }
      );
      
      if (!changePasswordResponse.ok) {
        const errorData = await changePasswordResponse.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      const data = await changePasswordResponse.json();
      console.log('Password change response:', data);
      
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      resetPasswordFields();
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const securitySections: SecuritySection[] = [
    {
      title: 'Change Password',
      description: 'Update your account password',
      action: () => setShowChangePassword(true),
      icon: 'lock-closed-outline',
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      action: () => router.push('/(screens)/two-factor'),
      icon: 'shield-checkmark-outline',
    },
    {
      title: 'Active Sessions',
      description: 'Manage your logged-in devices',
      action: () => router.push('/(screens)/active-sessions'),
      icon: 'phone-portrait-outline',
    },
    {
      title: 'Sign Out',
      description: 'Log out from your account',
      action: () => {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: logout,
            },
          ]
        );
      },
      icon: 'log-out-outline',
    },
  ];

  const renderPasswordInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    showPassword: boolean,
    toggleShowPassword: () => void
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputWrapper}>
        <TextInput
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={toggleShowPassword}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Login & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showChangePassword ? (
          <View style={styles.changePasswordContainer}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Text style={styles.description}>
              Please enter your current password and choose a new one
            </Text>

            {renderPasswordInput(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              'Enter current password',
              showCurrentPassword,
              () => setShowCurrentPassword(!showCurrentPassword)
            )}

            {renderPasswordInput(
              'New Password',
              newPassword,
              setNewPassword,
              'Enter new password',
              showNewPassword,
              () => setShowNewPassword(!showNewPassword)
            )}

            {renderPasswordInput(
              'Confirm New Password',
              confirmPassword,
              setConfirmPassword,
              'Confirm new password',
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword)
            )}

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementTitle}>Password Requirements:</Text>
              <Text style={styles.requirementText}>• At least 8 characters long</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowChangePassword(false);
                  resetPasswordFields();
                }}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.saveButton,
                  isLoading && styles.disabledButton
                ]}
                onPress={handleChangePassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.buttonText, styles.saveButtonText, { marginLeft: 8 }]}>
                      Changing...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {securitySections.map((section, index) => (
              <TouchableOpacity
                key={section.title}
                style={[
                  styles.section,
                  index === securitySections.length - 1 && styles.lastSection,
                ]}
                onPress={section.action}
                activeOpacity={0.7}
              >
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name={section.icon}
                    size={24}
                    color={section.title === 'Sign Out' ? '#ff4444' : '#2eac5f'}
                  />
                </View>
                <View style={styles.sectionContent}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      section.title === 'Sign Out' && styles.signOutText,
                    ]}
                    medium
                  >
                    {section.title}
                  </Text>
                  <Text style={styles.sectionDescription}>
                    {section.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  sectionsContainer: {
    padding: 20,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  signOutText: {
    color: '#ff4444',
  },
  changePasswordContainer: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 16,
    paddingLeft: 8,
  },
  passwordRequirements: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#2eac5f',
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#2eac5f',
    elevation: 2,
    shadowColor: '#2eac5f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});