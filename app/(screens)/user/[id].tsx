import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { API_BASE_URL } from '../../config';
import { formatDate } from '../../utils/format';

interface User {
  id: number;
  name: string;
  rating: number;
  completed_tasks: number | null;
  avatar: string;
}

interface BasicInfo {
  tagline: string;
  bio: string;
}

interface Reviewer {
  id: number;
  name: string;
  rating: number;
  completed_tasks: number | null;
  avatar: string;
}

interface Review {
  id: number;
  task_assignment_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: Reviewer;
}

interface Pagination {
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  total: number;
}

interface UserProfile {
  user: User;
  basic_info: BasicInfo;
  reviews: Review[];
  pagination: Pagination;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200], // Adjust this range based on when you want the header to appear
    outputRange: [-100, 0], // From above the screen to its position
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [100, 200], // Header starts fading in after 100px scroll
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const blurIntensity = scrollY.interpolate({
    inputRange: [0, 200], // Start blurring at 0, max blur at 200px scroll
    outputRange: [5, 20], // Initial blur of 5, max blur of 20
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2eac5f" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Failed to load user profile'}
        </Text>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#FFB800' : '#666'}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" />

      {/* Fixed Header (appears on scroll) */}
      <Animated.View style={[
        styles.fixedHeader,
        { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }
      ]}>
        <Pressable 
          style={styles.fixedBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Image
          source={{ uri: profile.user.avatar }}
          style={styles.fixedAvatar}
        />
        <View style={styles.fixedHeaderInfo}>
          <Text style={styles.fixedName} numberOfLines={1}>{profile.user.name}</Text>
          <Text style={styles.fixedTagline} numberOfLines={1}>{profile.basic_info.tagline}</Text>
        </View>
        <Pressable style={styles.fixedFavoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollViewContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false } // useNativeDriver must be false for layout-related properties like height/width
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.headerBackground}>
          <Image
            source={{ uri: profile.user.avatar }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.overlay}>
            <Pressable 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
            
            <Pressable style={styles.favoriteButton}>
              <Ionicons name="heart-outline" size={26} color="#fff" />
            </Pressable>

            <View style={styles.headerContent}>
              <Image
                source={{ uri: profile.user.avatar }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{profile.user.name}</Text>
              <Text style={styles.tagline}>{profile.basic_info.tagline}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.user.rating.toFixed(1)}</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(profile.user.rating) ? 'star' : 'star-outline'}
                    size={14}
                    color={star <= Math.round(profile.user.rating) ? '#FFB800' : '#666'}
                  />
                ))}
              </View>
              {/* <Text style={styles.statLabel}>Rating</Text> */}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.user.completed_tasks || 0}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
          </View>

          <View style={styles.bioSection}>
            <Text style={styles.sectionTitle}>About {profile.user.name.split(' ')[0]}</Text>
            <Text style={styles.bioText}>{profile.basic_info.bio}</Text>
          </View>

          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {profile.reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet.</Text>
            ) : (
              profile.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Pressable onPress={() => router.push(`/(screens)/user/${review.reviewer.id}`)}>
                    <Image
                      source={{ uri: review.reviewer.avatar }}
                      style={styles.reviewerAvatar}
                    />
                    </Pressable>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
                      <Text style={styles.reviewDate}>
                        {formatDate(review.created_at)}
                      </Text>
                    </View>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  headerBackground: {
    width: '100%',
    height: 280,
    backgroundColor: '#2eac5f',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    opacity: 1, // Keep original opacity here, blur will be applied by BlurView
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 10,
  },
  name: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollViewContainer: {
    flex: 1,
  },
  contentSection: {
    backgroundColor: '#fff',
    paddingTop: 20,
    marginTop: -20, 
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2eac5f',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
  },
  bioSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  reviewsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90, // Height for the fixed header
    backgroundColor: '#2eac5f', // Green theme
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40, // Adjust for status bar
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  fixedBackButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fixedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 10,
  },
  fixedHeaderInfo: {
    flex: 1,
  },
  fixedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  fixedTagline: {
    fontSize: 13,
    color: '#e0e0e0',
  },
  fixedFavoriteButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
}); 