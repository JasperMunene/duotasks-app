import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/format";
import TaskFilters from "./TaskFilters";
import { Text } from "./Text";

const filterTabs = [
  { id: "all", label: "All Tasks" },
  { id: "physical", label: "Physical" },
  { id: "remote", label: "Remote" },
];

// Default filter parameters
const defaultFilters: TaskFilters = {
  work_mode: "physical",
  category_ids: [],
  min_price: 0,
  max_price: 10000,
  city: "",
  radius: 50.0,
  lat: 0,
  lon: 0,
  sort: "recent",
};

// API Types
export interface ApiTask {
  id: number;
  title: string;
  description: string;
  budget: string;
  status: "open" | "in_progress" | "completed";
  schedule_type: "specific_day" | "before_day" | "flexible";
  specific_date: string | null;
  deadline_date: string | null;
  created_at: string;
  updated_at: string;
  location: {
    id: number;
    city: string;
    latitude: string;
    longitude: string;
  } | null;
  categories: {
    id: number;
    name: string;
  }[];
  preferred_time: {
    start: string | null;
    end: string | null;
  };
  user: {
    id: number;
    name: string;
    image: string;
  };
}

export interface ApiResponse {
  tasks: ApiTask[];
  next_cursor: string | null;
}

// Local Task interface for UI
export interface Task {
  id: string;
  title: string;
  price: number;
  location: {
    id: number;
    city: string;
    latitude: string;
    longitude: string;
  } | null;
  status: "open" | "in_progress" | "completed";
  type: "physical" | "remote";
  poster: {
    name: string;
    image: string;
  };
  category: string;
  timePosted: string;
  biddable: boolean;
  description: string;
  offerCount?: number;
}

// API Request parameters
interface TaskFilters {
  work_mode: "physical" | "remote" | "all";
  category_ids: number[];
  min_price: number;
  max_price: number;
  city: string;
  radius: number;
  lat: number;
  lon: number;
  sort: "recent" | "price_low" | "price_high";
  search?: string;
  cursor?: string;
}

// Transform API task to local task format
export const transformApiTask = (apiTask: ApiTask): Task => {
  const timeAgo = getTimeAgo(apiTask.created_at);
  const workMode = apiTask.location ? "physical" : "remote";
  const location = apiTask.location ? apiTask.location.city : "Remote";
  const category =
    apiTask.categories.length > 0
      ? apiTask.categories[0].name
      : "Uncategorized";

  return {
    id: apiTask.id.toString(),
    title: apiTask.title,
    price: parseFloat(apiTask.budget),
    location: {
      id: apiTask.location?.id || 0,
      city: location,
      latitude: apiTask.location?.latitude || "",
      longitude: apiTask.location?.longitude || "",
    },
    status: apiTask.status,
    type: workMode,
    poster: {
      name: apiTask.user.name,
      image: apiTask.user.image,
    },
    category,
    timePosted: timeAgo,
    biddable: true,
    description: apiTask.description,
    offerCount: Math.floor(Math.random() * 50) + 1, // Mock data
  };
};

// Helper function to calculate time ago
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const taskDate = new Date(dateString);
  const diffInMinutes = Math.floor(
    (now.getTime() - taskDate.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  typeFilterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  typeFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
  },
  selectedTypeFilter: {
    backgroundColor: "#2eac5f",
  },
  typeIcon: {
    marginRight: 4,
  },
  typeFilterText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTypeText: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ff4444",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  activeFilterTab: {
    backgroundColor: "#2eac5f",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterText: {
    color: "#fff",
  },
  taskList: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
  },
  taskDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  taskFooter: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadge: {
    backgroundColor: "rgba(46, 172, 95, 0.1)",
  },
  statusText: {
    fontSize: 15,
    color: "#2eac5f",
  },
  offersContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  offersText: {
    fontSize: 15,
    color: "#666",
  },
  avatarContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  posterImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  loadMoreButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 16,
    color: "#2eac5f",
    fontWeight: "600",
  },
});

