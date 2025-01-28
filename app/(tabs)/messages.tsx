// app/index.jsx
import { StyleSheet, View } from "react-native";
import CustomTabButtons from '../components/CustomTabButtons';
import Messages from '../components/Messages';

export default function MessagesPage() {
  return (
    <View style={styles.container}>
      <Messages />
      <CustomTabButtons />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
