import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { useAuth } from "./AuthContext";
import { useSocketNotification } from "./NotificationContext";
import { useSocket } from "./SocketContext";

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  text?: string;
  image?: string; // Base64 encoded image or image URL
  time: string;
  status: string;
  sent: boolean;
}

interface Recipient {
  user_id: number;
  name: string;
  avatar: string;
  status: string;
  last_seen: string;
}

interface Conversation {
  id: number;
  task_giver: number;
  task_doer: number;
  recipient: Recipient;
  messages: Message[];
  last_msg_id: number;
  lastMessage: string;
  time: string;
  status: string;
  last_seen: string;
  unread: boolean;
  isTyping?: boolean;
  messageStatus?: string;
  archived?: boolean;
  task?: {
    title?: string;
    description?: string;
    status?: string;
    [key: string]: any;
  };
}

interface ConversationContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void; // ✅ Add this
  selectConversation: (conversationId: number) => void;
  refreshConversations: () => Promise<void>;
  sendMessage: (conversationId: number, text: string) => void;
  sendImage: (
    conversationId: number,
    imageData: string,
    imageType?: string
  ) => void;
  updateMessageStatus: (
    messageId: number,
    chatId: number,
    status: string
  ) => void;
  isConnected: boolean;
  onlineUsers: number[];
  emitTyping: (
    conversationId: number,
    recieverId: number,
    isTyping: boolean
  ) => void;
}


