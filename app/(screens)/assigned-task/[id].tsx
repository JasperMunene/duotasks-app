import { API_BASE_URL } from "@/app/config";
import { useAuth } from "@/app/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageStyle,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import SlideToComplete from '../../components/SlideToComplete';
import StatusModal from "../../components/StatusModal";
import { Text } from "../../components/Text";
import { formatPrice } from "../../utils/format";

interface AssignedTaskData {
  task: {
    id: number;
    budget: string;
    schedule_type: string;
    created_at: string;
    title: string;
    specific_date: string | null;
    updated_at: string;
    deadline_date: string | null;
    description: string;
    preferred_start_time?: string | null;
    preferred_end_time?: string | null;
    preferred_time?: string | null;
    status: string;
    work_mode: string;
    assignment: {
      id: number;
      status: string;
      agreed_price: number;
      task_doer: {
        id: number;
        name: string;
        image: string;
      };
    };
  };
  location: {
    longitude: string;
    city: string | null;
    id: number;
    latitude: string;
  };
  categories: {
    id: number;
    name: string;
  }[];
  images: {
    image_url: string;
    id: number;
  }[];
  user: {
    id: number;
    name: string;
    rating: number;
    completed_tasks: number | null;
    avatar: string;
  };
}

type StatusStyles = {
  statusassigned: ViewStyle;
  statusin_progress: ViewStyle;
  statusdone: ViewStyle;
};

type Styles = {
  container: ViewStyle;
  centered: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  backButton: ViewStyle;
  content: ViewStyle;
  statusBanner: ViewStyle;
  statusassigned: ViewStyle;
  statusin_progress: ViewStyle;
  statusdone: ViewStyle;
  statusBannerText: TextStyle;
  taskCard: ViewStyle;
  taskTitle: TextStyle;
  taskPrice: TextStyle;
  taskMeta: ViewStyle;
  taskMetaItem: ViewStyle;
  taskMetaText: TextStyle;
  stepsContainer: ViewStyle;
  stepsTitle: TextStyle;
  stepsList: ViewStyle;
  stepItem: ViewStyle;
  stepConnector: ViewStyle;
  stepLine: ViewStyle;
  stepIcon: ViewStyle;
  stepIconCompleted: ViewStyle;
  stepButton: ViewStyle;
  stepButtonCompleted: ViewStyle;
  stepButtonDisabled: ViewStyle;
  stepButtonText: TextStyle;
  stepButtonTextCompleted: TextStyle;
  stepButtonTextDisabled: TextStyle;
  card: ViewStyle;
  cardTitle: TextStyle;
  description: TextStyle;
  mapContainer: ViewStyle;
  map: ViewStyle;
  locationText: TextStyle;
  clientInfo: ViewStyle;
  clientAvatar: ImageStyle;
  clientDetails: ViewStyle;
  clientName: TextStyle;
  ratingContainer: ViewStyle;
  rating: TextStyle;
  completedTasks: TextStyle;
  loadingText: TextStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  markerContainer: ViewStyle;
  marker: ViewStyle;
  markerPrice: TextStyle;
  floatingControls: ViewStyle;
  controlButton: ViewStyle;
  primaryButton: ViewStyle;
  completedButton: ViewStyle;
  controlButtonText: TextStyle;
  sliderContainer: ViewStyle;
  sliderTrack: ViewStyle;
  sliderThumb: ViewStyle;
  sliderText: TextStyle;
  slider: ViewStyle;
  locationDialog: ViewStyle;
  dialogTitle: TextStyle;
  dialogText: TextStyle;
  dialogButtons: ViewStyle;
  dialogButton: ViewStyle;
  secondaryButton: ViewStyle;
  dialogButtonText: TextStyle;
};

