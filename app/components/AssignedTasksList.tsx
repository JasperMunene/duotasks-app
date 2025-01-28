import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { formatPrice } from "../utils/format";
import { Text } from "./Text";

interface AssignedTask {
  id: number;
  status: string;
  agreed_price: number;
  user: {
    id: number;
    name: string;
    avator: string;
  };
  task_title: string;
  task_description: string;
  schedule_type: string;
  specific_date: string | null;
  deadline_date: string | null;
  preferred_time: string | null;
  work_mode: "physical" | "remote";
}

type AssignedTasksListProps = {
  tasks: AssignedTask[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
};

// Add skeleton styles
const skeletonStyles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#fff',
    top: 70,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    opacity: 0.5,
    position: 'relative',
  },
  skeletonBlock: {
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  skeletonHeader: {
    height: 18,
    width: '60%',
    marginBottom: 10,
  },
  skeletonPrice: {
    height: 16,
    width: 50,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  skeletonDetail: {
    height: 12,
    width: '40%',
    marginBottom: 8,
  },
  skeletonFooter: {
    height: 14,
    width: '30%',
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

export function AssignedTasksList({ tasks, loading, error, onRefresh, refreshing }: AssignedTasksListProps) {
  const router = useRouter();
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const isControlledRefreshing = typeof refreshing === "boolean";
  const isRefreshing = isControlledRefreshing ? refreshing : internalRefreshing;

  const handleRefresh = async () => {
    if (onRefresh) {
      if (!isControlledRefreshing) {
        setInternalRefreshing(true);
      }
      try {
        await onRefresh();
      } finally {
        if (!isControlledRefreshing) {
          setInternalRefreshing(false);
        }
      }
    }
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

  // Skeleton loader for assigned tasks
  const SKELETON_COUNT = 5;
  const renderSkeleton = () => (
    Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
      <View key={idx} style={skeletonStyles.skeletonCard}>
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonHeader]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonPrice]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonDetail]} />
        <View style={[skeletonStyles.skeletonBlock, skeletonStyles.skeletonFooter]} />
        <View style={skeletonStyles.skeletonAvatar} />
      </View>
    ))
  );

  if (loading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        {renderSkeleton()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl
          refreshing={!!isRefreshing}
          onRefresh={handleRefresh}
          colors={["#2eac5f"]}
          tintColor="#2eac5f"
        />
      }
      renderItem={({ item: task }) => (
        <Pressable
          style={styles.taskCard}
          onPress={() => router.push(`/(screens)/assigned-task/${task.id}`)}
        >
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <Text bold style={styles.title} numberOfLines={1}>
                {task.task_title}
              </Text>
              <Text bold style={styles.price}>
                {formatPrice(task.agreed_price)}
              </Text>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {task.task_description}
            </Text>

            <View style={styles.taskDetails}>
              <View style={styles.detailRow}>
                <Ionicons
                  name={task.work_mode === "remote" ? "laptop-outline" : "location-outline"}
                  size={14}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  {task.work_mode === "remote" ? "Remote" : "Physical"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.detailText}>
                  {task.schedule_type.charAt(0).toUpperCase() + task.schedule_type.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.taskFooter}>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(task.status)}15` }]}>
                  <Ionicons name={getStatusIcon(task.status)} size={14} color={getStatusColor(task.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.avatarContainer}>
            <Image source={{ uri: task.user.avator }} style={styles.posterImage} />
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="briefcase-outline" size={32} color="#666" />
          </View>
          <Text style={styles.emptyTitle}>No assigned tasks</Text>
          <Text style={styles.emptySubtitle}>
            Tasks assigned to you will appear here
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  taskContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    color: "#2eac5f",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  taskDetails: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
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
  emptyState: {
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
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
}); 