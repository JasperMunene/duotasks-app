import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { PostedTasksList } from './PostedTasksList';
import { Text } from './Text';

const categories = [
  {
    id: 1,
    title: 'Gardening',
    icon: 'leaf-outline',
  },
  {
    id: 2,
    title: 'Painting',
    icon: 'brush-outline',
  },
  {
    id: 3,
    title: 'Repairs and Installation',
    icon: 'construct-outline',
  },
  {
    id: 4,
    title: 'Copywriting',
    icon: 'create-outline',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [postedTasks, setPostedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const notificationCounts = {
    notifications: user?.notifications_count || 0, // Replace with actual count from your notification system
  };

  const fetchPostedTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/my/posted`, {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPostedTasks(Array.isArray(data) ? data : data?.tasks ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load posted tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostedTasks();
  }, []);

  const shouldShowPostedTasks = useMemo(
    () => loading || (Array.isArray(postedTasks) && postedTasks.length > 0),
    [loading, postedTasks]
  );
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    // Get first name if full name is provided
    const firstName = user?.name ? user.name.split(' ')[0] : 'User';
    return `${greeting}, ${firstName}`;
  };

  const handlePostTask = () => {
    router.push('/(screens)/post-task');
  };

  const handleViewAllTasks = () => {
    router.push('/(screens)/my-tasks');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text bold style={styles.title}>Post a task. Get it done.</Text>
          </View>
          <Pressable style={styles.notificationContainer} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline"  size={28} color="#fff" />
            
            {notificationCounts.notifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCounts.notifications}</Text>
              </View>
              )}
          </Pressable>
        </View>
        
        <Pressable style={styles.searchContainer} onPress={handlePostTask}>
          <View style={styles.searchInput}>
            <Text style={styles.searchPlaceholder}>Tell the world, what do you need done?</Text>
          </View>
          <Pressable style={styles.searchButton} onPress={handlePostTask}>
            <Text style={styles.buttonText}>Get Offers</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </Pressable>
      </View>
      {shouldShowPostedTasks ? (
        <View style={styles.postedTasksContainer}>
          <View style={styles.tasksHeader}>
            <Text style={styles.sectionTitle}>Your Posted Tasks</Text>
            <Pressable style={styles.viewAllButton} onPress={handleViewAllTasks}>
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="arrow-forward" size={16} color="#2eac5f" />
            </Pressable>
          </View>
          {error && !loading ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchPostedTasks}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <PostedTasksList
              tasks={postedTasks}
              loading={loading}
              error={loading ? null : error}
              onRefresh={fetchPostedTasks}
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Need something done?</Text>
            <Text style={styles.sectionSubtitle}>Browse our top trending categories</Text>
            
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <Pressable 
                  key={category.id} 
                  style={styles.categoryCard}
                  onPress={handlePostTask}
                >
                  <View style={styles.categoryInner}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={category.icon} size={24} color="#2eac5f" />
                    </View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#2eac5f',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  notificationContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#2eac5f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 15,
    marginBottom: 10,
  },
  searchPlaceholder: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchButton: {
    backgroundColor: '#239951',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#666',
    marginBottom: 20,
  },
  postedTasksContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e6f4ed',
  },
  viewAllText: {
    color: '#2eac5f',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2eac5f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: '#f5f9f7',
    width: '48%',
    padding: 8,
    borderRadius: 12,
  },
  categoryInner: {
    backgroundColor: '#f5f9f7',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6f4ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#333',
  },
});