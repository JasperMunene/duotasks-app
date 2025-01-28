import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Task } from "../types/Task";
import { TaskItem } from "./TaskItem";
import { Text } from "./Text";

const { width } = Dimensions.get('window');
const TAB_WIDTH = (width - 45) / 4; // Account for container padding

type PostedTasksListProps = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void>;
};

const STATUS_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

// Add skeleton styles
const skeletonStyles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    opacity: 0.5,
    position: 'relative',
    width: '100%',
    top: 70,
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

export function PostedTasksList({ tasks, loading, error, onRefresh }: PostedTasksListProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState('open');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleStatusChange = (status: string) => {
    const index = STATUS_TABS.findIndex(tab => tab.id === status);
    if (index !== -1) {
      Animated.spring(slideAnim, {
        toValue: index * TAB_WIDTH,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      setActiveStatus(status);
    }
  };

  const handleTaskPress = (taskId: number) => {
    router.push(`/my-task/${taskId}`);
  };

  const groupTasks = (tasksToGroup: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    tasksToGroup.forEach(task => {
      if (!grouped[task.work_mode]) {
        grouped[task.work_mode] = [];
      }
      grouped[task.work_mode].push(task);
    });
    return grouped;
  };

  const filteredTasks = tasks.filter(task => {
    if (activeStatus === 'assigned') {
      return task.status === 'assigned' && task.assignment;
    }
    return task.status === activeStatus;
  });
  
  const groupedTasks = groupTasks(filteredTasks);

  const statusCounts: { [key: string]: number } = STATUS_TABS.reduce((acc, tab) => {
    if (tab.id === 'assigned') {
      acc[tab.id] = tasks.filter(task => task.status === 'assigned' && task.assignment).length;
    } else {
      acc[tab.id] = tasks.filter(task => task.status === tab.id).length;
    }
    return acc;
  }, {} as { [key: string]: number });

  // Skeleton loader for posted tasks
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

  if (loading && !refreshing) {
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
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <Animated.View
            style={[
              styles.slidingTab,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          />
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.id];
            return (
              <Pressable
                key={tab.id}
                style={styles.tabButton}
                onPress={() => handleStatusChange(tab.id)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeStatus === tab.id && styles.activeTabText,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                  {count > 0 ? ` (${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={Object.keys(groupedTasks)}
        keyExtractor={(work_mode) => work_mode}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2eac5f"]}
            tintColor="#2eac5f"
          />
        }
        renderItem={({ item: work_mode }) => (
          <View style={styles.workModeGroup}>
            <Text style={styles.workModeTitle}>{work_mode.toUpperCase()}</Text>
            {groupedTasks[work_mode].map((task) => (
              <Pressable
                key={task.id}
                onPress={() => handleTaskPress(task.id)}
              >
                <TaskItem item={task} />
              </Pressable>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
  },
  tabContainer: {
    marginBottom: 11,
    paddingHorizontal: 0,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    paddingVertical: 2,
    position: 'relative',
    height: 40,
    
  },
  slidingTab: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    top: 4,
  },
  tabButton: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 4,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#2eac5f',
    fontWeight: '700',
  },
  workModeGroup: {
    marginBottom: 20,
  },
  workModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
}); 