import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AssignedTasksList } from '../components/AssignedTasksList';
import CustomTabButtons from '../components/CustomTabButtons';
import { Text } from '../components/Text';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export default function MyTasksScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignedTasks = useCallback(async (options: { showLoading?: boolean } = {}) => {
    const { showLoading = true } = options;
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/my/assigned`, {
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
      setAssignedTasks(data?.tasks ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAssignedTasks();
  }, [fetchAssignedTasks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAssignedTasks({ showLoading: false });
    } finally {
      setRefreshing(false);
    }
  }, [fetchAssignedTasks]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>
          My Tasks
        </Text>
        <Pressable
          style={styles.notificationContainer}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={28} color="#000" />
          {(user?.notifications_count || 0) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user?.notifications_count}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
      <View style={styles.content}>
        <AssignedTasksList 
          tasks={assignedTasks} 
          loading={loading} 
          error={error} 
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>
      <CustomTabButtons />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  notificationContainer: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "#000",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
}); 