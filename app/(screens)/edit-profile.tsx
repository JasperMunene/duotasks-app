import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../components/Text';
import { API_BASE_URL } from '../config';

interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  tagline: string;
  bio: string;
}

export default function EditProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: 'Eslieh',
    lastName: 'Japheth',
    phone: '254712345678',
    location: 'Nairobi, Kenya',
    tagline: 'Full Stack Developer | Mobile App Specialist',
    bio: 'Freelance developer passionate about creating amazing mobile experiences.',
  });

  const [errors, setErrors] = useState<Partial<UserProfile>>({});

  const validateForm = () => {
    const newErrors: Partial<UserProfile> = {};

    if (!profile.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profile.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!profile.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^254[0-9]{9}$/.test(profile.phone)) {
      newErrors.phone = 'Invalid phone number format (254XXXXXXXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        
      }
      fetch(`${API_BASE_URL}/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${'your_token_here'}`, // Replace with actual token
        },
        body: JSON.stringify(profile),
      })
      .then(response => { 
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      }
      )
      Alert.alert(`Profile saved', 'Your profile has been updated successfully. ${profile}`);
      // alert.('Profile saved:', profile);
      // Save profile changes here
      router.back();
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText} medium>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} medium>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={profile.firstName}
                onChangeText={(value) => handleChange('firstName', value)}
                placeholder="Enter first name"
              />
              {errors.firstName ? (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              ) : (
                <Text style={styles.tagline}>This will be displayed on your profile</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={profile.lastName}
                onChangeText={(value) => handleChange('lastName', value)}
                placeholder="Enter last name"
              />
              {errors.lastName ? (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              ) : (
                <Text style={styles.tagline}>Your surname or family name</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Tagline</Text>
              <TextInput
                style={styles.input}
                value={profile.tagline}
                onChangeText={(value) => handleChange('tagline', value)}
                placeholder="e.g. Full Stack Developer | Mobile App Specialist"
                maxLength={50}
              />
              <Text style={styles.tagline}>A short headline that describes your professional role</Text>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} medium>Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={profile.phone}
                onChangeText={(value) => handleChange('phone', value)}
                placeholder="254XXXXXXXXX"
                keyboardType="numeric"
              />
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : (
                <Text style={styles.tagline}>Used for M-Pesa transactions and notifications</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={profile.location}
                onChangeText={(value) => handleChange('location', value)}
                placeholder="Enter your location"
              />
              <Text style={styles.tagline}>City and country where you're based</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} medium>About</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.bio}
                onChangeText={(value) => handleChange('bio', value)}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.tagline}>Share a brief description about yourself and your expertise</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2eac5f',
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  tagline: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
}); 