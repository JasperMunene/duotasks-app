import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../components/Text';
import { formatPrice } from '../utils/format';

// Sample data for posted tasks
const myTasks = [
  {
    id: '1',
    title: 'Paint my house',
    price: 10000,
    location: 'Westlands, Nairobi',
    status: 'bidding',
    type: 'physical',
    category: 'Home Maintenance',
    timePosted: '4h ago',
    bids: [
      {
        id: 'bid1',
        amount: 12000,
        message: 'I have 5 years of experience in house painting. I can start tomorrow.',
        bidder: {
          id: 'user1',
          name: 'John Smith',
          image: 'https://i.pravatar.cc/150?img=8',
          rating: 4.8,
          completedTasks: 45,
        },
        status: 'pending',
      },
      {
        id: 'bid2',
        amount: 11000,
        message: 'Professional painter with own equipment. Available this week.',
        bidder: {
          id: 'user2',
          name: 'Alice Johnson',
          image: 'https://i.pravatar.cc/150?img=9',
          rating: 4.5,
          completedTasks: 32,
        },
        status: 'pending',
      },
    ],
  },
  {
    id: '2',
    title: 'Fix leaking pipes',
    price: 2500,
    location: 'Kilimani, Nairobi',
    status: 'in_progress',
    type: 'physical',
    category: 'Plumbing',
    timePosted: '1d ago',
    acceptedBid: {
      id: 'bid3',
      amount: 2800,
      bidder: {
        id: 'user3',
        name: 'Mike Wilson',
        image: 'https://i.pravatar.cc/150?img=10',
        rating: 4.9,
        completedTasks: 67,
      },
    },
    progress: {
      status: 'working',
      updates: [
        {
          id: 'update1',
          message: 'Identified the source of the leak',
          timestamp: '2024-03-22T10:30:00Z',
        },
        {
          id: 'update2',
          message: 'Replacing damaged pipe section',
          timestamp: '2024-03-22T11:45:00Z',
        },
      ],
    },
  },
  {
    id: '3',
    title: 'Website Design',
    price: 15000,
    location: 'Remote',
    status: 'completed',
    type: 'remote',
    category: 'Design',
    timePosted: '2d ago',
    acceptedBid: {
      id: 'bid4',
      amount: 15000,
      bidder: {
        id: 'user4',
        name: 'Sarah Lee',
        image: 'https://i.pravatar.cc/150?img=11',
        rating: 5.0,
        completedTasks: 89,
      },
    },
  },
];

