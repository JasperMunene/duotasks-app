import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from './Text';

interface TaskAssignmentControlsProps {
  taskStatus: string;
  workMode: string;
  isStartingTask: boolean;
  isCompletingTask: boolean;
  onGetMeThere: () => void;
  onStartTask: () => void;
  onCompleteTask: () => void;
}

export const TaskAssignmentControls: React.FC<TaskAssignmentControlsProps> = ({
  taskStatus,
  workMode,
  isStartingTask,
  isCompletingTask,
  onGetMeThere,
  onStartTask,
  onCompleteTask,
}) => {
  const confirmArrival = () => {
    Alert.alert(
      'Confirm Arrival',
      'Have you arrived at the task location?',
      [
        {
          text: 'Not Yet',
          style: 'cancel',
        },
        {
          text: "Yes, I'm Here",
          onPress: onStartTask,
        },
      ]
    );
  };

  const confirmTaskCompletion = () => {
    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      [
        {
          text: 'Not Yet',
          style: 'cancel',
        },
        {
          text: 'Yes, Task is Done',
          onPress: onCompleteTask,
        },
      ]
    );
  };

  if (taskStatus === 'assigned' && workMode === 'physical') {
    return (
      <View style={styles.footer}>
        <View style={styles.bottomButtons}>
          <Pressable
            style={[styles.bottomButton, styles.navigationButton]}
            onPress={onGetMeThere}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Get Me There</Text>
          </Pressable>

          <Pressable
            style={[styles.bottomButton, styles.startButton]}
            onPress={confirmArrival}
            disabled={isStartingTask}
          >
            {isStartingTask ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.bottomButtonText}>Start Task</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  if (taskStatus === 'in_progress') {
    return (
      <View style={styles.footer}>
        <Pressable
          style={[styles.bottomButton, styles.completeButton]}
          onPress={confirmTaskCompletion}
          disabled={isCompletingTask}
        >
          {isCompletingTask ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.bottomButtonText}>Mark as Completed</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  navigationButton: {
    backgroundColor: '#2563eb',
  },
  startButton: {
    backgroundColor: '#2eac5f',
  },
  completeButton: {
    backgroundColor: '#2eac5f',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 