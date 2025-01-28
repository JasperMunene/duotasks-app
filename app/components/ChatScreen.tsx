import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useConversations } from "../context/ConversationContext";
import { useNotification } from "../context/NotificationContext";
import { useSocket } from "../context/SocketContext";
import TaskDetailsBottomSheet from "./TaskDetailsBottomSheet";
import { Text } from "./Text";
type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "received"
  | "rejected"
  | "uploading";

interface Message {
  id: string;
  text?: string;
  image?: string;
  sent: boolean;
  sender: "me" | "other";
  time: string;
  displayTime: string;
  status?: MessageStatus;
}

interface ChatScreenProps {
  chatId: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  recipientStatus?: string;
  recipientLastSeen?: string | null;
  messages?: Message[];
}

interface ImageLoadingState {
  [key: string]: boolean;
}

const MESSAGES_PER_PAGE = 20;

const isWithinTimeWindow = (time1: string, time2: string, minutes = 2) => {
  const date1 = new Date(time1);
  const date2 = new Date(time2);
  return Math.abs(date1.getTime() - date2.getTime()) <= minutes * 60 * 1000;
};

const groupMessagesByTime = (messages: Message[]) => {
  const groups: Message[][] = [];
  let currentGroup: Message[] = [];

  messages.forEach((message, index) => {
    if (index === 0) {
      currentGroup.push(message);
    } else {
      const prevMessage = messages[index - 1];
      if (
        prevMessage.sender === message.sender &&
        isWithinTimeWindow(prevMessage.time, message.time)
      ) {
        currentGroup.push(message);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [message];
      }
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

export default function ChatScreen({
  chatId,
  recipientId,
  recipientName = "",
  recipientAvatar,
  recipientStatus = "offline",
  recipientLastSeen: initialLastSeen = null,
}: ChatScreenProps) {
  const { showNotification } = useNotification();
  const { socket } = useSocket();
  const { accessToken, user } = useAuth();
  const {
    selectedConversation,
    selectConversation,
    setSelectedConversation,
    sendMessage,
    sendImage,
    refreshConversations,
    onlineUsers,
    emitTyping,
  } = useConversations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState<ImageLoadingState>({});
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [recipientOnlineStatus, setRecipientOnlineStatus] =
    useState(recipientStatus);
  const [lastSeen, setLastSeen] = useState<string | null>(initialLastSeen);
  const [uploadingImages, setUploadingImages] = useState<{
    [key: string]: string;
  }>({}); // key: tempId, value: imageUri
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(
    setTimeout(() => {}, 0)
  );
  const router = useRouter();
  const [deliveredSound, setDeliveredSound] = useState<Audio.Sound | null>(
    null
  );
  const [newMessageSound, setNewMessageSound] = useState<Audio.Sound | null>(
    null
  );
  const [isTaskDetailsModalVisible, setIsTaskDetailsModalVisible] =
    useState(false);
  const [dummyTaskData, setDummyTaskData] = useState({
    name: "Fix Leaky Faucet",
    progress: 75,
    mode: "physical" as "physical" | "remote",
    posterLocation: { latitude: 34.052235, longitude: -118.243683 },
  });

  // Convert conversation messages to chat format
  const convertToMessageFormat = (conversationMessages: any[]) => {
    return conversationMessages.map((msg: any) => {
      const messageDate = new Date(msg.time);
      return {
        id: msg.message_id.toString(),
        text: msg.text,
        image: msg.image,
        sent: msg.sender_id === Number(user?.id),
        sender: (msg.sender_id === Number(user?.id) ? "me" : "other") as
          | "me"
          | "other",
        time: messageDate.toISOString(),
        displayTime: messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: msg.status || "sent",
      };
    });
  };

  // Initialize conversation and sync messages
  useEffect(() => {
    if (chatId && !selectedConversation) {
      selectConversation(Number(chatId));
    }
  }, [chatId, selectConversation, selectedConversation]);

  // Update messages when selectedConversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.id === Number(chatId)) {
      const formattedMessages = convertToMessageFormat(
        selectedConversation.messages
      );
      const sortedMessages = formattedMessages.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      setMessages(sortedMessages);

      // Update recipient status from conversation data
      setRecipientOnlineStatus(selectedConversation.recipient.status);
      setLastSeen(selectedConversation.recipient.last_seen);
      setRecipientTyping(selectedConversation.isTyping || false);
    }
  }, [selectedConversation, chatId, user?.id]);

  // Update online status based on onlineUsers
  useEffect(() => {
    const isOnline = onlineUsers.includes(Number(recipientId));
    setRecipientOnlineStatus(isOnline ? "online" : "offline");
    if (!isOnline && recipientOnlineStatus === "online") {
      setLastSeen(new Date().toISOString());
    }
  }, [onlineUsers, recipientId, recipientOnlineStatus]);

  // Fetch older messages (for pagination)
  const fetchMessages = async (isRefresh = false) => {
    try {
      if (!accessToken) return;

      const currentOffset = isRefresh ? 0 : offset;
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/messages/${chatId}?offset=${currentOffset}&limit=${MESSAGES_PER_PAGE}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const formattedMessages = response.data.map((msg: any) => {
        const messageDate = new Date(msg.time);
        return {
          id: msg.message_id.toString(),
          text: msg.text,
          image: msg.image,
          sent: msg.sent,
          sender: msg.sent ? "me" : "other",
          time: messageDate.toISOString(),
          displayTime: messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: msg.status || "sent",
        };
      });

      const sortedMessages = formattedMessages.sort(
        (a: Message, b: Message) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      if (isRefresh) {
        setMessages(sortedMessages);
        setOffset(MESSAGES_PER_PAGE);
      } else {
        setMessages((prev) => [...sortedMessages, ...prev]);
        setOffset(currentOffset + MESSAGES_PER_PAGE);
      }

      setHasMore(formattedMessages.length === MESSAGES_PER_PAGE);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      showNotification({
        title: "Error",
        message: "Error loading messages",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    console.log("im refreshed");
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchMessages();
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const paddingToTop = 20;
    const isCloseToTop = contentOffset.y <= paddingToTop;

    if (isCloseToTop && !loading && hasMore) {
      handleLoadMore();
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (!loading && !refreshing) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, uploadingImages]);

  const handleSend = () => {
    if (newMessage.trim().length === 0 || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Send message via context
    sendMessage(Number(chatId), newMessage.trim());
    setNewMessage("");

    // Scroll to bottom for new messages
    scrollViewRef.current?.scrollToEnd({ animated: true });

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      emitTyping(Number(chatId), Number(recipientId), false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!socket) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator if text is being typed
    if (text.length > 0) {
      emitTyping(Number(chatId), Number(recipientId), true);
    }

    // Set timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(Number(chatId), Number(recipientId), false);
    }, 3000);
  };

  const handleImagePick = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      const originalUri = result.assets[0].uri;
      const tempId = `temp_${Date.now()}`;

      // Add to uploading images state for preview
      setUploadingImages((prev) => ({
        ...prev,
        [tempId]: originalUri,
      }));

      // Compress image
      const compressed = await ImageManipulator.manipulateAsync(
        originalUri,
        [],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      try {
        // Upload to backend API
        const formData = new FormData();
        formData.append("image", {
          uri: compressed.uri,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);

        const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const resJson = await response.json();
        const uploadedUrl = resJson?.url;

        if (uploadedUrl) {
          // Remove from uploading state
          setUploadingImages((prev) => {
            const newState = { ...prev };
            delete newState[tempId];
            return newState;
          });

          // Send image via context
          sendImage(Number(chatId), uploadedUrl, "image/jpeg");
        } else {
          throw new Error("Image upload failed");
        }
      } catch (err) {
        console.error("Image upload error:", err);

        // Remove from uploading state on error
        setUploadingImages((prev) => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });

        showNotification({
          title: "Error",
          message: "Failed to send image",
        });
      }
    }
  };

  const handleImagePress = (imageUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImage(imageUri);
    setModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedImage(null);
    });
  };

  const handleImageLoadStart = (imageUri: string) => {
    setImageLoading((prev) => ({ ...prev, [imageUri]: true }));
  };

  const handleImageLoadEnd = (imageUri: string) => {
    setImageLoading((prev) => ({ ...prev, [imageUri]: false }));
  };

  const handleModalImageLoadStart = () => {
    setModalImageLoading(true);
  };

  const handleModalImageLoadEnd = () => {
    setModalImageLoading(false);
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "last seen a while ago";

    const lastSeenDate = new Date(lastSeen);
    if (isNaN(lastSeenDate.getTime())) return "last seen a while ago";

    const now = new Date();
    const lastSeenDay = new Date(lastSeenDate);
    lastSeenDay.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formattedTime = lastSeenDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (lastSeenDay.getTime() === today.getTime()) {
      return `last seen today at ${formattedTime}`;
    } else if (lastSeenDay.getTime() === yesterday.getTime()) {
      return `last seen yesterday at ${formattedTime}`;
    } else {
      return `last seen on ${lastSeenDate.toLocaleDateString()} at ${formattedTime}`;
    }
  };

  // Load sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: delivered } = await Audio.Sound.createAsync(
          require("../../assets/sounds/delivered.wav")
        );
        const { sound: newMsg } = await Audio.Sound.createAsync(
          require("../../assets/sounds/new-message.wav")
        );
        setDeliveredSound(delivered);
        setNewMessageSound(newMsg);
      } catch (error) {
        console.error("Error loading sounds:", error);
      }
    };

    loadSounds();

    return () => {
      if (deliveredSound) {
        deliveredSound.unloadAsync();
      }
      if (newMessageSound) {
        newMessageSound.unloadAsync();
      }
    };
  }, []);

  // Play delivered sound
  const playDeliveredSound = async () => {
    try {
      if (deliveredSound) {
        await deliveredSound.replayAsync();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Error playing delivered sound:", error);
    }
  };

  // Play new message sound
  const playNewMessageSound = async () => {
    try {
      if (newMessageSound) {
        await newMessageSound.replayAsync();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Error playing new message sound:", error);
    }
  };

  // Play sounds based on message status changes
  useEffect(() => {
    if (selectedConversation) {
      const lastMessage =
        selectedConversation.messages[selectedConversation.messages.length - 1];
      if (lastMessage) {
        // Play sound for new incoming message
        if (lastMessage.sender_id !== Number(user?.id)) {
          playNewMessageSound();
        }
        // Play sound for delivered status
        if (
          lastMessage.status === "delivered" &&
          lastMessage.sender_id === Number(user?.id)
        ) {
          playDeliveredSound();
        }
      }
    }
  }, [selectedConversation?.messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={40}
    >
      {/* Task details at the top if available */}
      {selectedConversation && selectedConversation.task && (
        <View style={styles.taskCard}>
          <Text style={styles.taskTitle}>
            {selectedConversation.task.title}
          </Text>
          {selectedConversation.task.description && (
            <Text style={styles.taskDescription}>
              {selectedConversation.task.description}
            </Text>
          )}
          {selectedConversation.task.status && (
            <View style={styles.taskStatusRow}>
              <Text style={styles.taskStatusLabel}>Status: </Text>
              <Text style={[styles.taskStatus, styles[`taskStatus_${selectedConversation.task.status}`] || null]}>
                {selectedConversation.task.status.charAt(0).toUpperCase() + selectedConversation.task.status.slice(1)}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => {
              router.back();
              setSelectedConversation(null);
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#2eac5f" />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/(screens)/user/${recipientId}`)}
            style={styles.iconpressable}
          >
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {recipientName
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.name}>{recipientName}</Text>
              <Text
                style={[
                  styles.status,
                  recipientOnlineStatus === "online" && styles.onlineStatus,
                ]}
              >
                {recipientOnlineStatus === "online"
                  ? "online"
                  : formatLastSeen(lastSeen)}
              </Text>
            </View>
          </Pressable>
        </View>
        <Pressable
          style={styles.headerButton}
          onPress={() => setIsTaskDetailsModalVisible(true)}
        >
          <Ionicons name="document-text-outline" size={24} color="#000" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.messageList}
        ref={scrollViewRef}
        contentContainerStyle={styles.messageListContent}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2eac5f"]}
            tintColor="#2eac5f"
          />
        }
      >
        {loading && offset > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2eac5f" />
          </View>
        )}

        {groupMessagesByTime(messages).map((group, groupIndex) => (
          <View
            key={`group-${groupIndex}`}
            style={[
              styles.messageGroup,
              group[0].sent ? styles.myMessageGroup : styles.otherMessageGroup,
            ]}
          >
            {group.map((message, messageIndex) => (
              <View
                key={`${message.id}-${messageIndex}`}
                style={[
                  styles.messageContainer,
                  message.sent ? styles.myMessage : styles.otherMessage,
                  messageIndex > 0 && styles.groupedMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.sent ? styles.myBubble : styles.otherBubble,
                    message.image && styles.imageBubble,
                    message.status === "rejected" && styles.rejectedBubble,
                    messageIndex === group.length - 1 &&
                      (message.sent
                        ? styles.lastMyBubble
                        : styles.lastOtherBubble),
                  ]}
                >
                  {message.image ? (
                    <Pressable onPress={() => handleImagePress(message.image!)}>
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: message.image }}
                          style={styles.messageImage}
                          resizeMode="cover"
                          onLoadStart={() =>
                            handleImageLoadStart(message.image!)
                          }
                          onLoadEnd={() => handleImageLoadEnd(message.image!)}
                        />
                        {(imageLoading[message.image] ||
                          message.status === "uploading") && (
                          <View style={styles.imageLoadingContainer}>
                            <ActivityIndicator size="small" color="#2eac5f" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  ) : (
                    <Text
                      style={[
                        styles.messageText,
                        message.sent && styles.myMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  )}
                </View>
                {messageIndex === group.length - 1 && (
                  <View style={styles.messageFooter}>
                    <Text style={styles.time}>{message.displayTime}</Text>
                    {message.sent && message.status !== "sending" && (
                      <Text
                        style={[
                          styles.messageStatus,
                          message.status === "read" && styles.messageStatusRead,
                        ]}
                      >
                        {message.status === "sent" && "Sent"}
                        {message.status === "delivered" && "Delivered"}
                        {message.status === "read" && "Read"}
                        {message.status === "failed" && "Not Delivered"}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Preview uploading images */}
        {Object.entries(uploadingImages).map(([tempId, imageUri]) => (
          <View
            key={tempId}
            style={[styles.messageContainer, styles.myMessage]}
          >
            <View
              style={[
                styles.messageBubble,
                styles.myBubble,
                styles.imageBubble,
                styles.lastMyBubble,
              ]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator size="small" color="#2eac5f" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              </View>
            </View>
            <View style={styles.messageFooter}>
              <Text style={styles.time}>
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        ))}

        {recipientTyping && (
          <View style={[styles.messageContainer, styles.otherMessage]}>
            <View
              style={[
                styles.lastMyBubble,
                styles.otherBubble,
                styles.typingBubble,
              ]}
            >
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Only show input if not archived */}
      {!(selectedConversation && selectedConversation.archived) && (
        <View style={styles.inputContainer}>
          <Pressable style={styles.attachButton} onPress={handleImagePick}>
            <Ionicons name="image-outline" size={24} color="#2eac5f" />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Message"
            value={newMessage}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[
              styles.sendButton,
              newMessage.trim().length === 0 && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={newMessage.trim().length === 0}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim().length === 0 ? "#ccc" : "#fff"}
            />
          </Pressable>
        </View>
      )}
      {/* If archived, show a banner */}
      {selectedConversation && selectedConversation.archived && (
        <View style={{ padding: 16, backgroundColor: '#fffbe6', borderTopWidth: 1, borderTopColor: '#ffe58f', alignItems: 'center' }}>
          <Text style={{ color: '#bfa100', fontSize: 14 }}>This conversation is archived. You cannot send new messages.</Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: selectedImage || "" }}
                style={styles.modalImage}
                resizeMode="contain"
                onLoadStart={handleModalImageLoadStart}
                onLoadEnd={handleModalImageLoadEnd}
              />
              {modalImageLoading && (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Task Details Bottom Sheet */}
      <TaskDetailsBottomSheet
        ref={useRef(null)}
        task={dummyTaskData}
        isVisible={isTaskDetailsModalVisible}
        onClose={() => setIsTaskDetailsModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  iconpressable: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  }
  ,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2eac5f",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Figtree-Bold",
    color: "white",
    letterSpacing: -0.3,
  },
  name: {
    fontSize: 16,
    fontFamily: "Figtree-Bold",
    color: "#000",
    letterSpacing: -0.2,
  },
  status: {
    fontSize: 12,
    fontFamily: "Figtree",
    color: "#8e8e93",
    letterSpacing: -0.1,
  },
  headerButton: {
    padding: 8,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 4,
  },
  messageContainer: {
    marginVertical: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  groupedMessage: {
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 2,
  },
  imageBubble: {
    padding: 4,
    backgroundColor: "transparent",
    borderRadius: 16,
    overflow: "hidden",
  },
  myBubble: {
    backgroundColor: "#2eac5f",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#f0f0f0",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  rejectedBubble: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Figtree",
    color: "#000",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  myMessageText: {
    color: "#fff",
    fontFamily: "Figtree",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    fontFamily: "Figtree",
    color: "#8e8e93",
    letterSpacing: -0.1,
  },
  messageStatus: {
    fontSize: 11,
    fontFamily: "Figtree",
    color: "#8e8e93",
    marginLeft: 4,
    letterSpacing: -0.1,
  },
  messageStatusRead: {
    color: "#2eac5f",
    fontFamily: "Figtree-Medium",
  },
  onlineStatus: {
    color: "#2eac5f",
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2eac5f",
    opacity: 0.6,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
    gap: 8,
  },
  attachButton: {
    padding: 8,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: "Figtree",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: "#2eac5f",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "90%",
    height: "90%",
    borderRadius: 12,
  },
  modalLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(245, 245, 245, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  loadingContainer: {
    padding: 10,
    alignItems: "center",
  },
  messageGroup: {
    marginBottom: 8,
    maxWidth: "80%",
  },
  myMessageGroup: {
    alignSelf: "flex-end",
  },
  otherMessageGroup: {
    alignSelf: "flex-start",
  },
  lastMyBubble: {
    borderBottomRightRadius: 20,
  },
  lastOtherBubble: {
    borderBottomLeftRadius: 20,
  },
  uploadingText: {
    marginTop: 4,
    fontSize: 12,
    color: "#2eac5f",
    fontFamily: "Figtree",
    textAlign: "center",
  },
  taskCard: {
    marginTop: 60, // below status bar
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2eac5f',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  taskStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taskStatusLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
    color: '#2eac5f',
  },
  taskStatus_open: {
    color: '#2eac5f',
  },
  taskStatus_completed: {
    color: '#1890ff',
  },
  taskStatus_pending: {
    color: '#faad14',
  },
  taskStatus_cancelled: {
    color: '#ff4d4f',
  },
});
