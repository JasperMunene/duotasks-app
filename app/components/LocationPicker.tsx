import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Text } from './Text';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
}

// Mock location search results
const mockLocations: Location[] = [
  { name: "Central Park, New York", latitude: 40.7829, longitude: -73.9654 },
  { name: "Times Square, New York", latitude: 40.7580, longitude: -73.9855 },
  { name: "Brooklyn Bridge, New York", latitude: 40.7061, longitude: -73.9969 },
  { name: "Empire State Building, New York", latitude: 40.7484, longitude: -73.9857 },
  { name: "Statue of Liberty, New York", latitude: 40.6892, longitude: -74.0445 },
];

export default function LocationPicker({ visible, onClose, onSelectLocation }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Location[]>([]);
  const [animation] = useState(new Animated.Value(0));
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      setSelectedLocation(null);
      setSearchQuery('');
      setResults([]);
    }
  }, [visible]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setSearching(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setResults(mockLocations.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase())
      ));
      setSearching(false);
    } else {
      setResults([]);
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setResults([]);
    
    // Animate map to selected location
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      onClose();
    }
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address from coordinates (reverse geocoding)
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      const locationName = address 
        ? `${address.street || ''} ${address.city || ''}, ${address.region || ''}`
        : 'Selected Location';

      const currentLocation = {
        name: locationName.trim(),
        latitude,
        longitude
      };

      handleSelectLocation(currentLocation);
    } catch (error) {
      alert('Error getting current location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      // Get address from coordinates (reverse geocoding)
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      const locationName = address 
        ? `${address.street || ''} ${address.city || ''}, ${address.region || ''}`
        : 'Selected Location';

      const location = {
        name: locationName.trim(),
        latitude,
        longitude
      };

      handleSelectLocation(location);
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} bold>Select Location</Text>
            {selectedLocation && (
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirmLocation}
              >
                <Text style={styles.confirmText} medium>Confirm</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search for a location..."
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearch('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#2eac5f" size="small" />
              ) : (
                <Ionicons name="locate" size={20} color="#2eac5f" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: -1.2921,
                longitude: 36.8219,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <Ionicons name="location" size={24} color="#fff" />
                    </View>
                  </View>
                </Marker>
              )}
            </MapView>
            {selectedLocation && (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#2eac5f" />
                <Text numberOfLines={2} style={styles.locationName}>
                  {selectedLocation.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.resultsContainer}>
            {searching ? (
              <ActivityIndicator style={styles.loading} color="#2eac5f" />
            ) : results.length > 0 ? (
              results.map((location, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.resultItem,
                    pressed && styles.resultItemPressed,
                  ]}
                  onPress={() => handleSelectLocation(location)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.resultText}>{location.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </Pressable>
              ))
            ) : searchQuery.length > 2 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No locations found</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  confirmButton: {
    position: 'absolute',
    right: 20,
  },
  confirmText: {
    color: '#2eac5f',
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#2eac5f',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationName: {
    flex: 1,
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  resultItemPressed: {
    backgroundColor: '#f8f8f8',
  },
  resultText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loading: {
    padding: 20,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
  },
}); 