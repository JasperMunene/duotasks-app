import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { ActivityBottomSheet } from '../components/ActivityBottomSheet';
import { InsightsSummary } from '../components/InsightsSummary';
import { Text } from '../components/Text';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface Activity {
  id: number | string;
  type: 'posted' | 'assigned';
  title: string;
  description: string;
  status: string;
  work_mode?: string;
  budget?: number;
  agreed_price?: number;
  deadline_date?: string | null;
  created_at: string;
  preferred_time?: string | null;
  schedule_type?: string;
  specific_date?: string | null;
  task_giver?: {
    id: number;
    name: string;
    avatar: string;
  };
}

export default function Activities() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const {accessToken} = useAuth()
  const [insights, setInsights] = useState<any>(null);
  const [insightsMinimized, setInsightsMinimized] = useState(false);

  const fetchActivities = useCallback(async (pageNum = 1) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/my_activity?page=${pageNum}&limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (pageNum === 1) {
        setInsights(data.insights || null);
      }
      const results = Array.isArray(data.results) ? data.results : [];
      if (pageNum === 1) {
        setActivities(results);
      } else {
        setActivities(prev => [...prev, ...results]);
      }
      setHasMore(results.length === 10);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [isLoading, accessToken]);

  useEffect(() => {
    fetchActivities(1);
  }, []);

  const loadMoreActivities = useCallback(() => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage);
  }, [hasMore, isLoading, page, fetchActivities]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#2eac5f';
      case 'in_progress':
        return '#f4a261';
      case 'pending':
      case 'open':
        return '#666';
      case 'cancelled':
        return '#ff4444';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'time';
      case 'pending':
      case 'open':
        return 'hourglass';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'ellipse';
    }
  };

  const handleActivityPress = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    bottomSheetRef.current?.present();
  }, []);

  const handleDismissBottomSheet = useCallback(() => {
    setSelectedActivity(null);
  }, []);

  const renderActivity = useCallback(({ item: activity }: { item: Activity }) => {
    return (
      <TouchableOpacity 
        style={styles.activityCard}
        onPress={() => handleActivityPress(activity)}
      >
        {/* Timeline dot */}
        <View style={styles.timelineDotContainer}>
          <View 
            style={[
              styles.timelineDot,
              { backgroundColor: getStatusColor(activity.status) }
            ]}
          >
            <Ionicons 
              name={getStatusIcon(activity.status)} 
              size={16} 
              color="#fff" 
            />
          </View>
        </View>

        {/* Activity content */}
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <View style={styles.activityMeta}>
              <Text style={styles.activityDate}>{formatDate(activity.created_at)}</Text>
              <View 
                style={[
                  styles.categoryTag,
                  { backgroundColor: `${getStatusColor(activity.status)}15` }
                ]}
              >
                <Text 
                  style={[
                    styles.categoryText,
                    { color: getStatusColor(activity.status) }
                  ]}
                >
                  {activity.work_mode || activity.schedule_type || 'Task'}
                </Text>
              </View>
            </View>
            {(activity.type === 'assigned' && activity.agreed_price) || (activity.type === 'posted' && activity.budget) ? (
              <Text style={styles.amountText} medium>
                +KES {(activity.agreed_price || activity.budget)?.toLocaleString()}
              </Text>
            ) : null}
          </View>

          <Text style={styles.activityTitle} medium numberOfLines={2}>
            {activity.title}
          </Text>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {activity.description}
          </Text>

          <View style={styles.activityFooter}>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(activity.status) }
                ]} 
              />
              <Text 
                style={[
                  styles.statusText,
                  { color: getStatusColor(activity.status) }
                ]}
              >
                {activity.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.activityType}>
              {activity.type === 'posted' ? 'You posted this task' : 'You completed this task'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Skeleton loader
  const SKELETON_COUNT = 6;
  const renderSkeleton = () => (
    Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
      <View key={idx} style={[styles.activityCard, { opacity: 0.5 }]}> 
        <View style={styles.timelineDotContainer}>
          <View style={styles.timelineDot} />
        </View>
        <View style={styles.activityContent}>
          <View style={[styles.activityHeader, { backgroundColor: '#eee', height: 20, borderRadius: 4, marginBottom: 8 }]} />
          <View style={[styles.activityTitle, { backgroundColor: '#eee', height: 16, borderRadius: 4, marginBottom: 4 }]} />
          <View style={[styles.activityDescription, { backgroundColor: '#eee', height: 14, borderRadius: 4, marginBottom: 12 }]} />
          <View style={[styles.activityFooter, { backgroundColor: '#eee', height: 16, borderRadius: 4 }]} />
        </View>
      </View>
    ))
  );

  const renderFooter = useCallback(() => {
    if (!isLoading || isInitialLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }, [isLoading, isInitialLoading]);

  // Helper to map Activity to ActivityBottomSheet's expected type
  function mapActivityToBottomSheetActivity(activity: Activity | null): {
    id: string;
    type: 'posted' | 'completed';
    title: string;
    date: string;
    amount?: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    category: string;
    description: string;
  } | null {
    if (!activity) return null;
    return {
      id: String(activity.id),
      type: activity.type === 'assigned' ? 'completed' : 'posted',
      title: activity.title,
      date: activity.created_at,
      amount: activity.agreed_price || activity.budget,
      status: (activity.status === 'open' ? 'pending' : activity.status) as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      category: activity.work_mode || activity.schedule_type || 'Task',
      description: activity.description,
    };
  }

  // Handler to minimize insights on scroll
  const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setInsightsMinimized(offsetY > 20); // Minimize if scrolled down a bit
  }, []);

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>My Activities</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Insights */}
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <InsightsSummary insights={insights} minimized={insightsMinimized} />
        </View>

        {isInitialLoading ? (
          <View style={styles.listContent}>{renderSkeleton()}</View>
        ) : (
          <FlashList
            data={activities}
            renderItem={renderActivity}
            estimatedItemSize={200}
            onEndReached={loadMoreActivities}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
          />
        )}

        <ActivityBottomSheet
          ref={bottomSheetRef}
          activity={mapActivityToBottomSheetActivity(selectedActivity)}
          isVisible={!!selectedActivity}
          onDismiss={handleDismissBottomSheet}
        />
      </View>
    </BottomSheetModalProvider>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  timeline: {
    padding: 20,
  },
  activityCard: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -20,
    width: 2,
    backgroundColor: '#2eac5f',
    opacity: 0.3,
  },
  timelineDotContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2eac5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityMeta: {
    flex: 1,
    marginRight: 8,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#2eac5f15',
  },
  categoryText: {
    fontSize: 12,
    color: '#2eac5f',
  },
  amountText: {
    fontSize: 16,
    color: '#2eac5f',
  },
  activityTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
}); 