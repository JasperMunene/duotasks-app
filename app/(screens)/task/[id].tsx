import { API_BASE_URL } from "@/app/config";
import { useAuth } from "@/app/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Text } from "../../components/Text";
import { useNotification } from "../../context/NotificationContext";
import { formatPrice } from "../../utils/format";

// Type definitions based on your API response
interface TaskData {
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
    preferred_start_time: string | null;
    preferred_end_time: string | null;
    status: string;
    work_mode: string;
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
  metadata: {
    views: number;
    popularity_score: number;
  };
}

interface BidResponse {
  message: string;
  bid_id: number;
  status: string;
}

export default function TaskDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [bidAmount, setBidAmount] = React.useState("");
  const [bidMessage, setBidMessage] = React.useState("");
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const { accessToken } = useAuth();

  // Animation values for modals
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Modal setup
  const [showBidModal, setShowBidModal] = useState(false);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTaskData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  // Modal animation functions
  const showModal = (isSuccess: boolean, message: string) => {
    setModalMessage(message);
    if (isSuccess) {
      setShowSuccessModal(true);
    } else {
      setShowErrorModal(true);
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      setShowErrorModal(false);
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    });
  };

  const handleBidSubmit = async (amount: number, message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          message,
        }),
      });

      const responseData = await response.json();

      if (response.status === 201) {
        setShowBidModal(false);
        showModal(true, responseData.message || "Bid submitted successfully!");

        if (taskData) {
          showNotification({
            title: "Bid Submitted",
            message: "Your bid has been sent to the task poster",
            image: taskData.user.avatar,
          });
        }
        router.push(`/(tabs)`);
      } else {
        showModal(
          false,
          responseData.message ||
            responseData.error ||
            "Failed to submit bid. Please try again."
        );
      }
    } catch (error) {
      console.error("Bid submission error:", error);
      showModal(
        false,
        "Network error. Please check your connection and try again."
      );
    }
  };

  const handlePresentModal = useCallback(() => {
    if (taskData?.task.status === "open") {
      setShowBidModal(true);
    }
  }, [taskData]);

  const handleShare = async () => {
    if (!taskData) return;

    try {
      await Share.share({
        title: taskData.task.title,
        message: `Check out this task: ${
          taskData.task.title
        }\nBudget: ${formatPrice(
          parseFloat(taskData.task.budget)
        )}\nLocation: ${taskData.location.city}\n\nPosted by ${
          taskData.user.name
        }`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the task");
    }
  };

  const handleGetMeThere = () => {
    if (!taskData?.location) return;
    
    const latitude = parseFloat(taskData.location.latitude);
    const longitude = parseFloat(taskData.location.longitude);
    const url = Platform.select({
      ios: `maps:${latitude},${longitude}?q=${taskData.location.city}`,
      android: `geo:${latitude},${longitude}?q=${taskData.location.city}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

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

  const { task, location, categories, images, user, metadata } = taskData;
  const isTaskOpen = task.status === "open";

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
        {/* Poster Section */}
        <Pressable 
          style={styles.posterSection}
          onPress={() => router.push(`/user/${user.id}`)}
        >
          <Image source={{ uri: user.avatar }} style={styles.posterImage} />
          <View style={styles.posterInfo}>
            <Text medium style={styles.posterName}>
              {user.name}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.location}>{location.city || null}</Text>
            </View>
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
          <View style={styles.viewsContainer}>
            <Ionicons name="eye-outline" size={16} color="#666" />
            <Text style={styles.viewsText}>{metadata.views} views</Text>
          </View>
        </Pressable>

        {/* Task Images */}
        {images.length > 0 && (
          <ScrollView
            horizontal
            style={styles.imagesContainer}
            showsHorizontalScrollIndicator={false}
          >
            {images.map((image) => (
              <Image
                key={image.id}
                source={{ uri: image.image_url }}
                style={styles.taskImage}
              />
            ))}
          </ScrollView>
        )}

        {/* Task Section */}
        <View style={styles.taskSection}>
          <View style={styles.priceStatusRow}>
            <Text bold style={styles.price}>
              {formatPrice(parseFloat(task.budget))}
            </Text>
            <View
              style={[
                styles.statusBadge,
                (styles as any)[`status${task.status.charAt(0).toUpperCase() + task.status.slice(1)}`],
              ]}
            >
              <Text style={styles.statusText}>
                {task.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{task.title}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {categories.map((cat) => cat.name).join(", ")}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {getTimeAgo(task.created_at)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#2eac5f" />
              <Text style={[styles.detailText, { color: "#2eac5f" }]}>
                {task.schedule_type.replace("_", " ")}
              </Text>
            </View>
          </View>

          {task.specific_date && (
            <View style={styles.scheduleInfo}>
              <Ionicons name="calendar" size={16} color="#2eac5f" />
              <Text style={styles.scheduleText}>
                Scheduled for: {formatDate(task.specific_date)}
              </Text>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text medium style={styles.sectionTitle}>
            Description
          </Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text medium style={styles.sectionTitle}>
            Location
          </Text>
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
                      {formatPrice(parseFloat(task.budget))}
                    </Text>
                  </View>
                </View>
              </Marker>
            </MapView>
          </View>
        </View>
      </ScrollView>

      {/* Footer for open tasks */}
      {taskData?.task.status === "open" && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.applyButton]}
            onPress={handlePresentModal}
          >
            <Text style={styles.applyButtonText}>Place a Bid</Text>
          </Pressable>
        </View>
      )}

      {/* Bidding Modal */}
      <Modal
        visible={showBidModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowBidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop}
            onPress={() => setShowBidModal(false)}
          />
          <View style={styles.bidModalContainer}>
            <View style={styles.modalHeader}>
              <Text bold style={styles.bottomSheetTitle}>
                Place Your Bid
              </Text>
              <Pressable onPress={() => setShowBidModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.bottomSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.bidForm}>
                <Text medium style={styles.inputLabel}>
                  Your Bid Amount
                </Text>
                <View style={styles.bidInputContainer}>
                  <Text style={styles.currencySymbol}>KES</Text>
                  <TextInput
                    style={styles.bidInput}
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    returnKeyType="next"
                    editable={!isSubmittingBid}
                  />
                </View>
                <Text style={styles.helperText}>
                  Minimum bid: {formatPrice(parseFloat(task.budget))}
                </Text>

                <Text medium style={styles.inputLabel}>
                  Message (Optional)
                </Text>
                <TextInput
                  style={styles.messageInput}
                  value={bidMessage}
                  onChangeText={setBidMessage}
                  placeholder="Tell the task poster why you're the best person for this job"
                  placeholderTextColor="#999"
                  multiline
                  textAlignVertical="top"
                  numberOfLines={6}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  editable={!isSubmittingBid}
                />

                <Pressable
                  style={[
                    styles.submitButton,
                    isSubmittingBid && styles.submitButtonDisabled,
                  ]}
                  onPress={async () => {
                    if (isSubmittingBid) return;
                    const amount = parseFloat(bidAmount);
                    if (isNaN(amount) || amount < parseFloat(task.budget)) {
                      showModal(false, `Please enter a valid bid amount (minimum: ${formatPrice(parseFloat(task.budget))})`);
                      return;
                    }
                    setIsSubmittingBid(true);
                    try {
                      await handleBidSubmit(amount, bidMessage);
                    } finally {
                      setIsSubmittingBid(false);
                    }
                  }}
                  disabled={isSubmittingBid}
                >
                  {isSubmittingBid ? (
                    <View style={styles.submitButtonLoading}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.submitButtonText}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Bid</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              styles.successModal,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#2eac5f" />
            </View>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <Pressable style={styles.modalButton} onPress={hideModal}>
              <Text style={styles.modalButtonText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="none"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              styles.errorModal,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <View style={styles.modalIcon}>
              <Ionicons name="close-circle" size={60} color="#ff6b6b" />
            </View>
            <Text style={styles.modalTitle}>Oops!</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <Pressable
              style={[styles.modalButton, styles.errorButton]}
              onPress={hideModal}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
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
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: '#fff',
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
  },
  posterSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  posterImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  posterInfo: {
    flex: 1,
  },
  posterName: {
    fontSize: 16,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#666",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  completedTasks: {
    fontSize: 12,
    color: "#999",
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: "#666",
  },
  imagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  taskImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  taskSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  priceStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    color: "#2eac5f",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: "#e7f5e7",
  },
  statusClosed: {
    backgroundColor: "#ffe7e7",
  },
  statusCompleted: {
    backgroundColor: "#e7f0ff",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2eac5f",
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  scheduledText: {
    color: "#2eac5f",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f9f0",
    borderRadius: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: "#2eac5f",
    fontWeight: "600",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
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
  applyButton: {
    backgroundColor: '#2eac5f',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bidModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 40,
    maxHeight: '80%',
    width: '100%',
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bottomSheetContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bottomSheetTitle: {
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  bidForm: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  bidInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 12,
    color: "#000",
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  submitButton: {
    backgroundColor: "#2eac5f",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: "center",
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successModal: {
    borderTopWidth: 4,
    borderTopColor: "#2eac5f",
  },
  errorModal: {
    borderTopWidth: 4,
    borderTopColor: "#ff6b6b",
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: "#2eac5f",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
  },
  errorButton: {
    backgroundColor: "#ff6b6b",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  actionSheetContent: {
    padding: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionSheetIndicator: {
    backgroundColor: '#e0e0e0',
    width: 40,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
