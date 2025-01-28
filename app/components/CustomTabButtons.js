import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Text } from './Text';
// Temporary notification counts - in a real app, this would come from your notification system


export default function CustomTabButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const {user} = useAuth()
  const { networkStatusMessage } = useNotification();
  const networkBarTranslateY = useRef(new Animated.Value(100)).current;
  const containerHeight = useRef(new Animated.Value(Platform.select({ ios: 90, android: 110 }))).current;

  useEffect(() => {
    if (networkStatusMessage) {
      // Animate both the network bar and container height
      Animated.parallel([
        Animated.timing(networkBarTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(containerHeight, {
          toValue: Platform.select({ ios: 115, android: 135 }), // Increased height
          duration: 300,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      // Animate both back to original state
      Animated.parallel([
        Animated.timing(networkBarTranslateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(containerHeight, {
          toValue: Platform.select({ ios: 90, android: 110 }), // Original height
          duration: 300,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [networkStatusMessage]);

  const handleTabPress = (route) => {
    // Trigger a light haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };
  const notificationCounts = {
    messages: user?.messages_count || 0, // Replace with actual count from your notification system
    browse: user?.notifications_count || 0, // Replace with actual count from your notification system
  };

  // updateProfile({
  //   notifications_count: (user?.notifications_count ?? 0) + 1,
  //   messages_count: (user?.messages_count ?? 0) + 1,
  // });

  const renderBadge = (count, isActive) => {
    if (!count) return null;
    return (
      <View style={[styles.badge, isActive && styles.activeBadge]}>
        <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>{count}</Text>
      </View>
    );
  };
  

  return (
    <Animated.View style={[styles.blurContainer, { height: containerHeight }]}>
      <BlurView intensity={20} tint="light" style={styles.blurView}>
        <View style={styles.container}>
          <Pressable
            onPress={() => handleTabPress("/(tabs)")}
            style={styles.tab}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconContainer, pathname === "/" && styles.activeIcon]}>
                <Ionicons 
                  name={pathname === "/" ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={27} 
                  color={pathname === "/" ? "#2eac5f" : "#666"} 
                />
              </View>
            </View>
            <Text style={[styles.text, pathname === "/" && styles.activeText]}>
              Get it done
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress("/(tabs)/browse")}
            style={styles.tab}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconContainer, pathname === "/browse" && styles.activeIcon]}>
                <Ionicons 
                  name={pathname === "/browse" ? "search" : "search-outline"} 
                  size={27} 
                  color={pathname === "/browse" ? "#2eac5f" : "#666"} 
                />
              </View>
            </View>
            <Text style={[styles.text, pathname === "/browse" && styles.activeText]}>
              Browse
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress("/(tabs)/my-tasks")}
            style={styles.tab}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconContainer, pathname === "/my-tasks" && styles.activeIcon]}>
                <Ionicons 
                  name={pathname === "/my-tasks" ? "list" : "list-outline"}
                  size={27} 
                  color={pathname === "/my-tasks" ? "#2eac5f" : "#666"} 
                />
              </View>
            </View>
            <Text style={[styles.text, pathname === "/my-tasks" && styles.activeText]}>
              My Tasks
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress("/(tabs)/messages")}
            style={styles.tab}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconContainer, pathname === "/messages" && styles.activeIcon]}>
                <Ionicons 
                  name={pathname === "/messages" ? "chatbubble" : "chatbubble-outline"} 
                  size={27} 
                  color={pathname === "/messages" ? "#2eac5f" : "#666"} 
                />
                {renderBadge(notificationCounts.messages, pathname === "/messages")}
              </View>
            </View>
            <Text style={[styles.text, pathname === "/messages" && styles.activeText]}>
              Messages
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabPress("/(tabs)/account")}
            style={styles.tab}
          >
            <View style={styles.iconWrapper}>
              <View style={[styles.iconContainer, pathname === "/account" && styles.activeIcon]}>
                <Ionicons 
                  name={pathname === "/account" ? "person" : "person-outline"} 
                  size={30} 
                  color={pathname === "/account" ? "#2eac5f" : "#666"} 
                />
              </View>
            </View>
            <Text style={[styles.text, pathname === "/account" && styles.activeText]}>
              Account
            </Text>
          </Pressable>
        </View>

        {networkStatusMessage && (
          <Animated.View
            style={[
              styles.networkBarContainer,
              {
                transform: [{ translateY: networkBarTranslateY }],
                backgroundColor: networkStatusMessage === 'You are offline' ? 'rgba(66, 135, 245, 0.9)' : 'rgba(76, 175, 80, 0.9)',
              },
            ]}
          >
            <Text style={styles.networkBarText}>
              {networkStatusMessage}
            </Text>
          </Animated.View>
        )}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(224, 224, 224, 0.5)',
    marginTop: 5,
  },
  blurView: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: 'relative',
  },
  iconContainer: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeIcon: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  activeText: {
    color: '#2eac5f',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2eac5f',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  activeBadge: {
    backgroundColor: '#2eac5f',
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeBadgeText: {
    color: '#fff',
  },
  networkBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 999,
    paddingTop: 8,
  },
  networkBarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