const ConversationContext = createContext<ConversationContextType | null>(null);

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, accessToken, updateProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { socket } = useSocket();
  const { showNotification } = useSocketNotification();

  // Memoize the refresh function to prevent unnecessary re-creation
  const refreshConversations = useCallback(async () => {
    if (!user || !accessToken) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversations/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      const formattedConversations = data.map((convo: any) => ({
        id: convo.id,
        task_giver: convo.task_giver,
        task_doer: convo.task_doer,
        recipient: {
          user_id: convo.recipient.user_id,
          name: convo.recipient.name,
          avatar: convo.recipient.avatar || convo.recipient.avator,
          status: convo.recipient.status,
          last_seen: convo.recipient.last_seen,
        },
        messages: (convo.messages || []).map((msg: any) => ({
          ...msg,
        })),
        lastMessage: convo.lastMessage || "No messages yet",
        time: convo.time,
        status: convo.status,
        last_seen: convo.last_seen,
        last_msg_id: convo.last_msg_id,
        unread: convo.unread || false,
        isTyping: false,
        messageStatus: convo.messageStatus || "sent",
        archived: convo.archived || false,
        task: convo.task || undefined,
      }));

      setConversations(formattedConversations);

      // Calculate total unread messages and update AuthContext
      const totalUnreadMessages = formattedConversations.filter((convo: Conversation) => convo.unread).length;
      updateProfile({ messages_count: totalUnreadMessages });

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, [user?.id, accessToken, updateProfile]);

  // Memoize other functions that depend on socket or user
  const markMessageAsRead = useCallback((messageId: number, conversationId: number) => {
    if (!socket) return;

    socket.emit("message_status", {
      conversation_id: conversationId,
      message_id: messageId,
      status: "read",
    });
  }, [socket]);

  const markConversationAsRead = useCallback((conversationId: number) => {
    if (!socket) return;

    socket.emit("mark_conversation_read", { conversation_id: conversationId });

    // Update local state and AuthContext
    setConversations((prevConversations) => {
      const updated = prevConversations.map((convo) => {
        if (convo.id === conversationId && convo.unread) {
          updateProfile({ messages_count: (user?.messages_count ?? 0) - 1 });
          return { ...convo, unread: false };
        }
        return convo;
      });
      return updated;
    });
  }, [socket, user?.messages_count, updateProfile]);

  // Memoize handleNewMessage to prevent recreation on every render
  const handleNewMessage = useCallback((messageData: Message, conversationId: number) => {
    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.map((convo) => {
        if (convo.id === conversationId) {
          // Check if message already exists to prevent duplicates
          const messageExists = convo.messages.some(
            (msg) => msg.message_id === messageData.message_id
          );

          if (messageExists) {
            return convo;
          }

          const lastMessagePreview = messageData.image
            ? "📷 Image"
            : messageData.text || "";

          const wasUnread = convo.unread;
          const shouldMarkUnread = messageData.sender_id !== Number(user?.id);

          const updatedConvo = {
            ...convo,
            messages: [...convo.messages, messageData],
            lastMessage: lastMessagePreview,
            time: messageData.time,
            last_msg_id: messageData.message_id,
            unread: shouldMarkUnread ? true : convo.unread,
          };

          // Update AuthContext's messages_count if a new unread message arrives
          if (shouldMarkUnread && !wasUnread) {
            updateProfile({ messages_count: (user?.messages_count ?? 0) + 1 });
          }

          // Notify user if the new message is for a conversation that is NOT currently selected
          if (
            shouldMarkUnread &&
            (!selectedConversation || selectedConversation.id !== convo.id)
          ) {
            showNotification({
              title: convo.recipient.name,
              message: messageData.text || "📷 Image",
              image: convo.recipient.avatar,
              route: undefined, // Optionally, set a route to navigate to the chat
            });
          }

          if (selectedConversation?.id === convo.id) {
            setSelectedConversation(updatedConvo);
            if (messageData.sender_id !== Number(user?.id)) {
              markMessageAsRead(messageData.message_id, convo.id);
            }
          }

          return updatedConvo;
        }
        return convo;
      });

      // Sort conversations by latest message time (most recent first)
      return updatedConversations.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    });
  }, [user?.id, selectedConversation?.id, updateProfile, markMessageAsRead, showNotification]);

  const updateMessageStatus = useCallback((
    messageId: number,
    chatId: number,
    status: string
  ) => {
    console.log("new message status")
    setConversations((prevConversations) => {
      return prevConversations.map((convo) => {
        if (convo.id === chatId) {
          const updatedMessages = convo.messages.map((msg) =>
            msg.message_id === messageId ? { ...msg, status } : msg
          );
          const updatedConvo = { ...convo, messages: updatedMessages };

          if (selectedConversation?.id === chatId) {
            setSelectedConversation(updatedConvo);
          }

          return updatedConvo;
        }
        return convo;
      });
    });
  }, [selectedConversation?.id]);

  const updateTypingStatus = useCallback((
    conversationId: number,
    userId: number,
    isTyping: boolean
  ) => {
    if (userId === Number(user?.id)) return; // Don't show own typing status

    setConversations((prevConversations) => {
      return prevConversations.map((convo) => {
        if (convo.id === conversationId) {
          const updatedConvo = { ...convo, isTyping };

          if (selectedConversation?.id === conversationId) {
            setSelectedConversation(updatedConvo);
          }

          return updatedConvo;
        }
        return convo;
      });
    });
  }, [user?.id, selectedConversation?.id]);

  const updateUserOnlineStatus = useCallback((userId: number, status: string) => {
    setConversations((prevConversations) => {
      return prevConversations.map((convo) => {
        if (convo.recipient.user_id === userId) {
          const updatedConvo = {
            ...convo,
            recipient: {
              ...convo.recipient,
              status: status,
              last_seen: status === "offline"
                ? new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString() // add +3 hours
                : convo.recipient.last_seen,
            },
          };


          if (selectedConversation?.id === convo.id) {
            setSelectedConversation(updatedConvo);
          }

          return updatedConvo;
        }
        return convo;
      });
    });
  }, [selectedConversation?.id]);

  // Only initialize conversations once when user and accessToken are available
  useEffect(() => {
    if (user && accessToken && !isInitialized) {
      refreshConversations();
    }
  }, [user, accessToken, isInitialized, refreshConversations]);

  // Set up socket listeners
  useEffect(() => {
    if (user && accessToken && socket) {
      // Listen for incoming messages (text or image)
      socket.on(
        "receive_message",
        (data: {
          conversation_id: number;
          message_id: number;
          message?: string;
          image?: string;
          sender_id: number;
          time: string;
        }) => {
          const originalTime = new Date(data.time);
          const adjustedTime = new Date(originalTime.getTime() + 3 * 60 * 60 * 1000); // add 3 hours

          handleNewMessage(
            {
              message_id: data.message_id,
              sender_id: data.sender_id,
              receiver_id: Number(user.id),
              text: data.message,
              image: data.image,
              time: adjustedTime.toISOString(),
              status: "delivered",
              sent: true,
            },
            data.conversation_id
          );
        }
      );

      // Listen for message sent confirmation
      socket.on(
        "message_sent",
        (data: {
          conversation_id: number;
          message_id: number;
          status: string;
          success: boolean;
        }) => {
          if (data.success) {
            updateMessageStatus(
              data.message_id,
              data.conversation_id,
              data.status
            );
          }
        }
      );

      // Listen for message status updates
      socket.on(
        "message_status_update",
        (data: {
          conversation_id: number;
          message_id: number;
          status: string;
        }) => {
          updateMessageStatus(
            data.message_id,
            data.conversation_id,
            data.status
          );
        }
      );

      // Listen for typing indicators
      socket.on(
        "typing_indicator",
        (data: {
          conversation_id: number;
          user_id: number;
          is_typing: boolean;
        }) => {
          updateTypingStatus(
            data.conversation_id,
            data.user_id,
            data.is_typing
          );
        }
      );

      // Listen for user connection status
      socket.on("user_connected", (data: { user_id: number }) => {
        console.log("User connected:", data);
        setOnlineUsers((prev) => [
          ...prev.filter((id) => id !== data.user_id),
          data.user_id,
        ]);
        updateUserOnlineStatus(data.user_id, "online");
      });

      socket.on("user_disconnected", (data: { user_id: number }) => {
        console.log("User disconnected:", data);
        setOnlineUsers((prev) => prev.filter((id) => id !== data.user_id));
        updateUserOnlineStatus(data.user_id, "offline");
      });

      // Cleanup listeners on unmount
      return () => {
        socket.off("receive_message");
        socket.off("message_sent");
        socket.off("message_status_update");
        socket.off("typing_indicator");
        socket.off("user_connected");
        socket.off("user_disconnected");
      };
    }
  }, [user, accessToken, socket, handleNewMessage, updateMessageStatus, updateTypingStatus, updateUserOnlineStatus]);

  const selectConversation = useCallback((conversationId: number) => {
    const convo = conversations.find((c) => c.id === conversationId) || null;
    setSelectedConversation(convo);

    // Mark all unread messages as read when selecting conversation
    if (convo && convo.unread) {
      // Mark conversation as read first, which also updates local state and AuthContext
      markConversationAsRead(conversationId);
    }
  }, [conversations, markConversationAsRead]);

  const sendMessage = useCallback((conversationId: number, text: string) => {
    if (!socket || !user) return;

    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      message_id: Date.now(), // Temporary ID
      sender_id: Number(user.id),
      receiver_id: conversation.recipient.user_id,
      text: text,
      time: new Date().toISOString(),
      status: "sending",
      sent: true,
    };

    // Update UI immediately with optimistic message
    updateConversationWithNewMessage(
      conversationId,
      optimisticMessage,
      `You: ${text}`
    );

    // Send message via socket
    const messageData = {
      conversation_id: conversationId,
      receiver_id: conversation.recipient.user_id,
      message: text,
    };

    socket.emit("send_message", messageData);
    console.log("Message sent:", messageData);
  }, [socket, user, conversations]);

  const sendImage = useCallback((
    conversationId: number,
    imageData: string,
    imageType: string = "image/jpeg"
  ) => {
    if (!socket || !user) return;

    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      message_id: Date.now(), // Temporary ID
      sender_id: Number(user.id),
      receiver_id: conversation.recipient.user_id,
      image: imageData,
      time: new Date().toISOString(),
      status: "sending",
      sent: true,
    };

    // Update UI immediately with optimistic message
    updateConversationWithNewMessage(
      conversationId,
      optimisticMessage,
      "You: 📷 Image"
    );

    // Send image via socket - using same 'send_message' event with image field
    const imageMessageData = {
      conversation_id: conversationId,
      receiver_id: conversation.recipient.user_id,
      image_url: imageData,
      image_type: imageType,
    };

    socket.emit("send_message", imageMessageData);
  }, [socket, user, conversations]);

  const updateConversationWithNewMessage = useCallback((
    conversationId: number,
    message: Message,
    lastMessagePreview: string
  ) => {
    setConversations((prevConversations) => {
      return prevConversations.map((convo) => {
        if (convo.id === conversationId) {
          const updatedConvo = {
            ...convo,
            messages: [...convo.messages, message],
            lastMessage: lastMessagePreview,
            time: message.time,
          };

          if (selectedConversation?.id === conversationId) {
            setSelectedConversation(updatedConvo);
          }

          return updatedConvo;
        }
        return convo;
      });
    });
  }, [selectedConversation?.id]);

  const emitTyping = useCallback((
    conversationId: number,
    recieverId: number,
    isTyping: boolean
  ) => {
    if (!socket || !user) return;

    socket.emit("typing", {
      conversation_id: conversationId,
      reciever_id: recieverId,
      is_typing: isTyping,
    });
  }, [socket, user]);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        selectedConversation,
        setSelectedConversation,
        selectConversation,
        refreshConversations,
        sendMessage,
        sendImage,
        updateMessageStatus,
        isConnected,
        onlineUsers,
        emitTyping,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversations must be used within a ConversationProvider"
    );
  }
  return context;
};