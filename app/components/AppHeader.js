import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from "react-native";


export default function AppHeader() { 
    const router = useRouter();
    return(
        <View style={styles.header}>
            <Image
                source={require("../../assets/images/full.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            <View style={styles.rightContainer}>
                <View style={styles.notificationContainer}>
                    <Ionicons name="notifications-outline" size={28} color="#333" onPress={() => router.push(`/(tabs)/post`)}/>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>2</Text>
                    </View>
                </View>
                <Image
                  source={{ uri: "https://i.pinimg.com/736x/e5/26/0a/e5260a1172148958c975a3c4810d65f2.jpg" }}
                  style={styles.profil_pic}
                  resizeMode="contain"
                />
            </View>
          </View>
    );
}

const styles = StyleSheet.create(
    {
        header: {
            flexDirection: "row",
            position: "absolute",
            top: 0,
            width: "100%",
            height: "17%",
            backgroundColor: 'transparent',
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
            paddingVertical: 10,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          },
          logo: {
            width: '35%',
            marginLeft: '-5%',
          },
          rightContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          },
          notificationContainer: {
            padding: 8,
            position: 'relative',
          },
          badge: {
            position: 'absolute',
            right: 4,
            top: 4,
            backgroundColor: '#2eac5f',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center'
          },
          badgeText: {
            color: '#FFF',
            fontSize: 12,
            fontWeight: 'bold',
          },
          profil_pic: {
            width: 45,
            height: 45,
            borderRadius: 999, // Makes it circular
            borderWidth: 2,
            borderColor: "#ffd33d",
          },
    }
)