import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Platform } from 'react-native';

interface TaskDetailsBottomSheetProps {
  task: {
    name: string;
    progress: number; // 0-100
    mode: 'physical' | 'remote';
    posterLocation?: { latitude: number; longitude: number; };
  };
  isVisible: boolean;
  onClose: () => void;
}

const TaskDetailsBottomSheet = forwardRef<BottomSheet, TaskDetailsBottomSheetProps>(
  ({ task, isVisible, onClose }, ref) => {
    const snapPoints = useMemo(() => ['25%', '50%', '75%'], []);

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        onClose();
      }
    }, [onClose]);

    const handleShowTask = useCallback(() => {
      // In a real app, you would navigate to the full task details screen
      console.log('Navigate to task details:', task.name);
      onClose();
    }, [task.name, onClose]);

    const handleGetDirections = useCallback(() => {
      if (task.mode === 'physical' && task.posterLocation) {
        // Dummy user location for now
        const userLatitude = 34.052235;
        const userLongitude = -118.243683;

        const { latitude, longitude } = task.posterLocation;

        // Google Maps URL scheme for directions
        const url = Platform.select({
          ios: `maps://app?saddr=${userLatitude},${userLongitude}&daddr=${latitude},${longitude}`,
          android: `google.navigation:q=${latitude},${longitude}&mode=d`,
        });

        if (url) {
          Linking.openURL(url).catch(err =>
            console.error('Failed to open Google Maps:', err)
          );
        } else {
          console.warn('Could not construct Google Maps URL for platform');
        }
      }
      onClose();
    }, [task.mode, task.posterLocation, onClose]);

    if (!isVisible) {
      return null;
    }

    return (
      <BottomSheet
        ref={ref}
        index={1} // Start at 50% snap point
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandleIndicator}
      >
        <BottomSheetView style={styles.contentContainer}>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.taskProgress}>Progress: {task.progress}%</Text>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={handleShowTask}>
              <Ionicons name="information-circle-outline" size={20} color="#2eac5f" />
              <Text style={styles.buttonText}>Show Task</Text>
            </Pressable>

            {task.mode === 'physical' && task.posterLocation && (
              <Pressable style={styles.button} onPress={handleGetDirections}>
                <Ionicons name="map-outline" size={20} color="#2eac5f" />
                <Text style={styles.buttonText}>Get Directions</Text>
              </Pressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  bottomSheetHandleIndicator: {
    backgroundColor: '#ccc',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  taskName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  taskProgress: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6ffe6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 5,
  },
  buttonText: {
    color: '#2eac5f',
    fontWeight: 'bold',
  },
});

export default TaskDetailsBottomSheet; 