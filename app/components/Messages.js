import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useConversations } from "../context/ConversationContext";
import { useSocket } from "../context/SocketContext";
import { Text } from "./Text";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "tasks", label: "Tasks" },
  { id: "requests", label: "Requests" },
];

export default function Messages() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();  

  const { socket } = useSocket();

  // Use the context instead of local state
  const {
    conversations,
    selectConversation,
    setSelectedConversation,
    refreshConversations,
  } = useConversations();

  // Handle socket events (keep minimal UI-specific events only)
  useEffect(() => {
    if (!socket) return;

    // Only handle UI-specific events here that aren't handled in context
    const handleUserStatus = (data) => {
      // This is handled by user_connected/user_disconnected in context
      // but keeping for any additional UI updates if needed
      console.log("User status update:", data);
    };

    socket.on("user_status", handleUserStatus);

    return () => {
      socket.off("user_status", handleUserStatus);
    };
  }, [socket]);

  // Reset current conversation when this screen is active
  useEffect(() => {
    setSelectedConversation(null);
  }, [setSelectedConversation]);

  const handleFilterPress = useCallback((filterId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filterId);
  }, []);

  const handleChatPress = useCallback((conversation) => {
    // Use the context's selectConversation method
    selectConversation(conversation.id);

    // Navigate to chat screen with all recipient details
    router.push(
      `/(screens)/messages/${conversation.id}?` +
        `recipientId=${conversation.recipient.user_id}&` +
        `recipientName=${encodeURIComponent(conversation.recipient.name)}&` +
        `recipientAvatar=${encodeURIComponent(
          conversation.recipient.avatar || ""
        )}&` +
        `recipientStatus=${encodeURIComponent(
          conversation.recipient.status
        )}&` +
        `recipientLastSeen=${encodeURIComponent(
          conversation.recipient.last_seen || ""
        )}&` +
        `messages=${encodeURIComponent(
          JSON.stringify([...conversation.messages].reverse())
        )}`
    );
  }, [selectConversation, router]);

  const filteredConversations = useCallback(() => {
    // Group conversations into active and archived
    const active = conversations.filter((c) => !c.archived);
    const archived = conversations.filter((c) => c.archived);
    const filterAndSearch = (list) =>
      list.filter((conversation) => {
        const matchesSearch =
          conversation.recipient.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conversation.lastMessage
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        if (activeFilter === "all") return matchesSearch;
        // You can add more filter logic here based on your needs
        return matchesSearch;
      });
    return [
      ...filterAndSearch(active),
      ...filterAndSearch(archived),
    ];
  }, [conversations, searchQuery, activeFilter]);

  const renderTypingIndicator = useCallback(() => (
    <View style={styles.typingContainer}>
      <View style={[styles.typingDot, styles.typingDot1]} />
      <View style={[styles.typingDot, styles.typingDot2]} />
      <View style={[styles.typingDot, styles.typingDot3]} />
    </View>
  ), []);

  const formatTime = useCallback((timeString) => {
    try {
      return new Date(timeString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeString;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } finally {
      setRefreshing(false);
    }
  }, [refreshConversations]);

  const conversationsToShow = filteredConversations();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text bold style={styles.title}>
          Messages
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

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {filterTabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.filterTab,
              activeFilter === tab.id && styles.activeFilterTab,
            ]}
            onPress={() => handleFilterPress(tab.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === tab.id && styles.activeFilterText,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.conversationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2eac5f"
            colors={["#2eac5f"]}
          />
        }
      >
        {conversationsToShow
          .slice()
          .sort((a, b) => b.last_msg_id - a.last_msg_id)
          .map((conversation) => (
          <Pressable
            key={conversation.id}
            style={styles.conversationItem}
            onPress={() => handleChatPress(conversation)}
          >
            {conversation.recipient.avatar ? (
              <Image
                source={{ uri: conversation.recipient.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {conversation.recipient.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text bold style={styles.conversationName}>
                  {conversation.recipient.name}
                </Text>
                <Text style={styles.timeText}>
                  {formatTime(conversation.time)}
                </Text>
              </View>
              {/* Show task title if available */}
              {conversation.task && conversation.task.title && (
                <Text style={{ fontSize: 13, color: '#2eac5f', marginBottom: 2 }} numberOfLines={1}>
                  {conversation.task.title}
                </Text>
              )}
              <View style={styles.conversationFooter}>
                {conversation.isTyping ? (
                  renderTypingIndicator()
                ) : (
                  <Text
                    style={[
                      styles.lastMessage,
                      conversation.unread && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </Text>
                )}
                {conversation.unread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>●</Text>
                  </View>
                )}
              </View>
            </View>
            {/* Archived badge */}
            {conversation.archived && (
              <View style={{ marginLeft: 8, backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, color: '#888' }}>Archived</Text>
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
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  activeFilterTab: {
    backgroundColor: "#2eac5f",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterText: {
    color: "#fff",
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2eac5f",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  conversationFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  unreadMessage: {
    color: "#000",
    fontWeight: "500",
  },
  unreadBadge: {
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#2eac5f",
    fontSize: 12,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2eac5f",
    opacity: 0.6,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  notificationContainer: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "#000", // Dark background for badge
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff", // White text for badge
    fontSize: 12,
    fontWeight: "bold",
  },
});