import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../components/Text";
import type { ApiNotification } from "../context/NotificationContext";
import { useApiNotifications } from "../context/NotificationContext";

const AppIcon = require('../../assets/images/icon.png');
// Helper function to group notifications by date
const groupNotificationsByDate = (notifications: ApiNotification[]) => {
  const groups = notifications.reduce((acc, notification) => {
    const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(notification);
    return acc;
  }, {} as Record<string, ApiNotification[]>);

  return Object.entries(groups).map(([date, items]) => ({
    date,
    data: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }));
};
// console.log(groupNotificationsByDate(apiNotifications));


// Map API notification sources to appropriate icons and colors
const getNotificationIcon = (source: string) => {
  const icons = {
    order: { name: "bag-outline", color: "#2eac5f" },
    wallet: { name: "wallet-outline", color: "#28a745" },
    system: { name: "notifications-outline", color: "#007bff" },
    task: { name: "briefcase-outline", color: "#ffc107" },
    payment: { name: "card-outline", color: "#17a2b8" },
    user: { name: "person-outline", color: "#6f42c1" },
    task_recommendation: { name: "app-icon", color: "#2eac5f" },
    default: { name: "information-circle-outline", color: "#6c757d" }
  };
  return icons[source as keyof typeof icons] || icons.default;
};

// Skeleton Loading Components
const SkeletonNotificationItem = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.notificationItem}>
      <Animated.View 
        style={[
          styles.skeletonAvatar, 
          { opacity: fadeAnim }
        ]} 
      />
      <View style={styles.textContainer}>
        <Animated.View 
          style={[
            styles.skeletonLine,
            styles.skeletonLineTitle,
            { opacity: fadeAnim }
          ]} 
        />
        <Animated.View 
          style={[
            styles.skeletonLine,
            styles.skeletonLineMessage,
            { opacity: fadeAnim }
          ]} 
        />
        <Animated.View 
          style={[
            styles.skeletonLine,
            styles.skeletonLineTime,
            { opacity: fadeAnim }
          ]} 
        />
      </View>
    </View>
  );
};

const SkeletonDateHeader = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnim]);

  return (
    <View style={styles.dateHeader}>
      <Animated.View 
        style={[
          styles.skeletonLine,
          styles.skeletonDateHeader,
          { opacity: fadeAnim }
        ]} 
      />
    </View>
  );
};

const SkeletonLoader = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} bold>Activity</Text>
    </View>
    
    <View style={styles.listContent}>
      <SkeletonDateHeader />
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonNotificationItem key={index} />
      ))}
    </View>
  </View>
);

export default function Notifications() {
  const router = useRouter();
  const { 
    apiNotifications, 
    fetchNotifications, 
    markAsRead, 
    refreshNotifications,
    unreadCount,
    loading,
    error,
    currentPage,
    hasMoreData
  } = useApiNotifications();

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Initial load is handled by the context
  }, []);

  const onRefresh = useCallback(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const loadMore = useCallback(async () => {
    // Prevent multiple simultaneous loads and check if there's more data
    if (isLoadingMore || !hasMoreData || loading) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      await fetchNotifications(nextPage, 10);
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreData, loading, currentPage, fetchNotifications]);

  const handleNotificationPress = async (notification: ApiNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.sender.source === 'task_recommendation') {
      router.push('/(tabs)/my-tasks');
      return;
    }
    // Navigate to the notification's link if available
    if (notification.sender.link) {
      // Uncomment and modify based on your routing setup
      // router.push(notification.sender.link);
    }
  };

  const renderNotification = ({ item }: { item: ApiNotification }) => {
    const icon = getNotificationIcon(item.sender.source);
    const isTaskRecommendation = item.sender.source === 'task_recommendation';
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          !item.is_read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        {isTaskRecommendation ? (
          <Image source={AppIcon} style={styles.userImage} />
        ) : item.sender.image ? (
          <Image 
            source={{ uri: item.sender.image }} 
            style={styles.userImage} 
          />
        ) : (
          <View style={[styles.notificationIcon, { backgroundColor: icon.color + '15' }]}>
            <Ionicons name={icon.name as any} size={22} color={icon.color} />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            <Text medium style={styles.username}>{item.sender.name}</Text>
            {" "}{item.message}
          </Text>
          <View style={styles.metaContainer}>
            <Text style={styles.timestamp}>
              {format(new Date(item.created_at), 'MMM d')} • {format(new Date(item.created_at), 'h:mm a')}
            </Text>
            {item.is_important && (
              <View style={styles.importantBadge}>
                <Ionicons name="star" size={12} color="#ffc107" />
              </View>
            )}
          </View>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderDateHeader = ({ section }: { section: { date: string } }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText} medium>
        {format(new Date(section.date), 'MMMM d, yyyy')}
      </Text>
    </View>
  );

  // Show skeleton on initial load
  if (loading && apiNotifications.length === 0) {
    return <SkeletonLoader />;
  }

  const groupedNotifications = groupNotificationsByDate(apiNotifications);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} bold>Activity</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={refreshNotifications}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={groupedNotifications}
        renderItem={({ item }) => (
          <View>
            {renderDateHeader({ section: item })}
            {item.data.map((notification) => (
              <View key={notification.id.toString()}>
                {renderNotification({ item: notification })}
              </View>
            ))}
          </View>
        )}
        keyExtractor={item => item.date}
        refreshControl={
          <RefreshControl 
            refreshing={loading && apiNotifications.length > 0} 
            onRefresh={onRefresh}
            tintColor="#2eac5f"
          />
        }
        onEndReached={hasMoreData ? loadMore : null}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                {`You'll see updates about your tasks and payments here`}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoadingMore && hasMoreData ? (
            <View style={styles.loadingMore}>
              <SkeletonNotificationItem />
              <SkeletonNotificationItem />
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          apiNotifications.length === 0 && !loading && styles.emptyListContent
        ]}
      />
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
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#000',
  },
  headerBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  dateHeader: {
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  dateHeaderText: {
    fontSize: 14,
    color: '#666',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#fafafa',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 24,
  },
  username: {
    color: '#000',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e8e',
    textTransform: 'uppercase',
  },
  importantBadge: {
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095f6',
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -4,
  },
  loadingMore: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f44336',
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Skeleton styles
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e1e9ee',
    marginRight: 12,
  },
  skeletonLine: {
    backgroundColor: '#e1e9ee',
    borderRadius: 4,
  },
  skeletonLineTitle: {
    height: 16,
    width: '60%',
    marginBottom: 6,
  },
  skeletonLineMessage: {
    height: 14,
    width: '90%',
    marginBottom: 6,
  },
  skeletonLineTime: {
    height: 12,
    width: '40%',
  },
  skeletonDateHeader: {
    height: 14,
    width: '30%',
  },
});