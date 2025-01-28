import { useEffect, useRef } from 'react';
import { useConversations } from '../context/ConversationContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
export const useTyping = () => {
  const { selectedConversation } = useConversations();
  const {socket} = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    // Get socket instance from window or context if available
    // This assumes the socket is accessible globally or you can modify to get it from context
  }, []);

  const startTyping = () => {
    if (!socket || !selectedConversation || !user) return;
    
    socket.emit('typing', {
      conversation_id: selectedConversation.id,
      user_id: user.id,
      is_typing: true,
    });
  };

  const stopTyping = () => {
    if (!socket || !selectedConversation || !user) return;
    
    socket.emit('typing', {
      conversation_id: selectedConversation.id,
      user_id: user.id,
      is_typing: false,
    });
  };

  return { startTyping, stopTyping };
};