const baseStyles: Styles = {
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  statusBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 8,
  },
  statusassigned: {
    backgroundColor: '#2563eb',
  },
  statusin_progress: {
    backgroundColor: '#2eac5f',
  },
  statusdone: {
    backgroundColor: '#6b7280',
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  taskPrice: {
    fontSize: 24,
    color: '#2eac5f',
    marginBottom: 16,
  },
  taskMeta: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  taskMetaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  taskMetaText: {
    fontSize: 14,
    color: '#666',
  },
  stepsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  stepConnector: {
    alignItems: 'center' as const,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepIconCompleted: {
    backgroundColor: '#2eac5f',
  },
  stepButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  stepButtonCompleted: {
    backgroundColor: '#e7f5e7',
  },
  stepButtonDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.5,
  },
  stepButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  stepButtonTextCompleted: {
    color: '#2eac5f',
  },
  stepButtonTextDisabled: {
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  map: {
    width: '100%' as const,
    height: '100%' as const,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  clientInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  completedTasks: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: 'center' as const,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#2eac5f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '600' as const,
  },
  markerContainer: {
    alignItems: 'center' as const,
  },
  marker: {
    backgroundColor: "#2eac5f",
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerPrice: {
    color: "#fff",
    fontSize: 12,
  },
  floatingControls: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2eac5f',
  },
  completedButton: {
    backgroundColor: '#6b7280',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sliderContainer: {
    position: 'relative',
    height: 100,
    marginHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderThumb: {
    position: 'absolute' as const,
    left: 4,
    width: 52,
    height: 52,
    backgroundColor: '#2eac5f',
    borderRadius: 26,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderText: {
    color: '#222',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  locationDialog: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  dialogText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
};

const styles = StyleSheet.create(baseStyles);

export default function AssignedTaskDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [taskData, setTaskData] = useState<AssignedTaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStartingTask, setIsStartingTask] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showJourneyDialog, setShowJourneyDialog] = useState(false);
  const [postingStatus, setPostingStatus] = useState(false);
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewMessage, setReviewMessage] = useState('');
  const [showDoneLoader, setShowDoneLoader] = useState(false);
  const reviewSheetRef = React.useRef<BottomSheet>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error'>('success');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  const fetchTaskData = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task: ${response.status}`);
      }

      const data = await response.json();
      setTaskData(data);
      console.log('Fetched task data:', data);
    } catch (err) {
      console.error("Error fetching task:", err);
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTaskData();
    }
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTaskData();
  };

  const postAssignmentStatus = async (status: string) => {
    if (!id) return;
    setPostingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      await fetchTaskData();
      // Show success modal for marking as done
      if (status === 'done') {
        setStatusModalType('success');
        setStatusModalTitle('Task Completed');
        setStatusModalMessage('The task has been marked as complete successfully.');
        setShowStatusModal(true);
      }
    } catch (err) {
      setStatusModalType('error');
      setStatusModalTitle('Error');
      setStatusModalMessage('Could not update status.');
      setShowStatusModal(true);
    } finally {
      setPostingStatus(false);
    }
  };

  const handleGetMeThere = async () => {
    setShowJourneyDialog(true);
  };

  const openDirections = async () => {
    if (!taskData?.location) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to get directions to the task location.',
          [{ text: 'OK' }]
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude: currentLat, longitude: currentLng } = location.coords;
      const taskLat = parseFloat(taskData.location.latitude);
      const taskLng = parseFloat(taskData.location.longitude);
      const url = Platform.select({
        ios: `maps://app?daddr=${taskLat},${taskLng}&saddr=${currentLat},${currentLng}`,
        android: `google.navigation:q=${taskLat},${taskLng}&origin=${currentLat},${currentLng}`,
      });
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${taskLat},${taskLng}&origin=${currentLat},${currentLng}`;
          await Linking.openURL(webUrl);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location. Please make sure location services are enabled.');
    }
  };

  const handleStartTask = async () => {
    try {
      setIsStartingTask(true);
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: "in_progress" }),
      });

      if (!response.ok) {
        throw new Error('Failed to start task');
      }

      await fetchTaskData();
    } catch (error) {
      console.error('Error starting task:', error);
      setError(error instanceof Error ? error.message : 'Failed to start task');
    } finally {
      setIsStartingTask(false);
    }
  };

  const handleCompleteTask = async () => {
    setShowDoneLoader(true);
    await postAssignmentStatus('done');
    setShowDoneLoader(false);
    setShowReviewSheet(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewMessage.trim()) return;
    setIsSubmittingReview(true);
    try {
      if (!taskData) throw new Error('No task data');
      const payload = {
        task_assignment_id: taskData.task.assignment.id,
        reviewee_id: taskData.user.id,
        rating: reviewRating,
        comment: reviewMessage,
      };
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to submit review');
      setShowReviewSheet(false);
      setReviewRating(0);
      setReviewMessage('');
      setStatusModalType('success');
      setStatusModalTitle('Review Submitted');
      setStatusModalMessage('Thank you for your feedback! Your review has been submitted successfully.');
      setShowStatusModal(true);
    } catch (err) {
      setStatusModalType('error');
      setStatusModalTitle('Error');
      setStatusModalMessage('Could not submit review. Please try again.');
      setShowStatusModal(true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderTaskProgress = () => {
    const isPhysical = taskData?.task.work_mode === "physical";
    const steps = [
      {
        id: 'start',
        title: isPhysical ? 'Arrived at Location' : 'Started Task',
        completed: taskData?.task.status === 'in_progress' || taskData?.task.status === 'done'
      },
      {
        id: 'complete',
        title: 'Task Done',
        completed: taskData?.task.status === 'done'
      }
    ];

    return (
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle} bold>Task Progress</Text>
        <View style={styles.stepsList}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepConnector}>
                {index < steps.length - 1 && <View style={styles.stepLine} />}
                <View style={[
                  styles.stepIcon,
                  step.completed && styles.stepIconCompleted
                ]}>
                  <Ionicons 
                    name={step.completed ? 'checkmark' : 'ellipse-outline'} 
                    size={20} 
                    color={step.completed ? "#fff" : "#666"} 
                  />
                </View>
              </View>
              <View style={styles.stepButton}>
                <Text style={[
                  styles.stepButtonText,
                  step.completed && styles.stepButtonTextCompleted
                ]}>
                  {step.title}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTaskControls = () => {
    const isPhysical = taskData?.task.work_mode === "physical";
    const isInProgress = taskData?.task.status === 'in_progress';
    const isCompleted = taskData?.task.status === 'done';
    const isAssignmentDone = taskData?.task.assignment.status === 'done';

    // If assignment is done but task is not yet marked as done by the poster
    if (isAssignmentDone && !isCompleted) {
      return (
        <View style={styles.floatingControls}>
          <View style={[styles.controlButton, styles.completedButton]}> 
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>
              Task is marked as done. Waiting for the poster to review and mark as completed.
            </Text>
          </View>
        </View>
      );
    }

    if (isCompleted) {
      return (
        <View style={styles.floatingControls}>
          <View style={[styles.controlButton, styles.completedButton]}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Task Done</Text>
          </View>
        </View>
      );
    }

    // Use SlideToComplete for both physical and remote tasks
    if (isPhysical) {
      return (
        <View style={styles.floatingControls}>
          {!isInProgress ? (
            <>
              <Pressable 
                style={[styles.controlButton, styles.primaryButton]} 
                onPress={() => setShowLocationDialog(true)}
                disabled={isStartingTask}
              >
                <Ionicons name="location" size={24} color="#fff" />
                <Text style={styles.controlButtonText}>Are you at the location?</Text>
              </Pressable>
              {showLocationDialog && (
                <View style={styles.locationDialog}>
                  <Text style={styles.dialogTitle} bold>Location Confirmation</Text>
                  <Text style={styles.dialogText}>Are you at the task location?</Text>
                  <View style={styles.dialogButtons}>
                    <Pressable 
                      style={[styles.dialogButton, styles.secondaryButton]} 
                      onPress={() => {
                        setShowLocationDialog(false);
                        handleGetMeThere();
                      }}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.dialogButtonText}>Get Directions</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.dialogButton, styles.primaryButton]} 
                      onPress={async () => {
                        await postAssignmentStatus('in_progress');
                        setShowLocationDialog(false);
                        handleStartTask();
                      }}
                      disabled={isStartingTask || postingStatus}
                    >
                      {isStartingTask || postingStatus ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.dialogButtonText}>Yes, I'm Here</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          ) : (
            <SlideToComplete
              label="Slide to mark as done"
              onSlideComplete={handleCompleteTask}
              loading={showDoneLoader}
              disabled={showDoneLoader}
            />
          )}
        </View>
      );
    }

    // Remote task controls with SlideToComplete
    return (
      <View style={styles.floatingControls}>
        {!isInProgress ? (
          <SlideToComplete
            label="Slide to start task"
            onSlideComplete={handleStartTask}
            loading={isStartingTask}
            disabled={isStartingTask}
          />
        ) : (
          <SlideToComplete
            label="Slide to mark as done"
            onSlideComplete={handleCompleteTask}
            loading={showDoneLoader}
            disabled={showDoneLoader}
          />
        )}
      </View>
    );
  };

  // Redesigned Review Modal
  const renderReviewSheet = () => (
    <Modal
      visible={showReviewSheet}
      animationType="fade"
      transparent
      onRequestClose={() => setShowReviewSheet(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 }}>
            <Ionicons name="star" size={48} color="#FFD700" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Rate & Review</Text>
            <Text style={{ fontSize: 16, color: '#666', marginBottom: 18, textAlign: 'center' }}>How was your experience with the task giver?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
              {[1,2,3,4,5].map((star) => (
                <Pressable key={star} onPress={() => setReviewRating(star)}>
                  <Ionicons
                    name={reviewRating >= star ? 'star' : 'star-outline'}
                    size={36}
                    color={reviewRating >= star ? '#FFD700' : '#ccc'}
                    style={{ marginHorizontal: 2 }}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, minHeight: 80, fontSize: 16, marginBottom: 18, width: '100%' }}
              placeholder="Leave a review message..."
              value={reviewMessage}
              onChangeText={setReviewMessage}
              multiline
              editable={!isSubmittingReview}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Pressable
              style={{ backgroundColor: reviewRating && reviewMessage.trim() ? '#2eac5f' : '#ccc', padding: 16, borderRadius: 12, alignItems: 'center', width: '100%', marginBottom: 4 }}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview || !reviewRating || !reviewMessage.trim()}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Submit Review</Text>
              )}
            </Pressable>
            <TouchableOpacity onPress={() => setShowReviewSheet(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#2eac5f', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2eac5f" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (error || !taskData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error || "Task not found"}</Text>
        <Pressable style={styles.retryButton} onPress={fetchTaskData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { task, location, categories, images, user } = taskData;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle} bold>Task Details</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, styles[`status${task.status}` as keyof StatusStyles]]}>
          <Ionicons 
            name={task.status === 'done' ? 'checkmark-circle' : 'time'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.statusBannerText}>
            {task.status === 'done' ? 'Task Done' : 
             task.status === 'in_progress' ? 'Task in Progress' : 
             'Task Assigned'}
          </Text>
        </View>

        {/* Task Info Card */}
        <View style={styles.taskCard}>
          <Text style={styles.taskTitle} bold>{task.title}</Text>
          <Text style={styles.taskPrice}>{formatPrice(task.assignment.agreed_price)}</Text>
          
          <View style={styles.taskMeta}>
            <View style={styles.taskMetaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.taskMetaText}>
                {task.schedule_type.replace("_", " ")}
              </Text>
            </View>
            <View style={styles.taskMetaItem}>
              <Ionicons name={task.work_mode === 'physical' ? 'location' : 'laptop'} size={16} color="#666" />
              <Text style={styles.taskMetaText}>
                {task.work_mode === 'physical' ? 'On-site' : 'Remote'}
              </Text>
            </View>
          </View>
        </View>

        {/* Task Progress */}
        {renderTaskProgress()}

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} bold>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        {/* Location Card */}
        {task.work_mode === 'physical' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle} bold>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(location.latitude),
                  longitude: parseFloat(location.longitude),
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(location.latitude),
                    longitude: parseFloat(location.longitude),
                  }}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <Text bold style={styles.markerPrice}>
                        {formatPrice(task.assignment.agreed_price)}
                      </Text>
                    </View>
                  </View>
                </Marker>
              </MapView>
            </View>
            <Text style={styles.locationText}>{location.city}</Text>
          </View>
        )}

        {/* Client Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} bold>Client Information</Text>
          <View style={styles.clientInfo}>
            <Image source={{ uri: user.avatar }} style={styles.clientAvatar} />
            <View style={styles.clientDetails}>
              <Text style={styles.clientName} bold>{user.name}</Text>
              {user.rating > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#ffd700" />
                  <Text style={styles.rating}>{user.rating.toFixed(1)}</Text>
                  {user.completed_tasks && (
                    <Text style={styles.completedTasks}>
                      • {user.completed_tasks} completed
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        <Text>Status: {taskData.task.status}</Text>
        <Text>Assignment Status: {taskData.task.assignment.status}</Text>
      </ScrollView>

      {/* Floating Task Controls */}
      {renderTaskControls()}

      {showJourneyDialog && (
        <View style={styles.locationDialog}>
          <Text style={styles.dialogTitle} bold>Start Journey</Text>
          <Text style={styles.dialogText}>Have you started your journey to the task location?</Text>
          <View style={styles.dialogButtons}>
            <Pressable
              style={[styles.dialogButton, styles.secondaryButton]}
              onPress={() => setShowJourneyDialog(false)}
              disabled={postingStatus}
            >
              <Text style={styles.dialogButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.dialogButton, styles.primaryButton]}
              onPress={async () => {
                await postAssignmentStatus('on_the_way');
                setShowJourneyDialog(false);
                openDirections();
              }}
              disabled={postingStatus}
            >
              {postingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.dialogButtonText}>Yes, Start Journey</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {renderReviewSheet()}
      <StatusModal
        visible={showStatusModal}
        type={statusModalType}
        title={statusModalTitle}
        message={statusModalMessage}
        onClose={() => {
          setShowStatusModal(false);
          if (statusModalType === 'success' && statusModalTitle === 'Review Submitted') {
            router.replace('/');
          }
        }}
      />
    </View>
  );
} 