// app/index.jsx
import { StyleSheet, View } from "react-native";
import CustomTabButtons from '../components/CustomTabButtons';
import HomeScreen from '../components/HomeScreen';
export default function HomePage() {
  return (
    <View style={styles.container}>
      <HomeScreen />
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
