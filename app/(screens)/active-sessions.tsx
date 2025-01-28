import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from '../components/Text';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function ActiveSessions() {
  const router = useRouter();
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'iPhone 13 Pro',
      location: 'Nairobi, Kenya',
      lastActive: '2024-03-23T10:30:00',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'Chrome on MacBook Pro',
      location: 'Nairobi, Kenya',
      lastActive: '2024-03-22T15:45:00',
      isCurrent: false,
    },
    {
      id: '3',
      device: 'Safari on iPad',
      location: 'Mombasa, Kenya',
      lastActive: '2024-03-21T09:15:00',
      isCurrent: false,
    },
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTerminateSession = (sessionId: string) => {
    if (sessions.find(s => s.id === sessionId)?.isCurrent) {
      Alert.alert('Error', 'Cannot terminate current session');
      return;
    }

    Alert.alert(
      'Terminate Session',
      'Are you sure you want to terminate this session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement session termination logic here
            Alert.alert('Success', 'Session terminated successfully');
          },
        },
      ]
    );
  };

  const handleTerminateAll = () => {
    Alert.alert(
      'Terminate All Sessions',
      'Are you sure you want to terminate all other sessions?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Terminate All',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement terminate all sessions logic here
            Alert.alert('Success', 'All other sessions terminated successfully');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Active Sessions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.description}>
            These are the devices that are currently signed in to your account.
            You can terminate any session that you don't recognize.
          </Text>

          {sessions.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionInfo}>
                <View style={styles.deviceRow}>
                  <Ionicons
                    name={session.device.toLowerCase().includes('iphone') ? 'phone-portrait' : 'laptop'}
                    size={24}
                    color="#2eac5f"
                  />
                  <Text style={styles.deviceName} medium>
                    {session.device}
                    {session.isCurrent && (
                      <Text style={styles.currentSession}> (Current Session)</Text>
                    )}
                  </Text>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{session.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Last active: {formatDate(session.lastActive)}
                    </Text>
                  </View>
                </View>
              </View>

              {!session.isCurrent && (
                <TouchableOpacity
                  style={styles.terminateButton}
                  onPress={() => handleTerminateSession(session.id)}
                >
                  <Text style={styles.terminateText}>Terminate</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.terminateAllButton}
            onPress={handleTerminateAll}
          >
            <Text style={styles.terminateAllText} medium>
              Terminate All Other Sessions
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  currentSession: {
    color: '#2eac5f',
    fontSize: 14,
  },
  detailsContainer: {
    marginLeft: 36,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  terminateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  terminateText: {
    fontSize: 14,
    color: '#ff4444',
  },
  terminateAllButton: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
    alignItems: 'center',
  },
  terminateAllText: {
    fontSize: 16,
    color: '#ff4444',
  },
}); 