import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { formatPrice } from '../utils/format';
import { Task } from './TaskList';
import { Text } from './Text';

const { height } = Dimensions.get('window');

interface MapBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function MapBottomSheet({ visible, onClose, tasks, userLocation }: MapBottomSheetProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const previewAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Filter out tasks without valid coordinates
  const physicalTasks = tasks.filter(task => {
    if (task.type !== 'physical') return false;
    return task.location && task.location.latitude && task.location.longitude;
  });

  // Center map on user location when map becomes visible
  useEffect(() => {
    if (visible && userLocation && mapRef.current) {
      // Small delay to ensure map is rendered
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }, 300);
    }
  }, [visible, userLocation]);

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

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={20} style={styles.blurContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Tasks on Map</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </Pressable>
          </View>

          <MapView
            ref={mapRef}
            provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : {
              // Fallback to Nairobi if no user location available
              latitude: -1.2921,
              longitude: 36.8219,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton
            showsCompass={false}
            showsScale={false}
            showsTraffic={false}
            showsBuildings={false}
            showsIndoors={false}
            showsPointsOfInterest={false}
          >
            {physicalTasks.map((task) => (
              <Marker
                key={task.id}
                coordinate={{
                  latitude: parseFloat(task.location?.latitude || "0"),
                  longitude: parseFloat(task.location?.longitude || "0"),
                }}
                onPress={() => handleTaskPress(task)}
              >
                <View style={styles.markerContainer}>
                  <Image 
                    source={require('../../assets/images/logo.png')} 
                    style={[
                      styles.markerImage,
                      selectedTask?.id === task.id && styles.selectedMarker
                    ]} 
                  />
                  <View style={[
                    styles.priceTag,
                    selectedTask?.id === task.id && styles.selectedPriceTag
                  ]}>
                    <Text bold style={styles.priceText}>
                      {formatPrice(task.price)}
                    </Text>
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>

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
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurContainer: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
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
  selectedMarker: {
    transform: [{ scale: 1.2 }],
    borderColor: '#2eac5f',
  },
  priceTag: {
    backgroundColor: '#2eac5f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  selectedPriceTag: {
    backgroundColor: '#000',
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
  },
  previewContainer: {
    position: 'absolute',
    bottom: 20,
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
}); 