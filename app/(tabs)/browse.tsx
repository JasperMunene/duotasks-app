// app/index.jsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import CustomTabButtons from '../components/CustomTabButtons';
import MapBottomSheet from '../components/MapBottomSheet';
import TaskList, { Task } from '../components/TaskList';
import { Text } from '../components/Text';
import { useAuth } from '../context/AuthContext';

export default function BrowsePage() {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission not granted');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(currentLocation);
        console.log('User location set:', {
          lat: currentLocation.coords.latitude,
          lon: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    })();
  }, []);

  const toggleMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMapVisible(!isMapVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text bold style={styles.title}>Browse tasks</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.notificationContainer}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={28} color="#000" />
            {(user?.notifications_count || 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {user?.notifications_count}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <TaskList onTasksChange={setTasks} />

      <View style={styles.mapButtonContainer}>
        <Pressable style={styles.mapButton} onPress={toggleMap}>
          <Ionicons name="map-outline" size={24} color="#fff" />
          <Text style={styles.mapButtonText}>Show Map</Text>
        </Pressable>
      </View>

      <MapBottomSheet
        visible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        tasks={tasks}
        userLocation={userLocation ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        } : undefined}
      />

      {!isMapVisible && <CustomTabButtons />}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  notificationContainer: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "#000",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  mapButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: '#2eac5f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