export default function MyTasksScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bidding' | 'in_progress' | 'completed'>('bidding');

  const handleAcceptBid = (taskId: string, bidId: string, bidderName: string) => {
    Alert.alert(
      'Accept Bid',
      `Are you sure you want to accept ${bidderName}'s bid?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: () => {
            // Here you would update the task status and notify the bidder
            Alert.alert('Success', 'Bid accepted! The task doer has been notified.');
          },
        },
      ]
    );
  };

  const handleDeclineBid = (taskId: string, bidId: string, bidderName: string) => {
    Alert.alert(
      'Decline Bid',
      `Are you sure you want to decline ${bidderName}'s bid?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            // Here you would update the bid status and notify the bidder
            Alert.alert('Success', 'Bid declined.');
          },
        },
      ]
    );
  };

  const handleViewTask = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const filteredTasks = myTasks.filter(task => {
    if (activeTab === 'bidding') return task.status === 'bidding';
    if (activeTab === 'in_progress') return task.status === 'in_progress';
    return task.status === 'completed';
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'bidding':
        return 'time-outline';
      case 'in_progress':
        return 'trending-up';
      case 'completed':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bidding':
        return '#2563eb';
      case 'in_progress':
        return '#2eac5f';
      case 'completed':
        return '#9333ea';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#2eac5f" />
        </Pressable>
        <Text bold style={styles.title}>My Tasks</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabsContainer}>
        {(['bidding', 'in_progress', 'completed'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons 
              name={getStatusIcon(tab)} 
              size={18} 
              color={activeTab === tab ? '#fff' : '#666'} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'bidding' ? 'Bidding' : tab === 'in_progress' ? 'In Progress' : 'Completed'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {filteredTasks.map((task) => (
          <Pressable
            key={task.id}
            style={styles.taskCard}
            onPress={() => handleViewTask(task.id)}
          >
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(task.status)}15` }
            ]}>
              <Ionicons 
                name={getStatusIcon(task.status)} 
                size={14} 
                color={getStatusColor(task.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                {task.status === 'in_progress' ? 'In Progress' : 
                  task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Text>
            </View>

            <View style={styles.taskHeader}>
              <Text medium style={styles.taskTitle}>{task.title}</Text>
              <Text bold style={styles.taskPrice}>{formatPrice(task.price)}</Text>
            </View>

            <View style={styles.taskMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{task.category}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{task.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{task.timePosted}</Text>
              </View>
            </View>

            {task.status === 'bidding' && task.bids && (
              <View style={styles.bidsContainer}>
                <Text medium style={styles.bidsTitle}>Bids ({task.bids.length})</Text>
                {task.bids.map((bid) => (
                  <View key={bid.id} style={styles.bidCard}>
                    <View style={styles.bidderInfo}>
                      <Image source={{ uri: bid.bidder.image }} style={styles.bidderImage} />
                      <View style={styles.bidderDetails}>
                        <Text medium style={styles.bidderName}>{bid.bidder.name}</Text>
                        <View style={styles.bidderMeta}>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFB800" />
                            <Text style={styles.rating}>{bid.bidder.rating}</Text>
                          </View>
                          <Text style={styles.completedTasks}>
                            {bid.bidder.completedTasks} tasks completed
                          </Text>
                        </View>
                      </View>
                      <Text bold style={styles.bidAmount}>{formatPrice(bid.amount)}</Text>
                    </View>
                    {bid.message && (
                      <Text style={styles.bidMessage}>{bid.message}</Text>
                    )}
                    <View style={styles.bidActions}>
                      <Pressable
                        style={[styles.bidButton, styles.acceptButton]}
                        onPress={() => handleAcceptBid(task.id, bid.id, bid.bidder.name)}
                      >
                        <Text style={styles.bidButtonText}>Accept</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.bidButton, styles.declineButton]}
                        onPress={() => handleDeclineBid(task.id, bid.id, bid.bidder.name)}
                      >
                        <Text style={[styles.bidButtonText, styles.declineButtonText]}>
                          Decline
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {task.status === 'in_progress' && task.progress && (
              <View style={styles.progressContainer}>
                <View style={styles.acceptedBidder}>
                  <Image 
                    source={{ uri: task.acceptedBid.bidder.image }} 
                    style={styles.acceptedBidderImage} 
                  />
                  <View style={styles.acceptedBidderInfo}>
                    <Text medium style={styles.acceptedBidderName}>
                      {task.acceptedBid.bidder.name}
                    </Text>
                    <View style={styles.acceptedBidderMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFB800" />
                        <Text style={styles.rating}>{task.acceptedBid.bidder.rating}</Text>
                      </View>
                      <Text style={styles.bidAmount}>
                        {formatPrice(task.acceptedBid.amount)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.updates}>
                  <Text medium style={styles.updatesTitle}>Progress Updates</Text>
                  {task.progress.updates.map((update, index) => (
                    <View key={update.id} style={styles.updateItem}>
                      <View style={styles.updateDot} />
                      <View style={styles.updateContent}>
                        <Text style={styles.updateMessage}>{update.message}</Text>
                        <Text style={styles.updateTime}>
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {task.status === 'completed' && task.acceptedBid && (
              <View style={styles.completedContainer}>
                <View style={styles.acceptedBidder}>
                  <Image 
                    source={{ uri: task.acceptedBid.bidder.image }} 
                    style={styles.acceptedBidderImage} 
                  />
                  <View style={styles.acceptedBidderInfo}>
                    <Text medium style={styles.acceptedBidderName}>
                      {task.acceptedBid.bidder.name}
                    </Text>
                    <View style={styles.acceptedBidderMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFB800" />
                        <Text style={styles.rating}>{task.acceptedBid.bidder.rating}</Text>
                      </View>
                      <Text style={styles.bidAmount}>
                        {formatPrice(task.acceptedBid.amount)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.completedStatus}>
                  <Ionicons name="checkmark-circle" size={20} color="#2eac5f" />
                  <Text style={styles.completedText}>Task Completed</Text>
                </View>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#2eac5f',
  },
  tabIcon: {
    marginTop: 1,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  taskPrice: {
    fontSize: 18,
    color: '#2eac5f',
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  bidsContainer: {
    backgroundColor: '#f8f9fa',
    margin: -16,
    marginTop: 0,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bidsTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bidderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  bidderDetails: {
    flex: 1,
  },
  bidderName: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  bidderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  completedTasks: {
    fontSize: 12,
    color: '#666',
  },
  bidAmount: {
    fontSize: 16,
    color: '#2eac5f',
    fontWeight: '600',
    marginTop: -22,
  },
  bidMessage: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  bidActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bidButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#2eac5f',
  },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  bidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#ff4444',
  },
  progressContainer: {
    backgroundColor: '#f8f9fa',
    margin: -16,
    marginTop: 0,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  acceptedBidder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  acceptedBidderImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  acceptedBidderInfo: {
    flex: 1,
  },
  acceptedBidderName: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  acceptedBidderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updates: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  updatesTitle: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2eac5f',
    marginTop: 6,
  },
  updateContent: {
    flex: 1,
  },
  updateMessage: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    lineHeight: 20,
  },
  updateTime: {
    fontSize: 12,
    color: '#666',
  },
  completedContainer: {
    backgroundColor: '#f8f9fa',
    margin: -16,
    marginTop: 0,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  completedText: {
    fontSize: 14,
    color: '#2eac5f',
    fontWeight: '600',
  },
}); 