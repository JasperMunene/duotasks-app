// hooks/useSocketNotifications.ts
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Update path if needed
import { useConversations } from '../context/ConversationContext';
import { useNotification } from "../context/NotificationContext"; // Update path if needed
import { useSocket } from "../context/SocketContext"; // Update path if needed

export function useSocketNotifications() {
  const { showNotification } = useNotification();
  const { socket, connect, disconnect } = useSocket();
  const { user, isAuthenticated, updateProfile } = useAuth(); // Get isAuthenticated
  const { refreshConversations } = useConversations();

  // Effect to manage socket connection/disconnection based on authentication
  useEffect(() => { 
    if (isAuthenticated && user?.id) {
      // Connect only if authenticated and not already connected
      if (!socket?.connected) {
        connect(user.id);
      }
    } else {
      // Disconnect if not authenticated
      disconnect();
    }
  }, [isAuthenticated, user?.id, connect, disconnect]);

  // Effect to set up and tear down notification listeners
  useEffect(() => {
    if (!socket || !isAuthenticated) { // Only set up listener if authenticated and socket exists
      return;
    }

    const handleNewNotification = (data: {
      notification_id: string;
      user_id: string;
      user_data: any;
      message: string;
      source: string;
    }) => {
      if (data.source === "chat") {
        updateProfile({
          messages_count: (user?.messages_count ?? 0) + 1,
        });
        showNotification({
          title: data.user_data.name || "Notification",
          message: "sent you a message",
          image: data.user_data?.profile_url || undefined,
          route: "/(tabs)/messages",
        });
        refreshConversations();
      } else {
        console.log("General notification received:", data);
        updateProfile({
          notifications_count: (user?.notifications_count ?? 0) + 1,
        });
        showNotification({
          title: data.source || "Notification",
          message: data.message,
          image: data.user_data?.profile_url || undefined,
          route: "/(screens)/notifications",
        });
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, isAuthenticated, user, showNotification, updateProfile, refreshConversations]);
}
