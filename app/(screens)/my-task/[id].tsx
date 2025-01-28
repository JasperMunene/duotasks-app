import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import SlideToComplete from "../../components/SlideToComplete";
import { Text } from "../../components/Text";
import TopUpModal from "../../components/TopUpModal";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { useWallet } from "../../context/WalletContext";
import { formatPrice } from "../../utils/format";

type Task = {
  id: number;
  status: string;
  work_mode: "physical" | "remote";
  deadline_date: string | null;
  description: string;
  updated_at: string;
  budget: number;
  preferred_time: string | null;
  created_at: string;
  title: string;
  schedule_type: string;
  specific_date: string | null;
  assignment?: {
    id: number;
    status: string;
  };
};

type Location = {
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  city: string;
  area: string | null;
};

type AssignedUser = {
  id: number;
  name: string;
  rating: number;
  completed_tasks: number | null;
  avatar: string;
};

type Bid = {
  bidder_image: string;
  bidder_name: string;
  bidder_id: number;
  bid_id: number;
  bid_text: string;
  bid_amount: number;
};

type TaskResponse = {
  task: Task;
  location: Location;
  assigned_user?: AssignedUser;
  bids?: Bid[];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "#2eac5f";
    case "in_progress":
      return "#2563eb";
    default:
      return "#666";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return "checkmark-circle";
    case "in_progress":
      return "time";
    default:
      return "ellipsis-horizontal-circle";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    color: '#1f2937',
  },
  content: {
    padding: 16,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#f0fdf4',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2eac5f',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1f2937',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 15,
    color: '#4b5563',
  },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#2eac5f',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  userRating: {
    fontSize: 14,
    color: '#4b5563',
  },
  rateButton: {
    backgroundColor: '#2eac5f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  bidInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bidText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2eac5f',
  },
  bidActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  bidActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#2eac5f',
  },
  rejectButton: {
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#fff',
  },
  rejectButtonText: {
    color: '#4b5563',
  },
  completeButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 56,
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  bottomSheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 200,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    zIndex: 201,
    minHeight: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  bottomSheetSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  fullScreenSheetBackdrop: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  fullScreenSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    zIndex: 101,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
  },
  input: {
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2eac5f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#a7f3d0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

// Add skeleton styles
const skeletonStyles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
    opacity: 0.5,
  },
  skeletonBlock: {
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonHeader: {
    height: 24,
    width: '60%',
  },
  skeletonSection: {
    height: 16,
    width: '80%',
  },
  skeletonDetail: {
    height: 14,
    width: '40%',
    marginBottom: 8,
  },
  skeletonBid: {
    height: 18,
    width: '50%',
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
});

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [taskData, setTaskData] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTopUpVisible, setIsTopUpVisible] = useState(false);
  const [pendingBidId, setPendingBidId] = useState<number | null>(null);
  const [requiredAmount, setRequiredAmount] = useState<number>(0);
  const [isAcceptingBid, setIsAcceptingBid] = useState(false);
  const { user } = useAuth();
  const { accessToken } = useAuth();
  const { walletData } = useWallet();
  const [isCompletingTask, setIsCompletingTask] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/posted/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch task details");
      }
      const data = await response.json();
      setTaskData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    setIsCompletingTask(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!response.ok) {
        throw new Error('Failed to complete task');
      }
      
      if (taskData?.assigned_user && taskData?.task.assignment) {
        router.push({
          pathname: `/(screens)/my-task/rate/${id}` as any,
          params: { 
            assigned_user: JSON.stringify(taskData.assigned_user),
            task_assignment_id: taskData.task.assignment.id,
          }
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setIsCompletingTask(false);
    }
  };

  const handleRateUser = async () => {
    // This is no longer needed
  };

  const handleAcceptBid = async (bidId: number) => {
    try {
      setIsAcceptingBid(true);
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bid_id: bidId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 402 && data.error === 'Insufficient balance') {
          // Store the bid ID and required amount for later use
          setPendingBidId(bidId);
          setRequiredAmount(data.required_funding);
          setIsTopUpVisible(true);
          return;
        }
        throw new Error(data.message || 'Failed to accept bid');
      }
      
      // Refresh task details after accepting bid
      fetchTaskDetails();
    } catch (error) {
      console.error('Error accepting bid:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept bid');
    } finally {
      setIsAcceptingBid(false);
    }
  };

  const handleTopUpSuccess = async () => {
    if (pendingBidId) {
      // Retry accepting the bid after successful top-up
      await handleAcceptBid(pendingBidId);
      setPendingBidId(null);
    }
  };

  const handleRejectBid = async (bidId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/reject_bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ bid_id: bidId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject bid');
      }
      
      // Update local state to remove the rejected bid
      setTaskData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          bids: prevData.bids?.filter(bid => bid.bid_id !== bidId)
        };
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
    }
  };

  // Skeleton loader for task detail
  const SKELETON_COUNT = 2;
  const renderSkeleton = () => (
    <View style={{ width: '100%', alignItems: 'center', paddingTop: 40 }}>
      {/* Task Card Skeleton */}
      <View style={skeletonStyles.skeletonCard}>
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonHeader]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonSection]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonSection]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
      </View>
      {/* Bid Card Skeletons */}
      {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
        <View key={idx} style={skeletonStyles.skeletonCard}>
          <View style={skeletonStyles.skeletonAvatar} />
          <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonBid]} />
          <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonBid]} />
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        {renderSkeleton()}
      </View>
    );
  }

  if (error || !taskData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error || "Failed to load task"}</Text>
      </View>
    );
  }

  const { task, location, assigned_user, bids } = taskData;
  const isAssignmentDone = task.assignment?.status === "done";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4b5563" />
        </Pressable>
        <Text style={styles.title}>{task.title}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(task.status)}15` }]}>
            <Ionicons name={getStatusIcon(task.status)} size={20} color={getStatusColor(task.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
              {task.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={20} color="#2eac5f" />
              <Text style={styles.detailText}>{formatPrice(task.budget)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#2eac5f" />
              <Text style={styles.detailText}>{task.schedule_type}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#2eac5f" />
              <Text style={styles.detailText}>{task.work_mode}</Text>
            </View>
            {task.deadline_date && (
              <View style={styles.detailItem}>
                <Ionicons name="hourglass-outline" size={20} color="#2eac5f" />
                <Text style={styles.detailText}>{task.deadline_date}</Text>
              </View>
            )}
          </View>
        </View>

        {task.work_mode === "physical" && location.latitude && location.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                />
              </MapView>
            </View>
            <Text style={styles.locationText}>
              {[location.area, location.city, location.state, location.country]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        )}

        {(task.status === "completed" || isAssignmentDone) && assigned_user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned User</Text>
            <View style={styles.userCard}>
              <Image source={{ uri: assigned_user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{assigned_user.name}</Text>
                <Text style={styles.userRating}>
                  Rating: {assigned_user.rating.toFixed(1)} ({assigned_user.completed_tasks || 0} tasks)
                </Text>
              </View>
            </View>
          </View>
        )}

        {task.status === "open" && bids && bids.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bids ({bids.length})</Text>
            {bids.map((bid) => (
              <View key={bid.bid_id} style={styles.bidCard}>
                <View style={styles.bidderInfo}>
                  <Image source={{ uri: bid.bidder_image }} style={styles.bidderAvatar} />
                  <View style={styles.bidInfo}>
                    <Text style={styles.bidderName}>{bid.bidder_name}</Text>
                    <Text style={styles.bidText}>{bid.bid_text}</Text>
                    <Text style={styles.bidAmount}>{formatPrice(bid.bid_amount ?? 0)}</Text>
                  </View>
                </View>
                <View style={styles.bidActions}>
                  <Pressable 
                    style={[styles.bidActionButton, styles.acceptButton]}
                    onPress={() => handleAcceptBid(bid.bid_id)}
                    disabled={isAcceptingBid}
                  >
                    {isAcceptingBid ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.actionButtonText, styles.acceptButtonText]}>Accept</Text>
                    )}
                  </Pressable>
                  <Pressable 
                    style={[styles.bidActionButton, styles.rejectButton]}
                    onPress={() => handleRejectBid(bid.bid_id)}
                    disabled={isAcceptingBid}
                  >
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {isAssignmentDone && task.status !== "completed" && (
        <View style={styles.floatingButtonContainer}>
          <SlideToComplete
            label="Slide to Complete Task"
            onSlideComplete={handleCompleteTask}
            loading={isCompletingTask}
            disabled={isCompletingTask}
          />
        </View>
      )}

      <TopUpModal 
        isVisible={isTopUpVisible}
        mpesa_number={walletData?.account_number || ''}
        onClose={() => {
          setIsTopUpVisible(false);
          setPendingBidId(null);
        }}
        onSuccess={handleTopUpSuccess}
        initialAmount={requiredAmount}
        message={`You need to top up KES ${requiredAmount.toLocaleString()} to assign this task. This amount will be held in escrow until the task is completed.`}
      />
    </View>
  );
} 