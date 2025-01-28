import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { Task, transformApiTask } from './TaskList';
import { Text } from './Text';

export default function TaskMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const previewAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { accessToken } = useAuth();

  // Get user's current location and city
  const getUserLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Get city name using reverse geocoding
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });

      const city = address?.city || address?.region || '';
      setUserCity(city);

      // Center map on user's location
      mapRef.current?.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      // Fetch tasks after getting location
      await fetchTasks(currentLocation.coords.latitude, currentLocation.coords.longitude, city);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch tasks from API
  const fetchTasks = async (lat?: number, lon?: number, city?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!lat || !lon) {
        setError('Location not available');
        setLoading(false);
        return;
      }

      const requestBody = {
        work_mode: 'physical',
        category_ids: [],
        min_price: 0,
        max_price: 10000,
        city: city || userCity,
        radius: 50.0,
        lat,
        lon,
        sort: 'recent',
        search: searchQuery.trim() || undefined,
      };

      const queryString = new URLSearchParams(
        Object.entries(requestBody).flatMap(([key, value]) =>
          value !== undefined ? [[key, value.toString()]] : []
        )
      ).toString();

      const response = await fetch(`${API_BASE_URL}/tasks?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformedTasks = data.tasks?.map(transformApiTask) || [];
      setTasks(transformedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and search effect
  useEffect(() => {
    if (location) {
      const delayedSearch = setTimeout(() => {
        fetchTasks();
      }, 500);

      return () => clearTimeout(delayedSearch);
    }
  }, [searchQuery, location]);

  const handleTaskPress = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTask(task);
    Animated.spring(previewAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePreviewPress = () => {
    if (selectedTask) {
      router.push(`/task/${selectedTask.id}`);
    }
  };

  const closePreview = () => {
    Animated.spring(previewAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => setSelectedTask(null));
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (selectedTask) {
      closePreview();
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
          <Text style={styles.errorTitle}>Failed to load tasks</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={getUserLocation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search tasks in ${userCity || 'your area'}...`}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <Pressable 
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>
      </View>

      {loading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2eac5f" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          } : undefined}
          showsUserLocation
          showsMyLocationButton
        >
          {tasks.map((task) => (
            <Marker
              key={task.id}
              coordinate={{
                latitude: parseFloat(task.location?.latitude || "0"),
                longitude: parseFloat(task.location?.longitude || "0"),
              }}
              onPress={() => handleTaskPress(task)}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.marker,
                  selectedTask?.id === task.id && styles.selectedMarker
                ]}>
                  <Text bold style={styles.markerPrice}>
                    {formatPrice(task.price)}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {selectedTask && (
        <Animated.View
          style={[
            styles.previewContainer,
            {
              transform: [
                {
                  translateY: previewAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0],
                  }),
                },
              ],
              opacity: previewAnimation,
            },
          ]}
        >
          <Pressable style={styles.preview} onPress={handlePreviewPress}>
            <Image source={{ uri: selectedTask.poster.image }} style={styles.previewImage} />
            <View style={styles.previewContent}>
              <View style={styles.previewHeader}>
                <View>
                  <Text bold style={styles.previewTitle}>{selectedTask.title}</Text>
                  <Text bold style={styles.previewPrice}>
                    {formatPrice(selectedTask.price)}
                  </Text>
                  <View style={styles.previewLocation}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.previewLocationText}>
                      {selectedTask.location?.city || "No location"}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.previewFooter}>
                <View style={styles.previewCategory}>
                  <Ionicons name="pricetag-outline" size={14} color="#666" />
                  <Text style={styles.previewCategoryText}>{selectedTask.category}</Text>
                </View>
                <View style={[
                  styles.typeTag,
                  selectedTask.type === 'remote' ? styles.remoteTag : styles.physicalTag
                ]}>
                  <Ionicons 
                    name={selectedTask.type === 'remote' ? 'laptop-outline' : 'walk-outline'} 
                    size={12} 
                    color={selectedTask.type === 'remote' ? '#2563eb' : '#2eac5f'} 
                  />
                  <Text style={[
                    styles.typeText,
                    selectedTask.type === 'remote' ? styles.remoteText : styles.physicalText
                  ]}>
                    {selectedTask.type.charAt(0).toUpperCase() + selectedTask.type.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={closePreview}>
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
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
    borderRadius: 20,
    padding: 8,
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
  selectedMarker: {
    backgroundColor: '#000',
    transform: [{ scale: 1.1 }],
  },
  markerPrice: {
    color: '#fff',
    fontSize: 12,
  },
  previewContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  preview: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewHeader: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 16,
    color: '#2eac5f',
    marginBottom: 8,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewLocationText: {
    fontSize: 12,
    color: '#666',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  previewCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewCategoryText: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: -44,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  physicalTag: {
    backgroundColor: 'rgba(46, 172, 95, 0.1)',
  },
  remoteTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  physicalText: {
    color: '#2eac5f',
  },
  remoteText: {
    color: '#2563eb',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2eac5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 