// Add skeleton styles
const skeletonStyles = StyleSheet.create({
  skeletonCard: {
    opacity: 0.5,
  },
  skeletonBlock: {
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  skeletonHeader: {
    height: 20,
    marginBottom: 12,
    width: '70%',
  },
  skeletonPrice: {
    height: 18,
    width: 60,
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  skeletonDetail: {
    height: 14,
    width: '60%',
    marginBottom: 8,
  },
  skeletonFooter: {
    height: 16,
    width: '40%',
    marginTop: 8,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});

export interface TaskListProps {
  onTasksChange?: (tasks: Task[]) => void;
}

export default function TaskList({ onTasksChange }: TaskListProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(defaultFilters);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);

  const router = useRouter();

  // Get user's current location and city
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Get city name using reverse geocoding
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      setUserLocation({ latitude, longitude });
      
      // Update filters with location data
      setCurrentFilters(prev => ({
        ...prev,
        lat: latitude,
        lon: longitude,
        city: address?.city || address?.region || '',
      }));
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Fetch tasks from API

  const fetchTasks = async (filters: Partial<TaskFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);

      const finalFilters = { ...currentFilters, ...filters };

      // If it's a physical task and we have user location, use it
      if (finalFilters.work_mode === 'physical' && userLocation) {
        finalFilters.lat = userLocation.latitude;
        finalFilters.lon = userLocation.longitude;
      } else if (finalFilters.work_mode === 'remote') {
        // For remote tasks, remove location-based filters
        const { lat, lon, city, radius, ...remoteFilters } = finalFilters;
        Object.assign(finalFilters, remoteFilters);
      }

      const requestBody: Record<string, any> = {
        ...finalFilters,
        work_mode: finalFilters.work_mode === "all" ? undefined : finalFilters.work_mode,
      };

      Object.keys(requestBody).forEach((key) => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });

      console.log("Fetching tasks with filters:", requestBody);
      const queryString = new URLSearchParams(
        Object.entries(requestBody).flatMap(([key, value]) =>
          Array.isArray(value)
            ? value.map((v) => [key, v.toString()])
            : [[key, value.toString()]]
        )
      ).toString();

      const response = await fetch(`${API_BASE_URL}/tasks?${queryString}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      const transformedTasks = data.tasks.map(transformApiTask);

      if (filters.cursor) {
        setTasks((prevTasks) => [...prevTasks, ...transformedTasks]);
      } else {
        setTasks(transformedTasks);
      }
      setNextCursor(data.next_cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get location on initial load
  useEffect(() => {
    getUserLocation();
  }, []);

  // Initial load with location
  useEffect(() => {
    if (userLocation || activeFilter === 'remote') {
      fetchTasks();
    }
  }, [userLocation, activeFilter]);

  // Handle filter changes
  useEffect(() => {
    if (!isSearchVisible) {
      const workMode =
        activeFilter === "all"
          ? "all"
          : (activeFilter as "physical" | "remote");
      fetchTasks({ work_mode: workMode });
    }
  }, [activeFilter, isSearchVisible]);

  // Handle search
  useEffect(() => {
    if (isSearchVisible) {
      const delayedSearch = setTimeout(() => {
        const workMode =
          selectedType === "all"
            ? "all"
            : (selectedType as "physical" | "remote");
        fetchTasks({ ...currentFilters,
          work_mode: workMode,
          search: searchQuery.trim() || undefined,
        });
      }, 500);

      return () => clearTimeout(delayedSearch);
    }
  }, [searchQuery, selectedType, isSearchVisible, currentFilters]);

  // Update tasks effect
  useEffect(() => {
    if (onTasksChange) {
      onTasksChange(tasks);
    }
  }, [tasks, onTasksChange]);

  const handleFilterPress = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filterId);
  };

  const handleTaskPress = (taskId: string) => {
    console.log("clicked task ", taskId);
    router.push(`/(screens)/task/${taskId}`);
  };

  const toggleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setActiveFilter("all");
    } else {
      setSearchQuery("");
      setSelectedType("all");
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      const workMode = isSearchVisible
        ? selectedType === "all"
          ? "all"
          : (selectedType as "physical" | "remote")
        : activeFilter === "all"
        ? "all"
        : (activeFilter as "physical" | "remote");

      fetchTasks({
        ...currentFilters,
        work_mode: workMode,
        search:
          isSearchVisible && searchQuery.trim()
            ? searchQuery.trim()
            : undefined,
        cursor: nextCursor,
      });
    }
  };

  const handleFiltersApply = (filters: any) => {
    setCurrentFilters(filters);
    fetchTasks(filters);
  };

  // Skeleton loader for tasks
  const SKELETON_COUNT = 6;
  const renderSkeleton = () => (
    Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
      <View key={idx} style={[styles.taskCard, skeletonStyles.skeletonCard]}> 
        <View style={styles.taskContent}>
          {/* Header with title and price */}
          <View style={styles.taskHeader}>
            <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonHeader]} />
            <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonPrice]} />
          </View>
          {/* Task details */}
          <View style={styles.taskDetails}>
            <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
            <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
            <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
          </View>
          {/* Footer */}
          <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonFooter]} />
        </View>
        {/* Avatar */}
        <View style={skeletonStyles.skeletonAvatar} />
      </View>
    ))
  );

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text bold style={{ fontSize: 24 }}>
            Tasks for you
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
          <Text style={styles.errorTitle}>Failed to load tasks</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchTasks()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text bold style={{ fontSize: 24 }}>
          Tasks for you
        </Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.filterButton} onPress={() => setIsFiltersVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#000" />
          </Pressable>
          <Pressable style={styles.searchButton} onPress={toggleSearch}>
            <Ionicons
              name={isSearchVisible ? "close-outline" : "search-outline"}
              size={24}
              color="#000"
            />
          </Pressable>
        </View>
      </View>

      {isSearchVisible ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks, locations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>
          <View style={styles.typeFilterContainer}>
            {["all", "physical", "remote"].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeFilterButton,
                  selectedType === type && styles.selectedTypeFilter,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons
                  name={
                    type === "physical"
                      ? "walk-outline"
                      : type === "remote"
                      ? "laptop-outline"
                      : "apps-outline"
                  }
                  size={16}
                  color={selectedType === type ? "#fff" : "#666"}
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeFilterText,
                    selectedType === type && styles.selectedTypeText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.filterContainer}>
          {filterTabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                styles.filterTab,
                activeFilter === tab.id && styles.activeFilterTab,
              ]}
              onPress={() => handleFilterPress(tab.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === tab.id && styles.activeFilterText,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView style={styles.taskList}>
        {loading && tasks.length === 0 ? (
          <View>{renderSkeleton()}</View>
        ) : tasks.length > 0 ? (
          <>
            {tasks.map((task) => (
              <Pressable
                key={task.id}
                style={styles.taskCard}
                onPress={() => handleTaskPress(task.id)}
              >
                <View style={styles.taskContent}>
                  {/* Header with title and price */}
                  <View style={styles.taskHeader}>
                    <Text bold style={styles.title} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text bold style={styles.price}>
                      {formatPrice(task.price)}
                    </Text>
                  </View>

                  {/* Task details */}
                  <View style={styles.taskDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name={
                          task.type === "remote"
                            ? "laptop-outline"
                            : "location-outline"
                        }
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.detailText}>
                        {task.type === "remote" ? "Remote" : task.location?.city || "No location"}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.detailText}>Flexible</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.detailText}>Anytime</Text>
                    </View>
                  </View>

                  {/* Footer with status and offers */}
                  <View style={styles.taskFooter}>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusBadge]}>
                        <Text bold style={styles.statusText}>
                          Open
                        </Text>
                      </View>
                    </View>

                    {task.offerCount && (
                      <>
                        <View style={styles.offersContainer}>
                          <Text bold style={styles.offersText}>
                            ·
                          </Text>
                        </View>
                        <View style={styles.offersContainer}>
                          <Text style={styles.offersText}>
                            {task.offerCount} offers
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                {/* Avatar positioned absolutely */}
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: task.poster.image }}
                    style={styles.posterImage}
                  />
                </View>
              </Pressable>
            ))}

            {/* Load More Button */}
            {nextCursor && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#2eac5f" />
                ) : (
                  <Text style={styles.loadMoreText}>Load More Tasks</Text>
                )}
              </Pressable>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={32} color="#666" />
            </View>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              Try different keywords or filters
            </Text>
          </View>
        )}
      </ScrollView>

      <TaskFilters
        visible={isFiltersVisible}
        onClose={() => setIsFiltersVisible(false)}
        onApply={handleFiltersApply}
        initialFilters={currentFilters}
      />
    </View>
  );
}
