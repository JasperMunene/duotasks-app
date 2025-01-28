import { Ionicons } from '@expo/vector-icons'; // For icons
import * as Location from 'expo-location'; // For current location
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Text } from './Text'; // Assuming you have a custom Text component

import { TaskFormData } from '../(screens)/post-task';

interface LocationFormProps {
  data: TaskFormData;
  onBack: () => void;
  onNext: (data: Partial<TaskFormData>) => void;
}

export default function LocationForm({ 
  data = { 
    title: '',
    description: '',
    budget: '',
    date: '',
    dateMode: 'on',
    timeSlot: 'morning',
    locationType: 'in-person',
    location: '',
    images: [],
    latitude: undefined,
    longitude: undefined,
    country: undefined,
    state: undefined,
    city: undefined,
    area: undefined
  }, 
  onBack, 
  onNext 
}: LocationFormProps) {
  const [workMode, setWorkMode] = useState<'in-person' | 'online'>(
    data.locationType || 'in-person'
  );
  const [location, setLocation] = useState({
    address: '',
    latitude: data.latitude,
    longitude: data.longitude,
    country: data.country,
    state: data.state,
    city: data.city,
    area: data.area
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<{ location?: string }>({});
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeLocation = async () => {
      if (data.latitude && data.longitude) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.latitude}&lon=${data.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'DuoTasks App'
              }
            }
          );
          const result = await response.json();
          if (result.display_name) {
            const addressParts = result.display_name.split(', ');
            setLocation({
              address: result.display_name,
              latitude: data.latitude,
              longitude: data.longitude,
              country: addressParts[addressParts.length - 1],
              state: addressParts[addressParts.length - 2],
              city: addressParts[addressParts.length - 3],
              area: addressParts[addressParts.length - 4] || ''
            });
            setSearchQuery(result.display_name);
          }
        } catch (error) {
          console.error('Error initializing location:', error);
        }
      }
      setIsInitializing(false);
    };

    initializeLocation();
  }, [data.latitude, data.longitude]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading location details...</Text>
      </View>
    );
  }

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=ke&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'DuoTasks App'
          }
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (place: any) => {
    const addressParts = place.display_name.split(', ');
    const newLocation = {
      address: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      country: addressParts[addressParts.length - 1],
      state: addressParts[addressParts.length - 2],
      city: addressParts[addressParts.length - 3],
      area: addressParts[addressParts.length - 4] || ''
    };
    setLocation(newLocation);
    setSearchResults([]);
    setSearchQuery(place.display_name);
    setErrors({});
  };

  const handleGetCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setErrors({});

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Permission to access location was denied. Please enable it in your device settings.'
      );
      setIsFetchingLocation(false);
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      const { latitude, longitude } = currentLocation.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'DuoTasks App'
          }
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        const addressParts = data.display_name.split(', ');
        const newLocation = {
          address: data.display_name,
          latitude,
          longitude,
          country: addressParts[addressParts.length - 1],
          state: addressParts[addressParts.length - 2],
          city: addressParts[addressParts.length - 3],
          area: addressParts[addressParts.length - 4] || ''
        };
        setLocation(newLocation);
        setSearchQuery(data.display_name);
      } else {
        Alert.alert('Location Not Found', 'Could not determine your current address.');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (workMode === 'in-person') {
      if (!location.address.trim()) {
        newErrors.location = 'Please enter a location.';
      } else if (!location.latitude || !location.longitude) {
        newErrors.location = 'Please select a valid location from suggestions.';
      }
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length) {
      return;
    }

    const locationData = workMode === 'in-person' ? {
      latitude: location.latitude,
      longitude: location.longitude,
      country: location.country || 'Kenya',
      state: location.state,
      city: location.city,
      area: location.area,
      location: location.address
    } : {
      latitude: undefined,
      longitude: undefined,
      country: undefined,
      state: undefined,
      city: undefined,
      area: undefined,
      location: undefined
    };

    onNext({
      locationType: workMode,
      ...locationData
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Where will this task take place?</Text>

      <View style={styles.modesContainer}>
        {(['in-person', 'online'] as const).map((mode) => {
          const isPhysical = mode === 'in-person';
          const isActive = workMode === mode;

          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                isActive ? styles.modeButtonActive : styles.modeButtonInactive,
              ]}
              onPress={() => setWorkMode(mode)}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive ? styles.iconContainerActive : styles.iconContainerInactive,
                ]}
              >
                {isPhysical ? (
                  <Ionicons
                    name="location-outline"
                    size={40}
                    color={isActive ? '#059669' : '#64748b'}
                  />
                ) : (
                  <Ionicons
                    name="phone-portrait-outline"
                    size={40}
                    color={isActive ? '#059669' : '#64748b'}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.modeLabel,
                  isActive ? styles.modeLabelActive : styles.modeLabelInactive,
                ]}
              >
                {isPhysical ? 'In-person' : 'Remote'}
              </Text>
              <Text style={styles.modeDescription}>
                {isPhysical
                  ? 'Select this if you need the Tasker physically there'
                  : 'Select this if the Tasker can do it from home'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {workMode === 'in-person' && (
        <View style={styles.section}>
          <Text style={styles.label}>Where do you need this done?</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchLocation(text);
              }}
              placeholder="Enter location in Kenya"
              placeholderTextColor="#94a3b8"
            />
            {isSearching && (
              <ActivityIndicator style={styles.searchIndicator} color="#059669" />
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              {searchResults.map((place, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resultItem}
                  onPress={() => handleLocationSelect(place)}
                >
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {place.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleGetCurrentLocation}
            disabled={isFetchingLocation}
          >
            <Ionicons name="navigate-outline" size={20} color="#059669" />
            <Text style={styles.currentLocationText}>
              {isFetchingLocation ? 'Fetching location...' : 'Use current location'}
            </Text>
            {isFetchingLocation && (
              <ActivityIndicator size="small" color="#059669" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {workMode === 'online' && (
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#0ea5e9" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Remote Task Tips</Text>
              <Text style={styles.infoText}>
                Make sure to clearly describe what tools, software, or platforms will be needed.
                Consider time zones when scheduling meetings or calls.
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleSubmit}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff', // Or your desired background
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155', // slate-800 equivalent
    marginBottom: 24,
  },
  modesContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  modeButtonActive: {
    borderColor: '#059669', // emerald-200
    backgroundColor: '#f0fdf4', // emerald-50
  },
  modeButtonInactive: {
    borderColor: '#e2e8f0', // slate-200
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 9999, // full circle
    marginBottom: 8,
  },
  iconContainerActive: {
    backgroundColor: '#dcfce7', // emerald-100
  },
  iconContainerInactive: {
    backgroundColor: '#f0fdf4', // emerald-50
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  modeLabelActive: {
    color: '#059669', // emerald-700
  },
  modeLabelInactive: {
    color: '#475569', // slate-600
  },
  modeDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748b', // slate-500
    maxWidth: 180,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155', // slate-700
    marginBottom: 8,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  searchInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  searchIndicator: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 200,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
  },
  errorText: {
    color: '#ef4444', // red-500
    fontSize: 12,
    marginTop: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669', // emerald-600
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#e0f2fe', // sky-100 equivalent
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd', // blue-300 equivalent
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9', // sky-500
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#0284c7', // sky-700
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc', // slate-50
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    gap: 8,
    flex: 1, // Make it take available space
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569', // slate-600
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669', // emerald-600
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1, // Make it take available space
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
    marginTop: 16,
  },
});