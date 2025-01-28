import ChatScreen from '@/app/components/ChatScreen';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function ChatPage() {
  const { 
    id, 
    recipientId,
    recipientName,
    recipientAvatar,
    recipientStatus,
    recipientLastSeen,
    messages // this is a string (JSON) or undefined
  } = useLocalSearchParams();

  // parse messages if available
  let parsedMessages;
  try {
    parsedMessages = messages ? JSON.parse(messages) : undefined;
  } catch (error) {
    console.warn("Failed to parse messages JSON:", error);
    parsedMessages = undefined;
  }

  return (
    <View style={styles.container}>
      <ChatScreen 
        chatId={id as string} 
        recipientId={recipientId as string}
        recipientName={recipientName as string}
        recipientAvatar={recipientAvatar as string}
        recipientStatus={recipientStatus as string}
        recipientLastSeen={recipientLastSeen as string}
        messages={parsedMessages}  // now an array of objects or undefined
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
